import { Router } from "express";
import { db } from "../config/db.js";
import { requireAdmin } from "../middlewares/auth.js";
import {
  ensureTestimonialLanguageTables,
  localizeTestimonials,
  saveTestimonialLocalization,
} from "../services/testimonialTranslate.js";

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

async function ensureTestimonialsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS testmonials (
      id SERIAL PRIMARY KEY,
      service_name VARCHAR(255) NOT NULL,
      description TEXT,
      client_name VARCHAR(150) NOT NULL,
      client_company_name VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

ensureTestimonialsTable()
  .then(() => ensureTestimonialLanguageTables())
  .catch((err) => {
    console.error("Failed to ensure testmonials table:", err.message);
  });

function normalizeTestimonial(row) {
  return {
    id: row.id,
    serviceName: row.service_name ?? "",
    description: row.description ?? "",
    clientName: row.client_name ?? "",
    clientCompanyName: row.client_company_name ?? "",
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

function buildPayload(body) {
  return {
    service_name: String(body.serviceName ?? body.service_name ?? "").trim(),
    description: body.description ?? "",
    client_name: String(body.clientName ?? body.client_name ?? "").trim(),
    client_company_name:
      body.clientCompanyName ?? body.client_company_name ?? "",
  };
}

/* ================= PUBLIC ================= */
router.get("/testimonials", async (req, res) => {
  try {
    await ensureTestimonialsTable();
    const lang = normalizeLangCode(req.query.lang);

    const [rows] = await db.query(`SELECT * FROM testmonials ORDER BY id ASC`);
    let data = rows.map(normalizeTestimonial);
    if (lang && lang !== "en") {
      data = await localizeTestimonials(data, lang);
    }

    res.json(data);
  } catch (err) {
    console.error("GET /testimonials:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= ADMIN LIST ================= */
router.get("/admin/testimonials", requireAdmin, async (req, res) => {
  try {
    await ensureTestimonialsTable();
    const lang = normalizeLangCode(req.query.lang);

    const [rows] = await db.query(`SELECT * FROM testmonials ORDER BY id ASC`);
    let data = rows.map(normalizeTestimonial);
    if (lang && lang !== "en") {
      data = await localizeTestimonials(data, lang);
    }

    res.json(data);
  } catch (err) {
    console.error("GET /admin/testimonials:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= ADMIN VIEW ================= */
router.get("/admin/testimonials/:id", requireAdmin, async (req, res) => {
  try {
    await ensureTestimonialsTable();

    const { id } = req.params;
    const [rows] = await db.query(`SELECT * FROM testmonials WHERE id = ?`, [id]);

    if (!rows.length) {
      return res.status(404).json({ error: "Testimonial not found" });
    }

    res.json(normalizeTestimonial(rows[0]));
  } catch (err) {
    console.error("GET /admin/testimonials/:id:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= CREATE ================= */
router.post("/admin/testimonials", requireAdmin, async (req, res) => {
  try {
    await ensureTestimonialsTable();

    const payload = buildPayload(req.body);

    if (!payload.service_name) {
      return res.status(400).json({ error: "Service name is required" });
    }

    if (!payload.client_name) {
      return res.status(400).json({ error: "Client name is required" });
    }

    let languageId = req.body.language_id ? Number(req.body.language_id) : null;
    if (!languageId && req.body.language_code) {
      languageId = await getLanguageIdByCode(req.body.language_code);
    }
    if (!languageId) languageId = await getLanguageIdByCode("en");

    const [result] = await db.query(
      `INSERT INTO testmonials (service_name, description, client_name, client_company_name)
       VALUES (?, ?, ?, ?)`,
      [
        payload.service_name,
        payload.description,
        payload.client_name,
        payload.client_company_name,
      ]
    );

    if (languageId) {
      try {
        await ensureTestimonialLanguageTables();
        await saveTestimonialLocalization(result.insertId, languageId, {
          serviceName: payload.service_name,
          description: payload.description,
          clientName: payload.client_name,
          clientCompanyName: payload.client_company_name,
        });
      } catch (err) {
        console.warn("[testimonials] save localization:", err?.message);
      }
    }

    const [rows] = await db.query(`SELECT * FROM testmonials WHERE id = ?`, [
      result.insertId,
    ]);

    res.status(201).json(normalizeTestimonial(rows[0]));
  } catch (err) {
    console.error("POST /admin/testimonials:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= UPDATE ================= */
router.put("/admin/testimonials/:id", requireAdmin, async (req, res) => {
  try {
    await ensureTestimonialsTable();

    const { id } = req.params;
    const payload = buildPayload(req.body);

    if (!payload.service_name) {
      return res.status(400).json({ error: "Service name is required" });
    }

    if (!payload.client_name) {
      return res.status(400).json({ error: "Client name is required" });
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

    if (isEnglish) {
      await db.query(
        `UPDATE testmonials
         SET service_name = ?, description = ?, client_name = ?, client_company_name = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          payload.service_name,
          payload.description,
          payload.client_name,
          payload.client_company_name,
          id,
        ]
      );
    }

    if (languageId) {
      try {
        await ensureTestimonialLanguageTables();
        await saveTestimonialLocalization(Number(id), languageId, {
          serviceName: payload.service_name,
          description: payload.description,
          clientName: payload.client_name,
          clientCompanyName: payload.client_company_name,
        });
      } catch (err) {
        console.warn("[testimonials] update localization:", err?.message);
      }
    }

    const [rows] = await db.query(`SELECT * FROM testmonials WHERE id = ?`, [id]);

    if (!rows.length) {
      return res.status(404).json({ error: "Testimonial not found" });
    }

    res.json(normalizeTestimonial(rows[0]));
  } catch (err) {
    console.error("PUT /admin/testimonials/:id:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= DELETE ================= */
router.delete("/admin/testimonials/:id", requireAdmin, async (req, res) => {
  try {
    await ensureTestimonialsTable();

    const { id } = req.params;

    const [result] = await db.query(`DELETE FROM testmonials WHERE id = ?`, [id]);

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Testimonial not found" });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /admin/testimonials/:id:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
