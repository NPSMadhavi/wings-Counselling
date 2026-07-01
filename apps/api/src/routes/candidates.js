import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../config/db.js";
import { isDuplicateColumnError } from "../config/pg-helpers.js";
import { sendMobileOtpSms, sendInterviewBookingConfirmation } from "../lib/email.js";
import { broadcastToAdmin, broadcastToCandidate } from "../lib/sse.js";
import {
  countOffersForApplication,
  fetchOfferedSlotsForApplication,
  isSlotOfferedToApplication,
  mapOfferedSlotRow,
  snapshotInterviewOffersForApplication,
  statusAllowsInterviewBooking,
} from "../lib/interviewOffers.js";

const router = Router();

const CANDIDATE_SECRET =
  process.env.CANDIDATE_JWT_SECRET ?? "wings-candidate-secret-2025";

function candidateToken(id, email) {
  return jwt.sign({ id, email, role: "candidate" }, CANDIDATE_SECRET, {
    expiresIn: "30d",
  });
}

/** Map pre-booking status to the admin-facing scheduled status for the correct round tab. */
function scheduledStatusAfterBooking(currentStatus) {
  const status = String(currentStatus || "").trim();
  switch (status) {
    case "Shortlisted":
    case "Reschedule Round 1":
      return "Round 1 Scheduled";
    case "Round 1 Selected":
    case "Reschedule Round 2":
      return "Round 2 Scheduled";
    case "Round 2 Selected":
    case "Reschedule Round 3":
      return "Round 3 Scheduled";
    case "Reschedule Interview":
      return "Interview Scheduled";
    default:
      return "Interview Scheduled";
  }
}

export function requireCandidate(req, res, next) {
  const token =
    req.headers.authorization?.replace("Bearer ", "") || req.query?.token;

  if (!token) {
    return res.status(401).json({ error: "Unauthorised" });
  }

  try {
    req.candidate = jwt.verify(token, CANDIDATE_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function mapCandidate(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone || "",
    phoneVerified: Boolean(row.phone_verified),
  };
}

async function ensureCandidateColumns() {
  const alters = [
    "ADD COLUMN phone_verified BOOLEAN NOT NULL DEFAULT false",
    "ADD COLUMN mobile_otp VARCHAR(10) NULL",
    "ADD COLUMN mobile_otp_expiry TIMESTAMP NULL",
  ];

  for (const clause of alters) {
    try {
      await db.execute(`ALTER TABLE candidates ${clause}`);
    } catch (err) {
      if (!isDuplicateColumnError(err)) throw err;
    }
  }
}

ensureCandidateColumns().catch((err) => {
  console.error("Failed to ensure candidate columns:", err);
});

router.post("/candidate/register", async (req, res) => {
  const { email, password, firstName, lastName, phone } = req.body || {};

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const normalizedEmail = String(email).toLowerCase().trim();

    const [existing] = await db.execute(
      "SELECT id FROM candidates WHERE email = ? LIMIT 1",
      [normalizedEmail]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await db.execute(
      `INSERT INTO candidates (email, password_hash, first_name, last_name, phone)
       VALUES (?, ?, ?, ?, ?)`,
      [normalizedEmail, passwordHash, firstName, lastName, phone ?? ""]
    );

    const candidateId = result.insertId;
    const token = candidateToken(candidateId, normalizedEmail);

    res.status(201).json({
      token,
      candidate: {
        id: candidateId,
        email: normalizedEmail,
        firstName,
        lastName,
        phone: phone ?? "",
        phoneVerified: false,
      },
    });
  } catch (err) {
    console.error("candidate/register:", err);
    res.status(500).json({ error: err.message || "Registration failed" });
  }
});

router.post("/candidate/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  try {
    const normalizedEmail = String(email).toLowerCase().trim();

    const [rows] = await db.execute(
      `SELECT id, email, password_hash, first_name, last_name, phone, phone_verified
       FROM candidates WHERE email = ? LIMIT 1`,
      [normalizedEmail]
    );

    if (!rows.length) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const candidate = rows[0];
    const valid = await bcrypt.compare(password, candidate.password_hash);

    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = candidateToken(candidate.id, candidate.email);

    res.json({
      token,
      candidate: mapCandidate(candidate),
    });
  } catch (err) {
    console.error("candidate/login:", err);
    res.status(500).json({ error: err.message || "Login failed" });
  }
});

