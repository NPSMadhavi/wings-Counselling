import express from "express";
import { db } from "../config/db.js";
import { requireAdmin } from "../middlewares/auth.js";

const router = express.Router();

async function ensureEmailRecipientsTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS email_recipients (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(320) NOT NULL UNIQUE,
      type ENUM('primary','cc') NOT NULL DEFAULT 'primary',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}

ensureEmailRecipientsTable().catch((err) => {
  console.error("Failed to ensure email_recipients table:", err);
});

router.get("/admin/settings/emails", requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT id, email, type, created_at, updated_at FROM email_recipients ORDER BY type DESC, created_at DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch email recipients" });
  }
});

router.post("/admin/settings/emails", requireAdmin, async (req, res) => {
  try {
    const { email, type } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email is required" });
    }

    const normalized = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalized)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const recipientType = type === "cc" ? "cc" : "primary";

    const [result] = await db.execute(
      "INSERT INTO email_recipients (email, type) VALUES (?, ?)",
      [normalized, recipientType]
    );

    res.status(201).json({ id: result.insertId, email: normalized, type: recipientType });
  } catch (error) {
    console.error(error);
    if (error?.errno === 1062) {
      return res.status(409).json({ error: "This email address is already configured" });
    }
    res.status(500).json({ error: "Failed to create email recipient" });
  }
});

router.patch("/admin/settings/emails/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { email, type } = req.body;
    const updates = [];
    const params = [];

    if (email && typeof email === "string") {
      const normalized = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalized)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      updates.push("email = ?");
      params.push(normalized);
    }

    if (type === "primary" || type === "cc") {
      updates.push("type = ?");
      params.push(type);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    params.push(id);

    await db.execute(
      `UPDATE email_recipients SET ${updates.join(", ")} WHERE id = ?`,
      params
    );

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update email recipient" });
  }
});

router.delete("/admin/settings/emails/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.execute("DELETE FROM email_recipients WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete email recipient" });
  }
});

export default router;
