import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Plus, Trash2, ArrowRight, Mail, CheckCircle, MessageCircle } from "lucide-react";
import { api } from "../lib/api";

const sectionStyles = "rounded-2xl border border-gray-200 bg-white p-5 shadow-sm";
const badgeStyles = "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]";

export default function EmailsAdmin() {
  const [location] = useLocation();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", type: "primary" });
  const primaryRef = useRef<HTMLDivElement | null>(null);
  const ccRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadEmails();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type");

    if (type === "cc") {
      ccRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      primaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location]);

  async function loadEmails() {
    setLoading(true);
    try {
      const rows = await api.getEmailRecipients();
      setEmails(rows);
    } catch (err) {
      setError("Failed to load email recipients.");
    } finally {
      setLoading(false);
    }
  }

  const primaryEmails = emails.filter((item: any) => item.type === "primary");
  const ccEmails = emails.filter((item: any) => item.type === "cc");

  function validateEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async function handleAddEmail() {
    setError("");

    if (!form.email.trim()) {
      setError("Enter a valid email address.");
      return;
    }
    if (!validateEmail(form.email.trim())) {
      setError("Please enter a proper email address.");
      return;
    }

    setSaving(true);
    try {
      await api.createEmailRecipient({ email: form.email.trim(), type: form.type });
      setForm({ email: "", type: "primary" });
      await loadEmails();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add email.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.deleteEmailRecipient(id);
      await loadEmails();
    } catch (err) {
      setError("Unable to remove email.");
    }
  }

  async function handleToggleType(id: number, currentType: string) {
    try {
      await api.updateEmailRecipient(id, {
        type: currentType === "primary" ? "cc" : "primary"
      });
      await loadEmails();
    } catch (err) {
      setError("Unable to update type.");
    }
  }

  return (
    <div className="w-full min-h-full bg-[#f2f5f5] px-6 py-6">
      <div className="max-w-[1280px] mx-auto">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.24em] text-[#004689]">
              <Mail size={16} />
              Email Settings
            </div>
            <h1 className="text-3xl font-bold mt-3 text-slate-900">Manage recipient delivery for form submissions</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Use this screen to keep form submission alerts organized. Primary addresses receive the main notification, and CC addresses receive copies.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm max-w-sm">
            <div className="mb-3 text-sm font-semibold text-slate-600">Add recipient</div>
            <label className="block text-xs font-bold text-slate-500 mb-2">Email</label>
            <input
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="admin@example.com"
              className="w-full rounded-xl border border-gray-200 bg-[#fbfcfd] px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
            />
            <label className="block text-xs font-bold text-slate-500 mt-4 mb-2">Delivery type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 bg-[#fbfcfd] px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
            >
              <option value="primary">Primary</option>
              <option value="cc">CC</option>
            </select>
            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
            <button
              onClick={handleAddEmail}
              disabled={saving}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#004689] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#00396b] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Plus size={16} />
              Add recipient
            </button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div ref={primaryRef} className={sectionStyles}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">P</span>
                  Primary Emails
                </div>
                <p className="text-sm text-slate-500 mt-2">Recipients shown here receive the main form notification.</p>
              </div>
              <span className={`${badgeStyles} bg-blue-100 text-blue-700`}>
                {primaryEmails.length} saved
              </span>
            </div>
            <div className="space-y-3">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />
                ))
              ) : primaryEmails.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-[#f8fafc] p-6 text-sm text-slate-500">
                  No primary emails configured yet.
                </div>
              ) : (
                primaryEmails.map((item: any) => (
                  <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 break-words">{item.email}</p>
                        <p className="mt-1 text-xs text-slate-500">Added on {new Date(item.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleType(item.id, item.type)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-600 transition hover:bg-slate-100"
                        >
                          Move to CC
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div ref={ccRef} className={sectionStyles}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">CC</span>
                  CC Emails
                </div>
                <p className="text-sm text-slate-500 mt-2">Recipients here receive a copy of every form notification.</p>
              </div>
              <span className={`${badgeStyles} bg-slate-100 text-slate-700`}>
                {ccEmails.length} saved
              </span>
            </div>
            <div className="space-y-3">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />
                ))
              ) : ccEmails.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-[#f8fafc] p-6 text-sm text-slate-500">
                  No CC emails configured yet.
                </div>
              ) : (
                ccEmails.map((item: any) => (
                  <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 break-words">{item.email}</p>
                        <p className="mt-1 text-xs text-slate-500">Added on {new Date(item.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleType(item.id, item.type)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-600 transition hover:bg-slate-100"
                        >
                          Move to Primary
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-[0.18em] text-slate-500 mb-4">
            <MessageCircle size={18} />
            System email routing notes
          </div>
          <div className="grid gap-4 sm:grid-cols-2 text-sm text-slate-600">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="font-semibold text-slate-800">Primary emails</p>
              <p className="mt-2 text-slate-500">Receive the main form submission alert for appointment and volunteer requests.</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="font-semibold text-slate-800">CC emails</p>
              <p className="mt-2 text-slate-500">Receive a copy of all submission notifications.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
