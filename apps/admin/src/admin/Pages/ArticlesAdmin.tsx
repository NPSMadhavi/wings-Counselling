import { useState, useEffect, useRef } from "react";
import { api } from "../lib/api";
import { Plus, Pencil, Trash2, X, Upload, ArrowLeft } from "lucide-react";
import type { Article } from "../lib/types";
import { ConfirmDialog, AlertDialog } from "../components/ConfirmDialog";
import { motion } from "framer-motion";

const CATS = ["General", "Mental Health", "Relationships", "Workplace", "Parenting", "Seniors", "Resources"];
const EMPTY: Partial<Article> = { title: "", slug: "", excerpt: "", content: "", coverImage: "", author: "WINGS Team", category: "General", isPublished: false };

function Modal({ article, onSave, onClose }: { article: Partial<Article> | null; onSave: (d: Partial<Article>) => void; onClose: () => void }) {
  const [form, setForm] = useState<Partial<Article>>(article ?? EMPTY);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof Article, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const { urls } = await api.uploadFiles([file]);
      set("coverImage", urls[0]);
    } catch {
      setUploadError("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  const inp = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#004689]/30 focus:border-[#004689] text-gray-800 bg-white placeholder-gray-300 transition-all";
  const lbl = "block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.50)", backdropFilter: "blur(4px)" }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden" style={{ maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 shrink-0" style={{ background: "linear-gradient(90deg,#004689,#0066cc)" }}>
          <div>
            <h2 className="font-bold text-lg text-white">{form.id ? "Edit Article" : "New Article"}</h2>
            <p className="text-blue-200 text-xs mt-0.5">{form.id ? "Update the details below" : "Fill in the details to publish a new article"}</p>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-5">

          {/* Cover image */}
          <div>
            <label className={lbl}>Cover Image</label>
            <div className="flex gap-3 items-center">
              <div
                onClick={() => !uploading && fileRef.current?.click()}
                className="w-24 h-16 rounded-xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-[#004689] transition-all shrink-0 relative group"
              >
                {form.coverImage
                  ? <img src={form.coverImage} className="w-full h-full object-cover" alt="cover" />
                  : <Upload size={16} className="text-gray-300 group-hover:text-[#004689] transition-colors" />
                }
                {uploading && (
                  <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-[#004689] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <input
                className={inp}
                value={form.coverImage ?? ""}
                onChange={e => set("coverImage", e.target.value)}
                placeholder="Or paste image URL"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className={lbl}>Title <span className="text-red-400 normal-case font-normal">*</span></label>
            <input
              className={inp}
              value={form.title}
              onChange={e => {
                set("title", e.target.value);
                if (!form.id) set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
              }}
              placeholder="Article title"
              autoComplete="off"
            />
          </div>

          {/* Slug */}
          <div>
            <label className={lbl}>Slug</label>
            <input
              className={inp}
              value={form.slug ?? ""}
              onChange={e => set("slug", e.target.value)}
              placeholder="auto-generated-from-title"
              autoComplete="off"
            />
          </div>

          {/* Author + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Author</label>
              <input className={inp} value={form.author} onChange={e => set("author", e.target.value)} autoComplete="off" />
            </div>
            <div>
              <label className={lbl}>Category</label>
              <select className={inp} value={form.category} onChange={e => set("category", e.target.value)}>
                {CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label className={lbl}>Excerpt <span className="normal-case text-gray-300 font-normal tracking-normal">(short summary)</span></label>
            <textarea rows={2} className={inp} value={form.excerpt} onChange={e => set("excerpt", e.target.value)} placeholder="Brief description of the article…" style={{ resize: "vertical" }} />
          </div>

          {/* Content */}
          <div>
            <label className={lbl}>Content <span className="normal-case text-gray-300 font-normal tracking-normal">(full article)</span></label>
            <textarea rows={8} className={inp} value={form.content} onChange={e => set("content", e.target.value)} placeholder="Write the full article here…" style={{ resize: "vertical" }} />
          </div>

          {/* Published toggle */}
          <div className="flex items-center gap-3 bg-blue-50 px-4 py-3 rounded-xl border border-blue-100">
            <input
              type="checkbox"
              id="publishedCb"
              checked={form.isPublished}
              onChange={e => set("isPublished", e.target.checked)}
              className="w-4 h-4 accent-[#004689] cursor-pointer"
            />
            <label htmlFor="publishedCb" className="text-sm font-semibold text-[#004689] cursor-pointer select-none">
              Published (visible on website)
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-8 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
          <p className="text-[11px] text-gray-400">* Required fields</p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 font-semibold text-sm rounded-full hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(form)}
              disabled={uploading}
              className="px-8 py-2.5 bg-[#004689] text-white font-semibold text-sm rounded-full hover:bg-[#003570] disabled:opacity-50 transition-colors flex items-center gap-2 min-w-[130px] justify-center"
            >
              {uploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading…
                </>
              ) : form.id ? "Update Article" : "Save Article"}
            </button>
          </div>
        </div>
      </div>

      <AlertDialog open={!!uploadError} title="Upload Failed" message={uploadError ?? ""} type="error" onClose={() => setUploadError(null)} />
    </div>
  );
}

