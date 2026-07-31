import { Router } from "express";
import { db, getTableColumns } from "../config/db.js";
import { requireAdmin } from "../middlewares/auth.js";
import fs from "fs";
import { addPublicSSEClient, broadcastToPublic } from "../lib/sse.js";
import { sendSubscriberNotification } from "../lib/email.js";
import {
  ensureEventLanguageTables,
  localizeEvents,
  saveEventLocalization,
} from "../services/eventTranslate.js";
import { looksLikeEnglishText } from "../services/translateService.js";

const router = Router();

function normalizeLangCode(value) {
  return String(value || "en")
    .toLowerCase()
    .split("-")[0];
}

async function getLanguageIdByCode(code) {
  const [rows] = await db.query(
    `SELECT id FROM languages WHERE LOWER(code) = ? LIMIT 1`,
    [normalizeLangCode(code)]
  );
  return rows[0]?.id || null;
}

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
      const columns = await getTableColumns("events");
      const names = new Set(columns);

      return {
        photoUrls: names.has("photourls") ? "photoUrls" : "photo_urls",
        eventDate: names.has("eventdate") ? "eventDate" : "event_date",
        registrationUrl: names.has("registrationurl")
          ? "registrationUrl"
          : "registration_url",
        showDonationButton: names.has("showdonationbutton")
          ? "showDonationButton"
          : "show_donation_button",
        isPublished: names.has("ispublished")
          ? "isPublished"
          : "is_published",
        createdAt: names.has("createdat") ? "createdAt" : "created_at",
        updatedAt: names.has("updatedat") ? "updatedAt" : "updated_at",
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
    [storage.showDonationButton]: Boolean(body.showDonationButton),
    [storage.isPublished]: Boolean(body.isPublished),
  };
}

/* ================= PUBLIC EVENTS ================= */
router.get("/events", async (req, res) => {
  try {
    const storage = await detectEventStorage();
    const lang = normalizeLangCode(req.query.lang || "en");

    const [rows] = await db.query(
      `SELECT * FROM events
       ORDER BY ${storage.eventDate} DESC, id DESC`
    );

    let list = rows.map((r) => normaliseEvent(r, storage));
    if (lang && lang !== "en") {
      try {
        list = await localizeEvents(list, lang);
      } catch (err) {
        console.warn("[events] localize:", err?.message);
      }
    }

    res.json(list);
  } catch (err) {
    log(err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ================= SSE ================= */
router.get("/events/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  req.socket.setTimeout(0);
  req.socket.setNoDelay(true);
  req.socket.setKeepAlive(true);

  res.flushHeaders?.();

  if (!res.destroyed && !res.writableEnded) {
    res.write("event: connected\ndata: {}\n\n");
  }

  addPublicSSEClient(res);

  const hb = setInterval(() => {
    if (res.destroyed || res.writableEnded) {
      clearInterval(hb);
      return;
    }

    try {
      res.write(": heartbeat\n\n");
    } catch {
      clearInterval(hb);
    }
  }, 25000);

  req.on("close", () => {
    clearInterval(hb);
  });
});

/* ================= ADMIN GET ================= */
router.get("/admin/events", requireAdmin, async (req, res) => {
  try {
    const storage = await detectEventStorage();
    const lang = normalizeLangCode(req.query.lang || "en");

    const [rows] = await db.query(
      `SELECT * FROM events
       ORDER BY ${storage.createdAt} DESC, id DESC`
    );

    let list = rows.map((r) => normaliseEvent(r, storage));
    if (lang && lang !== "en") {
      try {
        list = await localizeEvents(list, lang);
      } catch (err) {
        console.warn("[events] admin localize:", err?.message);
      }
    }

    res.json(list);
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

    let languageId = req.body.language_id ? Number(req.body.language_id) : null;
    if (!languageId && req.body.language_code) {
      languageId = await getLanguageIdByCode(req.body.language_code);
    }
    if (!languageId) languageId = await getLanguageIdByCode("en");

    if (languageId) {
      try {
        await ensureEventLanguageTables();
        await saveEventLocalization(result.insertId, languageId, {
          title: payload.title,
          description: payload.description,
          location: payload.location,
        });
      } catch (err) {
        console.warn("[events] save localization:", err?.message);
      }
    }

    const [rows] = await db.query(
      "SELECT * FROM events WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json(normaliseEvent(rows[0], storage));

    // Notify subscribers if the event is published
    const created = normaliseEvent(rows[0], storage);
    if (created.isPublished) {
      sendSubscriberNotification("event", created).catch((err) =>
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

    let languageId = req.body.language_id ? Number(req.body.language_id) : null;
    let langCode = req.body.language_code
      ? normalizeLangCode(req.body.language_code)
      : null;
    if (languageId && !langCode) {
      const [langRows] = await db.query(
        `SELECT code FROM languages WHERE id = ? LIMIT 1`,
        [languageId]
      );
      langCode = normalizeLangCode(langRows[0]?.code || "en");
    }
    if (!langCode) langCode = "en";
    if (!languageId) languageId = await getLanguageIdByCode(langCode);
    const isEnglish = langCode === "en";
    const englishSample = `${payload.title || ""} ${payload.description || ""}`;
    const canWriteEnglishMaster =
      isEnglish && looksLikeEnglishText(englishSample);

    if (canWriteEnglishMaster) {
      payload[storage.updatedAt] = new Date();
      await db.query("UPDATE events SET ? WHERE id = ?", [
        payload,
        req.params.id,
      ]);
    } else if (isEnglish) {
      // Keep English text; still update photos/date/flags/url
      const partial = {
        [storage.photoUrls]: payload[storage.photoUrls],
        [storage.eventDate]: payload[storage.eventDate],
        [storage.registrationUrl]: payload[storage.registrationUrl],
        [storage.showDonationButton]: payload[storage.showDonationButton],
        [storage.isPublished]: payload[storage.isPublished],
        price: payload.price,
        [storage.updatedAt]: new Date(),
      };
      await db.query("UPDATE events SET ? WHERE id = ?", [
        partial,
        req.params.id,
      ]);
    } else {
      const partial = {
        [storage.photoUrls]: payload[storage.photoUrls],
        [storage.eventDate]: payload[storage.eventDate],
        [storage.registrationUrl]: payload[storage.registrationUrl],
        [storage.showDonationButton]: payload[storage.showDonationButton],
        [storage.isPublished]: payload[storage.isPublished],
        price: payload.price,
        [storage.updatedAt]: new Date(),
      };
      await db.query("UPDATE events SET ? WHERE id = ?", [
        partial,
        req.params.id,
      ]);
    }

    if (languageId && (!isEnglish || canWriteEnglishMaster)) {
      try {
        await ensureEventLanguageTables();
        await saveEventLocalization(Number(req.params.id), languageId, {
          title: payload.title,
          description: payload.description,
          location: payload.location,
        });
      } catch (err) {
        console.warn("[events] update localization:", err?.message);
      }
    }

    const [rows] = await db.query(
      "SELECT * FROM events WHERE id = ?",
      [req.params.id]
    );

    const updated = normaliseEvent(rows[0], storage);
    res.json(updated);

    // Notify subscribers only when event is newly published
    if (!wasPublished && updated.isPublished) {
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