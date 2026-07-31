import { Router } from "express";
import { db } from "../config/db.js";
import { requireAdmin } from "../middlewares/auth.js";
import { isDuplicateColumnError } from "../config/pg-helpers.js";
import {
  ensurePartnerLanguageTables,
  localizePartners,
  savePartnerLocalization,
} from "../services/partnerTranslate.js";
import { looksLikeEnglishText } from "../services/translateService.js";

const router = Router();

function normalizeLangCode(value) {
  return String(value || "en")
    .toLowerCase()
    .split("-")[0];
}

async function getLanguageIdByCode(code) {
  const [rows] = await db.query(
    `SELECT id FROM languages WHERE LOWER(code) = ? LIMIT 1`,
    [normalizeLangCode(code)]
  );
  return rows[0]?.id || null;
}

async function ensurePartnerColumns() {
  const columns = [
    "duration VARCHAR(255)",
    "quote TEXT",
  ];

  for (const definition of columns) {
    try {
      await db.query(`ALTER TABLE logos ADD COLUMN ${definition}`);
    } catch (err) {
      if (!isDuplicateColumnError(err)) {
        console.error(`[DB] logos ${definition}:`, err?.message);
      }
    }
  }
}

async function ensureLogosTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS logos (
      id SERIAL PRIMARY KEY,
      logo VARCHAR(255),
      name VARCHAR(150) NOT NULL,
      description TEXT,
      website_link VARCHAR(255),
      duration VARCHAR(255),
      quote TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await ensurePartnerColumns();
  try {
    await ensurePartnerLanguageTables();
  } catch (err) {
    console.warn("[partners] language tables:", err?.message);
  }
}

ensureLogosTable().catch((err) => {
  console.error("Failed to ensure logos table:", err.message);
});

