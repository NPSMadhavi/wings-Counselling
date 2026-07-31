/**
 * Ensure counselling type / sub-type translations are stored per language.
 * Source = English language row, else base counselling_* table columns.
 */

import { db } from "../config/db.js";
import { translateTitle, translateHtml } from "./translateService.js";
import { ensureArticleLanguageTables } from "../routes/articleLanguageRoutes.js";

async function getLanguageByCode(code) {
  const [rows] = await db.query(
    `SELECT id, code, name FROM languages WHERE LOWER(code) = ? LIMIT 1`,
    [String(code).toLowerCase()]
  );
  return rows[0] || null;
}

export function looksUntranslatedText(code, text) {
  const body = String(text || "");
  if (!body.trim()) return true;
  if (code === "hi") return !/[\u0900-\u097F]/.test(body);
  if (code === "ta") return !/[\u0B80-\u0BFF]/.test(body);
  if (code === "zh") return !/[\u4E00-\u9FFF]/.test(body);
  return false;
}

export async function ensureCounsellingLanguageTables() {
  await ensureArticleLanguageTables();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS counselling_type_language (
      id SERIAL PRIMARY KEY,
      counselling_type_id INT NOT NULL REFERENCES counselling_types(id) ON DELETE CASCADE,
      language_id INT NOT NULL REFERENCES languages(id) ON DELETE RESTRICT,
      name TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_counselling_type_language UNIQUE (counselling_type_id, language_id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS counselling_sub_type_language (
      id SERIAL PRIMARY KEY,
      counselling_sub_type_id INT NOT NULL REFERENCES counselling_sub_types(id) ON DELETE CASCADE,
      language_id INT NOT NULL REFERENCES languages(id) ON DELETE RESTRICT,
      name TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      heading TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_counselling_sub_type_language UNIQUE (counselling_sub_type_id, language_id)
    )
  `);
}

export async function saveTypeLocalization(typeId, languageId, { name, description }) {
  await db.query(
    `INSERT INTO counselling_type_language (counselling_type_id, language_id, name, description)
     VALUES (?, ?, ?, ?)
     ON CONFLICT (counselling_type_id, language_id) DO UPDATE SET
       name = EXCLUDED.name,
       description = EXCLUDED.description,
       updated_at = CURRENT_TIMESTAMP`,
    [typeId, languageId, name || "", description || ""]
  );
}

export async function saveSubTypeLocalization(
  subId,
  languageId,
  { name, description, heading }
) {
  await db.query(
    `INSERT INTO counselling_sub_type_language
       (counselling_sub_type_id, language_id, name, description, heading)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (counselling_sub_type_id, language_id) DO UPDATE SET
       name = EXCLUDED.name,
       description = EXCLUDED.description,
       heading = EXCLUDED.heading,
       updated_at = CURRENT_TIMESTAMP`,
    [subId, languageId, name || "", description || "", heading || ""]
  );
}

async function getTypeLocalization(typeId, langCode) {
  const [rows] = await db.query(
    `SELECT ctl.name, ctl.description, l.code AS "languageCode", l.id AS "languageId"
     FROM counselling_type_language ctl
     JOIN languages l ON l.id = ctl.language_id
     WHERE ctl.counselling_type_id = ? AND LOWER(l.code) = ?
     LIMIT 1`,
    [typeId, String(langCode).toLowerCase()]
  );
  return rows[0] || null;
}

async function getSubTypeLocalization(subId, langCode) {
  const [rows] = await db.query(
    `SELECT cstl.name, cstl.description, cstl.heading,
            l.code AS "languageCode", l.id AS "languageId"
     FROM counselling_sub_type_language cstl
     JOIN languages l ON l.id = cstl.language_id
     WHERE cstl.counselling_sub_type_id = ? AND LOWER(l.code) = ?
     LIMIT 1`,
    [subId, String(langCode).toLowerCase()]
  );
  return rows[0] || null;
}

async function getTypeEnglishSource(typeId) {
  const existing = await getTypeLocalization(typeId, "en");
  if (existing && String(existing.name || "").trim()) {
    return { name: existing.name || "", description: existing.description || "" };
  }
  const [rows] = await db.query(
    `SELECT name, description FROM counselling_types WHERE id = ? LIMIT 1`,
    [typeId]
  );
  if (!rows.length) return null;
  return { name: rows[0].name || "", description: rows[0].description || "" };
}

async function getSubTypeEnglishSource(subId) {
  const existing = await getSubTypeLocalization(subId, "en");
  if (existing && String(existing.name || "").trim()) {
    return {
      name: existing.name || "",
      description: existing.description || "",
      heading: existing.heading || "",
    };
  }
  const [rows] = await db.query(
    `SELECT name, description, heading FROM counselling_sub_types WHERE id = ? LIMIT 1`,
    [subId]
  );
  if (!rows.length) return null;
  return {
    name: rows[0].name || "",
    description: rows[0].description || "",
    heading: rows[0].heading || "",
  };
}

async function translateServiceFields({ name, description, heading }, code) {
  const [tName, tDesc, tHeading] = await Promise.all([
    translateTitle(name || "", code),
    translateHtml(description || "", code),
    heading != null ? translateTitle(heading || "", code) : Promise.resolve(undefined),
  ]);
  return {
    name: tName,
    description: tDesc,
    ...(heading != null ? { heading: tHeading } : {}),
  };
}

export async function ensureTypeTranslation(typeId, targetLangCode, { force = false } = {}) {
  await ensureCounsellingLanguageTables();
  const code = String(targetLangCode || "en").toLowerCase().split("-")[0];
  const lang = await getLanguageByCode(code);
  if (!lang) throw new Error(`Language not found: ${code}`);

  const source = await getTypeEnglishSource(typeId);
  if (!source) throw new Error("Service type not found");

  if (code === "en") {
    await saveTypeLocalization(typeId, lang.id, source);
    return { ...source, languageCode: "en", languageId: lang.id, translated: false };
  }

  const existing = await getTypeLocalization(typeId, code);
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

  if (!String(source.name || source.description || "").trim()) {
    throw new Error("No English source content to translate");
  }

  console.log(`[translate] counselling type ${typeId}: en → ${code}`);
  const translated = await translateServiceFields(source, code);
  await saveTypeLocalization(typeId, lang.id, translated);
  return {
    ...translated,
    languageCode: code,
    languageId: lang.id,
    translated: true,
  };
}

export async function ensureSubTypeTranslation(subId, targetLangCode, { force = false } = {}) {
  await ensureCounsellingLanguageTables();
  const code = String(targetLangCode || "en").toLowerCase().split("-")[0];
  const lang = await getLanguageByCode(code);
  if (!lang) throw new Error(`Language not found: ${code}`);

  const source = await getSubTypeEnglishSource(subId);
  if (!source) throw new Error("Sub service not found");

  if (code === "en") {
    await saveSubTypeLocalization(subId, lang.id, source);
    return { ...source, languageCode: "en", languageId: lang.id, translated: false };
  }

  const existing = await getSubTypeLocalization(subId, code);
  const sample = `${existing?.name || ""} ${existing?.description || ""} ${existing?.heading || ""}`;
  const hasUsable =
    existing &&
    String(existing.name || "").trim() &&
    !looksUntranslatedText(code, sample);

  if (!force && hasUsable) {
    return {
      name: existing.name || "",
      description: existing.description || "",
      heading: existing.heading || "",
      languageCode: code,
      languageId: lang.id,
      translated: false,
    };
  }

  if (!String(source.name || source.description || source.heading || "").trim()) {
    throw new Error("No English source content to translate");
  }

  console.log(`[translate] counselling sub-type ${subId}: en → ${code}`);
  const translated = await translateServiceFields(source, code);
  await saveSubTypeLocalization(subId, lang.id, translated);
  return {
    ...translated,
    languageCode: code,
    languageId: lang.id,
    translated: true,
  };
}

/** Overlay stored localizations onto type/sub rows for a public lang. */
export async function localizeCounsellingTree(types, langCode) {
  const code = String(langCode || "en").toLowerCase().split("-")[0];
  if (!code || code === "en" || !Array.isArray(types) || !types.length) {
    return types;
  }

  await ensureCounsellingLanguageTables();

  const typeIds = types.map((t) => t.id).filter(Boolean);
  const subIds = types.flatMap((t) => (t.sub_types || []).map((s) => s.id)).filter(Boolean);

  const typeLocById = new Map();
  const subLocById = new Map();

  if (typeIds.length) {
    const placeholders = typeIds.map(() => "?").join(", ");
    const [rows] = await db.query(
      `SELECT ctl.counselling_type_id AS id, ctl.name, ctl.description
       FROM counselling_type_language ctl
       JOIN languages l ON l.id = ctl.language_id
       WHERE LOWER(l.code) = ? AND ctl.counselling_type_id IN (${placeholders})`,
      [code, ...typeIds]
    );
    rows.forEach((r) => typeLocById.set(r.id, r));
  }

  if (subIds.length) {
    const placeholders = subIds.map(() => "?").join(", ");
    const [rows] = await db.query(
      `SELECT cstl.counselling_sub_type_id AS id, cstl.name, cstl.description, cstl.heading
       FROM counselling_sub_type_language cstl
       JOIN languages l ON l.id = cstl.language_id
       WHERE LOWER(l.code) = ? AND cstl.counselling_sub_type_id IN (${placeholders})`,
      [code, ...subIds]
    );
    rows.forEach((r) => subLocById.set(r.id, r));
  }

  return types.map((type) => {
    const tLoc = typeLocById.get(type.id);
    return {
      ...type,
      name: tLoc?.name || type.name,
      description: tLoc?.description ?? type.description,
      sub_types: (type.sub_types || []).map((sub) => {
        const sLoc = subLocById.get(sub.id);
        if (!sLoc) return sub;
        return {
          ...sub,
          name: sLoc.name || sub.name,
          description: sLoc.description ?? sub.description,
          heading: sLoc.heading || sub.heading,
        };
      }),
    };
  });
}

export async function localizeSubTypeDetail(data, langCode) {
  if (!data?.id) return data;
  const code = String(langCode || "en").toLowerCase().split("-")[0];
  if (!code || code === "en") return data;

  try {
    const loc = await ensureSubTypeTranslation(data.id, code);
    const parentId = data.counselling_type_id || data.parent_type?.id;
    let parent = data.parent_type;
    if (parentId) {
      try {
        const pLoc = await ensureTypeTranslation(parentId, code);
        parent = {
          ...(parent || { id: parentId }),
          name: pLoc.name || parent?.name,
          description: pLoc.description ?? parent?.description,
        };
      } catch {
        /* keep parent as-is */
      }
    }
    return {
      ...data,
      name: loc.name || data.name,
      description: loc.description ?? data.description,
      heading: loc.heading || data.heading,
      parent_type: parent,
    };
  } catch (err) {
    console.warn("[counselling] localize sub detail:", err?.message);
    return data;
  }
}
