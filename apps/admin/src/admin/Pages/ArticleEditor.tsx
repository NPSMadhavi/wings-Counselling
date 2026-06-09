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
    Upload,
    ArrowLeft,
    X,
    CheckCircle2,
    Loader2,
    Settings,
    Eye,
    Menu,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api, resolveAssetUrl, toStorageUrl } from "../lib/api";

interface ArticleEditorProps {
    onBack?: () => void;
    initialData?: any;
    article?: any;
    isSidebarOpen?: boolean;
}

export default function ArticleEditor({ onBack, initialData, article, isSidebarOpen = true }: ArticleEditorProps) {
    const editData = initialData ?? article;

    const [articleId, setArticleId] = useState<number | null>(editData?.id || null);
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
    const [showPreview, setShowPreview] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Publish Settings
    const [category, setCategory] = useState(editData?.category || "Psychology");
    const [author, setAuthor] = useState(editData?.author || "WINGS Team");
    const [excerpt, setExcerpt] = useState(editData?.excerpt || "");

    const editorRef = useRef<HTMLDivElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const inlineFileRef = useRef<HTMLInputElement>(null);
    const autoSaveTimerRef = useRef<NodeJS.Timeout>();

    // Load existing article data into the editor when editing
  // Load existing article data into the editor when editing
useEffect(() => {
    if (!editData?.id) return;

    setArticleId(editData.id);
    setTitle(editData.title || "");
    setContent(editData.content || "");
    setCoverImage(editData.coverImage ? resolveAssetUrl(editData.coverImage) : null);
    setIsPublished(Boolean(editData.isPublished));
    setSlug(editData.slug || "");
    setPublishedAt(editData.publishedAt || null);
    setCategory(editData.category || "Psychology");
    setAuthor(editData.author || "WINGS Team");
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
            setSaveStatus("saving");
            const response = await api.uploadFiles([file]);
            if (response.urls && response.urls[0]) {
                const uploadedUrl = resolveAssetUrl(response.urls[0]);
                setCoverImage(uploadedUrl);
                // Auto-save after cover upload
                if (articleId) {
                    await saveArticle(false, uploadedUrl);
                }
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

    // Trigger auto-save with debounce
    const triggerAutoSave = () => {
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }
        autoSaveTimerRef.current = setTimeout(() => {
            saveArticle(false);
        }, 3000); // Auto-save after 3 seconds of inactivity
    };

    const handleBack = async () => {
        if (articleId) {
            await saveArticle(false);
        }
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
                slug: slug || generateSlug(title.trim() || "Untitled Article"),
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
                    if (response.slug) setSlug(response.slug);
                }
            }

            if (response?.slug) setSlug(response.slug);
            if (response?.publishedAt) setPublishedAt(response.publishedAt);

            setSaveStatus("saved");
            setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

            if (publish) {
                setIsPublished(true);
                setShowPublishModal(false);

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

    // Publish Article
    const publishArticle = async () => {
        if (!title.trim()) {
            alert("Please add a title before publishing");
            return;
        }

        if (!coverImage) {
            alert("Please add a cover image before publishing");
            return;
        }

     if (excerpt.length > 500) {
    alert("Excerpt should be less than 500 characters");
    return;
}

        await saveArticle(true);
    };

    // Auto-save on dependency changes when editing
    useEffect(() => {
        if (articleId) {
            triggerAutoSave();
        }
    }, [title, category, author, excerpt, coverImage]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, []);

    // Calculate header position based on sidebar state
    const headerStyle = {
        left: isSidebarOpen ? '280px' : '0',
        transition: 'left 0.3s ease-in-out',
    };

    return (
        <div className="min-h-screen bg-[#F3F2EF] font-sans text-[#111]">

            {/* TOP BAR - Appears after sidebar */}
            <div
                className="fixed top-0 right-0 h-[72px] bg-white border-b border-[#E0DFDC] px-8 flex items-center justify-between z-[100]"
                style={headerStyle}
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
                            onClick={() => setShowStyles(!showStyles)}
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
                        onClick={() => setShowPublishModal(true)}
                        className={`h-[40px] px-8 rounded-full font-bold transition-all shadow-md ${isPublished
                            ? "bg-green-600 text-white "
                            : "bg-[#0D4A7A] text-white "
                            }`}
                    >
                        {isPublished ? "Published" : "Next"}
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
                                onClick={() => setShowPublishModal(true)}
                                className={`px-4 py-2 rounded-full font-bold text-sm ${isPublished
                                    ? "bg-green-600 text-white"
                                    : "bg-[#0A66C2] text-white"
                                    }`}
                            >
                                {isPublished ? "Published" : "Next"}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MAIN EDITOR CONTENT */}
            <div
                className="pt-[100px] pb-20 max-w-[1128px] mx-auto px-4 md:px-0"
                style={{ marginLeft: isSidebarOpen ? '280px' : '0', transition: 'margin-left 0.3s ease-in-out' }}
            >
                {/* COVER IMAGE SECTION */}
                <div className="relative w-full h-[300px] md:h-[450px] bg-white border border-[#E0DFDC] rounded-t-xl overflow-hidden group">
                    {coverImage ? (
                        <>
                            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    onClick={() => fileRef.current?.click()}
                                    className="px-4 py-2 md:px-6 md:py-3 bg-white rounded-full font-bold shadow-xl transition-all flex items-center gap-2 text-sm md:text-base hover:bg-[#F3F2EF]"
                                >
                                    <Upload size={18} /> Change Cover
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#F8F9FA] p-4">
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-[#F3F2EF] rounded-xl flex items-center justify-center mb-4">
                                <ImageIcon size={24} className="text-[#666] md:size-8" />
                            </div>
                            <h2 className="text-xl md:text-2xl font-medium text-[#666] mb-4 md:mb-6 text-center">Add a cover image</h2>
                            <button
                                onClick={() => fileRef.current?.click()}
                                className="px-6 md:px-8 py-2 md:py-3 border-2 border-[#666] text-[#666] rounded-full font-bold transition-all flex items-center gap-2 text-sm md:text-base hover:bg-[#F3F2EF]"
                            >
                                <Upload size={18} /> Upload from computer
                            </button>
                            <p className="mt-3 md:mt-4 text-xs md:text-sm text-gray-400 text-center">Recommended: 1280 x 720 pixels</p>
                        </div>
                    )}
                    <input ref={fileRef} type="file" className="hidden" accept="image/*" onChange={handleCoverUpload} />
                </div>

                {/* WRITING AREA */}
                <div className="bg-white border-x border-b border-[#E0DFDC] rounded-b-xl px-4 md:px-[64px] py-6 md:py-[48px] shadow-sm">
                    {/* TITLE */}
                    <textarea
                        value={title}
                        onChange={(e) => {
                            setTitle(e.target.value);
                            e.target.style.height = "auto";
                            e.target.style.height = e.target.scrollHeight + "px";
                        }}
                        onBlur={() => triggerAutoSave()}
                        placeholder="Headline"
                        className="w-full bg-transparent border-none outline-none text-3xl md:text-[52px] leading-[1.1] font-bold text-[#111] placeholder:text-gray-300 resize-none mb-6 md:mb-8"
                        rows={1}
                    />

                    {/* RICH TEXT EDITOR */}
                    <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={handleContentChange}
                        onBlur={() => triggerAutoSave()}
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
                        data-placeholder="Write your article here..."
                    />
                </div>
            </div>

            {/* INLINE IMAGE INPUT */}
            <input ref={inlineFileRef} type="file" className="hidden" accept="image/*" onChange={handleInlineImageUpload} />

            {/* PUBLISH MODAL */}
            <AnimatePresence>
                {showPublishModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowPublishModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-[600px] bg-white rounded-3xl overflow-hidden shadow-2xl"
                        >
                            <div className="sticky top-0 bg-[#0D4A7A] px-6 py-5 flex justify-between items-center">
                                <h3 className="text-2xl font-bold text-white">{isPublished ? "Update Article Settings" : "Publish Article"}</h3>
                                <button onClick={() => setShowPublishModal(false)} className="p-2 text-white  rounded-full transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 md:p-8 space-y-6">
                                {!isPublished && (
                                    <div className="bg-blue-50 p-4 rounded-xl">
                                        <p className="text-sm text-blue-800">
                                            Your article has been auto-saved as a draft. Review the settings below before publishing.
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Category *</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full h-[52px] px-4 rounded-xl border border-gray-200 focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2] outline-none transition-all"
                                    >
                                        <option>Anxiety & Stress</option>
                                        <option>Burnout</option>
                                        <option>Relationship</option>
                                        <option>Grief & Loss</option>
                                        <option>Parenting</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Author Name *</label>
                                    <input
                                        type="text"
                                        value={author}
                                        onChange={(e) => setAuthor(e.target.value)}
                                        className="w-full h-[52px] px-4 rounded-xl border border-gray-200 focus:border-[#0A66C2] outline-none transition-all"
                                    />
                                </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Excerpt / Summary 
                                    <span className="text-gray-400 font-medium">(Optional)</span>
                                </label>

                                <textarea
                                    value={excerpt}
                                    onChange={(e) => setExcerpt(e.target.value)}
                                    className="w-full p-4 rounded-xl border border-gray-200 focus:border-[#0A66C2] outline-none transition-all h-[120px] resize-none"
                                    placeholder="Enter a brief summary of your article..."
                                />

                                <p className="text-xs text-gray-500 mt-1">
                                    {excerpt.length}/500 characters
                                </p>
                                </div>
                            </div>

                            <div className="px-6 md:px-8 py-4 md:py-6 bg-gray-50 flex flex-col md:flex-row items-center justify-end gap-3">
                            
                                <button
                                    onClick={() => (isPublished ? saveArticle(false).then(() => setShowPublishModal(false)) : publishArticle())}
                                    disabled={isPublishing}
                                    className="w-full md:w-auto h-[48px] px-10 rounded-full bg-[#0D4A7A] text-white font-bold  transition-all flex items-center justify-center gap-2 shadow-lg"
                                >
                                    {isPublishing ? (
                                        <Loader2 size={20} className="animate-spin" />
                                    ) : isPublished ? (
                                        "Save Changes"
                                    ) : (
                                        "Save"
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
                                dangerouslySetInnerHTML={{ __html: content || "<p class='text-gray-400'>Start writing to see your content here...</p>" }}
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