import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import "./config/env.js";
import { getCandidatePortalOrigin } from "./lib/candidatePortalLinks.js";

import eventsRouter from "./routes/events.js";
import authRouter from "./routes/auth.js";
import teamRouter from "./routes/team.js";
import uploadRouter from "./routes/upload.js";
import articlesRouter from "./routes/articles.js";
import jobsRouter from "./routes/jobs.js";
import appointmentRouter from "./routes/appointment.js";
import volunteersRouter from "./routes/volunteers.js";
import counsellingTypesRouter from "./routes/counsellingTypes.js";
import applicationsRouter from "./routes/applications.js";
import emailRecipientsRouter from "./routes/emailRecipients.js";
import formSubmissionEmailsRouter from "./routes/formSubmissionEmails.js";
import candidatesRouter from "./routes/candidates.js";
import { db } from "./config/db.js";
import { requireAdmin } from "./middlewares/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
import fs from "fs";

// Debug logging middleware
app.use((req, res, next) => {
  try {
    fs.appendFileSync("c:/Users/Madhavi Latha/OneDrive/Netopsys Projects/Wings-Project/api_debug.log", `[${new Date().toISOString()}] ${req.method} ${req.url}\n`);
  } catch (e) { }
  next();
});

const PORT = process.env.PORT || 5001;

const isProduction = process.env.NODE_ENV === "production";

// In development, allow any origin (localhost, LAN IP, etc.).
// Passing Error to the CORS callback causes Express to respond with 500.
app.use(
  cors({
    origin: isProduction
      ? (origin, callback) => {
          if (!origin) {
            callback(null, true);
            return;
          }

          const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(
            origin
          );

          const allowedOrigins = new Set([
            process.env.ADMIN_APP_ORIGIN,
            process.env.PUBLIC_APP_ORIGIN,
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:8080",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:8080",
          ].filter(Boolean));

          if (isLocalhost || allowedOrigins.has(origin)) {
            callback(null, true);
            return;
          }

          console.warn(`Blocked CORS request from: ${origin}`);
          callback(null, false);
        }
      : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const uploadsPath = path.resolve(__dirname, "../uploads");
app.use("/api/uploads", express.static(uploadsPath));

// Add a test endpoint to verify API is working
app.get("/api/test", (_req, res) => {
  res.json({
    message: "API is working!",
    timestamp: new Date(),
    endpoints: {
      articles: "/api/articles",
      health: "/api/health"
    }
  });
});

// Add health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "OK",
    server: "Running",
    timestamp: new Date()
  });
});

app.get("/", (_req, res) => {
  res.send("API Running Successfully");
});

app.use("/api", authRouter);
app.use("/api", eventsRouter);
app.use("/api", teamRouter);
app.use("/api", articlesRouter);
app.use("/api", jobsRouter);
app.use("/api", uploadRouter);
app.use("/api", applicationsRouter);
app.use("/api", candidatesRouter);
app.use("/api", emailRecipientsRouter);
app.use("/api", formSubmissionEmailsRouter);
app.use("/api/appointments", appointmentRouter);
app.use("/api/volunteers", volunteersRouter);
app.use("/api/counselling-types", counsellingTypesRouter);
const DEFAULT_INTERVIEW_SLOT_SETTINGS = [
  { round: 1, timeSlot: "07:30", isActive: true },
  { round: 1, timeSlot: "08:30", isActive: true },
  { round: 1, timeSlot: "09:30", isActive: false },
  { round: 1, timeSlot: "10:30", isActive: false },
  { round: 1, timeSlot: "11:30", isActive: true },
  { round: 1, timeSlot: "13:30", isActive: true },
  { round: 1, timeSlot: "14:30", isActive: true },
  { round: 1, timeSlot: "15:30", isActive: false },
  { round: 2, timeSlot: "07:30", isActive: true },
  { round: 2, timeSlot: "09:30", isActive: true },
  { round: 2, timeSlot: "11:30", isActive: true },
  { round: 2, timeSlot: "13:30", isActive: true },
  { round: 2, timeSlot: "15:30", isActive: true },
  { round: 3, timeSlot: "07:30", isActive: true },
  { round: 3, timeSlot: "08:30", isActive: true },
  { round: 3, timeSlot: "09:30", isActive: true },
  { round: 3, timeSlot: "10:30", isActive: true },
  { round: 3, timeSlot: "11:30", isActive: true },
  { round: 3, timeSlot: "13:30", isActive: true },
  { round: 3, timeSlot: "14:30", isActive: true },
  { round: 3, timeSlot: "15:30", isActive: true },
];

