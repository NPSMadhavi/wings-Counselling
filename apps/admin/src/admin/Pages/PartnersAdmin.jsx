import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Upload,
  X,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";
import { api, resolveAssetUrl } from "../lib/api";
import { ConfirmDialog, AlertDialog } from "../components/ConfirmDialog";
import {
  AdminLanguageDropdown,
  useAdminLanguages,
} from "../components/AdminLanguageDropdown";

const EMPTY = {
  logo: "",
  duration: "",
  name: "",
  description: "",
  quote: "",
  websiteLink: "",
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

function PartnerFormModal({
  partner,
  onSave,
  onClose,
  languages,
  selectedLanguageId,
  selectedLanguage,
  selectedLangCode,
  openLangMenu,
  setOpenLangMenu,
  isSwitchingLanguage,
  setIsSwitchingLanguage,
  setSelectedLanguageId,
  onLocalized,
}) {
  const [form, setForm] = useState({ ...EMPTY, ...(partner || {}) });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(
    partner?.logo ? resolveImageUrl(partner.logo) : ""
  );
  const fileRef = useRef(null);
  const openedForIdRef = useRef(partner?.id ?? "new");

  // Only reset form when opening a different partner — not on every parent re-render
  useEffect(() => {
    const key = partner?.id ?? "new";
    if (openedForIdRef.current !== key) {
      openedForIdRef.current = key;
      setForm({ ...EMPTY, ...(partner || {}) });
      setPreviewUrl(partner?.logo ? resolveImageUrl(partner.logo) : "");
    }
  }, [partner]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  async function switchLanguage(nextLanguageId) {
    if (!nextLanguageId || nextLanguageId === selectedLanguageId) {
      setOpenLangMenu(null);
      return;
    }
    const next = languages.find((l) => l.id === nextLanguageId);
    if (!next) return;

    try {
      setIsSwitchingLanguage(true);
      setOpenLangMenu(null);

      if (form.id && selectedLanguageId) {
        try {
          const prev = languages.find((l) => l.id === selectedLanguageId);
          const prevCode = String(prev?.code || "").toLowerCase();
          const sample = `${form.name || ""} ${form.description || ""}`;
          const looksEnglish =
            /[A-Za-z]/.test(sample) &&
            !/[\u0900-\u097F\u0B80-\u0BFF\u4E00-\u9FFF]/.test(sample);
          // Don't overwrite English master with another language's form text
          if (!(prevCode === "en" && !looksEnglish)) {
            await api.savePartnerLanguage(form.id, selectedLanguageId, {
              name: form.name,
              description: form.description,
              duration: form.duration,
              quote: form.quote,
            });
          }
        } catch (persistErr) {
          console.warn("Could not persist partner language:", persistErr);
        }
      }

      // Update language without triggering full-page list reload while modal is open
      setSelectedLanguageId(nextLanguageId);

      if (form.id) {
        // Always re-translate so partial/wrong cached rows (e.g. Malay under Chinese) get fixed
        const result = await api.translatePartnerLanguage(
          form.id,
          String(next.code).toLowerCase(),
          true
        );
        const nextFields = {
          name: result?.name || form.name,
          description: result?.description ?? form.description,
          duration: result?.duration || form.duration,
          quote: result?.quote ?? form.quote,
        };
        setForm((prev) => ({ ...prev, ...nextFields }));
        onLocalized?.(nextFields);
      }
    } catch (err) {
      console.error(err);
      setSaveError(err?.message || "Failed to switch language");
    } finally {
      setIsSwitchingLanguage(false);
    }
  }

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
      set("logo", urls[0]);
    } catch (err) {
      setUploadError(err.message || "Logo upload failed. Please try again.");
      setPreviewUrl("");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (uploading || saving) return;

    if (!form.name?.trim()) {
      setSaveError("Partner name is required");
      return;
    }

    setSaveError(null);
    setSaving(true);

    try {
      await onSave({
        id: form.id,
        logo: form.logo,
        duration: form.duration,
        name: form.name.trim(),
        description: form.description,
        quote: form.quote,
        websiteLink: form.websiteLink,
        language_id: selectedLanguageId || undefined,
        language_code: selectedLangCode,
      });
    } catch (err) {
      setSaveError(err.message || "Saving partner failed. Please try again.");
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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          <div className="sticky top-0 bg-[#0D4A7A] px-6 py-5 flex justify-between items-center gap-3">
            <div className="min-w-0">
              <h3 className="text-2xl font-bold text-white">
                {partner?.id ? "Edit Partner" : "Add Partner"}
              </h3>
              <p className="text-blue-100 text-sm mt-1">
                Logo, duration, name, description, quote and website link
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <AdminLanguageDropdown
                light
                menuId="modal"
                languages={languages}
                selectedLanguageId={selectedLanguageId}
                selectedLanguage={selectedLanguage}
                openLangMenu={openLangMenu}
                setOpenLangMenu={setOpenLangMenu}
                isSwitchingLanguage={isSwitchingLanguage}
                onSelect={switchLanguage}
              />
              <button
                onClick={onClose}
                className="text-white hover:text-blue-200 transition-colors p-2 hover:bg-white/10 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <label className={labelClass}>Partner Logo</label>
              <div className="flex items-center gap-5">
                <div className="shrink-0">
                  <div className="w-28 h-28 rounded-xl overflow-hidden bg-white border-2 border-blue-200 flex items-center justify-center">
                    {previewUrl || form.logo ? (
                      <img
                        src={previewUrl || resolveImageUrl(form.logo)}
                        className="w-full h-full object-contain p-2"
                        alt="Logo preview"
                      />
                    ) : (
                      <ImageIcon size={32} className="text-gray-400" />
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex gap-3 flex-wrap">
                    <label className="cursor-pointer">
                      <div className="px-4 py-2 bg-[#0D4A7A] text-white rounded-lg text-sm font-medium inline-flex items-center gap-2">
                        <Upload size={16} />
                        {form.logo ? "Change Logo" : "Upload Logo"}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        ref={fileRef}
                      />
                    </label>
                    {form.logo && (
                      <button
                        type="button"
                        onClick={() => {
                          set("logo", "");
                          setPreviewUrl("");
                        }}
                        className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Upload a logo image (Max 5MB, JPG/PNG)
                  </p>
                  {uploading && (
                    <p className="text-xs text-blue-600 mt-1">Uploading...</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>
                Logo URL <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                className={inputClass}
                value={form.logo}
                onChange={(e) => {
                  set("logo", e.target.value);
                  setPreviewUrl(resolveImageUrl(e.target.value));
                }}
                placeholder="/api/uploads/... or https://..."
              />
            </div>

            <div>
              <label className={labelClass}>Duration</label>
              <input
                className={inputClass}
                value={form.duration}
                onChange={(e) => set("duration", e.target.value)}
                placeholder="Aug 2025 to Present"
              />
            </div>

            <div>
              <label className={labelClass}>
                Name <span className="text-red-500">*</span>
              </label>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Partner organization name"
              />
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea
                className={`${inputClass} min-h-[120px] resize-y`}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Short description about the partnership"
              />
            </div>

            <div>
              <label className={labelClass}>Quote</label>
              <textarea
                className={`${inputClass} min-h-[90px] resize-y`}
                value={form.quote}
                onChange={(e) => set("quote", e.target.value)}
                placeholder="Supporting Wellbeing. Strengthening Professional Identity"
              />
            </div>

            <div>
              <label className={labelClass}>Website Link</label>
              <input
                className={inputClass}
                value={form.websiteLink}
                onChange={(e) => set("websiteLink", e.target.value)}
                placeholder="https://example.org"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={uploading || saving}
              className="px-6 py-2.5 bg-[#0D4A7A] text-white rounded-lg font-semibold shadow-md disabled:opacity-50"
            >
              {uploading
                ? "Uploading..."
                : saving
                  ? "Saving..."
                  : partner?.id
                    ? "Update"
                    : "Save"}
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

function ViewPartnerModal({ partner, onClose }) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: "85vh" }}
        >
          <div className="bg-[#0D4A7A] px-6 py-5 flex justify-between items-start shrink-0">
            <div>
              <h3 className="text-xl font-bold text-white">Partner Details</h3>
              <p className="text-blue-200 text-sm mt-0.5">View complete partner information</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 p-1 hover:bg-white/10 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
            <div className="flex justify-center">
              {partner.logo ? (
                <img
                  src={resolveImageUrl(partner.logo)}
                  alt={partner.name}
                  className="max-h-40 object-contain"
                />
              ) : (
                <div className="w-32 h-32 rounded-xl bg-blue-50 flex items-center justify-center">
                  <ImageIcon size={40} className="text-blue-300" />
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Duration</p>
              <p className="text-base text-gray-800">{partner.duration || "—"}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Name</p>
              <p className="text-lg font-bold text-gray-900">{partner.name}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Description</p>
              <p className="text-base text-gray-800 whitespace-pre-wrap">
                {partner.description || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Quote</p>
              <p className="text-base text-[#0D4A7A] whitespace-pre-wrap">
                {partner.quote || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Website</p>
              {partner.websiteLink ? (
                <a
                  href={partner.websiteLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#0D4A7A] font-medium hover:underline"
                >
                  {partner.websiteLink}
                  <ExternalLink size={14} />
                </a>
              ) : (
                <p className="text-gray-500">—</p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default function PartnersAdmin() {
  const [partners, setPartners] = useState([]);
  const [editing, setEditing] = useState(null);
  const [viewPartner, setViewPartner] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();
  const langState = useAdminLanguages();
  const {
    languages,
    selectedLanguageId,
    setSelectedLanguageId,
    selectedLanguage,
    selectedLangCode,
    openLangMenu,
    setOpenLangMenu,
    isSwitchingLanguage,
    setIsSwitchingLanguage,
  } = langState;

  useEffect(() => {
    // While edit/add modal is open, do not reload the page (that unmounts the popup)
    if (editing) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLanguageId]);

  async function load({ silent = false } = {}) {
    if (!silent) setLoading(true);
    try {
      const data = await api.getPartners(selectedLangCode);
      setPartners(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setPartners([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }

function getPartnerId(partner) {
  return partner?.id ?? partner?.partner_id ?? partner?._id;
}

async function save(partner) {
  const partnerId = getPartnerId(partner);

  const payload = {
    logo: partner.logo,
    duration: partner.duration,
    name: partner.name,
    description: partner.description,
    quote: partner.quote,
    websiteLink: partner.websiteLink,
    language_id: partner.language_id || selectedLanguageId || undefined,
    language_code: partner.language_code || selectedLangCode,
  };

  let savedId = partnerId;
  if (partnerId) {
    await api.updatePartner(partnerId, payload);
  } else {
    const created = await api.createPartner(payload);
    savedId = created?.id || partnerId;
  }

  if (savedId && (payload.language_id || selectedLanguageId)) {
    try {
      await api.savePartnerLanguage(
        savedId,
        payload.language_id || selectedLanguageId,
        {
          name: payload.name,
          description: payload.description,
          duration: payload.duration,
          quote: payload.quote,
        }
      );
    } catch {
      /* base save already attempted */
    }
  }

  setEditing(null);
  setOpenLangMenu(null);
  await load();
}

async function openEdit(partner) {
  setOpenLangMenu(null);
  setEditing(partner);
  if (partner?.id && selectedLangCode && selectedLangCode !== "en") {
    try {
      setIsSwitchingLanguage(true);
      const result = await api.translatePartnerLanguage(
        partner.id,
        selectedLangCode,
        true
      );
      setEditing({
        ...partner,
        name: result?.name || partner.name,
        description: result?.description ?? partner.description,
        duration: result?.duration || partner.duration,
        quote: result?.quote ?? partner.quote,
      });
    } catch {
      /* keep list values */
    } finally {
      setIsSwitchingLanguage(false);
    }
  }
}

async function remove() {
  const partnerId = getPartnerId(deleteTarget);

  if (!partnerId) {
    setDeleteTarget(null);
    return;
  }

  const previousPartners = partners;

  setDeleteTarget(null);

  setPartners((prev) =>
    prev.filter((partner) => getPartnerId(partner) !== partnerId)
  );

  try {
    await api.deletePartner(partnerId);
  } catch (err) {
    console.error(err);
    setPartners(previousPartners);
  }
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/admin")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
                  Partners
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {!editing && (
                <AdminLanguageDropdown
                  menuId="header"
                  languages={languages}
                  selectedLanguageId={selectedLanguageId}
                  selectedLanguage={selectedLanguage}
                  openLangMenu={openLangMenu}
                  setOpenLangMenu={setOpenLangMenu}
                  isSwitchingLanguage={isSwitchingLanguage}
                  onSelect={(id) => {
                    setOpenLangMenu(null);
                    setSelectedLanguageId(id);
                  }}
                />
              )}
              <button
                onClick={() => {
                  setOpenLangMenu(null);
                  setEditing(EMPTY);
                }}
                className="px-6 py-3 bg-[#0D4A7A] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              >
                <Plus size={18} />
                Add Partner
              </button>
            </div>
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
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Logo</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Duration</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Website</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-blue-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {partners.length > 0 ? (
                    partners.map((partner, index) => (
                      <motion.tr
                        key={partner.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-blue-50 transition-all duration-200"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-blue-600">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4">
                          {partner.logo ? (
                            <img
                              src={resolveImageUrl(partner.logo)}
                              alt={partner.name}
                              className="w-16 h-16 object-contain rounded-lg border border-gray-200 bg-white p-1"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center">
                              <ImageIcon size={20} className="text-blue-400" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {partner.duration || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{partner.name}</div>
                          {partner.description && (
                            <p className="text-sm text-gray-500 line-clamp-2 mt-1 max-w-md">
                              {partner.description}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-[200px] truncate">
                          {partner.websiteLink || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setViewPartner(partner)}
                              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                              title="View"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => openEdit(partner)}
                              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                              title="Edit"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(partner)}
                              className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600"
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
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <ImageIcon size={48} className="text-gray-300" />
                          <p className="text-gray-500 text-lg">No partners found</p>
                          <p className="text-gray-400 text-sm">
                            Click &quot;Add Partner&quot; to create your first partner!
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
        <PartnerFormModal
          partner={editing}
          onSave={save}
          onClose={() => {
            setEditing(null);
            setOpenLangMenu(null);
            load({ silent: true });
          }}
          languages={languages}
          selectedLanguageId={selectedLanguageId}
          selectedLanguage={selectedLanguage}
          selectedLangCode={selectedLangCode}
          openLangMenu={openLangMenu}
          setOpenLangMenu={setOpenLangMenu}
          isSwitchingLanguage={isSwitchingLanguage}
          setIsSwitchingLanguage={setIsSwitchingLanguage}
          setSelectedLanguageId={setSelectedLanguageId}
          onLocalized={(fields) =>
            setEditing((prev) => (prev ? { ...prev, ...fields } : prev))
          }
        />
      )}

      {viewPartner && (
        <ViewPartnerModal
          partner={viewPartner}
          onClose={() => setViewPartner(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Partner"
        message="Are you sure you want to delete this partner? This action cannot be undone."
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}