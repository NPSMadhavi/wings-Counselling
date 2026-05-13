import { Router } from "express";
import { db } from "../config/db.js";
import { requireAdmin } from "../middlewares/auth.js";

const router = Router();

let careerStoragePromise;

async function detectCareerStorage() {
  if (!careerStoragePromise) {
    careerStoragePromise = (async () => {
      const [columns] = await db.promise().query("SHOW COLUMNS FROM careers");
      const names = new Set(columns.map((column) => column.Field));

      return {
        jobId: names.has("jobId") ? "jobId" : "job_id",
        employmentType: names.has("employmentType") ? "employmentType" : "employment_type",
        salaryRange: names.has("salaryRange") ? "salaryRange" : "salary_range",
        isActive: names.has("isActive") ? "isActive" : "is_active",
        postedAt: names.has("postedAt") ? "postedAt" : "posted_at",
        closesAt: names.has("closesAt") ? "closesAt" : "closes_at",
        createdAt: names.has("createdAt") ? "createdAt" : "created_at",
        updatedAt: names.has("updatedAt") ? "updatedAt" : "updated_at",
      };
    })();
  }

  return careerStoragePromise;
}

function normaliseCareer(row, storage) {
  return {
    id: row.id,
    jobId: row[storage.jobId] ?? "",
    title: row.title ?? "",
    department: row.department ?? "",
    location: row.location ?? "",
    description: row.description ?? "",
    requirements: row.requirements ?? "",
    employmentType: row[storage.employmentType] ?? "",
    salaryRange: row[storage.salaryRange] ?? "",
    isActive: Boolean(row[storage.isActive]),
    postedAt: row[storage.postedAt] ?? null,
    closesAt: row[storage.closesAt] ?? null,
    createdAt: row[storage.createdAt] ?? null,
    updatedAt: row[storage.updatedAt] ?? null,
  };
}

async function generateJobId(storage) {
  const year = new Date().getFullYear();
  const [rows] = await db.promise().query(`SELECT ${storage.jobId} AS jobId FROM careers`);
  const matching = rows
    .map((row) => row.jobId)
    .filter((value) => typeof value === "string" && value.startsWith(`WINGS-${year}-`));

  const max = matching.reduce((highest, value) => {
    const num = parseInt(value.split("-")[2] ?? "0", 10);
    return num > highest ? num : highest;
  }, 0);

  return `WINGS-${year}-${String(max + 1).padStart(3, "0")}`;
}

function buildPayload(body, storage) {
  return {
    title: body.title ?? "",
    department: body.department ?? "",
    location: body.location ?? "",
    description: body.description ?? "",
    requirements: body.requirements ?? "",
    [storage.employmentType]: body.employmentType ?? "Full-Time",
    [storage.salaryRange]: body.salaryRange ?? "",
    [storage.isActive]: body.isActive ? 1 : 0,
    [storage.closesAt]: body.closesAt || null,
  };
}

router.get("/careers", async (_req, res) => {
  try {
    const storage = await detectCareerStorage();
    const [rows] = await db.promise().query(
      `SELECT * FROM careers WHERE ${storage.isActive} = 1 ORDER BY ${storage.postedAt} DESC, id DESC`
    );

    res.json(rows.map((row) => normaliseCareer(row, storage)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/admin/careers", requireAdmin, async (_req, res) => {
  try {
    const storage = await detectCareerStorage();
    const [rows] = await db.promise().query(
      `SELECT * FROM careers ORDER BY ${storage.createdAt} DESC, id DESC`
    );

    res.json(rows.map((row) => normaliseCareer(row, storage)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/admin/careers", requireAdmin, async (req, res) => {
  try {
    const storage = await detectCareerStorage();
    const payload = buildPayload(req.body, storage);
    payload[storage.jobId] = await generateJobId(storage);
    payload[storage.postedAt] = new Date();

    const columns = Object.keys(payload);
    const values = columns.map((column) => payload[column]);
    const placeholders = columns.map(() => "?").join(", ");

    const [result] = await db.promise().query(
      `INSERT INTO careers (${columns.join(", ")}) VALUES (${placeholders})`,
      values
    );

    const [rows] = await db.promise().query("SELECT * FROM careers WHERE id = ?", [result.insertId]);
    res.status(201).json(normaliseCareer(rows[0], storage));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/admin/careers/:id", requireAdmin, async (req, res) => {
  try {
    const storage = await detectCareerStorage();
    const payload = buildPayload(req.body, storage);
    payload[storage.updatedAt] = new Date();

    await db.promise().query("UPDATE careers SET ? WHERE id = ?", [payload, req.params.id]);

    const [rows] = await db.promise().query("SELECT * FROM careers WHERE id = ?", [req.params.id]);
    res.json(normaliseCareer(rows[0], storage));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/admin/careers/:id", requireAdmin, async (req, res) => {
  try {
    await db.promise().query("DELETE FROM careers WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
