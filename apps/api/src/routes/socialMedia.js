import { Router } from "express";
import { db } from "../config/db.js";
import { requireAdmin } from "../middlewares/auth.js";

const router = Router();

async function ensureSocialMediaTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS social_media_links (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      icon VARCHAR(500) NOT NULL DEFAULT '',
      link VARCHAR(500) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

ensureSocialMediaTable().catch((err) => {
  console.error("Failed to ensure social_media_links table:", err.message);
});

function normalizeLink(row) {
  return {
    id: row.id,
    name: row.name ?? "",
    icon: row.icon ?? "",
    link: row.link ?? "",
    sortOrder: Number(row.sort_order ?? 0),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

function buildPayload(body) {
  return {
    name: String(body.name ?? "").trim(),
    icon: String(body.icon ?? "").trim(),
    link: String(body.link ?? body.url ?? "").trim(),
    sort_order: Number.isFinite(Number(body.sortOrder ?? body.sort_order))
      ? Number(body.sortOrder ?? body.sort_order)
      : 0,
    is_active:
      body.isActive === undefined && body.is_active === undefined
        ? true
        : Boolean(body.isActive ?? body.is_active),
  };
}

/* ================= PUBLIC (footer) ================= */
router.get("/social-media", async (_req, res) => {
  try {
    await ensureSocialMediaTable();
    const [rows] = await db.query(
      `SELECT * FROM social_media_links
       WHERE is_active = TRUE
       ORDER BY sort_order ASC, id ASC`
    );
    res.json(rows.map(normalizeLink));
  } catch (err) {
    console.error("GET /social-media:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= ADMIN ================= */
router.get("/admin/social-media", requireAdmin, async (_req, res) => {
  try {
    await ensureSocialMediaTable();
    const [rows] = await db.query(
      `SELECT * FROM social_media_links
       ORDER BY sort_order ASC, id ASC`
    );
    res.json(rows.map(normalizeLink));
  } catch (err) {
    console.error("GET /admin/social-media:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/admin/social-media", requireAdmin, async (req, res) => {
  try {
    await ensureSocialMediaTable();
    const payload = buildPayload(req.body);

    if (!payload.name) {
      return res.status(400).json({ error: "Name is required" });
    }
    if (!payload.link) {
      return res.status(400).json({ error: "Link is required" });
    }
    if (!payload.icon) {
      return res.status(400).json({ error: "Icon image is required" });
    }

    const [result] = await db.query(
      `INSERT INTO social_media_links (name, icon, link, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [
        payload.name,
        payload.icon,
        payload.link,
        payload.sort_order,
        payload.is_active,
      ]
    );

    const [rows] = await db.query(
      `SELECT * FROM social_media_links WHERE id = ?`,
      [result.insertId]
    );
    res.status(201).json(normalizeLink(rows[0]));
  } catch (err) {
    console.error("POST /admin/social-media:", err);
    res.status(500).json({ error: err.message });
  }
});

router.put("/admin/social-media/:id", requireAdmin, async (req, res) => {
  try {
    await ensureSocialMediaTable();
    const { id } = req.params;
    const payload = buildPayload(req.body);

    if (!payload.name) {
      return res.status(400).json({ error: "Name is required" });
    }
    if (!payload.link) {
      return res.status(400).json({ error: "Link is required" });
    }
    if (!payload.icon) {
      return res.status(400).json({ error: "Icon image is required" });
    }

    await db.query(
      `UPDATE social_media_links
       SET name = ?, icon = ?, link = ?, sort_order = ?, is_active = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        payload.name,
        payload.icon,
        payload.link,
        payload.sort_order,
        payload.is_active,
        id,
      ]
    );

    const [rows] = await db.query(
      `SELECT * FROM social_media_links WHERE id = ?`,
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: "Social media link not found" });
    }
    res.json(normalizeLink(rows[0]));
  } catch (err) {
    console.error("PUT /admin/social-media/:id:", err);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/admin/social-media/:id", requireAdmin, async (req, res) => {
  try {
    await ensureSocialMediaTable();
    const { id } = req.params;
    const [result] = await db.query(
      `DELETE FROM social_media_links WHERE id = ?`,
      [id]
    );
    if (!result.affectedRows) {
      return res.status(404).json({ error: "Social media link not found" });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /admin/social-media/:id:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
