/**
 * Partner (logos table) multi-language helpers.
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
    // Need real Chinese body — a few CJK chars in the name is not enough
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
    // Malay uses Latin script — treat empty / still-English boilerplate as missing
    return /WINGS Counselling Centre is grateful|Together, we are committed/i.test(body);
  }
  return false;
}

export async function ensurePartnerLanguageTables() {
  await ensureArticleLanguageTables();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS partner_language (
      id SERIAL PRIMARY KEY,
      partner_id INT NOT NULL REFERENCES logos(id) ON DELETE CASCADE,
      language_id INT NOT NULL REFERENCES languages(id) ON DELETE RESTRICT,
      name TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      duration TEXT NOT NULL DEFAULT '',
      quote TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_partner_language UNIQUE (partner_id, language_id)
    )
  `);
}

export async function savePartnerLocalization(
  partnerId,
  languageId,
  { name, description, duration, quote }
) {
  await db.query(
    `INSERT INTO partner_language
       (partner_id, language_id, name, description, duration, quote)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (partner_id, language_id) DO UPDATE SET
       name = EXCLUDED.name,
       description = EXCLUDED.description,
       duration = EXCLUDED.duration,
       quote = EXCLUDED.quote,
       updated_at = CURRENT_TIMESTAMP`,
    [
      partnerId,
      languageId,
      name || "",
      description || "",
      duration || "",
      quote || "",
    ]
  );
}

async function getPartnerLocalization(partnerId, langCode) {
  const [rows] = await db.query(
    `SELECT pl.name, pl.description, pl.duration, pl.quote,
            l.code AS "languageCode", l.id AS "languageId"
     FROM partner_language pl
     JOIN languages l ON l.id = pl.language_id
     WHERE pl.partner_id = ? AND LOWER(l.code) = ?
     LIMIT 1`,
    [partnerId, String(langCode).toLowerCase()]
  );
  return rows[0] || null;
}

async function getPartnerEnglishSource(partnerId) {
  const existing = await getPartnerLocalization(partnerId, "en");
  const existingSample = `${existing?.name || ""} ${existing?.description || ""}`;
  if (existing && looksLikeEnglishText(existingSample)) {
    return {
      name: existing.name || "",
      description: existing.description || "",
      duration: existing.duration || "",
      quote: existing.quote || "",
    };
  }

  const [rows] = await db.query(
    `SELECT name, description, duration, quote FROM logos WHERE id = ? LIMIT 1`,
    [partnerId]
  );
  if (rows.length) {
    const baseSample = `${rows[0].name || ""} ${rows[0].description || ""}`;
    if (looksLikeEnglishText(baseSample)) {
      return {
        name: rows[0].name || "",
        description: rows[0].description || "",
        duration: rows[0].duration || "",
        quote: rows[0].quote || "",
      };
    }
  }

  // English was overwritten (e.g. Hindi saved into logos/en). Recover by
  // translating the dirty text back to English with auto source detection.
  const dirty = existing ||
    (rows.length
      ? {
          name: rows[0].name || "",
          description: rows[0].description || "",
          duration: rows[0].duration || "",
          quote: rows[0].quote || "",
        }
      : null);
  if (!dirty || !String(dirty.name || dirty.description || "").trim()) {
    return null;
  }

  console.log(`[translate] partner ${partnerId}: restoring English from non-English source`);
  const restored = {
    name: await translateTitle(dirty.name || "", "en"),
    description: await translateHtml(dirty.description || "", "en"),
    duration: await translateTitle(dirty.duration || "", "en"),
    quote: await translateHtml(dirty.quote || "", "en"),
  };

  const enLang = await getLanguageByCode("en");
  if (enLang) {
    await savePartnerLocalization(partnerId, enLang.id, restored);
    await db.query(
      `UPDATE logos
       SET name = ?, description = ?, duration = ?, quote = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        restored.name,
        restored.description,
        restored.duration,
        restored.quote,
        partnerId,
      ]
    );
  }

  return restored;
}

async function translatePartnerFields(source, code) {
  // Sequential — parallel Google calls often fail for zh/ms under rate limits
  const name = await translateTitle(source.name || "", code);
  await new Promise((r) => setTimeout(r, 100));
  const description = await translateHtml(source.description || "", code);
  await new Promise((r) => setTimeout(r, 100));
  const duration = await translateTitle(source.duration || "", code);
  await new Promise((r) => setTimeout(r, 100));
  const quote = await translateHtml(source.quote || "", code);
  return { name, description, duration, quote };
}

export async function ensurePartnerTranslation(
  partnerId,
  targetLangCode,
  { force = false } = {}
) {
  await ensurePartnerLanguageTables();
  const code = String(targetLangCode || "en").toLowerCase().split("-")[0];
  const lang = await getLanguageByCode(code);
  if (!lang) throw new Error(`Language not found: ${code}`);

  const source = await getPartnerEnglishSource(partnerId);
  if (!source) throw new Error("Partner not found");

  if (code === "en") {
    await savePartnerLocalization(partnerId, lang.id, source);
    return { ...source, languageCode: "en", languageId: lang.id, translated: false };
  }

  const existing = await getPartnerLocalization(partnerId, code);
  // Prefer description+quote for quality check — name alone can have a few CJK chars
  const sample = `${existing?.description || ""} ${existing?.quote || ""} ${existing?.name || ""}`;
  const hasUsable =
    existing &&
    String(existing.name || "").trim() &&
    String(existing.description || existing.quote || "").trim() &&
    !looksUntranslatedText(code, sample);

  if (!force && hasUsable) {
    return {
      name: existing.name || "",
      description: existing.description || "",
      duration: existing.duration || "",
      quote: existing.quote || "",
      languageCode: code,
      languageId: lang.id,
      translated: false,
    };
  }

  if (!String(source.name || source.description || source.quote || "").trim()) {
    throw new Error("No English source content to translate");
  }

  console.log(`[translate] partner ${partnerId}: en → ${code}`);
  const translated = await translatePartnerFields(source, code);
  await savePartnerLocalization(partnerId, lang.id, translated);
  return {
    ...translated,
    languageCode: code,
    languageId: lang.id,
    translated: true,
  };
}

export async function localizePartners(list, langCode) {
  const code = String(langCode || "en").toLowerCase().split("-")[0];
  if (!code || code === "en" || !Array.isArray(list) || !list.length) return list;

  await ensurePartnerLanguageTables();
  const ids = list.map((p) => p.id).filter(Boolean);
  if (!ids.length) return list;

  const placeholders = ids.map(() => "?").join(", ");
  const [rows] = await db.query(
    `SELECT pl.partner_id AS id, pl.name, pl.description, pl.duration, pl.quote
     FROM partner_language pl
     JOIN languages l ON l.id = pl.language_id
     WHERE LOWER(l.code) = ? AND pl.partner_id IN (${placeholders})`,
    [code, ...ids]
  );
  const byId = new Map(rows.map((r) => [r.id, r]));

  return list.map((p) => {
    const loc = byId.get(p.id);
    if (!loc) return p;
    return {
      ...p,
      name: loc.name || p.name,
      description: loc.description ?? p.description,
      duration: loc.duration || p.duration,
      quote: loc.quote ?? p.quote,
    };
  });
}
