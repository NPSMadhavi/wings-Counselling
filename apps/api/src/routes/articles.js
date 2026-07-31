import { Router } from "express";
import { db, getTableColumns } from "../config/db.js";
import { requireAdmin } from "../middlewares/auth.js";
import { sendSubscriberNotification } from "../lib/email.js";

const router = Router();

let articleStoragePromise;

async function detectArticleStorage() {
  if (!articleStoragePromise) {
    articleStoragePromise = (async () => {
      const columns = await getTableColumns("articles");
      const names = new Set(columns);

      return {
        coverImage: names.has("coverimage") ? "coverImage" : "cover_image",
        isPublished: names.has("ispublished") ? "isPublished" : "is_published",
        publishedAt: names.has("publishedat") ? "publishedAt" : "published_at",
        createdAt: names.has("createdat") ? "createdAt" : "created_at",
        updatedAt: names.has("updatedat") ? "updatedAt" : "updated_at",
      };
    })();
  }

  return articleStoragePromise;
}

function normaliseArticle(row, storage, localization = null) {
  const base = {
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
    language: "en",
  };

  if (localization) {
    if (localization.title) base.title = localization.title;
    if (localization.htmlContent) base.content = localization.htmlContent;
    if (localization.languageCode) base.language = localization.languageCode;
  }

  return base;
}

/**
 * Load article_language documents for a language code (en/zh/ms/hi/ta).
 * Returns Map<articleId, { title, htmlContent, languageCode }>
 */
async function loadLocalizationsByLang(langCode) {
  const code = String(langCode || "en").toLowerCase().split("-")[0];
  if (!code || code === "en") {
    // Still load en rows if they exist — otherwise use articles table defaults
  }

  try {
    const [rows] = await db.query(
      `SELECT al.article_id AS "articleId",
              l.code AS "languageCode",
              d.title AS "title",
              d.html_content AS "htmlContent"
       FROM article_language al
       JOIN languages l ON l.id = al.language_id
       JOIN documents d ON d.id = al.document_id
       WHERE LOWER(l.code) = ?`,
      [code]
    );

    const map = new Map();
    for (const row of rows) {
      map.set(Number(row.articleId), {
        title: row.title || "",
        htmlContent: row.htmlContent || "",
        languageCode: row.languageCode || code,
      });
    }
    return map;
  } catch (err) {
    // Tables may not exist yet on older DBs
    console.warn("[articles] localization lookup skipped:", err?.message);
    return new Map();
  }
}

/* ================= PUBLIC ================= */
router.get("/articles", async (req, res) => {
  try {
    const storage = await detectArticleStorage();
    const lang = String(req.query.lang || "en").toLowerCase().split("-")[0];

    const [rows] = await db.query(
      `SELECT * FROM articles
       WHERE ${storage.isPublished} = true
       ORDER BY ${storage.publishedAt} DESC, id DESC`
    );

    const localizations = await loadLocalizationsByLang(lang);

    // Do not auto-translate on list (blocks the API). Use stored localizations only;
    // missing languages are created on /articles/by-slug/:slug?lang=
    let looksUntranslated = null;
    if (lang !== "en") {
      try {
        ({ looksUntranslated } = await import("../services/articleTranslate.js"));
      } catch {
        /* optional */
      }
    }

    res.json(
      rows.map((r) => {
        let loc = localizations.get(Number(r.id)) || null;
        if (
          loc &&
          looksUntranslated &&
          looksUntranslated(lang, loc.htmlContent)
        ) {
          loc = null; // fall back to English base until by-slug translates
        }
        return normaliseArticle(r, storage, loc);
      })
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* Single published article by slug + language */
router.get("/articles/by-slug/:slug", async (req, res) => {
  try {
    const storage = await detectArticleStorage();
    const slug = String(req.params.slug || "").trim();
    const lang = String(req.query.lang || "en").toLowerCase().split("-")[0];

    if (!slug) {
      return res.status(400).json({ error: "slug is required" });
    }

    const [rows] = await db.query(
      `SELECT * FROM articles
       WHERE slug = ? AND ${storage.isPublished} = true
       LIMIT 1`,
      [slug]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Article not found" });
    }

    const localizations = await loadLocalizationsByLang(lang);
    let localization = localizations.get(Number(rows[0].id)) || null;

    // Auto-translate from English when missing or still English under this lang
    if (lang !== "en") {
      try {
        const { ensureArticleTranslation, looksUntranslated } = await import(
          "../services/articleTranslate.js"
        );
        const needsTranslate =
          !localization ||
          !String(localization.htmlContent || "").trim() ||
          looksUntranslated(lang, localization.htmlContent);
        if (needsTranslate) {
          const translated = await ensureArticleTranslation(
            Number(rows[0].id),
            lang,
            { force: Boolean(localization?.htmlContent) }
          );
          localization = {
            title: translated.title,
            htmlContent: translated.htmlContent,
            languageCode: translated.languageCode,
          };
        }
      } catch (trErr) {
        console.warn(
          `[articles] auto-translate ${lang} failed:`,
          trErr?.message
        );
      }
    }

    const article = normaliseArticle(rows[0], storage, localization);

    // Fallback to English localization / base article if still empty
    if (!String(article.content || "").trim() && lang !== "en") {
      const enMap = await loadLocalizationsByLang("en");
      const enLoc = enMap.get(Number(rows[0].id));
      if (enLoc && String(enLoc.htmlContent || "").trim()) {
        return res.json(normaliseArticle(rows[0], storage, enLoc));
      }
    }

    res.json(article);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

function buildPayload(body, storage) {
  const payload = {
    title: body.title ?? "",
    slug: body.slug ?? "",
    excerpt: body.excerpt ?? "",
    content: body.content ?? "",
    [storage.coverImage]: body.coverImage ?? "",
    author: body.author ?? "WINGS Team",
    category: body.category ?? "General",
    [storage.isPublished]: Boolean(body.isPublished),
  };

  payload[storage.publishedAt] = body.isPublished
    ? body.publishedAt || new Date()
    : body.publishedAt || null;

  return payload;
}

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
    const created = normaliseArticle(rows[0], storage);
    if (created.isPublished) {
      sendSubscriberNotification("article", created).catch((err) =>
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
    if (!wasPublished && updated.isPublished) {
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