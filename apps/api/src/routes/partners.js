import { Router } from "express";
import { db } from "../config/db.js";
import { requireAdmin } from "../middlewares/auth.js";

const router = Router();

async function ensureLogosTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS logos (
      id SERIAL PRIMARY KEY,
      logo VARCHAR(255),
      name VARCHAR(150) NOT NULL,
      description TEXT,
      website_link VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
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
    website_link: body.websiteLink ?? body.website_link ?? "",
  };
}

/* ================= PUBLIC ================= */
router.get("/partners", async (_req, res) => {
  try {
    await ensureLogosTable();

    const [rows] = await db.query(
      `SELECT * FROM logos ORDER BY id ASC`
    );

    res.json(rows.map(normalizePartner));
  } catch (err) {
    console.error("GET /partners:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= ADMIN LIST ================= */
router.get("/admin/partners", requireAdmin, async (_req, res) => {
  try {
    await ensureLogosTable();

    const [rows] = await db.query(
      `SELECT * FROM logos ORDER BY id ASC`
    );

    res.json(rows.map(normalizePartner));
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

    const [result] = await db.query(
      `INSERT INTO logos (logo, name, description, website_link)
       VALUES (?, ?, ?, ?)`,
      [payload.logo, payload.name, payload.description, payload.website_link]
    );

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

    await db.query(
      `UPDATE logos
       SET logo = ?, name = ?, description = ?, website_link = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [payload.logo, payload.name, payload.description, payload.website_link, id]
    );

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
