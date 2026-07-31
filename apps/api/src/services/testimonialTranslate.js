/**
 * Testimonial (testmonials table) multi-language helpers.
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
  return false;
}

export async function ensureTestimonialLanguageTables() {
  await ensureArticleLanguageTables();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS testimonial_language (
      id SERIAL PRIMARY KEY,
      testimonial_id INT NOT NULL REFERENCES testmonials(id) ON DELETE CASCADE,
      language_id INT NOT NULL REFERENCES languages(id) ON DELETE RESTRICT,
      service_name TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      client_name TEXT NOT NULL DEFAULT '',
      client_company_name TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_testimonial_language UNIQUE (testimonial_id, language_id)
    )
  `);
}

export async function saveTestimonialLocalization(
  testimonialId,
  languageId,
  { serviceName, description, clientName, clientCompanyName }
) {
  await db.query(
    `INSERT INTO testimonial_language
       (testimonial_id, language_id, service_name, description, client_name, client_company_name)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (testimonial_id, language_id) DO UPDATE SET
       service_name = EXCLUDED.service_name,
       description = EXCLUDED.description,
       client_name = EXCLUDED.client_name,
       client_company_name = EXCLUDED.client_company_name,
       updated_at = CURRENT_TIMESTAMP`,
    [
      testimonialId,
      languageId,
      serviceName || "",
      description || "",
      clientName || "",
      clientCompanyName || "",
    ]
  );
}

async function getTestimonialLocalization(testimonialId, langCode) {
  const [rows] = await db.query(
    `SELECT tl.service_name AS "serviceName", tl.description,
            tl.client_name AS "clientName",
            tl.client_company_name AS "clientCompanyName",
            l.code AS "languageCode", l.id AS "languageId"
     FROM testimonial_language tl
     JOIN languages l ON l.id = tl.language_id
     WHERE tl.testimonial_id = ? AND LOWER(l.code) = ?
     LIMIT 1`,
    [testimonialId, String(langCode).toLowerCase()]
  );
  return rows[0] || null;
}

async function getTestimonialEnglishSource(testimonialId) {
  const existing = await getTestimonialLocalization(testimonialId, "en");
  const existingSample = `${existing?.serviceName || ""} ${existing?.description || ""}`;
  if (existing && looksLikeEnglishText(existingSample)) {
    return {
      serviceName: existing.serviceName || "",
      description: existing.description || "",
      clientName: existing.clientName || "",
      clientCompanyName: existing.clientCompanyName || "",
    };
  }

  const [rows] = await db.query(
    `SELECT service_name, description, client_name, client_company_name
     FROM testmonials WHERE id = ? LIMIT 1`,
    [testimonialId]
  );
  if (rows.length) {
    const baseSample = `${rows[0].service_name || ""} ${rows[0].description || ""}`;
    if (looksLikeEnglishText(baseSample)) {
      return {
        serviceName: rows[0].service_name || "",
        description: rows[0].description || "",
        clientName: rows[0].client_name || "",
        clientCompanyName: rows[0].client_company_name || "",
      };
    }
  }

  const dirty =
    existing ||
    (rows.length
      ? {
          serviceName: rows[0].service_name || "",
          description: rows[0].description || "",
          clientName: rows[0].client_name || "",
          clientCompanyName: rows[0].client_company_name || "",
        }
      : null);
  if (!dirty || !String(dirty.serviceName || dirty.description || "").trim()) {
    return null;
  }

  console.log(
    `[translate] testimonial ${testimonialId}: restoring English from non-English source`
  );
  const restored = {
    serviceName: await translateTitle(dirty.serviceName || "", "en"),
    description: await translateHtml(dirty.description || "", "en"),
    clientName: await translateTitle(dirty.clientName || "", "en"),
    clientCompanyName: await translateTitle(dirty.clientCompanyName || "", "en"),
  };

  const enLang = await getLanguageByCode("en");
  if (enLang) {
    await saveTestimonialLocalization(testimonialId, enLang.id, restored);
    await db.query(
      `UPDATE testmonials
       SET service_name = ?, description = ?, client_name = ?, client_company_name = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        restored.serviceName,
        restored.description,
        restored.clientName,
        restored.clientCompanyName,
        testimonialId,
      ]
    );
  }

  return restored;
}

async function translateTestimonialFields(source, code) {
  const serviceName = await translateTitle(source.serviceName || "", code);
  await new Promise((r) => setTimeout(r, 100));
  const description = await translateHtml(source.description || "", code);
  await new Promise((r) => setTimeout(r, 100));
  const clientName = await translateTitle(source.clientName || "", code);
  await new Promise((r) => setTimeout(r, 100));
  const clientCompanyName = await translateTitle(
    source.clientCompanyName || "",
    code
  );
  return { serviceName, description, clientName, clientCompanyName };
}

export async function ensureTestimonialTranslation(
  testimonialId,
  targetLangCode,
  { force = false } = {}
) {
  await ensureTestimonialLanguageTables();
  const code = String(targetLangCode || "en").toLowerCase().split("-")[0];
  const lang = await getLanguageByCode(code);
  if (!lang) throw new Error(`Language not found: ${code}`);

  const source = await getTestimonialEnglishSource(testimonialId);
  if (!source) throw new Error("Testimonial not found");

  if (code === "en") {
    await saveTestimonialLocalization(testimonialId, lang.id, source);
    return { ...source, languageCode: "en", languageId: lang.id, translated: false };
  }

  const existing = await getTestimonialLocalization(testimonialId, code);
  const sample = `${existing?.serviceName || ""} ${existing?.description || ""}`;
  const hasUsable =
    existing &&
    String(existing.serviceName || "").trim() &&
    !looksUntranslatedText(code, sample);

  if (!force && hasUsable) {
    return {
      serviceName: existing.serviceName || "",
      description: existing.description || "",
      clientName: existing.clientName || "",
      clientCompanyName: existing.clientCompanyName || "",
      languageCode: code,
      languageId: lang.id,
      translated: false,
    };
  }

  if (!String(source.serviceName || source.description || "").trim()) {
    throw new Error("No English source content to translate");
  }

  console.log(`[translate] testimonial ${testimonialId}: en → ${code}`);
  const translated = await translateTestimonialFields(source, code);
  await saveTestimonialLocalization(testimonialId, lang.id, translated);
  return {
    ...translated,
    languageCode: code,
    languageId: lang.id,
    translated: true,
  };
}

export async function localizeTestimonials(list, langCode) {
  const code = String(langCode || "en").toLowerCase().split("-")[0];
  if (!code || code === "en" || !Array.isArray(list) || !list.length) return list;

  await ensureTestimonialLanguageTables();
  const ids = list.map((t) => t.id).filter(Boolean);
  if (!ids.length) return list;

  const placeholders = ids.map(() => "?").join(", ");
  const [rows] = await db.query(
    `SELECT tl.testimonial_id AS id,
            tl.service_name AS "serviceName",
            tl.description,
            tl.client_name AS "clientName",
            tl.client_company_name AS "clientCompanyName"
     FROM testimonial_language tl
     JOIN languages l ON l.id = tl.language_id
     WHERE LOWER(l.code) = ? AND tl.testimonial_id IN (${placeholders})`,
    [code, ...ids]
  );
  const byId = new Map(rows.map((r) => [r.id, r]));

  return list.map((t) => {
    const loc = byId.get(t.id);
    if (!loc) return t;
    return {
      ...t,
      serviceName: loc.serviceName || t.serviceName,
      description: loc.description ?? t.description,
      clientName: loc.clientName || t.clientName,
      clientCompanyName: loc.clientCompanyName || t.clientCompanyName,
    };
  });
}
