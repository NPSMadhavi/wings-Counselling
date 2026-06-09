import "./env";
import type { Express } from "express";
import OpenAI from "openai";
import { createRequire } from "module";
import { storage } from "./storage";
import { sendMcqInviteEmail, sendMcqResultEmail, sendApplicationStatusUpdate } from "./email";
import { ObjectStorageService } from "./replit_integrations/object_storage/objectStorage";
import type { McqQuestion } from "@shared/schema";

const _require = createRequire(import.meta.url);

interface PdfParserInstance {
  load(buffer: Buffer): Promise<void>;
  getText(): Promise<string>;
}
interface PdfParseModule {
  PDFParse: new (opts: { verbosity: number }) => PdfParserInstance;
}
const pdfParseModule = _require("pdf-parse") as PdfParseModule;

const objectStorage = new ObjectStorageService();

let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  if (!openai) {
    openai = new OpenAI({
      apiKey,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
  }

  return openai;
}

const TOTAL_QUESTIONS = 30;
const MAX_WARNINGS = 5;
const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

/**
 * Returns the pass threshold (out of 30) based on the candidate's years of experience.
 * Experience is stored as a text string in screeningYearsExperience (e.g. "0", "2", "5").
 */
function getPassThreshold(yearsExpText: string | null | undefined): number {
  const years = parseFloat(yearsExpText ?? "0");
  if (isNaN(years) || years === 0) return 20;  // Fresher
  if (years <= 1) return 22;                    // 0–1 Year
  if (years <= 2) return 24;                    // 1–2 Years
  if (years <= 3) return 25;                    // 2–3 Years
  if (years <= 4) return 26;                    // 3–4 Years
  if (years <= 5) return 27;                    // 4–5 Years
  return 28;                                    // 5+ Years
}

interface RawQuestion {
  question: string;
  options: [string, string, string, string];
  correctAnswer: "A" | "B" | "C" | "D";
  category: "technical" | "reasoning" | "aptitude" | "real_world" | "role_specific";
  difficulty: "easy" | "medium" | "hard";
  explanation?: string;
}

interface OpenAIQuestionsResponse {
  questions: RawQuestion[];
}

interface SubmitAnswerItem {
  questionId: number;
  selectedAnswer: string | null;
}

type StorableQuestion = {
  questionOrder: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  category: string;
  difficulty: string;
  explanation?: string;
};

async function downloadResumeText(resumePath: string): Promise<string> {
  try {
    if (!resumePath) return "";
    const normalizedPath = objectStorage.normalizeObjectEntityPath(resumePath);
    const file = await objectStorage.getObjectEntityFile(normalizedPath);
    const [buffer] = await file.download();
    const parser = new pdfParseModule.PDFParse({ verbosity: -1 });
    await parser.load(buffer);
    const text = await parser.getText();
    return typeof text === "string" ? text.substring(0, 6000) : "";
  } catch {
    return "";
  }
}

function buildScreeningText(application: Record<string, unknown>): string {
  const fields: [string, unknown][] = [
    ["Years of Experience", application.screeningYearsExperience],
    ["Education", application.screeningEducationalQualification],
    ["Current Location", application.screeningCurrentLocation],
    ["Current CTC", application.screeningCurrentCtc],
    ["Expected CTC", application.screeningExpectedCtc],
    ["Notice Period", application.screeningNoticePeriod],
  ];
  return fields
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(", ");
}

function getDeterministicPermutation(sessionId: number, questionOrder: number): number[] {
  let seed = (sessionId * 31337 + questionOrder) | 0;
  const lcg = (): number => {
    seed = (seed * 1664525 + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
  const indices = [0, 1, 2, 3];
  for (let i = 3; i > 0; i--) {
    const j = Math.floor(lcg() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

function getShuffledOptions(
  q: McqQuestion,
  sessionId: number
): { optionA: string; optionB: string; optionC: string; optionD: string } {
  const options = [q.optionA, q.optionB, q.optionC, q.optionD];
  const perm = getDeterministicPermutation(sessionId, q.questionOrder);
  const shuffled = perm.map((i) => options[i]);
  return { optionA: shuffled[0], optionB: shuffled[1], optionC: shuffled[2], optionD: shuffled[3] };
}

function getShuffledCorrectLetter(q: McqQuestion, sessionId: number): string {
  const correctIdx = OPTION_LETTERS.indexOf(q.correctAnswer as "A" | "B" | "C" | "D");
  const perm = getDeterministicPermutation(sessionId, q.questionOrder);
  const newCorrectPos = perm.indexOf(correctIdx);
  return OPTION_LETTERS[newCorrectPos];
}

function buildBatchPrompt(
  batchLabel: string,
  distribution: string,
  count: number,
  jobTitle: string,
  jobRequirements: string,
  jobDescription: string,
  resumeText: string,
  coverLetter: string,
  screeningText: string
): string {
  return `You are a senior technical evaluator at Netopsys, an AI and network-operations software company.
Your task: generate exactly ${count} highly personalised MCQs (${batchLabel}) that are a direct reflection of THIS candidate's background, skills, and experience level for the role of ${jobTitle}.

════════════════════════════════════════════
STEP 1 — CANDIDATE ANALYSIS (do this first, internally, before writing any question)
════════════════════════════════════════════
Read the candidate profile below carefully and extract:
A) EXPERIENCE LEVEL
   - Fresher / Entry-level: 0–1 year experience, recent graduate, internships only → questions must test fundamentals and conceptual understanding; avoid deep real-world production scenarios.
   - Mid-level: 2–4 years → questions can test practical application, debugging, and moderate system design.
   - Senior: 5+ years → questions should probe architectural decisions, trade-offs, advanced debugging, and real production situations.
   Use the years of experience, job titles, and projects in the resume to determine the level.

B) SPECIFIC TECH STACK CLAIMED
   List every language, framework, library, tool, database, or platform the candidate explicitly mentions (e.g. Python, React, Django, MySQL, AWS, Docker). Technical and role-specific questions MUST test these exact technologies — not generic ones.

C) DOMAIN / PROJECTS
   Note the types of projects, industries, or problem domains the candidate has worked in. Use these to ground real_world and role_specific scenarios.

════════════════════════════════════════════
CANDIDATE PROFILE
════════════════════════════════════════════
Resume:
${resumeText.substring(0, 3500) || "Not provided"}

Cover Letter:
${coverLetter.substring(0, 800) || "Not provided"}

Screening Answers:
${screeningText || "Not provided"}

════════════════════════════════════════════
JOB CONTEXT
════════════════════════════════════════════
Role: ${jobTitle}
Requirements: ${jobRequirements.substring(0, 1000)}
Description: ${jobDescription.substring(0, 500)}

════════════════════════════════════════════
STEP 2 — QUESTION GENERATION RULES
════════════════════════════════════════════
QUESTION DISTRIBUTION FOR THIS BATCH (${count} questions total):
${distribution}

PERSONALISATION (CRITICAL):
- Every "technical" question must name and test a specific technology from the candidate's own resume (e.g. if they list React, ask about React hooks — not about a framework they never mentioned).
- Every "role_specific" question must reflect a task, project type, or tool the candidate has claimed experience with.
- Every "real_world" question must describe a scenario that maps to the candidate's experience level and domain.
- For FRESHERS: Focus on foundational concepts, common pitfalls in learning, and basic implementation questions. Avoid advanced production/scale topics.
- For EXPERIENCED candidates: Probe trade-offs, debugging strategies, performance issues, and architectural decisions based on what they claim.

QUESTION QUALITY:
- Each question has exactly 4 options (index 0=A, 1=B, 2=C, 3=D).
- "correctAnswer" must be exactly "A", "B", "C", or "D".
- Distractors must be plausible mistakes a real candidate at this experience level might make — never obviously wrong.
- No trivial "what does X stand for" questions. Every question tests applied understanding.
- "difficulty" must match the experience level: freshers → mostly "easy"/"medium"; mid-level → mostly "medium"; senior → mostly "medium"/"hard".
- "difficulty" must be one of: "easy", "medium", "hard".
- "category" must be one of: "technical", "reasoning", "aptitude", "real_world", "role_specific".

CODE FORMATTING: For role_specific and technical questions involving code, embed the code inside the "question" field using a fenced block with language tag (e.g. \`\`\`python ... \`\`\`). Write a short question before the block. Never inline code as text.
Example: "What is the output of the following snippet?\\n\`\`\`javascript\\nconst x = [1,2,3].map(n => n * 2);\\nconsole.log(x[1]);\\n\`\`\`"

════════════════════════════════════════════
ACCURACY & SELF-VERIFICATION (MANDATORY — apply to EVERY question before outputting)
════════════════════════════════════════════
Follow this exact verification process for EACH question you generate:

1. CODE OUTPUT QUESTIONS: Before writing any options, trace through the code line-by-line in your internal reasoning. Write the exact output in the "explanation" field first. Then set that output as the correct option. Keep code snippets short (≤10 lines) and unambiguous — no undefined behaviour, no version-specific quirks unless the question is explicitly about them. If you cannot confidently trace the output, choose a different snippet.

2. NUMERICAL / APTITUDE QUESTIONS: Compute the answer step-by-step before writing options. The correct option must exactly match your computed result. Show the working in the "explanation" field. If you cannot verify, choose a different question.

3. CONCEPTUAL / TECHNICAL QUESTIONS: Verify from your training knowledge that the correct answer is definitively and unambiguously true. If the answer depends on framework version, environment, configuration, or platform, either rephrase to specify the version/context explicitly, or choose a different question topic.

4. SELF-CHECK before finalising each question: re-read the question and ask — "Is there exactly ONE option that a qualified expert would agree is correct? Are the other three options clearly wrong (not just less preferred)?" If the answer is no, revise or replace the question.

5. CONFIDENCE RULE: If you are less than 95% confident that correctAnswer is accurate, do NOT include that question. Replace it with a different topic you are fully certain about. Wrong questions damage candidate trust and the company's credibility.

6. OPTIONS CONSISTENCY: Each option must be grammatically and logically consistent with the question stem. Options must not overlap with each other (no two options should both be "partially correct"). The correct option text must be factually accurate — not just "more correct" than the others.

════════════════════════════════════════════
STEP 3 — OUTPUT FORMAT
════════════════════════════════════════════
Return JSON: { "questions": [ ...${count} items... ] }
Each item: { "question": "...", "options": ["A text","B text","C text","D text"], "correctAnswer": "A", "category": "technical", "difficulty": "medium", "explanation": "Start with your verification: for code questions state the traced output; for numerical questions show the working; for conceptual questions state the authoritative rule. Then in 1-2 sentences explain why the correct answer is right and why the most tempting wrong answer is wrong." }`;
}

async function callBatch(prompt: string, expectedCount: number, batchLabel: string): Promise<OpenAIQuestionsResponse["questions"]> {
  const client = getOpenAIClient();
  if (!client) {
    throw new Error(
      "AI_INTEGRATIONS_OPENAI_API_KEY is not set. Technical evaluation generation is unavailable in this local environment."
    );
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        max_tokens: 8000,
        response_format: { type: "json_object" },
      });
      const content = response.choices[0]?.message?.content ?? "";
      let questions: OpenAIQuestionsResponse["questions"];
      try {
        const parsed = JSON.parse(content) as OpenAIQuestionsResponse;
        questions = parsed.questions;
      } catch {
        const match = content.match(/"questions"\s*:\s*(\[[\s\S]*)/);
        if (match) {
          let fragment = match[1];
          const lastBrace = fragment.lastIndexOf("}");
          if (lastBrace !== -1) {
            fragment = fragment.substring(0, lastBrace + 1) + "]";
            const rescued = JSON.parse(fragment) as OpenAIQuestionsResponse["questions"];
            questions = rescued;
          } else {
            throw new Error("No complete objects found in truncated JSON");
          }
        } else {
          throw new Error(`JSON parse failed for batch ${batchLabel}`);
        }
      }
      if (!Array.isArray(questions) || questions.length < expectedCount) {
        throw new Error(`Batch ${batchLabel}: expected ${expectedCount}, got ${questions?.length ?? 0}`);
      }
      return questions.slice(0, expectedCount);
    } catch (err) {
      lastError = err;
      console.error(`Batch ${batchLabel} attempt ${attempt} failed:`, err);
      if (attempt < 3) await new Promise(r => setTimeout(r, 1500));
    }
  }
  throw lastError ?? new Error(`Batch ${batchLabel} failed after 3 attempts`);
}

async function generateMcqQuestions(
  jobTitle: string,
  jobRequirements: string,
  jobDescription: string,
  resumeText: string,
  coverLetter: string,
  screeningText: string
): Promise<StorableQuestion[]> {
  // New distribution: technical(8), reasoning(3), aptitude(3), real_world(8), role_specific(8) = 30
  // Split into two parallel batches of 15 to avoid token-limit truncation
  const promptA = buildBatchPrompt(
    "Part A of 2",
    `1. "technical" — 8 questions: Core concepts tied to job requirements and claimed skills. Test real depth.\n2. "real_world" — 4 questions: Practical workplace scenarios specific to this role.\n3. "role_specific" — 3 questions: Dev: code debugging/algorithm/output prediction. QA: test case design/unit testing. Network/ops: networking/troubleshooting.\nOrder: 8 technical, 4 real_world, 3 role_specific.`,
    15, jobTitle, jobRequirements, jobDescription, resumeText, coverLetter, screeningText
  );
  const promptB = buildBatchPrompt(
    "Part B of 2",
    `1. "reasoning" — 3 questions: Logical reasoning, pattern recognition, critical thinking.\n2. "aptitude" — 3 questions: Numerical aptitude, data interpretation, verbal reasoning.\n3. "real_world" — 4 questions: Practical workplace scenarios specific to this role (different from Part A).\n4. "role_specific" — 5 questions: Dev: code debugging/algorithm/output prediction. QA: test case design/unit testing. Network/ops: networking/troubleshooting (different from Part A).\nOrder: 3 reasoning, 3 aptitude, 4 real_world, 5 role_specific.`,
    15, jobTitle, jobRequirements, jobDescription, resumeText, coverLetter, screeningText
  );

  const [batchA, batchB] = await Promise.all([
    callBatch(promptA, 15, "A"),
    callBatch(promptB, 15, "B"),
  ]);

  // Combine and shuffle so aptitude/reasoning are interspersed, not sequential
  const combined = [...batchA, ...batchB];
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }

  return combined.map((q, idx) => {
    const correctIdx = OPTION_LETTERS.indexOf(
      q.correctAnswer.toUpperCase() as "A" | "B" | "C" | "D"
    );
    if (correctIdx === -1) {
      throw new Error(`Invalid correctAnswer "${q.correctAnswer}" in question ${idx + 1}`);
    }
    return {
      questionOrder: idx + 1,
      questionText: q.question,
      optionA: q.options[0],
      optionB: q.options[1],
      optionC: q.options[2],
      optionD: q.options[3],
      correctAnswer: OPTION_LETTERS[correctIdx],
      category: q.category,
      difficulty: q.difficulty ?? "medium",
      explanation: q.explanation ?? "",
    };
  });
}

async function performSubmit(
  session: { id: number; applicationId: number; jobId: number; userId: number; warningCount: number; passThreshold: number; startedAt?: Date | null; expiresAt?: Date | null; submittedAt?: Date | null },
  answers: SubmitAnswerItem[],
  autoSubmitted: boolean,
  autoSubmitReason?: "timer_expired" | "max_warnings"
): Promise<{ score: number; passed: boolean }> {
  const questions = await storage.getMcqQuestions(session.id);
  let score = 0;
  const answerMap = new Map<number, string | null>(
    answers.map((a) => [a.questionId, a.selectedAnswer])
  );

  const fullAnswers: Array<SubmitAnswerItem & { isCorrect: boolean }> = questions.map((q) => {
    const selectedAnswer = answerMap.get(q.id) ?? null;
    const shuffledCorrect = getShuffledCorrectLetter(q, session.id);
    const isCorrect = !!(selectedAnswer && selectedAnswer === shuffledCorrect);
    if (isCorrect) score++;
    return { questionId: q.id, selectedAnswer, isCorrect };
  });

  const passed = score >= session.passThreshold;
  await storage.submitMcqSession(session.id, fullAnswers, score, passed, autoSubmitted);

  const [user, application, job] = await Promise.all([
    storage.getUser(session.userId),
    storage.getJobApplication(session.applicationId),
    storage.getJobPosting(session.jobId),
  ]);

  const newStatus = passed ? "Round 1 Selected" : "Round 1 Not Selected";

  const submittedAt = new Date();
  const startedAt = session.startedAt ?? null;
  const timeTakenMins = startedAt ? Math.round((submittedAt.getTime() - startedAt.getTime()) / 60000) : null;

  if (application) {
    let internalNote: string;
    if (passed) {
      const howSubmitted = !autoSubmitted
        ? "Submitted normally by the candidate."
        : autoSubmitReason === "timer_expired"
          ? "Timer reached zero — test was auto-finalised."
          : "Auto-submitted after 5 proctoring violations.";
      internalNote = `Round 1 technical evaluation cleared — ${score} out of ${TOTAL_QUESTIONS} correct (passing score: ${session.passThreshold}). ${howSubmitted}${timeTakenMins !== null ? ` Time taken: ${timeTakenMins} minute(s).` : ""} Proctoring events recorded: ${session.warningCount}.`;
    } else {
      const howSubmitted = !autoSubmitted
        ? "Candidate submitted before the timer ran out."
        : autoSubmitReason === "timer_expired"
          ? "The 45-minute timer expired. The system auto-finalised the test at the deadline."
          : `Test was auto-submitted after ${session.warningCount} tab-switch/focus violation(s) were detected.`;
      internalNote = `Round 1 technical evaluation did not meet the passing score — ${score} out of ${TOTAL_QUESTIONS} correct (required: ${session.passThreshold}). ${howSubmitted}${timeTakenMins !== null ? ` Time on test: ${timeTakenMins} minute(s).` : ""} Proctoring events recorded: ${session.warningCount}.`;
    }
    await storage.updateApplicationStatus(
      session.applicationId,
      newStatus,
      undefined,
      internalNote,
      passed ? undefined : "Round 1 MCQ"
    );
  }

  if (user && job) {
    sendMcqResultEmail(
      user.email, user.firstName, job.title, job.jobId,
      score, TOTAL_QUESTIONS, passed,
      autoSubmitted, autoSubmitReason ?? null, session.warningCount,
      startedAt, submittedAt
    ).catch(() => {});
    if (!passed) {
      sendApplicationStatusUpdate(user.email, user.firstName, job.title, job.jobId, newStatus).catch(() => {});
    }
  }

  if (application) {
    await storage.createAdminNotification({
      type: "status_update",
      title: `MCQ ${passed ? "Passed" : "Failed"}: ${user?.firstName ?? ""} ${user?.lastName ?? ""}`,
      message: `Score: ${score}/${TOTAL_QUESTIONS} for ${job?.title ?? "Unknown"}. Status → ${newStatus}.`,
      applicationId: session.applicationId,
    });
  }

  return { score, passed };
}

export function registerMcqRoutes(app: Express, isValidAdminSession: (token: string) => boolean): void {

  // ─── Admin: Generate MCQs for an application ───────────────────────────────
  app.post("/api/admin/mcq/generate/:applicationId", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token || !isValidAdminSession(token)) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    try {
      const applicationId = parseInt(req.params.applicationId, 10);
      const application = await storage.getJobApplication(applicationId);
      if (!application) {
        return res.status(404).json({ success: false, message: "Application not found" });
      }
      const [user, job] = await Promise.all([
        storage.getUser(application.userId),
        storage.getJobPosting(application.jobId),
      ]);
      if (!user || !job) {
        return res.status(404).json({ success: false, message: "User or job not found" });
      }

      const resumeText = await downloadResumeText(application.resumePath ?? "");
      const screeningText = buildScreeningText(application as unknown as Record<string, unknown>);

      const questions = await generateMcqQuestions(
        job.title,
        job.requirements,
        job.description,
        resumeText,
        application.coverLetter,
        screeningText
      );

      const passThreshold = getPassThreshold(application.screeningYearsExperience);
      const session = await storage.createMcqSession(applicationId, application.jobId, application.userId, passThreshold);
      const savedQuestions = await storage.saveMcqQuestions(session.id, questions);

      const candidateSlug = `${user.firstName} ${user.lastName}`.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
      const testUrl = `https://netopsys.in/technical-evaluation/${job.jobId}/${applicationId}-${candidateSlug}`;
      // PAUSED: MCQ invite email is temporarily disabled.
      // Admin is manually informing candidates during the initial interview.
      // Re-enable this when AI auto-proctoring / automated Round 1 scheduling is introduced.
      // sendMcqInviteEmail(user.email, user.firstName, job.title, job.jobId, testUrl).catch(() => {});

      await storage.createAdminNotification({
        type: "status_update",
        title: "MCQ Test Generated",
        message: `Technical Evaluation MCQ generated for ${user.firstName} ${user.lastName} — ${job.title}`,
        applicationId,
      });

      res.json({
        success: true,
        session: { id: session.id, status: session.status, generatedAt: session.generatedAt, passThreshold: session.passThreshold },
        questions: savedQuestions.map((q) => ({
          id: q.id,
          questionOrder: q.questionOrder,
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
          category: q.category,
          difficulty: q.difficulty,
        })),
      });
    } catch (error: unknown) {
      console.error("MCQ generate error:", error);
      const msg = error instanceof Error ? error.message : "Failed to generate MCQ questions";
      res.status(500).json({ success: false, message: msg });
    }
  });

  // ─── Admin: Get all MCQ sessions ───────────────────────────────────────────
  app.get("/api/admin/mcq/sessions", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token || !isValidAdminSession(token)) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    try {
      const sessions = await storage.getAllMcqSessions();
      res.json({ success: true, sessions });
    } catch {
      res.status(500).json({ success: false, message: "Failed to fetch sessions" });
    }
  });

  // ─── Admin: Get MCQ session detail for a specific application ─────────────
  app.get("/api/admin/mcq/session/:applicationId", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token || !isValidAdminSession(token)) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    try {
      const applicationId = parseInt(req.params.applicationId, 10);
      const session = await storage.getMcqSession(applicationId);
      if (!session) return res.json({ success: true, session: null });

      const [questions, answers] = await Promise.all([
        storage.getMcqQuestions(session.id),
        storage.getMcqAnswers(session.id),
      ]);
      const answerMap = new Map<number, string | null>(
        answers.map((a) => [a.questionId, a.selectedAnswer])
      );

      res.json({
        success: true,
        session: {
          ...session,
          questions: questions.map((q) => {
            const selectedAnswer = answerMap.get(q.id) ?? null;
            const shuffledCorrect = getShuffledCorrectLetter(q, session.id);
            // Return shuffled options (as the candidate saw them) so that
            // selectedAnswer and shuffledCorrectAnswer letters are consistent
            // with the displayed optionA/B/C/D text in the breakdown view.
            const shuffledOpts = getShuffledOptions(q, session.id);
            return {
              id: q.id,
              questionOrder: q.questionOrder,
              questionText: q.questionText,
              optionA: shuffledOpts.optionA,
              optionB: shuffledOpts.optionB,
              optionC: shuffledOpts.optionC,
              optionD: shuffledOpts.optionD,
              correctAnswer: shuffledCorrect,
              shuffledCorrectAnswer: shuffledCorrect,
              category: q.category,
              difficulty: q.difficulty,
              explanation: q.explanation ?? null,
              selectedAnswer,
              isCorrect: selectedAnswer !== null && selectedAnswer === shuffledCorrect,
            };
          }),
        },
      });
    } catch {
      res.status(500).json({ success: false, message: "Failed to fetch session" });
    }
  });

  // ─── Admin: Send MCQ report email to candidate ──────────────────────────────
  app.post("/api/admin/mcq/report/:applicationId/email", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token || !isValidAdminSession(token)) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    try {
      const applicationId = parseInt(req.params.applicationId, 10);
      const session = await storage.getMcqSession(applicationId);
      if (!session || session.status !== "completed") {
        return res.status(404).json({ success: false, message: "No completed session found" });
      }
      const [questions, answers, application, user, job] = await Promise.all([
        storage.getMcqQuestions(session.id),
        storage.getMcqAnswers(session.id),
        storage.getJobApplication(applicationId),
        storage.getUser(session.userId),
        storage.getJobPosting(session.jobId),
      ]);
      if (!user || !job) return res.status(404).json({ success: false, message: "User or job not found" });

      const answerMap = new Map<number, string | null>(answers.map(a => [a.questionId, a.selectedAnswer]));
      const reportRows = questions.map(q => {
        const selectedAnswer = answerMap.get(q.id) ?? null;
        const shuffledCorrect = getShuffledCorrectLetter(q, session.id);
        const shuffledOpts = getShuffledOptions(q, session.id);
        const isCorrect = !!(selectedAnswer && selectedAnswer === shuffledCorrect);
        const optMap: Record<string, string> = { A: shuffledOpts.optionA, B: shuffledOpts.optionB, C: shuffledOpts.optionC, D: shuffledOpts.optionD };
        return {
          questionOrder: q.questionOrder,
          questionText: q.questionText,
          selectedAnswer,
          selectedText: selectedAnswer ? (optMap[selectedAnswer] ?? "") : "Not answered",
          correctAnswer: shuffledCorrect,
          correctText: optMap[shuffledCorrect] ?? "",
          isCorrect,
          category: q.category,
          explanation: q.explanation ?? "",
        };
      }).sort((a, b) => a.questionOrder - b.questionOrder);

      const { sendMcqReportEmail } = await import("./email.js");
      await sendMcqReportEmail(
        user.email, user.firstName, job.title, job.jobId,
        session.score ?? 0, questions.length, session.passed ?? false,
        reportRows
      );
      res.json({ success: true, message: "Report email sent" });
    } catch (err) {
      console.error("Report email error:", err);
      res.status(500).json({ success: false, message: "Failed to send report email" });
    }
  });

  // ─── Admin: Manually send MCQ invite email to candidate ─────────────────────
  app.post("/api/admin/mcq/invite/:applicationId", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token || !isValidAdminSession(token)) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    try {
      const applicationId = parseInt(req.params.applicationId, 10);
      const application = await storage.getJobApplication(applicationId);
      if (!application) return res.status(404).json({ success: false, message: "Application not found" });

      const user = await storage.getUser(application.userId);
      const job = await storage.getJobPosting(application.jobId);
      if (!user || !job) return res.status(404).json({ success: false, message: "User or job not found" });

      const candidateSlug = `${user.firstName} ${user.lastName}`
        .toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
      const testUrl = `https://netopsys.in/technical-evaluation/${job.jobId}/${applicationId}-${candidateSlug}`;

      await sendMcqInviteEmail(user.email, user.firstName, job.title, job.jobId, testUrl);
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to send MCQ invite email:", err);
      res.status(500).json({ success: false, message: "Failed to send invite email" });
    }
  });

  // ─── Admin: Void a session ──────────────────────────────────────────────────
  app.patch("/api/admin/mcq/sessions/:sessionId/void", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token || !isValidAdminSession(token)) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    try {
      const sessionId = parseInt(req.params.sessionId, 10);
      const session = await storage.voidMcqSession(sessionId);
      if (!session) return res.status(404).json({ success: false, message: "Session not found" });
      res.json({ success: true, session });
    } catch {
      res.status(500).json({ success: false, message: "Failed to void session" });
    }
  });

  // ─── Admin: Override MCQ result (Force Pass / Force Fail) ──────────────────
  app.patch("/api/admin/mcq/override/:applicationId", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token || !isValidAdminSession(token)) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    try {
      const applicationId = parseInt(req.params.applicationId, 10);
      const { overrideType, reason } = req.body as { overrideType: "pass" | "fail"; reason: string };
      if (!overrideType || !reason?.trim()) {
        return res.status(400).json({ success: false, message: "overrideType and reason are required" });
      }
      const application = await storage.getJobApplication(applicationId);
      if (!application) return res.status(404).json({ success: false, message: "Application not found" });

      const passed = overrideType === "pass";
      await storage.overrideMcqResult(applicationId, passed, reason.trim());

      const [user, job] = await Promise.all([
        storage.getUser(application.userId),
        storage.getJobPosting(application.jobId),
      ]);

      if (user && job) {
        const newStatus = passed ? "Round 1 Selected" : "Round 1 Not Selected";
        sendApplicationStatusUpdate(user.email, user.firstName, job.title, job.jobId, newStatus).catch(() => {});
      }

      await storage.createAdminNotification({
        type: "status_update",
        title: `MCQ Override: ${passed ? "Force Passed" : "Force Failed"}`,
        message: `Admin overrode MCQ result for ${user?.firstName ?? ""} ${user?.lastName ?? ""} — ${job?.title ?? ""}. Reason: ${reason.trim()}`,
        applicationId,
      });

      res.json({ success: true, passed, newStatus: passed ? "Round 1 Selected" : "Round 1 Not Selected" });
    } catch (error: unknown) {
      console.error("MCQ override error:", error);
      res.status(500).json({ success: false, message: "Failed to override MCQ result" });
    }
  });

  // ─── Candidate: Get session status + questions with deterministic shuffle ──
  app.get("/api/mcq/session/:applicationId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: "Please log in" });
    }
    try {
      const applicationId = parseInt(req.params.applicationId, 10);
      const application = await storage.getJobApplication(applicationId);
      if (!application || application.userId !== req.session.userId) {
        return res.status(403).json({ success: false, message: "Not authorized" });
      }

      const session = await storage.getMcqSession(applicationId);
      if (!session) return res.json({ success: true, session: null });

      if (session.status === "in_progress" && session.expiresAt && new Date() > session.expiresAt) {
        // Auto-finalize: submit with no answers so the application transitions to pass/fail
        // and is never left stuck in "in_progress" state. performSubmit sets session status to "completed".
        const { score, passed } = await performSubmit(session, [], true, "timer_expired");
        return res.json({
          success: true,
          session: { ...session, status: "completed", score, passed },
          questions: [],
          timedOut: true,
        });
      }

      const questions = await storage.getMcqQuestions(session.id);
      res.json({
        success: true,
        session: {
          id: session.id,
          status: session.status,
          startedAt: session.startedAt,
          expiresAt: session.expiresAt,
          warningCount: session.warningCount,
          totalQuestions: session.totalQuestions,
          passThreshold: session.passThreshold,
          generatedAt: session.generatedAt,
          submittedAt: session.submittedAt,
          score: session.status === "completed" ? session.score : undefined,
          passed: session.status === "completed" ? session.passed : undefined,
        },
        questions: questions.map((q) => {
          const shuffled = getShuffledOptions(q, session.id);
          return {
            id: q.id,
            questionOrder: q.questionOrder,
            questionText: q.questionText,
            optionA: shuffled.optionA,
            optionB: shuffled.optionB,
            optionC: shuffled.optionC,
            optionD: shuffled.optionD,
            category: q.category,
            difficulty: q.difficulty,
          };
        }),
      });
    } catch {
      res.status(500).json({ success: false, message: "Failed to fetch session" });
    }
  });

  // ─── Candidate: Post-submission review (failed sessions only) ───────────────
  app.get("/api/mcq/session/:applicationId/review", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: "Please log in" });
    }
    try {
      const applicationId = parseInt(req.params.applicationId, 10);
      const application = await storage.getJobApplication(applicationId);
      if (!application || application.userId !== req.session.userId) {
        return res.status(403).json({ success: false, message: "Not authorized" });
      }
      const session = await storage.getMcqSession(applicationId);
      if (!session || session.status !== "completed") {
        return res.status(404).json({ success: false, message: "No completed session found" });
      }
      if (session.passed) {
        return res.status(403).json({ success: false, message: "Review is only available for failed attempts" });
      }
      const questions = await storage.getMcqQuestions(session.id);
      const answers = await storage.getMcqAnswers(session.id);
      const answerMap = new Map(answers.map(a => [a.questionId, a]));

      const reviewQuestions = questions.map(q => {
        const shuffled = getShuffledOptions(q, session.id);
        const correctAnswer = getShuffledCorrectLetter(q, session.id);
        const ans = answerMap.get(q.id);
        return {
          id: q.id,
          questionOrder: q.questionOrder,
          questionText: q.questionText,
          optionA: shuffled.optionA,
          optionB: shuffled.optionB,
          optionC: shuffled.optionC,
          optionD: shuffled.optionD,
          category: q.category,
          difficulty: q.difficulty,
          explanation: (q as any).explanation ?? null,
          correctAnswer,
          candidateAnswer: ans?.selectedAnswer ?? null,
          isCorrect: ans?.isCorrect ?? false,
        };
      });

      res.json({ success: true, session: { score: session.score, totalQuestions: session.totalQuestions }, reviewQuestions });
    } catch {
      res.status(500).json({ success: false, message: "Failed to load review" });
    }
  });

  // ─── Candidate: Start the test (server-side timer anchor) ──────────────────
  app.post("/api/mcq/session/:applicationId/start", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: "Please log in" });
    }
    try {
      const applicationId = parseInt(req.params.applicationId, 10);
      const application = await storage.getJobApplication(applicationId);
      if (!application || application.userId !== req.session.userId) {
        return res.status(403).json({ success: false, message: "Not authorized" });
      }

      const session = await storage.getMcqSession(applicationId);
      if (!session) return res.status(404).json({ success: false, message: "Session not found" });
      if (session.status === "completed") {
        return res.status(400).json({ success: false, message: "Test already submitted" });
      }
      if (session.status === "expired" || session.status === "voided") {
        return res.status(400).json({ success: false, message: "Test session is no longer valid" });
      }
      if (session.status === "in_progress" && session.expiresAt && new Date() > session.expiresAt) {
        await storage.expireMcqSession(session.id);
        return res.status(400).json({ success: false, message: "Test session has expired" });
      }

      let activeSession = session;
      if (session.status === "pending") {
        const started = await storage.startMcqSession(session.id);
        if (!started) return res.status(500).json({ success: false, message: "Failed to start session" });
        activeSession = started;
      }

      res.json({
        success: true,
        session: {
          id: activeSession.id,
          status: activeSession.status,
          startedAt: activeSession.startedAt,
          expiresAt: activeSession.expiresAt,
          warningCount: activeSession.warningCount,
          totalQuestions: activeSession.totalQuestions,
        },
      });
    } catch (error: unknown) {
      console.error("Start MCQ error:", error);
      res.status(500).json({ success: false, message: "Failed to start test" });
    }
  });

  // ─── Candidate: Report a proctoring warning ────────────────────────────────
  // Body: { warningType?: string, answers?: Array<{questionId, selectedAnswer}> }
  // When auto-submit is triggered, candidate's current answers are used so scoring is fair.
  app.post("/api/mcq/session/:applicationId/warning", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: "Please log in" });
    }
    try {
      const applicationId = parseInt(req.params.applicationId, 10);
      const application = await storage.getJobApplication(applicationId);
      if (!application || application.userId !== req.session.userId) {
        return res.status(403).json({ success: false, message: "Not authorized" });
      }

      const session = await storage.getMcqSession(applicationId);
      if (!session || session.status !== "in_progress") {
        return res.json({ success: true, autoSubmit: false, warningCount: 0 });
      }

      const currentAnswers: SubmitAnswerItem[] = Array.isArray(req.body?.answers)
        ? (req.body.answers as Array<{ questionId: number; selectedAnswer: string | null }>).map(
            (a) => ({ questionId: Number(a.questionId), selectedAnswer: typeof a.selectedAnswer === "string" ? a.selectedAnswer : null })
          )
        : [];

      if (session.expiresAt && new Date() > session.expiresAt) {
        const { score, passed } = await performSubmit(session, currentAnswers, true, "timer_expired");
        return res.json({ success: true, warningCount: session.warningCount, autoSubmit: true, timedOut: true, maxWarnings: MAX_WARNINGS, score, passed, totalQuestions: TOTAL_QUESTIONS });
      }

      const updated = await storage.recordWarning(session.id);
      const newCount = updated?.warningCount ?? session.warningCount + 1;

      if (newCount >= MAX_WARNINGS) {
        const { score, passed } = await performSubmit(updated ?? session, currentAnswers, true, "max_warnings");
        return res.json({ success: true, warningCount: newCount, autoSubmit: true, maxWarnings: MAX_WARNINGS, score, passed, totalQuestions: TOTAL_QUESTIONS });
      }

      res.json({ success: true, warningCount: newCount, autoSubmit: false, maxWarnings: MAX_WARNINGS });
    } catch (error: unknown) {
      console.error("Warning MCQ error:", error);
      res.status(500).json({ success: false, message: "Failed to record warning" });
    }
  });

  // ─── Candidate: Submit the test ────────────────────────────────────────────
  app.post("/api/mcq/session/:applicationId/submit", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: "Please log in" });
    }
    try {
      const applicationId = parseInt(req.params.applicationId, 10);
      const application = await storage.getJobApplication(applicationId);
      if (!application || application.userId !== req.session.userId) {
        return res.status(403).json({ success: false, message: "Not authorized" });
      }

      const session = await storage.getMcqSession(applicationId);
      if (!session) return res.status(404).json({ success: false, message: "Session not found" });
      if (session.status === "completed") {
        return res.status(400).json({ success: false, message: "Test already submitted" });
      }
      if (session.status !== "in_progress") {
        return res.status(400).json({ success: false, message: "Test session is not active" });
      }

      const now = new Date();
      const timedOut = Boolean(session.expiresAt && now > session.expiresAt);

      // Hard server-side timer enforcement: if expired, do not accept client answers.
      // Auto-submit with empty answers to ensure session is finalized with an accurate score.
      if (timedOut) {
        const { score, passed } = await performSubmit(session, [], true, "timer_expired");
        return res.json({
          success: true,
          score,
          totalQuestions: TOTAL_QUESTIONS,
          passed,
          passThreshold: session.passThreshold,
          timedOut: true,
          newStatus: passed ? "Round 1 Selected" : "Round 1 Not Selected",
        });
      }

      const { answers, autoSubmitted = false } = req.body as {
        answers: Array<{ questionId: number; selectedAnswer: string | null }>;
        autoSubmitted?: boolean;
      };
      if (!Array.isArray(answers)) {
        return res.status(400).json({ success: false, message: "Answers array is required" });
      }

      const typedAnswers: SubmitAnswerItem[] = answers.map((a) => ({
        questionId: Number(a.questionId),
        selectedAnswer: typeof a.selectedAnswer === "string" ? a.selectedAnswer : null,
      }));

      const { score, passed } = await performSubmit(session, typedAnswers, Boolean(autoSubmitted));

      res.json({
        success: true,
        score,
        totalQuestions: TOTAL_QUESTIONS,
        passed,
        passThreshold: session.passThreshold,
        newStatus: passed ? "Round 1 Selected" : "Round 1 Not Selected",
      });
    } catch (error: unknown) {
      console.error("Submit MCQ error:", error);
      res.status(500).json({ success: false, message: "Failed to submit test" });
    }
  });
}
