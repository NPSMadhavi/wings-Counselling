import "./apps/api/src/config/env.js";
import { db } from "./apps/api/src/config/db.js";

const [cats] = await db.execute("SELECT id, name FROM job_categories LIMIT 5");
console.log("categories:", cats);

async function tryInsert(jobId) {
  try {
    const categoryId = cats[0]?.id ?? 1;
    const [result] = await db.execute(
      `INSERT INTO job_postings
      (job_id, title, category_id, location, employment_type, experience, summary, description, requirements, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [jobId, "Test", categoryId, "", "", "", "", "", "", 1]
    );
    console.log("OK", jobId, result.insertId);
    await db.execute("DELETE FROM job_postings WHERE id = ?", [result.insertId]);
  } catch (e) {
    console.log("FAIL", JSON.stringify({ jobId, code: e.code, errno: e.errno, message: e.message }));
  }
}

await tryInsert(`JOB-${Date.now()}`);
await tryInsert("");
await tryInsert(`UNIQUE-${Date.now()}`);
