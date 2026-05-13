import React, { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import {
  Plus, Pencil, Trash2, X, Briefcase, Users, ClipboardList,
  ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Download, Calendar, Clock, User, Mail, Phone,
  ExternalLink, CheckCircle, XCircle, AlertCircle, FileText,
  Search, Filter, CalendarRange, Link2, MapPin, Info, MessageSquare, Eye
} from "lucide-react";
import { ConfirmDialog, AlertDialog } from "../components/ConfirmDialog";
import type { Career, JobApplication, InterviewSlot, InterviewAvailability } from "../lib/types";

/* ───── Constants ─────────────────────────────────────────────────────── */
const TYPES = ["Full-Time", "Part-Time", "Contract", "Volunteer"];
const DEPTS = ["Clinical", "Administration", "Outreach", "Training", "Other"];
const EMPTY_JOB: Partial<Career> = {
  title: "", department: "Clinical", location: "Singapore",
  description: "", requirements: "", employmentType: "Full-Time",
  salaryRange: "", isActive: true,
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  submitted: { label: "Submitted", color: "#60a5fa", bg: "rgba(96,165,250,0.12)", icon: <AlertCircle size={11} /> },
  under_review: { label: "Under Review", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: <Clock size={11} /> },
  shortlisted: { label: "Shortlisted", color: "#10b981", bg: "rgba(16,185,129,0.12)", icon: <CheckCircle size={11} /> },
  not_shortlisted: { label: "Not Shortlisted", color: "#ef4444", bg: "rgba(239,68,68,0.12)", icon: <XCircle size={11} /> },
  interview_scheduled: { label: "Interview Sched.", color: "#a78bfa", bg: "rgba(167,139,250,0.12)", icon: <Calendar size={11} /> },
  hired: { label: "Hired", color: "#34d399", bg: "rgba(52,211,153,0.12)", icon: <CheckCircle size={11} /> },
  withdrawn: { label: "Withdrawn", color: "#94a3b8", bg: "rgba(148,163,184,0.12)", icon: <XCircle size={11} /> },
};

const P = {
  bg: "#f8fafc",
  card: "#ffffff",
  surface: "#f1f5f9",
  border: "#e2e8f0",
  primary: "#004689",
  accent: "#004689",
  text: "#0f172a",
  muted: "#64748b",
  inp: "#ffffff",
};

/* ───── Shared Styles ──────────────────────────────────────────────────── */
const inp = `w-full rounded-xl px-3 py-2.5 text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all`;
const inpStyle = { background: P.inp, border: `1px solid ${P.border}` };
const lbl = "text-xs font-bold uppercase tracking-wider mb-1.5 block";
const lblStyle = { color: P.muted };

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.submitted;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: m.bg, color: m.color }}>
      {m.icon}{m.label}
    </span>
  );
}

