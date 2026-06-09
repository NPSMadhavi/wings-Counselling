import { Router } from "express";
import { db } from "../config/db.js";
import { requireAdmin } from "../middlewares/auth.js";
import { sendSubscriberNotification } from "../lib/email.js";

const router = Router();

let articleStoragePromise;

async function detectArticleStorage() {
  if (!articleStoragePromise) {
    articleStoragePromise = (async () => {
      const [columns] = await db.query("SHOW COLUMNS FROM articles");

      const names = new Set(columns.map((c) => c.Field));

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

  payload[storage.publishedAt] = body.isPublished
    ? body.publishedAt || new Date()
    : body.publishedAt || null;

  return payload;
}

/* ================= PUBLIC ================= */
router.get("/articles", async (_req, res) => {
  try {
    const storage = await detectArticleStorage();

    const [rows] = await db.query(
      `SELECT * FROM articles
       WHERE ${storage.isPublished} = 1
       ORDER BY ${storage.publishedAt} DESC, id DESC`
    );

    res.json(rows.map((r) => normaliseArticle(r, storage)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= ADMIN GET ================= */
router.get("/admin/articles", requireAdmin, async (_req, res) => {
  try {
    const storage = await detectArticleStorage();

    const [rows] = await db.query(
      `SELECT * FROM articles
       ORDER BY ${storage.createdAt} DESC, id DESC`
    );

    res.json(rows.map((r) => normaliseArticle(r, storage)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= CREATE ================= */
router.post("/admin/articles", requireAdmin, async (req, res) => {
  try {
    const storage = await detectArticleStorage();
    const payload = buildPayload(req.body, storage);

    if (!payload.slug) {
      payload.slug = payload.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    const cols = Object.keys(payload);
    const vals = Object.values(payload);

    const [result] = await db.query(
      `INSERT INTO articles (${cols.join(",")})
       VALUES (${cols.map(() => "?").join(",")})`,
      vals
    );

    const [rows] = await db.query(
      "SELECT * FROM articles WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json(normaliseArticle(rows[0], storage));

    // Notify subscribers if the article is published
    if (req.body.isPublished) {
      sendSubscriberNotification("article", normaliseArticle(rows[0], storage)).catch((err) =>
        console.error("[Email] Article subscriber notification failed:", err?.message)
      );
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= UPDATE ================= */
router.put("/admin/articles/:id", requireAdmin, async (req, res) => {
  try {
    const storage = await detectArticleStorage();

    // Check if article was previously unpublished (to detect publish event)
    const [prevRows] = await db.query(
      `SELECT ${storage.isPublished} AS wasPublished FROM articles WHERE id = ?`,
      [req.params.id]
    );
    const wasPublished = prevRows[0] ? Boolean(prevRows[0].wasPublished) : false;

    const payload = buildPayload(req.body, storage);
    payload[storage.updatedAt] = new Date();

    await db.query(
      "UPDATE articles SET ? WHERE id = ?",
      [payload, req.params.id]
    );

    const [rows] = await db.query(
      "SELECT * FROM articles WHERE id = ?",
      [req.params.id]
    );

    const updated = normaliseArticle(rows[0], storage);
    res.json(updated);

    // Notify subscribers only when article is newly published (was draft, now published)
    if (!wasPublished && req.body.isPublished) {
      sendSubscriberNotification("article", updated).catch((err) =>
        console.error("[Email] Article subscriber notification failed:", err?.message)
      );
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= DELETE ================= */
router.delete("/admin/articles/:id", requireAdmin, async (req, res) => {
  try {
    await db.query("DELETE FROM articles WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;