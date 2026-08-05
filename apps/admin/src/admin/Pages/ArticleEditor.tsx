import { useState, useRef, useEffect } from "react";
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Quote,
    Link2,
    Code2,
    Image as ImageIcon,
    ChevronDown,
    ChevronRight,
    Upload,
    ArrowLeft,
    X,
    CheckCircle2,
    Loader2,
    Settings,
    Eye,
    Menu,
    Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { api, resolveAssetUrl, toStorageUrl } from "../lib/api";
import {
    convertWordToHtml,
    getPageKeyFromCategory,
    savePageContent,
} from "../../lib/articlePageContent";

interface ArticleEditorProps {
    onBack?: () => void;
    initialData?: any;
    article?: any;
    isSidebarOpen?: boolean;
}

export default function ArticleEditor({ onBack, initialData, article, isSidebarOpen = false }: ArticleEditorProps) {
    const editData = initialData ?? article;

    const [articleId, setArticleId] = useState<number | null>(editData?.id || null);
    const articleIdRef = useRef<number | null>(editData?.id || null);
    const [title, setTitle] = useState(editData?.title || "");
    const [content, setContent] = useState(editData?.content || "");
    const [coverImage, setCoverImage] = useState<string | null>(
        editData?.coverImage ? resolveAssetUrl(editData.coverImage) : null
    );
    const [isPublished, setIsPublished] = useState(editData?.isPublished || false);
    const [slug, setSlug] = useState(editData?.slug || "");
    const [publishedAt, setPublishedAt] = useState<string | null>(editData?.publishedAt || null);

    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const [lastSavedTime, setLastSavedTime] = useState<string>("");

    const [showPublishModal, setShowPublishModal] = useState(false);
    const [showStyles, setShowStyles] = useState(false);
    const [showLanguages, setShowLanguages] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Multi-language (English / Chinese / Malaysia / Hindi / Tamil)
    const [languages, setLanguages] = useState<{ id: number; code: string; name: string }[]>([]);
    const [selectedLanguageId, setSelectedLanguageId] = useState<number | null>(null);
    const [languageDocMap, setLanguageDocMap] = useState<
      Record<
        number,
        { documentId: number; htmlContent: string; originalName?: string; title?: string; category?: string }
      >
    >({});
    const [isSwitchingLanguage, setIsSwitchingLanguage] = useState(false);
    const selectedLanguageIdRef = useRef<number | null>(null);
    const languageDocMapRef = useRef<
      Record<
        number,
        { documentId: number; htmlContent: string; originalName?: string; title?: string; category?: string }
      >
    >({});
    const titleRef = useRef(editData?.title || "");

    // Publish Settings
    const [category, setCategory] = useState(editData?.category || "");
    const categoryRef = useRef(editData?.category || "");
    const [author, setAuthor] = useState(editData?.author || "");
    const [excerpt, setExcerpt] = useState(editData?.excerpt || "");

    // Word document upload (updates public article page content)
    const [wordFile, setWordFile] = useState<File | null>(null);
    const [wordFileName, setWordFileName] = useState("");
    const [wordImportError, setWordImportError] = useState("");
    const [isConvertingWord, setIsConvertingWord] = useState(false);
    const [editorMountKey, setEditorMountKey] = useState(0);

    const editorRef = useRef<HTMLDivElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const inlineFileRef = useRef<HTMLInputElement>(null);
    const wordFileRef = useRef<HTMLInputElement>(null);
    const autoSaveTimerRef = useRef<NodeJS.Timeout>();

    const languageLabel = (lang: { code?: string; name?: string } | null | undefined) => {
        const code = String(lang?.code || "").toLowerCase();
        const labels: Record<string, string> = {
            en: "English",
            zh: "Chinese",
            ms: "Malay",
            hi: "Hindi",
            ta: "Tamil",
        };
        return labels[code] || lang?.name || "Language";
    };

    /** Green tick only after a real DOC/DOCX was uploaded for that language */
    const languageHasUploadedDocument = (langId: number | null | undefined) => {
        if (!langId) return false;
        const row = languageDocMap[langId] || languageDocMapRef.current[langId];
        if (!row) return false;
        const name = String(row.originalName || "").trim().toLowerCase();
        if (!name) return false;
        if (name.startsWith("translated-")) return false;
        if (name === "editor-content.html") return false;
        return /\.(doc|docx)$/i.test(name);
    };

    const isPlaceholderTitle = (value: string) => {
        const s = String(value || "").trim();
        if (!s) return true;
        const lower = s.toLowerCase();
        if (lower === "untitled" || lower === "untitled article") return true;
        // Common auto-translated "Untitled Article" variants
        if (/शीर्षक\s*रहित/.test(s)) return true;
        if (/無標題|无标题/.test(s)) return true;
        if (/தலைப்பில்லா/.test(s)) return true;
        if (/artikel tanpa tajuk|tanpa tajuk/i.test(s)) return true;
        return false;
    };

    const plainTextFromHtml = (html: string) => {
        const tmp = document.createElement("div");
        tmp.innerHTML = html || "";
        return (tmp.textContent || tmp.innerText || "").replace(/\u00a0/g, " ").trim();
    };

    // Load existing article data into the editor when editing
  // Load existing article data into the editor when editing
useEffect(() => {
    if (!editData?.id) return;

    setArticleId(editData.id);
    articleIdRef.current = editData.id;
    setTitle(editData.title || "");
    titleRef.current = editData.title || "";
    setContent(editData.content || "");
    setCoverImage(editData.coverImage ? resolveAssetUrl(editData.coverImage) : null);
    setIsPublished(Boolean(editData.isPublished));
    setSlug(editData.slug || "");
    setPublishedAt(editData.publishedAt || null);
    setCategory(editData.category || "");
    setAuthor(editData.author || "");
    setExcerpt(editData.excerpt || "");

    // Load the HTML content into the editor — strip Figma embed artifacts first
    if (editorRef.current) {
        // Remove Figma paste metadata spans (data-metadata / data-buffer) which
        // are injected by Figma when copying from the design tool and are never
        // part of the actual article content.
        const cleaned = (editData.content || "")
            .replace(/<span[^>]*data-metadata[^>]*>[\s\S]*?<\/span>/gi, "")
            .replace(/<span[^>]*data-buffer[^>]*>[\s\S]*?<\/span>/gi, "");
        editorRef.current.innerHTML = cleaned;
        setContent(cleaned);
    }
}, [editData?.id]);

    // Load language list + existing article_language rows
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const langs = await api.getLanguages();
                if (cancelled || !Array.isArray(langs)) return;
                setLanguages(langs);
                const defaultLang =
                    langs.find((l: { code: string }) => l.code === "en") || langs[0];
                if (defaultLang && selectedLanguageIdRef.current == null) {
                    setSelectedLanguageId(defaultLang.id);
                    selectedLanguageIdRef.current = defaultLang.id;
                }

                if (editData?.id) {
                    const rows = await api.getArticleLanguages(editData.id);
                    if (cancelled || !Array.isArray(rows)) return;
                    const map: Record<
                        number,
                        {
                            documentId: number;
                            htmlContent: string;
                            originalName?: string;
                            title?: string;
                            category?: string;
                        }
                    > = {};
                    rows.forEach((row: any) => {
                        map[row.languageId] = {
                            documentId: row.documentId,
                            htmlContent: row.htmlContent || "",
                            originalName: row.originalName,
                            title: row.title || "",
                        };
                    });

                    // Seed default language from article.content if no language row yet
                    const defaultId = defaultLang?.id;
                    if (
                        defaultId &&
                        !map[defaultId]?.htmlContent?.trim() &&
                        (editData.content || "").trim()
                    ) {
                        map[defaultId] = {
                            documentId: map[defaultId]?.documentId || 0,
                            htmlContent: editData.content,
                            originalName: map[defaultId]?.originalName,
                            title: editData.title || map[defaultId]?.title || "",
                        };
                    }
                    // Always cache the English category in the default language entry
                    if (defaultId && editData.category) {
                        map[defaultId] = {
                            ...map[defaultId],
                            documentId: map[defaultId]?.documentId || 0,
                            htmlContent: map[defaultId]?.htmlContent || "",
                            category: editData.category,
                        };
                    }

                    setLanguageDocMap(map);
                    languageDocMapRef.current = map;

                    const langId = selectedLanguageIdRef.current || defaultLang?.id;
                    if (langId) {
                        const entry = map[langId];
                        if (entry?.htmlContent && editorRef.current) {
                            editorRef.current.innerHTML = entry.htmlContent;
                            setContent(entry.htmlContent);
                        }
                        if (entry?.title) {
                            setTitle(entry.title);
                            titleRef.current = entry.title;
                        }
                    }
                } else if (defaultLang?.id && (editData?.content || content)) {
                    // New article draft: keep whatever is in editor under default language
                    const html = editData?.content || content || "";
                    if (html) {
                        cacheLanguageHtml(defaultLang.id, html);
                    }
                }
            } catch (err) {
                console.error("Failed to load languages", err);
                alert(
                    "Could not load languages from server. Please refresh and make sure you are logged in as admin."
                );
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [editData?.id]);

    const makeUniqueSlug = (text: string) => {
        const base =
            text
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "") || "untitled";
        return `${base}-${Date.now()}`;
    };

    const ensureArticleSaved = async (): Promise<number | null> => {
        if (articleIdRef.current) return articleIdRef.current;
        const currentContent = editorRef.current?.innerHTML || content || "";
        const nextSlug = slug?.trim()
            ? slug
            : makeUniqueSlug(title.trim() || "untitled-article");
        const data: Record<string, unknown> = {
            title: title.trim() || "Untitled Article",
            slug: nextSlug,
            content: currentContent,
            coverImage: toStorageUrl(coverImage || ""),
            category,
            author,
            excerpt: excerpt.trim(),
            isPublished: false,
        };
        const response = await api.createArticle(data);
        if (response?.id) {
            setArticleId(response.id);
            articleIdRef.current = response.id;
            if (response.slug) setSlug(response.slug);
            else setSlug(nextSlug);
            return response.id;
        }
        return null;
    };

    const extractTitleFromHtml = (html: string) => {
        const match =
            html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) ||
            html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
        if (!match) return "";
        return match[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    };

    /** Remove headline from body so it is not duplicated under CONTENT */
    const stripHeadlineFromHtml = (html: string, headline: string) => {
        if (!html?.trim() || !headline?.trim()) return html;
        const normalize = (s: string) =>
            s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().toLowerCase();
        const target = normalize(headline);
        if (!target) return html;

        let next = html;

        // Leading h1 / h2 that matches the headline
        const headingRe = /^\s*(<h([12])[^>]*>[\s\S]*?<\/h\2>)/i;
        const headingMatch = next.match(headingRe);
        if (headingMatch && normalize(headingMatch[1]) === target) {
            next = next.replace(headingRe, "");
        }

        // Leading paragraph that is only the headline (bold or plain)
        const paraRe = /^\s*(<p[^>]*>[\s\S]*?<\/p>)/i;
        const paraMatch = next.match(paraRe);
        if (paraMatch && normalize(paraMatch[1]) === target) {
            next = next.replace(paraRe, "");
        }

        return next.replace(/^\s+/, "");
    };

    const translateTextClient = async (text: string, targetCode: string): Promise<string> => {
                const commonMap: Record<string, Record<string, string>> = {
            "mental health": { zh: "心理健康", ms: "Kesihatan Mental", hi: "मानसिक स्वास्थ्य", ta: "மனநலம்" },
            "relationship": { zh: "人际关系", ms: "Hubungan", hi: "संबंध", ta: "உறவுகள்" },
            "relationship issues": { zh: "人际关系问题", ms: "Isu Hubungan", hi: "संबंध संबंधी समस्याएं", ta: "உறவுப் பிரச்சனைகள்" },
            "relationship issues & advice": { zh: "人际关系问题与建议", ms: "Isu Hubungan & Nasihat", hi: "संबंध संबंधी समस्याएं और सलाह", ta: "உறவுப் பிரச்சனைகள் மற்றும் ஆலோசனைகள்" },
            "parenting": { zh: "育儿", ms: "Keibubapaan", hi: "पारवरिश", ta: "பெற்றோர் வளர்ப்பு" },
            "parenting challenges": { zh: "育儿挑战", ms: "Cabaran Keibubapaan", hi: "पारवरिश की चुनौतियाँ", ta: "பெற்றோர் வளர்ப்பு சவால்கள்" },
            "grief": { zh: "悲伤", ms: "Kesedihan", hi: "शोक", ta: "துக்கம்" },
            "grief and loss": { zh: "悲伤与丧亲", ms: "Kesedihan & Kehilangan", hi: "शोक और नुकसान", ta: "துக்கம் மற்றும் இழப்பு" },
            "grief & loss": { zh: "悲伤与丧亲", ms: "Kesedihan & Kehilangan", hi: "शोक और नुकसान", ta: "துக்கம் மற்றும் இழப்பு" },
            "burnout": { zh: "职业倦怠", ms: "Burnout", hi: "बर्नआउट", ta: "மனவுளைச்சல்" },
            "burnout & work stress": { zh: "职业倦怠与工作压力", ms: "Burnout & Tekanan Kerja", hi: "बर्नआउट और कार्य तनाव", ta: "மனவுளைச்சல் & வேலை மனஅழுத்தம்" },
            "burnout and work stress": { zh: "职业倦怠与工作压力", ms: "Burnout & Tekanan Kerja", hi: "बर्नआउट और कार्य तनाव", ta: "மனவுளைச்சல் & வேலை மனஅழுத்தம்" },
            "work stress": { zh: "工作压力", ms: "Tekanan Kerja", hi: "कार्य तनाव", ta: "வேலை மனஅழுத்தம்" },
            "family": { zh: "家庭", ms: "Keluarga", hi: "परिवार", ta: "குடும்பம்" },
            "family conflicts": { zh: "家庭冲突", ms: "Konflik Keluarga", hi: "पारिवारिक विवाद", ta: "குடும்ப மோதல்கள்" },
            "family conflict": { zh: "家庭冲突", ms: "Konflik Keluarga", hi: "पारिवारिक विवाद", ta: "குடும்ப மோதல்கள்" },
            "self-esteem": { zh: "自尊", ms: "Harga Diri", hi: "आत्मसम्मान", ta: "சுயமரியாதை" },
            "identity": { zh: "身份认同", ms: "Identiti", hi: "पहचान", ta: "அடையாளம்" },
            "self-esteem and identity": { zh: "自尊与身份认同", ms: "Harga Diri & Identiti", hi: "आत्मसम्मान और पहचान", ta: "சுயமரியாதை மற்றும் அடையாளம்" },
            "self-esteem & identity": { zh: "自尊与身份认同", ms: "Harga Diri & Identiti", hi: "आत्मसम्मान और पहचान", ta: "சுயமரியாதை மற்றும் அடையாளம்" },
            "mental health stigma and help-seeking": { zh: "心理健康污名与寻求帮助", ms: "Stigma Kesihatan Mental dan Mencari Bantuan", hi: "मानसिक स्वास्थ्य कलंक और मदद की तलाश", ta: "மனநல வடு மற்றும் உதவி நாடுதல்" },
            "mental health stigma & help-seeking": { zh: "心理健康污名与寻求帮助", ms: "Stigma Kesihatan Mental dan Mencari Bantuan", hi: "मानसिक स्वास्थ्य कलंक और मदद की तलाश", ta: "மனநல வடு மற்றும் உதவி நாடுதல்" },
            "grounding techniques": { zh: "接地技巧", ms: "Teknik Grounding", hi: "ग्राउंडिंग तकनीक", ta: "தரைவழி நுட்பங்கள்" },
            "general": { zh: "常规", ms: "Umum", hi: "सामान्य", ta: "பொதுவான" },
            "counselling": { zh: "咨询", ms: "Kaunseling", hi: "परामर्श", ta: "ஆலோசனை" },
            "counseling": { zh: "咨询", ms: "Kaunseling", hi: "परामर्श", ta: "ஆலோசனை" },
            "stress": { zh: "压力", ms: "Tekanan", hi: "तनाव", ta: "மன அழுத்தம்" },
            "anxiety": { zh: "焦虑", ms: "Kebimbangan", hi: "चिंता", ta: "கவலை" },
            "stress & anxiety": { zh: "压力与焦虑", ms: "Tekanan & Kebimbangan", hi: "तनाव और चिंता", ta: "மன அழுத்தம் & கவலை" },
            "stress and anxiety": { zh: "压力与焦虑", ms: "Tekanan & Kebimbangan", hi: "तनाव और चिंता", ta: "மன அழுத்தம் & கவலை" },
            "trauma and ptsd": { zh: "创伤与PTSD", ms: "Trauma dan PTSD", hi: "आघात और PTSD", ta: "அதிர்ச்சி மற்றும் பிடிஎஸ்டி" },
            "trauma & ptsd": { zh: "创伤与PTSD", ms: "Trauma dan PTSD", hi: "आघात और PTSD", ta: "அதிர்ச்சி மற்றும் பிடிஎஸ்டி" },
            "addiction": { zh: "成瘾", ms: "Ketagihan", hi: "लत", ta: "போதை" },
            "loneliness": { zh: "孤独", ms: "Kesepian", hi: "अकेलापन", ta: "தனிமை" },
            "depression": { zh: "抑郁症", ms: "Kemurungan", hi: "अवसाद", ta: "மனச்சோர்வு" },
            "wellness": { zh: "健康", ms: "Kesejahteraan", hi: "कल्याण", ta: "நலம்" },
            "self-care": { zh: "自我照顾", ms: "Penjagaan Diri", hi: "आत्म-देखभाल", ta: "சுய பராமரிப்பு" },
            "therapy": { zh: "治疗", ms: "Terapi", hi: "चिकित्सा", ta: "சிகிச்சை" },
            "youth": { zh: "青少年", ms: "Belia", hi: "युवा", ta: "इளைஞர்" },
            "children": { zh: "儿童", ms: "Kanak-kanak", hi: "बच्चे", ta: "குழந்தைகள்" },
            "marriage": { zh: "婚姻", ms: "Perkahwinan", hi: "विवाह", ta: "திருமணம்" },
            "trauma": { zh: "创伤", ms: "Trauma", hi: "आघात", ta: "அதிர்ச்சி" },
            "anger management": { zh: "愤怒管理", ms: "Pengurusan Kemarahan", hi: "क्रोध प्रबंधन", ta: "கோப மேலாண்மை" },
            "emotional health": { zh: "情绪健康", ms: "Kesihatan Emosi", hi: "भावनात्मक स्वास्थ्य", ta: "உணர்ச்சி ஆரோக்கியம்" },
        };
        const rawKey = text.trim().toLowerCase();
        const keysToTry = [
            rawKey,
            rawKey.replace(/\s*&\s*/g, " and "),
            rawKey.replace(/\s+and\s+/g, " & "),
        ];
        for (const k of keysToTry) {
            if (commonMap[k] && commonMap[k][targetCode]) {
                return commonMap[k][targetCode];
            }
        }
        try {
            const tl = targetCode === "zh" ? "zh-CN" : targetCode;
            const res = await fetch(
                `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`
            );
            if (res.ok) {
                const data = await res.json();
                if (data && data[0] && data[0][0] && data[0][0][0]) {
                    return data[0][0][0];
                }
            }
        } catch {
            /* fallback */
        }
        return text;
    };

    const cacheLanguageHtml = (
        langId: number,
        html: string,
        meta?: { documentId?: number; originalName?: string; title?: string; category?: string }
    ) => {
        setLanguageDocMap((prev) => {
            const next = {
                ...prev,
                [langId]: {
                    documentId: meta?.documentId ?? prev[langId]?.documentId ?? 0,
                    htmlContent: html,
                    originalName: meta?.originalName ?? prev[langId]?.originalName,
                    title:
                        meta?.title !== undefined
                            ? meta.title
                            : prev[langId]?.title || titleRef.current || "",
                    category:
                        meta?.category !== undefined
                            ? meta.category
                            : prev[langId]?.category || categoryRef.current || "",
                },
            };
            languageDocMapRef.current = next;
            return next;
        });
    };

    /** Persist current editor HTML for the active language into documents + article_language */
    const saveCurrentLanguageContent = async (
        htmlOverride?: string,
        options?: {
            file?: File | null;
            originalName?: string;
            articleIdOverride?: number | null;
            createArticleIfNeeded?: boolean;
            languageIdOverride?: number | null;
            titleOverride?: string;
        }
    ) => {
        const langId =
            options?.languageIdOverride || selectedLanguageIdRef.current;
        if (!langId) {
            console.warn("[ArticleEditor] No language selected — cannot save language document");
            return null;
        }

        const html =
            htmlOverride ??
            editorRef.current?.innerHTML ??
            content ??
            "";
        const langTitle =
            options?.titleOverride ??
            titleRef.current ??
            title ??
            extractTitleFromHtml(html) ??
            "";

        cacheLanguageHtml(langId, html, {
            originalName: options?.originalName || options?.file?.name,
            title: langTitle,
        });

        let id =
            options?.articleIdOverride ||
            articleIdRef.current ||
            null;

        const shouldCreate =
            options?.createArticleIfNeeded === true ||
            Boolean(options?.file) ||
            options?.articleIdOverride != null;

        if (!id && shouldCreate) {
            id = await ensureArticleSaved();
        }

        if (!id) return null;

        let documentId: number | undefined;

        try {
            if (options?.file) {
                const doc = await api.uploadDocument({
                    file: options.file,
                    htmlContent: html,
                    originalName: options.originalName || options.file.name,
                    title: langTitle,
                });
                documentId = doc?.id;

                const saved = await api.saveArticleLanguage(id, langId, {
                    documentId,
                    htmlContent: html,
                    originalName: options.originalName || options.file.name,
                    title: langTitle,
                });
                documentId = saved?.documentId || documentId;
            } else {
                const saved = await api.saveArticleLanguage(id, langId, {
                    htmlContent: html,
                    originalName: options?.originalName || "",
                    title: langTitle,
                });
                documentId = saved?.documentId;
            }

            if (documentId) {
                cacheLanguageHtml(langId, html, {
                    documentId,
                    originalName: options?.originalName || options?.file?.name,
                    title: langTitle,
                });
            }

            return documentId ?? null;
        } catch (err) {
            console.error("[ArticleEditor] saveCurrentLanguageContent failed", err);
            throw err;
        }
    };

    const switchLanguage = async (nextLanguageId: number) => {
        if (!nextLanguageId) return;
        if (nextLanguageId === selectedLanguageIdRef.current) {
            setShowLanguages(false);
            return;
        }

        setShowLanguages(false);
        setIsSwitchingLanguage(true);

        const prevLangId = selectedLanguageIdRef.current;
        const currentHtml = editorRef.current?.innerHTML || content || "";
        const currentTitle = titleRef.current || title || "";
        const currentCategory = categoryRef.current || category || "";
        const currentArticleId = articleIdRef.current;

        // 1) Cache current language title + content + category locally
        if (prevLangId) {
            cacheLanguageHtml(prevLangId, currentHtml, { title: currentTitle, category: currentCategory });
        }

        // 2) Select new language immediately
        selectedLanguageIdRef.current = nextLanguageId;
        setSelectedLanguageId(nextLanguageId);

        try {
            // 3) Persist previous language if article exists
            if (currentArticleId && prevLangId) {
                try {
                    await api.saveArticleLanguage(currentArticleId, prevLangId, {
                        htmlContent: currentHtml,
                        title: isPlaceholderTitle(currentTitle) ? "" : currentTitle,
                        ...(languageHasUploadedDocument(prevLangId)
                            ? {
                                  originalName:
                                      languageDocMapRef.current[prevLangId]
                                          ?.originalName,
                              }
                            : {}),
                    });
                } catch (persistErr) {
                    console.warn("Could not persist previous language (continuing):", persistErr);
                }
            }

            // 4) Load target language — local / server (translate only when English has real content)
            let html = languageDocMapRef.current[nextLanguageId]?.htmlContent || "";
            let nextTitle = languageDocMapRef.current[nextLanguageId]?.title || "";
            const nextLang = languages.find((l) => l.id === nextLanguageId);
            const nextCode = nextLang?.code || "en";

            // Ensure article exists so backend can translate — only if we may need it
            let ensureId = currentArticleId;
            const enLang = languages.find((l) => l.code === "en");
            const enSourceHtml =
                prevLangId && enLang && prevLangId === enLang.id
                    ? currentHtml
                    : enLang
                      ? languageDocMapRef.current[enLang.id]?.htmlContent || ""
                      : "";
            const enHasRealContent = plainTextFromHtml(enSourceHtml).length > 0;

            if (!ensureId && nextCode !== "en" && enHasRealContent) {
                try {
                    ensureId = await ensureArticleSaved();
                } catch {
                    ensureId = null;
                }
            }

            if (ensureId) {
                try {
                    const rows = await api.getArticleLanguages(ensureId);
                    const row = Array.isArray(rows)
                        ? rows.find((r: any) => r.languageId === nextLanguageId)
                        : null;
                    if (row && String(row.htmlContent || "").trim()) {
                        html = row.htmlContent || "";
                        nextTitle = row.title || nextTitle;
                        cacheLanguageHtml(nextLanguageId, html, {
                            documentId: row.documentId,
                            originalName: row.originalName,
                            title: nextTitle,
                        });
                    } else if (row?.originalName) {
                        cacheLanguageHtml(nextLanguageId, html, {
                            documentId: row.documentId,
                            originalName: row.originalName,
                            title: row.title || nextTitle,
                        });
                    }
                } catch {
                    /* keep local */
                }
            }

            const nextHasUpload = languageHasUploadedDocument(nextLanguageId);

            const looksUntranslated = (code: string, body: string) => {
                if (!body.trim()) return true;
                // Old translator mangled HTML tags into junk markers
                if (/[\uE000-\uE0FF]/.test(body) || /\bB\d{1,3}\b/.test(body)) {
                    return true;
                }
                if (/\p{L}\s+\d{2,3}\s+\p{L}/u.test(body)) return true;
                const headingCount = (body.match(/<\/?h[1-6]\b/gi) || []).length;
                const enHtmlCached =
                    (enLang &&
                        languageDocMapRef.current[enLang.id]?.htmlContent) ||
                    "";
                const enHeadings = (enHtmlCached.match(/<\/?h[1-6]\b/gi) || []).length;
                if (
                    enHeadings >= 4 &&
                    headingCount < Math.max(2, Math.floor(enHeadings * 0.4))
                ) {
                    return true;
                }
                if (code === "hi") return !/[\u0900-\u097F]/.test(body);
                if (code === "ta") return !/[\u0B80-\u0BFF]/.test(body);
                if (code === "zh") return !/[\u4E00-\u9FFF]/.test(body);
                if (code === "ms") {
                    return /Understanding Stress|Stress and anxiety are common|Learning to Manage Life/i.test(
                        body
                    );
                }
                return false;
            };

            // Translate from English only when English has real body content (not empty draft)
            if (
                ensureId &&
                nextCode !== "en" &&
                enHasRealContent &&
                !nextHasUpload &&
                looksUntranslated(nextCode, html)
            ) {
                try {
                    const translated = await api.translateArticleLanguage(
                        ensureId,
                        nextCode,
                        true
                    );
                    html = translated?.htmlContent || html;
                    nextTitle = translated?.title || nextTitle;
                    cacheLanguageHtml(nextLanguageId, html, {
                        documentId: translated?.documentId,
                        title: nextTitle,
                        // Do NOT mark as uploaded document — keep green tick for DOC/DOCX only
                        originalName:
                            languageDocMapRef.current[nextLanguageId]?.originalName ||
                            undefined,
                    });
                } catch (trErr) {
                    console.warn("Auto-translate failed:", trErr);
                    toast(
                        trErr instanceof Error
                            ? trErr.message
                            : "Could not translate. Save/upload English document first, then select language.",
                        {
                            position: "bottom-right",
                            autoClose: 4000,
                            theme: "light",
                            icon: false,
                            hideProgressBar: true,
                            style: {
                                background: "#ffffff",
                                color: "#111111",
                                border: "1px solid #E0DFDC",
                                borderRadius: "12px",
                                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                                fontSize: "14px",
                                fontWeight: 500,
                            },
                        }
                    );
                }
            } else if (
                ensureId &&
                nextCode === "en" &&
                !String(html || "").trim() &&
                enHasRealContent
            ) {
                try {
                    const translated = await api.translateArticleLanguage(
                        ensureId,
                        "en",
                        false
                    );
                    html = translated?.htmlContent || "";
                    nextTitle = translated?.title || nextTitle;
                } catch {
                    /* ignore */
                }
            }

            // No uploaded doc + no real content → keep editor empty (no default headline)
            if (!nextHasUpload && !plainTextFromHtml(html)) {
                html = "";
                nextTitle = "";
            }

            const displayTitle = isPlaceholderTitle(nextTitle) ? "" : nextTitle;
            setContent(html);
            setTitle(displayTitle);
            titleRef.current = displayTitle;

            // Category is translated per language; Author name is NOT translated
            let nextCategory = languageDocMapRef.current[nextLanguageId]?.category || "";
            if (!nextCategory) {
                // Always translate from the English original category for reliability
                const enLangObj = languages.find((l) => l.code === "en");
                const englishCategory = enLangObj
                    ? (languageDocMapRef.current[enLangObj.id]?.category || currentCategory || "")
                    : (currentCategory || "");
                if (englishCategory && nextCode !== "en") {
                    nextCategory = await translateTextClient(englishCategory, nextCode);
                    // Cache the translated category for this language
                    cacheLanguageHtml(nextLanguageId, html, { category: nextCategory });
                } else {
                    nextCategory = englishCategory;
                }
            }
            setCategory(nextCategory);
            categoryRef.current = nextCategory;

            setWordFile(null);
            setWordFileName(
                nextHasUpload
                    ? languageDocMapRef.current[nextLanguageId]?.originalName || ""
                    : ""
            );
            setEditorMountKey((k) => k + 1);
        } catch (err) {
            console.error("Language switch failed", err);
            alert(err instanceof Error ? err.message : "Failed to switch language");
        } finally {
            setIsSwitchingLanguage(false);
        }
    };

    // After language switch remount, paint the correct HTML into the new editor node
    useEffect(() => {
        if (!editorRef.current) return;
        editorRef.current.innerHTML = content || "";
    }, [editorMountKey]);

    // Format function
    function format(command: string, value?: string) {
        editorRef.current?.focus();
        if (command === "formatBlock") {
            document.execCommand("formatBlock", false, value);
        } else if (command === "createLink") {
            const url = prompt("Enter the URL:");
            if (url) document.execCommand("createLink", false, url);
        } else {
            document.execCommand(command, false, value);
        }
        // Trigger content update and auto-save
        handleContentChange();
    }

    // Handle content change
    const handleContentChange = () => {
        const newContent = editorRef.current?.innerHTML || "";
        setContent(newContent);
        triggerAutoSave();
    };

    // Handle Cover Upload
    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const response = await api.uploadFiles([file]);
            if (response.urls && response.urls[0]) {
                const uploadedUrl = resolveAssetUrl(response.urls[0]);
                setCoverImage(uploadedUrl);
            }
        } catch (err) {
            console.error("Upload failed", err);
            setSaveStatus("error");
        }
    };

    // Handle Inline Image Upload
    const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const response = await api.uploadFiles([file]);
            if (response.urls && response.urls[0]) {
                const url = resolveAssetUrl(response.urls[0]);
                format("insertImage", url);
            }
        } catch (err) {
            console.error("Inline upload failed", err);
        }
    };

    // Generate URL-friendly slug
    const generateSlug = (text: string) => {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "") || "untitled-" + Date.now();
    };

    // Auto-save disabled as per requirement: changes save ONLY on clicking Save/Publish
    const triggerAutoSave = () => {};

    const handleBack = () => {
        onBack?.();
    };

    // Save Article (Draft or update existing)
    const saveArticle = async (publish: boolean = false, overrideCover?: string) => {
        const currentContent = editorRef.current?.innerHTML || "";

        // Don't block saving — allow save even with empty content

        setSaveStatus("saving");
        if (publish) setIsPublishing(true);

        const nextPublished = publish ? true : isPublished;
        const coverForStorage = toStorageUrl(overrideCover || coverImage || "");

        try {
            const data: Record<string, unknown> = {
                title: title.trim() || "Untitled Article",
                slug:
                    slug ||
                    (articleId
                        ? generateSlug(title.trim() || "Untitled Article")
                        : makeUniqueSlug(title.trim() || "untitled-article")),
                content: currentContent,
                coverImage: coverForStorage,
                category,
                author,
                excerpt: excerpt.trim(),
                isPublished: nextPublished,
            };

            if (nextPublished) {
                data.publishedAt = publish
                    ? new Date().toISOString()
                    : publishedAt || new Date().toISOString();
            }

            let response;
            if (articleId) {
                response = await api.updateArticle(Number(articleId), data);
            } else {
                response = await api.createArticle(data);
                if (response?.id) {
                    setArticleId(response.id);
                    articleIdRef.current = response.id;
                    if (response.slug) setSlug(response.slug);
                }
            }

            if (response?.slug) setSlug(response.slug);
            if (response?.publishedAt) setPublishedAt(response.publishedAt);

            // Keep article_language + documents in sync for the selected language
            try {
                await saveCurrentLanguageContent(currentContent, {
                    articleIdOverride: response?.id || articleIdRef.current,
                    createArticleIfNeeded: true,
                });
            } catch (langErr) {
                console.error("Language document save failed", langErr);
            }

            setSaveStatus("saved");
            setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

            if (publish) {
                setIsPublished(true);

                setTimeout(() => {
                    onBack?.();
                }, 1500);
            }
        } catch (err) {
            console.error("Save failed", err);
            setSaveStatus("error");
            alert(err instanceof Error ? err.message : "Failed to save article");
        } finally {
            if (publish) setIsPublishing(false);
            setTimeout(() => setSaveStatus("idle"), 2000);
        }
    };

    const handleWordFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setWordImportError("");
        if (!file) {
            setWordFile(null);
            setWordFileName("");
            return;
        }

        const name = file.name.toLowerCase();
        if (!name.endsWith(".docx")) {
            const msg = "Please upload a .docx Word document (older .doc is not supported)";
            setWordImportError(msg);
            alert(msg);
            setWordFile(null);
            setWordFileName("");
            e.target.value = "";
            return;
        }

        setWordFile(file);
        setWordFileName(file.name);
        await applyWordDocument(file);
    };

    /** Convert Word file to HTML and bind it to the currently selected language */
    const applyWordDocument = async (file: File): Promise<string | null> => {
        if (!selectedLanguageIdRef.current) {
            alert("Please select a language first, then upload the document.");
            return null;
        }

        setIsConvertingWord(true);
        setWordImportError("");
        try {
            const { html } = await convertWordToHtml(file);
            if (!html.trim()) {
                const msg = "Could not extract content from this Word document.";
                setWordImportError(msg);
                alert(msg);
                return null;
            }

            const extractedTitle = extractTitleFromHtml(html);
            const bodyHtml = extractedTitle
                ? stripHeadlineFromHtml(html, extractedTitle)
                : html;

            if (extractedTitle) {
                setTitle(extractedTitle);
                titleRef.current = extractedTitle;
            }
            setContent(bodyHtml);
            setEditorMountKey((k) => k + 1);

            const pageKey = getPageKeyFromCategory(category);
            const articleSlug =
                slug ||
                (extractedTitle || title)
                    .trim()
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, "");
            if (articleSlug && articleSlug !== slug) setSlug(articleSlug);

            savePageContent(pageKey, {
                html: bodyHtml,
                title: (extractedTitle || title).trim(),
                author: author.trim(),
                excerpt: excerpt.trim(),
                coverImage: coverImage || "",
                slug: articleSlug || "",
            });

            // Save under the currently selected language (supports per-language Word uploads)
            try {
                await saveCurrentLanguageContent(bodyHtml, {
                    file,
                    originalName: file.name,
                    createArticleIfNeeded: true,
                    languageIdOverride: selectedLanguageIdRef.current,
                    titleOverride: extractedTitle || titleRef.current,
                });

                if (selectedLanguageIdRef.current) {
                    cacheLanguageHtml(selectedLanguageIdRef.current, bodyHtml, {
                        originalName: file.name,
                        title: extractedTitle || titleRef.current,
                    });
                }

                // If English was uploaded, keep it as translate source for other languages on switch.
                // (Non-English uploads stay on that language only — no overwrite of English.)

                setWordFileName(file.name);
                setSaveStatus("saved");
                setLastSavedTime(
                    new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    })
                );
            } catch (langErr) {
                console.error("Failed to save language document", langErr);
                const msg =
                    langErr instanceof Error
                        ? langErr.message
                        : "Failed to save document";
                setWordImportError(msg);
                alert(msg);
            } finally {
                setIsSwitchingLanguage(false);
            }

            return html;
        } catch (err) {
            console.error("Word convert failed", err);
            const msg = err instanceof Error ? err.message : "Failed to read Word document";
            setWordImportError(msg);
            alert(msg);
            return null;
        } finally {
            setIsConvertingWord(false);
            if (wordFileRef.current) wordFileRef.current.value = "";
        }
    };

    /** Sync title/author/excerpt/cover (+ optional html) to the public article page */
    const syncPublicPageMeta = (htmlOverride?: string) => {
        const pageKey = getPageKeyFromCategory(category);
        const currentHtml =
            htmlOverride ??
            editorRef.current?.innerHTML ??
            content ??
            "";
        const articleSlug =
            slug ||
            title
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "");
        if (articleSlug && articleSlug !== slug) setSlug(articleSlug);

        savePageContent(pageKey, {
            html: currentHtml,
            title: title.trim(),
            author: author.trim(),
            excerpt: excerpt.trim(),
            coverImage: coverImage || "",
            slug: articleSlug || "",
        });
    };

    const showToast = (message: string) => {
        toast(message, {
            position: "bottom-right",
            autoClose: 4000,
            theme: "light",
            icon: false,
            hideProgressBar: true,
            style: {
                background: "#ffffff",
                color: "#111111",
                border: "1px solid #E0DFDC",
                borderRadius: "12px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                fontSize: "14px",
                fontWeight: 500,
            },
        });
    };

    /** Plain text from the rich-text body (ignores empty HTML shells) */
    const getBodyText = () => {
        const html = editorRef.current?.innerHTML ?? content ?? "";
        const tmp = document.createElement("div");
        tmp.innerHTML = html;
        return (tmp.textContent || tmp.innerText || "").replace(/\u00a0/g, " ").trim();
    };

    /** Build "A X, Y and Z are required..." from only missing items */
    const requiredFieldsMessage = (missing: string[]) => {
        if (missing.length === 0) return "";
        if (missing.length === 1) {
            return `A ${missing[0]} is required to publish your article`;
        }
        if (missing.length === 2) {
            return `A ${missing[0]} and ${missing[1]} are required to publish your article`;
        }
        const last = missing[missing.length - 1];
        const rest = missing.slice(0, -1).join(", ");
        return `A ${rest} and ${last} are required to publish your article`;
    };

    /** Cover image, title, and body required before opening publish settings */
    const validateArticleBasics = () => {
        const missing: string[] = [];
        if (!coverImage) missing.push("cover image");
        if (!title.trim()) missing.push("headline");
        if (!getBodyText()) missing.push("content");
        if (missing.length > 0) {
            showToast(requiredFieldsMessage(missing));
            return false;
        }
        return true;
    };

    const isEditMode = Boolean(editData?.id);

    const handlePublishOrSave = async () => {
        const missing: string[] = [];
        if (!coverImage) missing.push("cover image");
        if (!category.trim()) missing.push("category");
        if (!author.trim()) missing.push("author name");
        if (!title.trim()) missing.push("headline");
        if (!getBodyText()) missing.push("content");
        if (missing.length > 0) {
            showToast(requiredFieldsMessage(missing));
            return;
        }

        syncPublicPageMeta();

        if (isEditMode) {
            await saveArticle(isPublished);
            showToast("Article saved successfully");
            onBack?.();
        } else {
            await saveArticle(true);
        }
    };



    // Calculate header position based on sidebar state
    // AdminLayout already places this page beside the nav — only offset if explicitly told.
    const headerStyle = {
        left: isSidebarOpen ? "280px" : "0",
        transition: "left 0.3s ease-in-out",
    };

    return (
        <div className="min-h-screen w-full bg-[#F3F2EF] font-sans text-[#111]">

            {/* TOP BAR - sticky within main content (AdminLayout already accounts for nav) */}
            <div
                className="sticky top-0 right-0 h-[72px] bg-white border-b border-[#E0DFDC] px-4 sm:px-6 lg:px-8 flex items-center justify-between z-[100] w-full"
                style={isSidebarOpen ? headerStyle : undefined}
            >
                {/* LEFT: BACK & STATUS */}
                <div className="flex items-center gap-6">
                    <button
                        onClick={handleBack}
                        className="p-2 hover:bg-[#F3F2EF] rounded-full transition-all text-[#666]"
                    >
                                   <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M15 18L9 12L15 6"
                      stroke="#0D4A7A"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                    </button>

                    <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-[#F3F2EF]/50">
                        {saveStatus === "saving" ? (
                            <Loader2 size={16} className="animate-spin text-[#0A66C2]" />
                        ) : saveStatus === "saved" ? (
                            <CheckCircle2 size={16} className="text-green-600" />
                        ) : isPublished ? (
                            <CheckCircle2 size={16} className="text-blue-600" />
                        ) : (
                            <div className="w-2 h-2 rounded-full bg-gray-400" />
                        )}
                        <span className="text-[14px] text-[#666] font-medium">
                            {isPublished ? "Published" :
                                saveStatus === "saving" ? "Saving..." :
                                    saveStatus === "saved" ? `Saved at ${lastSavedTime}` :
                                        articleId ? "Draft saved" : "Draft"}
                        </span>
                    </div>
                </div>

                {/* CENTER: TOOLBAR - Desktop */}
                <div className="hidden md:flex items-center gap-2 bg-[#F3F2EF] px-3 py-1.5 rounded-full">
                    {/* STYLE */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowStyles(!showStyles);
                                setShowLanguages(false);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1 hover:bg-white rounded-full text-[14px] font-semibold text-[#666] transition-all"
                        >
                            Style <ChevronDown size={14} />
                        </button>
                        <AnimatePresence>
                            {showStyles && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-[45px] left-0 w-[200px] bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                                >
                                    {[
                                        { label: "Normal", cmd: "p", desc: "Regular text" },
                                        { label: "Heading 1", cmd: "h1", desc: "Large title" },
                                        { label: "Heading 2", cmd: "h2", desc: "Medium heading" },
                                        { label: "Quote", cmd: "blockquote", desc: "Highlighted text" }
                                    ].map((s) => (
                                        <button
                                            key={s.label}
                                            onClick={() => { format("formatBlock", s.cmd); setShowStyles(false); }}
                                            className="w-full text-left px-5 py-3 hover:bg-[#F3F2EF] transition-all border-b border-gray-50 last:border-0"
                                        >
                                            <div className="font-bold text-[#111]">{s.label}</div>
                                            <div className="text-xs text-gray-500">{s.desc}</div>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="w-[1px] h-4 bg-gray-300 mx-1" />

                    {[
                        { icon: <Bold size={20} />, cmd: "bold" },
                        { icon: <Italic size={20} />, cmd: "italic" },
                        { icon: <List size={20} />, cmd: "insertUnorderedList" },
                        { icon: <ListOrdered size={20} />, cmd: "insertOrderedList" },
                        { icon: <Link2 size={20} />, cmd: "createLink" },
                    ].map((btn, i) => (
                        <button
                            key={i}
                            onClick={() => format(btn.cmd)}
                            className="p-2 hover:bg-white rounded-full text-[#666] hover:text-[#0A66C2] transition-all"
                        >
                            {btn.icon}
                        </button>
                    ))}

                    <button
                        onClick={() => inlineFileRef.current?.click()}
                        className="p-2 hover:bg-white rounded-full text-[#666] hover:text-[#0A66C2] transition-all"
                    >
                        <ImageIcon size={20} />
                    </button>
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden p-2 hover:bg-[#F3F2EF] rounded-full transition-all"
                >
                    <Menu size={24} />
                </button>

                {/* RIGHT: ACTIONS */}
                <div className="hidden md:flex items-center gap-4">
                    {/* <button
                        onClick={() => setShowPreview(true)}
                        className="h-[40px] px-5 rounded-full border border-[#0A66C2] text-[#0A66C2] font-semibold hover:bg-[#EEF3F8] transition-all flex items-center gap-2"
                    >
                        <Eye size={18} /> Preview
                    </button> */}

                    <button
                        onClick={handlePublishOrSave}
                        disabled={isSaving || isPublishing || isConvertingWord}
                        className="h-[40px] px-8 rounded-xl font-bold transition-all shadow-md bg-[#0D4A7A] text-white flex items-center gap-2 disabled:opacity-50"
                    >
                        {isPublishing ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : isEditMode ? (
                            "Save"
                        ) : (
                            "Publish"
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Toolbar */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-[72px] left-0 right-0 bg-white border-b border-[#E0DFDC] p-4 z-[99] md:hidden shadow-lg"
                        style={{ left: isSidebarOpen ? '280px' : '0' }}
                    >
                        <div className="flex flex-wrap gap-2">
                            {[
                                { icon: <Bold size={18} />, cmd: "bold" },
                                { icon: <Italic size={18} />, cmd: "italic" },
                                { icon: <List size={18} />, cmd: "insertUnorderedList" },
                                { icon: <ListOrdered size={18} />, cmd: "insertOrderedList" },
                                { icon: <Link2 size={18} />, cmd: "createLink" },
                                { icon: <ImageIcon size={18} />, cmd: "image" },
                            ].map((btn, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        if (btn.cmd === "image") {
                                            inlineFileRef.current?.click();
                                        } else {
                                            format(btn.cmd);
                                        }
                                    }}
                                    className="p-2 hover:bg-[#F3F2EF] rounded-full text-[#666] transition-all"
                                >
                                    {btn.icon}
                                </button>
                            ))}

                            <div className="relative">
                                <button
                                    onClick={() => setShowStyles(!showStyles)}
                                    className="flex items-center gap-1 px-3 py-1 hover:bg-[#F3F2EF] rounded-full text-[12px] font-semibold text-[#666]"
                                >
                                    Style <ChevronDown size={12} />
                                </button>
                            </div>

                            <button
                                onClick={() => { setShowPreview(true); setIsMobileMenuOpen(false); }}
                                className="px-4 py-2 border border-[#0A66C2] text-[#0A66C2] hover:bg-[#EEF3F8] rounded-full font-bold text-sm flex items-center gap-1"
                            >
                                <Eye size={16} /> Preview
                            </button>

                            <button
                                onClick={handlePublishOrSave}
                                disabled={isSaving || isPublishing || isConvertingWord}
                                className="px-4 py-2 rounded-full font-bold text-sm bg-[#0D4A7A] text-white flex items-center gap-2 disabled:opacity-50"
                            >
                                {isPublishing ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : isEditMode ? (
                                    "Save"
                                ) : (
                                    "Publish"
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MAIN EDITOR CONTENT — fills available width beside admin nav */}
            <div className="pt-5 pb-16 w-full px-3 sm:px-5 lg:px-6">
                <div className="flex flex-col lg:flex-row gap-4 lg:gap-5 items-start w-full">
                    {/* LANGUAGE SIDE PANEL */}
                    <aside className="w-full lg:w-[220px] xl:w-[240px] shrink-0 bg-white border border-[#E0DFDC] rounded-2xl shadow-sm overflow-hidden lg:sticky lg:top-[88px]">
                        <div className="px-4 pt-4 pb-3 border-b border-[#EEE]">
                            <div className="flex items-center gap-2 mb-1">
                                <Globe size={18} className="text-[#0D4A7A]" />
                                <h3 className="text-[12px] md:text-[14px] lg:text-[16px] font-bold text-[#0D4A7A]">Language</h3>
                            </div>
                            <p className="text-[11px] md:text-[13px] lg:text-[14px] text-gray leading-snug">
                                Select a language to add or edit article content.
                            </p>
                        </div>
                        <div className="p-1.5">
                            {(languages.length
                                ? languages
                                : [
                                      { id: 0, code: "en", name: "English" },
                                      { id: 0, code: "zh", name: "Chinese" },
                                      { id: 0, code: "ms", name: "Malay" },
                                      { id: 0, code: "hi", name: "Hindi" },
                                      { id: 0, code: "ta", name: "Tamil" },
                                  ]
                            ).map((lang) => {
                                const selected = lang.id === selectedLanguageId;
                                const hasUploadedDoc = languageHasUploadedDocument(lang.id);
                                return (
                                    <button
                                        key={lang.code}
                                        type="button"
                                        disabled={!lang.id || isSwitchingLanguage}
                                        onClick={() => {
                                            if (!lang.id) {
                                                alert(
                                                    "Languages not loaded yet. Please wait a moment and try again."
                                                );
                                                return;
                                            }
                                            void switchLanguage(lang.id);
                                        }}
                                        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all mb-0.5 disabled:opacity-60 ${
                                            selected
                                                ? "bg-[#E8F1FB] text-[#0A66C2]"
                                                : "text-[#222] hover:bg-[#F7F7F5]"
                                        }`}
                                    >
                                        <span className="flex-1 text-[14px] font-semibold truncate">
                                            {languageLabel(lang)}
                                        </span>
                                        <ChevronRight
                                            size={15}
                                            className={`shrink-0 ${
                                                selected ? "text-[#0A66C2]" : "text-[#98A2B3]"
                                            }`}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                        {isSwitchingLanguage ? (
                            <div className="px-4 pb-3 flex items-center gap-2 text-[12px] text-[#0A66C2]">
                                <Loader2 size={14} className="animate-spin" />
                                Loading language…
                            </div>
                        ) : null}
                    </aside>

                    {/* EDITOR COLUMN — takes remaining width */}
                    <div className="flex-1 min-w-0 w-full">
                {/* COVER IMAGE SECTION */}
                <div className="relative w-full h-[220px] md:h-[300px] lg:h-[340px] bg-white border border-[#E0DFDC] rounded-t-xl overflow-hidden group">
                    {coverImage ? (
                        <>
                            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    onClick={() => fileRef.current?.click()}
                                    className="px-4 py-2 md:px-6 md:py-3 bg-white text-[#0D4A7A] rounded-full font-bold shadow-xl transition-all flex items-center gap-2 text-sm md:text-base hover:bg-[#F3F2EF]"
                                >
                                    <Upload size={18} /> Change Cover
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#F8F9FA] p-4">
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-[#F3F2EF] rounded-xl flex items-center justify-center mb-4">
                                <ImageIcon size={24} className="text-[#0D4A7A] md:size-8" />
                            </div>
                            <h2 className="text-xl md:text-2xl font-medium text-[#666] mb-4 md:mb-6 text-center">Add a cover image</h2>
                            <button
                                onClick={() => fileRef.current?.click()}
                                className="px-6 md:px-8 py-2 md:py-3 border-2 border-[#0D4A7A] text-[#0D4A7A] rounded-full font-bold transition-all flex items-center gap-2 text-sm md:text-base hover:bg-[#F3F2EF]"
                            >
                                <Upload size={18} /> Upload Image
                            </button>
                            <p className="mt-1 md:mt-2 lg:mt-2 text-[11px] md:text-[13px] lg:text-[14px] text-gray text-center">Recommended: 1280 x 720 pixels</p>
                        </div>
                    )}
                    <input ref={fileRef} type="file" className="hidden" accept="image/*" onChange={handleCoverUpload} />
                </div>

                {/* WRITING AREA */}
                <div className="bg-white border-x border-b border-[#E0DFDC] rounded-b-xl px-4 md:px-10 lg:px-14 py-6 md:py-10 shadow-sm">
                    <div className="flex flex-col items-center gap-2 mb-8 md:mb-10">
                        <input
                            ref={wordFileRef}
                            type="file"
                            accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            className="hidden"
                            onChange={handleWordFileChange}
                        />
                        <button
                            type="button"
                            onClick={() => {
                                if (!selectedLanguageId) {
                                    showToast("Please select a language from the side panel first.");
                                    return;
                                }
                                wordFileRef.current?.click();
                            }}
                            disabled={isConvertingWord || isSwitchingLanguage}
                            className="h-[55px] px-6 rounded-full border-2 border-[#0D4A7A] text-[#0D4A7A] font-bold hover:bg-[#F3F2EF] transition-all flex items-center gap-2"
                        >
                            {isConvertingWord ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Upload size={18} />
                            )}
                            Upload{" "}
                            {languageLabel(
                                languages.find((l) => l.id === selectedLanguageId) || {
                                    code: "en",
                                    name: "English",
                                }
                            )}{" "}
                            version
                        </button>
                        <p className="text-[11px] md:text-[13px] lg:text-[14px] text-gray text-center max-w-md">
                            Attach a document related to the article(DOC, DOCX)
                        </p>
                        {wordFileName ? (
                            <p className="text-xs text-green-700 font-semibold">
                                Saved for{" "}
                                {languageLabel(
                                    languages.find((l) => l.id === selectedLanguageId)
                                )}
                                : {wordFileName}
                            </p>
                        ) : null}
                        {wordImportError ? (
                            <p className="text-xs text-red-600 font-semibold">{wordImportError}</p>
                        ) : null}
                    </div>

                    {/* CATEGORY */}
                    <div className="mb-6 md:mb-8">
                        <label className="block text-sm md:text-base font-bold tracking-wide text-[#111] uppercase mb-2">
                            CATEGORY
                        </label>
                        <input
                            type="text"
                            value={category}
                            onChange={(e) => {
                                setCategory(e.target.value);
                                categoryRef.current = e.target.value;
                            }}
                            placeholder="Write category"
                            className="w-full bg-transparent border-none outline-none text-xl md:text-2xl font-semibold text-[#111] placeholder:text-gray-300 overflow-hidden whitespace-nowrap text-ellipsis"
                        />
                    </div>

                    {/* AUTHOR NAME */}
                    <div className="mb-6 md:mb-8">
                        <label className="block text-sm md:text-base font-bold tracking-wide text-[#111] uppercase mb-2">
                            AUTHOR NAME
                        </label>
                        <input
                            type="text"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            placeholder="Write name"
                            className="w-full bg-transparent border-none outline-none text-xl md:text-2xl font-semibold text-[#111] placeholder:text-gray-300 overflow-hidden whitespace-nowrap text-ellipsis"
                        />
                    </div>

                    {/* HEADLINE — single line, no scroll */}
                    <div className="mb-6 md:mb-8">
                        <label className="block text-sm md:text-base font-bold tracking-wide text-[#111] mb-2">
                            HEADLINE
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                titleRef.current = e.target.value;
                            }}
                            placeholder="Write here"
                            className="w-full bg-transparent border-none outline-none text-2xl md:text-[40px] leading-[1.2] font-bold text-[#111] placeholder:text-gray-300 overflow-hidden whitespace-nowrap text-ellipsis"
                        />
                    </div>

                    {/* CONTENT */}
                    <div>
                        <label className="block text-sm md:text-base font-bold tracking-wide text-[#111] mb-2">
                            CONTENT
                        </label>
                        <div
                            key={editorMountKey}
                            ref={editorRef}
                            contentEditable
                            suppressContentEditableWarning
                            onInput={handleContentChange}
                            onPaste={(e) => {
                                // Strip Figma embed artifacts on paste before they enter the editor
                                const html = e.clipboardData.getData("text/html");
                                if (html && (html.includes("data-metadata") || html.includes("data-buffer"))) {
                                    e.preventDefault();
                                    const cleaned = html
                                        .replace(/<span[^>]*data-metadata[^>]*>[\s\S]*?<\/span>/gi, "")
                                        .replace(/<span[^>]*data-buffer[^>]*>[\s\S]*?<\/span>/gi, "");
                                    document.execCommand("insertHTML", false, cleaned);
                                }
                            }}
                            className="prose-editor min-h-[400px] md:min-h-[600px] outline-none text-lg md:text-[22px] leading-[1.6] text-[#333] font-normal"
                            data-placeholder="Write here"
                        />
                    </div>
                </div>
                    </div>
                </div>
            </div>

            {/* INLINE IMAGE INPUT */}
            <input ref={inlineFileRef} type="file" className="hidden" accept="image/*" onChange={handleInlineImageUpload} />



            {/* Success Toast */}
            <AnimatePresence>
                {isPublishing && saveStatus === "saved" && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-8 right-8 z-[200] bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2"
                    >
                        <CheckCircle2 size={20} />
                        <span>Article published successfully!</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* PREVIEW MODAL */}
            <AnimatePresence>
                {showPreview && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed inset-0 z-[300] bg-white overflow-y-auto"
                    >
                        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-[#E0DFDC] px-4 md:px-8 py-3 flex items-center justify-between z-10 shadow-sm">
                            <h2 className="text-lg md:text-xl font-bold text-gray-800">Article Preview</h2>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="px-4 py-2 md:px-6 md:py-2.5 rounded-full bg-[#F3F2EF] hover:bg-[#E0DFDC] text-gray-800 font-bold transition-all flex items-center gap-2 text-sm md:text-base"
                            >
                                <X size={18} /> Close
                            </button>
                        </div>

                        <div className="max-w-[720px] mx-auto pt-8 md:pt-12 pb-24 px-4 md:px-0">
                            {coverImage && (
                                <img
                                    src={coverImage}
                                    alt="Cover"
                                    className="w-full h-auto max-h-[400px] object-cover mb-8 md:mb-12 shadow-sm"
                                />
                            )}

                            <h1 className="text-3xl md:text-[48px] font-bold leading-tight text-[#111] mb-8">
                                {title || "Untitled Article"}
                            </h1>

                            <div className="flex items-center gap-4 mb-10 pb-8 border-b border-[#E0DFDC]">
                                <div className="w-12 h-12 md:w-14 md:h-14 bg-[#0A66C2] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-sm">
                                    {author ? author.charAt(0).toUpperCase() : "W"}
                                </div>
                                <div>
                                    <div className="font-bold text-[#111] text-base md:text-lg">{author || "WINGS Team"}</div>
                                    <div className="text-gray-500 text-xs md:text-sm">Published • {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • 5 min read</div>
                                </div>
                            </div>

                            <div
                                className="prose-editor text-lg md:text-[21px] leading-[1.8] text-[#333] font-normal"
                                dangerouslySetInnerHTML={{ __html: content || "" }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .prose-editor:empty:before {
                    content: attr(data-placeholder);
                    color: #adb5bd;
                    pointer-events: none;
                }

                .prose-editor h1 {
                    font-size: 2rem;
                    font-weight: 800;
                    margin-bottom: 1.5rem;
                    color: #111;
                }

                .prose-editor h2 {
                    font-size: 1.75rem;
                    font-weight: 700;
                    margin-bottom: 1.25rem;
                    margin-top: 2rem;
                    color: #111;
                }

                .prose-editor p {
                    margin-bottom: 1.5rem;
                }

                .prose-editor blockquote {
                    border-left: 4px solid #0A66C2;
                    padding-left: 1.5rem;
                    font-style: italic;
                    color: #666;
                    margin: 2rem 0;
                    font-size: 1.5rem;
                }

                .prose-editor ul {
                    list-style: disc;
                    padding-left: 2rem;
                    margin-bottom: 1.5rem;
                }

                .prose-editor ol {
                    list-style: decimal;
                    padding-left: 2rem;
                    margin-bottom: 1.5rem;
                }

                .prose-editor img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 12px;
                    margin: 2rem 0;
                    display: block;
                }

                .prose-editor a {
                    color: #0A66C2;
                    text-decoration: underline;
                    font-weight: 600;
                }

                @media (min-width: 768px) {
                    .prose-editor h1 {
                        font-size: 38px;
                    }
                    
                    .prose-editor h2 {
                        font-size: 28px;
                    }
                    
                    .prose-editor blockquote {
                        font-size: 26px;
                    }
                }
            `}</style>
        </div>
    );
}