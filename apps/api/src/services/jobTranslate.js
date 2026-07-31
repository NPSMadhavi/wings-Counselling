/**
 * Job posting + category multi-language helpers.
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

export async function ensureJobLanguageTables() {
  await ensureArticleLanguageTables();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS job_category_language (
      id SERIAL PRIMARY KEY,
      category_id INT NOT NULL REFERENCES job_categories(id) ON DELETE CASCADE,
      language_id INT NOT NULL REFERENCES languages(id) ON DELETE RESTRICT,
      name TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_job_category_language UNIQUE (category_id, language_id)
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS job_posting_language (
      id SERIAL PRIMARY KEY,
      job_id INT NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
      language_id INT NOT NULL REFERENCES languages(id) ON DELETE RESTRICT,
      title TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      requirements TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      experience TEXT NOT NULL DEFAULT '',
      employment_type TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_job_posting_language UNIQUE (job_id, language_id)
    )
  `);
}

/* -------- Categories -------- */

export async function saveCategoryLocalization(
  categoryId,
  languageId,
  { name, description }
) {
  await db.query(
    `INSERT INTO job_category_language
       (category_id, language_id, name, description)
     VALUES (?, ?, ?, ?)
     ON CONFLICT (category_id, language_id) DO UPDATE SET
       name = EXCLUDED.name,
       description = EXCLUDED.description,
       updated_at = CURRENT_TIMESTAMP`,
    [categoryId, languageId, name || "", description || ""]
  );
}

async function getCategoryLocalization(categoryId, langCode) {
  const [rows] = await db.query(
    `SELECT cl.name, cl.description,
            l.code AS "languageCode", l.id AS "languageId"
     FROM job_category_language cl
     JOIN languages l ON l.id = cl.language_id
     WHERE cl.category_id = ? AND LOWER(l.code) = ?
     LIMIT 1`,
    [categoryId, String(langCode).toLowerCase()]
  );
  return rows[0] || null;
}

async function getCategoryEnglishSource(categoryId) {
  const existing = await getCategoryLocalization(categoryId, "en");
  const sample = `${existing?.name || ""} ${existing?.description || ""}`;
  if (existing && looksLikeEnglishText(sample)) {
    return { name: existing.name || "", description: existing.description || "" };
  }

  const [rows] = await db.query(
    `SELECT name, description FROM job_categories WHERE id = ? LIMIT 1`,
    [categoryId]
  );
  if (!rows.length) return null;
  return {
    name: rows[0].name || "",
    description: rows[0].description || "",
  };
}

export async function ensureCategoryTranslation(
  categoryId,
  targetLangCode,
  { force = false } = {}
) {
  await ensureJobLanguageTables();
  const code = String(targetLangCode || "en").toLowerCase().split("-")[0];
  const lang = await getLanguageByCode(code);
  if (!lang) throw new Error(`Language not found: ${code}`);

  const source = await getCategoryEnglishSource(categoryId);
  if (!source) throw new Error("Category not found");

  if (code === "en") {
    await saveCategoryLocalization(categoryId, lang.id, source);
    return { ...source, languageCode: "en", languageId: lang.id, translated: false };
  }

  const existing = await getCategoryLocalization(categoryId, code);
  const sample = `${existing?.name || ""} ${existing?.description || ""}`;
  const hasUsable =
    existing &&
    String(existing.name || "").trim() &&
    !looksUntranslatedText(code, sample);

  if (!force && hasUsable) {
    return {
      name: existing.name || "",
      description: existing.description || "",
      languageCode: code,
      languageId: lang.id,
      translated: false,
    };
  }

  console.log(`[translate] category ${categoryId}: en → ${code}`);
  const name = await translateTitle(source.name || "", code);
  await new Promise((r) => setTimeout(r, 80));
  const description = await translateHtml(source.description || "", code);
  const translated = { name, description };
  await saveCategoryLocalization(categoryId, lang.id, translated);
  return {
    ...translated,
    languageCode: code,
    languageId: lang.id,
    translated: true,
  };
}

