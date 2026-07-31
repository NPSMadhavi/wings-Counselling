/**
 * Article multi-language + documents API
 *
 * GET  /api/admin/languages
 * POST /api/admin/documents
 * GET  /api/admin/articles/:articleId/languages
 * PUT  /api/admin/articles/:articleId/languages/:languageId
 */

import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { db } from "../config/db.js";
import { requireAdmin } from "../middlewares/auth.js";
import { isDuplicateTableError } from "../config/pg-helpers.js";

const router = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(__dirname, "../../uploads/documents");

if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

const docStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, docsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".docx";
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const docUpload = multer({
  storage: docStorage,
  limits: { fileSize: 15 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const name = (file.originalname || "").toLowerCase();
    const ok =
      name.endsWith(".docx") ||
      name.endsWith(".doc") ||
      file.mimetype?.includes("word") ||
      file.mimetype === "application/octet-stream" ||
      file.mimetype === "text/html" ||
      file.mimetype === "application/json";
    if (ok) return cb(null, true);
    cb(new Error("Only Word (.docx) documents are allowed"));
  },
});

const DEFAULT_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "zh", name: "中文" },
  { code: "ms", name: "Bahasa Melayu" },
  { code: "hi", name: "हिंदी" },
  { code: "ta", name: "தமிழ்" },
];

let ensurePromise = null;

export async function ensureArticleLanguageTables() {
  if (ensurePromise) return ensurePromise;

  ensurePromise = (async () => {
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS languages (
          id   SERIAL PRIMARY KEY,
          code VARCHAR(10) NOT NULL UNIQUE,
          name VARCHAR(100) NOT NULL
        )
      `);

      await db.execute(`
        CREATE TABLE IF NOT EXISTS documents (
          id            SERIAL PRIMARY KEY,
          original_name TEXT NOT NULL DEFAULT '',
          file_name     TEXT,
          file_path     TEXT,
          mime_type     TEXT,
          title         TEXT NOT NULL DEFAULT '',
          html_content  TEXT NOT NULL DEFAULT '',
          created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Older DBs may lack title — add safely
      try {
        await db.execute(
          `ALTER TABLE documents ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT ''`
        );
      } catch {
        /* ignore */
      }

      await db.execute(`
        CREATE TABLE IF NOT EXISTS article_language (
          id          SERIAL PRIMARY KEY,
          article_id  INT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
          language_id INT NOT NULL REFERENCES languages(id) ON DELETE RESTRICT,
          document_id INT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
          created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT uq_article_language UNIQUE (article_id, language_id)
        )
      `);

      for (const lang of DEFAULT_LANGUAGES) {
        await db.execute(
          `INSERT INTO languages (code, name)
           VALUES (?, ?)
           ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name`,
          [lang.code, lang.name]
        );
      }
    } catch (err) {
      if (!isDuplicateTableError(err)) {
        console.error("[article-language] ensure tables:", err?.message);
      }
    }
  })();

  return ensurePromise;
}

router.get("/admin/languages", requireAdmin, async (_req, res) => {
  try {
    await ensureArticleLanguageTables();
    const [rows] = await db.query(
      `SELECT id, code, name FROM languages ORDER BY id ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Translate English source → target language and save to article_language.
 * POST /api/admin/articles/:articleId/translate/:langCode
 * Body optional: { force: true } to re-translate
 */
router.post(
  "/admin/articles/:articleId/translate/:langCode",
  requireAdmin,
  async (req, res) => {
    try {
      await ensureArticleLanguageTables();
      const articleId = Number(req.params.articleId);
      const langCode = String(req.params.langCode || "").toLowerCase();
      if (!Number.isFinite(articleId)) {
        return res.status(400).json({ error: "Invalid article id" });
      }

      const { ensureArticleTranslation } = await import(
        "../services/articleTranslate.js"
      );
      const result = await ensureArticleTranslation(articleId, langCode, {
        force: Boolean(req.body?.force),
      });

      res.json({
        articleId,
        languageId: result.languageId,
        languageCode: result.languageCode,
        documentId: result.documentId,
        title: result.title,
        htmlContent: result.htmlContent,
        translated: result.translated,
      });
    } catch (err) {
      console.error("[translate route]", err);
      res.status(500).json({ error: err?.message || "Translation failed" });
    }
  }
);

router.post("/admin/documents", requireAdmin, (req, res) => {
  docUpload.single("file")(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    }
    if (err) {
      return res.status(400).json({ error: err.message || "Upload failed" });
    }

    try {
      await ensureArticleLanguageTables();

      const htmlContent =
        typeof req.body?.htmlContent === "string" ? req.body.htmlContent : "";
      const docTitle =
        typeof req.body?.title === "string" ? req.body.title : "";
      const originalName =
        req.file?.originalname ||
        req.body?.originalName ||
        "untitled.docx";

      const fileName = req.file?.filename || null;
      const filePath = req.file
        ? `/api/uploads/documents/${req.file.filename}`
        : null;
      const mimeType = req.file?.mimetype || req.body?.mimeType || null;

      const [result] = await db.query(
        `INSERT INTO documents (original_name, file_name, file_path, mime_type, title, html_content)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [originalName, fileName, filePath, mimeType, docTitle, htmlContent]
      );

      const [rows] = await db.query(
        `SELECT id, original_name AS "originalName", file_name AS "fileName",
                file_path AS "filePath", mime_type AS "mimeType",
                title, html_content AS "htmlContent", created_at AS "createdAt"
         FROM documents WHERE id = ?`,
        [result.insertId]
      );

      return res.status(201).json(rows[0]);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  });
});