interface ArticlesAdminProps {
  onNavigate?: (page: string) => void;
}

export default function ArticlesAdmin({ onNavigate }: ArticlesAdminProps) {
  const [items, setItems] = useState<Article[]>([]);
  const [editing, setEditing] = useState<Partial<Article> | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() { setLoading(true); setItems(await api.getArticles()); setLoading(false); }
  useEffect(() => { load(); }, []);

  async function save(d: Partial<Article>) {
    if (d.id) await api.updateArticle(d.id, d); else await api.createArticle(d);
    setEditing(null); load();
  }
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await api.deleteArticle(deleteTarget);
    setDeleteTarget(null); setDeleting(false); load();
  }

  const handleBackToDashboard = () => {
    if (onNavigate) {
      onNavigate('dashboard');
    } else {
      window.history.back();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="w-full px-6 py-8">
        {/* BACK BUTTON ON TOP LEFT */}
        <div className="mb-6">
          <button
            onClick={handleBackToDashboard}
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors group"
          >
            <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium"> Back</span>
          </button>
        </div>

        {/* HEADER WITH ADD BUTTON ON RIGHT SIDE */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Articles Management</h1>
          </div>
          <button
            onClick={() => setEditing(EMPTY)}
            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
            style={{ backgroundColor: '#2563eb' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-base">Add New Article</span>
          </button>
        </div>

        {/* TABLE VIEW - Same UI as Events page */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden w-full"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-50 border-b-2 border-blue-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">#</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Cover</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Title</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Author</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.length > 0 ? (
                  items.map((article, index) => (
                    <motion.tr
                      key={article.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-blue-50 transition-all duration-200"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-blue-600">{index + 1}</td>
                      <td className="px-6 py-4">
                        {article.coverImage ? (
                          <img
                            src={article.coverImage}
                            alt={article.title}
                            className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                            <span className="text-xs text-gray-400">No img</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 max-w-xs">
                          {article.title}
                        </div>
                        {article.slug && (
                          <div className="text-xs text-gray-400 font-mono mt-0.5">
                            {article.slug.slice(0, 30)}{article.slug.length > 30 ? "…" : ""}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {article.author}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {article.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${article.isPublished
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {article.isPublished ? '📢 Published' : '📝 Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {article.publishedAt ? (
                          <div>
                            <div className="text-gray-700 text-sm">
                              {new Date(article.publishedAt).toLocaleDateString("en-SG", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditing(article)}
                            className="px-3 py-1.5 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 rounded-lg text-sm font-medium transition-colors"
                            title="Edit Article"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => setDeleteTarget(article.id)}
                            className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                            title="Delete Article"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                        <p className="text-gray-500 text-lg">No articles found</p>
                        <p className="text-gray-400 text-sm">Click "+ Add New Article" to create your first article!</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {editing !== null && <Modal article={editing} onSave={save} onClose={() => setEditing(null)} />}

      <ConfirmDialog
        open={deleteTarget !== null}
        loading={deleting}
        title="Delete Article"
        message="This article will be permanently deleted and removed from the website. This action cannot be undone."
        confirmLabel="Delete Article"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}