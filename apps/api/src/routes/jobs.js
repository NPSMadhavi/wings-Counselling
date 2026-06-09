import { Router } from "express";
import { db } from "../config/db.js";
import { requireAdmin } from "../middlewares/auth.js";

const router = Router();

router.get("/categories", async (_req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT id, name, description FROM job_categories ORDER BY id DESC"
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

router.post("/categories", requireAdmin, async (req, res) => {
  try {
    const { name, description = null } = req.body || {};
    if (!name) return res.status(400).json({ error: "Category name is required" });
    const [result] = await db.execute(
      "INSERT INTO job_categories (name, description) VALUES (?, ?)",
      [name, description]
    );
    res.status(201).json({ id: result.insertId, name, description });
  } catch (error) {
    res.status(500).json({ error: "Failed to create category" });
  }
});

router.patch("/categories/:id", requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body || {};
    if (name === undefined && description === undefined) {
      return res.status(400).json({ error: "No fields to update" });
    }
    const updates = [];
    const params = [];
    if (name !== undefined) {
      updates.push("name = ?");
      params.push(name);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      params.push(description);
    }
    params.push(req.params.id);
    await db.execute(
      `UPDATE job_categories SET ${updates.join(", ")} WHERE id = ?`,
      params
    );
    const [rows] = await db.execute(
      "SELECT id, name, description FROM job_categories WHERE id = ?",
      [req.params.id]
    );
    res.json(rows[0] || null);
  } catch (error) {
    res.status(500).json({ error: "Failed to update category" });
  }
});

router.delete("/categories/:id", requireAdmin, async (req, res) => {
  try {
    const categoryId = Number(req.params.id);
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [jobs] = await connection.execute(
        "SELECT id FROM job_postings WHERE category_id = ?",
        [categoryId]
      );
      const jobIds = jobs.map((job) => job.id);

      if (jobIds.length > 0) {
        await connection.execute(
          `DELETE FROM mcq_sessions WHERE job_id IN (${jobIds.map(() => "?").join(", ")})`,
          jobIds
        );

        await connection.execute(
          "DELETE FROM job_postings WHERE category_id = ?",
          [categoryId]
        );
      }

      await connection.execute("DELETE FROM job_categories WHERE id = ?", [
        categoryId,
      ]);

      await connection.commit();
    } catch (err) {
      await connection.rollback().catch(() => {});
      throw err;
    } finally {
      connection.release();
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete category" });
  }
});

const jobSelect = `
  SELECT
    c.id,
    c.job_id AS jobId,
    c.title,
    c.category_id AS categoryId,
    c.location,
    c.employment_type AS employmentType,
    c.experience,
    c.summary,
    c.description,
    c.requirements,
    c.is_active AS isActive,
    c.created_at AS createdAt,
    jc.name AS category_name
  FROM job_postings c
  LEFT JOIN job_categories jc ON jc.id = c.category_id
`;

function mapJobRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    jobId: row.jobId,
    title: row.title,
    categoryId: row.categoryId,
    department: row.category_name || "General",
    location: row.location || "",
    employmentType: row.employmentType || "",
    experience: row.experience || "",
    summary: row.summary || "",
    description: row.description || "",
    requirements: row.requirements || "",
    isActive: Boolean(row.isActive),
    createdAt: row.createdAt,
  };
}

router.get("/jobs", async (req, res) => {
  try {
    const activeOnly = req.query.active === "true";
    const where = activeOnly ? " WHERE c.is_active = 1" : "";
    const [rows] = await db.execute(
      `${jobSelect}${where} ORDER BY c.created_at DESC`
    );
    res.json(rows.map(mapJobRow));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

router.get("/jobs/by-job-id/:jobId", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `${jobSelect} WHERE c.job_id = ? LIMIT 1`,
      [req.params.jobId]
    );
    if (!rows.length) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json(mapJobRow(rows[0]));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch job" });
  }
});

router.get("/jobs/:id", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `${jobSelect} WHERE c.id = ? LIMIT 1`,
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json(mapJobRow(rows[0]));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch job" });
  }
});