/* ───── Job Modal ──────────────────────────────────────────────────────── */
function JobModal({ career, onSave, onClose }: { career: Partial<Career> | null; onSave: (d: Partial<Career>) => Promise<void>; onClose: () => void }) {
  const [form, setForm] = useState<Partial<Career>>(career ?? EMPTY_JOB);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof Career, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: P.card, border: `1px solid ${P.border}` }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${P.border}` }}>
          <div className="flex items-center gap-3">
            <Briefcase size={18} style={{ color: P.accent }} />
            <h2 className="font-extrabold text-lg" style={{ color: P.text }}>{form.id ? "Edit Job Listing" : "New Job Listing"}</h2>
          </div>
          <button onClick={onClose} style={{ color: P.muted }}><X size={20} /></button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className={lbl} style={lblStyle}>Job Title *</label>
            <input className={inp} style={inpStyle} value={form.title ?? ""} onChange={e => set("title", e.target.value)} placeholder="e.g. Counsellor (Part-Time)" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl} style={lblStyle}>Department</label>
              <select className={inp} style={inpStyle} value={form.department ?? "Clinical"} onChange={e => set("department", e.target.value)}>
                {DEPTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl} style={lblStyle}>Employment Type</label>
              <select className={inp} style={inpStyle} value={form.employmentType ?? "Full-Time"} onChange={e => set("employmentType", e.target.value)}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl} style={lblStyle}>Location</label>
              <input className={inp} style={inpStyle} value={form.location ?? ""} onChange={e => set("location", e.target.value)} placeholder="e.g. Singapore" />
            </div>
            <div>
              <label className={lbl} style={lblStyle}>Salary Range</label>
              <input className={inp} style={inpStyle} value={form.salaryRange ?? ""} onChange={e => set("salaryRange", e.target.value)} placeholder="e.g. SGD 4,000 – SGD 6,000" />
            </div>
          </div>
          <div>
            <label className={lbl} style={lblStyle}>Closing Date</label>
            <input type="date" className={inp} style={inpStyle}
              value={form.closesAt ? new Date(form.closesAt as string | Date).toISOString().slice(0, 10) : ""}
              onChange={e => set("closesAt", e.target.value || undefined)} />
          </div>
          <div>
            <label className={lbl} style={lblStyle}>Job Description</label>
            <textarea rows={5} className={inp} style={inpStyle} value={form.description ?? ""} onChange={e => set("description", e.target.value)} placeholder="Describe the role and responsibilities…" />
          </div>
          <div>
            <label className={lbl} style={lblStyle}>Requirements</label>
            <textarea rows={4} className={inp} style={inpStyle} value={form.requirements ?? ""} onChange={e => set("requirements", e.target.value)} placeholder="List qualifications, skills and experience required…" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isActive ?? true} onChange={e => set("isActive", e.target.checked)} className="w-4 h-4 accent-blue-500" />
            <span className="text-sm font-semibold" style={{ color: P.text }}>Active — visible on public Careers page</span>
          </label>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop: `1px solid ${P.border}` }}>
          <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ color: P.muted, border: `1px solid ${P.border}` }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: P.primary }}>{saving ? "Saving…" : "Save Listing"}</button>
        </div>
      </div>
    </div>
  );
}

/* ───── Application Detail Modal ──────────────────────────────────────── */
function AppDetailModal({ app, onClose, onStatusUpdate, onScheduleInterview }: {
  app: JobApplication; onClose: () => void;
  onStatusUpdate: (id: number, status: string, notes: string) => Promise<void>;
  onScheduleInterview: (appId: number) => void;
}) {
  const [status, setStatus] = useState(app.status);
  const [notes, setNotes] = useState(app.adminNotes ?? "");
  const [saving, setSaving] = useState(false);

  async function saveStatus() {
    setSaving(true);
    await onStatusUpdate(app.id, status, notes);
    setSaving(false);
  }

  const infoRow = (label: string, value: string) => value ? (
    <div className="flex gap-2" style={{ borderBottom: `1px solid ${P.border}`, paddingBottom: "8px", marginBottom: "8px" }}>
      <span className="text-xs font-bold shrink-0 w-36" style={{ color: P.muted }}>{label}</span>
      <span className="text-xs font-semibold" style={{ color: P.text }}>{value}</span>
    </div>
  ) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)" }}>
      <div className="rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
        style={{ background: P.card, border: `1px solid ${P.border}` }}>
        <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10" style={{ background: P.card, borderBottom: `1px solid ${P.border}` }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(59,130,246,0.15)", color: P.accent }}>
                {app.applicationNumber}
              </span>
              <StatusBadge status={app.status} />
            </div>
            <h2 className="font-extrabold text-base" style={{ color: P.text }}>{app.candidateName}</h2>
            <p className="text-xs" style={{ color: P.muted }}>{app.jobTitle} · {app.jobRef}</p>
          </div>
          <button onClick={onClose} style={{ color: P.muted }}><X size={20} /></button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider mb-3" style={{ color: P.accent }}>Candidate Details</h3>
            {infoRow("Full Name", app.candidateName ?? "")}
            {infoRow("Email", app.candidateEmail ?? "")}
            {infoRow("Phone", app.candidatePhone ?? "")}
          </div>

          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider mb-3" style={{ color: P.accent }}>Application Details</h3>
            {infoRow("Current Employer", app.currentEmployer)}
            {infoRow("Years Experience", app.yearsExperience)}
            {infoRow("Highest Qualification", app.highestQualification)}
            {infoRow("Notice Period", app.noticePeriod)}
            {infoRow("Expected Salary", app.expectedSalary)}
            {app.specialisations?.length > 0 && infoRow("Specialisations", app.specialisations.join(", "))}
            {app.linkedinUrl && infoRow("LinkedIn", app.linkedinUrl)}
          </div>

          {app.coverLetter && (
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider mb-2" style={{ color: P.accent }}>Cover Letter</h3>
              <p className="text-sm leading-relaxed rounded-xl p-4" style={{ background: P.surface, color: P.text, border: `1px solid ${P.border}` }}>
                {app.coverLetter}
              </p>
            </div>
          )}

          {app.resumeUrl && (
            <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl font-semibold text-sm transition-all"
              style={{ background: "rgba(59,130,246,0.1)", border: `1px solid rgba(59,130,246,0.3)`, color: P.accent }}>
              <Download size={16} /> Download Resume / CV
              <ExternalLink size={13} className="ml-auto" />
            </a>
          )}

          <div className="rounded-xl p-4" style={{ background: P.surface, border: `1px solid ${P.border}` }}>
            <h3 className="text-xs font-extrabold uppercase tracking-wider mb-3" style={{ color: P.accent }}>Update Status</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {["submitted", "under_review", "shortlisted", "not_shortlisted", "interview_scheduled", "hired", "withdrawn"].map(s => (
                <button key={s} onClick={() => setStatus(s as any)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: status === s ? (STATUS_META[s]?.bg ?? "rgba(59,130,246,0.12)") : "transparent",
                    color: status === s ? (STATUS_META[s]?.color ?? P.accent) : P.muted,
                    border: `1px solid ${status === s ? (STATUS_META[s]?.color ?? P.accent) : P.border}`,
                  }}>
                  {STATUS_META[s]?.icon}{STATUS_META[s]?.label ?? s}
                </button>
              ))}
            </div>
            <div className="mb-3">
              <label className={lbl} style={lblStyle}>Admin Note (sent in status email)</label>
              <textarea rows={2} className={inp} style={inpStyle} value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Optional note to include in the email…" />
            </div>
            <div className="flex gap-2">
              <button onClick={saveStatus} disabled={saving}
                className="flex-1 py-2 rounded-xl text-sm font-bold text-white transition-all"
                style={{ background: saving ? "rgba(59,130,246,0.4)" : P.primary }}>
                {saving ? "Saving…" : "Save Status & Send Email"}
              </button>
              {(status === "shortlisted" || status === "interview_scheduled") && (
                <button onClick={() => onScheduleInterview(app.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                  style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.3)" }}>
                  <Calendar size={14} /> Schedule Interview
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───── Interview Scheduling Modal ─────────────────────────────────────── */
function InterviewModal({ appId, onSave, onClose }: {
  appId: number; onSave: (appId: number, data: Partial<InterviewSlot>) => Promise<void>; onClose: () => void;
}) {
  const [form, setForm] = useState({ date: "", timeSlot: "09:00", duration: 60, interviewerName: "", location: "", meetingLink: "" });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const times = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"];

  async function submit() {
    if (!form.date || !form.timeSlot || !form.interviewerName) return;
    setSaving(true);
    await onSave(appId, form);
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)" }}>
      <div className="rounded-2xl shadow-2xl w-full max-w-lg" style={{ background: P.card, border: `1px solid ${P.border}` }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${P.border}` }}>
          <div className="flex items-center gap-2">
            <Calendar size={18} style={{ color: "#a78bfa" }} />
            <h2 className="font-extrabold text-base" style={{ color: P.text }}>Schedule Interview</h2>
          </div>
          <button onClick={onClose} style={{ color: P.muted }}><X size={20} /></button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl} style={lblStyle}>Date *</label>
              <input type="date" className={inp} style={inpStyle} value={form.date} onChange={e => set("date", e.target.value)} />
            </div>
            <div>
              <label className={lbl} style={lblStyle}>Time *</label>
              <select className={inp} style={inpStyle} value={form.timeSlot} onChange={e => set("timeSlot", e.target.value)}>
                {times.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl} style={lblStyle}>Duration (min)</label>
              <select className={inp} style={inpStyle} value={form.duration} onChange={e => set("duration", Number(e.target.value))}>
                {[30, 45, 60, 90, 120].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl} style={lblStyle}>Interviewer *</label>
              <input className={inp} style={inpStyle} value={form.interviewerName} onChange={e => set("interviewerName", e.target.value)} placeholder="Name of interviewer" />
            </div>
          </div>
          <div>
            <label className={lbl} style={lblStyle}>Location</label>
            <input className={inp} style={inpStyle} value={form.location} onChange={e => set("location", e.target.value)} placeholder="Physical address or 'Online'" />
          </div>
          <div>
            <label className={lbl} style={lblStyle}>Meeting Link (optional)</label>
            <input className={inp} style={inpStyle} value={form.meetingLink} onChange={e => set("meetingLink", e.target.value)} placeholder="https://meet.google.com/..." />
          </div>
          <p className="text-xs" style={{ color: P.muted }}>
            An interview invitation email will be sent automatically to the candidate.
          </p>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop: `1px solid ${P.border}` }}>
          <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-semibold" style={{ color: P.muted, border: `1px solid ${P.border}` }}>Cancel</button>
          <button onClick={submit} disabled={saving || !form.date || !form.interviewerName}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: "rgba(167,139,250,0.9)", opacity: (!form.date || !form.interviewerName) ? 0.5 : 1 }}>
            {saving ? "Scheduling…" : "Schedule & Send Email"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───── Interview Availability Calendar (All 9 time slots available) ── */
const TIME_SLOTS = ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"];
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function slotToMinutes(slot: string): number {
  const [time, period] = slot.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

function isSlotPast(date: string, slot: string): boolean {
  const todayStr = new Date().toISOString().slice(0, 10);
  if (date !== todayStr) return false;
  const now = new Date();
  return slotToMinutes(slot) <= now.getHours() * 60 + now.getMinutes();
}

function InterviewCalendar({ onSaved, existingSlots }: { onSaved: () => void; existingSlots: InterviewAvailability[] }) {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState("");
  const [pendingSlots, setPendingSlots] = useState<Record<string, string[]>>({});
  const [settings, setSettings] = useState({
    interviewerName: "",
    location: "",
    meetingLink: "",
    duration: 45,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const savedDatesSet = new Set(existingSlots.map(s => s.date));
  const pendingDatesSet = new Set(Object.keys(pendingSlots).filter(d => pendingSlots[d]?.length > 0));
  const selectedSlots = selectedDate ? (pendingSlots[selectedDate] ?? []) : [];
  // ALL slots are available (no filtering by past for selection)
  const allSlots = TIME_SLOTS;
  const allSelected = allSlots.length > 0 && allSlots.every(slot => selectedSlots.includes(slot));
  const totalPendingCount = Object.values(pendingSlots).reduce((acc, slots) => acc + slots.length, 0);

  function formatDateString(year: number, month: number, day: number): string {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function handleDateSelect(date: string) {
    if (date < today) return;
    setSelectedDate(date);
    if (!pendingSlots[date]) {
      setPendingSlots(prev => ({ ...prev, [date]: [] }));
    }
  }

  function toggleSlot(slot: string) {
    if (!selectedDate) return;
    setPendingSlots(prev => {
      const current = prev[selectedDate] || [];
      const updated = current.includes(slot)
        ? current.filter(s => s !== slot)
        : [...current, slot];
      return { ...prev, [selectedDate]: updated };
    });
  }

  function toggleAllSlots() {
    if (!selectedDate) return;
    setPendingSlots(prev => ({
      ...prev,
      [selectedDate]: allSelected ? [] : [...allSlots]
    }));
  }

  async function saveAllSlots() {
    const slotsToCreate = Object.entries(pendingSlots).flatMap(([date, slots]) =>
      slots.map(timeSlot => ({ date, timeSlot, ...settings }))
    );
    if (slotsToCreate.length === 0) return;
    setSaving(true);
    try {
      await api.createInterviewSlotsBulk(slotsToCreate);
      setPendingSlots({});
      setSelectedDate("");
      onSaved();
    } catch (err: any) {
      setError(err.message || "Failed to save slots");
    } finally {
      setSaving(false);
    }
  }

  function clearAllPending() {
    setPendingSlots({});
    setSelectedDate("");
  }

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  }

  return (
    <div className="rounded-2xl" style={{ background: P.card, border: `1px solid ${P.border}` }}>
      {/* Two-column layout */}
      <div className="grid grid-cols-2 divide-x" style={{ borderColor: P.border }}>
        {/* LEFT COLUMN: Calendar */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1 rounded-lg transition-colors hover:bg-gray-100" style={{ color: P.muted }}>
              <ChevronLeft size={16} />
            </button>
            <h3 className="text-base font-bold" style={{ color: P.text }}>
              {MONTHS[currentMonth]} {currentYear}
            </h3>
            <button onClick={nextMonth} className="p-1 rounded-lg transition-colors hover:bg-gray-100" style={{ color: P.muted }}>
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map(day => (
              <div key={day} className="text-center text-[11px] font-bold py-1" style={{ color: P.muted }}>
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = formatDateString(currentYear, currentMonth, day);
              const isPast = dateStr < today;
              const isSelected = dateStr === selectedDate;
              const hasSaved = savedDatesSet.has(dateStr);
              const hasPending = pendingDatesSet.has(dateStr);
              const isToday = dateStr === today;

              return (
                <button
                  key={day}
                  onClick={() => !isPast && handleDateSelect(dateStr)}
                  disabled={isPast}
                  className="relative flex flex-col items-center justify-center rounded-lg text-sm font-semibold transition-all"
                  style={{
                    height: "44px",
                    background: isSelected ? "#7c3aed" : hasPending ? "rgba(124,58,237,0.15)" : isToday ? "rgba(59,130,246,0.08)" : "transparent",
                    color: isSelected ? "white" : isToday ? "#2563eb" : P.text,
                    opacity: isPast ? 0.4 : 1,
                    cursor: isPast ? "not-allowed" : "pointer",
                  }}
                >
                  <span>{day}</span>
                  {(hasSaved || hasPending) && !isSelected && (
                    <div className="absolute bottom-1 flex gap-0.5">
                      {hasSaved && <div className="w-1 h-1 rounded-full bg-emerald-500" />}
                      {hasPending && <div className="w-1 h-1 rounded-full bg-purple-500" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex gap-4 mt-4 pt-3 border-t" style={{ borderColor: P.border }}>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px]" style={{ color: P.muted }}>Saved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-[10px]" style={{ color: P.muted }}>Pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-purple-600" />
              <span className="text-[10px]" style={{ color: P.muted }}>Selected</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: All Time Slots */}
        <div className="p-5">
          {!selectedDate ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <Calendar size={40} style={{ color: P.border }} />
              <p className="font-bold mt-3 text-sm" style={{ color: P.text }}>Selected date</p>
              <p className="text-xs mt-1" style={{ color: P.muted }}>Click any future date on the calendar to configure its time slots</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-bold text-sm" style={{ color: P.text }}>
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-SG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAllSlots}
                    className="w-4 h-4 rounded border-2"
                    style={{ accentColor: "#7c3aed" }}
                  />
                  <span className="text-xs font-medium" style={{ color: P.text }}>Select All</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {allSlots.map(slot => {
                  const isSelected = selectedSlots.includes(slot);
                  const isPast = isSlotPast(selectedDate, slot);
                  return (
                    <button
                      key={slot}
                      onClick={() => toggleSlot(slot)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isPast ? "opacity-40" : "cursor-pointer"}`}
                      style={{
                        background: isSelected ? "#7c3aed" : P.card,
                        border: `1px solid ${isSelected ? "#7c3aed" : P.border}`,
                        color: isSelected ? "white" : P.text,
                      }}
                    >
                      <div className={`w-3.5 h-3.5 rounded flex items-center justify-center ${isSelected ? "bg-white" : "border-2"}`}
                        style={{ borderColor: isSelected ? "white" : P.border }}>
                        {isSelected && <CheckCircle size={9} className="text-purple-600" />}
                      </div>
                      <span>{slot}</span>
                      {isPast && <span className="text-[9px] ml-1" style={{ color: P.border }}>(past)</span>}
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-center mt-4 pt-2" style={{ color: P.muted }}>
                {selectedSlots.length} of {allSlots.length} slots selected
              </p>
            </>
          )}
        </div>
      </div>

      {/* Interview Settings */}
      <div className="border-t p-5" style={{ borderColor: P.border }}>
        <h4 className="font-bold text-sm mb-4" style={{ color: P.text }}>
          Interview Settings <span className="font-normal text-xs ml-1" style={{ color: P.muted }}>(applied to all pending slots)</span>
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: P.muted }}>INTERVIEWER NAME</label>
            <input
              className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-purple-500"
              style={{ background: P.inp, borderColor: P.border }}
              value={settings.interviewerName}
              onChange={e => setSettings(s => ({ ...s, interviewerName: e.target.value }))}
              placeholder="e.g. HR Team"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: P.muted }}>LOCATION (OPTIONAL)</label>
            <input
              className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-purple-500"
              style={{ background: P.inp, borderColor: P.border }}
              value={settings.location}
              onChange={e => setSettings(s => ({ ...s, location: e.target.value }))}
              placeholder="e.g. 31 Eunos Road 5 or Video Call"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: P.muted }}>DURATION (PER SLOT)</label>
            <select
              className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-purple-500"
              style={{ background: P.inp, borderColor: P.border }}
              value={settings.duration}
              onChange={e => setSettings(s => ({ ...s, duration: Number(e.target.value) }))}
            >
              {[30, 45, 60, 90].map(d => <option key={d} value={d}>{d} minutes</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: P.muted }}>MEETING LINK (OPTIONAL)</label>
            <input
              className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-purple-500"
              style={{ background: P.inp, borderColor: P.border }}
              value={settings.meetingLink}
              onChange={e => setSettings(s => ({ ...s, meetingLink: e.target.value }))}
              placeholder="https://meet.google.com/..."
            />
          </div>
        </div>

        {totalPendingCount > 0 && (
          <div className="mt-5 pt-4 flex items-center justify-between border-t" style={{ borderColor: P.border }}>
            <div>
              <p className="text-sm font-bold" style={{ color: P.text }}>{totalPendingCount} slot{totalPendingCount !== 1 ? "s" : ""} ready to save</p>
              <p className="text-xs mt-0.5" style={{ color: P.muted }}>
                {Object.entries(pendingSlots).filter(([, slots]) => slots.length > 0).map(([date, slots]) =>
                  `${new Date(date).toLocaleDateString("en-SG", { month: "short", day: "numeric" })} (${slots.length})`
                ).join(" · ")}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={clearAllPending}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all border"
                style={{ color: P.muted, borderColor: P.border }}
              >
                Clear All
              </button>
              <button
                onClick={saveAllSlots}
                disabled={saving}
                className="px-6 py-2 rounded-lg text-sm font-bold text-white transition-all"
                style={{ background: "#7c3aed", opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Saving..." : `Save ${totalPendingCount} Slot${totalPendingCount !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={!!error} title="Failed to Save Slots" message={error || ""} type="error" onClose={() => setError(null)} />
    </div>
  );
}

/* ───── Main Export ────────────────────────────────────────────────────── */
export default function CareersAdmin() {
  const [tab, setTab] = useState<"jobs" | "applications" | "slots">(() => {
    const q = new URLSearchParams(window.location.search).get("tab");
    return (q === "applications" || q === "slots") ? q : "jobs";
  });
  const [jobs, setJobs] = useState<Career[]>([]);
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [slots, setSlots] = useState<InterviewAvailability[]>([]);
  const [customRequests, setCustomRequests] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingApps, setLoadingApps] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [editingJob, setEditingJob] = useState<Partial<Career> | null>(null);
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [interviewAppId, setInterviewAppId] = useState<number | null>(null);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [confirmDeleteSlot, setConfirmDeleteSlot] = useState<number | null>(null);
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState<string | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<string | null>(null);
  const [confirmDeleteJobId, setConfirmDeleteJobId] = useState<number | null>(null);
  const [deletingJob, setDeletingJob] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterJob, setFilterJob] = useState("all");
  const [search, setSearch] = useState("");

  const loadJobs = useCallback(async () => {
    setLoadingJobs(true);
    const data = await api.getCareers();
    setJobs(data);
    setLoadingJobs(false);
  }, []);

  const loadApps = useCallback(async () => {
    setLoadingApps(true);
    const data = await api.getApplications();
    setApps(data);
    setLoadingApps(false);
  }, []);

  const loadSlots = useCallback(async () => {
    setLoadingSlots(true);
    const [slotsData, reqsData] = await Promise.all([
      api.getInterviewAvailability().catch(() => []),
      api.getCustomInterviewRequests().catch(() => []),
    ]);
    setSlots(slotsData);
    setCustomRequests(reqsData);
    setLoadingSlots(false);
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);
  useEffect(() => { if (tab === "applications") loadApps(); }, [tab, loadApps]);
  useEffect(() => { if (tab === "slots") loadSlots(); }, [tab, loadSlots]);

  async function saveJob(d: Partial<Career>) {
    if (d.id) await api.updateCareer(d.id, d); else await api.createCareer(d);
    setEditingJob(null); loadJobs();
  }

  async function delJob(id: number) {
    setConfirmDeleteJobId(id);
  }

  async function doDeleteJob() {
    if (!confirmDeleteJobId) return;
    setDeletingJob(true);
    await api.deleteCareer(confirmDeleteJobId);
    setConfirmDeleteJobId(null); setDeletingJob(false); loadJobs();
  }

  async function updateStatus(id: number, status: string, adminNotes: string) {
    await api.updateApplicationStatus(id, status, adminNotes);
    await loadApps();
    if (selectedApp?.id === id) setSelectedApp(prev => prev ? { ...prev, status: status as any, adminNotes } : null);
  }

  async function scheduleInterview(appId: number, data: Partial<InterviewSlot>) {
    await api.scheduleInterview(appId, data);
    setInterviewAppId(null);
    await loadApps();
  }

  async function deleteSlot(id: number) {
    try {
      await api.deleteInterviewSlot(id);
      setConfirmDeleteSlot(null);
      loadSlots();
    } catch (e: any) {
      setConfirmDeleteSlot(null);
      setAlertMsg(e.message ?? "Cannot delete a booked slot.");
    }
  }

  async function deleteGroup(date: string, groupSlots: InterviewAvailability[]) {
    setDeletingGroup(date);
    try {
      const available = groupSlots.filter(s => !s.isBooked);
      await Promise.all(available.map(s => api.deleteInterviewSlot(s.id)));
      setConfirmDeleteGroup(null);
      setExpandedDates(prev => { const n = new Set(prev); n.delete(date); return n; });
      loadSlots();
    } catch (e: any) {
      setAlertMsg(e.message ?? "Failed to delete slots. Some may be booked.");
    } finally {
      setDeletingGroup(null);
    }
  }

  const filteredApps = apps.filter(a => {
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    if (filterJob !== "all" && String(a.jobId) !== filterJob) return false;
    if (search && !`${a.candidateName} ${a.candidateEmail}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: apps.length,
    submitted: apps.filter(a => a.status === "submitted").length,
    shortlisted: apps.filter(a => a.status === "shortlisted").length,
    interviews: apps.filter(a => a.status === "interview_scheduled").length,
  };

  return (
    <div style={{ color: P.text, background: P.bg, minHeight: "100vh" }} className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: P.text }}>Recruitment</h1>
        </div>
        {tab === "jobs" && (
          <button onClick={() => setEditingJob(EMPTY_JOB)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-sm hover:shadow-md"
            style={{ background: P.primary }}>
            <Plus size={15} /> New Job Listing
          </button>
        )}
        {tab === "slots" && (
          <button onClick={loadSlots}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ color: P.muted, border: `1px solid ${P.border}`, background: P.card }}>
            <CalendarRange size={14} /> Refresh Slots
          </button>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-6 rounded-xl p-1" style={{ background: P.card, border: `1px solid ${P.border}`, width: "fit-content" }}>
        {[
          { id: "jobs" as const, label: "Job Listings", icon: Briefcase, count: jobs.length },
          { id: "applications" as const, label: "Applications", icon: ClipboardList, count: apps.length },
          { id: "slots" as const, label: "Interview Slots", icon: CalendarRange, count: slots.length },
        ].map(({ id, label, icon: Icon, count }) => (
          <button key={id} onClick={() => setTab(id)}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all"
            style={{
              background: tab === id ? P.surface : "transparent",
              color: tab === id ? P.text : P.muted,
              border: tab === id ? `1px solid ${P.border}` : "1px solid transparent",
            }}>
            <Icon size={14} />{label}
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ml-1"
              style={{ background: tab === id ? "rgba(59,130,246,0.2)" : "transparent", color: tab === id ? P.accent : P.muted }}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Jobs Tab - TABLE FORMAT ── */}
      {tab === "jobs" && (
        <div>
          {loadingJobs ? (
            <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" /></div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ background: P.card, border: `1px solid ${P.border}` }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: P.surface, borderBottom: `1px solid ${P.border}` }}>
                    <th className="text-left px-4 py-3 text-xs font-extrabold uppercase tracking-wider" style={{ color: P.muted }}>Job ID</th>
                    <th className="text-left px-4 py-3 text-xs font-extrabold uppercase tracking-wider" style={{ color: P.muted }}>Title</th>
                    <th className="text-left px-4 py-3 text-xs font-extrabold uppercase tracking-wider" style={{ color: P.muted }}>Department</th>
                    <th className="text-left px-4 py-3 text-xs font-extrabold uppercase tracking-wider" style={{ color: P.muted }}>Type</th>
                    <th className="text-left px-4 py-3 text-xs font-extrabold uppercase tracking-wider" style={{ color: P.muted }}>Location</th>
                    <th className="text-left px-4 py-3 text-xs font-extrabold uppercase tracking-wider" style={{ color: P.muted }}>Applicants</th>
                    <th className="text-left px-4 py-3 text-xs font-extrabold uppercase tracking-wider" style={{ color: P.muted }}>Status</th>
                    <th className="text-left px-4 py-3 text-xs font-extrabold uppercase tracking-wider" style={{ color: P.muted }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((c, i) => {
                    const appCount = apps.filter(a => a.jobId === c.id).length;
                    return (
                      <tr key={c.id}
                        style={{ background: i % 2 === 0 ? P.card : P.surface, borderBottom: `1px solid ${P.border}` }}>
                        <td className="px-4 py-3">
                          <span className="text-xs font-bold px-2 py-1 rounded" style={{ background: "rgba(59,130,246,0.1)", color: P.accent }}>
                            {c.jobId || `JOB-${c.id}`}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-sm" style={{ color: P.text }}>{c.title}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(100,116,139,0.15)", color: P.muted }}>
                            {c.department}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs" style={{ color: P.muted }}>{c.employmentType}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs" style={{ color: P.muted }}>{c.location}</span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => { setTab("applications"); setFilterJob(String(c.id)); }}
                            className="flex items-center gap-1 text-xs font-semibold transition-colors"
                            style={{ color: appCount > 0 ? P.accent : P.muted }}>
                            <Users size={12} />{appCount} applicant{appCount !== 1 ? "s" : ""}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          {c.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                              <CheckCircle size={10} /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">
                              <XCircle size={10} /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setEditingJob(c)} className="p-1.5 rounded-lg transition-all hover:bg-gray-100" style={{ color: P.muted }}>
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => delJob(c.id)} className="p-1.5 rounded-lg transition-all hover:bg-red-50" style={{ color: P.muted }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {jobs.length === 0 && (
                <div className="py-16 text-center" style={{ background: P.card }}>
                  <Briefcase size={40} className="mx-auto mb-4" style={{ color: P.border }} />
                  <p className="font-bold mb-1" style={{ color: P.text }}>No job listings yet</p>
                  <p className="text-sm" style={{ color: P.muted }}>Click "New Job Listing" to create your first posting.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Applications Tab ── */}
      {tab === "applications" && (
        <div>
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total", val: stats.total, color: P.accent, bg: "rgba(96,165,250,0.08)" },
              { label: "New", val: stats.submitted, color: "#60a5fa", bg: "rgba(96,165,250,0.08)" },
              { label: "Shortlisted", val: stats.shortlisted, color: "#10b981", bg: "rgba(16,185,129,0.08)" },
              { label: "Interviews", val: stats.interviews, color: "#a78bfa", bg: "rgba(167,139,250,0.08)" },
            ].map(({ label, val, color, bg }) => (
              <div key={label} className="rounded-xl p-4 flex items-center gap-3" style={{ background: P.card, border: `1px solid ${P.border}` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                  <span className="text-lg font-extrabold" style={{ color }}>{val}</span>
                </div>
                <div>
                  <p className="text-xs font-bold" style={{ color: P.muted }}>{label}</p>
                  <p className="text-xl font-extrabold" style={{ color }}>{val}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: P.muted }} />
              <input className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ background: P.card, border: `1px solid ${P.border}` }}
                value={search} onChange={e => setSearch(e.target.value)} placeholder="Search candidates…" />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={13} style={{ color: P.muted }} />
              <select className="rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ background: P.card, border: `1px solid ${P.border}`, color: filterStatus === "all" ? P.muted : P.text }}
                value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="all">All Statuses</option>
                {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <select className="rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ background: P.card, border: `1px solid ${P.border}`, color: filterJob === "all" ? P.muted : P.text }}
              value={filterJob} onChange={e => setFilterJob(e.target.value)}>
              <option value="all">All Jobs</option>
              {jobs.map(j => <option key={j.id} value={String(j.id)}>{j.jobId || `JOB-${j.id}`} – {j.title}</option>)}
            </select>
            {(filterStatus !== "all" || filterJob !== "all" || search) && (
              <button onClick={() => { setFilterStatus("all"); setFilterJob("all"); setSearch(""); }}
                className="px-3 py-2 rounded-xl text-xs font-semibold" style={{ color: P.muted, border: `1px solid ${P.border}` }}>
                Clear
              </button>
            )}
          </div>

          {/* Applications Table */}
          {loadingApps ? (
            <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" /></div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${P.border}`, background: P.card }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: P.surface, borderBottom: `1px solid ${P.border}` }}>
                    <th className="text-left px-4 py-3 text-xs font-extrabold uppercase tracking-wider" style={{ color: P.muted }}>Ref #</th>
                    <th className="text-left px-4 py-3 text-xs font-extrabold uppercase tracking-wider" style={{ color: P.muted }}>Candidate</th>
                    <th className="text-left px-4 py-3 text-xs font-extrabold uppercase tracking-wider" style={{ color: P.muted }}>Job</th>
                    <th className="text-left px-4 py-3 text-xs font-extrabold uppercase tracking-wider" style={{ color: P.muted }}>Applied</th>
                    <th className="text-left px-4 py-3 text-xs font-extrabold uppercase tracking-wider" style={{ color: P.muted }}>Status</th>
                    <th className="text-left px-4 py-3 text-xs font-extrabold uppercase tracking-wider" style={{ color: P.muted }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.map((a, i) => (
                    <tr key={a.id}
                      style={{ background: i % 2 === 0 ? P.card : P.surface, borderBottom: `1px solid ${P.border}` }}
                      className="transition-colors cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedApp(a)}>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold px-2 py-1 rounded" style={{ background: "rgba(59,130,246,0.1)", color: P.accent }}>
                          {a.applicationNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-sm" style={{ color: P.text }}>{a.candidateName}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: P.muted }}>{a.candidateEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-sm" style={{ color: P.text }}>{a.jobTitle}</p>
                        <p className="text-[11px]" style={{ color: P.muted }}>{a.jobRef}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs" style={{ color: P.muted }}>
                          {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString("en-SG") : "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                      <td className="px-4 py-3 text-right">
                        <button className="p-1.5 rounded-lg transition-colors hover:bg-gray-100" style={{ color: P.muted }} onClick={e => { e.stopPropagation(); setSelectedApp(a); }}>
                          <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredApps.length === 0 && (
                <div className="py-16 text-center" style={{ background: P.card }}>
                  <FileText size={36} className="mx-auto mb-3" style={{ color: P.border }} />
                  <p className="font-bold" style={{ color: P.text }}>No applications found</p>
                  <p className="text-sm mt-1" style={{ color: P.muted }}>
                    {apps.length === 0 ? "Applications will appear here when candidates apply." : "Try adjusting your filters."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Interview Slots Tab ── */}
      {tab === "slots" && (
        <div className="flex flex-col gap-6">
          {/* Calendar builder */}
          <div>
            <h2 className="text-base font-extrabold mb-1" style={{ color: P.text }}>Interview Availability Calendar</h2>
            <p className="text-xs mb-4" style={{ color: P.muted }}>
            </p>
            {loadingSlots ? (
              <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" /></div>
            ) : (
              <InterviewCalendar onSaved={loadSlots} existingSlots={slots} />
            )}
          </div>

          {/* Custom time requests from candidates */}
          {customRequests.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={15} style={{ color: "#f59e0b" }} />
                <h2 className="text-base font-extrabold" style={{ color: P.text }}>Candidate Time Requests</h2>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>
                  {customRequests.filter(r => r.status === "pending").length} pending
                </span>
              </div>
              <div className="grid gap-2">
                {customRequests.map(req => (
                  <div key={req.id} className="rounded-2xl p-4 flex items-start gap-4"
                    style={{ background: P.card, border: `1px solid ${req.status === "pending" ? "rgba(245,158,11,0.3)" : P.border}` }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(245,158,11,0.12)" }}>
                      <MessageSquare size={15} style={{ color: "#f59e0b" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-sm" style={{ color: P.text }}>
                          {req.candidateName} {req.candidateLastName}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>
                          {req.applicationNumber}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${req.status === "pending" ? "bg-yellow-400/10 text-yellow-400" : req.status === "accepted" ? "bg-green-400/10 text-green-400" : "bg-gray-400/10 text-gray-400"}`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: P.muted }}>
                        <strong style={{ color: P.text }}>Requested:</strong>{" "}
                        {new Date(req.preferredDate + "T00:00:00").toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                        {" at "}{req.preferredTimeSlot}
                        {req.jobTitle && <> · {req.jobTitle}</>}
                      </p>
                      {req.notes && <p className="text-xs mt-1 italic" style={{ color: P.muted }}>"{req.notes}"</p>}
                    </div>
                    {req.status === "pending" && (
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => api.resolveCustomRequest(req.id, "accepted").then(loadSlots)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>
                          Accept
                        </button>
                        <button onClick={() => api.resolveCustomRequest(req.id, "declined").then(loadSlots)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: "rgba(239,68,68,0.12)", color: "#f87171" }}>
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Saved slots list — grouped by date */}
          {!loadingSlots && slots.length > 0 && (() => {
            const byDate: Record<string, InterviewAvailability[]> = {};
            for (const s of slots) {
              if (!byDate[s.date]) byDate[s.date] = [];
              byDate[s.date].push(s);
            }
            const sortedDates = Object.keys(byDate).sort();
            return (
              <div>
                <h2 className="text-base font-extrabold mb-3" style={{ color: P.text }}>
                  Saved Slots <span className="font-normal text-sm ml-1" style={{ color: P.muted }}>({sortedDates.length} date{sortedDates.length !== 1 ? "s" : ""}, {slots.length} slot{slots.length !== 1 ? "s" : ""})</span>
                </h2>
                <div className="grid gap-3">
                  {sortedDates.map(date => {
                    const group = byDate[date];
                    const booked = group.filter(s => s.isBooked).length;
                    const available = group.filter(s => !s.isBooked).length;
                    const expanded = expandedDates.has(date);
                    const d = new Date(date + "T00:00:00");
                    const dateLabel = d.toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
                    const isConfirmGroup = confirmDeleteGroup === date;
                    const isDeleting = deletingGroup === date;
                    return (
                      <div key={date} className="rounded-2xl overflow-hidden"
                        style={{ background: P.card, border: `1px solid ${P.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                        <div className="flex items-center gap-3 px-4 py-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: "rgba(0,70,137,0.07)" }}>
                            <Calendar size={15} style={{ color: P.primary }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-extrabold" style={{ color: P.text }}>{dateLabel}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ background: "rgba(0,70,137,0.07)", color: P.primary }}>{group.length} slot{group.length !== 1 ? "s" : ""}</span>
                              {booked > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ background: "rgba(16,185,129,0.1)", color: "#059669" }}>{booked} booked</span>}
                              {available > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ background: "rgba(96,165,250,0.1)", color: "#2563eb" }}>{available} available</span>}
                            </div>
                          </div>
                          <button onClick={() => setExpandedDates(prev => {
                            const n = new Set(prev);
                            if (n.has(date)) n.delete(date); else n.add(date);
                            return n;
                          })} className="p-2 rounded-xl transition-colors hover:bg-gray-100" style={{ color: P.muted }}>
                            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </button>
                          {available > 0 && (
                            isConfirmGroup ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold" style={{ color: "#ef4444" }}>Delete {available} slot{available !== 1 ? "s" : ""}?</span>
                                <button onClick={() => deleteGroup(date, group)} disabled={isDeleting}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold text-white transition-all disabled:opacity-50"
                                  style={{ background: "#ef4444" }}>
                                  {isDeleting ? "…" : "Yes"}
                                </button>
                                <button onClick={() => setConfirmDeleteGroup(null)}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all hover:bg-gray-100"
                                  style={{ color: P.muted }}>No</button>
                              </div>
                            ) : (
                              <button onClick={() => setConfirmDeleteGroup(date)}
                                className="p-2 rounded-xl transition-colors hover:bg-red-50 group" title="Delete all available slots for this date"
                                style={{ color: P.muted }}>
                                <Trash2 size={14} className="group-hover:text-red-500 transition-colors" />
                              </button>
                            )
                          )}
                        </div>
                        {expanded && (
                          <div style={{ borderTop: `1px solid ${P.border}` }}>
                            {group.map((slot, idx) => {
                              const isConfirmSlot = confirmDeleteSlot === slot.id;
                              return (
                                <div key={slot.id}
                                  className="flex items-center gap-3 px-4 py-2.5"
                                  style={{ background: idx % 2 === 0 ? P.surface : P.card, borderBottom: idx < group.length - 1 ? `1px solid ${P.border}` : "none" }}>
                                  <div className="w-2 h-2 rounded-full shrink-0"
                                    style={{ background: slot.isBooked ? "#10b981" : "#93c5fd" }} />
                                  <span className="text-xs font-bold w-20 shrink-0" style={{ color: P.text }}>{slot.timeSlot}</span>
                                  <span className="text-[10px]" style={{ color: P.muted }}>{slot.duration}m</span>
                                  {slot.isBooked
                                    ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1"
                                      style={{ background: "rgba(16,185,129,0.1)", color: "#059669" }}>Booked</span>
                                    : <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1"
                                      style={{ background: "rgba(96,165,250,0.08)", color: "#2563eb" }}>Available</span>}
                                  {slot.interviewerName && (
                                    <span className="text-[10px] flex items-center gap-0.5 ml-1" style={{ color: P.muted }}>
                                      <User size={9} />{slot.interviewerName}
                                    </span>
                                  )}
                                  <div className="flex-1" />
                                  {!slot.isBooked && (
                                    isConfirmSlot ? (
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] font-bold" style={{ color: "#ef4444" }}>Remove?</span>
                                        <button onClick={() => deleteSlot(slot.id)}
                                          className="px-2 py-0.5 rounded-lg text-[11px] font-extrabold text-white"
                                          style={{ background: "#ef4444" }}>Yes</button>
                                        <button onClick={() => setConfirmDeleteSlot(null)}
                                          className="px-2 py-0.5 rounded-lg text-[11px] font-bold hover:bg-gray-100 transition-colors"
                                          style={{ color: P.muted }}>No</button>
                                      </div>
                                    ) : (
                                      <button onClick={() => setConfirmDeleteSlot(slot.id)}
                                        className="p-1.5 rounded-lg transition-colors hover:bg-red-50 group"
                                        style={{ color: P.muted }}>
                                        <Trash2 size={12} className="group-hover:text-red-500 transition-colors" />
                                      </button>
                                    )
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Modals */}
      {editingJob !== null && <JobModal career={editingJob} onSave={saveJob} onClose={() => setEditingJob(null)} />}
      {selectedApp && (
        <AppDetailModal app={selectedApp} onClose={() => setSelectedApp(null)}
          onStatusUpdate={updateStatus}
          onScheduleInterview={(id) => { setInterviewAppId(id); }} />
      )}
      {interviewAppId !== null && (
        <InterviewModal appId={interviewAppId} onSave={scheduleInterview} onClose={() => setInterviewAppId(null)} />
      )}

      {/* Global dialogs */}
      <ConfirmDialog
        open={confirmDeleteJobId !== null} loading={deletingJob}
        title="Delete Job Listing"
        message="This job listing will be permanently removed. All associated applications and data will also be deleted. This cannot be undone."
        confirmLabel="Delete Listing"
        onConfirm={doDeleteJob}
        onCancel={() => setConfirmDeleteJobId(null)}
      />
      <AlertDialog
        open={!!alertMsg}
        title="Action Failed"
        message={alertMsg ?? ""}
        type="error"
        onClose={() => setAlertMsg(null)}
      />
    </div>
  );
}