import { Router } from "express";
import { db } from "../config/db.js";
import { requireAdmin } from "../middlewares/auth.js";
import fs from "fs";
import { addPublicSSEClient, broadcastToPublic } from "../lib/sse.js";

const router = Router();

let eventStoragePromise;

/* =========================
   LOG FILE
========================= */
const logFile =
  "c:/Users/Madhavi Latha/OneDrive/Netopsys Projects/Wings-Project/api_debug.log";

function log(msg) {
  fs.appendFileSync(
    logFile,
    `[${new Date().toISOString()}] ${msg}\n`
  );
}

fs.appendFileSync(
  logFile,
  `[${new Date().toISOString()}] Events route module loaded\n`
);

/* =========================
   Parse Photo URLs
========================= */
function parsePhotoUrls(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/* =========================
   Detect DB Column Names
========================= */
async function detectEventStorage() {
  if (!eventStoragePromise) {
    eventStoragePromise = (async () => {
      const [columns] = await db
        .promise()
        .query("SHOW COLUMNS FROM events");

      const names = new Set(
        columns.map((column) => column.Field)
      );

      return {
        photoUrls: names.has("photoUrls")
          ? "photoUrls"
          : "photo_urls",

        eventDate: names.has("eventDate")
          ? "eventDate"
          : "event_date",

        registrationUrl: names.has("registrationUrl")
          ? "registrationUrl"
          : "registration_url",

        showDonationButton: names.has("showDonationButton")
          ? "showDonationButton"
          : "show_donation_button",

        isPublished: names.has("isPublished")
          ? "isPublished"
          : "is_published",

        createdAt: names.has("createdAt")
          ? "createdAt"
          : "created_at",

        updatedAt: names.has("updatedAt")
          ? "updatedAt"
          : "updated_at",

        price: names.has("price")
          ? "price"
          : "event_price",
      };
    })();
  }

  return eventStoragePromise;
}

/* =========================
   Normalize Event
========================= */
function normaliseEvent(row, storage) {
  return {
    id: row.id,

    title: row.title ?? "",

    description: row.description ?? "",

    photoUrls: parsePhotoUrls(
      row[storage.photoUrls]
    ),

    eventDate:
      row[storage.eventDate] ?? null,

    location: row.location ?? "",

    price: row[storage.price] ?? "",

    registrationUrl:
      row[storage.registrationUrl] ?? "",

    showDonationButton: Boolean(
      row[storage.showDonationButton]
    ),

    isPublished: Boolean(
      row[storage.isPublished]
    ),

    createdAt:
      row[storage.createdAt] ?? null,

    updatedAt:
      row[storage.updatedAt] ?? null,
  };
}

/* =========================
   Build Payload
========================= */
function buildPayload(body, storage) {
  return {
    title: body.title ?? "",

    description: body.description ?? "",

    [storage.photoUrls]: JSON.stringify(
      body.photoUrls || []
    ),

    [storage.eventDate]:
      body.eventDate || null,

    location: body.location ?? "",

    price: body.price ?? "",

    [storage.registrationUrl]:
      body.registrationUrl ?? "",

    [storage.showDonationButton]:
      body.showDonationButton ? 1 : 0,

    [storage.isPublished]:
      body.isPublished ? 1 : 0,
  };
}

/* =================================================
   GET ALL EVENTS (PUBLIC)
================================================= */
router.get("/events", async (_req, res) => {
  try {
    log("GET /events called");

    console.log("EVENT API CALLED");

    const storage = await detectEventStorage();

    console.log("STORAGE:", storage);

    const [rows] = await db.promise().query(`
      SELECT * FROM events
      ORDER BY ${storage.eventDate} DESC, id DESC
    `);

    console.log("EVENT ROWS:", rows);

    const events = rows.map((row) =>
      normaliseEvent(row, storage)
    );

    res.json(events);
  } catch (err) {
    log(`ERROR: ${err.message}`);

    console.log("EVENT FETCH ERROR:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

/* =================================================
   SSE STREAM (PUBLIC)
================================================= */
router.get("/events/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Send initial connection message
  res.write("event: connected\ndata: {}\n\n");

  addPublicSSEClient(res);

  // Keep connection alive
  const hb = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
    } catch {
      clearInterval(hb);
    }
  }, 25000);

  req.on("close", () => clearInterval(hb));
});

/* =================================================
   GET ADMIN EVENTS
================================================= */
router.get(
  "/admin/events",
  requireAdmin,
  async (_req, res) => {
    try {
      const storage =
        await detectEventStorage();

      const [rows] = await db.promise().query(`
        SELECT * FROM events
        ORDER BY ${storage.createdAt} DESC, id DESC
      `);

      const events = rows.map((row) =>
        normaliseEvent(row, storage)
      );

      res.json(events);
    } catch (err) {
      console.log(err);

      res.status(500).json({
        error: err.message,
      });
    }
  }
);

/* =================================================
   CREATE EVENT
================================================= */
router.post(
  "/admin/events",
  requireAdmin,
  async (req, res) => {
    try {
      const storage =
        await detectEventStorage();

      log(
        `POST /admin/events: payload size = ${JSON.stringify(req.body).length}`
      );

      const payload = buildPayload(
        req.body,
        storage
      );

      const columns = Object.keys(payload);

      const values = columns.map(
        (column) => payload[column]
      );

      const placeholders = columns
        .map(() => "?")
        .join(", ");

      const [result] = await db.promise().query(
        `
        INSERT INTO events
        (${columns.join(", ")})
        VALUES (${placeholders})
        `,
        values
      );

      const [rows] = await db.promise().query(
        "SELECT * FROM events WHERE id = ?",
        [result.insertId]
      );

      const responseData = normaliseEvent(rows[0], storage);

      broadcastToPublic("event_created", responseData);

      res
        .status(201)
        .json(responseData);
    } catch (err) {
      console.log(err);

      res.status(500).json({
        error: err.message,
      });
    }
  }
);

/* =================================================
   UPDATE EVENT
================================================= */
router.put(
  "/admin/events/:id",
  requireAdmin,
  async (req, res) => {
    try {
      const storage =
        await detectEventStorage();

      log(
        `PUT /admin/events/${req.params.id}: payload size = ${JSON.stringify(req.body).length}`
      );

      const payload = buildPayload(
        req.body,
        storage
      );

      payload[storage.updatedAt] =
        new Date();

      await db.promise().query(
        `
        UPDATE events
        SET ?
        WHERE id = ?
        `,
        [payload, req.params.id]
      );

      const [rows] = await db.promise().query(
        "SELECT * FROM events WHERE id = ?",
        [req.params.id]
      );

      const responseData = normaliseEvent(rows[0], storage);

      broadcastToPublic("event_updated", responseData);

      res.json(responseData);
    } catch (err) {
      console.log(err);

      res.status(500).json({
        error: err.message,
      });
    }
  }
);

/* =================================================
   DELETE EVENT
================================================= */
router.delete(
  "/admin/events/:id",
  requireAdmin,
  async (req, res) => {
    try {
      await db.promise().query(
        "DELETE FROM events WHERE id = ?",
        [req.params.id]
      );

      broadcastToPublic("event_deleted", { id: req.params.id });

      res.json({
        ok: true,
      });
    } catch (err) {
      console.log(err);

      res.status(500).json({
        error: err.message,
      });
    }
  }
);

export default router;