router.post("/jobs", requireAdmin, async (req, res) => {
  try {
    const {
      jobId,
      title,
      categoryId,
      location,
      employmentType,
      experience,
      summary,
      description,
      requirements,
      isActive = true
    } = req.body || {};

    const resolvedCategoryId = Number(categoryId);
    if (!Number.isFinite(resolvedCategoryId) || resolvedCategoryId <= 0) {
      return res.status(400).json({ error: "A valid category is required" });
    }

    const [categoryRows] = await db.execute(
      "SELECT id FROM job_categories WHERE id = ? LIMIT 1",
      [resolvedCategoryId]
    );
    if (!categoryRows.length) {
      return res.status(400).json({ error: "Selected category does not exist" });
    }

    const trimmedJobId = typeof jobId === "string" ? jobId.trim() : "";
    let resolvedJobId = trimmedJobId;

    if (!resolvedJobId) {
      do {
        resolvedJobId = `JOB-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
        const [existingGenerated] = await db.execute(
          "SELECT id FROM job_postings WHERE job_id = ? LIMIT 1",
          [resolvedJobId]
        );
        if (!existingGenerated.length) break;
      } while (true);
    } else {
      const [existingJob] = await db.execute(
        "SELECT id FROM job_postings WHERE job_id = ? LIMIT 1",
        [resolvedJobId]
      );
      if (existingJob.length) {
        return res.status(409).json({
          error: `Job ID "${resolvedJobId}" already exists. Please use a different Job ID or leave it blank to auto-generate one.`,
        });
      }
    }

    const resolvedTitle = title?.trim() || "Untitled Position";

    const [result] = await db.execute(
      `INSERT INTO job_postings
      (job_id, title, category_id, location, employment_type, experience, summary, description, requirements, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        resolvedJobId,
        resolvedTitle,
        resolvedCategoryId,
        location || "",
        employmentType || "",
        experience || "",
        summary || "",
        description || "",
        requirements || "",
        isActive ? 1 : 0
      ]
    );

    const [rows] = await db.execute(
      `SELECT
        c.id,
        c.job_id AS jobId,
        c.title,
        c.category_id AS categoryId,
        c.location,
        c.employment_type AS employmentType,
        c.experience,
        c.summary,
        c.description,
        c.requirements,
        c.is_active AS isActive,
        c.created_at AS createdAt,
        jc.name AS category_name
      FROM job_postings c
      LEFT JOIN job_categories jc ON jc.id = c.category_id
      WHERE c.id = ?`,
      [result.insertId]
    );

    res.status(201).json(mapJobRow(rows[0]) || rows[0] || null);
  } catch (error) {
    if (error?.errno === 1062) {
      return res.status(409).json({
        error: "Job ID already exists. Please use a different Job ID or leave it blank to auto-generate one.",
      });
    }
    if (error?.errno === 1452) {
      return res.status(400).json({ error: "Selected category is invalid" });
    }
    console.error("POST /jobs:", error);
    res.status(500).json({ error: "Failed to create job" });
  }
});

router.patch("/jobs/:id", requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    const fieldMap = {
      jobId: "job_id",
      title: "title",
      categoryId: "category_id",
      location: "location",
      employmentType: "employment_type",
      experience: "experience",
      summary: "summary",
      description: "description",
      requirements: "requirements",
      isActive: "is_active"
    };
    const updates = [];
    const params = [];
    for (const [key, column] of Object.entries(fieldMap)) {
      if (body[key] !== undefined) {
        updates.push(`${column} = ?`);
        params.push(key === "isActive" ? (body[key] ? 1 : 0) : body[key]);
      }
    }
    if (!updates.length) return res.status(400).json({ error: "No fields to update" });
    params.push(req.params.id);
    await db.execute(
      `UPDATE job_postings SET ${updates.join(", ")} WHERE id = ?`,
      params
    );
    const [rows] = await db.execute(
      `SELECT
        c.id,
        c.job_id AS jobId,
        c.title,
        c.category_id AS categoryId,
        c.location,
        c.employment_type AS employmentType,
        c.experience,
        c.summary,
        c.description,
        c.requirements,
        c.is_active AS isActive,
        c.created_at AS createdAt,
        jc.name AS category_name
      FROM job_postings c
      LEFT JOIN job_categories jc ON jc.id = c.category_id
      WHERE c.id = ?`,
      [req.params.id]
    );
    res.json(rows[0] || null);
  } catch (error) {
    res.status(500).json({ error: "Failed to update job" });
  }
});

router.delete("/jobs/:id", requireAdmin, async (req, res) => {
  try {
    const jobId = Number(req.params.id);
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      await connection.execute("DELETE FROM mcq_sessions WHERE job_id = ?", [
        jobId,
      ]);
      await connection.execute("DELETE FROM job_postings WHERE id = ?", [
        jobId,
      ]);

      await connection.commit();
    } catch (err) {
      await connection.rollback().catch(() => {});
      throw err;
    } finally {
      connection.release();
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete job" });
  }
});

export default router;
