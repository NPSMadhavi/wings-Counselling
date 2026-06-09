import express from "express";
import { db } from "../config/db.js";
import { requireAdmin } from "../middlewares/auth.js";

const router = express.Router();

async function ensureFormSubmissionEmailsTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS form_submission_emails (
      id INT AUTO_INCREMENT PRIMARY KEY,
      form_type VARCHAR(120) NOT NULL,
      source_id INT NULL,
      primary_mail TEXT NOT NULL,
      cc_mail TEXT NULL,
      subject VARCHAR(500) NOT NULL,
      content MEDIUMTEXT NOT NULL,
      remarks TEXT NULL,
      sender_email VARCHAR(320) NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_form_submission_emails_created (created_at DESC),
      INDEX idx_form_submission_emails_type (form_type)
    )
  `);
}

ensureFormSubmissionEmailsTable().catch((err) => {
  console.error("Failed to ensure form_submission_emails table:", err);
});

function mapRow(row) {
  return {
    id: row.id,
    formType: row.form_type,
    sourceId: row.source_id,
    primaryMail: row.primary_mail,
    ccMail: row.cc_mail ?? "",
    subject: row.subject,
    content: row.content,
    remarks: row.remarks ?? "",
    senderEmail: row.sender_email ?? "",
    isRead: Boolean(row.is_read),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.get("/admin/settings/primary-cc-mails", requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, form_type, source_id, primary_mail, cc_mail, subject, content, remarks,
              sender_email, is_read, created_at, updated_at
       FROM form_submission_emails
       ORDER BY created_at DESC`
    );
    res.json(rows.map(mapRow));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch form submission emails" });
  }
});

router.get("/admin/settings/primary-cc-mails/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await db.execute(
      `SELECT id, form_type, source_id, primary_mail, cc_mail, subject, content, remarks,
              sender_email, is_read, created_at, updated_at
       FROM form_submission_emails
       WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Email not found" });
    }

    res.json(mapRow(rows[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch email" });
  }
});

router.patch("/admin/settings/primary-cc-mails/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { primaryMail, ccMail, subject, content, remarks, isRead } = req.body;

    const updates = [];
    const params = [];

    if (primaryMail !== undefined) {
      if (typeof primaryMail !== "string" || !primaryMail.trim()) {
        return res.status(400).json({ error: "Primary mail is required" });
      }
      updates.push("primary_mail = ?");
      params.push(primaryMail.trim());
    }

    if (ccMail !== undefined) {
      updates.push("cc_mail = ?");
      params.push(typeof ccMail === "string" ? ccMail.trim() : "");
    }

    if (subject !== undefined) {
      if (typeof subject !== "string" || !subject.trim()) {
        return res.status(400).json({ error: "Subject is required" });
      }
      updates.push("subject = ?");
      params.push(subject.trim());
    }

    if (content !== undefined) {
      if (typeof content !== "string" || !content.trim()) {
        return res.status(400).json({ error: "Content is required" });
      }
      updates.push("content = ?");
      params.push(content.trim());
    }

    if (remarks !== undefined) {
      updates.push("remarks = ?");
      params.push(typeof remarks === "string" ? remarks.trim() : "");
    }

    if (isRead !== undefined) {
      updates.push("is_read = ?");
      params.push(isRead ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    params.push(id);

    const [result] = await db.execute(
      `UPDATE form_submission_emails SET ${updates.join(", ")} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Email not found" });
    }

    const [rows] = await db.execute(
      `SELECT id, form_type, source_id, primary_mail, cc_mail, subject, content, remarks,
              sender_email, is_read, created_at, updated_at
       FROM form_submission_emails
       WHERE id = ?`,
      [id]
    );

    res.json(mapRow(rows[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update email" });
  }
});

router.delete("/admin/settings/primary-cc-mails/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid mail id" });
    }

    const [result] = await db.execute(
      "DELETE FROM form_submission_emails WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Email not found" });
    }

    res.json({ success: true, id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete email" });
  }
});

router.post("/admin/settings/primary-cc-mails/bulk-delete", requireAdmin, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "ids array is required" });
    }

    const numericIds = ids
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id));

    if (numericIds.length === 0) {
      return res.status(400).json({ error: "No valid ids provided" });
    }

    const placeholders = numericIds.map(() => "?").join(", ");
    const [result] = await db.execute(
      `DELETE FROM form_submission_emails WHERE id IN (${placeholders})`,
      numericIds
    );

    res.json({ success: true, deleted: result.affectedRows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete emails" });
  }
});

export default router;
