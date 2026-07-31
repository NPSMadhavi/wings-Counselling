/**
 * Translate English article HTML/title into target languages.
 * CRITICAL: HTML tags (h2/h3/p/ul/…) are NEVER sent to the translator —
 * only text nodes are translated, so heading structure stays like English.
 *
 * Primary: Google translate_a (no key). Fallback: MyMemory.
 * Optional: TRANSLATE_API_URL for LibreTranslate.
 */

const LANG_PAIR = {
  hi: "en|hi",
  ms: "en|ms",
  zh: "en|zh-CN",
  ta: "en|ta",
  en: null,
};

const GOOGLE_TL = {
  hi: "hi",
  ms: "ms",
  zh: "zh-CN",
  ta: "ta",
  en: "en",
};

/** Tags that must break text batches (structure boundaries). */
const BLOCK_TAG_RE =
  /^<\/?(?:h[1-6]|p|div|li|ul|ol|br|hr|table|thead|tbody|tr|td|th|section|article|blockquote|figure|figcaption|pre|header|footer|nav|aside)\b/i;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithTimeout(url, options = {}, ms = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function translateViaGoogle(text, targetCode, sourceLang = "en") {
  const tl = GOOGLE_TL[targetCode];
  if (!tl) return text;

  const sl = sourceLang === "auto" ? "auto" : sourceLang === "zh" ? "zh-CN" : sourceLang;

  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" +
    encodeURIComponent(sl) +
    "&tl=" +
    encodeURIComponent(tl) +
    "&dt=t&q=" +
    encodeURIComponent(text);

  const res = await fetchWithTimeout(url, {}, 25000);
  if (!res.ok) throw new Error(`Google translate HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data?.[0])) throw new Error("Google translate empty");
  return data[0].map((row) => row?.[0] || "").join("");
}

async function translateViaMyMemory(text, targetCode) {
  const pair = LANG_PAIR[targetCode];
  if (!pair) return text;

  const url =
    "https://api.mymemory.translated.net/get?q=" +
    encodeURIComponent(text.slice(0, 450)) +
    "&langpair=" +
    encodeURIComponent(pair);

  const res = await fetchWithTimeout(url, {}, 20000);
  if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`);
  const data = await res.json();
  const translated = data?.responseData?.translatedText;
  if (!translated || /INVALID SOURCE LANGUAGE|QUERY LENGTH/i.test(translated)) {
    throw new Error(translated || "MyMemory empty");
  }
  return translated;
}

async function translateViaLibre(text, targetCode) {
  const libreUrl = String(process.env.TRANSLATE_API_URL || "").trim();
  if (!libreUrl) return null;

  const res = await fetchWithTimeout(
    `${libreUrl.replace(/\/$/, "")}/translate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: "en",
        target: targetCode === "zh" ? "zh" : targetCode,
        format: "text",
      }),
    },
    30000
  );
  if (!res.ok) throw new Error(`LibreTranslate HTTP ${res.status}`);
  const data = await res.json();
  return data?.translatedText || text;
}

async function translatePlainChunk(text, targetCode, sourceLang = "en") {
  if (!String(text || "").trim()) return text;

  // Prefer Google first (Libre often missing / wrong for zh-ms)
  try {
    return await translateViaGoogle(text, targetCode, sourceLang);
  } catch (err) {
    console.warn("[translate] Google failed, trying MyMemory:", err?.message);
  }

  try {
    const libre = await translateViaLibre(text, targetCode);
    if (libre != null && String(libre).trim() && libre !== text) return libre;
  } catch (err) {
    console.warn("[translate] Libre failed:", err?.message);
  }

  return translateViaMyMemory(text, targetCode);
}

function splitChunks(text, maxLen) {
  const raw = String(text || "");
  const chunks = [];
  let remaining = raw;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    let cut = remaining.lastIndexOf(" ", maxLen);
    if (cut < maxLen * 0.4) cut = remaining.lastIndexOf("\n", maxLen);
    if (cut < maxLen * 0.4) cut = maxLen;
    chunks.push(remaining.slice(0, cut));
    remaining = remaining.slice(cut).trimStart();
  }
  return chunks;
}

/** Detect dominant script so we can set Google sl=auto when source isn't English. */
export function detectSourceLangHint(text) {
  const body = String(text || "");
  const latin = (body.match(/[A-Za-z]/g) || []).length;
  const hindi = (body.match(/[\u0900-\u097F]/g) || []).length;
  const tamil = (body.match(/[\u0B80-\u0BFF]/g) || []).length;
  const cjk = (body.match(/[\u4E00-\u9FFF]/g) || []).length;
  const max = Math.max(latin, hindi, tamil, cjk);
  if (max < 8) return "auto";
  if (hindi === max) return "hi";
  if (tamil === max) return "ta";
  if (cjk === max) return "zh";
  if (latin === max) return "en";
  return "auto";
}

export function looksLikeEnglishText(text) {
  const body = String(text || "");
  if (!body.trim()) return false;
  const latin = (body.match(/[A-Za-z]/g) || []).length;
  const nonLatin = (
    body.match(/[\u0900-\u097F\u0B80-\u0BFF\u4E00-\u9FFF]/g) || []
  ).length;
  return latin >= 12 && latin > nonLatin * 2;
}

async function translateLongText(text, targetCode, sourceLang = null) {
  const raw = String(text || "");
  if (!raw.trim()) return raw;

  const sl =
    sourceLang ||
    (looksLikeEnglishText(raw) ? "en" : detectSourceLangHint(raw) || "auto");

  // Already English and targeting English — no work
  if (targetCode === "en" && (sl === "en" || looksLikeEnglishText(raw))) {
    return raw;
  }

  const chunks = splitChunks(raw, 4000);
  const out = [];
  for (let i = 0; i < chunks.length; i++) {
    out.push(await translatePlainChunk(chunks[i], targetCode, sl === "en" ? "en" : "auto"));
    if (i < chunks.length - 1) await sleep(80);
  }
  return out.join("");
}

/**
 * True when stored HTML was corrupted by an older placeholder-based translator
 * (tags mangled into numbers / "B10" style junk, headings flattened).
 */
export function looksCorruptedHtml(html) {
  const body = String(html || "");
  if (!body.trim()) return false;
  if (/[\uE000-\uE0FF]/.test(body)) return true;
  if (/\bB\d{1,3}\b/.test(body)) return true;
  // Lone 2–3 digit tokens stuck inside words (mangled placeholders like "आपके 33 शरीर")
  if (/\p{L}\s+\d{2,3}\s+\p{L}/u.test(body) && countHeadingTags(body) < 2) {
    return true;
  }
  return false;
}

export function countHeadingTags(html) {
  const m = String(html || "").match(/<\/?h[1-6]\b/gi);
  return m ? m.length : 0;
}

/**
 * Translate HTML while keeping EVERY tag byte-for-byte.
 * Only text between tags is sent to the API. Block tags flush the buffer
 * so each heading/paragraph stays a separate unit (same structure as English).
 */
export async function translateHtml(html, targetCode) {
  if (!html) return html || "";
  if (targetCode === "en" && looksLikeEnglishText(html)) return html || "";

  const parts = String(html).split(/(<[^>]+>)/g);
  const result = [];
  let buffer = "";

  const flush = async () => {
    if (!buffer) return;
    if (!buffer.trim()) {
      result.push(buffer);
      buffer = "";
      return;
    }
    const lead = buffer.match(/^\s*/)?.[0] || "";
    const trail = buffer.match(/\s*$/)?.[0] || "";
    const core = buffer.slice(lead.length, buffer.length - trail.length);
    try {
      const translated = await translateLongText(core, targetCode);
      result.push(lead + translated + trail);
    } catch (err) {
      console.warn("[translate] text node failed, keeping original:", err?.message);
      result.push(buffer);
    }
    buffer = "";
  };

  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith("<")) {
      if (BLOCK_TAG_RE.test(part) || buffer.length > 0) {
        await flush();
      }
      result.push(part);
    } else {
      buffer += part;
      if (buffer.length > 3500) await flush();
    }
  }
  await flush();

  let out = result.join("");
  out = out.replace(/[\uE000-\uE0FF]/g, "").replace(/\bB\d{1,3}\b/g, "");
  return out;
}

export async function translateTitle(title, targetCode) {
  if (!title) return title || "";
  if (targetCode === "en" && looksLikeEnglishText(title)) return title || "";
  try {
    return await translateLongText(title, targetCode);
  } catch (err) {
    console.warn("[translate] title failed:", err?.message);
    return title;
  }
}

export function isSupportedTargetLang(code) {
  return Boolean(LANG_PAIR[code]);
}

/**
 * Translate English title + HTML into target language.
 */
export async function translateArticleContent({ title, html }, targetCode) {
  const code = String(targetCode || "en").toLowerCase().split("-")[0];
  if (code === "en") {
    return { title: title || "", html: html || "", languageCode: "en" };
  }
  if (!isSupportedTargetLang(code)) {
    throw new Error(`Unsupported language: ${code}`);
  }

  const translatedTitle = await translateTitle(title || "", code);
  const translatedHtml = await translateHtml(html || "", code);

  return {
    title: translatedTitle,
    html: translatedHtml,
    languageCode: code,
  };
}
