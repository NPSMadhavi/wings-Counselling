/**
 * Counselling / Services multi-language admin API
 *
 * GET  /api/admin/counselling-types/:id/languages
 * PUT  /api/admin/counselling-types/:id/languages/:languageId
 * POST /api/admin/counselling-types/:id/translate/:langCode
 * GET  /api/admin/counselling-sub-types/:id/languages
 * PUT  /api/admin/counselling-sub-types/:id/languages/:languageId
 * POST /api/admin/counselling-sub-types/:id/translate/:langCode
 */

import { Router } from "express";
import { db } from "../config/db.js";
import { requireAdmin } from "../middlewares/auth.js";
import {
  ensureCounsellingLanguageTables,
  ensureTypeTranslation,
  ensureSubTypeTranslation,
  saveTypeLocalization,
  saveSubTypeLocalization,
} from "../services/counsellingTranslate.js";

const router = Router();

router.get(
  "/admin/counselling-types/:id/languages",
  requireAdmin,
  async (req, res) => {
    try {
      await ensureCounsellingLanguageTables();
      const typeId = Number(req.params.id);
      const [rows] = await db.query(
        `SELECT ctl.id, ctl.language_id AS "languageId", l.code AS "languageCode",
                l.name AS "languageName", ctl.name, ctl.description,
                ctl.updated_at AS "updatedAt"
         FROM counselling_type_language ctl
         JOIN languages l ON l.id = ctl.language_id
         WHERE ctl.counselling_type_id = ?
         ORDER BY l.id ASC`,
        [typeId]
      );
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

router.put(
  "/admin/counselling-types/:id/languages/:languageId",
  requireAdmin,
  async (req, res) => {
    try {
      await ensureCounsellingLanguageTables();
      const typeId = Number(req.params.id);
      const languageId = Number(req.params.languageId);
      const { name, description } = req.body || {};

      const [langs] = await db.query(
        `SELECT id, code FROM languages WHERE id = ? LIMIT 1`,
        [languageId]
      );
      if (!langs.length) {
        return res.status(404).json({ error: "Language not found" });
      }

      await saveTypeLocalization(typeId, languageId, {
        name: name || "",
        description: description || "",
      });

      // Keep base table in sync when saving English
      if (String(langs[0].code).toLowerCase() === "en") {
        await db.query(
          `UPDATE counselling_types SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [name?.trim() || "", description || null, typeId]
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
  "/admin/counselling-types/:id/translate/:langCode",
  requireAdmin,
  async (req, res) => {
    try {
      const typeId = Number(req.params.id);
      const force = Boolean(req.body?.force);
      const result = await ensureTypeTranslation(typeId, req.params.langCode, {
        force,
      });
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

router.get(
  "/admin/counselling-sub-types/:id/languages",
  requireAdmin,
  async (req, res) => {
    try {
      await ensureCounsellingLanguageTables();
      const subId = Number(req.params.id);
      const [rows] = await db.query(
        `SELECT cstl.id, cstl.language_id AS "languageId", l.code AS "languageCode",
                l.name AS "languageName", cstl.name, cstl.description, cstl.heading,
                cstl.updated_at AS "updatedAt"
         FROM counselling_sub_type_language cstl
         JOIN languages l ON l.id = cstl.language_id
         WHERE cstl.counselling_sub_type_id = ?
         ORDER BY l.id ASC`,
        [subId]
      );
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

router.put(
  "/admin/counselling-sub-types/:id/languages/:languageId",
  requireAdmin,
  async (req, res) => {
    try {
      await ensureCounsellingLanguageTables();
      const subId = Number(req.params.id);
      const languageId = Number(req.params.languageId);
      const { name, description, heading } = req.body || {};

      const [langs] = await db.query(
        `SELECT id, code FROM languages WHERE id = ? LIMIT 1`,
        [languageId]
      );
      if (!langs.length) {
        return res.status(404).json({ error: "Language not found" });
      }

      await saveSubTypeLocalization(subId, languageId, {
        name: name || "",
        description: description || "",
        heading: heading || "",
      });

      if (String(langs[0].code).toLowerCase() === "en") {
        await db.query(
          `UPDATE counselling_sub_types
           SET name = ?, description = ?, heading = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [name?.trim() || "", description || null, heading?.trim() || null, subId]
        );
      }

      res.json({
        languageId,
        languageCode: langs[0].code,
        name: name || "",
        description: description || "",
        heading: heading || "",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

router.post(
  "/admin/counselling-sub-types/:id/translate/:langCode",
  requireAdmin,
  async (req, res) => {
    try {
      const subId = Number(req.params.id);
      const force = Boolean(req.body?.force);
      const result = await ensureSubTypeTranslation(subId, req.params.langCode, {
        force,
      });
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