const DEFAULT_INTERVIEW_SLOT_KEYS = new Set(
  DEFAULT_INTERVIEW_SLOT_SETTINGS.map((slot) => `${slot.round}:${slot.timeSlot}`)
);

async function ensureInterviewCalendarTables() {
  const ensureColumn = async (tableName, columnName, definition) => {
    const [rows] = await db.execute(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = ?
         AND COLUMN_NAME = ?`,
      [tableName, columnName]
    );

    if (!rows.length) {
      await db.execute(`ALTER TABLE ${tableName} ADD COLUMN ${definition}`);
    }
  };

  await db.execute(`
    CREATE TABLE IF NOT EXISTS interview_dates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      date VARCHAR(20) NOT NULL UNIQUE,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS interview_slot_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      round_number INT NOT NULL,
      time_slot VARCHAR(30) NOT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_round_time_slot (round_number, time_slot)
    )
  `);

  const [slotColumns] = await db.execute(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'interview_slot_settings'`
  );
  const slotColumnNames = new Set(slotColumns.map((row) => row.COLUMN_NAME));

  if (slotColumnNames.has('round') && !slotColumnNames.has('round_number')) {
    await db.execute(
      `ALTER TABLE interview_slot_settings
       CHANGE COLUMN round round_number INT NOT NULL`
    );
  }

  await ensureColumn(
    "interview_slot_settings",
    "created_at",
    "created_at DATETIME DEFAULT CURRENT_TIMESTAMP"
  );
  await ensureColumn(
    "interview_slot_settings",
    "updated_at",
    "updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
  );

  const [slotIndexes] = await db.execute(
    `SELECT INDEX_NAME
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'interview_slot_settings'
       AND NON_UNIQUE = 0
       AND INDEX_NAME = 'uq_round_time_slot'`
  );
  if (!slotIndexes.length) {
    await db.execute(
      `ALTER TABLE interview_slot_settings
       ADD UNIQUE KEY uq_round_time_slot (round_number, time_slot)`
    );
  }

  const [dateColumns] = await db.execute(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'interview_dates'`
  );
  const dateColumnNames = new Set(dateColumns.map((row) => row.COLUMN_NAME));

  if (!dateColumnNames.has("created_at")) {
    await db.execute(
      `ALTER TABLE interview_dates
       ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP`
    );
  }

  if (!dateColumnNames.has("updated_at")) {
    await db.execute(
      `ALTER TABLE interview_dates
       ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
    );
  }

  for (const slot of DEFAULT_INTERVIEW_SLOT_SETTINGS) {
    await db.execute(
      `INSERT INTO interview_slot_settings (round_number, time_slot, is_active)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE is_active = VALUES(is_active), updated_at = CURRENT_TIMESTAMP`,
      [slot.round, slot.timeSlot, slot.isActive ? 1 : 0]
    );
  }
}

