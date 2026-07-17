/** localStorage helpers for Word-uploaded article page content */

const STORAGE_PREFIX = "wings_page_content_";

export function getPageKeyFromCategory(category) {
  if (!category) return "GroundingTechniques";

  const cat = category.toLowerCase();

  if (cat.includes("relationship") || cat.includes("marital")) {
    return "RelationshipArticlePage";
  }
  if (cat.includes("parenting")) {
    return "ParentingArticlePage";
  }
  if (cat.includes("grief") || cat.includes("loss")) {
    return "GriefArticlePage";
  }
  if (cat.includes("mental health") || cat.includes("mental")) {
    return "MentalArticlePage";
  }

  return "GroundingTechniques";
}

/** Public route for an article — each slug has its own detail page. */
export function getArticleDetailPath(article) {
  const slug = (article?.slug || "").trim();
  if (slug) return `/article/${encodeURIComponent(slug)}`;
  return `/${getPageKeyFromCategory(article?.category)}`;
}

export function storageKeyForPage(pageKey, slug) {
  if (slug) return `${pageKey}:${slug}`;
  return pageKey;
}

export function savePageContent(pageKey, payload) {
  const key = storageKeyForPage(pageKey, payload?.slug);
  const existing = loadPageContent(pageKey, payload?.slug) || {};
  const data = {
    html: payload.html !== undefined ? payload.html : existing.html || "",
    title: payload.title !== undefined ? payload.title : existing.title || "",
    author: payload.author !== undefined ? payload.author : existing.author || "",
    excerpt: payload.excerpt !== undefined ? payload.excerpt : existing.excerpt || "",
    coverImage:
      payload.coverImage !== undefined
        ? payload.coverImage
        : existing.coverImage || "",
    slug: payload.slug || existing.slug || "",
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  window.dispatchEvent(
    new CustomEvent("wings-page-content-updated", {
      detail: { pageKey, slug: data.slug, data },
    })
  );
  return data;
}

export function loadPageContent(pageKey, slug) {
  try {
    const key = storageKeyForPage(pageKey, slug);
    let raw = localStorage.getItem(STORAGE_PREFIX + key);
    // Legacy single-page key only when no slug requested
    if (!raw && !slug) {
      raw = localStorage.getItem(STORAGE_PREFIX + pageKey);
    }
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearPageContent(pageKey, slug) {
  const key = storageKeyForPage(pageKey, slug);
  localStorage.removeItem(STORAGE_PREFIX + key);
  window.dispatchEvent(
    new CustomEvent("wings-page-content-updated", {
      detail: { pageKey, slug: slug || "", data: null },
    })
  );
}

/**
 * Convert a Word .docx File to HTML using mammoth.
 */
export async function convertWordToHtml(file) {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      styleMap: [
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Subtitle'] => h2:fresh",
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
      ],
    }
  );
  return {
    html: promoteBoldParagraphsToHeadings(result.value || ""),
    messages: result.messages || [],
  };
}

function slugify(text, index) {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `section-${index + 1}`
  );
}

/**
 * If Word used bold paragraphs instead of Heading styles,
 * promote short bold-only paragraphs to h2 so TOC works.
 * If still no headings, promote the first short paragraph to h1.
 */
export function promoteBoldParagraphsToHeadings(html) {
  if (!html || typeof document === "undefined") return html;

  const container = document.createElement("div");
  container.innerHTML = html;

  const isQuote = (text) =>
    text.startsWith('"') || text.startsWith("“") || text.startsWith("'") || text.startsWith("‘");

  Array.from(container.querySelectorAll("p")).forEach((p) => {
    const text = (p.textContent || "").trim();
    if (!text || text.length > 120) return;
    if (isQuote(text)) return;

    const strongEl = p.querySelector("strong, b");
    const strongText = (strongEl?.textContent || "").trim();
    const strongOnly =
      strongEl &&
      strongText === text &&
      !p.querySelector("em, i, a, img");

    if (!strongOnly) return;

    const h2 = document.createElement("h2");
    h2.textContent = text;
    p.replaceWith(h2);
  });

  // Still no headings? Use first short non-quote paragraph as title (h1)
  if (!container.querySelector("h1, h2, h3")) {
    const firstP = Array.from(container.querySelectorAll("p")).find((p) => {
      const text = (p.textContent || "").trim();
      return text && text.length <= 100 && !isQuote(text);
    });
    if (firstP) {
      const h1 = document.createElement("h1");
      h1.textContent = (firstP.textContent || "").trim();
      firstP.replaceWith(h1);
    }

    // Promote remaining short paragraphs that look like section titles
    Array.from(container.querySelectorAll("p")).forEach((p) => {
      const text = (p.textContent || "").trim();
      if (!text || text.length > 90) return;
      if (isQuote(text)) return;
      const looksLikeHeading =
        text.endsWith("?") || /^\d+[\.\)]\s/.test(text);
      if (!looksLikeHeading) return;
      const h2 = document.createElement("h2");
      h2.textContent = text;
      p.replaceWith(h2);
    });
  }

  return container.innerHTML;
}