export async function localizeCategories(list, langCode) {
  const code = String(langCode || "en").toLowerCase().split("-")[0];
  if (!code || code === "en" || !Array.isArray(list) || !list.length) return list;

  await ensureJobLanguageTables();
  const ids = list.map((c) => c.id).filter(Boolean);
  if (!ids.length) return list;

  const placeholders = ids.map(() => "?").join(", ");
  const [rows] = await db.query(
    `SELECT cl.category_id AS id, cl.name, cl.description
     FROM job_category_language cl
     JOIN languages l ON l.id = cl.language_id
     WHERE LOWER(l.code) = ? AND cl.category_id IN (${placeholders})`,
    [code, ...ids]
  );
  const byId = new Map(rows.map((r) => [r.id, r]));

  return list.map((c) => {
    const loc = byId.get(c.id);
    if (!loc) return c;
    return {
      ...c,
      name: loc.name || c.name,
      description: loc.description ?? c.description,
    };
  });
}

/* -------- Job postings -------- */

export async function saveJobLocalization(
  jobId,
  languageId,
  {
    title,
    summary,
    description,
    requirements,
    location,
    experience,
    employmentType,
  }
) {
  await db.query(
    `INSERT INTO job_posting_language
       (job_id, language_id, title, summary, description, requirements, location, experience, employment_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (job_id, language_id) DO UPDATE SET
       title = EXCLUDED.title,
       summary = EXCLUDED.summary,
       description = EXCLUDED.description,
       requirements = EXCLUDED.requirements,
       location = EXCLUDED.location,
       experience = EXCLUDED.experience,
       employment_type = EXCLUDED.employment_type,
       updated_at = CURRENT_TIMESTAMP`,
    [
      jobId,
      languageId,
      title || "",
      summary || "",
      description || "",
      requirements || "",
      location || "",
      experience || "",
      employmentType || "",
    ]
  );
}

async function getJobLocalization(jobId, langCode) {
  const [rows] = await db.query(
    `SELECT jl.title, jl.summary, jl.description, jl.requirements,
            jl.location, jl.experience, jl.employment_type AS "employmentType",
            l.code AS "languageCode", l.id AS "languageId"
     FROM job_posting_language jl
     JOIN languages l ON l.id = jl.language_id
     WHERE jl.job_id = ? AND LOWER(l.code) = ?
     LIMIT 1`,
    [jobId, String(langCode).toLowerCase()]
  );
  return rows[0] || null;
}

async function getJobEnglishSource(jobId) {
  const existing = await getJobLocalization(jobId, "en");
  const sample = `${existing?.title || ""} ${existing?.description || ""}`;
  if (existing && looksLikeEnglishText(sample)) {
    return {
      title: existing.title || "",
      summary: existing.summary || "",
      description: existing.description || "",
      requirements: existing.requirements || "",
      location: existing.location || "",
      experience: existing.experience || "",
      employmentType: existing.employmentType || "",
    };
  }

  const [rows] = await db.query(
    `SELECT title, summary, description, requirements, location, experience,
            employment_type AS "employmentType"
     FROM job_postings WHERE id = ? LIMIT 1`,
    [jobId]
  );
  if (!rows.length) return null;
  return {
    title: rows[0].title || "",
    summary: rows[0].summary || "",
    description: rows[0].description || "",
    requirements: rows[0].requirements || "",
    location: rows[0].location || "",
    experience: rows[0].experience || "",
    employmentType: rows[0].employmentType || "",
  };
}

async function translateJobFields(source, code) {
  const title = await translateTitle(source.title || "", code);
  await new Promise((r) => setTimeout(r, 80));
  const summary = await translateHtml(source.summary || "", code);
  await new Promise((r) => setTimeout(r, 80));
  const description = await translateHtml(source.description || "", code);
  await new Promise((r) => setTimeout(r, 80));
  const requirements = await translateHtml(source.requirements || "", code);
  await new Promise((r) => setTimeout(r, 80));
  const location = await translateTitle(source.location || "", code);
  await new Promise((r) => setTimeout(r, 80));
  const experience = await translateTitle(source.experience || "", code);
  await new Promise((r) => setTimeout(r, 80));
  const employmentType = await translateTitle(source.employmentType || "", code);
  return {
    title,
    summary,
    description,
    requirements,
    location,
    experience,
    employmentType,
  };
}

