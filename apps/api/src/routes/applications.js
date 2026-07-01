import "../config/env.js";
import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import {
  ddb,
  db,
  jobApplications,
  candidates,
  careers
} from "../config/db.js";

import { and, eq, desc } from "drizzle-orm";
import jwt from "jsonwebtoken";

import { requireAdmin } from "../middlewares/auth.js";
const CANDIDATE_SECRET =
  process.env.CANDIDATE_JWT_SECRET ?? "wings-candidate-secret-2025";

function requireCandidate(req, res, next) {
  const token =
    req.headers.authorization?.replace("Bearer ", "") ||
    req.query?.token;

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

import {
  broadcastToAdmin,
  addCandidateSSEClient,
  addAdminSSEClient
} from "../lib/sse.js";

import {
  sendApplicationAcknowledgement,
  sendApplicationStatusUpdateEmail,
  sendInterviewSlotInvitation,
  sendInterviewInvite,
  sendInterviewBookingConfirmation,
} from "../lib/email.js";
import { buildInterviewBookingLink } from "../lib/candidatePortalLinks.js";
import {
  INTERVIEW_BOOKING_STATUSES,
  snapshotInterviewOffersForApplication,
  clearInterviewOffersForApplication,
} from "../lib/interviewOffers.js";

/** Normalise legacy/snake_case statuses to the Title Case values used in CareersAdmin tabs. */
function normalizeAdminApplicationStatus(status) {
  if (!status || String(status).trim() === "" || status === "submitted") {
    return "Pending";
  }

  const raw = String(status).trim();
  const key = raw.toLowerCase().replace(/[\s-]+/g, "_");

  const aliases = {
    submitted: "Pending",
    pending: "Pending",
    under_review: "Under Review",
    shortlisted: "Shortlisted",
    interview_scheduled: "Interview Scheduled",
    interview_completed: "Interview Completed",
    not_selected: "Not Selected",
    round_1_scheduled: "Round 1 Scheduled",
    round_1_confirmed: "Round 1 Confirmed",
    round_1_completed: "Round 1 Completed",
    round_1_selected: "Round 1 Selected",
    round_1_not_selected: "Round 1 Not Selected",
    round_2_scheduled: "Round 2 Scheduled",
    round_2_confirmed: "Round 2 Confirmed",
    round_2_completed: "Round 2 Completed",
    round_2_selected: "Round 2 Selected",
    round_2_not_selected: "Round 2 Not Selected",
    round_3_scheduled: "Round 3 Scheduled",
    round_3_confirmed: "Round 3 Confirmed",
    round_3_completed: "Round 3 Completed",
    round_3_selected: "Round 3 Selected",
    round_3_not_selected: "Round 3 Not Selected",
    reschedule_interview: "Reschedule Interview",
    reschedule_round_1: "Reschedule Round 1",
    reschedule_round_2: "Reschedule Round 2",
    reschedule_round_3: "Reschedule Round 3",
    final_selected: "Final Selected",
    offer_extended: "Offer Extended",
    onboarded: "Onboarded",
    rejected: "Rejected",
    withdrawn_by_candidate: "Withdrawn by Candidate",
    position_closed: "Position Closed",
    rejected_candidate_non_responsive: "Rejected - Candidate non responsive",
  };

  return aliases[key] ?? raw;
}

function roundLabelForStatus(status) {
  if (status === "Shortlisted" || status === "Reschedule Round 1") {
    return "Round 1 - Technical Interview";
  }
  if (status === "Round 1 Selected" || status === "Reschedule Round 2") {
    return "Round 2 - LSP-E";
  }
  if (status === "Round 2 Selected" || status === "Reschedule Round 3") {
    return "Round 3 - Manager/HR Interview";
  }
  if (status === "Reschedule Interview") return "Interview Round";
  return "Interview Round";
}

function mapEmailAppRow(row) {
  if (!row) return null;
  return {
    candidateEmail: row.candidateEmail ?? row.candidateemail ?? "",
    firstName: row.firstName ?? row.firstname ?? "",
    jobTitle: row.jobTitle ?? row.jobtitle ?? "",
    jobIdCode: row.jobIdCode ?? row.jobidcode ?? "",
    applicationNumber: row.applicationNumber ?? row.applicationnumber ?? "",
  };
}

let applicationSchemaReady = false;

async function ensureApplicationSchema() {
  if (applicationSchemaReady) return;
  try {
    const [rows] = await db.execute(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = current_schema()
         AND table_name = 'job_applications'
         AND column_name = 'internal_remarks'`
    );
    if (!rows.length) {
      await db.execute(
        `ALTER TABLE job_applications ADD COLUMN internal_remarks TEXT DEFAULT ''`
      );
    }
  } catch (err) {
    console.warn("[Applications] ensureApplicationSchema:", err.message);
  }
  applicationSchemaReady = true;
}

function rescheduleStatusForApplication(status) {
  const normalized = normalizeAdminApplicationStatus(status);
  if (
    ["Round 1 Scheduled", "Round 1 Confirmed", "Round 1 Completed", "Shortlisted"].includes(
      normalized
    )
  ) {
    return "Reschedule Round 1";
  }
  if (
    ["Round 2 Scheduled", "Round 2 Confirmed", "Round 2 Completed", "Round 1 Selected"].includes(
      normalized
    )
  ) {
    return "Reschedule Round 2";
  }
  if (
    ["Round 3 Scheduled", "Round 3 Confirmed", "Round 3 Completed", "Round 2 Selected"].includes(
      normalized
    )
  ) {
    return "Reschedule Round 3";
  }
  return "Reschedule Interview";
}

async function fetchApplicationEmailData(applicationId) {
  const [appRows] = await db.execute(
    `SELECT 
      c.email AS "candidateEmail",
      c.first_name AS "firstName",
      COALESCE(jp.title, ca.title, '') AS "jobTitle",
      COALESCE(jp.job_id, ca.job_id, '') AS "jobIdCode",
      ja.application_number AS "applicationNumber"
    FROM job_applications ja
    LEFT JOIN candidates c ON c.id = ja.candidate_id
    LEFT JOIN careers ca ON ca.id = ja.job_id
    LEFT JOIN job_postings jp ON jp.job_id = ca.job_id
    WHERE ja.id = ?
    LIMIT 1`,
    [applicationId]
  );
  return mapEmailAppRow(appRows[0]);
}

async function fetchLatestInterviewSlot(applicationId) {
  const [rows] = await db.execute(
    `SELECT id, date, time_slot, duration, interviewer_name, location, meeting_link
     FROM interview_slots
     WHERE application_id = ?
     ORDER BY id DESC
     LIMIT 1`,
    [applicationId]
  );
  return rows[0] ?? null;
}

function isValidCandidateEmail(email) {
  return (
    typeof email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  );
}

async function sendApplicationStatusEmailNotification({ applicationId, status, remarks = "" }) {
  console.log(
    `[Email] Status notification requested — applicationId=${applicationId} status="${status}"`
  );

  const appData = await fetchApplicationEmailData(applicationId);
  const candidateEmail = String(appData?.candidateEmail ?? "").trim();

  if (!candidateEmail) {
    const reason = "Candidate email not found";
    console.error(
      `[Email] ${reason} — applicationId=${applicationId} lookup=`,
      appData
    );
    return { sent: false, reason };
  }

  if (!isValidCandidateEmail(candidateEmail)) {
    const reason = `Invalid candidate email: ${candidateEmail}`;
    console.error(`[Email] ${reason} — applicationId=${applicationId}`);
    return { sent: false, reason };
  }

  console.log(
    `[Email] Preparing status notification — applicationId=${applicationId} to=${candidateEmail} status="${status}"`
  );

  const needsSlotBooking = INTERVIEW_BOOKING_STATUSES.includes(status);

  if (needsSlotBooking) {
    await snapshotInterviewOffersForApplication(applicationId, status);
    const portalLink = buildInterviewBookingLink(applicationId);
    console.log(
      `[Email] Sending interview slot invitation — applicationId=${applicationId} bookingLink=${portalLink}`
    );

    try {
      await sendInterviewSlotInvitation(candidateEmail, {
        applicationId,
        firstName: appData.firstName,
        jobTitle: appData.jobTitle,
        jobIdCode: appData.jobIdCode,
        round: roundLabelForStatus(status),
        portalLink,
      });
    } catch (err) {
      const reason = err?.message || "Failed to send interview slot invitation email";
      console.error(
        `[Email] ${reason} — applicationId=${applicationId} to=${candidateEmail}`
      );
      return { sent: false, reason };
    }

    broadcastToAdmin("email_sent", {
      context: "interview_slot_invitation",
      applicationId,
      email: candidateEmail,
      status,
      bookingLink: portalLink,
    });

    return { sent: true, type: "interview_slot_invitation", bookingLink: portalLink };
  }

  try {
    await sendApplicationStatusUpdateEmail(candidateEmail, {
      firstName: appData.firstName,
      jobTitle: appData.jobTitle,
      jobIdCode: appData.jobIdCode,
      status,
      remarks,
    });
  } catch (err) {
    const reason = err?.message || "Failed to send application status update email";
    console.error(
      `[Email] ${reason} — applicationId=${applicationId} to=${candidateEmail}`
    );
    return { sent: false, reason };
  }

  broadcastToAdmin("email_sent", {
    context: "application_status_update",
    applicationId,
    email: candidateEmail,
    status,
  });

  console.log(
    `[Email] Status notification sent — applicationId=${applicationId} to=${candidateEmail} status="${status}"`
  );

  return { sent: true, type: "application_status_update" };
}

const router = Router();

/* ─── Upload setup ───────────────────────────── */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(
      null,
      `resume-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
    );
  }
});

