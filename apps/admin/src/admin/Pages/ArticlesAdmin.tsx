import { useState, useEffect, useRef } from "react";
import { api } from "../lib/api";
import { motion } from "framer-motion";
import type { Article } from "../lib/types";
import { ConfirmDialog } from "../components/ConfirmDialog";
import ArticleEditor from "../Pages/ArticleEditor";
import { Eye, Pencil, Trash2, X, Upload, Image as ImageIcon } from "lucide-react";

interface ArticlesAdminProps {
  onNavigate?: (page: string) => void;
}

export default function ArticlesAdmin({
  onNavigate,
}: ArticlesAdminProps) {

  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // EDITOR STATE (only for Add New Article)
  const [showEditor, setShowEditor] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  const handleBack = () => {
    window.history.back();
  };

  // EDIT MODAL STATE (for Edit Article - Popup)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    author: "",
    category: "",
    coverImage: "",
    isPublished: false
  });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editContentRef = useRef<HTMLDivElement>(null);

  // VIEW MODAL STATE
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingArticle, setViewingArticle] = useState<Article | null>(null);

  // Category options
  const categoryOptions = [
    "Anxiety & Stress",
    "Burnout",
    "Relationship",
    "Grief & Loss",
    "Parenting"
  ];

  async function load() {
    setLoading(true);
    try {
      const data = await api.getArticles();
      setItems(data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteArticle(deleteTarget);
      setDeleteTarget(null);
      load();
    } catch (err) {
      console.log(err);
    } finally {
      setDeleting(false);
    }
  }

  const handleBackToDashboard = () => {
    if (onNavigate) {
      onNavigate("dashboard");
    } else {
      window.history.back();
    }
  };

  // Handle Add New Article - Opens LinkedIn-style Editor (Full Page)
  const handleAddNew = () => {
    setEditingArticle(null);
    setShowEditor(true);
  };

  // Handle Edit Article - Opens Popup Modal
  const handleEdit = (article: Article) => {
    setEditForm({
      title: article.title || "",
      slug: article.slug || "",
      excerpt: article.excerpt || "",
      content: article.content || "",
      author: article.author || "",
      category: article.category || "",
      coverImage: article.coverImage || "",
      isPublished: article.isPublished || false
    });
    setEditingArticle(article);
    setShowEditModal(true);
  };

  useEffect(() => {
    if (showEditModal && editContentRef.current) {
      editContentRef.current.innerHTML = editingArticle?.content || "";
    }
  }, [showEditModal, editingArticle?.id]);

  // Handle View Article - Opens Popup Modal
  const handleView = (article: Article) => {
    setViewingArticle(article);
    setShowViewModal(true);
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      // Create a local URL for preview
      const imageUrl = URL.createObjectURL(file);
      setEditForm({ ...editForm, coverImage: imageUrl });
      
      // If you have an API endpoint for uploading images to server, use it here
      // const uploadedUrl = await api.uploadImage(file);
      // setEditForm({ ...editForm, coverImage: uploadedUrl });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle image URL input
  const handleImageUrlChange = (url: string) => {
    setEditForm({ ...editForm, coverImage: url });
  };

  // Handle removing image
  const handleRemoveImage = () => {
    setEditForm({ ...editForm, coverImage: '' });
  };

  // Handle Edit Form Submit (Popup)
  const handleUpdateArticle = async () => {
    if (!editingArticle) return;
    
    setSaving(true);
    try {
      await api.updateArticle(editingArticle.id, editForm);
      setShowEditModal(false);
      setEditingArticle(null);
      load();
    } catch (err) {
      console.log(err);
    } finally {
      setSaving(false);
    }
  };

  // Handle Editor Close (LinkedIn-style)
  const handleEditorClose = () => {
    setShowEditor(false);
    setEditingArticle(null);
    load(); // Refresh the list
  };

  // SHOW LINKEDIN-STYLE EDITOR (only for Add New)
  if (showEditor) {
    return (
      <ArticleEditor
        initialData={null}
        onBack={handleEditorClose}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F2EF]">
        <div className="w-10 h-10 rounded-full border-[3px] border-blue-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F8F9FB]">

      {/* PAGE CONTAINER */}
      <div className="w-full px-6 py-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">
          <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                title="Go Back"
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
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-[#0D4A7A] mb-1">Article Management</h1>
              </div>
            </div>

          <button
            onClick={handleAddNew}
            className="h-[52px] px-7 rounded-xl bg-[#0D4A7A] hover:bg-[#004182] text-white font-semibold flex items-center gap-2 transition-all shadow-md"
          >
            Add Article
          </button>
        </div>

        {/* TABLE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#eef2ff]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">#</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Cover</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Title</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Author</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Published</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-blue-900">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {items.length > 0 ? (
                  items.map((article, index) => (
                    <motion.tr
                      key={article.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-[#F8FAFC] transition-all"
                    >
                      <td className="px-6 py-5 text-sm font-semibold text-[#0A66C2]">
                        {index + 1}
                      </td>

                      <td className="px-6 py-5">
                        {article.coverImage ? (
                          <img
                            src={article.coverImage}
                            alt={article.title}
                            className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                            No Img
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <div className="max-w-[320px]">
                          <h3 className="font-semibold text-gray-900 line-clamp-1">
                            {article.title}
                          </h3>
                          {article.slug && (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                              {article.slug}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-5 text-sm text-gray-600">
                        {article.author}
                      </td>

                      <td className="px-6 py-5">
                        <div className="text-sm text-gray-600">
                          {article.category}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${article.isPublished
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                          }`}>
                          {article.isPublished ? "Published" : "Draft"}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-sm text-gray-500">
                        {article.publishedAt ? (
                          new Date(article.publishedAt).toLocaleDateString("en-SG", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2">
                          {/* VIEW BUTTON */}
                          <button
                            onClick={() => handleView(article)}
                            className="w-10 h-10 transition-all flex items-center justify-center"
                            title="View Article"
                          >
                            <Eye size={18} />
                          </button>

                          {/* EDIT BUTTON - Opens Popup */}
                          <button
                            onClick={() => handleEdit(article)}
                            className="w-10 h-10 transition-all flex items-center justify-center"
                            title="Edit Article"
                          >
                            <Pencil size="16" />
                          </button>

                          {/* DELETE BUTTON */}
                          <button
                            onClick={() => setDeleteTarget(article.id)}
                            className="w-10 h-10 transition-all flex items-center justify-center"
                            title="Delete Article"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-20 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-5">
                          <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2"
                            />
                          </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800">No articles found</h3>
                        <p className="text-gray-400 mt-2">Click "Add New Article" to create your first article</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* EDIT MODAL POPUP (for Edit Article) */}
      {showEditModal && editingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-[#0D4A7A] px-6 py-5 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-white">Edit Article</h3>
                <p className="text-blue-100 text-sm mt-1">Update article information</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-white hover:text-blue-200 transition-colors p-2 hover:bg-white/10 rounded-full"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
              {/* Cover Image Upload Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cover Image</label>
                
                {/* Image Preview */}
                {editForm.coverImage && (
                  <div className="relative mb-4 inline-block">
                    <img 
                      src={editForm.coverImage} 
                      alt="Cover preview" 
                      className="w-40 h-40 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      title="Remove image"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                {/* Upload Options */}
                <div className="flex gap-3">
                  {/* Upload from Computer */}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="imageUpload"
                    />
                    <label
                      htmlFor="imageUpload"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      <Upload size={18} />
                      <span>Upload from Computer</span>
                    </label>
                  </div>

                  {/* Or divider */}
                  <span className="text-gray-400 self-center">or</span>

                  {/* Image URL Input */}
                  <div className="flex-1">
                    <input
                      type="text"
                      value={editForm.coverImage}
                      onChange={(e) => handleImageUrlChange(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter image URL"
                    />
                  </div>
                </div>

                {uploadingImage && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                    <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                    <span>Uploading image...</span>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter article title"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Slug</label>
                <input
                  type="text"
                  value={editForm.slug}
                  onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="url-friendly-name"
                />
              </div>

              {/* Author & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Author *</label>
                  <input
                    type="text"
                    value={editForm.author}
                    onChange={(e) => setEditForm({ ...editForm, author: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Author name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Select a category</option>
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Excerpt</label>
                <textarea
                  value={editForm.excerpt}
                  onChange={(e) => setEditForm({ ...editForm, excerpt: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Short summary of the article"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Content *</label>
                <div
                  ref={editContentRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={() =>
                    setEditForm((prev) => ({
                      ...prev,
                      content: editContentRef.current?.innerHTML || "",
                    }))
                  }
                  className="w-full min-h-[240px] px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-y-auto prose max-w-none"
                  style={{ whiteSpace: "pre-wrap" }}
                  data-placeholder="Article content (HTML supported)"
                />
              </div>

              {/* Published Status */}
              <div className="flex items-center gap-3 bg-blue-50 px-4 py-3 rounded-lg border border-blue-200">
                <input
                  type="checkbox"
                  id="publishedCheckbox"
                  checked={editForm.isPublished}
                  onChange={(e) => setEditForm({ ...editForm, isPublished: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="publishedCheckbox" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Publish this article
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateArticle}
                disabled={saving}
                className="px-5 py-2.5 bg-[#0D4A7A] text-white rounded-lg font-semibold transition-colors shadow-md disabled:opacity-50"
              >
                {saving ? "Saving..." : "Update"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* VIEW MODAL POPUP */}
      {showViewModal && viewingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-[#0D4A7A] px-6 py-5 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-white">Preview</h3>
                <p className="text-blue-100 text-sm mt-1">View complete article information</p>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-white hover:text-blue-200 transition-colors p-2 hover:bg-white/10 rounded-full"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {/* Cover Image */}
              {viewingArticle.coverImage && (
                <div className="mb-6">
                  <img
                    src={viewingArticle.coverImage}
                    alt={viewingArticle.title}
                    className="w-full h-64 object-cover rounded-xl"
                  />
                </div>
              )}

              {/* Title */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                <div className="text-xl font-bold text-gray-900">{viewingArticle.title}</div>
              </div>

              {/* Slug */}
              {viewingArticle.slug && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Slug</label>
                  <div className="text-gray-600">{viewingArticle.slug}</div>
                </div>
              )}

              {/* Author & Category Row */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Author</label>
                  <div className="text-gray-600">{viewingArticle.author}</div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <div className="text-gray-600">{viewingArticle.category}</div>
                </div>
              </div>

              {/* Status & Date Row */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${viewingArticle.isPublished
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                    }`}>
                    {viewingArticle.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Published Date</label>
                  <div className="text-gray-600">
                    {viewingArticle.publishedAt ? (
                      new Date(viewingArticle.publishedAt).toLocaleDateString("en-SG", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    ) : (
                      "Not published yet"
                    )}
                  </div>
                </div>
              </div>

              {/* Excerpt */}
              {viewingArticle.excerpt && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Excerpt</label>
                  <div className="text-gray-600">{viewingArticle.excerpt}</div>
                </div>
              )}

              {/* Content */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Content</label>
                <div 
                  className="text-gray-600 prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: viewingArticle.content || "" }}
                />
              </div>
            </div>

          </motion.div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      <ConfirmDialog
        open={deleteTarget !== null}
        loading={deleting}
        title="Delete Article"
        message="This article will be permanently deleted."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