function normalizePartner(row) {
  return {
    id: row.id,
    logo: row.logo ?? "",
    name: row.name ?? "",
    description: row.description ?? "",
    duration: row.duration ?? "",
    quote: row.quote ?? "",
    websiteLink: row.website_link ?? "",
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

function buildPayload(body) {
  return {
    logo: body.logo ?? "",
    name: String(body.name ?? "").trim(),
    description: body.description ?? "",
    duration: body.duration ?? "",
    quote: body.quote ?? "",
    website_link: body.websiteLink ?? body.website_link ?? "",
  };
}

/* ================= PUBLIC ================= */
router.get("/partners", async (req, res) => {
  try {
    await ensureLogosTable();
    const lang = normalizeLangCode(req.query.lang);

    const [rows] = await db.query(`SELECT * FROM logos ORDER BY id ASC`);
    let data = rows.map(normalizePartner);
    if (lang && lang !== "en") {
      data = await localizePartners(data, lang);
    }

    res.json(data);
  } catch (err) {
    console.error("GET /partners:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= ADMIN LIST ================= */
router.get("/admin/partners", requireAdmin, async (req, res) => {
  try {
    await ensureLogosTable();
    const lang = normalizeLangCode(req.query.lang);

    const [rows] = await db.query(`SELECT * FROM logos ORDER BY id ASC`);
    let data = rows.map(normalizePartner);
    if (lang && lang !== "en") {
      data = await localizePartners(data, lang);
    }

    res.json(data);
  } catch (err) {
    console.error("GET /admin/partners:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= ADMIN VIEW ================= */
router.get("/admin/partners/:id", requireAdmin, async (req, res) => {
  try {
    await ensureLogosTable();

    const { id } = req.params;
    const [rows] = await db.query(`SELECT * FROM logos WHERE id = ?`, [id]);

    if (!rows.length) {
      return res.status(404).json({ error: "Partner not found" });
    }

    res.json(normalizePartner(rows[0]));
  } catch (err) {
    console.error("GET /admin/partners/:id:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= CREATE ================= */
router.post("/admin/partners", requireAdmin, async (req, res) => {
  try {
    await ensureLogosTable();

    const payload = buildPayload(req.body);

    if (!payload.name) {
      return res.status(400).json({ error: "Partner name is required" });
    }

    let languageId = req.body.language_id ? Number(req.body.language_id) : null;
    if (!languageId && req.body.language_code) {
      languageId = await getLanguageIdByCode(req.body.language_code);
    }
    if (!languageId) languageId = await getLanguageIdByCode("en");

    const [result] = await db.query(
      `INSERT INTO logos (logo, name, description, website_link, duration, quote)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        payload.logo,
        payload.name,
        payload.description,
        payload.website_link,
        payload.duration,
        payload.quote,
      ]
    );

    if (languageId) {
      try {
        await ensurePartnerLanguageTables();
        await savePartnerLocalization(result.insertId, languageId, {
          name: payload.name,
          description: payload.description,
          duration: payload.duration,
          quote: payload.quote,
        });
      } catch (err) {
        console.warn("[partners] save localization:", err?.message);
      }
    }

    const [rows] = await db.query(`SELECT * FROM logos WHERE id = ?`, [
      result.insertId,
    ]);

    res.status(201).json(normalizePartner(rows[0]));
  } catch (err) {
    console.error("POST /admin/partners:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= UPDATE ================= */
router.put("/admin/partners/:id", requireAdmin, async (req, res) => {
  try {
    await ensureLogosTable();

    const { id } = req.params;
    const payload = buildPayload(req.body);

    if (!payload.name) {
      return res.status(400).json({ error: "Partner name is required" });
    }

    let languageId = req.body.language_id ? Number(req.body.language_id) : null;
    let langCode = req.body.language_code
      ? normalizeLangCode(req.body.language_code)
      : null;
    if (languageId && !langCode) {
      const [langRows] = await db.query(
        `SELECT code FROM languages WHERE id = ? LIMIT 1`,
        [languageId]
      );
      langCode = normalizeLangCode(langRows[0]?.code || "en");
    }
    if (!langCode) langCode = "en";
    if (!languageId) languageId = await getLanguageIdByCode(langCode);
    const isEnglish = langCode === "en";
    const englishSample = `${payload.name || ""} ${payload.description || ""}`;
    // Never overwrite logos English master with Hindi/Tamil/Chinese text
    const canWriteEnglishMaster =
      isEnglish && looksLikeEnglishText(englishSample);

    if (canWriteEnglishMaster) {
      await db.query(
        `UPDATE logos
         SET logo = ?, name = ?, description = ?, website_link = ?, duration = ?, quote = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          payload.logo,
          payload.name,
          payload.description,
          payload.website_link,
          payload.duration,
          payload.quote,
          id,
        ]
      );
    } else if (isEnglish) {
      // Still update logo/link; keep existing English text on logos
      await db.query(
        `UPDATE logos
         SET logo = COALESCE(NULLIF(?, ''), logo),
             website_link = COALESCE(NULLIF(?, ''), website_link),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [payload.logo, payload.website_link, id]
      );
    } else {
      await db.query(
        `UPDATE logos
         SET logo = COALESCE(NULLIF(?, ''), logo),
             website_link = COALESCE(NULLIF(?, ''), website_link),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [payload.logo, payload.website_link, id]
      );
    }

    if (languageId) {
      try {
        await ensurePartnerLanguageTables();
        // Do not store non-English text under the English language row
        if (!isEnglish || canWriteEnglishMaster) {
          await savePartnerLocalization(Number(id), languageId, {
            name: payload.name,
            description: payload.description,
            duration: payload.duration,
            quote: payload.quote,
          });
        }
      } catch (err) {
        console.warn("[partners] update localization:", err?.message);
      }
    }

    const [rows] = await db.query(`SELECT * FROM logos WHERE id = ?`, [id]);

    if (!rows.length) {
      return res.status(404).json({ error: "Partner not found" });
    }

    res.json(normalizePartner(rows[0]));
  } catch (err) {
    console.error("PUT /admin/partners/:id:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= DELETE ================= */
router.delete("/admin/partners/:id", requireAdmin, async (req, res) => {
  try {
    await ensureLogosTable();

    const { id } = req.params;

    const [result] = await db.query(`DELETE FROM logos WHERE id = ?`, [id]);

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Partner not found" });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /admin/partners/:id:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
