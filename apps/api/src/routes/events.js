import { Router } from "express";
import { db } from "../config/db.js";
import { requireAdmin } from "../middlewares/auth.js";
import fs from "fs";
import { addPublicSSEClient, broadcastToPublic } from "../lib/sse.js";
import { sendSubscriberNotification } from "../lib/email.js";

const router = Router();

let eventStoragePromise;

const logFile =
  "c:/Users/Madhavi Latha/OneDrive/Netopsys Projects/Wings-Project/api_debug.log";

function log(msg) {
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
}

function parsePhotoUrls(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/* ================= FIXED DB CALL ================= */
async function detectEventStorage() {
  if (!eventStoragePromise) {
    eventStoragePromise = (async () => {
      const [columns] = await db.query(
        "SHOW COLUMNS FROM events"
      );

      const names = new Set(columns.map((c) => c.Field));

      return {
        photoUrls: names.has("photoUrls") ? "photoUrls" : "photo_urls",
        eventDate: names.has("eventDate") ? "eventDate" : "event_date",
        registrationUrl: names.has("registrationUrl")
          ? "registrationUrl"
          : "registration_url",
        showDonationButton: names.has("showDonationButton")
          ? "showDonationButton"
          : "show_donation_button",
        isPublished: names.has("isPublished")
          ? "isPublished"
          : "is_published",
        createdAt: names.has("createdAt") ? "createdAt" : "created_at",
        updatedAt: names.has("updatedAt") ? "updatedAt" : "updated_at",
        price: names.has("price") ? "price" : "event_price",
      };
    })();
  }

  return eventStoragePromise;
}

/* ================= NORMALISE ================= */
function normaliseEvent(row, storage) {
  return {
    id: row.id,
    title: row.title ?? "",
    description: row.description ?? "",
    photoUrls: parsePhotoUrls(row[storage.photoUrls]),
    eventDate: row[storage.eventDate] ?? null,
    location: row.location ?? "",
    price: row[storage.price] ?? "",
    registrationUrl: row[storage.registrationUrl] ?? "",
    showDonationButton: Boolean(row[storage.showDonationButton]),
    isPublished: Boolean(row[storage.isPublished]),
    createdAt: row[storage.createdAt] ?? null,
    updatedAt: row[storage.updatedAt] ?? null,
  };
}

/* ================= BUILD ================= */
function buildPayload(body, storage) {
  return {
    title: body.title ?? "",
    description: body.description ?? "",
    [storage.photoUrls]: JSON.stringify(body.photoUrls || []),
    [storage.eventDate]: body.eventDate || null,
    location: body.location ?? "",
    price: body.price ?? "",
    [storage.registrationUrl]: body.registrationUrl ?? "",
    [storage.showDonationButton]: body.showDonationButton ? 1 : 0,
    [storage.isPublished]: body.isPublished ? 1 : 0,
  };
}

/* ================= PUBLIC EVENTS ================= */
router.get("/events", async (_req, res) => {
  try {
    const storage = await detectEventStorage();

    const [rows] = await db.query(
      `SELECT * FROM events
       ORDER BY ${storage.eventDate} DESC, id DESC`
    );

    res.json(rows.map((r) => normaliseEvent(r, storage)));
  } catch (err) {
    log(err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ================= SSE ================= */
router.get("/events/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write("event: connected\ndata: {}\n\n");

  addPublicSSEClient(res);

  const hb = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
    } catch {
      clearInterval(hb);
    }
  }, 25000);

  req.on("close", () => clearInterval(hb));
});

/* ================= ADMIN GET ================= */
router.get("/admin/events", requireAdmin, async (_req, res) => {
  try {
    const storage = await detectEventStorage();

    const [rows] = await db.query(
      `SELECT * FROM events
       ORDER BY ${storage.createdAt} DESC, id DESC`
    );

    res.json(rows.map((r) => normaliseEvent(r, storage)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= CREATE ================= */
router.post("/admin/events", requireAdmin, async (req, res) => {
  try {
    const storage = await detectEventStorage();
    const payload = buildPayload(req.body, storage);

    const cols = Object.keys(payload);
    const vals = Object.values(payload);

    const [result] = await db.query(
      `INSERT INTO events (${cols.join(",")})
       VALUES (${cols.map(() => "?").join(",")})`,
      vals
    );

    const [rows] = await db.query(
      "SELECT * FROM events WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json(normaliseEvent(rows[0], storage));

    // Notify subscribers if the event is published
    if (req.body.isPublished) {
      sendSubscriberNotification("event", normaliseEvent(rows[0], storage)).catch((err) =>
        console.error("[Email] Event subscriber notification failed:", err?.message)
      );
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= UPDATE ================= */
router.put("/admin/events/:id", requireAdmin, async (req, res) => {
  try {
    const storage = await detectEventStorage();

    // Detect if event is being newly published
    const [prevRows] = await db.query(
      `SELECT ${storage.isPublished} AS wasPublished FROM events WHERE id = ?`,
      [req.params.id]
    );
    const wasPublished = prevRows[0] ? Boolean(prevRows[0].wasPublished) : false;

    const payload = buildPayload(req.body, storage);
    payload[storage.updatedAt] = new Date();

    await db.query(
      "UPDATE events SET ? WHERE id = ?",
      [payload, req.params.id]
    );

    const [rows] = await db.query(
      "SELECT * FROM events WHERE id = ?",
      [req.params.id]
    );

    const updated = normaliseEvent(rows[0], storage);
    res.json(updated);

    // Notify subscribers only when event is newly published
    if (!wasPublished && req.body.isPublished) {
      sendSubscriberNotification("event", updated).catch((err) =>
        console.error("[Email] Event subscriber notification failed:", err?.message)
      );
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= DELETE ================= */
router.delete("/admin/events/:id", requireAdmin, async (req, res) => {
  try {
    await db.query("DELETE FROM events WHERE id = ?", [req.params.id]);

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;