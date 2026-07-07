import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Plus, Pencil, Trash2, Eye, X, MessageSquareQuote } from "lucide-react";
import { api } from "../lib/api";
import { ConfirmDialog, AlertDialog } from "../components/ConfirmDialog";

const EMPTY = {
  serviceName: "",
  description: "",
  clientName: "",
  clientCompanyName: "",
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

function TestimonialFormModal({ testimonial, onSave, onClose }) {
  const [form, setForm] = useState(testimonial || EMPTY);
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  async function save() {
    if (saving) return;

    if (!form.serviceName?.trim()) {
      setSaveError("Service name is required");
      return;
    }

    if (!form.clientName?.trim()) {
      setSaveError("Client name is required");
      return;
    }

    setSaveError(null);
    setSaving(true);

    try {
      await onSave({
        id: form.id,
        serviceName: form.serviceName.trim(),
        description: form.description,
        clientName: form.clientName.trim(),
        clientCompanyName: form.clientCompanyName,
      });
    } catch (err) {
      setSaveError(err.message || "Saving testimonial failed. Please try again.");
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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          <div className="sticky top-0 bg-[#0D4A7A] px-6 py-5 flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-white">
                {testimonial?.id ? "Edit Testimonial" : "Add Testimonial"}
              </h3>
              <p className="text-blue-100 text-sm mt-1">
                Service name, description, client name and company
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors p-2 hover:bg-white/10 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
            <div>
              <label className={labelClass}>
                Service Name <span className="text-red-500">*</span>
              </label>
              <input
                className={inputClass}
                value={form.serviceName}
                onChange={(e) => set("serviceName", e.target.value)}
                placeholder="e.g. Anxiety, Family, Relationship"
              />
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea
                className={`${inputClass} min-h-[140px] resize-y`}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Client testimonial text"
              />
            </div>

            <div>
              <label className={labelClass}>
                Client Name <span className="text-red-500">*</span>
              </label>
              <input
                className={inputClass}
                value={form.clientName}
                onChange={(e) => set("clientName", e.target.value)}
                placeholder="e.g. Anonymous Client"
              />
            </div>

            <div>
              <label className={labelClass}>Client Company Name</label>
              <input
                className={inputClass}
                value={form.clientCompanyName}
                onChange={(e) => set("clientCompanyName", e.target.value)}
                placeholder="e.g. Client of company"
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
              disabled={saving}
              className="px-6 py-2.5 bg-[#0D4A7A] text-white rounded-lg font-semibold shadow-md disabled:opacity-50"
            >
              {saving ? "Saving..." : testimonial?.id ? "Update" : "Save"}
            </button>
          </div>
        </motion.div>
      </div>

      <AlertDialog
        open={!!saveError}
        title="Save Failed"
        message={saveError || ""}
        onClose={() => setSaveError(null)}
      />
    </AnimatePresence>
  );
}

function ViewTestimonialModal({ testimonial, onClose }) {
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
              <h3 className="text-xl font-bold text-white">Testimonial Details</h3>
              <p className="text-blue-200 text-sm mt-0.5">View complete testimonial information</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 p-1 hover:bg-white/10 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Service Name</p>
              <p className="text-lg font-bold text-gray-900">{testimonial.serviceName}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Description</p>
              <p className="text-base text-gray-800 whitespace-pre-wrap">
                {testimonial.description || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Client Name</p>
              <p className="text-base text-gray-800">{testimonial.clientName}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Client Company Name</p>
              <p className="text-base text-gray-800">
                {testimonial.clientCompanyName || "—"}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default function TestimonialsAdmin() {
  const [testimonials, setTestimonials] = useState([]);
  const [editing, setEditing] = useState(null);
  const [viewTestimonial, setViewTestimonial] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getTestimonials();
      setTestimonials(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  }

  async function save(testimonial) {
    if (testimonial.id) {
      await api.updateTestimonial(testimonial.id, testimonial);
    } else {
      await api.createTestimonial(testimonial);
    }
    setEditing(null);
    await load();
  }

  async function remove() {
    await api.deleteTestimonial(deleteTarget);
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
                  Testimonials
                </h1>
              </div>
            </div>
            <button
              onClick={() => setEditing(EMPTY)}
              className="px-6 py-3 bg-[#0D4A7A] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
            >
              <Plus size={18} />
              Add Testimonial
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
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Service</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Client</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Company</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-blue-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {testimonials.length > 0 ? (
                    testimonials.map((item, index) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-blue-50 transition-all duration-200"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-blue-600">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{item.serviceName}</div>
                          {item.description && (
                            <p className="text-sm text-gray-500 line-clamp-2 mt-1 max-w-md">
                              {item.description}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{item.clientName}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {item.clientCompanyName || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setViewTestimonial(item)}
                              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                              title="View"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => setEditing(item)}
                              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                              title="Edit"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(item.id)}
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
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <MessageSquareQuote size={48} className="text-gray-300" />
                          <p className="text-gray-500 text-lg">No testimonials found</p>
                          <p className="text-gray-400 text-sm">
                            Click &quot;Add Testimonial&quot; to create your first testimonial!
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
        <TestimonialFormModal
          testimonial={editing}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}

      {viewTestimonial && (
        <ViewTestimonialModal
          testimonial={viewTestimonial}
          onClose={() => setViewTestimonial(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Testimonial"
        message="Are you sure you want to delete this testimonial? This action cannot be undone."
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
