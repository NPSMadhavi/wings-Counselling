import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import {
  ddb as db,
  jobApplications,
  candidates,
  careers
} from "../config/db.js";

import { eq, desc } from "drizzle-orm";

import { requireAdmin } from "../middlewares/auth.js";
import { requireCandidate } from "./candidates.js";

import {
  broadcastToAdmin,
  addCandidateSSEClient,
  addAdminSSEClient
} from "../lib/sse.js";

import {
  sendApplicationAcknowledgement
} from "../lib/email.js";

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

      const jobs = await db
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

      const existing = await db
        .select()
        .from(jobApplications)
        .where(eq(jobApplications.jobId, jobId));

      const alreadyApplied = existing.some(
        (r) => r.candidateId === req.candidate.id
      );

      if (alreadyApplied) {
        return res.status(409).json({ error: "Already applied" });
      }

      const resumeUrl = req.file
        ? `/api/uploads/${req.file.filename}`
        : "";

      let applicationNumber = generateApplicationNumber();

      const body = req.body;

      const [application] = await db
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

      const candidateRows = await db
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

      sendApplicationAcknowledgement(candidate.email, {
        firstName: candidate.firstName,
        jobTitle: job.title,
        applicationNumber: application.applicationNumber
      }).catch(console.error);

      res.status(201).json({
        id: application.id,
        applicationNumber: application.applicationNumber
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/* ─── MY APPLICATIONS ───────────────────────── */
router.get(
  "/candidate/applications",
  requireCandidate,
  async (req, res) => {
    try {
      const apps = await db
        .select()
        .from(jobApplications)
        .where(eq(jobApplications.candidateId, req.candidate.id))
        .orderBy(desc(jobApplications.submittedAt));

      res.json(apps);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

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

/* ─── ADMIN APPLICATIONS ────────────────────── */
router.get(
  "/admin/applications",
  requireAdmin,
  async (req, res) => {
    try {
      const apps = await db
        .select()
        .from(jobApplications)
        .orderBy(desc(jobApplications.submittedAt));

      res.json(apps);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;