router.get("/candidate/me", requireCandidate, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, email, first_name, last_name, phone, phone_verified
       FROM candidates WHERE id = ? LIMIT 1`,
      [req.candidate.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json(mapCandidate(rows[0]));
  } catch (err) {
    console.error("candidate/me:", err);
    res.status(500).json({ error: err.message || "Failed to fetch profile" });
  }
});

router.post("/candidate/send-mobile-otp", requireCandidate, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, first_name, phone FROM candidates WHERE id = ? LIMIT 1`,
      [req.candidate.id]
    );

    const candidate = rows[0];
    if (!candidate) {
      return res.status(404).json({ error: "Not found" });
    }

    if (!candidate.phone?.trim()) {
      return res.status(400).json({ error: "Please add your mobile number first." });
    }

    const otp = `${Math.floor(100000 + Math.random() * 900000)}`;
    const expiry = new Date(Date.now() + 10 * 60 * 1000);
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      await connection.execute(
        `UPDATE candidates
         SET mobile_otp = ?, mobile_otp_expiry = ?, phone_verified = false
         WHERE id = ?`,
        [otp, expiry, candidate.id]
      );

      const smsSent = await sendMobileOtpSms(
        candidate.phone,
        otp,
        candidate.first_name
      );

      if (!smsSent) {
        throw new Error(
          "SMS could not be sent. Please configure Twilio in apps/api/.env."
        );
      }

      await connection.commit();
    } catch (sendError) {
      await connection.rollback().catch(() => {});
      throw sendError;
    } finally {
      connection.release();
    }

    res.json({
      success: true,
      message: "Verification code sent to your mobile number.",
    });
  } catch (err) {
    console.error("candidate/send-mobile-otp:", err);
    res.status(500).json({ error: err.message || "Failed to send OTP" });
  }
});

router.post("/candidate/verify-mobile-otp", requireCandidate, async (req, res) => {
  try {
    const { otp } = req.body || {};

    if (!otp) {
      return res.status(400).json({ error: "OTP is required." });
    }

    const [rows] = await db.execute(
      `SELECT id, mobile_otp, mobile_otp_expiry FROM candidates WHERE id = ? LIMIT 1`,
      [req.candidate.id]
    );

    const candidate = rows[0];
    if (!candidate) {
      return res.status(404).json({ error: "Not found" });
    }

    if (!candidate.mobile_otp || !candidate.mobile_otp_expiry) {
      return res.status(400).json({
        error: "No OTP request found. Please request a new OTP.",
      });
    }

    if (new Date() > new Date(candidate.mobile_otp_expiry)) {
      return res.status(400).json({
        error: "OTP has expired. Please request a new one.",
      });
    }

    if (String(candidate.mobile_otp).trim() !== String(otp).trim()) {
      return res.status(400).json({ error: "Invalid OTP. Please try again." });
    }

    await db.execute(
      `UPDATE candidates
       SET phone_verified = true, mobile_otp = NULL, mobile_otp_expiry = NULL
       WHERE id = ?`,
      [candidate.id]
    );

    res.json({
      success: true,
      message: "Mobile number verified successfully!",
    });
  } catch (err) {
    console.error("candidate/verify-mobile-otp:", err);
    res.status(500).json({ error: err.message || "Failed to verify OTP" });
  }
});

router.post("/candidate/logout", requireCandidate, async (_req, res) => {
  res.json({ success: true });
});

// Profile endpoint — returns null profile + empty arrays since extended profile
// tables are not yet implemented. Prevents 404 on the apply page.
router.get("/profile", requireCandidate, async (_req, res) => {
  res.json({ profile: null, certifications: [], workExperience: [] });
});