async function upsertInterviewAvailabilitySlot(slot) {
  const [existingRows] = await db.execute(
    `SELECT id, is_booked AS isBooked
     FROM interview_availability
     WHERE date = ? AND time_slot = ?
     LIMIT 1`,
    [slot.date, slot.timeSlot]
  );

  const interviewerName = slot.interviewerName ?? "";
  const location = slot.location ?? "";
  const meetingLink = slot.meetingLink ?? "";
  const notes = slot.notes ?? "";
  const duration = slot.duration ?? 45;

  if (existingRows.length > 0) {
    const existing = existingRows[0];
    if (!existing.isBooked) {
      await db.execute(
        `UPDATE interview_availability
         SET duration = ?,
             interviewer_name = ?,
             location = ?,
             meeting_link = ?,
             notes = ?
         WHERE id = ?`,
        [duration, interviewerName, location, meetingLink, notes, existing.id]
      );
    }

    return {
      id: existing.id,
      created: false,
      updated: !existing.isBooked,
    };
  }

  const [result] = await db.execute(
    `INSERT INTO interview_availability (date, time_slot, duration, interviewer_name, location, meeting_link, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [slot.date, slot.timeSlot, duration, interviewerName, location, meetingLink, notes]
  );

  return {
    id: result.insertId,
    created: true,
    updated: false,
  };
}

async function ensureInterviewAvailabilityTable() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS interview_availability (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date VARCHAR(20) NOT NULL,
        time_slot VARCHAR(30) NOT NULL,
        duration INT NOT NULL DEFAULT 45,
        interviewer_name TEXT NOT NULL DEFAULT '',
        location TEXT NOT NULL DEFAULT '',
        meeting_link TEXT NOT NULL DEFAULT '',
        notes TEXT NOT NULL DEFAULT '',
        is_booked TINYINT(1) NOT NULL DEFAULT 0,
        booked_application_id INT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (err) {
    if (err?.errno !== 1050) console.error("[DB] interview_availability table:", err?.message);
  }
}

try {
  await ensureInterviewCalendarTables();
  await ensureInterviewAvailabilityTable();
} catch (err) {
  console.error("[DB] interview calendar bootstrap:", err?.message);
}

app.get("/api/admin/interview-availability", requireAdmin, async (_req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, date, time_slot AS timeSlot, duration,
              interviewer_name AS interviewerName,
              location, meeting_link AS meetingLink, notes, is_booked AS isBooked,
              booked_application_id AS bookedApplicationId
       FROM interview_availability ORDER BY date ASC, time_slot ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/interview-availability", requireAdmin, async (req, res) => {
  try {
    const { date, timeSlot, duration = 45, interviewerName = "", location = "", meetingLink = "", notes = "" } = req.body || {};
    if (!date || !timeSlot) return res.status(400).json({ error: "date and timeSlot are required" });
    const result = await upsertInterviewAvailabilitySlot({
      date,
      timeSlot,
      duration,
      interviewerName,
      location,
      meetingLink,
      notes,
    });

    res.status(result.created ? 201 : 200).json({
      id: result.id,
      date,
      timeSlot,
      duration,
      interviewerName,
      location,
      meetingLink,
      notes,
      isBooked: false,
      created: result.created,
      updated: result.updated,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/interview-availability/bulk", requireAdmin, async (req, res) => {
  try {
    const { slots } = req.body || {};
    if (!Array.isArray(slots) || !slots.length) return res.status(400).json({ error: "slots array required" });
    const created = [];
    const updated = [];
    for (const s of slots) {
      if (!s.date || !s.timeSlot) continue;
      const result = await upsertInterviewAvailabilitySlot(s);
      if (result.created) {
        created.push({ id: result.id, ...s });
      } else if (result.updated) {
        updated.push({ id: result.id, ...s });
      }
    }
    res.status(201).json({ created, updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/admin/interview-availability/:id", requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.execute(`SELECT is_booked FROM interview_availability WHERE id = ? LIMIT 1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    if (rows[0].is_booked) return res.status(400).json({ error: "Cannot delete a booked slot" });
    await db.execute(`DELETE FROM interview_availability WHERE id = ?`, [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/interview-custom-requests", requireAdmin, async (_req, res) => {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS interview_custom_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        application_id INT,
        candidate_id INT,
        preferred_date VARCHAR(20) NOT NULL,
        preferred_time_slot VARCHAR(30) NOT NULL,
        notes TEXT NOT NULL DEFAULT '',
        status VARCHAR(30) NOT NULL DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});
    const [rows] = await db.execute(
      `SELECT r.id, r.application_id AS applicationId, r.preferred_date AS preferredDate,
              r.preferred_time_slot AS preferredTimeSlot, r.notes, r.status, r.created_at AS createdAt,
              CONCAT(c.first_name, ' ', c.last_name) AS candidateName, c.email AS candidateEmail,
              ja.application_number AS applicationNumber, jp.title AS jobTitle
       FROM interview_custom_requests r
       LEFT JOIN candidates c ON c.id = r.candidate_id
       LEFT JOIN job_applications ja ON ja.id = r.application_id
       LEFT JOIN job_postings jp ON jp.id = ja.job_id
       ORDER BY r.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: Users (backed by candidates table) ──────────────────────────────
// Ensure is_blocked column exists
(async () => {
  try {
    await db.execute("ALTER TABLE candidates ADD COLUMN is_blocked TINYINT(1) NOT NULL DEFAULT 0");
  } catch (err) {
    if (err?.errno !== 1060) console.error("[DB] is_blocked column:", err?.message);
  }
})();

function mapCandidateToUser(row) {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    mobileNumber: row.phone ?? "",
    emailVerified: Boolean(row.phone_verified),
    isBlocked: Boolean(row.is_blocked),
    createdAt: row.created_at ?? null,
  };
}

app.get("/api/admin/users", requireAdmin, async (_req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT id, email, first_name, last_name, phone, phone_verified, is_blocked, created_at FROM candidates ORDER BY created_at DESC"
    );
    res.json(rows.map(mapCandidateToUser));
  } catch (err) {
    console.error("/admin/users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.get("/api/admin/users/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await db.execute(
      "SELECT id, email, first_name, last_name, phone, phone_verified, is_blocked, created_at FROM candidates WHERE id = ? LIMIT 1",
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: "User not found" });

    let applications = [];
    try {
      const [appRows] = await db.execute(
        `SELECT ja.id, ja.status, ja.submitted_at AS createdAt,
                jp.title AS jobTitle, jp.job_id AS jobIdCode
         FROM job_applications ja
         LEFT JOIN job_postings jp ON jp.id = ja.job_id
         WHERE ja.candidate_id = ? ORDER BY ja.submitted_at DESC`,
        [id]
      );
      applications = appRows;
    } catch { /* applications table may not exist */ }

    res.json({ user: mapCandidateToUser(rows[0]), profile: null, certifications: [], workExperience: [], applications });
  } catch (err) {
    console.error("/admin/users/:id:", err);
    res.status(500).json({ error: "Failed to fetch user details" });
  }
});

app.patch("/api/admin/users/:id/block", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { isBlocked } = req.body ?? {};
    await db.execute("UPDATE candidates SET is_blocked = ? WHERE id = ?", [isBlocked ? 1 : 0, id]);
    res.json({ success: true });
  } catch (err) {
    console.error("/admin/users/:id/block:", err);
    res.status(500).json({ error: "Failed to update user status" });
  }
});

// ── Admin: Interview dates ─────────────────────────────────────────────────
app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [candidateRows] = await connection.execute(
      "SELECT id FROM candidates WHERE id = ? LIMIT 1",
      [id]
    );

    if (!candidateRows.length) {
      await connection.rollback();
      return res.status(404).json({ error: "User not found" });
    }

    const [applicationRows] = await connection.execute(
      "SELECT id FROM job_applications WHERE candidate_id = ?",
      [id]
    );
    const applicationIds = applicationRows.map((row) => row.id);

    if (applicationIds.length > 0) {
      const placeholders = applicationIds.map(() => "?").join(", ");

      await connection.execute(
        `DELETE aa
         FROM application_answers aa
         INNER JOIN application_questions aq ON aq.id = aa.question_id
         WHERE aq.application_id IN (${placeholders})`,
        applicationIds
      );

      await connection.execute(
        `DELETE FROM application_questions
         WHERE application_id IN (${placeholders})`,
        applicationIds
      );

      await connection.execute(
        `DELETE FROM interview_slots
         WHERE application_id IN (${placeholders})`,
        applicationIds
      );

      await connection.execute(
        `DELETE FROM interview_bookings
         WHERE application_id IN (${placeholders})`,
        applicationIds
      );

      await connection.execute(
        `DELETE FROM interview_custom_requests
         WHERE application_id IN (${placeholders})`,
        applicationIds
      );

      await connection.execute(
        `DELETE FROM mcq_sessions
         WHERE application_id IN (${placeholders})`,
        applicationIds
      );

      await connection.execute(
        `UPDATE interview_availability
         SET booked_application_id = NULL
         WHERE booked_application_id IN (${placeholders})`,
        applicationIds
      );

      await connection.execute(
        "DELETE FROM job_applications WHERE candidate_id = ?",
        [id]
      );
    }

    await connection.execute("DELETE FROM candidates WHERE id = ?", [id]);
    await connection.commit();
    return res.json({ success: true });
  } catch (err) {
    await connection.rollback().catch(() => {});
    console.error("/admin/users/:id DELETE:", err);
    return res.status(500).json({ error: "Failed to delete user" });
  } finally {
    connection.release();
  }
});
app.get("/api/admin/interview-bookings", requireAdmin, async (_req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT ia.id,
              ia.date,
              ia.time_slot AS timeSlot,
              ia.duration,
              ia.interviewer_name AS interviewerName,
              ia.location,
              ia.meeting_link AS meetingLink,
              ia.notes,
              ia.booked_application_id AS bookedApplicationId,
              ia.created_at AS createdAt,
              ja.application_number AS applicationNumber,
              CONCAT(c.first_name, ' ', c.last_name) AS candidateName,
              c.email AS candidateEmail,
              jp.title AS jobTitle,
              jp.job_id AS jobIdCode
       FROM interview_availability ia
       LEFT JOIN job_applications ja ON ja.id = ia.booked_application_id
       LEFT JOIN candidates c ON c.id = ja.candidate_id
       LEFT JOIN careers ca ON ca.id = ja.job_id
       LEFT JOIN job_postings jp ON jp.job_id = ca.job_id COLLATE utf8mb4_unicode_ci
       WHERE ia.is_booked = 1
       ORDER BY ia.date DESC, ia.time_slot DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/interview-dates", requireAdmin, async (_req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id,
              date AS availableDate,
              is_active AS isActive,
              created_at AS createdAt,
              updated_at AS updatedAt
       FROM interview_dates
       ORDER BY date ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/admin/interview-dates/toggle", requireAdmin, async (req, res) => {
  try {
    const { date, isActive } = req.body || {};
    if (!date) return res.status(400).json({ error: "date is required" });

    await db.execute(
      `INSERT INTO interview_dates (date, is_active)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE is_active = VALUES(is_active), updated_at = CURRENT_TIMESTAMP`,
      [date, isActive ? 1 : 0]
    );

    const [rows] = await db.execute(
      `SELECT id,
              date AS availableDate,
              is_active AS isActive,
              created_at AS createdAt,
              updated_at AS updatedAt
       FROM interview_dates
       WHERE date = ?
       LIMIT 1`,
      [date]
    );

    res.json(rows[0] || { availableDate: date, isActive: Boolean(isActive) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/interview-dates/bulk-update", requireAdmin, async (req, res) => {
  try {
    const { dates, isActive } = req.body || {};
    if (!Array.isArray(dates) || !dates.length) {
      return res.status(400).json({ error: "dates array is required" });
    }

    const updatedDates = [];
    for (const date of dates) {
      if (!date) continue;
      await db.execute(
        `INSERT INTO interview_dates (date, is_active)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE is_active = VALUES(is_active), updated_at = CURRENT_TIMESTAMP`,
        [date, isActive ? 1 : 0]
      );
      updatedDates.push(date);
    }

    res.status(201).json({ ok: true, dates: updatedDates, isActive: Boolean(isActive) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/admin/interview-dates/:id", requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.execute(`SELECT id FROM interview_dates WHERE id = ? LIMIT 1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    await db.execute(`DELETE FROM interview_dates WHERE id = ?`, [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/slot-settings", requireAdmin, async (_req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id,
              round_number AS round,
              time_slot AS timeSlot,
              is_active AS isActive
       FROM interview_slot_settings
       ORDER BY round_number ASC, time_slot ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/admin/slot-settings/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { isActive } = req.body || {};
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid slot id" });

    const [existing] = await db.execute(`SELECT id FROM interview_slot_settings WHERE id = ? LIMIT 1`, [id]);
    if (!existing.length) return res.status(404).json({ error: "Not found" });

    await db.execute(
      `UPDATE interview_slot_settings
       SET is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [isActive ? 1 : 0, id]
    );

    const [rows] = await db.execute(
      `SELECT id,
              round_number AS round,
              time_slot AS timeSlot,
              is_active AS isActive
       FROM interview_slot_settings
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    res.json(rows[0] || { id, isActive: Boolean(isActive) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: Notifications ───────────────────────────────────────────────────
app.get("/api/admin/notifications", requireAdmin, (_req, res) => res.json([]));
app.get("/api/admin/notifications/unread", requireAdmin, (_req, res) => res.json({ count: 0 }));
app.patch("/api/admin/notifications/:id/read", requireAdmin, (_req, res) => res.json({ ok: true }));
app.post("/api/admin/notifications/read-all", requireAdmin, (_req, res) => res.json({ ok: true }));

// ── Admin: Categories (alias for /api/categories) ─────────────────────────
app.get("/api/categories", async (_req, res) => {
  try {
    const [rows] = await db.execute("SELECT id, name, description FROM job_categories ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});
app.post("/api/categories", requireAdmin, async (req, res) => {
  try {
    const { name, description = null } = req.body || {};
    if (!name) return res.status(400).json({ error: "Category name is required" });
    const [result] = await db.execute("INSERT INTO job_categories (name, description) VALUES (?, ?)", [name, description]);
    res.status(201).json({ id: result.insertId, name, description });
  } catch (err) {
    res.status(500).json({ error: "Failed to create category" });
  }
});
app.patch("/api/categories/:id", requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body || {};
    const updates = []; const params = [];
    if (name !== undefined) { updates.push("name = ?"); params.push(name); }
    if (description !== undefined) { updates.push("description = ?"); params.push(description); }
    if (!updates.length) return res.status(400).json({ error: "No fields to update" });
    params.push(req.params.id);
    await db.execute(`UPDATE job_categories SET ${updates.join(", ")} WHERE id = ?`, params);
    const [rows] = await db.execute("SELECT id, name, description FROM job_categories WHERE id = ?", [req.params.id]);
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: "Failed to update category" });
  }
});
app.delete("/api/categories/:id", requireAdmin, async (req, res) => {
  try {
    await db.execute("DELETE FROM job_categories WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete category" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 API URL: http://localhost:${PORT}/api`);
  console.log(`📝 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`📰 Articles endpoint: http://localhost:${PORT}/api/articles`);
  console.log(`📧 Candidate portal origin: ${getCandidatePortalOrigin()}`);
});

