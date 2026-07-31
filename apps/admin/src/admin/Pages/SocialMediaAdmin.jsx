import { useState, useEffect, useRef } from "react";
import { api, resolveAssetUrl } from "../lib/api";
import {
  Pencil,
  Trash2,
  Eye,
  Upload,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { ConfirmDialog, AlertDialog } from "../components/ConfirmDialog";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

const EMPTY = {
  name: "",
  icon: "",
  link: "",
  sortOrder: 0,
  isActive: true,
};

const easeInOut = [0.25, 0.1, 0.25, 1];

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeInOut },
  },
};

function resolveImageUrl(url) {
  return resolveAssetUrl(url);
}

function Modal({ item, onSave, onClose }) {
  const [form, setForm] = useState({ ...EMPTY, ...(item || {}) });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(
    item?.icon ? resolveImageUrl(item.icon) : ""
  );
  const fileRef = useRef(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size should be less than 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload an image file");
      return;
    }

    setUploadError(null);
    setUploading(true);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      const { urls } = await api.uploadFiles([file]);
      if (!urls?.length) throw new Error("No image URL returned from server");
      set("icon", urls[0]);
    } catch (err) {
      setUploadError(err.message || "Icon upload failed. Please try again.");
      setPreviewUrl("");
      set("icon", "");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (uploading || saving) return;

    if (!form.name?.trim()) {
      setSaveError("Name is required");
      return;
    }
    if (!form.link?.trim()) {
      setSaveError("Link URL is required");
      return;
    }
    if (!form.icon?.trim()) {
      setSaveError("Please upload an icon image");
      return;
    }

    setSaveError(null);
    setSaving(true);
    try {
      await onSave({
        id: form.id,
        name: form.name.trim(),
        icon: form.icon,
        link: form.link.trim(),
        sortOrder: Number(form.sortOrder) || 0,
        isActive: Boolean(form.isActive),
      });
    } catch (err) {
      setSaveError(err.message || "Saving social link failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 bg-white transition-all";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-2";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          <div className="sticky top-0 bg-[#0D4A7A] px-6 py-5 flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-white">
                {item?.id ? " Edit Social Link" : " Add Social Link"}
              </h3>
              <p className="text-blue-100 text-sm mt-1">Fill in the details below</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors p-2 hover:bg-white/10 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Icon Image
              </label>
              <div className="flex items-center gap-5">
                <div className="shrink-0">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-blue-200 flex items-center justify-center">
                    {previewUrl || form.icon ? (
                      <img
                        src={previewUrl || resolveImageUrl(form.icon)}
                        className="w-full h-full object-contain p-3"
                        alt="Preview"
                      />
                    ) : (
                      <ImageIcon size={32} className="text-gray-400" />
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex gap-3">
                    <label className="cursor-pointer">
                      <div className="px-4 py-2 bg-[#0D4A7A] text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2">
                        <Upload size={16} />
                        {form.icon ? "Change Icon" : "Upload Icon"}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        ref={fileRef}
                      />
                    </label>
                    {form.icon && (
                      <button
                        type="button"
                        onClick={() => {
                          set("icon", "");
                          setPreviewUrl("");
                        }}
                        className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Upload an icon image (Max 5MB, PNG/JPG/SVG)
                  </p>
                  {uploading && (
                    <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin inline-block" />
                      Uploading...
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>
                Icon Path / URL
              </label>
              <input
                className={inputClass}
                value={form.icon}
                onChange={(e) => set("icon", e.target.value)}
                placeholder="Enter image URL or upload above"
              />
              <p className="text-xs text-gray-400 mt-1">
                You can either upload an image or paste a URL directly
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g., Instagram"
                />
              </div>
              <div>
                <label className={labelClass}>
                  Sort Order
                </label>
                <input
                  type="number"
                  className={inputClass}
                  value={form.sortOrder}
                  onChange={(e) => set("sortOrder", e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>
                Link URL <span className="text-red-500">*</span>
              </label>
              <input
                className={inputClass}
                value={form.link}
                onChange={(e) => set("link", e.target.value)}
                placeholder="https://www.instagram.com/..."
              />
            </div>

            <div className="flex items-center gap-3 bg-blue-50 px-4 py-3 rounded-lg border border-blue-200">
              <input
                type="checkbox"
                id="socialVisibleCb"
                checked={Boolean(form.isActive)}
                onChange={(e) => set("isActive", e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="socialVisibleCb"
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                Visible on public website footer
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={uploading || saving}
              className="px-6 py-2.5 bg-[#0D4A7A] text-white rounded-lg font-semibold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Uploading..." : saving ? "Saving..." : item?.id ? "Update" : "Save "}
            </button>
          </div>
        </motion.div>
      </div>

      <AlertDialog
        open={!!uploadError}
        title="Upload Failed"
        message={uploadError || ""}
        onClose={() => setUploadError(null)}
      />
      <AlertDialog
        open={!!saveError}
        title="Save Failed"
        message={saveError || ""}
        onClose={() => setSaveError(null)}
      />
    </AnimatePresence>
  );
}

function ViewModal({ item, onClose }) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
          style={{ height: "85vh" }}
        >
          <div className="bg-[#0D4A7A] px-6 py-5 flex justify-between items-start shrink-0">
            <div>
              <h3 className="text-xl font-bold text-white">Preview</h3>
              <p className="text-blue-200 text-sm mt-0.5">
                View complete social link information
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors p-1 hover:bg-white/10 rounded-full mt-0.5"
            >
              <X size={20} />
            </button>
          </div>

          {item.icon ? (
            <div
              className="w-full shrink-0 bg-gray-100 flex items-center justify-center"
              style={{ height: 260 }}
            >
              <img
                src={resolveImageUrl(item.icon)}
                alt={item.name}
                className="h-40 w-40 object-contain"
              />
            </div>
          ) : (
            <div
              className="w-full shrink-0 flex items-center justify-center bg-blue-50"
              style={{ height: 200 }}
            >
              <span className="text-blue-300 text-6xl font-bold">
                {item.name?.charAt(0)}
              </span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto min-h-0 px-6 py-6 space-y-5">
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Name</p>
              <p className="text-lg font-bold text-gray-900">{item.name}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Link</p>
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className="text-base text-blue-700 break-all hover:underline"
              >
                {item.link || "—"}
              </a>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Sort Order</p>
              <p className="text-base text-gray-800">{item.sortOrder ?? 0}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Visibility</p>
              <span
                className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${
                  item.isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {item.isActive ? "Visible" : "Hidden"}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default function SocialMediaAdmin() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getSocialMediaLinks();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function save(item) {
    const payload = {
      name: item.name,
      icon: item.icon,
      link: item.link,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    };
    if (item.id) {
      await api.updateSocialMediaLink(item.id, payload);
    } else {
      await api.createSocialMediaLink(payload);
    }
    setEditing(null);
    await load();
  }

  async function remove() {
    if (!deleteTarget) return;
    await api.deleteSocialMediaLink(deleteTarget);
    setDeleteTarget(null);
    await load();
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen w-full bg-gray-50">
        <div className="w-full px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-4 ">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/admin")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                title="Go Back"
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
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
                <h1 className="text-3xl md:text-4xl font-bold text-[#0D4A7A] mb-1">
                  Social Media Links
                </h1>
              </div>
            </div>
            <button
              onClick={() => setEditing({ ...EMPTY })}
              className="px-6 py-3 bg-[#0D4A7A] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
            >
              Add Link
            </button>
          </div>

          <motion.div
            initial="hidden"
            animate="show"
            variants={containerVariants}
            className="bg-white rounded-xl shadow-lg overflow-hidden w-full"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#eef2ff] border-b-2 border-blue-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">#</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Icon</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Link</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Order</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Visible</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-blue-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.length > 0 ? (
                    items.map((item, index) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() =>
                          setSelectedId(selectedId === item.id ? null : item.id)
                        }
                        className={`cursor-pointer transition-all duration-200 ${
                          selectedId === item.id ? "bg-blue-100" : "hover:bg-blue-50"
                        }`}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-blue-600">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4">
                          {item.icon ? (
                            <img
                              src={resolveImageUrl(item.icon)}
                              alt={item.name}
                              className="w-12 h-12 rounded-full object-contain border-2 border-blue-200 bg-white p-1"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center">
                              <span className="text-blue-600 text-sm font-bold">
                                {item.name?.charAt(0)}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-900">{item.name}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm max-w-xs truncate">
                          {item.link}
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {item.sortOrder ?? 0}
                        </td>
                        <td className="px-6 py-4 text-left">
                          <span
                            className={`text-sm font-medium ${
                              item.isActive ? "text-green-600" : "text-gray-400"
                            }`}
                          >
                            {item.isActive ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewItem(item);
                              }}
                              className="p-2 rounded-lg text-gray-500 transition-all duration-200"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditing(item);
                              }}
                              className="p-2 rounded-lg text-gray-500 transition-all duration-200"
                              title="Edit"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(item.id);
                              }}
                              className="p-2 rounded-lg text-gray-500 transition-all duration-200"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <p className="text-gray-500 text-lg">No social links found</p>
                          <p className="text-gray-400 text-sm">
                            Click &quot;Add Link&quot; to create your first social media link!
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>

      {editing && (
        <Modal item={editing} onSave={save} onClose={() => setEditing(null)} />
      )}

      {viewItem && (
        <ViewModal item={viewItem} onClose={() => setViewItem(null)} />
      )}

      <ConfirmDialog
        open={deleteTarget != null}
        title="Delete Social Link"
        message="Are you sure you want to delete this social link? This action cannot be undone."
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
