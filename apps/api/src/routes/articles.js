import { Router } from "express";
import { db } from "../config/db.js";
import { requireAdmin } from "../middlewares/auth.js";

const router = Router();

let articleStoragePromise;

async function detectArticleStorage() {
  if (!articleStoragePromise) {
    articleStoragePromise = (async () => {
      const [columns] = await db.promise().query("SHOW COLUMNS FROM articles");
      const names = new Set(columns.map((column) => column.Field));

      return {
        coverImage: names.has("coverImage") ? "coverImage" : "cover_image",
        isPublished: names.has("isPublished") ? "isPublished" : "is_published",
        publishedAt: names.has("publishedAt") ? "publishedAt" : "published_at",
        createdAt: names.has("createdAt") ? "createdAt" : "created_at",
        updatedAt: names.has("updatedAt") ? "updatedAt" : "updated_at",
      };
    })();
  }

  return articleStoragePromise;
}

function normaliseArticle(row, storage) {
  return {
    id: row.id,
    title: row.title ?? "",
    slug: row.slug ?? "",
    excerpt: row.excerpt ?? "",
    content: row.content ?? "",
    coverImage: row[storage.coverImage] ?? "",
    author: row.author ?? "",
    category: row.category ?? "",
    isPublished: Boolean(row[storage.isPublished]),
    publishedAt: row[storage.publishedAt] ?? null,
    createdAt: row[storage.createdAt] ?? null,
    updatedAt: row[storage.updatedAt] ?? null,
  };
}

function buildPayload(body, storage) {
  const payload = {
    title: body.title ?? "",
    slug: body.slug ?? "",
    excerpt: body.excerpt ?? "",
    content: body.content ?? "",
    [storage.coverImage]: body.coverImage ?? "",
    author: body.author ?? "WINGS Team",
    category: body.category ?? "General",
    [storage.isPublished]: body.isPublished ? 1 : 0,
  };

  if (body.isPublished) {
    payload[storage.publishedAt] = body.publishedAt || new Date();
  } else {
    payload[storage.publishedAt] = body.publishedAt || null;
  }

  return payload;
}

// Public route - get published articles
router.get("/articles", async (_req, res) => {
  try {
    const storage = await detectArticleStorage();
    const [rows] = await db.promise().query(
      `SELECT * FROM articles WHERE ${storage.isPublished} = 1 ORDER BY ${storage.publishedAt} DESC, id DESC`
    );

    res.json(rows.map((row) => normaliseArticle(row, storage)));
  } catch (err) {
    console.error("Error fetching articles:", err);
    res.status(500).json({ error: err.message });
  }
});

// Admin route - get all articles
router.get("/admin/articles", requireAdmin, async (_req, res) => {
  try {
    const storage = await detectArticleStorage();
    const [rows] = await db.promise().query(
      `SELECT * FROM articles ORDER BY ${storage.createdAt} DESC, id DESC`
    );

    res.json(rows.map((row) => normaliseArticle(row, storage)));
  } catch (err) {
    console.error("Error fetching admin articles:", err);
    res.status(500).json({ error: err.message });
  }
});

// Admin route - create article
router.post("/admin/articles", requireAdmin, async (req, res) => {
  try {
    const storage = await detectArticleStorage();
    const payload = buildPayload(req.body, storage);

    if (!payload.slug && payload.title) {
      payload.slug = payload.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    }

    const columns = Object.keys(payload);
    const values = columns.map((column) => payload[column]);
    const placeholders = columns.map(() => "?").join(", ");

    const [result] = await db.promise().query(
      `INSERT INTO articles (${columns.join(", ")}) VALUES (${placeholders})`,
      values
    );

    const [rows] = await db.promise().query("SELECT * FROM articles WHERE id = ?", [result.insertId]);
    res.status(201).json(normaliseArticle(rows[0], storage));
  } catch (err) {
    console.error("Error creating article:", err);
    res.status(500).json({ error: err.message });
  }
});

// Admin route - update article
router.put("/admin/articles/:id", requireAdmin, async (req, res) => {
  try {
    const storage = await detectArticleStorage();
    const payload = buildPayload(req.body, storage);
    payload[storage.updatedAt] = new Date();

    await db.promise().query("UPDATE articles SET ? WHERE id = ?", [payload, req.params.id]);

    const [rows] = await db.promise().query("SELECT * FROM articles WHERE id = ?", [req.params.id]);
    res.json(normaliseArticle(rows[0], storage));
  } catch (err) {
    console.error("Error updating article:", err);
    res.status(500).json({ error: err.message });
  }
});

// Admin route - delete article
router.delete("/admin/articles/:id", requireAdmin, async (req, res) => {
  try {
    await db.promise().query("DELETE FROM articles WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting article:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;