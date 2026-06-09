import { useState, useEffect, useRef } from "react";
import { api, resolveAssetUrl } from "../lib/api";
import { Plus, Pencil, Trash2, Eye, EyeOff, Upload, X, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { ConfirmDialog, AlertDialog } from "../components/ConfirmDialog";
import { useLocation } from "wouter";
import { motion, AnimatePresence, Variants } from "framer-motion";
const ROLES = [
  "Senior director",
  "Supervision",
  "Family & Support counselling",
  "Couples counselling",
  "Individual therapy",
  "Youth counselling",
  "Children & Youth counselling",
  "Marital & Couple therapy",
  "Pre-School children (Ages 2.5–7)",
  "Adult counselling (Ages 21–65)",
  "Clinical supervision",
];

const EMPTY = {
  name: "",
  title: "",
  role: "counsellor",
  bio: "",
  experience: "",
  credentials: [],
  specialisations: [],
  photoUrl: "",
  email: "",
  displayOrder: 0,
  isVisible: true,
};

const easeInOut: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: easeInOut,
    },
  },
};

function resolveImageUrl(url) {
  return resolveAssetUrl(url);
}

function Modal({ member, onSave, onClose }) {
  const [form, setForm] = useState(member || EMPTY);
  const [credInput, setCredInput] = useState((member?.credentials || []).join("\n"));
  const [specInput, setSpecInput] = useState((member?.specialisations || []).join("\n"));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(member?.photoUrl ? resolveImageUrl(member.photoUrl) : "");
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
      set("photoUrl", urls[0]);
    } catch (err) {
      setUploadError(err.message || "Photo upload failed. Please try again.");
      setPreviewUrl("");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (uploading || saving) return;

    setSaveError(null);
    setSaving(true);

    try {
      await onSave({
        ...form,
        credentials: credInput.split("\n").map((s) => s.trim()).filter(Boolean),
        specialisations: specInput.split("\n").map((s) => s.trim()).filter(Boolean),
      });
    } catch (err) {
      setSaveError(err.message || "Saving team member failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 bg-white transition-all";
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
          {/* Header */}
          <div className="sticky top-0 bg-[#0D4A7A] px-6 py-5 flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-white">
                {member?.id ? " Edit Member" : " Add Member"}
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

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
            {/* Photo Upload Section */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Profile Photo</label>
              <div className="flex items-center gap-5">
                {/* Photo Preview */}
                <div className="shrink-0">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-blue-200 flex items-center justify-center">
                    {previewUrl || form.photoUrl ? (
                      <img
                        src={previewUrl || resolveImageUrl(form.photoUrl)}
                        className="w-full h-full object-cover"
                        alt="Preview"
                      />
                    ) : (
                      <ImageIcon size={32} className="text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Upload Controls */}
                <div className="flex-1">
                  <div className="flex gap-3">
                    <label className="cursor-pointer">
                      <div className="px-4 py-2 bg-[#0D4A7A] text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2">
                        <Upload size={16} />
                        {form.photoUrl ? "Change Photo" : "Upload Photo"}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        ref={fileRef}
                      />
                    </label>
                    {form.photoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          set("photoUrl", "");
                          setPreviewUrl("");
                        }}
                        className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Upload a profile photo (Max 5MB, JPG/PNG)</p>
                  {uploading && (
                    <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Image Path Field */}
            <div>
              <label className={labelClass}>Image Path / URL</label>
              <input
                className={inputClass}
                value={form.photoUrl}
                onChange={(e) => set("photoUrl", e.target.value)}
                placeholder="Enter image URL or upload above"
              />
              <p className="text-xs text-gray-400 mt-1">You can either upload an image or paste a URL directly</p>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Full Name <span className="text-red-500">*</span></label>
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className={labelClass}>Title <span className="text-red-500">*</span></label>
                <input
                  className={inputClass}
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g., Senior Counsellor"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Role</label>
                <select
                  className={inputClass}
                  value={form.role}
                  onChange={(e) => set("role", e.target.value)}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Display Order</label>
                <input
                  type="number"
                  className={inputClass}
                  value={form.displayOrder}
                  onChange={(e) => set("displayOrder", Number(e.target.value))}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <input
                className={inputClass}
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="email@example.com"
                type="email"
              />
            </div>

            {/* Bio */}
            <div>
              <label className={labelClass}>Bio</label>
              <textarea
                className={`${inputClass} resize-none`}
                rows={3}
                value={form.bio}
                onChange={(e) => set("bio", e.target.value)}
                placeholder="Professional biography..."
              />
            </div>

            {/* Experience Field */}
            <div>
              <label className={labelClass}>Experience</label>
              <input
                className={inputClass}
                value={form.experience}
                onChange={(e) => set("experience", e.target.value)}
                placeholder="e.g., 5+ Years Experience"
              />
              <p className="text-xs text-gray-400 mt-1">Example: "5+ Years Experience" or "10+ Years in Practice"</p>
            </div>
            
            {/* Credentials & Specialisations */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Credentials</label>
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={4}
                  value={credInput}
                  onChange={(e) => setCredInput(e.target.value)}
                  placeholder="MSc Psychology&#10;BACP Accredited&#10;PhD in Counselling"
                />
                <p className="text-xs text-gray-400 mt-1">One per line</p>
              </div>
              <div>
                <label className={labelClass}>Specialisations</label>
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={4}
                  value={specInput}
                  onChange={(e) => setSpecInput(e.target.value)}
                  placeholder="Anxiety&#10;Depression&#10;Trauma&#10;CBT"
                />
                <p className="text-xs text-gray-400 mt-1">One per line</p>
              </div>
            </div>

            {/* Visibility toggle */}
            <div className="flex items-center gap-3 bg-blue-50 px-4 py-3 rounded-lg border border-blue-200">
              <input
                type="checkbox"
                id="visibleCb"
                checked={form.isVisible}
                onChange={(e) => set("isVisible", e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="visibleCb" className="text-sm font-medium text-gray-700 cursor-pointer">
                 Visible on public website
              </label>
            </div>
          </div>

          {/* Footer with Blue Save Button */}
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
              {uploading ? "Uploading..." : saving ? "Saving..." : member?.id ? "Update" : "Save "}
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

// ─── Tag pill used in the table ───────────────────────────────────────────────
function TagList({ items }: { items: string[] }) {
  if (!items?.length) return <span className="text-gray-400 text-sm">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, i) => (
        <span
          key={i}
          className="inline-block  text-gray-700 text-xs font-medium px-2 py-1 rounded"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

// ─── View Detail Modal ────────────────────────────────────────────────────────
function ViewModal({ member, onClose }: { member: any; onClose: () => void }) {
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
          {/* Header */}
          <div className="bg-[#0D4A7A] px-6 py-5 flex justify-between items-start shrink-0">
            <div>
              <h3 className="text-xl font-bold text-white">Preview</h3>
              <p className="text-blue-200 text-sm mt-0.5">View complete member information</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors p-1 hover:bg-white/10 rounded-full mt-0.5"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable body */}
          {/* Large photo — fixed at top, outside scroll */}
          {member.photoUrl ? (
            <div className="w-full shrink-0 bg-gray-100 flex items-center justify-center" style={{ height: 260 }}>
              <img
                src={resolveImageUrl(member.photoUrl)}
                alt={member.name}
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="w-full shrink-0 flex items-center justify-center bg-blue-50" style={{ height: 200 }}>
              <span className="text-blue-300 text-6xl font-bold">{member.name?.charAt(0)}</span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto min-h-0 px-6 py-6 space-y-5">
            {/* Name */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Name</p>
              <p className="text-lg font-bold text-gray-900">{member.name}</p>
            </div>

            {/* Title */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Title</p>
              <p className="text-base text-gray-800">{member.title || "—"}</p>
            </div>

            {/* Role + Email side by side */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Role</p>
                <p className="text-sm text-gray-800">{member.role || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Email</p>
                <p className="text-sm text-gray-800">{member.email || "—"}</p>
              </div>
            </div>

            {/* Visibility + Display Order side by side */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Visibility</p>
                <span
                  className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${
                    member.isVisible
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {member.isVisible ? "Visible" : "Hidden"}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Display Order</p>
                <p className="text-sm text-gray-800">{member.displayOrder ?? "—"}</p>
              </div>
            </div>

            {/* Experience */}
            {member.experience && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Experience</p>
                <p className="text-sm text-gray-800">{member.experience}</p>
              </div>
            )}

            {/* Bio */}
            {member.bio && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Bio</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{member.bio}</p>
              </div>
            )}

            {/* Credentials */}
            {member.credentials?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Credentials</p>
                <div className="flex flex-wrap gap-2">
                  {member.credentials.map((c: string, i: number) => (
                    <span key={i} className="bg-blue-50 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full border border-blue-200">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Specialisations */}
            {member.specialisations?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Specialisations</p>
                <div className="flex flex-wrap gap-2">
                  {member.specialisations.map((s: string, i: number) => (
                    <span key={i} className="bg-green-50 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full border border-green-200">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
// ─── Main page ────────────────────────────────────────────────────────────────
export default function TeamAdmin() {
  const [members, setMembers] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [viewMember, setViewMember] = useState<any>(null);
  const [, navigate] = useLocation();

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getTeam();
      setMembers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function save(member) {
    if (member.id) {
      await api.updateTeam(member.id, member);
    } else {
      await api.createTeam(member);
    }
    setEditing(null);
    await load();
  }

  async function remove() {
    await api.deleteTeam(deleteTarget);
    setDeleteTarget(null);
    await load();
  }

  async function toggle(m) {
    await api.updateTeam(m.id, { ...m, isVisible: !m.isVisible });
    await load();
  }

  const handleBack = () => {
    navigate("/admin");
  };

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
          {/* HEADER WITH BACK BUTTON INTEGRATED */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-4 ">
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
                <h1 className="text-3xl md:text-4xl font-bold text-[#0D4A7A] mb-1">Team Management</h1>
                {/* <p className="text-gray-500 text-sm">Manage your team members and their information</p> */}
              </div>
            </div>
            <button
              onClick={() => setEditing(EMPTY)}
              className="px-6 py-3 bg-[#0D4A7A] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
            >

              Add Member
            </button>
          </div>
          
          {/* TABLE VIEW */}
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
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Photo</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Title</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Credentials</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Specialisations</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-blue-900">Order</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Visible</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-blue-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {members.length > 0 ? (
                    members.map((member, index) => (
                      <motion.tr
                        key={member.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => setSelectedId(selectedId === member.id ? null : member.id)}
                        className={`cursor-pointer transition-all duration-200 ${selectedId === member.id ? "bg-blue-100" : "hover:bg-blue-50"
                          }`}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-blue-600">{index + 1}</td>
                        <td className="px-6 py-4">
                          {member.photoUrl ? (
                            <img
                              src={resolveImageUrl(member.photoUrl)}
                              alt={member.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-blue-200"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center">
                              <span className="text-blue-600 text-sm font-bold">{member.name?.charAt(0)}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className=" text-gray-900">{member.name}</div>
                          {member.bio && (
                            <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">{member.bio}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">{member.title}</td>
                        <td className="px-6 py-4">
                          <span className="text-gray-700 text-xs font-medium">
                            {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm">{member.email || "—"}</td>
                        <td className="px-6 py-4"><TagList items={member.credentials} /></td>
                        <td className="px-6 py-4"><TagList items={member.specialisations} /></td>
                        <td className="px-6 py-4 text-right text-gray-500 text-sm">{member.displayOrder}</td>
                        <td className="px-6 py-4 text-left">
                          <span className={`text-sm font-medium ${member.isVisible ? "text-green-600" : "text-gray-400"}`}>
                            {member.isVisible ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); setViewMember(member); }}
                              className="p-2 rounded-lg text-gray-500 transition-all duration-200"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditing(member); }}
                              className="p-2 rounded-lg text-gray-500  transition-all duration-200"
                              title="Edit"
                            >
                              <Pencil size="16" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteTarget(member.id); }}
                              className="p-2 rounded-lg text-gray-500  transition-all duration-200"
                              title="Delete"
                            >
                              <Trash2 size="16" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="11" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <ImageIcon size={48} className="text-gray-300" />
                          <p className="text-gray-500 text-lg">No team members found</p>
                          <p className="text-gray-400 text-sm">Click "Add Member" to create your first team member!</p>
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

      {editing && <Modal member={editing} onSave={save} onClose={() => setEditing(null)} />}

      {viewMember && <ViewModal member={viewMember} onClose={() => setViewMember(null)} />}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Member"
        message="Are you sure you want to delete this team member? This action cannot be undone."
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}