router.get("/candidate/applications", requireCandidate, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT
        ja.id,
        ja.application_number AS "applicationNumber",
        ja.status,
        ja.submitted_at AS "submittedAt",
        ja.updated_at AS "updatedAt",
        ja.cover_letter AS "coverLetter",
        ja.current_employer AS "currentEmployer",
        ja.years_experience AS "yearsExperience",
        ja.notice_period AS "noticePeriod",
        ja.expected_salary AS "expectedSalary",
        ja.admin_notes AS "adminNotes",
        jp.title AS "jobTitle",
        jc.name AS "jobDepartment",
        jp.location AS "jobLocation",
        jp.employment_type AS "jobEmploymentType",
        jp.job_id AS "jobRef"
      FROM job_applications ja
      LEFT JOIN job_postings jp ON jp.id = ja.job_id
      LEFT JOIN job_categories jc ON jc.id = jp.category_id
      WHERE ja.candidate_id = ?
      ORDER BY ja.submitted_at DESC`,
      [req.candidate.id]
    );

    const result = await Promise.all(
      rows.map(async (app) => {
        const [slots] = await db.execute(
          `SELECT date, time_slot AS "timeSlot", duration,
                  interviewer_name AS "interviewerName",
                  location, meeting_link AS "meetingLink"
           FROM interview_slots WHERE application_id = ? LIMIT 1`,
          [app.id]
        );
        const slot = slots[0];
        const interview = slot
          ? {
              date: slot.date,
              timeSlot: slot.timeSlot ?? slot.timeslot ?? slot.time_slot ?? "",
              duration: slot.duration,
              interviewerName: slot.interviewerName ?? slot.interviewername ?? slot.interviewer_name ?? "",
              location: slot.location ?? "",
              meetingLink: slot.meetingLink ?? slot.meetinglink ?? slot.meeting_link ?? "",
            }
          : null;

        return {
          ...app,
          interview,
        };
      })
    );

    res.json(result);
  } catch (err) {
    console.error("candidate/applications:", err);
    res.status(500).json({ error: err.message || "Failed to fetch applications" });
  }
});


/* ─── Candidate: List interview slots offered for a specific application ─ */
router.get("/candidate/interview-availability", requireCandidate, async (req, res) => {
  try {
    const applicationId = Number(req.query.applicationId);
    if (!Number.isFinite(applicationId) || applicationId <= 0) {
      return res.status(400).json({ error: "applicationId query parameter is required" });
    }

    const [apps] = await db.execute(
      `SELECT id, candidate_id, status FROM job_applications WHERE id = ? LIMIT 1`,
      [applicationId]
    );
    if (!apps.length) {
      return res.status(404).json({ error: "Application not found" });
    }
    if (apps[0].candidate_id !== req.candidate.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (!statusAllowsInterviewBooking(apps[0].status)) {
      return res.status(400).json({ error: "Interview booking is not open for this application" });
    }

    let offerCount = await countOffersForApplication(applicationId);
    if (offerCount === 0) {
      await snapshotInterviewOffersForApplication(applicationId, apps[0].status);
      offerCount = await countOffersForApplication(applicationId);
    }

    const rows = await fetchOfferedSlotsForApplication(applicationId);
    res.json(rows.map(mapOfferedSlotRow));
  } catch (err) {
    console.error("candidate/interview-availability:", err);
    res.status(500).json({ error: err.message || "Failed to fetch slots" });
  }
});

/* ─── Candidate: Book an interview slot ────────────────────────────────── */
router.post("/candidate/applications/:id/book-interview", requireCandidate, async (req, res) => {
  try {
    const appId = Number(req.params.id);
    const { availabilityId } = req.body || {};

    if (!availabilityId) {
      return res.status(400).json({ error: "availabilityId is required" });
    }

    // Verify application belongs to this candidate
    const [apps] = await db.execute(
      `SELECT id, candidate_id, status FROM job_applications WHERE id = ? LIMIT 1`,
      [appId]
    );
    if (!apps.length) {
      return res.status(404).json({ error: "Application not found" });
    }
    if (apps[0].candidate_id !== req.candidate.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (!statusAllowsInterviewBooking(apps[0].status)) {
      return res.status(409).json({ error: "Interview booking is not open for this application" });
    }

    const [existingSlots] = await db.execute(
      `SELECT id FROM interview_slots WHERE application_id = ? LIMIT 1`,
      [appId]
    );
    if (existingSlots.length) {
      return res.status(409).json({ error: "You have already booked an interview for this application" });
    }

    const offered = await isSlotOfferedToApplication(appId, Number(availabilityId));
    if (!offered) {
      return res.status(409).json({
        error: "This slot is not part of your interview invitation. Please choose from the listed options.",
      });
    }

    const [avail] = await db.execute(
      `SELECT id, date, time_slot, duration, interviewer_name, location, meeting_link
       FROM interview_availability WHERE id = ? AND is_booked = false LIMIT 1`,
      [Number(availabilityId)]
    );
    if (!avail.length) {
      return res.status(409).json({ error: "This slot is no longer available. Please refresh and choose another." });
    }
    const slot = avail[0];

    // Mark slot as booked
    await db.execute(
      `UPDATE interview_availability SET is_booked = true, booked_application_id = ? WHERE id = ?`,
      [appId, slot.id]
    );

    // Ensure interview_slots table exists
    await db.execute(`
      CREATE TABLE IF NOT EXISTS interview_slots (
        id SERIAL PRIMARY KEY,
        application_id INT NOT NULL,
        date VARCHAR(20) NOT NULL,
        time_slot VARCHAR(30) NOT NULL,
        duration INT NOT NULL DEFAULT 45,
        interviewer_name TEXT NOT NULL DEFAULT '',
        location TEXT NOT NULL DEFAULT '',
        meeting_link TEXT NOT NULL DEFAULT '',
        status VARCHAR(30) NOT NULL DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert interview slot record
    await db.execute(
      `INSERT INTO interview_slots
        (application_id, date, time_slot, duration, interviewer_name, location, meeting_link, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')`,
      [appId, slot.date, slot.time_slot, slot.duration,
       slot.interviewer_name, slot.location, slot.meeting_link]
    );

    // Update application status to the admin-facing scheduled status for this round
    const scheduledStatus = scheduledStatusAfterBooking(apps[0].status);
    await db.execute(
      `UPDATE job_applications SET status = ?, updated_at = NOW() WHERE id = ?`,
      [scheduledStatus, appId]
    );

    const [appRows] = await db.execute(`
      SELECT
        c.email AS "candidateEmail",
        c.first_name AS "firstName",
        COALESCE(jp.title, ca.title, '') AS "jobTitle",
        COALESCE(jp.job_id, ca.job_id, '') AS "jobIdCode"
      FROM job_applications ja
      LEFT JOIN candidates c ON c.id = ja.candidate_id
      LEFT JOIN careers ca ON ca.id = ja.job_id
      LEFT JOIN job_postings jp ON jp.job_id = ca.job_id
      WHERE ja.id = ?
      LIMIT 1
    `, [appId]);

    const appData = appRows[0]
      ? {
          candidateEmail: appRows[0].candidateEmail ?? appRows[0].candidateemail,
          firstName: appRows[0].firstName ?? appRows[0].firstname,
          jobTitle: appRows[0].jobTitle ?? appRows[0].jobtitle,
          jobIdCode: appRows[0].jobIdCode ?? appRows[0].jobidcode,
        }
      : null;

    if (appData?.candidateEmail) {
      sendInterviewBookingConfirmation(appData.candidateEmail, {
        firstName: appData.firstName,
        jobTitle: appData.jobTitle,
        jobIdCode: appData.jobIdCode,
        round: "Interview Round",
        date: slot.date,
        timeSlot: slot.time_slot,
        duration: slot.duration,
        interviewerName: slot.interviewer_name,
        location: slot.location,
        meetingLink: slot.meeting_link,
      }).catch((err) => console.error("[Email] Booking confirmation failed:", err));

      broadcastToAdmin("interview_booked", {
        applicationId: appId,
        candidateName: appData.firstName,
        jobTitle: appData.jobTitle,
        date: slot.date,
        timeSlot: slot.time_slot,
      });

      broadcastToCandidate(req.candidate.id, "interview_scheduled", {
        applicationId: appId,
        date: slot.date,
        timeSlot: slot.time_slot,
      });
    }

    res.status(201).json({ success: true, date: slot.date, timeSlot: slot.time_slot, duration: slot.duration });
  } catch (err) {
    console.error("candidate/book-interview:", err);
    res.status(500).json({ error: err.message || "Failed to book interview" });
  }
});