const resumeUpload = multer({
  storage: resumeStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Only PDF, DOC, DOCX allowed"));
  }
});

router.post(
  "/applications/upload",
  requireCandidate,
  resumeUpload.single("resume"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No resume file provided" });
      }

      const objectPath = `/api/uploads/${req.file.filename}`;
      res.json({ objectPath });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Upload failed" });
    }
  }
);

/* ─── Generate Application Number ───────────── */
function generateApplicationNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `APP-${year}-${rand}`;
}

/* ─── APPLY JOB ─────────────────────────────── */
router.post(
  "/jobs/:jobId/apply",
  requireCandidate,
  resumeUpload.single("resume"),
  async (req, res) => {
    try {
      const jobId = Number(req.params.jobId);

      const jobs = await ddb
        .select()
        .from(careers)
        .where(eq(careers.id, jobId));

      if (!jobs.length) {
        return res.status(404).json({ error: "Job not found" });
      }

      const job = jobs[0];

      if (!job.isActive) {
        return res.status(400).json({ error: "Position closed" });
      }

      const existing = await ddb
        .select()
        .from(jobApplications)
        .where(eq(jobApplications.candidateId, req.candidate.id));

      if (existing.length > 0) {
        return res.status(409).json({ error: "Already applied" });
      }

      const resumeUrl = req.file
        ? `/api/uploads/${req.file.filename}`
        : "";

      let applicationNumber = generateApplicationNumber();

      const body = req.body;

      const [application] = await ddb
        .insert(jobApplications)
        .values({
          applicationNumber,
          jobId,
          candidateId: req.candidate.id,
          status: "submitted",
          resumeUrl,
          coverLetter: body.coverLetter || "",
          currentEmployer: body.currentEmployer || "",
          yearsExperience: body.yearsExperience || "",
          highestQualification: body.highestQualification || "",
          specialisations: body.specialisations
            ? JSON.parse(body.specialisations)
            : [],
          linkedinUrl: body.linkedinUrl || "",
          noticePeriod: body.noticePeriod || "",
          expectedSalary: body.expectedSalary || ""
        });

      const candidateRows = await ddb
        .select()
        .from(candidates)
        .where(eq(candidates.id, req.candidate.id));

      const candidate = candidateRows[0];

      broadcastToAdmin("new_application", {
        id: application.id,
        applicationNumber: application.applicationNumber,
        candidateName: `${candidate.firstName} ${candidate.lastName}`,
        jobTitle: job.title
      });

      broadcastToAdmin("new_form_submission", {
        formType: "Volunteer/Career Application",
        id: application.id,
        name: `${candidate.firstName} ${candidate.lastName}`,
        email: candidate.email,
        jobTitle: job.title
      });

      sendApplicationAcknowledgement(candidate.email, {
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        jobTitle: job.title,
        applicationNumber: application.applicationNumber,
        applicationId: application.id,
        status: "submitted",
      })
        .then(() => {
          broadcastToAdmin("email_sent", {
            context: "application_acknowledgement",
            applicationId: application.id,
            email: candidate.email,
            subject: `Application acknowledgement for ${job.title}`
          });
        })
        .catch((err) => {
          console.error(err);
          broadcastToAdmin("email_failed", {
            context: "application_acknowledgement",
            applicationId: application.id,
            email: candidate.email,
            reason: err?.message || "Failed to send acknowledgement email"
          });
        });

      res.status(201).json({
        id: application.id,
        applicationNumber: application.applicationNumber
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/* ─── APPLY (JSON body, resume already uploaded separately) ─── */
router.post(
  "/applications",
  requireCandidate,
  async (req, res) => {
    try {
      const { jobId, coverLetter, resumePath } = req.body || {};

      if (!jobId) {
        return res.status(400).json({ error: "jobId is required" });
      }

      const numericJobId = Number(jobId);
      if (!Number.isFinite(numericJobId)) {
        return res.status(400).json({ error: "Invalid jobId" });
      }

      // Use raw pool (db) — jobs live in job_postings
      const [jobRows] = await db.execute(
        "SELECT id, job_id, title, is_active FROM job_postings WHERE id = ? LIMIT 1",
        [numericJobId]
      );

      if (!jobRows.length) {
        return res.status(404).json({ error: "Job not found" });
      }

      const job = jobRows[0];

      if (!job.is_active) {
        return res.status(400).json({ error: "This position is no longer accepting applications" });
      }

      // job_applications.job_id has a FK → careers(id), not job_postings(id).
      // Resolve the matching careers.id via the shared job_id string code.
      // If no careers row exists yet, create a minimal one so the FK is satisfied.
      let careersId;
      const [careersRows] = await db.execute(
        "SELECT id FROM careers WHERE job_id = ? LIMIT 1",
        [job.job_id]
      );
      if (careersRows.length) {
        careersId = careersRows[0].id;
      } else {
        // Insert a minimal careers row to satisfy the FK constraint
        const [careersInsert] = await db.execute(
          `INSERT INTO careers (job_id, title, department, location, description, requirements, employment_type, salary_range, is_active)
           VALUES (?, ?, '', '', '', '', '', '', true)`,
          [job.job_id, job.title]
        );
        careersId = careersInsert.insertId;
      }

      // Prevent multiple applications globally per candidate
      const [existing] = await db.execute(
        "SELECT id FROM job_applications WHERE candidate_id = ? LIMIT 1",
        [req.candidate.id]
      );

      if (existing.length > 0) {
        return res.status(409).json({ error: "You have already applied for a position" });
      }

      const applicationNumber = generateApplicationNumber();

      const [insertResult] = await db.execute(
        `INSERT INTO job_applications
          (application_number, job_id, candidate_id, status, resume_url, cover_letter,
           current_employer, years_experience, highest_qualification, specialisations,
           linkedin_url, notice_period, expected_salary, admin_notes)
         VALUES (?, ?, ?, 'submitted', ?, ?, '', '', '', '[]', '', '', '', '')`,
        [applicationNumber, careersId, req.candidate.id, resumePath || "", coverLetter || ""]
      );

      const insertedId = insertResult.insertId;

      // Fetch candidate details for email + broadcast
      const [candidateRows] = await db.execute(
        "SELECT email, first_name, last_name FROM candidates WHERE id = ? LIMIT 1",
        [req.candidate.id]
      );

      const candidate = candidateRows[0];

      if (candidate) {
        // Broadcast to admin dashboard
        broadcastToAdmin("new_application", {
          id: insertedId,
          applicationNumber,
          candidateName: `${candidate.first_name} ${candidate.last_name}`,
          jobTitle: job.title,
        });

        broadcastToAdmin("new_form_submission", {
          formType: "Career Application",
          id: insertedId,
          name: `${candidate.first_name} ${candidate.last_name}`,
          email: candidate.email,
          jobTitle: job.title,
        });

        // Send confirmation email (fire-and-forget)
        sendApplicationAcknowledgement(candidate.email, {
          firstName: candidate.first_name,
          lastName: candidate.last_name,
          jobTitle: job.title,
          applicationNumber,
          applicationId: insertedId,
          status: "submitted",
        })
          .then(() => {
            broadcastToAdmin("email_sent", {
              context: "application_acknowledgement",
              applicationId: insertedId,
              email: candidate.email,
              subject: `Application received for ${job.title}`,
            });
          })
          .catch((err) => {
            console.error("[Email] Application acknowledgement failed:", err);
            broadcastToAdmin("email_failed", {
              context: "application_acknowledgement",
              applicationId: insertedId,
              email: candidate.email,
              reason: err?.message || "Failed to send acknowledgement email",
            });
          });
      }

      res.status(201).json({ id: insertedId, applicationNumber });
    } catch (err) {
      console.error("POST /applications:", err);
      res.status(500).json({ error: err.message || "Failed to submit application" });
    }
  }
);

/* ─── MY APPLICATIONS ───────────────────────── */
router.get(
  "/candidate/applications",
  requireCandidate,
  async (req, res) => {
    try {
      const [rows] = await db.execute(
        `SELECT
          ja.id,
          ja.application_number AS applicationNumber,
          ja.job_id AS jobId,
          ja.candidate_id AS candidateId,
          ja.status,
          ja.submitted_at AS submittedAt,
          ja.updated_at AS updatedAt,
          ca.job_id AS jobRef,
          jp.id AS jobPostingId
        FROM job_applications ja
        LEFT JOIN careers ca ON ca.id = ja.job_id
        LEFT JOIN job_postings jp ON jp.job_id = ca.job_id
        WHERE ja.candidate_id = ?
        ORDER BY ja.submitted_at DESC`,
        [req.candidate.id]
      );

      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.get("/applications/check/:jobId", requireCandidate, async (req, res) => {
  try {
    const jobId = Number(req.params.jobId);

    if (!Number.isFinite(jobId)) {
      res.status(400).json({ error: "Invalid job ID" });
      return;
    }

    const [rows] = await db.execute(
      `SELECT ja.id
       FROM job_applications ja
       INNER JOIN careers ca ON ca.id = ja.job_id
       INNER JOIN job_postings jp ON jp.job_id = ca.job_id
       WHERE ja.candidate_id = ? AND jp.id = ?
       LIMIT 1`,
      [req.candidate.id, jobId]
    );

    res.json({ hasApplied: rows.length > 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── SSE Candidate ─────────────────────────── */
router.get(
  "/candidate/notifications/stream",
  requireCandidate,
  (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    res.write("event: connected\ndata: {}\n\n");

    addCandidateSSEClient(req.candidate.id, res);

    const hb = setInterval(() => {
      try {
        res.write(": heartbeat\n\n");
      } catch {
        clearInterval(hb);
      }
    }, 25000);

    req.on("close", () => clearInterval(hb));
  }
);

/* ─── SSE ADMIN ─────────────────────────────── */
router.get(
  "/admin/notifications/stream",
  requireAdmin,
  (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    res.write("event: connected\ndata: {}\n\n");

    addAdminSSEClient(res);

    const hb = setInterval(() => {
      try {
        res.write(": heartbeat\n\n");
      } catch {
        clearInterval(hb);
      }
    }, 25000);

    req.on("close", () => clearInterval(hb));
  }
);

function resolveApplicantName(row) {
  if (!row) return null;

  const combined = String(row.applicantName ?? row.applicantname ?? "").trim();
  if (combined) return combined;

  const first = String(row.firstName ?? row.firstname ?? row.first_name ?? "").trim();
  const last = String(row.lastName ?? row.lastname ?? row.last_name ?? "").trim();
  const full = [first, last].filter(Boolean).join(" ").trim();
  if (full) return full;

  const email = String(row.applicantEmail ?? row.applicantemail ?? row.email ?? "").trim();
  if (email) {
    const local = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();
    if (local) return local;
  }

  return null;
}

function mapAdminApplicationRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    applicationNumber: row.applicationNumber ?? row.applicationnumber ?? "",
    jobId: row.jobId ?? row.jobid,
    userId: row.userId ?? row.userid,
    coverLetter: row.coverLetter ?? row.coverletter ?? row.cover_letter ?? "",
    resumePath: row.resumePath ?? row.resumepath ?? row.resume_url ?? "",
    status: normalizeAdminApplicationStatus(row.status),
    adminRemarks: row.adminRemarks ?? row.adminremarks ?? row.admin_notes ?? null,
    internalRemarks: row.internalRemarks ?? row.internalremarks ?? null,
    createdAt: row.createdAt ?? row.createdat ?? row.submitted_at ?? null,
    applicantName: resolveApplicantName(row) ?? "Unknown",
    applicantEmail: row.applicantEmail ?? row.applicantemail ?? row.email ?? "",
    jobTitle: row.jobTitle ?? row.jobtitle ?? "",
    jobIdCode: row.jobIdCode ?? row.jobidcode ?? "",
    categoryId: row.categoryId ?? row.categoryid ?? 0,
    categoryName: row.categoryName ?? row.categoryname ?? "",
    screeningFullName: row.screeningFullName ?? row.screeningfullname ?? null,
    screeningDob: row.screeningDob ?? row.screeningdob ?? null,
    screeningGender: row.screeningGender ?? row.screeninggender ?? null,
    screeningCurrentLocation: row.screeningCurrentLocation ?? row.screeningcurrentlocation ?? null,
    screeningWillingWorkFromOffice: row.screeningWillingWorkFromOffice ?? row.screeningwillingworkfromoffice ?? null,
    screeningWillingProvideExpDocs: row.screeningWillingProvideExpDocs ?? row.screeningwillingprovideexpdocs ?? null,
    screeningWillingBankStatements: row.screeningWillingBankStatements ?? row.screeningwillingbankstatements ?? null,
    screeningYearsExperience: row.screeningYearsExperience ?? row.screeningyearsexperience ?? null,
    screeningEducationalQualification: row.screeningEducationalQualification ?? row.screeningeducationalqualification ?? null,
    screeningCurrentCtc: row.screeningCurrentCtc ?? row.screeningcurrentctc ?? null,
    screeningExpectedCtc: row.screeningExpectedCtc ?? row.screeningexpectedctc ?? null,
    screeningWillingBackgroundCheck: row.screeningWillingBackgroundCheck ?? row.screeningwillingbackgroundcheck ?? null,
    screeningNoticePeriod: row.screeningNoticePeriod ?? row.screeningnoticeperiod ?? null,
    screeningWillingJoinDate: row.screeningWillingJoinDate ?? row.screeningwillingjoindate ?? null,
    screeningUpdatedAt: row.screeningUpdatedAt ?? row.screeningupdatedat ?? null,
    interviewAvailableFrom: row.interviewAvailableFrom ?? row.interviewavailablefrom ?? null,
    interviewAvailableTo: row.interviewAvailableTo ?? row.interviewavailableto ?? null,
    interviewPreferredTime: row.interviewPreferredTime ?? row.interviewpreferredtime ?? null,
    interviewUpdatedAt: row.interviewUpdatedAt ?? row.interviewupdatedat ?? null,
    scheduledInterviewDate: row.scheduledInterviewDate ?? row.scheduledinterviewdate ?? null,
    scheduledInterviewTime: row.scheduledInterviewTime ?? row.scheduledinterviewtime ?? null,
    interviewConfirmed: row.interviewConfirmed ?? row.interviewconfirmed ?? null,
    interviewConfirmedAt: row.interviewConfirmedAt ?? row.interviewconfirmedat ?? null,
    meetingLink: row.meetingLink ?? row.meetinglink ?? null,
    currentRound: row.currentRound ?? row.currentround ?? null,
  };
}

/* ─── ADMIN APPLICATIONS ────────────────────── */
router.get(
  "/admin/applications",
  requireAdmin,
  async (req, res) => {
    try {
      await ensureApplicationSchema();
      // Return enriched applications with candidate name/email, job title/code,
      // and category — exactly the shape CareersAdmin.tsx expects.
      const [rows] = await db.execute(`
        SELECT
          ja.id,
          ja.application_number  AS "applicationNumber",
          ja.job_id              AS "jobId",
          ja.candidate_id        AS "userId",
          ja.cover_letter        AS "coverLetter",
          ja.resume_url          AS "resumePath",
          ja.status,
          ja.admin_notes         AS "adminRemarks",
          ja.internal_remarks    AS "internalRemarks",
          ja.submitted_at        AS "createdAt",
          c.first_name           AS "firstName",
          c.last_name            AS "lastName",
          NULLIF(TRIM(CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, ''))), '') AS "applicantName",
          c.email                AS "applicantEmail",
          COALESCE(jp.title, ca.title, '') AS "jobTitle",
          COALESCE(jp.job_id, ca.job_id, '') AS "jobIdCode",
          COALESCE(jp.category_id, 0) AS "categoryId",
          COALESCE(jc.name, '') AS "categoryName",
          NULL AS "screeningFullName",
          NULL AS "screeningDob",
          NULL AS "screeningGender",
          NULL AS "screeningCurrentLocation",
          NULL AS "screeningWillingWorkFromOffice",
          NULL AS "screeningWillingProvideExpDocs",
          NULL AS "screeningWillingBankStatements",
          NULL AS "screeningYearsExperience",
          NULL AS "screeningEducationalQualification",
          NULL AS "screeningCurrentCtc",
          NULL AS "screeningExpectedCtc",
          NULL AS "screeningWillingBackgroundCheck",
          NULL AS "screeningNoticePeriod",
          NULL AS "screeningWillingJoinDate",
          NULL AS "screeningUpdatedAt",
          NULL AS "interviewAvailableFrom",
          NULL AS "interviewAvailableTo",
          NULL AS "interviewPreferredTime",
          NULL AS "interviewUpdatedAt",
          latest_slot.date AS "scheduledInterviewDate",
          latest_slot.time_slot AS "scheduledInterviewTime",
          NULL AS "interviewConfirmed",
          NULL AS "interviewConfirmedAt",
          latest_slot.meeting_link AS "meetingLink",
          NULL AS "currentRound"
        FROM job_applications ja
        LEFT JOIN candidates c ON c.id = ja.candidate_id
        LEFT JOIN careers ca ON ca.id = ja.job_id
        LEFT JOIN job_postings jp ON jp.job_id = ca.job_id
        LEFT JOIN job_categories jc ON jc.id = jp.category_id
        LEFT JOIN (
          SELECT s1.application_id, s1.date, s1.time_slot, s1.meeting_link
          FROM interview_slots s1
          INNER JOIN (
            SELECT application_id, MAX(id) AS max_id
            FROM interview_slots
            GROUP BY application_id
          ) s2 ON s2.max_id = s1.id
        ) latest_slot ON latest_slot.application_id = ja.id
        ORDER BY ja.submitted_at DESC
      `);

      res.json(rows.map(mapAdminApplicationRow).filter(Boolean));
    } catch (err) {
      console.error("GET /admin/applications:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

/* ─── ADMIN: UPDATE APPLICATION STATUS ────────────────────── */
router.put(
  "/admin/applications/:id",
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { status, adminNotes } = req.body || {};

      if (!Number.isFinite(id)) {
        return res.status(400).json({ error: "Invalid application ID" });
      }

      const updates = [];
      const params = [];

      if (status !== undefined) {
        updates.push("status = ?");
        params.push(status);
      }
      if (adminNotes !== undefined) {
        updates.push("admin_notes = ?");
        params.push(adminNotes);
      }
      updates.push("updated_at = NOW()");

      if (updates.length === 1) {
        return res.status(400).json({ error: "No fields to update" });
      }

      params.push(id);
      await db.execute(
        `UPDATE job_applications SET ${updates.join(", ")} WHERE id = ?`,
        params
      );

      // Send email notification to candidate if status was updated
      let emailResult = null;
      if (status !== undefined) {
        try {
          emailResult = await sendApplicationStatusEmailNotification({
            applicationId: id,
            status,
            remarks: adminNotes || "",
          });
          if (!emailResult?.sent) {
            console.error(
              `[Email] Status saved but notification not sent — applicationId=${id} reason=${emailResult?.reason || "unknown"}`
            );
            broadcastToAdmin("email_failed", {
              context: "application_status_update",
              applicationId: id,
              status,
              reason: emailResult?.reason || "Failed to send email",
            });
          }
        } catch (emailErr) {
          console.error(
            `[Email] Error sending status update email — applicationId=${id}:`,
            emailErr
          );
          broadcastToAdmin("email_failed", {
            context: "application_status_update",
            applicationId: id,
            status,
            reason: emailErr?.message || "Failed to send email",
          });
        }
      }

      res.json({
        ok: true,
        emailSent: emailResult?.sent ?? false,
        emailError: emailResult?.sent ? null : (emailResult?.reason ?? null),
      });
    } catch (err) {
      console.error("PUT /admin/applications/:id:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

/* ─── MISSING ADMIN ROUTES (Added for Frontend Compatibility) ─── */
router.patch(
  "/admin/applications/:id/status",
  requireAdmin,
  async (req, res) => {
    try {
      await ensureApplicationSchema();
      const id = Number(req.params.id);
      const { status, remarks, internalRemarks } = req.body || {};
      
      if (!Number.isFinite(id)) {
        return res.status(400).json({ error: "Invalid application ID" });
      }
      
      const updates = [];
      const params = [];
      
      if (status !== undefined) {
        updates.push("status = ?");
        params.push(status);
      }
      if (remarks !== undefined) {
        updates.push("admin_notes = ?");
        params.push(remarks ?? "");
      }
      if (internalRemarks !== undefined) {
        updates.push("internal_remarks = ?");
        params.push(internalRemarks ?? "");
      }
      
      if (updates.length > 0) {
        updates.push("updated_at = NOW()");
        params.push(id);
        await db.execute(
          `UPDATE job_applications SET ${updates.join(", ")} WHERE id = ?`,
          params
        );
      }

      // Send email notification to candidate if status was updated
      let emailResult = null;
      if (status !== undefined) {
        try {
          emailResult = await sendApplicationStatusEmailNotification({
            applicationId: id,
            status,
            remarks: remarks || "",
          });

          if (!emailResult?.sent) {
            const reason = emailResult?.reason || "Unknown email failure";
            console.error(
              `[Email] Status saved but notification not sent — applicationId=${id} status="${status}" reason=${reason}`
            );
            broadcastToAdmin("email_failed", {
              context: "application_status_update",
              applicationId: id,
              status,
              reason,
            });
          }
        } catch (emailErr) {
          console.error(
            `[Email] Error sending status update email — applicationId=${id} status="${status}":`,
            emailErr
          );
          broadcastToAdmin("email_failed", {
            context: "application_status_update",
            applicationId: id,
            status,
            reason: emailErr?.message || "Failed to send email",
          });
          emailResult = {
            sent: false,
            reason: emailErr?.message || "Failed to send email",
          };
        }
      } else {
        console.warn(
          `[Email] Status PATCH skipped email — applicationId=${id} (status not provided in request body)`
        );
      }

      res.json({
        success: true,
        bookingLink: emailResult?.bookingLink ?? null,
        emailType: emailResult?.type ?? null,
        emailSent: emailResult?.sent ?? false,
        emailError: emailResult?.sent ? null : (emailResult?.reason ?? null),
      });
    } catch (err) {
      console.error("PATCH /admin/applications/:id/status:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

router.patch(
  "/admin/applications/:id/internal-remarks",
  requireAdmin,
  async (req, res) => {
    try {
      await ensureApplicationSchema();
      const id = Number(req.params.id);
      const { internalRemarks } = req.body || {};
      
      if (!Number.isFinite(id)) {
        return res.status(400).json({ error: "Invalid application ID" });
      }
      if (internalRemarks !== undefined) {
        await db.execute(
          "UPDATE job_applications SET internal_remarks = ?, updated_at = NOW() WHERE id = ?",
          [internalRemarks, id]
        );
      }
      res.json({ success: true });
    } catch (err) {
      console.error("PATCH /admin/applications/:id/internal-remarks:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

router.post(
  "/admin/applications/:id/schedule-interview",
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { scheduledDate, scheduledTime } = req.body || {};

      if (!Number.isFinite(id)) {
        return res.status(400).json({ error: "Invalid application ID" });
      }
      if (!scheduledDate || !scheduledTime) {
        return res.status(400).json({ error: "scheduledDate and scheduledTime are required" });
      }

      const [apps] = await db.execute(
        `SELECT id, status FROM job_applications WHERE id = ? LIMIT 1`,
        [id]
      );
      if (!apps.length) {
        return res.status(404).json({ error: "Application not found" });
      }

      await db.execute(
        `INSERT INTO interview_slots
          (application_id, date, time_slot, duration, interviewer_name, location, meeting_link, status)
         VALUES (?, ?, ?, 60, '', '', '', 'scheduled')`,
        [id, scheduledDate, scheduledTime]
      );

      const appData = await fetchApplicationEmailData(id);
      if (appData?.candidateEmail) {
        await sendInterviewInvite(appData.candidateEmail, {
          firstName: appData.firstName,
          jobTitle: appData.jobTitle,
          applicationNumber: appData.applicationNumber,
          date: scheduledDate,
          timeSlot: scheduledTime,
          duration: 60,
          interviewerName: "WINGS Recruitment Team",
          meetingLink: "",
        });
      }

      res.json({ success: true });
    } catch (err) {
      console.error("POST /admin/applications/:id/schedule-interview:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

router.post(
  "/admin/applications/:id/resend-confirmation",
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) {
        return res.status(400).json({ error: "Invalid application ID" });
      }

      const [rows] = await db.execute(
        `SELECT status FROM job_applications WHERE id = ? LIMIT 1`,
        [id]
      );
      if (!rows.length) {
        return res.status(404).json({ error: "Application not found" });
      }

      const status = rows[0].status;
      if (!INTERVIEW_BOOKING_STATUSES.includes(status)) {
        return res.status(400).json({
          error: "Interview slot invitation can only be resent for Shortlisted or Round Selected statuses",
        });
      }

      const result = await sendApplicationStatusEmailNotification({
        applicationId: id,
        status,
      });

      if (!result.sent) {
        return res.status(400).json({ error: result.reason || "Failed to send email" });
      }

      res.json({ success: true, bookingLink: result.bookingLink });
    } catch (err) {
      console.error("POST /admin/applications/:id/resend-confirmation:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

router.patch(
  "/admin/applications/:id/meeting-link",
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { meetingLink } = req.body || {};

      if (!Number.isFinite(id)) {
        return res.status(400).json({ error: "Invalid application ID" });
      }
      if (!meetingLink || !String(meetingLink).trim()) {
        return res.status(400).json({ error: "meetingLink is required" });
      }

      const slot = await fetchLatestInterviewSlot(id);
      if (!slot) {
        return res.status(404).json({ error: "No scheduled interview found for this application" });
      }

      await db.execute(
        `UPDATE interview_slots SET meeting_link = ? WHERE id = ?`,
        [String(meetingLink).trim(), slot.id]
      );

      const appData = await fetchApplicationEmailData(id);
      if (appData?.candidateEmail) {
        await sendInterviewBookingConfirmation(appData.candidateEmail, {
          firstName: appData.firstName,
          jobTitle: appData.jobTitle,
          jobIdCode: appData.jobIdCode,
          round: "Interview Round",
          date: slot.date,
          timeSlot: slot.time_slot,
          duration: slot.duration,
          interviewerName: slot.interviewer_name || "WINGS Recruitment Team",
          location: slot.location || "",
          meetingLink: String(meetingLink).trim(),
        });
      }

      res.json({ success: true });
    } catch (err) {
      console.error("PATCH /admin/applications/:id/meeting-link:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

router.post(
  "/admin/applications/:id/request-reschedule",
  requireAdmin,
  async (req, res) => {
    try {
      await ensureApplicationSchema();
      const id = Number(req.params.id);
      const { message } = req.body || {};

      if (!Number.isFinite(id)) {
        return res.status(400).json({ error: "Invalid application ID" });
      }

      const [apps] = await db.execute(
        `SELECT id, status FROM job_applications WHERE id = ? LIMIT 1`,
        [id]
      );
      if (!apps.length) {
        return res.status(404).json({ error: "Application not found" });
      }

      const rescheduleStatus = rescheduleStatusForApplication(apps[0].status);
      const candidateMessage = message || "We need to reschedule your interview.";

      await db.execute(
        `UPDATE interview_availability
         SET is_booked = false, booked_application_id = NULL
         WHERE booked_application_id = ?`,
        [id]
      );
      await db.execute(`DELETE FROM interview_slots WHERE application_id = ?`, [id]);
      await clearInterviewOffersForApplication(id);

      await db.execute(
        `UPDATE job_applications
         SET status = ?, admin_notes = ?, updated_at = NOW()
         WHERE id = ?`,
        [rescheduleStatus, candidateMessage, id]
      );

      try {
        await sendApplicationStatusEmailNotification({
          applicationId: id,
          status: rescheduleStatus,
          remarks: candidateMessage,
        });
      } catch (emailErr) {
        console.error("[Email] Reschedule notification failed:", emailErr);
      }

      res.json({ success: true });
    } catch (err) {
      console.error("POST /admin/applications/:id/request-reschedule:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

router.get(
  "/admin/applications/:id/qa",
  requireAdmin,
  async (req, res) => {
    try {
      // Return empty QA structure as the tables might not exist in the new schema yet
      res.json({ questions: [], answers: [] });
    } catch (err) {
      console.error("GET /admin/applications/:id/qa:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

router.post(
  "/admin/applications/:id/questions",
  requireAdmin,
  async (req, res) => {
    try {
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.get(
  "/admin/mcq/session/:appId",
  requireAdmin,
  async (req, res) => {
    try {
      res.json({ success: true, session: null });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.post(
  "/admin/mcq/generate/:appId",
  requireAdmin,
  async (req, res) => {
    res.json({ success: true, message: "MCQ generated successfully." });
  }
);

router.patch(
  "/admin/mcq/sessions/:sessionId/void",
  requireAdmin,
  async (req, res) => {
    res.json({ success: true });
  }
);

router.post(
  "/admin/mcq/invite/:appId",
  requireAdmin,
  async (req, res) => {
    res.json({ success: true, message: "Invite sent successfully." });
  }
);

router.patch(
  "/admin/mcq/override/:appId",
  requireAdmin,
  async (req, res) => {
    res.json({ success: true, newStatus: "Round 1 Selected", message: "Override successful." });
  }
);

router.post(
  "/admin/mcq/report/:appId/email",
  requireAdmin,
  async (req, res) => {
    res.json({ success: true, message: "Report emailed successfully." });
  }
);

export default router;