router.get("/admin/articles/:articleId/languages", requireAdmin, async (req, res) => {
  try {
    await ensureArticleLanguageTables();
    const articleId = Number(req.params.articleId);
    if (!Number.isFinite(articleId)) {
      return res.status(400).json({ error: "Invalid article id" });
    }

    const [rows] = await db.query(
      `SELECT al.id,
              al.article_id AS "articleId",
              al.language_id AS "languageId",
              al.document_id AS "documentId",
              l.code AS "languageCode",
              l.name AS "languageName",
              d.original_name AS "originalName",
              d.file_path AS "filePath",
              d.title AS "title",
              d.html_content AS "htmlContent",
              al.updated_at AS "updatedAt"
       FROM article_language al
       JOIN languages l ON l.id = al.language_id
       JOIN documents d ON d.id = al.document_id
       WHERE al.article_id = ?
       ORDER BY l.id ASC`,
      [articleId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Upsert article_language for one language.
 * Body: { documentId } OR { htmlContent, originalName } to create document first
 */
router.put(
  "/admin/articles/:articleId/languages/:languageId",
  requireAdmin,
  async (req, res) => {
    try {
      await ensureArticleLanguageTables();
      const articleId = Number(req.params.articleId);
      const languageId = Number(req.params.languageId);

      if (!Number.isFinite(articleId) || !Number.isFinite(languageId)) {
        return res.status(400).json({ error: "Invalid article or language id" });
      }

      const [articleRows] = await db.query(
        `SELECT id FROM articles WHERE id = ? LIMIT 1`,
        [articleId]
      );
      if (!articleRows.length) {
        return res.status(404).json({ error: "Article not found" });
      }

      const [langRows] = await db.query(
        `SELECT id FROM languages WHERE id = ? LIMIT 1`,
        [languageId]
      );
      if (!langRows.length) {
        return res.status(404).json({ error: "Language not found" });
      }

      let documentId = Number(req.body?.documentId) || null;
      const htmlContent =
        typeof req.body?.htmlContent === "string" ? req.body.htmlContent : null;
      const docTitle =
        typeof req.body?.title === "string" ? req.body.title : null;

      // If existing link and only html/title update — update that document
      const [existing] = await db.query(
        `SELECT id, document_id AS "documentId"
         FROM article_language
         WHERE article_id = ? AND language_id = ?
         LIMIT 1`,
        [articleId, languageId]
      );

      if ((htmlContent !== null || docTitle !== null) && existing.length && !documentId) {
        documentId = existing[0].documentId;
        await db.query(
          `UPDATE documents
           SET html_content = COALESCE(?, html_content),
               title = COALESCE(?, title),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [htmlContent, docTitle, documentId]
        );
      } else if (htmlContent !== null && !documentId) {
        const originalName = req.body?.originalName || "editor-content.html";
        const [docResult] = await db.query(
          `INSERT INTO documents (original_name, file_name, file_path, mime_type, title, html_content)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [originalName, null, null, "text/html", docTitle || "", htmlContent]
        );
        documentId = docResult.insertId;
      }

      if (!documentId) {
        return res
          .status(400)
          .json({ error: "documentId or htmlContent is required" });
      }

      const [docCheck] = await db.query(
        `SELECT id FROM documents WHERE id = ? LIMIT 1`,
        [documentId]
      );
      if (!docCheck.length) {
        return res.status(404).json({ error: "Document not found" });
      }

      // If caller sent html/title with an existing documentId, keep document in sync
      if ((htmlContent !== null || docTitle !== null) && documentId) {
        await db.query(
          `UPDATE documents
           SET html_content = COALESCE(?, html_content),
               title = COALESCE(?, title),
               original_name = COALESCE(NULLIF(?, ''), original_name),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [
            htmlContent,
            docTitle,
            req.body?.originalName || "",
            documentId,
          ]
        );
      }

      await db.query(
        `INSERT INTO article_language (article_id, language_id, document_id)
         VALUES (?, ?, ?)
         ON CONFLICT (article_id, language_id) DO UPDATE SET
           document_id = EXCLUDED.document_id,
           updated_at = CURRENT_TIMESTAMP`,
        [articleId, languageId, documentId]
      );

      const [rows] = await db.query(
        `SELECT al.id,
                al.article_id AS "articleId",
                al.language_id AS "languageId",
                al.document_id AS "documentId",
                l.code AS "languageCode",
                l.name AS "languageName",
                d.original_name AS "originalName",
                d.file_path AS "filePath",
                d.title AS "title",
                d.html_content AS "htmlContent"
         FROM article_language al
         JOIN languages l ON l.id = al.language_id
         JOIN documents d ON d.id = al.document_id
         WHERE al.article_id = ? AND al.language_id = ?
         LIMIT 1`,
        [articleId, languageId]
      );

      res.json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
