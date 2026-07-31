/**
 * Ensure an article has a stored translation for targetLang.
 * Source = English article_language row, else articles.title/content.
 */

import { db } from "../config/db.js";
import {
  translateArticleContent,
  looksCorruptedHtml,
  countHeadingTags,
} from "./translateService.js";

async function getLanguageIdByCode(code) {
  const [rows] = await db.query(
    `SELECT id, code, name FROM languages WHERE LOWER(code) = ? LIMIT 1`,
    [String(code).toLowerCase()]
  );
  return rows[0] || null;
}

async function getExistingLocalization(articleId, langCode) {
  const [rows] = await db.query(
    `SELECT al.document_id AS "documentId",
            l.code AS "languageCode",
            d.title AS "title",
            d.html_content AS "htmlContent",
            d.original_name AS "originalName"
     FROM article_language al
     JOIN languages l ON l.id = al.language_id
     JOIN documents d ON d.id = al.document_id
     WHERE al.article_id = ? AND LOWER(l.code) = ?
     LIMIT 1`,
    [articleId, String(langCode).toLowerCase()]
  );
  return rows[0] || null;
}

async function getEnglishSource(articleId) {
  const existingEn = await getExistingLocalization(articleId, "en");
  if (existingEn && String(existingEn.htmlContent || "").trim()) {
    return {
      title: existingEn.title || "",
      html: existingEn.htmlContent || "",
    };
  }

  const [rows] = await db.query(
    `SELECT title, content FROM articles WHERE id = ? LIMIT 1`,
    [articleId]
  );
  if (rows.length && String(rows[0].content || "").trim()) {
    return {
      title: rows[0].title || "",
      html: rows[0].content || "",
    };
  }

  // Fallback: any language document that has body text (e.g. English uploaded under ms earlier)
  const [anyRows] = await db.query(
    `SELECT d.title AS "title", d.html_content AS "htmlContent"
     FROM article_language al
     JOIN documents d ON d.id = al.document_id
     WHERE al.article_id = ?
       AND LENGTH(TRIM(COALESCE(d.html_content, ''))) > 0
     ORDER BY al.updated_at DESC NULLS LAST
     LIMIT 1`,
    [articleId]
  );
  if (anyRows.length) {
    return {
      title: anyRows[0].title || rows[0]?.title || "",
      html: anyRows[0].htmlContent || "",
    };
  }

  if (rows.length) {
    return {
      title: rows[0].title || "",
      html: rows[0].content || "",
    };
  }
  return null;
}

async function saveLocalization(articleId, languageId, { title, html, originalName }) {
  const [existing] = await db.query(
    `SELECT document_id AS "documentId"
     FROM article_language
     WHERE article_id = ? AND language_id = ?
     LIMIT 1`,
    [articleId, languageId]
  );

  let documentId = existing[0]?.documentId || null;

  if (documentId) {
    await db.query(
      `UPDATE documents
       SET title = ?, html_content = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [title || "", html || "", documentId]
    );
  } else {
    const [docResult] = await db.query(
      `INSERT INTO documents (original_name, file_name, file_path, mime_type, title, html_content)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        originalName || "translated.html",
        null,
        null,
        "text/html",
        title || "",
        html || "",
      ]
    );
    documentId = docResult.insertId;
  }

  await db.query(
    `INSERT INTO article_language (article_id, language_id, document_id)
     VALUES (?, ?, ?)
     ON CONFLICT (article_id, language_id) DO UPDATE SET
       document_id = EXCLUDED.document_id,
       updated_at = CURRENT_TIMESTAMP`,
    [articleId, languageId, documentId]
  );

  return documentId;
}

/**
 * True when stored HTML for a non-English lang still looks like English,
 * was corrupted by the old placeholder translator, or lost heading structure.
 */
export function looksUntranslated(code, html, englishHtml = "") {
  const body = String(html || "");
  if (!body.trim()) return true;
  if (looksCorruptedHtml(body)) return true;

  const enHeadings = countHeadingTags(englishHtml);
  const locHeadings = countHeadingTags(body);
  // English had multiple headings but translation flattened them
  if (enHeadings >= 4 && locHeadings < Math.max(2, Math.floor(enHeadings * 0.4))) {
    return true;
  }

  if (code === "hi") return !/[\u0900-\u097F]/.test(body);
  if (code === "ta") return !/[\u0B80-\u0BFF]/.test(body);
  if (code === "zh") return !/[\u4E00-\u9FFF]/.test(body);
  if (code === "ms") {
    return /Understanding Stress|Stress and anxiety are common|Learning to Manage Life|What is Addiction/i.test(
      body
    );
  }
  return false;
}

/**
 * @returns {{ title, htmlContent, languageCode, documentId, translated: boolean }}
 */
export async function ensureArticleTranslation(articleId, targetLangCode, { force = false } = {}) {
  const code = String(targetLangCode || "en").toLowerCase().split("-")[0];
  const lang = await getLanguageIdByCode(code);
  if (!lang) {
    throw new Error(`Language not found: ${code}`);
  }

  if (code === "en") {
    const source = await getEnglishSource(articleId);
    if (!source) throw new Error("Article not found");
    const documentId = await saveLocalization(articleId, lang.id, {
      title: source.title,
      html: source.html,
      originalName: "english-source.html",
    });
    return {
      title: source.title,
      htmlContent: source.html,
      languageCode: "en",
      languageId: lang.id,
      documentId,
      translated: false,
    };
  }

  const source = await getEnglishSource(articleId);
  const existing = await getExistingLocalization(articleId, code);
  const hasUsable =
    existing &&
    String(existing.htmlContent || "").trim() &&
    !looksUntranslated(code, existing.htmlContent, source?.html || "");

  if (!force && hasUsable) {
    return {
      title: existing.title || "",
      htmlContent: existing.htmlContent || "",
      languageCode: code,
      languageId: lang.id,
      documentId: existing.documentId,
      translated: false,
    };
  }

  if (!source || !String(source.html || source.title || "").trim()) {
    throw new Error("No English source content to translate");
  }

  console.log(
    `[translate] article ${articleId}: en → ${code} (title+html, preserve headings)...`
  );
  const translated = await translateArticleContent(
    { title: source.title, html: source.html },
    code
  );

  const documentId = await saveLocalization(articleId, lang.id, {
    title: translated.title,
    html: translated.html,
    originalName: `translated-${code}.html`,
  });

  return {
    title: translated.title,
    htmlContent: translated.html,
    languageCode: code,
    languageId: lang.id,
    documentId,
    translated: true,
  };
}