/* ─── Candidate: Request custom interview time ─────────────────────────── */
router.post("/candidate/applications/:id/request-interview-time", requireCandidate, async (req, res) => {
  try {
    const appId = Number(req.params.id);
    const { preferredDate, preferredTimeSlot, notes } = req.body || {};

    if (!preferredDate || !preferredTimeSlot) {
      return res.status(400).json({ error: "preferredDate and preferredTimeSlot are required" });
    }

    // Verify application belongs to this candidate
    const [apps] = await db.execute(
      `SELECT id, candidate_id FROM job_applications WHERE id = ? LIMIT 1`,
      [appId]
    );
    if (!apps.length) return res.status(404).json({ error: "Application not found" });
    if (apps[0].candidate_id !== req.candidate.id) return res.status(403).json({ error: "Forbidden" });

    // Ensure table exists
    await db.execute(`
      CREATE TABLE IF NOT EXISTS interview_custom_requests (
        id SERIAL PRIMARY KEY,
        application_id INT,
        candidate_id INT,
        preferred_date VARCHAR(20) NOT NULL,
        preferred_time_slot VARCHAR(30) NOT NULL,
        notes TEXT NOT NULL DEFAULT '',
        status VARCHAR(30) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(
      `INSERT INTO interview_custom_requests
        (application_id, candidate_id, preferred_date, preferred_time_slot, notes, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [appId, req.candidate.id, preferredDate, preferredTimeSlot, notes ?? ""]
    );

    broadcastToAdmin("interview_time_requested", {
      applicationId: appId,
      candidateId: req.candidate.id,
      preferredDate,
      preferredTimeSlot,
    });

    res.status(201).json({ success: true, message: "Custom interview request submitted" });
  } catch (err) {
    console.error("candidate/request-interview-time:", err);
    res.status(500).json({ error: err.message || "Failed to submit request" });
  }
});

export default router;
