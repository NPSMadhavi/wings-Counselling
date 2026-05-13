import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ddb as db, candidates, jobApplications, careers, interviewSlots } from "../config/db.js";
import { eq } from "drizzle-orm";

const router = Router();

const CANDIDATE_SECRET =
  process.env.CANDIDATE_JWT_SECRET ?? "wings-candidate-secret-2025";

function candidateToken(id, email) {
  return jwt.sign(
    { id, email, role: "candidate" },
    CANDIDATE_SECRET,
    { expiresIn: "30d" }
  );
}

/* ─── Auth Middleware ─────────────────────────────────────────────── */
export function requireCandidate(req, res, next) {
  const token =
    req.headers.authorization?.replace("Bearer ", "") ||
    (req.query?.token);

  if (!token) {
    res.status(401).json({ error: "Unauthorised" });
    return;
  }

  try {
    req.candidate = jwt.verify(token, CANDIDATE_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

/* ─── Register ────────────────────────────────────────────────────── */
router.post("/candidate/register", async (req, res) => {
  const { email, password, firstName, lastName, phone } = req.body;

  if (!email || !password || !firstName || !lastName) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  try {
    const existing = await db
      .select()
      .from(candidates)
      .where(eq(candidates.email, email.toLowerCase()));

    if (existing.length > 0) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [candidate] = await db.insert(candidates).values({
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      phone: phone ?? "",
    });

    const token = candidateToken(candidate.id, candidate.email);

    res.status(201).json({
      token,
      candidate: {
        id: candidate.id,
        email: candidate.email,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── Login ───────────────────────────────────────────────────────── */
router.post("/candidate/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Missing credentials" });
    return;
  }

  const rows = await db
    .select()
    .from(candidates)
    .where(eq(candidates.email, email.toLowerCase()));

  if (rows.length === 0) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const candidate = rows[0];
  const valid = await bcrypt.compare(password, candidate.passwordHash);

  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = candidateToken(candidate.id, candidate.email);

  res.json({
    token,
    candidate: {
      id: candidate.id,
      email: candidate.email,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
    },
  });
});

/* ─── Me ──────────────────────────────────────────────────────────── */
router.get("/candidate/me", requireCandidate, async (req, res) => {
  const rows = await db
    .select()
    .from(candidates)
    .where(eq(candidates.id, req.candidate.id));

  if (rows.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const c = rows[0];

  res.json({
    id: c.id,
    email: c.email,
    firstName: c.firstName,
    lastName: c.lastName,
    phone: c.phone,
  });
});

/* ─── Applications ───────────────────────────────────────────────── */
router.get("/candidate/applications", requireCandidate, async (req, res) => {
  const apps = await db
    .select({
      id: jobApplications.id,
      applicationNumber: jobApplications.applicationNumber,
      status: jobApplications.status,
      submittedAt: jobApplications.submittedAt,
      updatedAt: jobApplications.updatedAt,
      coverLetter: jobApplications.coverLetter,
      currentEmployer: jobApplications.currentEmployer,
      yearsExperience: jobApplications.yearsExperience,
      noticePeriod: jobApplications.noticePeriod,
      expectedSalary: jobApplications.expectedSalary,
      adminNotes: jobApplications.adminNotes,
      jobTitle: careers.title,
      jobDepartment: careers.department,
      jobLocation: careers.location,
      jobEmploymentType: careers.employmentType,
      jobRef: careers.jobId,
    })
    .from(jobApplications)
    .leftJoin(careers, eq(jobApplications.jobId, careers.id))
    .where(eq(jobApplications.candidateId, req.candidate.id))
    .orderBy(jobApplications.submittedAt);

  const result = await Promise.all(
    apps.map(async (app) => {
      const slots = await db
        .select()
        .from(interviewSlots)
        .where(eq(interviewSlots.applicationId, app.id));

      return {
        ...app,
        interview: slots[0] ?? null,
      };
    })
  );

  res.json(result);
});


export default router;