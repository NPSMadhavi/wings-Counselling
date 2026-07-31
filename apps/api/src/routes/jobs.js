import { Router } from "express";
import { db } from "../config/db.js";
import { isFkViolation, isUniqueViolation } from "../config/pg-helpers.js";
import { requireAdmin } from "../middlewares/auth.js";
import {
  ensureJobLanguageTables,
  ensureJobTranslation,
  localizeJobs,
  localizeCategories,
  saveJobLocalization,
  saveCategoryLocalization,
} from "../services/jobTranslate.js";
import { looksLikeEnglishText } from "../services/translateService.js";

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

router.get("/categories", async (req, res) => {
  try {
    const lang = normalizeLangCode(req.query.lang || "en");
    const [rows] = await db.execute(
      "SELECT id, name, description FROM job_categories ORDER BY id DESC"
    );
    let list = rows;
    if (lang && lang !== "en") {
      try {
        list = await localizeCategories(list, lang);
      } catch (err) {
        console.warn("[categories] localize:", err?.message);
      }
    }
    res.json(list);
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

    let languageId = req.body.language_id ? Number(req.body.language_id) : null;
    if (!languageId && req.body.language_code) {
      languageId = await getLanguageIdByCode(req.body.language_code);
    }
    if (!languageId) languageId = await getLanguageIdByCode("en");

    if (languageId) {
      try {
        await ensureJobLanguageTables();
        await saveCategoryLocalization(result.insertId, languageId, {
          name,
          description: description || "",
        });
      } catch (err) {
        console.warn("[categories] save localization:", err?.message);
      }
    }

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
    const sample = `${name || ""} ${description || ""}`;
    const canWriteEnglish =
      isEnglish &&
      (name === undefined || looksLikeEnglishText(sample) || !String(sample).trim());

    if (canWriteEnglish || (!isEnglish && false)) {
      // only write base table for English
    }

    if (isEnglish && canWriteEnglish) {
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
      if (updates.length) {
        params.push(req.params.id);
        await db.execute(
          `UPDATE job_categories SET ${updates.join(", ")} WHERE id = ?`,
          params
        );
      }
    }

    if (languageId && (name !== undefined || description !== undefined)) {
      if (!isEnglish || canWriteEnglish) {
        try {
          await ensureJobLanguageTables();
          const [cur] = await db.execute(
            "SELECT name, description FROM job_categories WHERE id = ?",
            [req.params.id]
          );
          await saveCategoryLocalization(Number(req.params.id), languageId, {
            name: name !== undefined ? name : cur[0]?.name || "",
            description:
              description !== undefined
                ? description || ""
                : cur[0]?.description || "",
          });
        } catch (err) {
          console.warn("[categories] update localization:", err?.message);
        }
      }
    }

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
    c.job_id AS "jobId",
    c.title,
    c.category_id AS "categoryId",
    c.location,
    c.employment_type AS "employmentType",
    c.experience,
    c.summary,
    c.description,
    c.requirements,
    c.is_active AS "isActive",
    c.created_at AS "createdAt",
    jc.name AS category_name
  FROM job_postings c
  LEFT JOIN job_categories jc ON jc.id = c.category_id
`;

function mapJobRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    jobId: row.jobId ?? row.jobid,
    title: row.title,
    categoryId: row.categoryId ?? row.categoryid,
    department: row.category_name || "General",
    location: row.location || "",
    employmentType: row.employmentType ?? row.employmenttype ?? "",
    experience: row.experience || "",
    summary: row.summary || "",
    description: row.description || "",
    requirements: row.requirements || "",
    isActive: Boolean(row.isActive ?? row.isactive),
    createdAt: row.createdAt ?? row.createdat,
  };
}

router.get("/jobs", async (req, res) => {
  try {
    const activeOnly = req.query.active === "true";
    const lang = normalizeLangCode(req.query.lang || "en");
    const where = activeOnly ? " WHERE c.is_active = true" : "";
    const [rows] = await db.execute(
      `${jobSelect}${where} ORDER BY c.created_at DESC`
    );
    let list = rows.map(mapJobRow);
    if (lang && lang !== "en") {
      try {
        list = await localizeJobs(list, lang);
      } catch (err) {
        console.warn("[jobs] localize:", err?.message);
      }
    }
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

router.get("/jobs/by-job-id/:jobId", async (req, res) => {
  try {
    const lang = normalizeLangCode(req.query.lang || "en");
    const [rows] = await db.execute(
      `${jobSelect} WHERE c.job_id = ? LIMIT 1`,
      [req.params.jobId]
    );
    if (!rows.length) {
      return res.status(404).json({ error: "Job not found" });
    }
    let job = mapJobRow(rows[0]);
    if (lang && lang !== "en") {
      try {
        await ensureJobTranslation(job.id, lang, { force: false });
        const [localized] = await localizeJobs([job], lang);
        job = localized || job;
      } catch (err) {
        console.warn("[jobs] localize one:", err?.message);
      }
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch job" });
  }
});

router.get("/jobs/:id", async (req, res) => {
  try {
    const lang = normalizeLangCode(req.query.lang || "en");
    const [rows] = await db.execute(
      `${jobSelect} WHERE c.id = ? LIMIT 1`,
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: "Job not found" });
    }
    let job = mapJobRow(rows[0]);
    if (lang && lang !== "en") {
      try {
        const [localized] = await localizeJobs([job], lang);
        job = localized || job;
      } catch (err) {
        console.warn("[jobs] localize one:", err?.message);
      }
    }
    res.json(job);
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
        isActive ? true : false
      ]
    );

    const [rows] = await db.execute(
      `${jobSelect} WHERE c.id = ?`,
      [result.insertId]
    );

    let languageId = req.body.language_id ? Number(req.body.language_id) : null;
    if (!languageId && req.body.language_code) {
      languageId = await getLanguageIdByCode(req.body.language_code);
    }
    if (!languageId) languageId = await getLanguageIdByCode("en");

    if (languageId) {
      try {
        await ensureJobLanguageTables();
        await saveJobLocalization(result.insertId, languageId, {
          title: resolvedTitle,
          summary: summary || "",
          description: description || "",
          requirements: requirements || "",
          location: location || "",
          experience: experience || "",
          employmentType: employmentType || "",
        });
      } catch (err) {
        console.warn("[jobs] save localization:", err?.message);
      }
    }

    res.status(201).json(mapJobRow(rows[0]) || rows[0] || null);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return res.status(409).json({
        error: "Job ID already exists. Please use a different Job ID or leave it blank to auto-generate one.",
      });
    }
    if (isFkViolation(error)) {
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
      isActive: "is_active",
    };

    let languageId = body.language_id ? Number(body.language_id) : null;
    let langCode = body.language_code
      ? normalizeLangCode(body.language_code)
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
    const englishSample = `${body.title || ""} ${body.description || ""}`;
    const canWriteEnglishMaster =
      isEnglish &&
      (body.title === undefined ||
        looksLikeEnglishText(englishSample) ||
        !String(englishSample).trim());

    const sharedKeys = new Set(["jobId", "categoryId", "isActive"]);
    const textKeys = new Set([
      "title",
      "location",
      "employmentType",
      "experience",
      "summary",
      "description",
      "requirements",
    ]);

    const updates = [];
    const params = [];
    for (const [key, column] of Object.entries(fieldMap)) {
      if (body[key] === undefined) continue;
      if (textKeys.has(key) && !(isEnglish && canWriteEnglishMaster)) {
        continue;
      }
      if (!sharedKeys.has(key) && !textKeys.has(key)) continue;
      if (textKeys.has(key) && !isEnglish) continue;
      updates.push(`${column} = ?`);
      params.push(key === "isActive" ? Boolean(body[key]) : body[key]);
    }

    // Always allow shared non-text updates
    for (const key of sharedKeys) {
      if (body[key] === undefined) continue;
      const column = fieldMap[key];
      if (updates.some((u) => u.startsWith(`${column} =`))) continue;
      updates.push(`${column} = ?`);
      params.push(key === "isActive" ? Boolean(body[key]) : body[key]);
    }

    if (updates.length) {
      params.push(req.params.id);
      await db.execute(
        `UPDATE job_postings SET ${updates.join(", ")} WHERE id = ?`,
        params
      );
    }

    if (languageId) {
      try {
        await ensureJobLanguageTables();
        const [cur] = await db.execute(
          `${jobSelect} WHERE c.id = ?`,
          [req.params.id]
        );
        const current = mapJobRow(cur[0]) || {};
        if (!isEnglish || canWriteEnglishMaster) {
          await saveJobLocalization(Number(req.params.id), languageId, {
            title: body.title !== undefined ? body.title : current.title || "",
            summary:
              body.summary !== undefined ? body.summary : current.summary || "",
            description:
              body.description !== undefined
                ? body.description
                : current.description || "",
            requirements:
              body.requirements !== undefined
                ? body.requirements
                : current.requirements || "",
            location:
              body.location !== undefined
                ? body.location
                : current.location || "",
            experience:
              body.experience !== undefined
                ? body.experience
                : current.experience || "",
            employmentType:
              body.employmentType !== undefined
                ? body.employmentType
                : current.employmentType || "",
          });
        }
      } catch (err) {
        console.warn("[jobs] update localization:", err?.message);
      }
    }

    const [rows] = await db.execute(
      `${jobSelect} WHERE c.id = ?`,
      [req.params.id]
    );
    res.json(mapJobRow(rows[0]) || null);
  } catch (error) {
    console.error("PATCH /jobs:", error);
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
