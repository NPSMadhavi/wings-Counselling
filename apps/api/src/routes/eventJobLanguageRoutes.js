/**
 * Events + Jobs (careers) multi-language admin API
 */

import { Router } from "express";
import { db } from "../config/db.js";
import { requireAdmin } from "../middlewares/auth.js";
import {
  ensureEventLanguageTables,
  ensureEventTranslation,
  saveEventLocalization,
} from "../services/eventTranslate.js";
import {
  ensureJobLanguageTables,
  ensureJobTranslation,
  ensureCategoryTranslation,
  saveJobLocalization,
  saveCategoryLocalization,
} from "../services/jobTranslate.js";
import { looksLikeEnglishText } from "../services/translateService.js";

const router = Router();

/* -------- Events -------- */

router.get("/admin/events/:id/languages", requireAdmin, async (req, res) => {
  try {
    await ensureEventLanguageTables();
    const eventId = Number(req.params.id);
    const [rows] = await db.query(
      `SELECT el.id, el.language_id AS "languageId", l.code AS "languageCode",
              l.name AS "languageName", el.title, el.description, el.location
       FROM event_language el
       JOIN languages l ON l.id = el.language_id
       WHERE el.event_id = ?
       ORDER BY l.id ASC`,
      [eventId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.put(
  "/admin/events/:id/languages/:languageId",
  requireAdmin,
  async (req, res) => {
    try {
      await ensureEventLanguageTables();
      const eventId = Number(req.params.id);
      const languageId = Number(req.params.languageId);
      const { title, description, location } = req.body || {};

      const [langs] = await db.query(
        `SELECT id, code FROM languages WHERE id = ? LIMIT 1`,
        [languageId]
      );
      if (!langs.length) return res.status(404).json({ error: "Language not found" });

      const isEnglish = String(langs[0].code).toLowerCase() === "en";
      const sample = `${title || ""} ${description || ""}`;
      if (isEnglish && !looksLikeEnglishText(sample)) {
        return res.status(400).json({
          error:
            "English version must be English text. Switch language before saving other-language content.",
        });
      }

      await saveEventLocalization(eventId, languageId, {
        title: title || "",
        description: description || "",
        location: location || "",
      });

      if (isEnglish) {
        await db.query(
          `UPDATE events
           SET title = ?, description = ?, location = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [title?.trim() || "", description || "", location || "", eventId]
        );
      }

      res.json({
        languageId,
        languageCode: langs[0].code,
        title: title || "",
        description: description || "",
        location: location || "",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

router.post(
  "/admin/events/:id/translate/:langCode",
  requireAdmin,
  async (req, res) => {
    try {
      const result = await ensureEventTranslation(
        Number(req.params.id),
        req.params.langCode,
        { force: Boolean(req.body?.force) }
      );
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

/* -------- Job categories -------- */

router.get(
  "/admin/categories/:id/languages",
  requireAdmin,
  async (req, res) => {
    try {
      await ensureJobLanguageTables();
      const categoryId = Number(req.params.id);
      const [rows] = await db.query(
        `SELECT cl.id, cl.language_id AS "languageId", l.code AS "languageCode",
                l.name AS "languageName", cl.name, cl.description
         FROM job_category_language cl
         JOIN languages l ON l.id = cl.language_id
         WHERE cl.category_id = ?
         ORDER BY l.id ASC`,
        [categoryId]
      );
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

router.put(
  "/admin/categories/:id/languages/:languageId",
  requireAdmin,
  async (req, res) => {
    try {
      await ensureJobLanguageTables();
      const categoryId = Number(req.params.id);
      const languageId = Number(req.params.languageId);
      const { name, description } = req.body || {};

      const [langs] = await db.query(
        `SELECT id, code FROM languages WHERE id = ? LIMIT 1`,
        [languageId]
      );
      if (!langs.length) return res.status(404).json({ error: "Language not found" });

      const isEnglish = String(langs[0].code).toLowerCase() === "en";
      const sample = `${name || ""} ${description || ""}`;
      if (isEnglish && name && !looksLikeEnglishText(sample) && sample.trim().length > 8) {
        return res.status(400).json({
          error:
            "English version must be English text. Switch language before saving other-language content.",
        });
      }

      await saveCategoryLocalization(categoryId, languageId, {
        name: name || "",
        description: description || "",
      });

      if (isEnglish) {
        await db.query(
          `UPDATE job_categories SET name = ?, description = ? WHERE id = ?`,
          [name?.trim() || "", description || "", categoryId]
        );
      }

      res.json({
        languageId,
        languageCode: langs[0].code,
        name: name || "",
        description: description || "",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

router.post(
  "/admin/categories/:id/translate/:langCode",
  requireAdmin,
  async (req, res) => {
    try {
      const result = await ensureCategoryTranslation(
        Number(req.params.id),
        req.params.langCode,
        { force: Boolean(req.body?.force) }
      );
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

/* -------- Job postings -------- */

router.get("/admin/jobs/:id/languages", requireAdmin, async (req, res) => {
  try {
    await ensureJobLanguageTables();
    const jobId = Number(req.params.id);
    const [rows] = await db.query(
      `SELECT jl.id, jl.language_id AS "languageId", l.code AS "languageCode",
              l.name AS "languageName", jl.title, jl.summary, jl.description,
              jl.requirements, jl.location, jl.experience,
              jl.employment_type AS "employmentType"
       FROM job_posting_language jl
       JOIN languages l ON l.id = jl.language_id
       WHERE jl.job_id = ?
       ORDER BY l.id ASC`,
      [jobId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.put(
  "/admin/jobs/:id/languages/:languageId",
  requireAdmin,
  async (req, res) => {
    try {
      await ensureJobLanguageTables();
      const jobId = Number(req.params.id);
      const languageId = Number(req.params.languageId);
      const {
        title,
        summary,
        description,
        requirements,
        location,
        experience,
        employmentType,
      } = req.body || {};

      const [langs] = await db.query(
        `SELECT id, code FROM languages WHERE id = ? LIMIT 1`,
        [languageId]
      );
      if (!langs.length) return res.status(404).json({ error: "Language not found" });

      const isEnglish = String(langs[0].code).toLowerCase() === "en";
      const sample = `${title || ""} ${description || ""}`;
      if (isEnglish && !looksLikeEnglishText(sample)) {
        return res.status(400).json({
          error:
            "English version must be English text. Switch language before saving other-language content.",
        });
      }

      await saveJobLocalization(jobId, languageId, {
        title: title || "",
        summary: summary || "",
        description: description || "",
        requirements: requirements || "",
        location: location || "",
        experience: experience || "",
        employmentType: employmentType || "",
      });

      if (isEnglish) {
        await db.query(
          `UPDATE job_postings
           SET title = ?, summary = ?, description = ?, requirements = ?,
               location = ?, experience = ?, employment_type = ?
           WHERE id = ?`,
          [
            title?.trim() || "",
            summary || "",
            description || "",
            requirements || "",
            location || "",
            experience || "",
            employmentType || "",
            jobId,
          ]
        );
      }

      res.json({
        languageId,
        languageCode: langs[0].code,
        title: title || "",
        summary: summary || "",
        description: description || "",
        requirements: requirements || "",
        location: location || "",
        experience: experience || "",
        employmentType: employmentType || "",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

router.post(
  "/admin/jobs/:id/translate/:langCode",
  requireAdmin,
  async (req, res) => {
    try {
      const result = await ensureJobTranslation(
        Number(req.params.id),
        req.params.langCode,
        { force: Boolean(req.body?.force) }
      );
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
