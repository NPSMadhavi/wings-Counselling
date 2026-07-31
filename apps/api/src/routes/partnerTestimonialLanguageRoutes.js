/**
 * Partner + Testimonial multi-language admin API
 */

import { Router } from "express";
import { db } from "../config/db.js";
import { requireAdmin } from "../middlewares/auth.js";
import {
  ensurePartnerLanguageTables,
  ensurePartnerTranslation,
  savePartnerLocalization,
} from "../services/partnerTranslate.js";
import {
  ensureTestimonialLanguageTables,
  ensureTestimonialTranslation,
  saveTestimonialLocalization,
} from "../services/testimonialTranslate.js";
import { looksLikeEnglishText } from "../services/translateService.js";

const router = Router();

/* -------- Partners -------- */

router.get("/admin/partners/:id/languages", requireAdmin, async (req, res) => {
  try {
    await ensurePartnerLanguageTables();
    const partnerId = Number(req.params.id);
    const [rows] = await db.query(
      `SELECT pl.id, pl.language_id AS "languageId", l.code AS "languageCode",
              l.name AS "languageName", pl.name, pl.description, pl.duration, pl.quote
       FROM partner_language pl
       JOIN languages l ON l.id = pl.language_id
       WHERE pl.partner_id = ?
       ORDER BY l.id ASC`,
      [partnerId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.put(
  "/admin/partners/:id/languages/:languageId",
  requireAdmin,
  async (req, res) => {
    try {
      await ensurePartnerLanguageTables();
      const partnerId = Number(req.params.id);
      const languageId = Number(req.params.languageId);
      const { name, description, duration, quote } = req.body || {};

      const [langs] = await db.query(
        `SELECT id, code FROM languages WHERE id = ? LIMIT 1`,
        [languageId]
      );
      if (!langs.length) return res.status(404).json({ error: "Language not found" });

      const isEnglish = String(langs[0].code).toLowerCase() === "en";
      const sample = `${name || ""} ${description || ""}`;
      if (isEnglish && !looksLikeEnglishText(sample)) {
        return res.status(400).json({
          error:
            "English version must be English text. Switch language before saving Hindi/Tamil/Chinese content.",
        });
      }

      await savePartnerLocalization(partnerId, languageId, {
        name: name || "",
        description: description || "",
        duration: duration || "",
        quote: quote || "",
      });

      if (isEnglish) {
        await db.query(
          `UPDATE logos
           SET name = ?, description = ?, duration = ?, quote = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [name?.trim() || "", description || "", duration || "", quote || "", partnerId]
        );
      }

      res.json({
        languageId,
        languageCode: langs[0].code,
        name: name || "",
        description: description || "",
        duration: duration || "",
        quote: quote || "",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

router.post(
  "/admin/partners/:id/translate/:langCode",
  requireAdmin,
  async (req, res) => {
    try {
      const result = await ensurePartnerTranslation(
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

/* -------- Testimonials -------- */

router.get(
  "/admin/testimonials/:id/languages",
  requireAdmin,
  async (req, res) => {
    try {
      await ensureTestimonialLanguageTables();
      const testimonialId = Number(req.params.id);
      const [rows] = await db.query(
        `SELECT tl.id, tl.language_id AS "languageId", l.code AS "languageCode",
                l.name AS "languageName",
                tl.service_name AS "serviceName", tl.description,
                tl.client_name AS "clientName",
                tl.client_company_name AS "clientCompanyName"
         FROM testimonial_language tl
         JOIN languages l ON l.id = tl.language_id
         WHERE tl.testimonial_id = ?
         ORDER BY l.id ASC`,
        [testimonialId]
      );
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

router.put(
  "/admin/testimonials/:id/languages/:languageId",
  requireAdmin,
  async (req, res) => {
    try {
      await ensureTestimonialLanguageTables();
      const testimonialId = Number(req.params.id);
      const languageId = Number(req.params.languageId);
      const { serviceName, description, clientName, clientCompanyName } =
        req.body || {};

      const [langs] = await db.query(
        `SELECT id, code FROM languages WHERE id = ? LIMIT 1`,
        [languageId]
      );
      if (!langs.length) return res.status(404).json({ error: "Language not found" });

      await saveTestimonialLocalization(testimonialId, languageId, {
        serviceName: serviceName || "",
        description: description || "",
        clientName: clientName || "",
        clientCompanyName: clientCompanyName || "",
      });

      if (String(langs[0].code).toLowerCase() === "en") {
        await db.query(
          `UPDATE testmonials
           SET service_name = ?, description = ?, client_name = ?, client_company_name = ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [
            serviceName?.trim() || "",
            description || "",
            clientName?.trim() || "",
            clientCompanyName || "",
            testimonialId,
          ]
        );
      }

      res.json({
        languageId,
        languageCode: langs[0].code,
        serviceName: serviceName || "",
        description: description || "",
        clientName: clientName || "",
        clientCompanyName: clientCompanyName || "",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

router.post(
  "/admin/testimonials/:id/translate/:langCode",
  requireAdmin,
  async (req, res) => {
    try {
      const result = await ensureTestimonialTranslation(
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
