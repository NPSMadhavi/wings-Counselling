import { Router } from "express";
import { db } from "../config/db.js";
import { requireAdmin } from "../middlewares/auth.js";
import fs from "fs";

const router = Router();

let teamStoragePromise;

function parseJsonArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function detectTeamStorage() {
  if (!teamStoragePromise) {
    teamStoragePromise = (async () => {
      const [camelTables] = await db.query(
        "SHOW TABLES LIKE 'teamMembers'"
      );

      const tableName = camelTables.length ? "teamMembers" : "team_members";

      const [columns] = await db.query(`SHOW COLUMNS FROM ${tableName}`);
      const names = new Set(columns.map((c) => c.Field));

      return {
        tableName,
        title: names.has("title") ? "title" : null,
        role: names.has("role") ? "role" : null,
        bio: names.has("bio") ? "bio" : null,
        credentials: names.has("credentials") ? "credentials" : null,
        specialisations: names.has("specialisations") ? "specialisations" : null,
        experience: names.has("experience") ? "experience" : null, // Added experience field
        photoUrl: names.has("photoUrl") ? "photoUrl" : "photo_url",
        email: names.has("email") ? "email" : null,
        displayOrder: names.has("displayOrder") ? "displayOrder" : "display_order",
        isVisible: names.has("isVisible") ? "isVisible" : "is_visible",
        createdAt: names.has("createdAt") ? "createdAt" : "created_at",
        updatedAt: names.has("updatedAt") ? "updatedAt" : "updated_at",
      };
    })();
  }

  return teamStoragePromise;
}

function normaliseMember(row, storage) {
  return {
    id: row.id,
    name: row.name ?? "",
    title: storage.title ? row[storage.title] ?? "" : "",
    role: storage.role ? row[storage.role] ?? "counsellor" : "counsellor",
    bio: storage.bio ? row[storage.bio] ?? "" : "",
    credentials: storage.credentials ? parseJsonArray(row[storage.credentials]) : [],
    specialisations: storage.specialisations ? parseJsonArray(row[storage.specialisations]) : [],
    experience: storage.experience ? row[storage.experience] ?? "" : "", // Added experience field
    photoUrl: storage.photoUrl ? row[storage.photoUrl] ?? "" : "",
    email: storage.email ? row[storage.email] ?? "" : "",
    displayOrder: storage.displayOrder ? Number(row[storage.displayOrder] ?? 0) : 0,
    isVisible: storage.isVisible ? Boolean(row[storage.isVisible]) : true,
  };
}

function buildWritePayload(body, storage) {
  const payload = {
    name: body.name ?? "",
    [storage.title]: body.title ?? "",
    [storage.role]: body.role ?? "counsellor",
    [storage.bio]: body.bio ?? "",
    [storage.credentials]: JSON.stringify(body.credentials || []),
    [storage.specialisations]: JSON.stringify(body.specialisations || []),
    [storage.photoUrl]: body.photoUrl ?? "",
    [storage.email]: body.email ?? "",
    [storage.displayOrder]: Number(body.displayOrder ?? 0),
    [storage.isVisible]: body.isVisible ? 1 : 0,
  };
  
  // Add experience if the field exists in the database
  if (storage.experience) {
    payload[storage.experience] = body.experience ?? "";
  }
  
  return payload;
}

/* ================= PUBLIC TEAM ================= */
router.get("/team", async (_req, res) => {
  try {
    const storage = await detectTeamStorage();

    const [rows] = await db.query(
      `SELECT * FROM ${storage.tableName}
       WHERE ${storage.isVisible} = 1
       ORDER BY ${storage.displayOrder} ASC, id ASC`
    );

    res.json(rows.map((r) => normaliseMember(r, storage)));
  } catch (err) {
    fs.appendFileSync("api_debug.log", err.stack + "\n");
    res.status(500).json({ error: err.message });
  }
});

/* ================= ADMIN TEAM ================= */
router.get("/admin/team", requireAdmin, async (_req, res) => {
  try {
    const storage = await detectTeamStorage();

    const [rows] = await db.query(
      `SELECT * FROM ${storage.tableName}
       ORDER BY ${storage.displayOrder} ASC, id ASC`
    );

    res.json(rows.map((r) => normaliseMember(r, storage)));
  } catch (err) {
    fs.appendFileSync("api_debug.log", err.stack + "\n");
    res.status(500).json({ error: err.message });
  }
});

/* ================= CREATE ================= */
router.post("/admin/team", requireAdmin, async (req, res) => {
  try {
    const storage = await detectTeamStorage();
    const payload = buildWritePayload(req.body, storage);

    const columns = Object.keys(payload);
    const values = Object.values(payload);

    const [result] = await db.query(
      `INSERT INTO ${storage.tableName}
       (${columns.join(", ")})
       VALUES (${columns.map(() => "?").join(", ")})`,
      values
    );

    const [rows] = await db.query(
      `SELECT * FROM ${storage.tableName} WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json(normaliseMember(rows[0], storage));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= UPDATE ================= */
router.put("/admin/team/:id", requireAdmin, async (req, res) => {
  try {
    const storage = await detectTeamStorage();
    const { id } = req.params;

    const data = buildWritePayload(req.body, storage);

    if (storage.updatedAt) {
      data[storage.updatedAt] = new Date();
    }

    await db.query(
      `UPDATE ${storage.tableName} SET ? WHERE id = ?`,
      [data, id]
    );

    const [rows] = await db.query(
      `SELECT * FROM ${storage.tableName} WHERE id = ?`,
      [id]
    );

    res.json(normaliseMember(rows[0], storage));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= DELETE ================= */
router.delete("/admin/team/:id", requireAdmin, async (req, res) => {
  try {
    const storage = await detectTeamStorage();
    const { id } = req.params;

    await db.query(
      `DELETE FROM ${storage.tableName} WHERE id = ?`,
      [id]
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;