/**
 * Extract h1/h2/h3 headings from HTML for TOC / scroll spy.
 * Also promotes bold paragraphs first if no real headings exist.
 */
export function extractHeadingsFromHtml(html) {
  if (!html || typeof document === "undefined") return [];

  const prepared = promoteBoldParagraphsToHeadings(html);
  const container = document.createElement("div");
  container.innerHTML = prepared;

  const headings = Array.from(container.querySelectorAll("h1, h2, h3"));
  return headings.map((el, index) => {
    const text = (el.textContent || "").trim() || `Section ${index + 1}`;
    const id = el.id || slugify(text, index);
    el.id = id;
    return { label: text, id };
  });
}

/**
 * Inject ids onto headings in HTML string so scroll/TOC works.
 * Also promotes bold title paragraphs to headings.
 */
export function htmlWithHeadingIds(html) {
  if (!html || typeof document === "undefined") return html;

  const prepared = promoteBoldParagraphsToHeadings(html);
  const container = document.createElement("div");
  container.innerHTML = prepared;

  Array.from(container.querySelectorAll("h1, h2, h3")).forEach((el, index) => {
    const text = (el.textContent || "").trim() || `Section ${index + 1}`;
    if (!el.id) {
      el.id = slugify(text, index);
    }
  });

  return container.innerHTML;
}

/**
 * First real body paragraph from article HTML (skips titles, quotes, short lines).
 * Used in the blue intro section under the title.
 */
export function extractFirstParagraphFromHtml(html) {
  if (!html || typeof document === "undefined") return "";

  const container = document.createElement("div");
  container.innerHTML = html;

  const isQuote = (text) =>
    text.startsWith('"') ||
    text.startsWith("“") ||
    text.startsWith("'") ||
    text.startsWith("‘") ||
    text.startsWith("It's about") ||
    text.startsWith("It’s about");

  const paragraphs = Array.from(container.querySelectorAll("p"));
  for (const p of paragraphs) {
    const text = (p.textContent || "").replace(/\s+/g, " ").trim();
    if (!text || text.length < 60) continue;
    if (isQuote(text)) continue;
    return text;
  }

  // Fallback: any non-heading text block long enough
  const all = (container.textContent || "").replace(/\s+/g, " ").trim();
  if (all.length > 80) {
    const sentence = all.match(/[^.!?]+[.!?]/);
    if (sentence && sentence[0].trim().length > 40) return sentence[0].trim();
  }

  return "";
}
export function htmlToPdfBlocks(html) {
  if (!html || typeof document === "undefined") return [];

  const container = document.createElement("div");
  container.innerHTML = html;
  const blocks = [];

  const walk = (node) => {
    if (node.nodeType !== 1) return;
    const tag = node.tagName.toLowerCase();

    if (["h1", "h2", "h3", "h4"].includes(tag)) {
      blocks.push({
        type: "heading",
        level: Number(tag[1]),
        text: (node.textContent || "").trim(),
      });
      return;
    }

    if (tag === "p") {
      const text = (node.textContent || "").trim();
      if (text) blocks.push({ type: "paragraph", text });
      return;
    }

    if (tag === "ul" || tag === "ol") {
      const items = Array.from(node.querySelectorAll(":scope > li"))
        .map((li) => (li.textContent || "").trim())
        .filter(Boolean);
      if (items.length) blocks.push({ type: "list", items });
      return;
    }

    if (tag === "blockquote") {
      const text = (node.textContent || "").trim();
      if (text) blocks.push({ type: "quote", text });
      return;
    }

    Array.from(node.children).forEach(walk);
  };

  Array.from(container.children).forEach(walk);

  // Fallback: if structure was flat/empty, use full text
  if (blocks.length === 0) {
    const text = (container.textContent || "").trim();
    if (text) {
      text.split(/\n+/).forEach((line) => {
        const t = line.trim();
        if (t) blocks.push({ type: "paragraph", text: t });
      });
    }
  }

  return blocks;
}
