/**
 * Event multi-language helpers (mirrors partners pattern).
 */

import { db } from "../config/db.js";
import {
  translateTitle,
  translateHtml,
  looksLikeEnglishText,
} from "./translateService.js";
import { ensureArticleLanguageTables } from "../routes/articleLanguageRoutes.js";

async function getLanguageByCode(code) {
  const [rows] = await db.query(
    `SELECT id, code, name FROM languages WHERE LOWER(code) = ? LIMIT 1`,
    [String(code).toLowerCase()]
  );
  return rows[0] || null;
}

function looksUntranslatedText(code, text) {
  const body = String(text || "").trim();
  if (!body) return true;

  const latin = (body.match(/[A-Za-z]/g) || []).length;
  const cjk = (body.match(/[\u4E00-\u9FFF]/g) || []).length;
  const hindi = (body.match(/[\u0900-\u097F]/g) || []).length;
  const tamil = (body.match(/[\u0B80-\u0BFF]/g) || []).length;

  if (code === "zh") {
    if (cjk < 8) return true;
    if (latin > Math.max(20, cjk)) return true;
    return false;
  }
  if (code === "hi") {
    if (hindi < 8) return true;
    if (latin > Math.max(20, hindi)) return true;
    return false;
  }
  if (code === "ta") {
    if (tamil < 8) return true;
    if (latin > Math.max(20, tamil)) return true;
    return false;
  }
  if (code === "ms") {
    return false;
  }
  return false;
}

export async function ensureEventLanguageTables() {
  await ensureArticleLanguageTables();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS event_language (
      id SERIAL PRIMARY KEY,
      event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      language_id INT NOT NULL REFERENCES languages(id) ON DELETE RESTRICT,
      title TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_event_language UNIQUE (event_id, language_id)
    )
  `);
}

export async function saveEventLocalization(
  eventId,
  languageId,
  { title, description, location }
) {
  await db.query(
    `INSERT INTO event_language
       (event_id, language_id, title, description, location)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (event_id, language_id) DO UPDATE SET
       title = EXCLUDED.title,
       description = EXCLUDED.description,
       location = EXCLUDED.location,
       updated_at = CURRENT_TIMESTAMP`,
    [
      eventId,
      languageId,
      title || "",
      description || "",
      location || "",
    ]
  );
}

async function getEventLocalization(eventId, langCode) {
  const [rows] = await db.query(
    `SELECT el.title, el.description, el.location,
            l.code AS "languageCode", l.id AS "languageId"
     FROM event_language el
     JOIN languages l ON l.id = el.language_id
     WHERE el.event_id = ? AND LOWER(l.code) = ?
     LIMIT 1`,
    [eventId, String(langCode).toLowerCase()]
  );
  return rows[0] || null;
}

async function getEventEnglishSource(eventId) {
  const existing = await getEventLocalization(eventId, "en");
  const existingSample = `${existing?.title || ""} ${existing?.description || ""}`;
  if (existing && looksLikeEnglishText(existingSample)) {
    return {
      title: existing.title || "",
      description: existing.description || "",
      location: existing.location || "",
    };
  }

  const [rows] = await db.query(
    `SELECT title, description, location FROM events WHERE id = ? LIMIT 1`,
    [eventId]
  );
  if (rows.length) {
    const baseSample = `${rows[0].title || ""} ${rows[0].description || ""}`;
    if (looksLikeEnglishText(baseSample)) {
      return {
        title: rows[0].title || "",
        description: rows[0].description || "",
        location: rows[0].location || "",
      };
    }
  }

  const dirty =
    existing ||
    (rows.length
      ? {
          title: rows[0].title || "",
          description: rows[0].description || "",
          location: rows[0].location || "",
        }
      : null);
  if (!dirty || !String(dirty.title || dirty.description || "").trim()) {
    return null;
  }

  console.log(`[translate] event ${eventId}: restoring English from non-English source`);
  const restored = {
    title: await translateTitle(dirty.title || "", "en"),
    description: await translateHtml(dirty.description || "", "en"),
    location: await translateTitle(dirty.location || "", "en"),
  };

  const enLang = await getLanguageByCode("en");
  if (enLang) {
    await saveEventLocalization(eventId, enLang.id, restored);
    await db.query(
      `UPDATE events
       SET title = ?, description = ?, location = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [restored.title, restored.description, restored.location, eventId]
    );
  }

  return restored;
}

async function translateEventFields(source, code) {
  const title = await translateTitle(source.title || "", code);
  await new Promise((r) => setTimeout(r, 80));
  const description = await translateHtml(source.description || "", code);
  await new Promise((r) => setTimeout(r, 80));
  const location = await translateTitle(source.location || "", code);
  return { title, description, location };
}

export async function ensureEventTranslation(
  eventId,
  targetLangCode,
  { force = false } = {}
) {
  await ensureEventLanguageTables();
  const code = String(targetLangCode || "en").toLowerCase().split("-")[0];
  const lang = await getLanguageByCode(code);
  if (!lang) throw new Error(`Language not found: ${code}`);

  const source = await getEventEnglishSource(eventId);
  if (!source) throw new Error("Event not found");

  if (code === "en") {
    await saveEventLocalization(eventId, lang.id, source);
    return { ...source, languageCode: "en", languageId: lang.id, translated: false };
  }

  const existing = await getEventLocalization(eventId, code);
  const sample = `${existing?.description || ""} ${existing?.title || ""}`;
  const hasUsable =
    existing &&
    String(existing.title || "").trim() &&
    !looksUntranslatedText(code, sample);

  if (!force && hasUsable) {
    return {
      title: existing.title || "",
      description: existing.description || "",
      location: existing.location || "",
      languageCode: code,
      languageId: lang.id,
      translated: false,
    };
  }

  if (!String(source.title || source.description || "").trim()) {
    throw new Error("No English source content to translate");
  }

  console.log(`[translate] event ${eventId}: en → ${code}`);
  const translated = await translateEventFields(source, code);
  await saveEventLocalization(eventId, lang.id, translated);
  return {
    ...translated,
    languageCode: code,
    languageId: lang.id,
    translated: true,
  };
}

export async function localizeEvents(list, langCode) {
  const code = String(langCode || "en").toLowerCase().split("-")[0];
  if (!code || code === "en" || !Array.isArray(list) || !list.length) return list;

  await ensureEventLanguageTables();
  const ids = list.map((e) => e.id).filter(Boolean);
  if (!ids.length) return list;

  const placeholders = ids.map(() => "?").join(", ");
  const [rows] = await db.query(
    `SELECT el.event_id AS id, el.title, el.description, el.location
     FROM event_language el
     JOIN languages l ON l.id = el.language_id
     WHERE LOWER(l.code) = ? AND el.event_id IN (${placeholders})`,
    [code, ...ids]
  );
  const byId = new Map(rows.map((r) => [r.id, r]));

  return list.map((e) => {
    const loc = byId.get(e.id);
    if (!loc) return e;
    return {
      ...e,
      title: loc.title || e.title,
      description: loc.description ?? e.description,
      location: loc.location || e.location,
    };
  });
}