export async function ensureJobTranslation(
  jobId,
  targetLangCode,
  { force = false } = {}
) {
  await ensureJobLanguageTables();
  const code = String(targetLangCode || "en").toLowerCase().split("-")[0];
  const lang = await getLanguageByCode(code);
  if (!lang) throw new Error(`Language not found: ${code}`);

  const source = await getJobEnglishSource(jobId);
  if (!source) throw new Error("Job not found");

  if (code === "en") {
    await saveJobLocalization(jobId, lang.id, source);
    return { ...source, languageCode: "en", languageId: lang.id, translated: false };
  }

  const existing = await getJobLocalization(jobId, code);
  const sample = `${existing?.description || ""} ${existing?.title || ""}`;
  const hasUsable =
    existing &&
    String(existing.title || "").trim() &&
    !looksUntranslatedText(code, sample);

  if (!force && hasUsable) {
    return {
      title: existing.title || "",
      summary: existing.summary || "",
      description: existing.description || "",
      requirements: existing.requirements || "",
      location: existing.location || "",
      experience: existing.experience || "",
      employmentType: existing.employmentType || "",
      languageCode: code,
      languageId: lang.id,
      translated: false,
    };
  }

  if (!String(source.title || source.description || "").trim()) {
    throw new Error("No English source content to translate");
  }

  console.log(`[translate] job ${jobId}: en → ${code}`);
  const translated = await translateJobFields(source, code);
  await saveJobLocalization(jobId, lang.id, translated);
  return {
    ...translated,
    languageCode: code,
    languageId: lang.id,
    translated: true,
  };
}

export async function localizeJobs(list, langCode) {
  const code = String(langCode || "en").toLowerCase().split("-")[0];
  if (!code || code === "en" || !Array.isArray(list) || !list.length) return list;

  await ensureJobLanguageTables();
  const ids = list.map((j) => j.id).filter(Boolean);
  if (!ids.length) return list;

  const placeholders = ids.map(() => "?").join(", ");
  const [rows] = await db.query(
    `SELECT jl.job_id AS id, jl.title, jl.summary, jl.description, jl.requirements,
            jl.location, jl.experience, jl.employment_type AS "employmentType"
     FROM job_posting_language jl
     JOIN languages l ON l.id = jl.language_id
     WHERE LOWER(l.code) = ? AND jl.job_id IN (${placeholders})`,
    [code, ...ids]
  );
  const byId = new Map(rows.map((r) => [r.id, r]));

  // Also localize department (category name) if present
  const categoryIds = [
    ...new Set(list.map((j) => j.categoryId || j.category_id).filter(Boolean)),
  ];
  let catById = new Map();
  if (categoryIds.length) {
    const catPlaceholders = categoryIds.map(() => "?").join(", ");
    const [catRows] = await db.query(
      `SELECT cl.category_id AS id, cl.name
       FROM job_category_language cl
       JOIN languages l ON l.id = cl.language_id
       WHERE LOWER(l.code) = ? AND cl.category_id IN (${catPlaceholders})`,
      [code, ...categoryIds]
    );
    catById = new Map(catRows.map((r) => [r.id, r]));
  }

  return list.map((j) => {
    const loc = byId.get(j.id);
    const catId = j.categoryId || j.category_id;
    const catLoc = catId ? catById.get(catId) : null;
    const next = { ...j };
    if (loc) {
      next.title = loc.title || j.title;
      next.summary = loc.summary ?? j.summary;
      next.description = loc.description ?? j.description;
      next.requirements = loc.requirements ?? j.requirements;
      next.location = loc.location || j.location;
      next.experience = loc.experience || j.experience;
      next.employmentType = loc.employmentType || j.employmentType;
    }
    if (catLoc?.name) {
      next.department = catLoc.name;
    }
    return next;
  });
}
