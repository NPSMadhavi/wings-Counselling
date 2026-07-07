import { Router } from "express";
import { db } from "../config/db.js";
import { requireAdmin } from "../middlewares/auth.js";

const router = Router();

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

ensureTestimonialsTable().catch((err) => {
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
router.get("/testimonials", async (_req, res) => {
  try {
    await ensureTestimonialsTable();

    const [rows] = await db.query(
      `SELECT * FROM testmonials ORDER BY id ASC`
    );

    res.json(rows.map(normalizeTestimonial));
  } catch (err) {
    console.error("GET /testimonials:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= ADMIN LIST ================= */
router.get("/admin/testimonials", requireAdmin, async (_req, res) => {
  try {
    await ensureTestimonialsTable();

    const [rows] = await db.query(
      `SELECT * FROM testmonials ORDER BY id ASC`
    );

    res.json(rows.map(normalizeTestimonial));
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
