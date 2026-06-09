import { useState, useEffect, useRef, useMemo, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus,Pencil, Edit2, Trash2, Save, X, Briefcase, FolderOpen, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, ArrowLeft, LogOut, Users, FileText, Download, CheckCircle, Clock, Calendar, Search, Filter, Mail, RefreshCw, Loader2, Send, Bell, Eye, MessageCircle, Copy, Trophy, AlertCircle, Brain, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useAuth } from "../context/AuthContext";

// =============================================================================
// TYPES
// =============================================================================

type TabType = 'jobs' | 'categories' | 'applications' | 'users' | 'slots';

interface JobPosting {
  id: number;
  jobId: string;
  title: string;
  categoryId: number;
  location: string;
  employmentType: string;
  experience: string;
  summary: string;
  description: string;
  requirements: string;
  isActive: boolean;
  createdAt: string;
  category_name?: string;
}

interface JobCategory {
  id: number;
  name: string;
  description: string | null;
}

interface InsertJobPosting {
  jobId: string;
  title: string;
  categoryId: number;
  location: string;
  employmentType: string;
  experience: string;
  summary: string;
  description: string;
  requirements: string;
  isActive: boolean;
}

interface InsertJobCategory {
  name: string;
  description: string | null;
}

interface InterviewAvailableDate {
  id: number;
  availableDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface InterviewBooking {
  id: number;
  date: string;
  timeSlot: string;
  duration: number;
  interviewerName: string;
  location: string;
  meetingLink: string;
  notes: string;
  bookedApplicationId: number | null;
  applicationNumber: string | null;
  candidateName: string | null;
  candidateEmail: string | null;
  jobTitle: string | null;
  jobIdCode: string | null;
  createdAt: string;
}

interface EnrichedApplication {
  id: number;
  jobId: number;
  userId: number;
  coverLetter: string;
  resumePath: string;
  status: string;
  adminRemarks: string | null;
  internalRemarks: string | null;
  createdAt: string;
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
  jobIdCode: string;
  categoryId: number;
  categoryName: string;
  screeningFullName: string | null;
  screeningDob: string | null;
  screeningGender: string | null;
  screeningCurrentLocation: string | null;
  screeningWillingWorkFromOffice: string | null;
  screeningWillingProvideExpDocs: string | null;
  screeningWillingBankStatements: string | null;
  screeningYearsExperience: string | null;
  screeningEducationalQualification: string | null;
  screeningCurrentCtc: string | null;
  screeningExpectedCtc: string | null;
  screeningWillingBackgroundCheck: string | null;
  screeningNoticePeriod: string | null;
  screeningWillingJoinDate: string | null;
  screeningUpdatedAt: string | null;
  interviewAvailableFrom: string | null;
  interviewAvailableTo: string | null;
  interviewPreferredTime: string | null;
  interviewUpdatedAt: string | null;
  scheduledInterviewDate: string | null;
  scheduledInterviewTime: string | null;
  interviewConfirmed: boolean | null;
  interviewConfirmedAt: string | null;
  meetingLink: string | null;
  currentRound: number | null;
}

interface AdminUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  emailVerified: boolean;
  isBlocked: boolean;
  createdAt: string;
}

interface UserDetails {
  user: AdminUser;
  profile: {
    dateOfBirth: string | null;
    gender: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    pincode: string | null;
    highestEducation: string | null;
    educationDetails: string | null;
    currentJobTitle: string | null;
    currentCompany: string | null;
    totalExperience: string | null;
    skills: string | null;
    linkedinUrl: string | null;
    githubUrl: string | null;
    portfolioUrl: string | null;
    resumePath: string | null;
  } | null;
  certifications: Array<{
    id: number;
    certificateName: string;
    issuingOrganization: string;
    issueDate: string | null;
    expiryDate: string | null;
    certificateNumber: string | null;
    certificateUrl: string | null;
  }>;
  workExperience: Array<{
    id: number;
    companyName: string;
    jobTitle: string;
    location: string | null;
    startDate: string;
    endDate: string | null;
    description: string | null;
    isCurrent: boolean;
  }>;
  applications: Array<{
    id: number;
    status: string;
    createdAt: string;
    jobTitle: string;
    jobIdCode: string;
  }>;
}

interface PendingStatusUpdate {
  status: string;
  remarks: string;
  internalRemarks: string;
}

interface SlotSetting {
  id: number;
  round: number;
  timeSlot: string;
  isActive: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const APPLICATION_STATUS_GROUPS = {
  initial: ['Pending', 'Under Review', 'Shortlisted'],
  round1: ['Round 1 Scheduled', 'Reschedule Round 1', 'Round 1 Confirmed', 'Round 1 Completed', 'Round 1 Selected', 'Round 1 Not Selected'],
  round2: ['Round 2 Scheduled', 'Reschedule Round 2', 'Round 2 Confirmed', 'Round 2 Completed', 'Round 2 Selected', 'Round 2 Not Selected'],
  round3: ['Round 3 Scheduled', 'Reschedule Round 3', 'Round 3 Confirmed', 'Round 3 Completed', 'Round 3 Selected', 'Round 3 Not Selected'],
  selection: ['Final Selected', 'Offer Extended', 'Onboarded'],
  closed: ['Not Selected', 'Withdrawn by Candidate', 'Position Closed', 'Rejected - Candidate non responsive'],
};

const STATUS_TABS = [
  { key: 'Pending', label: 'Pending', statuses: ['Pending'] },
  { key: 'Under Review', label: 'Under Review', statuses: ['Under Review'] },
  { key: 'Shortlisted', label: 'Shortlisted', statuses: ['Shortlisted'] },
  { key: 'Reschedule Interview', label: 'Reschedule', statuses: ['Reschedule Interview', 'Reschedule Round 1', 'Reschedule Round 2', 'Reschedule Round 3'] },
  { key: 'Interview Scheduled', label: 'Interview Scheduled', statuses: ['Interview Scheduled', 'Round 1 Scheduled', 'Round 1 Confirmed', 'Round 2 Scheduled', 'Round 2 Confirmed', 'Round 3 Scheduled', 'Round 3 Confirmed'] },
  { key: 'Interview Completed', label: 'Interview Completed', statuses: ['Interview Completed', 'Round 1 Completed', 'Round 1 Selected', 'Round 2 Completed', 'Round 2 Selected', 'Round 3 Completed', 'Round 3 Selected', 'Final Selected'] },
  { key: 'Selected', label: 'Selected', statuses: ['Selected (Final)', 'Offer Extended', 'Onboarded'], hasSubTabs: true },
  { key: 'Rejected', label: 'Rejected', statuses: ['Rejected', 'Not Selected', 'Round 1 Not Selected', 'Round 2 Not Selected', 'Round 3 Not Selected', 'Withdrawn by Candidate', 'Position Closed', 'Rejected - Candidate non responsive'] },
];

const SELECTED_SUB_TABS = ['Offer Extended', 'Onboarded'];
const REJECTION_STATUSES_ALL = ['Rejected', 'Not Selected', 'Round 1 Not Selected', 'Round 2 Not Selected', 'Round 3 Not Selected', 'Withdrawn by Candidate', 'Position Closed', 'Rejected - Candidate non responsive'];
const REJECTION_REQUIRES_REMARKS = ['Not Selected', 'Round 1 Not Selected', 'Round 2 Not Selected', 'Round 3 Not Selected', 'Rejected - Candidate non responsive', 'Rejected', 'Withdrawn by Candidate'];
const ROUND1_STATUSES = ['Round 1 Scheduled', 'Reschedule Round 1', 'Round 1 Confirmed', 'Round 1 Completed', 'Round 1 Selected', 'Round 1 Not Selected'];
const INTERVIEW_INVITE_STATUSES = ['Shortlisted', 'Round 1 Selected', 'Round 2 Selected'];
const MONTH_DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SLOT_PANEL_META = [
  { round: 1, label: 'Round 1 — Technical', accent: 'violet', duration: '1 hr', durationMinutes: 60 },
  { round: 2, label: 'Round 2 — LSP-E', accent: 'cyan', duration: '2 hrs', durationMinutes: 120 },
  { round: 3, label: 'Round 3 — Manager/HR', accent: 'emerald', duration: '1 hr', durationMinutes: 60 },
] as const;


  const handleBack = () => {
    window.history.back();
  };

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getAdminToken(): string | null {
  return sessionStorage.getItem('wings_admin_token');
}

function removeAdminToken(): void {
  sessionStorage.removeItem('wings_admin_token');
  window.dispatchEvent(new CustomEvent('wings-admin-session-expired'));
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatCalendarLabel(dateKey: string) {
  return parseDateKey(dateKey).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatSlotLabel(timeSlot: string) {
  const [hoursRaw, minutesRaw = '00'] = timeSlot.split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (!Number.isFinite(hours)) return timeSlot;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function isBeforeToday(dateKey: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parseDateKey(dateKey).getTime() < today.getTime();
}

function getDateRecordStatus(dateKey: string, dates?: InterviewAvailableDate[]) {
  const record = dates?.find((item) => item.availableDate === dateKey);
  if (record?.isActive === true) return 'available';
  if (record?.isActive === false) return 'not-available';
  return 'unset';
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    removeAdminToken();
    throw new Error('Session expired');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

function formatDateReadable(dateStr: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [y, m, d] = dateStr.split('-');
  return `${d}-${months[parseInt(m) - 1]}-${y}`;
}

function to12Hour(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

function formatTimeRange12(timeRange: string): string {
  return timeRange.split(' - ').map(t => to12Hour(t.trim())).join(' - ');
}

function convertISTtoSGT(istTimeRange: string): string {
  const parts = istTimeRange.split(' - ');
  const converted = parts.map(t => {
    const [h, m] = t.trim().split(':').map(Number);
    let totalMin = h * 60 + m + 150;
    if (totalMin >= 1440) totalMin -= 1440;
    const newH = Math.floor(totalMin / 60);
    const newM = totalMin % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  });
  return converted.join(' - ');
}

function slugCandidateName(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    'Pending': 'bg-yellow-500/20 text-yellow-400',
    'Under Review': 'bg-blue-500/20 text-blue-400',
    'Shortlisted': 'bg-purple-500/20 text-purple-400',
    'Round 1 Scheduled': 'bg-cyan-500/20 text-cyan-400',
    'Round 1 Confirmed': 'bg-blue-500/20 text-blue-400',
    'Round 1 Completed': 'bg-indigo-500/20 text-indigo-400',
    'Round 1 Selected': 'bg-purple-500/20 text-purple-400',
    'Round 1 Not Selected': 'bg-red-500/20 text-red-400',
    'Round 2 Scheduled': 'bg-cyan-500/20 text-cyan-400',
    'Round 2 Confirmed': 'bg-blue-500/20 text-blue-400',
    'Round 2 Completed': 'bg-indigo-500/20 text-indigo-400',
    'Round 2 Selected': 'bg-purple-500/20 text-purple-400',
    'Round 2 Not Selected': 'bg-red-500/20 text-red-400',
    'Round 3 Scheduled': 'bg-cyan-500/20 text-cyan-400',
    'Round 3 Confirmed': 'bg-blue-500/20 text-blue-400',
    'Round 3 Completed': 'bg-indigo-500/20 text-indigo-400',
    'Round 3 Selected': 'bg-green-500/20 text-green-400',
    'Round 3 Not Selected': 'bg-red-500/20 text-red-400',
    'Interview Scheduled': 'bg-cyan-500/20 text-cyan-400',
    'Final Selected': 'bg-green-500/20 text-green-400',
    'Offer Extended': 'bg-teal-500/20 text-teal-400',
    'Onboarded': 'bg-emerald-500/20 text-emerald-400',
    'Not Selected': 'bg-red-500/20 text-red-400',
    'Withdrawn by Candidate': 'bg-orange-500/20 text-orange-400',
    'Position Closed': 'bg-gray-500/20 text-gray-500',
    'Rejected - Candidate non responsive': 'bg-red-500/20 text-red-400',
  };
  return colors[status] || 'bg-gray-500/20 text-gray-500';
}

// =============================================================================
// MCQ PANEL COMPONENT
// =============================================================================

interface McqQuestionDetail {
  id: number;
  questionOrder: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  shuffledCorrectAnswer: string;
  category: string;
  difficulty: string;
  selectedAnswer?: string | null;
  isCorrect?: boolean;
}

interface McqSessionDetail {
  id: number;
  status: string;
  generatedAt: string;
  startedAt?: string | null;
  submittedAt?: string | null;
  expiresAt?: string | null;
  score?: number | null;
  totalQuestions: number;
  passThreshold: number;
  passed?: boolean | null;
  warningCount: number;
  autoSubmitted: boolean;
  questions: McqQuestionDetail[];
}

const CATEGORY_COLORS: Record<string, string> = {
  technical: 'bg-blue-500/20 text-blue-300',
  reasoning: 'bg-purple-500/20 text-purple-300',
  aptitude: 'bg-cyan-500/20 text-cyan-300',
  real_world: 'bg-orange-500/20 text-orange-300',
  role_specific: 'bg-green-500/20 text-green-300',
};

function AdminMcqPanel({ appId, jobIdCode, appStatus, candidateName }: { appId: number; jobIdCode: string; appStatus: string; candidateName: string }) {
  const [sessionData, setSessionData] = useState<McqSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genElapsed, setGenElapsed] = useState(0);
  const [showQuestions, setShowQuestions] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [overrideType, setOverrideType] = useState<'pass' | 'fail' | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [overriding, setOverriding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [voiding, setVoiding] = useState(false);
  const [showReconductConfirm, setShowReconductConfirm] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const testUrl = `${window.location.origin}/technical-evaluation/${jobIdCode}/${appId}-${slugCandidateName(candidateName)}`;

  const loadSession = async () => {
    try {
      const data = await apiFetch<{ success: boolean; session: McqSessionDetail | null }>(`/api/admin/mcq/session/${appId}`);
      setSessionData(data.session ?? null);
    } catch (err) {
      console.error('Failed to load MCQ session:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSession(); }, [appId]);

  useEffect(() => {
    if (!generating) { setGenElapsed(0); return; }
    setGenElapsed(0);
    const iv = setInterval(() => setGenElapsed(s => s + 1), 1000);
    return () => clearInterval(iv);
  }, [generating]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const data = await apiFetch<{ success: boolean; message?: string }>(`/api/admin/mcq/generate/${appId}`, { method: 'POST' });
      if (data.success) {
        toast({ title: 'MCQ questions generated', description: '30 personalised questions ready. Test link sent to candidate.' });
        await loadSession();
        setShowQuestions(true);
      } else {
        toast({ title: 'Generation failed', description: data.message, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to generate MCQ questions', variant: 'destructive' });
    }
    setGenerating(false);
  };

  const handleVoid = async () => {
    if (!sessionData) return;
    setVoiding(true);
    try {
      await apiFetch(`/api/admin/mcq/sessions/${sessionData.id}/void`, { method: 'PATCH' });
      toast({ title: 'Session voided', description: 'Admin can now regenerate questions.' });
      await loadSession();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to void session', variant: 'destructive' });
    }
    setVoiding(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(testUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSendInvite = async () => {
    setSendingInvite(true);
    try {
      const data = await apiFetch<{ success: boolean; message?: string }>(`/api/admin/mcq/invite/${appId}`, { method: 'POST' });
      if (data.success) {
        setInviteSent(true);
        toast({ title: 'Invite sent', description: 'Technical evaluation email sent to the candidate.' });
        setTimeout(() => setInviteSent(false), 4000);
      } else {
        toast({ title: 'Failed to send', description: data.message || 'Could not send invite email.', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to send invite email.', variant: 'destructive' });
    }
    setSendingInvite(false);
  };

  const handleOverride = async () => {
    if (!overrideType || !overrideReason.trim()) return;
    setOverriding(true);
    try {
      const data = await apiFetch<{ success: boolean; newStatus: string; message?: string }>(`/api/admin/mcq/override/${appId}`, {
        method: 'PATCH',
        body: JSON.stringify({ overrideType, reason: overrideReason.trim() })
      });
      if (data.success) {
        toast({ title: 'Override applied', description: `Status updated to ${data.newStatus}. Email sent to candidate.` });
        setOverrideType(null);
        setOverrideReason('');
        await loadSession();
        queryClient.invalidateQueries({ queryKey: ['applications'] });
      } else {
        toast({ title: 'Override failed', description: data.message, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to apply override', variant: 'destructive' });
    }
    setOverriding(false);
  };

  const handleSendReport = async () => {
    setSendingReport(true);
    try {
      const data = await apiFetch<{ success: boolean; message?: string }>(`/api/admin/mcq/report/${appId}/email`, { method: 'POST' });
      if (data.success) {
        toast({ title: 'Report sent', description: 'Detailed question-by-question report emailed to candidate.' });
      } else {
        toast({ title: 'Failed', description: data.message, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Could not send report email', variant: 'destructive' });
    }
    setSendingReport(false);
  };

  if (!ROUND1_STATUSES.includes(appStatus)) return null;
  if (loading) return <div className="text-xs text-gray-500 py-2 flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Loading MCQ data...</div>;

  const hasSession = sessionData !== null;
  const isCompleted = sessionData?.status === 'completed';
  const isInProgress = sessionData?.status === 'in_progress';
  const isVoided = sessionData?.status === 'voided';
  const isExpired = sessionData?.status === 'expired';
  const isPending = sessionData?.status === 'pending';
  const score = sessionData?.score ?? 0;
  const total = sessionData?.totalQuestions ?? 30;
  const pct = total > 0 ? ((score / total) * 100).toFixed(1) : '0.0';

  return (
    <div className="p-4 bg-[#F7F6F3] border border-violet-500/30 rounded-lg">
      <h4 className="text-sm font-semibold text-[#0D4A7A] mb-3 flex items-center gap-2">
        <Brain className="w-4 h-4" />
        MCQ Technical Evaluation
        {isInProgress && <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full">In Progress</span>}
        {isCompleted && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${sessionData?.passed ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
            {sessionData?.passed ? 'Passed' : 'Failed'}
          </span>
        )}
        {isVoided && <span className="text-xs bg-gray-500/20 text-gray-500 px-2 py-0.5 rounded-full">Voided</span>}
      </h4>

      {(!hasSession || isVoided) && (
        <div className="space-y-3">
          {isVoided && <p className="text-xs text-gray-500">Previous session was voided. Generate new questions to resend the test.</p>}
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full bg-[#0D4A7A] text-white text-sm h-9 flex items-center justify-center gap-2"
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating 30 questions with AI...</>
            ) : (
              <><Brain className="w-4 h-4" /> {isVoided ? 'Regenerate MCQ Questions' : 'Generate MCQ Questions'}</>
            )}
          </Button>
          {generating && (
            <div className="space-y-2">
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min((genElapsed / 30) * 100, 95)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 text-center">
                AI is personalising 30 questions from the resume… {genElapsed}s elapsed
              </p>
            </div>
          )}
        </div>
      )}

      {isExpired && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-orange-400 text-xs">
            <AlertCircle className="w-3 h-3" /> Test session expired — candidate did not complete within 45 minutes.
          </div>
          <Button onClick={handleGenerate} disabled={generating} className="w-full bg-orange-600 hover:bg-orange-500 text-sm h-9 flex items-center gap-2">
            {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><RefreshCw className="w-4 h-4" /> Regenerate Questions</>}
          </Button>
        </div>
      )}

      {hasSession && !isVoided && !isExpired && (
        <div className="space-y-4">
          <div>
            <Label className="text-gray-500 text-xs mb-1.5 block">Shareable Test Link</Label>
            <div className="flex gap-2">
              <div className="flex-1 bg-white border border-gray-300 rounded px-3 py-1.5 flex items-center gap-2 min-w-0">
                <ExternalLink className="w-3 h-3 text-gray-500 flex-shrink-0" />
                <span className="text-xs text-gray-700 truncate">{testUrl}</span>
              </div>
              <Button size="sm" variant="outline" className="border-gray-600 text-xs h-8 px-2 flex-shrink-0" onClick={handleCopy}>
                {copied ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              </Button>
              <Button
                size="sm"
                onClick={handleSendInvite}
                disabled={sendingInvite}
                className="bg-violet-700/60 hover:bg-violet-600/70 text-violet-100 text-xs h-8 px-3 flex-shrink-0 flex items-center gap-1.5 border-0"
              >
                {sendingInvite ? <Loader2 className="w-3 h-3 animate-spin" /> : inviteSent ? <CheckCircle className="w-3 h-3 text-green-300" /> : <Mail className="w-3 h-3" />}
                {sendingInvite ? 'Sending…' : inviteSent ? 'Sent!' : 'Send Email'}
              </Button>
            </div>
          </div>

          {isInProgress && (
            <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
              <p className="text-xs text-yellow-300 font-medium">⏱ Test is currently in progress</p>
              {sessionData?.startedAt && (
                <p className="text-xs text-gray-500 mt-1">Started: {new Date(sessionData.startedAt).toLocaleString()}</p>
              )}
              {sessionData?.expiresAt && (
                <p className="text-xs text-gray-500">Expires: {new Date(sessionData.expiresAt).toLocaleString()}</p>
              )}
              {(sessionData?.warningCount ?? 0) > 0 && (
                <p className="text-xs text-orange-300 mt-1">⚠ Warnings: {sessionData?.warningCount}</p>
              )}
              <Button onClick={handleVoid} disabled={voiding} className="mt-2 w-full bg-gray-700 hover:bg-gray-600 text-xs h-7">
                {voiding ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Void & Allow Regeneration'}
              </Button>
            </div>
          )}

          {isCompleted && (
            <div className="space-y-3">
              <div className="p-3 bg-white/60 border border-gray-300/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 font-semibold">Score</span>
                  <div className="flex items-center gap-2">
                    <Trophy className={`w-4 h-4 ${sessionData?.passed ? 'text-green-400' : 'text-red-400'}`} />
                    <span className={`text-lg font-bold ${sessionData?.passed ? 'text-green-400' : 'text-red-400'}`}>
                      {score}/{total}
                    </span>
                    <span className="text-xs text-gray-500">({pct}%)</span>
                    <Badge className={`text-xs border-0 ${sessionData?.passed ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                      {sessionData?.passed ? 'PASS' : 'FAIL'}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs mt-2">
                  <div className="text-center">
                    <div className="text-gray-500">Pass Mark</div>
                    <div className="font-semibold text-violet-300">{sessionData?.passThreshold ?? 28}/{total}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-500">Warnings</div>
                    <div className={`font-semibold ${(sessionData?.warningCount ?? 0) > 0 ? 'text-orange-300' : 'text-gray-700'}`}>
                      {sessionData?.warningCount ?? 0}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-500">Auto-Sub</div>
                    <div className={`font-semibold ${sessionData?.autoSubmitted ? 'text-red-300' : 'text-gray-700'}`}>
                      {sessionData?.autoSubmitted ? 'Yes' : 'No'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-500">Time</div>
                    <div className="text-gray-700 font-semibold">
                      {sessionData?.startedAt && sessionData?.submittedAt
                        ? `${Math.round((new Date(sessionData.submittedAt).getTime() - new Date(sessionData.startedAt).getTime()) / 60000)}m`
                        : '—'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setShowBreakdown(true)}
                  className="flex-1 bg-violet-100 hover:bg-violet-800/50 text-violet-300 border border-violet-500/40 text-xs h-8 flex items-center gap-2"
                >
                  <Eye className="w-3 h-3" /> View Full Breakdown
                </Button>
                <Button
                  onClick={handleSendReport}
                  disabled={sendingReport}
                  className="flex-1 bg-blue-700/50 hover:bg-blue-600/60 text-blue-200 text-xs h-8 flex items-center gap-2 border-0"
                >
                  {sendingReport ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                  {sendingReport ? 'Sending…' : 'Email Report to Candidate'}
                </Button>
              </div>

              <div className="p-3 bg-white/40 border border-gray-300/40 rounded-lg">
                <p className="text-xs text-gray-500 font-semibold mb-2">Override Result</p>
                {overrideType === null ? (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setOverrideType('pass')} className="flex-1 bg-green-700/40 hover:bg-green-700/60 text-green-300 text-xs h-7 border border-green-700/50">
                      Force Pass
                    </Button>
                    <Button size="sm" onClick={() => setOverrideType('fail')} className="flex-1 bg-red-700/40 hover:bg-red-700/60 text-red-300 text-xs h-7 border border-red-700/50">
                      Force Fail
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs border-0 ${overrideType === 'pass' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                        {overrideType === 'pass' ? 'Force Pass' : 'Force Fail'}
                      </Badge>
                      <button className="text-gray-500 hover:text-gray-900 text-xs" onClick={() => { setOverrideType(null); setOverrideReason(''); }}>✕ Cancel</button>
                    </div>
                    <Textarea
                      placeholder="Mandatory: enter reason for override..."
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      className="bg-gray-100 border-gray-600 text-gray-900 text-xs min-h-[60px] placeholder:text-gray-600"
                    />
                    <Button
                      onClick={handleOverride}
                      disabled={overriding || !overrideReason.trim()}
                      className={`w-full text-xs h-8 ${overrideType === 'pass' ? 'bg-green-700 hover:bg-green-600' : 'bg-red-700 hover:bg-red-600'}`}
                    >
                      {overriding ? <Loader2 className="w-3 h-3 animate-spin" /> : `Confirm ${overrideType === 'pass' ? 'Force Pass' : 'Force Fail'}`}
                    </Button>
                  </div>
                )}
              </div>

              <div className="p-3 bg-white/40 border border-amber-700/30 rounded-lg">
                <p className="text-xs text-amber-500/80 font-semibold mb-2">Reconduct Test</p>
                {!showReconductConfirm ? (
                  <Button
                    size="sm"
                    onClick={() => setShowReconductConfirm(true)}
                    className="w-full bg-amber-700/30 hover:bg-amber-700/50 text-amber-300 border border-amber-700/40 text-xs h-7"
                  >
                    Allow Candidate to Retake Test
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 leading-snug">
                      This will void the current result and let you generate a fresh set of questions. The candidate's test link stays the same — they'll see the new test after you regenerate.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => { handleVoid(); setShowReconductConfirm(false); }}
                        disabled={voiding}
                        className="flex-1 bg-amber-700/60 hover:bg-amber-600/70 text-amber-100 text-xs h-7 border-0"
                      >
                        {voiding ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Yes, Reconduct'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setShowReconductConfirm(false)}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-700 text-xs h-7 border-0"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {(isPending || isCompleted) && sessionData?.questions && sessionData.questions.length > 0 && (
            <div>
              <button
                onClick={() => setShowQuestions(v => !v)}
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-900 transition-colors w-full text-left"
              >
                {showQuestions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showQuestions ? 'Hide' : 'Preview'} {sessionData.questions.length} Questions
              </button>
              {showQuestions && (
                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto pr-1">
                  {sessionData.questions.map((q) => (
                    <div key={q.id} className="bg-white/60 rounded p-2 border border-gray-300/40 text-xs">
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 flex-shrink-0 font-mono">{q.questionOrder}.</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-800 leading-relaxed">{q.questionText}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-1.5 py-0.5 rounded text-xs ${CATEGORY_COLORS[q.category] ?? 'bg-gray-500/20 text-gray-500'}`}>
                              {q.category.replace('_', ' ')}
                            </span>
                            <span className="text-gray-600">{q.difficulty}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(isPending || isInProgress) && (
            <Button
              onClick={handleGenerate}
              disabled={generating || isInProgress}
              variant="outline"
              className="w-full border-gray-600 text-gray-500 hover:text-gray-900 text-xs h-8 flex items-center gap-2"
            >
              {generating ? <><Loader2 className="w-3 h-3 animate-spin" /> Regenerating...</> : <><RefreshCw className="w-3 h-3" /> Regenerate Questions</>}
            </Button>
          )}
        </div>
      )}

      <Dialog open={showBreakdown} onOpenChange={setShowBreakdown}>
        <DialogContent className="bg-white border-gray-300 text-gray-900 max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <Brain className="w-5 h-5 text-violet-400" />
              MCQ Full Breakdown
              {sessionData && (
                <Badge className={`text-xs border-0 ml-2 ${sessionData.passed ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                  {score}/{total} — {pct}% — {sessionData.passed ? 'PASS' : 'FAIL'}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-xs">
              Green rows = correct answer. Red rows = incorrect or unanswered.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto mt-2 space-y-2 pr-1">
            {(sessionData?.questions ?? []).map((q) => {
              const optionMap: Record<string, string> = { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD };
              const selected = q.selectedAnswer;
              const correctShuffled = q.shuffledCorrectAnswer;
              const isCorrect = selected === correctShuffled;
              const unanswered = !selected;
              return (
                <div
                  key={q.id}
                  className={`p-3 rounded-lg border text-xs ${isCorrect ? 'bg-green-900/20 border-green-700/40' : 'bg-red-900/20 border-red-700/40'}`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-gray-500 font-mono flex-shrink-0">{q.questionOrder}.</span>
                    <div className="flex-1">
                      <p className="text-gray-100 leading-relaxed mb-2">{q.questionText}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                          const isCorrectOption = letter === correctShuffled;
                          const isSelectedOption = letter === selected;
                          return (
                            <div
                              key={letter}
                              className={`flex items-start gap-1.5 px-2 py-1 rounded ${isCorrectOption ? 'bg-green-800/40 text-green-200' :
                                isSelectedOption && !isCorrectOption ? 'bg-red-800/40 text-red-200' :
                                  'text-gray-500'
                                }`}
                            >
                              <span className="font-mono flex-shrink-0 font-bold">{letter}.</span>
                              <span>{optionMap[letter]}</span>
                              {isCorrectOption && <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5 ml-auto" />}
                              {isSelectedOption && !isCorrectOption && <X className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5 ml-auto" />}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className={`px-1.5 py-0.5 rounded ${CATEGORY_COLORS[q.category] ?? 'bg-gray-500/20 text-gray-500'}`}>
                          {q.category.replace('_', ' ')}
                        </span>
                        <span className="text-gray-500">{q.difficulty}</span>
                        {unanswered && <span className="text-orange-400">Not answered</span>}
                        {!unanswered && !isCorrect && <span className="text-red-400">Candidate chose: {selected}</span>}
                        {isCorrect && <span className="text-green-400">Correct ✓</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <DialogFooter className="mt-2 flex items-center gap-2">
            <Button
              onClick={handleSendReport}
              disabled={sendingReport}
              className="bg-blue-700/50 hover:bg-blue-600/60 text-blue-200 text-xs flex items-center gap-2 border-0"
            >
              {sendingReport ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
              {sendingReport ? 'Sending…' : 'Email Report to Candidate'}
            </Button>
            <Button variant="outline" onClick={() => setShowBreakdown(false)} className="border-gray-600 text-gray-700">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =============================================================================
// Q&A SECTION COMPONENT
// =============================================================================

function AdminQASection({ appId }: { appId: number }) {
  const [qa, setQA] = useState<{ questions: any[]; answers: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<'text' | 'multiple_choice'>('text');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const loadQA = async () => {
    try {
      const data = await apiFetch<{ questions: any[]; answers: any[] }>(`/api/admin/applications/${appId}/qa`);
      setQA(data);
    } catch (err) {
      setQA({ questions: [], answers: [] });
      if (err instanceof Error && err.message !== 'Session expired') {
        toast({ title: 'Error', description: 'Failed to load Q&A', variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadQA(); }, [appId]);

  const addQuestion = async () => {
    if (!questionText.trim()) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/admin/applications/${appId}/questions`, {
        method: 'POST',
        body: JSON.stringify({
          questionText: questionText.trim(),
          questionType,
          options: questionType === 'multiple_choice' ? options.filter(o => o.trim()) : null,
        }),
      });
      setQuestionText('');
      setOptions(['', '']);
      setQuestionType('text');
      loadQA();
      toast({ title: 'Question sent', description: 'Candidate has been notified by email.' });
    } catch (err) {
      toast({ title: 'Failed to send question', description: err instanceof Error ? err.message : 'Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteQuestion = async (qId: number) => {
    try {
      await apiFetch(`/api/admin/questions/${qId}`, { method: 'DELETE' });
      loadQA();
      toast({ title: 'Deleted', description: 'Question removed successfully.' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete question', variant: 'destructive' });
    }
  };

  if (loading) return <div className="text-xs text-gray-500 py-2">Loading Q&A...</div>;

  const answeredMap = new Map((qa?.answers || []).map((a: any) => [a.questionId, a]));
  const pendingCount = (qa?.questions || []).filter((q: any) => !answeredMap.has(q.id)).length;

  return (
    <div className="p-4 bg-[#F7F6F3] border border-indigo-500/30 rounded-lg">
      <h4 className="text-sm font-semibold text-[#0D4A7A] mb-3 flex items-center gap-2">
        <MessageCircle className="w-4 h-4" />
        Questions & Answers
        {pendingCount > 0 && (
          <span className="bg-amber-500 text-gray-900 text-xs px-1.5 py-0.5 rounded-full">{pendingCount} pending</span>
        )}
      </h4>

      {(qa?.questions || []).length === 0 && (
        <p className="text-xs text-gray-500 mb-3">No questions yet. Add one below.</p>
      )}

      <div className="space-y-3 mb-4">
        {(qa?.questions || []).map((q: any) => {
          const answer = answeredMap.get(q.id);
          return (
            <div key={q.id} className="bg-white0 rounded-lg p-3 border border-gray-300/50">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-xs text-indigo-300 font-medium mb-1">You asked:</p>
                  <p className="text-sm text-gray-900">{q.questionText}</p>
                  {q.questionType === 'multiple_choice' && q.options && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {q.options.map((opt: string, i: number) => (
                        <span key={i} className="text-xs bg-gray-700 text-gray-700 px-2 py-0.5 rounded">{opt}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => deleteQuestion(q.id)} className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              {answer ? (
                <div className="mt-2 pl-3 border-l-2 border-green-500/50">
                  <p className="text-xs text-green-400 font-medium mb-0.5">Candidate answered:</p>
                  <p className="text-sm text-gray-700">{answer.answerText}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{new Date(answer.answeredAt).toLocaleString()}</p>
                </div>
              ) : (
                <div className="mt-2 pl-3 border-l-2 border-amber-500/40">
                  <p className="text-xs text-amber-400 italic">Awaiting answer...</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-2 pt-3 border-t border-indigo-500/20">
        <p className="text-xs text-gray-500 font-medium">Ask a question</p>
        <Textarea
          value={questionText}
          onChange={e => setQuestionText(e.target.value)}
          placeholder="Type your question here..."
          className="bg-white border-gray-300 text-gray-900 text-xs min-h-[60px]"
        />
        <div className="flex gap-2 flex-wrap">
          <Select value={questionType} onValueChange={(v: any) => setQuestionType(v)}>
            <SelectTrigger className="bg-gray-100 border-gray-300 text-gray-900 text-xs h-8 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text answer</SelectItem>
              <SelectItem value="multiple_choice">Multiple choice</SelectItem>
            </SelectContent>
          </Select>
        <Button
  onClick={addQuestion}
  className="bg-[#0D4A7A] text-white text-xs h-8"
>
  {submitting ? (
    <Loader2 className="w-3 h-3 animate-spin" />
  ) : (
    <>
      <Send className="w-3 h-3 mr-1" />
      Send & Email
    </>
  )}
</Button>
        </div>
        {questionType === 'multiple_choice' && (
          <div className="space-y-1 pt-1">
            <p className="text-xs text-gray-500">Options (candidate will choose one):</p>
            {options.map((opt, i) => (
              <div key={i} className="flex gap-1 items-center">
                <Input
                  value={opt}
                  onChange={e => { const next = [...options]; next[i] = e.target.value; setOptions(next); }}
                  placeholder={`Option ${i + 1}`}
                  className="bg-white border-gray-300 text-gray-900 text-xs h-7 flex-1"
                />
                {options.length > 2 && (
                  <button onClick={() => setOptions(options.filter((_, j) => j !== i))} className="text-gray-500 hover:text-red-400">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => setOptions([...options, ''])} className="text-xs text-indigo-400 hover:text-indigo-300">
              Add option
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// SHARED ADMIN FORM STYLES (Team / Events pattern)
// =============================================================================

const ADMIN_FORM_INPUT_CLASS =
  "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 bg-white transition-all";

const ADMIN_FORM_LABEL_CLASS = "block text-sm font-semibold text-gray-700 mb-2";

function AdminFormModalShell({
  title,
  subtitle,
  onClose,
  children,
  footer,
  maxWidthClass = "max-w-4xl",
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
  maxWidthClass?: string;
}) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidthClass} max-h-[90vh] flex flex-col overflow-hidden`}
        >
          <div className="sticky top-0 bg-[#0D4A7A] px-6 py-5 flex justify-between items-center shrink-0">
            <div>
              <h3 className="text-2xl font-bold text-white">{title}</h3>
              <p className="text-blue-100 text-sm mt-1">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors p-2 hover:bg-white/10 rounded-full"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">{children}</div>

          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
            {footer}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function JobStatusToggle({
  isActive,
  onChange,
}: {
  isActive: boolean;
  onChange: (active: boolean) => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className={ADMIN_FORM_LABEL_CLASS}>Job Status</p>
      <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 gap-1">
        <button
          type="button"
          onClick={() => onChange(true)}
          data-testid="button-status-active"
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            isActive
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Active
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          data-testid="button-status-inactive"
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            !isActive
              ? "bg-gray-600 text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Inactive
        </button>
      </div>
   
    </div>
  );
}

// =============================================================================
// JOB FORM COMPONENT
// =============================================================================

function JobForm({
  open,
  job,
  categories,
  onSave,
  onCancel,
  isLoading,
}: {
  open: boolean;
  job: JobPosting | null;
  categories: JobCategory[];
  onSave: (data: Partial<InsertJobPosting>) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    jobId: "",
    title: "",
    categoryId: categories[0]?.id ?? 0,
    location: "",
    employmentType: "Full-time",
    experience: "",
    summary: "",
    description: "",
    requirements: "",
    isActive: true,
  });

  useEffect(() => {
    if (!open) return;
    setFormData({
      jobId: job?.jobId || "",
      title: job?.title || "",
      categoryId: job?.categoryId ?? categories[0]?.id ?? 0,
      location: job?.location || "",
      employmentType: job?.employmentType || "Full-time",
      experience: job?.experience || "",
      summary: job?.summary || "",
      description: job?.description || "",
      requirements: job?.requirements || "",
      isActive: job?.isActive !== undefined ? Boolean(job.isActive) : true,
    });
  }, [open, job, categories]);

  if (!open) return null;

  const setField = <K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const canSave =
    Boolean(categories.length) &&
    Boolean(formData.title.trim()) &&
    Number.isFinite(formData.categoryId) &&
    formData.categoryId > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      ...formData,
      jobId: formData.jobId.trim(),
      title: formData.title.trim(),
      categoryId: formData.categoryId,
    });
  };

  return (
    <AdminFormModalShell
      title={job ? "Edit Job Posting" : "Add Job Posting"}
      subtitle="Fill in the details below"
      onClose={onCancel}
      maxWidthClass="max-w-4xl"
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            data-testid="button-cancel-job"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(formData)}
            disabled={isLoading || !categories.length}
            className="px-6 py-2.5 bg-[#0D4A7A] text-white rounded-lg font-semibold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-save-job"
          >
            {isLoading ? "Saving..." : job ? "Update Job" : "Save Job"}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={ADMIN_FORM_LABEL_CLASS}>Job ID</label>
          <input
            value={formData.jobId}
            onChange={(e) => setField("jobId", e.target.value)}
            placeholder="e.g. NET-ENG-001"
            className={ADMIN_FORM_INPUT_CLASS}
            data-testid="input-jobid"
          />
        </div>
        <div>
          <label className={ADMIN_FORM_LABEL_CLASS}>Title</label>
          <input
            value={formData.title}
            onChange={(e) => setField("title", e.target.value)}
            placeholder="Job title"
            className={ADMIN_FORM_INPUT_CLASS}
            data-testid="input-title"
          />
        </div>
        <div>
          <label className={ADMIN_FORM_LABEL_CLASS}>Category</label>
          <select
            value={formData.categoryId || ""}
            onChange={(e) => setField("categoryId", parseInt(e.target.value, 10) || 0)}
            className={ADMIN_FORM_INPUT_CLASS}
            data-testid="select-category"
            disabled={!categories.length}
          >
            {categories.length === 0 ? (
              <option value="">No categories available — create one first</option>
            ) : (
              categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))
            )}
          </select>
        </div>
        <div>
          <label className={ADMIN_FORM_LABEL_CLASS}>Location</label>
          <input
            value={formData.location}
            onChange={(e) => setField("location", e.target.value)}
            placeholder="e.g. Singapore / Remote"
            className={ADMIN_FORM_INPUT_CLASS}
            data-testid="input-location"
          />
        </div>
        <div>
          <label className={ADMIN_FORM_LABEL_CLASS}>Employment Type</label>
          <select
            value={formData.employmentType}
            onChange={(e) => setField("employmentType", e.target.value)}
            className={ADMIN_FORM_INPUT_CLASS}
            data-testid="select-employment"
          >
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>
        </div>
        <div>
          <label className={ADMIN_FORM_LABEL_CLASS}>Experience</label>
          <input
            value={formData.experience}
            onChange={(e) => setField("experience", e.target.value)}
            placeholder="e.g. 3+ years"
            className={ADMIN_FORM_INPUT_CLASS}
            data-testid="input-experience"
          />
        </div>
      </div>

      <div>
        <label className={ADMIN_FORM_LABEL_CLASS}>Summary</label>
        <input
          value={formData.summary}
          onChange={(e) => setField("summary", e.target.value)}
          placeholder="Brief job summary"
          className={ADMIN_FORM_INPUT_CLASS}
          data-testid="input-summary"
        />
      </div>

      <div>
        <label className={ADMIN_FORM_LABEL_CLASS}>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setField("description", e.target.value)}
          placeholder="Full job description"
          rows={4}
          className={`${ADMIN_FORM_INPUT_CLASS} resize-none`}
          data-testid="input-description"
        />
      </div>

      <div>
        <label className={ADMIN_FORM_LABEL_CLASS}>Requirements</label>
        <textarea
          value={formData.requirements}
          onChange={(e) => setField("requirements", e.target.value)}
          placeholder="Job requirements"
          rows={4}
          className={`${ADMIN_FORM_INPUT_CLASS} resize-none`}
          data-testid="input-requirements"
        />
      </div>

      <JobStatusToggle
        isActive={formData.isActive}
        onChange={(active) => setField("isActive", active)}
      />
    </AdminFormModalShell>
  );
}

// =============================================================================
// CATEGORY FORM COMPONENT
// =============================================================================

function CategoryForm({
  open,
  category,
  onSave,
  onCancel,
  isLoading,
}: {
  open: boolean;
  category: JobCategory | null;
  onSave: (data: Partial<InsertJobCategory>) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (!open) return;
    setFormData({
      name: category?.name || "",
      description: category?.description || "",
    });
  }, [open, category]);

  if (!open) return null;

  return (
    <AdminFormModalShell
      title={category ? "Edit Category" : "Add Category"}
      subtitle="Fill in the details below"
      onClose={onCancel}
      maxWidthClass="max-w-2xl"
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            data-testid="button-cancel-category"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(formData)}
            disabled={isLoading}
            className="px-6 py-2.5 bg-[#0D4A7A] text-white rounded-lg font-semibold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-save-category"
          >
            {isLoading ? "Saving..." : category ? "Update Category" : "Save Category"}
          </button>
        </>
      }
    >
      <div>
        <label className={ADMIN_FORM_LABEL_CLASS}>Category Name</label>
        <input
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Category name"
          className={ADMIN_FORM_INPUT_CLASS}
          data-testid="input-category-name"
        />
      </div>
      <div>
        <label className={ADMIN_FORM_LABEL_CLASS}>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Category description"
          rows={4}
          className={`${ADMIN_FORM_INPUT_CLASS} resize-none`}
          data-testid="input-category-description"
        />
      </div>
    </AdminFormModalShell>
  );
}

// =============================================================================
// MAIN ADMIN CONTENT COMPONENT
const TABLE_PAGE_SIZE = 10;

function TablePagination({
  totalItems,
  currentPage,
  onPageChange,
}: {
  totalItems: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / TABLE_PAGE_SIZE));
  if (totalItems === 0) return null;

  const rangeStart = (currentPage - 1) * TABLE_PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * TABLE_PAGE_SIZE, totalItems);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-100 bg-[#FCFCFD]">
      <p className="text-sm text-gray-500">
        Showing {rangeStart}–{rangeEnd} of {totalItems}
      </p>
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white"
          aria-label="Previous page"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-medium text-gray-700 px-2 whitespace-nowrap">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white"
          aria-label="Next page"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

// =============================================================================

function AdminContent({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<TabType>('jobs');
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [editingCategory, setEditingCategory] = useState<JobCategory | null>(null);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Calendar state
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());

  // Applications state
  const [pendingUpdates, setPendingUpdates] = useState<Record<number, PendingStatusUpdate>>({});
  const [expandedApps, setExpandedApps] = useState<Set<number>>(new Set());
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [activeStatusTab, setActiveStatusTab] = useState<string>('Pending');
  const [activeSelectedSubTab, setActiveSelectedSubTab] = useState<string>('Offer Extended');
  const [meetingLinks, setMeetingLinks] = useState<Record<number, string>>({});
  const [rescheduleDialog, setRescheduleDialog] = useState<{ open: boolean; appId: number | null; message: string }>({
    open: false,
    appId: null,
    message: ''
  });
  const [rejectionSortOrder, setRejectionSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [inlineRemarksEditId, setInlineRemarksEditId] = useState<number | null>(null);
  const [inlineRemarksText, setInlineRemarksText] = useState<string>('');
  const [exportWarningDialog, setExportWarningDialog] = useState<{ open: boolean; missingApps: EnrichedApplication[] }>({ open: false, missingApps: [] });

  const [jobsSearch, setJobsSearch] = useState('');
  const [categoriesSearch, setCategoriesSearch] = useState('');
  const [usersSearch, setUsersSearch] = useState('');
  const [jobsPage, setJobsPage] = useState(1);
  const [categoriesPage, setCategoriesPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);

  // =============================================================================
  // QUERIES
  // =============================================================================

  const { data: jobs, isLoading: jobsLoading } = useQuery<JobPosting[]>({
    queryKey: ['jobs'],
    queryFn: () => apiFetch<JobPosting[]>('/api/jobs'),
  });

  const { data: categories } = useQuery<JobCategory[]>({
    queryKey: ['categories'],
    queryFn: () => apiFetch<JobCategory[]>('/api/categories'),
  });

  const { data: users, isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ['users'],
    queryFn: () => apiFetch<AdminUser[]>('/api/admin/users'),
    enabled: activeTab === 'users',
  });

  const { data: userDetails, isLoading: userDetailsLoading } = useQuery<UserDetails>({
    queryKey: ['user', selectedUserId],
    queryFn: () => apiFetch<UserDetails>(`/api/admin/users/${selectedUserId}`),
    enabled: selectedUserId !== null,
  });

  const { data: applications, isLoading: applicationsLoading } = useQuery<EnrichedApplication[]>({
    queryKey: ['applications'],
    queryFn: () => apiFetch<EnrichedApplication[]>('/api/admin/applications'),
    enabled: activeTab === 'applications',
    refetchInterval: 5000,
  });

  const { data: availableDates, isLoading: datesLoading } = useQuery<InterviewAvailableDate[]>({
    queryKey: ['interview-dates'],
    queryFn: () => apiFetch<InterviewAvailableDate[]>('/api/admin/interview-dates'),
    enabled: activeTab === 'slots',
  });

  const { data: slotSettings, isLoading: slotSettingsLoading } = useQuery<SlotSetting[]>({
    queryKey: ['slot-settings'],
    queryFn: () => apiFetch<SlotSetting[]>('/api/admin/slot-settings'),
    enabled: activeTab === 'slots',
  });

  const { data: interviewBookings, isLoading: bookingsLoading } = useQuery<InterviewBooking[]>({
    queryKey: ['interview-bookings'],
    queryFn: () => apiFetch<InterviewBooking[]>('/api/admin/interview-bookings'),
    enabled: activeTab === 'slots',
  });

  const buildAvailabilitySlots = (dates: string[]) => {
    const seenTimeSlots = new Set<string>();
    const uniqueActiveSlots = (slotSettings || [])
      .filter((slot) => slot.isActive)
      .slice()
      .sort((a, b) => a.round - b.round || a.timeSlot.localeCompare(b.timeSlot))
      .filter((slot) => {
        if (seenTimeSlots.has(slot.timeSlot)) return false;
        seenTimeSlots.add(slot.timeSlot);
        return true;
      })
      .map((slot) => {
        const roundMeta = SLOT_PANEL_META.find((meta) => meta.round === slot.round);
        return {
          timeSlot: slot.timeSlot,
          duration: roundMeta?.durationMinutes ?? 45,
        };
      });

    return dates.flatMap((date) =>
      uniqueActiveSlots.map((slot) => ({
        date,
        timeSlot: slot.timeSlot,
        duration: slot.duration,
      }))
    );
  };

  // =============================================================================
  // MUTATIONS
  // =============================================================================

  const toggleSlotMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiFetch(`/api/admin/slot-settings/${id}`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['slot-settings'] }),
  });

  const toggleDateMutation = useMutation({
    mutationFn: ({ date, isActive }: { date: string; isActive: boolean }) =>
      apiFetch('/api/admin/interview-dates/toggle', { method: 'POST', body: JSON.stringify({ date, isActive }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-dates'] });
      toast({ title: "Success", description: "Date availability updated" });
    },
    onError: () => toast({ title: "Error", description: "Failed to update date availability", variant: "destructive" }),
  });

  const removeDateMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/admin/interview-dates/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-dates'] });
      toast({ title: "Success", description: "Date removed" });
    },
    onError: () => toast({ title: "Error", description: "Failed to remove date", variant: "destructive" }),
  });

  const bulkUpdateDatesMutation = useMutation({
    mutationFn: ({ dates, isActive }: { dates: string[]; isActive: boolean }) =>
      apiFetch('/api/admin/interview-dates/bulk-update', { method: 'POST', body: JSON.stringify({ dates, isActive }) }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['interview-dates'] });
      setSelectedDates([]);
      const slots = variables.isActive && variables.dates.length > 0 ? buildAvailabilitySlots(variables.dates) : [];
      if (variables.isActive && variables.dates.length > 0) {
        if (slots.length > 0) {
          apiFetch('/api/admin/interview-availability/bulk', {
            method: 'POST',
            body: JSON.stringify({ slots }),
          })
            .then(() => {
              queryClient.invalidateQueries({ queryKey: ['interview-bookings'] });
              toast({
                title: "Success",
                description: `${variables.dates.length} date(s) updated and slots saved`,
              });
            })
            .catch(() => {
              toast({ title: "Warning", description: "Dates were saved, but slots could not be created.", variant: "destructive" });
            });
          return;
        }
      }
      toast({ title: "Success", description: `${variables.dates.length} date(s) updated` });
    },
    onError: () => toast({ title: "Error", description: "Failed to update dates", variant: "destructive" }),
  });

  const blockUserMutation = useMutation({
    mutationFn: ({ userId, isBlocked }: { userId: number; isBlocked: boolean }) =>
      apiFetch(`/api/admin/users/${userId}/block`, { method: 'PATCH', body: JSON.stringify({ isBlocked }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', selectedUserId] });
      toast({ title: "Success", description: "User status updated" });
    },
    onError: () => toast({ title: "Error", description: "Failed to update user status", variant: "destructive" }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) =>
      apiFetch(`/api/admin/users/${userId}`, { method: 'DELETE' }),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', selectedUserId] });
      if (selectedUserId === userId) {
        setSelectedUserId(null);
      }
      toast({ title: "Success", description: "User deleted successfully" });
    },
    onError: (err) => toast({
      title: "Error",
      description: err instanceof Error ? err.message : "Failed to delete user",
      variant: "destructive"
    }),
  });

  const createJobMutation = useMutation({
    mutationFn: (data: InsertJobPosting) => apiFetch('/api/jobs', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setShowJobForm(false);
      setEditingJob(null);
      toast({ title: "Success", description: "Job created successfully" });
    },
    onError: (err) => toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to create job", variant: "destructive" }),
  });

  const updateJobMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertJobPosting> }) =>
      apiFetch(`/api/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setShowJobForm(false);
      setEditingJob(null);
      toast({ title: "Success", description: "Job updated successfully" });
    },
    onError: (err) => toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to update job", variant: "destructive" }),
  });

  const deleteJobMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/jobs/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast({ title: "Success", description: "Job deleted successfully" });
    },
    onError: () => toast({ title: "Error", description: "Failed to delete job", variant: "destructive" }),
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: InsertJobCategory) => apiFetch('/api/categories', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setShowCategoryForm(false);
      setEditingCategory(null);
      toast({ title: "Success", description: "Category created successfully" });
    },
    onError: () => toast({ title: "Error", description: "Failed to create category", variant: "destructive" }),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertJobCategory> }) =>
      apiFetch(`/api/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setEditingCategory(null);
      toast({ title: "Success", description: "Category updated successfully" });
    },
    onError: () => toast({ title: "Error", description: "Failed to update category", variant: "destructive" }),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: "Success", description: "Category deleted successfully" });
    },
    onError: () => toast({ title: "Error", description: "Failed to delete category", variant: "destructive" }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, remarks, internalRemarks }: { id: number; status: string; remarks?: string | null; internalRemarks?: string }) =>
      apiFetch<{ success?: boolean; bookingLink?: string | null; emailType?: string | null }>(`/api/admin/applications/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, remarks, internalRemarks })
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setPendingUpdates(prev => {
        const updated = { ...prev };
        delete updated[variables.id];
        return updated;
      });
      if (data?.bookingLink) {
        toast({
          title: "Interview invitation sent",
          description: `Booking link: ${data.bookingLink}`,
        });
      } else {
        toast({ title: "Success", description: "Status updated and email sent" });
      }
    },
    onError: (err) => toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to update status", variant: "destructive" }),
  });

  const updateInternalRemarksMutation = useMutation({
    mutationFn: ({ id, internalRemarks }: { id: number; internalRemarks: string }) =>
      apiFetch(`/api/admin/applications/${id}/internal-remarks`, {
        method: 'PATCH',
        body: JSON.stringify({ internalRemarks })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setInlineRemarksEditId(null);
      setInlineRemarksText('');
      toast({ title: "Saved", description: "Internal rejection reason updated." });
    },
    onError: (err) => toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to update", variant: "destructive" }),
  });

  const scheduleInterviewMutation = useMutation({
    mutationFn: ({ id, scheduledDate, scheduledTime }: { id: number; scheduledDate: string; scheduledTime: string }) =>
      apiFetch(`/api/admin/applications/${id}/schedule-interview`, {
        method: 'POST',
        body: JSON.stringify({ scheduledDate, scheduledTime })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast({ title: "Success", description: "Interview scheduled! Confirmation request sent." });
    },
    onError: (err) => toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to schedule", variant: "destructive" }),
  });

  const resendConfirmationMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch<{ success?: boolean; bookingLink?: string | null }>(`/api/admin/applications/${id}/resend-confirmation`, { method: 'POST' }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      if (data?.bookingLink) {
        toast({
          title: "Interview invitation sent",
          description: `Booking link: ${data.bookingLink}`,
        });
      } else {
        toast({ title: "Success", description: "Confirmation email resent." });
      }
    },
    onError: (err) => toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to resend", variant: "destructive" }),
  });

  const saveMeetingLinkMutation = useMutation({
    mutationFn: ({ appId, meetingLink }: { appId: number; meetingLink: string }) =>
      apiFetch(`/api/admin/applications/${appId}/meeting-link`, {
        method: 'PATCH',
        body: JSON.stringify({ meetingLink })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast({ title: "Meeting Link Saved", description: "Email sent to candidate." });
    },
    onError: (err) => toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to save", variant: "destructive" }),
  });

  const requestRescheduleMutation = useMutation({
    mutationFn: ({ id, message }: { id: number; message?: string }) =>
      apiFetch(`/api/admin/applications/${id}/request-reschedule`, {
        method: 'POST',
        body: JSON.stringify({ message })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast({ title: "Success", description: "Reschedule request sent!" });
    },
    onError: (err) => toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to request reschedule", variant: "destructive" }),
  });

  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================

  const getCategoryName = (categoryId: number) => {
    return categories?.find(cat => cat.id === categoryId)?.name || 'Unknown';
  };

  useEffect(() => { setJobsPage(1); }, [jobsSearch]);
  useEffect(() => { setCategoriesPage(1); }, [categoriesSearch]);
  useEffect(() => { setUsersPage(1); }, [usersSearch]);

  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    const q = jobsSearch.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((job) =>
      job.title?.toLowerCase().includes(q) ||
      job.jobId?.toLowerCase().includes(q) ||
      job.location?.toLowerCase().includes(q) ||
      job.employmentType?.toLowerCase().includes(q) ||
      getCategoryName(job.categoryId).toLowerCase().includes(q)
    );
  }, [jobs, jobsSearch, categories]);

  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    const q = categoriesSearch.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((cat) =>
      cat.name?.toLowerCase().includes(q) ||
      cat.description?.toLowerCase().includes(q)
    );
  }, [categories, categoriesSearch]);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const q = usersSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) =>
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q) ||
      user.mobileNumber?.toLowerCase().includes(q)
    );
  }, [users, usersSearch]);

  const paginatedJobs = useMemo(
    () => filteredJobs.slice((jobsPage - 1) * TABLE_PAGE_SIZE, jobsPage * TABLE_PAGE_SIZE),
    [filteredJobs, jobsPage]
  );

  const paginatedCategories = useMemo(
    () => filteredCategories.slice((categoriesPage - 1) * TABLE_PAGE_SIZE, categoriesPage * TABLE_PAGE_SIZE),
    [filteredCategories, categoriesPage]
  );

  const paginatedUsers = useMemo(
    () => filteredUsers.slice((usersPage - 1) * TABLE_PAGE_SIZE, usersPage * TABLE_PAGE_SIZE),
    [filteredUsers, usersPage]
  );

  useEffect(() => {
    const jobsTotalPages = Math.max(1, Math.ceil(filteredJobs.length / TABLE_PAGE_SIZE));
    if (jobsPage > jobsTotalPages) setJobsPage(jobsTotalPages);
  }, [filteredJobs.length, jobsPage]);

  useEffect(() => {
    const categoriesTotalPages = Math.max(1, Math.ceil(filteredCategories.length / TABLE_PAGE_SIZE));
    if (categoriesPage > categoriesTotalPages) setCategoriesPage(categoriesTotalPages);
  }, [filteredCategories.length, categoriesPage]);

  useEffect(() => {
    const usersTotalPages = Math.max(1, Math.ceil(filteredUsers.length / TABLE_PAGE_SIZE));
    if (usersPage > usersTotalPages) setUsersPage(usersTotalPages);
  }, [filteredUsers.length, usersPage]);

  const normalizeStatus = (status: string | null | undefined): string => {
    if (!status || status.trim() === '') return 'Pending';
    const key = status.trim().toLowerCase().replace(/[\s-]+/g, '_');
    const aliases: Record<string, string> = {
      submitted: 'Pending',
      pending: 'Pending',
      under_review: 'Under Review',
      shortlisted: 'Shortlisted',
      interview_scheduled: 'Interview Scheduled',
      interview_completed: 'Interview Completed',
      round_1_scheduled: 'Round 1 Scheduled',
      round_1_confirmed: 'Round 1 Confirmed',
      round_1_completed: 'Round 1 Completed',
      round_1_selected: 'Round 1 Selected',
      round_2_scheduled: 'Round 2 Scheduled',
      round_2_confirmed: 'Round 2 Confirmed',
      round_2_selected: 'Round 2 Selected',
      round_3_scheduled: 'Round 3 Scheduled',
      round_3_confirmed: 'Round 3 Confirmed',
      round_3_selected: 'Round 3 Selected',
    };
    return aliases[key] ?? status;
  };

  const getTabCount = (tabKey: string) => {
    if (!applications) return 0;
    const statuses = STATUS_TABS.find(t => t.key === tabKey)?.statuses || [];
    return applications.filter(app => statuses.includes(normalizeStatus(app.status))).length;
  };

  const getSubTabCount = (status: string) => {
    if (!applications) return 0;
    return applications.filter(app => normalizeStatus(app.status) === status).length;
  };

  const getApplicationsForTab = (tabKey: string) => {
    if (!applications) return [];
    const statuses = STATUS_TABS.find(t => t.key === tabKey)?.statuses || [];
    return applications.filter(app => {
      const matchesStatus = statuses.includes(normalizeStatus(app.status));
      const matchesSearch = appSearchQuery === '' ||
        app.applicantName.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
        app.applicantEmail.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
        app.jobTitle.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
        app.jobIdCode.toLowerCase().includes(appSearchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  };

  const toggleAppExpand = (appId: number) => {
    setExpandedApps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(appId)) newSet.delete(appId);
      else newSet.add(appId);
      return newSet;
    });
  };

  const initPendingUpdate = (appId: number, currentStatus: string, currentRemarks: string | null) => {
    if (!pendingUpdates[appId]) {
      setPendingUpdates(prev => ({
        ...prev,
        [appId]: { status: currentStatus, remarks: currentRemarks || '', internalRemarks: '' }
      }));
    }
  };

  const updatePendingStatus = (appId: number, status: string) => {
    setPendingUpdates(prev => ({
      ...prev,
      [appId]: { ...prev[appId], status }
    }));
  };

  const updatePendingRemarks = (appId: number, remarks: string) => {
    setPendingUpdates(prev => ({
      ...prev,
      [appId]: { ...prev[appId], remarks }
    }));
  };

  const updatePendingInternalRemarks = (appId: number, internalRemarks: string) => {
    setPendingUpdates(prev => ({
      ...prev,
      [appId]: { ...prev[appId], internalRemarks }
    }));
  };

  const submitStatusUpdate = (appId: number) => {
    const pending = pendingUpdates[appId];
    if (!pending) return;
    if (REJECTION_REQUIRES_REMARKS.includes(pending.status) && !pending.internalRemarks.trim()) {
      toast({ title: "Required", description: "Please enter an internal rejection reason.", variant: "destructive" });
      return;
    }
    updateStatusMutation.mutate({
      id: appId,
      status: pending.status,
      remarks: pending.remarks.trim() || null,
      internalRemarks: REJECTION_REQUIRES_REMARKS.includes(pending.status) ? pending.internalRemarks.trim() : undefined
    });
  };

  const exportJobsExcel = () => {
    if (!filteredJobs.length) return;
    const headers = ['Job ID', 'Category', 'Title', 'Location', 'Type', 'Experience', 'Status'];
    const rows = filteredJobs.map((job) => [
      job.jobId || '',
      getCategoryName(job.categoryId),
      job.title || '',
      job.location || '',
      job.employmentType || '',
      job.experience || '',
      job.isActive ? 'Active' : 'Inactive',
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `job_postings_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportUsersCSV = () => {
    if (!users || users.length === 0) return;
    const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Mobile', 'Email Verified', 'Status', 'Joined Date'];
    const rows = users.map(u => [
      u.id,
      u.firstName,
      u.lastName,
      u.email,
      u.mobileNumber || '',
      u.emailVerified ? 'Yes' : 'No',
      u.isBlocked ? 'Blocked' : 'Active',
      new Date(u.createdAt).toLocaleDateString('en-IN'),
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `netopsys_users_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const doExportRejectionsPDF = async (apps: EnrichedApplication[]) => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    doc.setFontSize(16);
    doc.setTextColor(80, 30, 160);
    doc.text('Netopsys — Rejected Applications Report', 14, 16);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST  |  Total: ${apps.length} records`, 14, 22);

    const sorted = [...apps].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    autoTable(doc, {
      startY: 27,
      head: [['#', 'Name', 'Email', 'Job Title', 'Job ID', 'Rejection Status', 'Internal Reason', 'Applied On']],
      body: sorted.map((app, i) => [
        i + 1,
        app.applicantName,
        app.applicantEmail,
        app.jobTitle,
        app.jobIdCode,
        app.status,
        app.internalRemarks || '—',
        new Date(app.createdAt).toLocaleDateString('en-IN'),
      ]),
      styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
      headStyles: { fillColor: [80, 30, 160], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 243, 255] },
      columnStyles: { 6: { cellWidth: 65 } },
      margin: { left: 14, right: 14 },
    });

    doc.save(`netopsys_rejections_${new Date().toISOString().split('T')[0]}.pdf`);
    setExportWarningDialog({ open: false, missingApps: [] });
  };

  const exportRejectionsPDF = () => {
    const rejectedApps = (applications || []).filter(app => REJECTION_STATUSES_ALL.includes(app.status));
    if (rejectedApps.length === 0) {
      toast({ title: "No Data", description: "No rejected applications found.", variant: "destructive" });
      return;
    }
    const missingRemarks = rejectedApps.filter(app => REJECTION_REQUIRES_REMARKS.includes(app.status) && !app.internalRemarks?.trim());
    if (missingRemarks.length > 0) {
      setExportWarningDialog({ open: true, missingApps: missingRemarks });
      return;
    }
    doExportRejectionsPDF(rejectedApps);
  };

  const renderSlotsPanel = () => {
    const visibleDates = (availableDates || [])
      .filter((item) => item.isActive)
      .slice()
      .sort((a, b) => a.availableDate.localeCompare(b.availableDate));
    const monthStart = new Date(calendarYear, calendarMonth, 1);
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const firstDayOfWeek = monthStart.getDay();
    const monthLabel = monthStart.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    const calendarDates: JSX.Element[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < firstDayOfWeek; i++) {
      calendarDates.push(<div key={`empty-${i}`} className="min-h-[44px] sm:min-h-[52px]" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dateStatus = getDateRecordStatus(dateKey, availableDates);
      const isPast = isBeforeToday(dateKey);
      const isSunday = parseDateKey(dateKey).getDay() === 0;
      const isSelected = selectedDates.includes(dateKey);
      const isInteractive = !(isPast || isSunday);

      const baseButtonClasses =
        "relative min-h-[44px] sm:min-h-[52px] rounded-2xl border text-sm sm:text-base font-semibold transition-all duration-200";
      const statusClasses = isPast || isSunday
        ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
        : isSelected
          ? "border-violet-500 bg-violet-50 text-violet-800 ring-2 ring-violet-200"
          : dateStatus === 'available'
            ? "border-emerald-400 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            : dateStatus === 'not-available'
              ? "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
              : "border-gray-200 bg-white text-gray-700 hover:border-[#0D4A7A]/40 hover:bg-gray-50";

      calendarDates.push(
        <button
          key={dateKey}
          type="button"
          disabled={!isInteractive || bulkUpdateDatesMutation.isPending}
          onClick={() => {
            if (!isInteractive) return;
            setSelectedDates((prev) =>
              prev.includes(dateKey) ? prev.filter((value) => value !== dateKey) : [...prev, dateKey]
            );
          }}
          className={`${baseButtonClasses} ${statusClasses}`}
          title={
            isSunday
              ? 'Sundays not available'
              : isPast
                ? 'Past date'
                : isSelected
                  ? 'Selected'
                  : dateStatus === 'available'
                    ? 'Available'
                    : dateStatus === 'not-available'
                      ? 'Not available'
                      : 'Not set'
          }
        >
          {day}
          {isSelected && (
            <span className="absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-violet-500 text-white shadow-lg shadow-violet-500/30">
              <CheckCircle className="h-3 w-3" />
            </span>
          )}
        </button>
      );
    }

    return (
      <div className="space-y-6">
       

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left: Calendar + available dates list */}
          <div className="space-y-6 lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 lg:p-7 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#eef2ff] text-[#0D4A7A] shrink-0">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-semibold text-[#0D4A7A]">
                      Interview Availability Calendar
                    </h3>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {visibleDates.length} open date{visibleDates.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    Click one or more dates, then mark them <strong className="text-emerald-700">Available</strong>.
                    Active time slots from Step 1 are automatically created for each available date.
                    Candidates only see available dates when booking.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (calendarMonth === 0) {
                      setCalendarMonth(11);
                      setCalendarYear((year) => year - 1);
                    } else {
                      setCalendarMonth((month) => month - 1);
                    }
                    setSelectedDates([]);
                  }}
                  className="grid h-9 w-9 place-items-center rounded-full border border-gray-200 bg-white text-[#0D4A7A] transition-colors hover:bg-gray-50"
                  aria-label="Previous month"
                >
                  <ChevronDown className="h-4 w-4 rotate-90" />
                </button>
                <span className="text-lg font-semibold text-[#0D4A7A]">{monthLabel}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (calendarMonth === 11) {
                      setCalendarMonth(0);
                      setCalendarYear((year) => year + 1);
                    } else {
                      setCalendarMonth((month) => month + 1);
                    }
                    setSelectedDates([]);
                  }}
                  className="grid h-9 w-9 place-items-center rounded-full border border-gray-200 bg-white text-[#0D4A7A] transition-colors hover:bg-gray-50"
                  aria-label="Next month"
                >
                  <ChevronDown className="h-4 w-4 -rotate-90" />
                </button>
              </div>

              <div className="mt-5 grid grid-cols-7 gap-1.5 sm:gap-2">
                {MONTH_DAY_LABELS.map((day) => (
                  <div key={day} className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {day}
                  </div>
                ))}
                {calendarDates}
              </div>

              <div className="mt-6 rounded-xl border border-gray-200 bg-[#F8FAFC] p-4 sm:p-5">
                <p className="text-sm font-medium text-[#0D4A7A]">
                  {selectedDates.length > 0
                    ? `${selectedDates.length} date${selectedDates.length !== 1 ? 's' : ''} selected — choose an action below`
                    : 'Select dates on the calendar above, then apply a status'}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Sundays and past dates cannot be selected. Unselected dates remain &quot;Not set&quot;.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    type="button"
                    onClick={() => bulkUpdateDatesMutation.mutate({ dates: selectedDates, isActive: true })}
                    disabled={selectedDates.length === 0 || bulkUpdateDatesMutation.isPending}
                    className="h-11 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark Available
                  </Button>
                  <Button
                    type="button"
                    onClick={() => bulkUpdateDatesMutation.mutate({ dates: selectedDates, isActive: false })}
                    disabled={selectedDates.length === 0 || bulkUpdateDatesMutation.isPending}
                    variant="outline"
                    className="h-11 rounded-xl border-rose-300 text-rose-700 hover:bg-rose-50 px-5 text-sm font-semibold"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Mark Not Available
                  </Button>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded border border-emerald-400 bg-emerald-50" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded border border-rose-300 bg-rose-50" />
                  <span>Not Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded border border-violet-500 bg-violet-50 ring-1 ring-violet-200" />
                  <span>Selected (pending action)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded border border-gray-200 bg-white" />
                  <span>Not set</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.08 }}
              className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 lg:p-7 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-[#0D4A7A]">
                Open Dates Summary
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Dates currently visible to candidates for interview booking.
              </p>

              <div className="mt-5 space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {datesLoading ? (
                  <div className="py-6 text-center text-sm text-gray-500">Loading dates...</div>
                ) : visibleDates.length > 0 ? (
                  visibleDates.map((date) => (
                    <div
                      key={date.id}
                      className="flex items-center justify-between rounded-xl border border-gray-200 bg-[#F8FAFC] px-4 py-3.5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#0D4A7A] truncate">
                            {formatCalendarLabel(date.availableDate)}
                          </p>
                          <p className="text-xs text-emerald-700">Available for booking</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeDateMutation.mutate(date.id)}
                        disabled={removeDateMutation.isPending}
                        className="grid h-9 w-9 place-items-center rounded-lg text-rose-600 transition-colors hover:bg-rose-50 shrink-0"
                        title="Remove this date from availability"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center">
                    <p className="text-sm text-gray-600 font-medium">No open dates yet</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Select dates on the calendar and click &quot;Mark Available&quot; to open them for candidates.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right sidebar: time slots first, then bookings */}
          <div className="space-y-6 lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.04 }}
              className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef2ff] text-[#0D4A7A] shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#0D4A7A]">Time Slot Control</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Choose which time slots are offered for each interview round. Only <strong>active</strong> slots
                    are created when you mark a date available.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {slotSettingsLoading ? (
                  <div className="py-6 text-center text-sm text-gray-500">Loading time slots...</div>
                ) : (
                  SLOT_PANEL_META.map((roundMeta) => {
                    const roundSlots = (slotSettings || [])
                      .filter((slot) => slot.round === roundMeta.round)
                      .slice()
                      .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
                    const activeCount = roundSlots.filter((slot) => slot.isActive).length;

                    return (
                      <div key={roundMeta.round} className="rounded-xl border border-gray-200 bg-[#F8FAFC] p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-[#0D4A7A]">{roundMeta.label}</p>
                            <p className="mt-0.5 text-xs text-gray-500">
                              Duration: {roundMeta.duration} · {activeCount} of {roundSlots.length} slots active
                            </p>
                          </div>
                        </div>

                        <p className="mt-2 text-xs text-gray-500">
                          Click a time to toggle it on or off for candidate booking.
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {roundSlots.map((slot) => (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => toggleSlotMutation.mutate({ id: slot.id, isActive: !slot.isActive })}
                              disabled={toggleSlotMutation.isPending}
                              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                                slot.isActive
                                  ? 'border-emerald-400 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                  : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {formatSlotLabel(slot.timeSlot)}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.12 }}
              className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef2ff] text-[#0D4A7A] shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#0D4A7A]">Interview Bookings</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Confirmed slots after candidates book from their portal email invitation.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {bookingsLoading ? (
                  <div className="py-6 text-center text-sm text-gray-500">Loading bookings...</div>
                ) : interviewBookings && interviewBookings.length > 0 ? (
                  <>
                    {interviewBookings.slice(0, 8).map((booking) => (
                      <div
                        key={booking.id}
                        className="rounded-xl border border-gray-200 bg-[#F8FAFC] p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#0D4A7A] truncate">
                              {booking.candidateName || 'Candidate'}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500 truncate">
                              {booking.applicationNumber ? `#${booking.applicationNumber}` : 'Application'}
                              {booking.jobTitle ? ` · ${booking.jobTitle}` : ''}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-[#0D4A7A]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#0D4A7A]">
                            Booked
                          </span>
                        </div>
                        <div className="mt-3 space-y-1 text-xs text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            {formatCalendarLabel(booking.date)}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            {formatSlotLabel(booking.timeSlot)}
                            {booking.interviewerName ? ` · ${booking.interviewerName}` : ''}
                          </div>
                          {booking.location && (
                            <div className="text-gray-500 truncate">{booking.location}</div>
                          )}
                        </div>
                      </div>
                    ))}
                    {interviewBookings.length > 8 && (
                      <p className="text-xs text-center text-gray-500 pt-1">
                        Showing 8 of {interviewBookings.length} bookings
                      </p>
                    )}
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center">
                    <Mail className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 font-medium">No bookings yet</p>
                    <p className="text-xs text-gray-500 mt-1 max-w-[240px] mx-auto">
                      When you shortlist a candidate in Applications, they receive available slots by email and can book here.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="pt-4 sm:pt-6 pb-6 bg-gray-50 relative">
            <div className="container mx-auto px-4 sm:px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
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
                <h1 className="text-3xl md:text-4xl font-bold text-[#0D4A7A] mb-1">Job Management</h1>

              </div>
            </div>
          </div>
      </section>

      <section className="py-6 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
        <div className="flex gap-2 mb-8 overflow-x-auto pb-1 scrollbar-hide">
  {[
    { id: 'jobs', icon: <Briefcase className="w-4 h-4" />, label: 'Job Postings', testId: 'tab-jobs', onClick: () => setActiveTab('jobs') },
    { id: 'categories', icon: <FolderOpen className="w-4 h-4" />, label: 'Categories', testId: 'tab-categories', onClick: () => setActiveTab('categories') },
    { id: 'applications', icon: <FileText className="w-4 h-4" />, label: 'Applications', testId: 'tab-applications', onClick: () => setActiveTab('applications') },
    { id: 'users', icon: <Users className="w-4 h-4" />, label: 'Users', testId: 'tab-users', onClick: () => { setActiveTab('users'); setSelectedUserId(null); } },
    { id: 'slots', icon: <Calendar className="w-4 h-4" />, label: 'Interview Slots', testId: 'tab-slots', onClick: () => setActiveTab('slots') },
  ].map(tab => (
    <button
      key={tab.id}
      onClick={tab.onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap text-sm flex-shrink-0 border
        ${activeTab === tab.id
          ? 'bg-[#0D4A7A] text-white border-[#0D4A7A]'
          : 'bg-white text-[#0D4A7A] border-[#0D4A7A] hover:bg-[#0D4A7A] hover:text-white'
        }`}
      data-testid={tab.testId}
    >
      {tab.icon}
      <span className="hidden sm:inline">{tab.label}</span>
      <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
    </button>
  ))}
</div>

          {/* JOBS TAB */}
          {activeTab === 'jobs' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Job Postings ({filteredJobs.length})</h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative w-full sm:w-[280px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      placeholder="Search jobs..."
                      value={jobsSearch}
                      onChange={(e) => setJobsSearch(e.target.value)}
                      className="pl-10 bg-white border-gray-200"
                    />
                  </div>
        
                  <Button
                    onClick={() => { setShowJobForm(true); setEditingJob(null); }}
                    className="bg-[#0D4A7A] font-bold text-white px-5 py-2.5 rounded-xl"
                    data-testid="button-add-job"
                  >
                    Add Job
                  </Button>
                </div>
              </div>

              <JobForm
                open={showJobForm}
                job={editingJob}
                categories={categories || []}
                onSave={(data) => {
                  if (editingJob) {
                    updateJobMutation.mutate({ id: editingJob.id, data });
                  } else {
                    createJobMutation.mutate(data as InsertJobPosting);
                  }
                }}
                onCancel={() => { setShowJobForm(false); setEditingJob(null); }}
                isLoading={createJobMutation.isPending || updateJobMutation.isPending}
              />

        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
  {jobsLoading ? (
    <div className="text-center py-8 text-gray-500">Loading...</div>
  ) : filteredJobs.length > 0 ? (
    <table className="w-full min-w-[1000px]">
      <thead className="bg-[#eef2ff] border-b-2 border-blue-200">
        <tr>
          <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Job ID</th>
          <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Category</th>
          <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Title</th>
          <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Location</th>
          <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Type</th>
          <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Experience</th>
          <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Status</th>
          <th className="px-6 py-4 text-center text-sm font-semibold text-blue-900">Actions</th>
        </tr>
      </thead>

      <tbody>
        {paginatedJobs.map((job) => (
          <motion.tr
            key={job.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border-b border-gray-200 hover:bg-gray-50 transition"
            data-testid={`admin-job-${job.id}`}
          >
            <td className="px-6 py-4">
              <span className="text-xs  text-gray-900 px-3 py-1 rounded-md">
                {job.jobId}
              </span>
            </td>

            <td className="px-6 py-4">
              <span className="text-xs  text-gray-900 px-3 py-1 rounded-md">
                {getCategoryName(job.categoryId)}
              </span>
            </td>

            <td className="px-6 py-4 text-sm  text-gray-900">
              {job.title}
            </td>

            <td className="px-6 py-4 text-sm text-gray-900">
              {job.location}
            </td>

            <td className="px-6 py-4 text-sm text-gray-900">
              {job.employmentType}
            </td>

            <td className="px-6 py-4 text-sm text-gray-900">
              {job.experience}
            </td>

            <td className="px-6 py-4">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  job.isActive
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {job.isActive ? "Active" : "Inactive"}
              </span>
            </td>

            <td className="px-6 py-4">
              <div className="flex items-center justify-center gap-3">
                <Button
                  onClick={() => {
                    setEditingJob(job);
                    setShowJobForm(true);
                  }}
             
                  data-testid={`button-edit-job-${job.id}`}
                >
                    <Pencil size="16" />
          
                </Button>

                <Button
                  onClick={() => deleteJobMutation.mutate(job.id)}
       
                  data-testid={`button-delete-job-${job.id}`}
                >
                  <Trash2 size="16" />
            
                </Button>
              </div>
            </td>
          </motion.tr>
        ))}
      </tbody>
    </table>
  ) : (
    <div className="text-center py-8 text-gray-500">
      {jobsSearch ? 'No jobs match your search' : 'No job postings yet'}
      </div>
  )}
      <TablePagination
        totalItems={filteredJobs.length}
        currentPage={jobsPage}
        onPageChange={setJobsPage}
      />
      </div>
            </div>
          )}

          {/* CATEGORIES TAB */}
          {activeTab === 'categories' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Categories ({filteredCategories.length})</h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative w-full sm:w-[280px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      placeholder="Search categories..."
                      value={categoriesSearch}
                      onChange={(e) => setCategoriesSearch(e.target.value)}
                      className="pl-10 bg-white border-gray-200"
                    />
                  </div>
                  <Button
                    onClick={() => { setShowCategoryForm(true); setEditingCategory(null); }}
                    className="bg-[#0D4A7A] text-white"
                    data-testid="button-add-category"
                  >
                    Add Category
                  </Button>
                </div>
              </div>

              <CategoryForm
                open={showCategoryForm}
                category={editingCategory}
                onSave={(data) => {
                  if (editingCategory) {
                    updateCategoryMutation.mutate({ id: editingCategory.id, data });
                  } else {
                    createCategoryMutation.mutate(data as InsertJobCategory);
                  }
                }}
                onCancel={() => { setShowCategoryForm(false); setEditingCategory(null); }}
                isLoading={createCategoryMutation.isPending || updateCategoryMutation.isPending}
              />

             <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
  {filteredCategories.length > 0 ? (
    <table className="w-full min-w-[700px]">
      <thead className="bg-[#eef2ff] border-b-2 border-blue-200">
        <tr>
          <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">
            Category Name
          </th>

          <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">
            Description
          </th>

          <th className="px-6 py-4 text-center text-sm font-semibold text-blue-900">
            Actions
          </th>
        </tr>
      </thead>

      <tbody>
        {paginatedCategories.map((category) => (
          <motion.tr
            key={category.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border-b border-gray-200 hover:bg-gray-50 transition"
            data-testid={`admin-category-${category.id}`}
          >
            <td className="px-6 py-4 text-sm text-gray-900 font-medium">
              {category.name}
            </td>

            <td className="px-6 py-4 text-sm text-gray-600">
              {category.description || "No description"}
            </td>

            <td className="px-6 py-4">
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingCategory(category);
                    setShowCategoryForm(true);
                  }}
                  className="border-0 shadow-none"
                  data-testid={`button-edit-category-${category.id}`}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteCategoryMutation.mutate(category.id)}
                  className="border-0 shadow-none "
                  data-testid={`button-delete-category-${category.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </td>
          </motion.tr>
        ))}
      </tbody>
    </table>
  ) : (
    <div className="text-center py-8 text-gray-500">
      {categoriesSearch ? 'No categories match your search' : 'No categories yet'}
    </div>
  )}
  <TablePagination
    totalItems={filteredCategories.length}
    currentPage={categoriesPage}
    onPageChange={setCategoriesPage}
  />
</div>
            </div>
          )}

          {/* APPLICATIONS TAB */}
          {activeTab === 'applications' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Applications ({applications?.length || 0})</h2>
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Search by name, email, or job title..."
                    value={appSearchQuery}
                    onChange={(e) => setAppSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-100 border-gray-300 text-gray-900"
                    data-testid="input-search-applications"
                  />
                </div>
              </div>

              <div className="mb-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  {STATUS_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveStatusTab(tab.key)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeStatusTab === tab.key
                        ? 'bg-[#0d4A7A] text-white'
                        : 'bg-white text-[#0D4A7A] '
                        }`}
                      data-testid={`tab-status-${tab.key}`}
                    >
                      {tab.label}
                      <span className={`px-2 py-0.5 rounded-full text-xs ${activeStatusTab === tab.key
                        ? ' text-white'
                        : 'bg-blue-100 text-gray-500'
                        }`}>
                        {getTabCount(tab.key)}
                      </span>
                    </button>
                  ))}
                </div>

                {activeStatusTab === 'Selected' && (
                  <div className="flex gap-2 ml-4 mb-4">
                    {SELECTED_SUB_TABS.map((subTab) => (
                      <button
                        key={subTab}
                        onClick={() => setActiveSelectedSubTab(subTab)}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-2 ${activeSelectedSubTab === subTab
                          ? 'bg-green-600 text-gray-900'
                          : 'bg-gray-700 text-gray-500 hover:bg-gray-600 hover:text-gray-900'
                          }`}
                        data-testid={`subtab-${subTab}`}
                      >
                        {subTab}
                        <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeSelectedSubTab === subTab
                          ? 'bg-green-500/50 text-gray-900'
                          : 'bg-gray-600 text-gray-500'
                          }`}>
                          {getSubTabCount(subTab)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {activeStatusTab === 'Rejected' && (
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs">Sort:</span>
                    <button
                      onClick={() => setRejectionSortOrder('newest')}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${rejectionSortOrder === 'newest' ? 'bg-[#0D4A7A] text-white' : 'bg-white text-black '}`}
                    >Newest First</button>
                    <button
                      onClick={() => setRejectionSortOrder('oldest')}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${rejectionSortOrder === 'oldest' ? 'bg-[#0D4A7A] text-white' : 'bg-white text-black '}`}
                    >Oldest First</button>
                  </div>
                  <Button
                    size="sm"
                    className="text-xs bg-[#0D4A7A] hover:bg-purple-600 text-white gap-1.5"
                    onClick={exportRejectionsPDF}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    Export PDF
                  </Button>
                </div>
              )}

              <div className="space-y-3">
                {applicationsLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : (() => {
                  const currentApps = activeStatusTab === 'Selected'
                    ? (applications || []).filter(app => normalizeStatus(app.status) === activeSelectedSubTab)
                    : getApplicationsForTab(activeStatusTab);

                  const todayStr = new Date().toISOString().split('T')[0];
                  const isScheduledTab = activeStatusTab === 'Interview Scheduled';

                  const upcomingApps = isScheduledTab
                    ? currentApps.filter(a => a.scheduledInterviewDate && a.scheduledInterviewDate >= todayStr).sort((a, b) => (a.scheduledInterviewDate || '').localeCompare(b.scheduledInterviewDate || ''))
                    : currentApps;
                  const missedApps = isScheduledTab
                    ? currentApps.filter(a => a.scheduledInterviewDate && a.scheduledInterviewDate < todayStr).sort((a, b) => (b.scheduledInterviewDate || '').localeCompare(a.scheduledInterviewDate || ''))
                    : [];
                  const appsWithoutDate = isScheduledTab ? currentApps.filter(a => !a.scheduledInterviewDate) : [];

                  const sortedApps = isScheduledTab ? [...upcomingApps, ...appsWithoutDate]
                    : activeStatusTab === 'Rejected'
                      ? [...currentApps].sort((a, b) => {
                        const dateA = new Date(a.createdAt).getTime();
                        const dateB = new Date(b.createdAt).getTime();
                        return rejectionSortOrder === 'newest' ? dateB - dateA : dateA - dateB;
                      })
                      : currentApps;

                  const allDisplayApps = isScheduledTab ? [...sortedApps, ...missedApps] : sortedApps;
                  const missedStartIndex = isScheduledTab ? sortedApps.length : -1;

                  return currentApps.length > 0 ? (
                    allDisplayApps.map((app, idx) => (
                      <div key={app.id}>
                        {isScheduledTab && idx === missedStartIndex && missedApps.length > 0 && (
                          <div className="flex items-center gap-3 mt-6 mb-3">
                            <hr className="flex-1 border-amber-500/40" />
                            <span className="text-amber-400 text-sm font-semibold whitespace-nowrap">Missed Interviews ({missedApps.length})</span>
                            <hr className="flex-1 border-amber-500/40" />
                          </div>
                        )}
                        <div
                          className={`rounded-lg border overflow-hidden ${isScheduledTab && idx >= missedStartIndex && missedApps.length > 0 ? 'bg-amber-900/10 border-amber-700/30' : 'bg-gray-100/30 border-gray-300/50'}`}
                          data-testid={`admin-application-${app.id}`}
                        >
                          <div
                            className="p-3 cursor-pointer flex items-center justify-between hover:bg-gray-200/30 transition-colors"
                            onClick={() => toggleAppExpand(app.id)}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="flex flex-col min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium text-gray-900">{app.applicantName}</span>
                                  <span className="text-xs text-gray-500 truncate">({app.applicantEmail})</span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <span className="text-xs font-mono text-purple-400">{app.jobIdCode}</span>
                                  <span className="text-xs text-gray-500">{app.jobTitle}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {app.scheduledInterviewDate && app.scheduledInterviewTime && (
                                  <span className="hidden sm:flex text-xs text-cyan-300 items-center gap-1 bg-cyan-900/30 px-2 py-0.5 rounded whitespace-nowrap">
                                    <Calendar className="w-3 h-3 shrink-0" />
                                    {formatDateReadable(app.scheduledInterviewDate)} &bull; {formatTimeRange12(convertISTtoSGT(app.scheduledInterviewTime))} SGT
                                  </span>
                                )}
                                <Badge className={`${getStatusColor(app.status)} border-0 text-xs whitespace-nowrap`}>
                                  {app.status}
                                </Badge>
                                {expandedApps.has(app.id) ? (
                                  <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                                )}
                              </div>
                            </div>
                          </div>

                          {expandedApps.has(app.id) && (
                            <div className="px-4 pb-4 border-t border-gray-300/50 pt-4">
                              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                                <div className="flex-1 space-y-4">
                                  <div className="text-sm text-gray-500">
                                    Applied: {new Date(app.createdAt).toLocaleDateString()}
                                  </div>

                                  {app.coverLetter && (
                                    <div>
                                      <p className="text-xs text-gray-500 mb-1">Cover Letter:</p>
                                      <p className="text-sm text-gray-700 bg-gray-100/50 p-3 rounded max-h-48 overflow-y-auto whitespace-pre-wrap">
                                        {app.coverLetter}
                                      </p>
                                    </div>
                                  )}

                                  {app.resumePath && (
                                    <a
                                      href={app.resumePath}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 text-sm text-[#0D4A7A]"
                                    >
                                      <Download className="w-4 h-4" />
                                      View Resume
                                    </a>
                                  )}

                                  {app.screeningUpdatedAt && (
                                    <div className="p-4 bg-blue-50 border border-blue-500/30 rounded-lg">
                                      <h4 className="text-sm font-semibold text-blue-400 mb-3">Screening Details</h4>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                        <div><span className="text-gray-500">Full Name:</span> <span className="text-gray-700">{app.screeningFullName || 'N/A'}</span></div>
                                        <div><span className="text-gray-500">DOB:</span> <span className="text-gray-700">{app.screeningDob || 'N/A'}</span></div>
                                        <div><span className="text-gray-500">Gender:</span> <span className="text-gray-700">{app.screeningGender || 'N/A'}</span></div>
                                        <div><span className="text-gray-500">Location:</span> <span className="text-gray-700">{app.screeningCurrentLocation || 'N/A'}</span></div>
                                        <div><span className="text-gray-500">Experience:</span> <span className="text-gray-700">{app.screeningYearsExperience || 'N/A'}</span></div>
                                        <div><span className="text-gray-500">Current CTC:</span> <span className="text-gray-700">{app.screeningCurrentCtc || 'N/A'}</span></div>
                                        <div><span className="text-gray-500">Expected CTC:</span> <span className="text-gray-700">{app.screeningExpectedCtc || 'N/A'}</span></div>
                                        <div><span className="text-gray-500">Notice Period:</span> <span className="text-gray-700">{app.screeningNoticePeriod || 'N/A'}</span></div>
                                      </div>
                                    </div>
                                  )}

                                  <AdminQASection appId={app.id} />

                                  {ROUND1_STATUSES.includes(app.status) && (
                                    <AdminMcqPanel appId={app.id} jobIdCode={app.jobIdCode} appStatus={app.status} candidateName={app.applicantName} />
                                  )}

                                  {app.scheduledInterviewDate && app.scheduledInterviewTime && app.status !== 'Onboarded' && (
                                    <div className="p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                                      <h4 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Scheduled Interview
                                      </h4>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                        <div><span className="text-gray-500">Date:</span> <span className="text-gray-900 font-medium">{formatDateReadable(app.scheduledInterviewDate)}</span></div>
                                        <div><span className="text-gray-500">Time (IST):</span> <span className="text-gray-900 font-medium">{formatTimeRange12(app.scheduledInterviewTime)}</span></div>
                                        <div><span className="text-gray-500">Time (SGT):</span> <span className="text-gray-900 font-medium">{formatTimeRange12(convertISTtoSGT(app.scheduledInterviewTime))}</span></div>
                                      </div>
                                      <div className="mt-3 flex items-center gap-2">
                                        <span className="text-gray-500 text-xs">Status:</span>
                                        {app.interviewConfirmed ? (
                                          <span className="text-green-400 text-xs font-semibold flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> Confirmed
                                          </span>
                                        ) : (
                                          <span className="text-yellow-400 text-xs">Awaiting Confirmation</span>
                                        )}
                                      </div>
                                      <Button
                                        onClick={() => setRescheduleDialog({ open: true, appId: app.id, message: '' })}
                                        disabled={requestRescheduleMutation.isPending}
                                        className="mt-3 w-full bg-orange-600 hover:bg-orange-500 text-xs h-8"
                                      >
                                        <RefreshCw className="w-3 h-3 mr-2" />
                                        Request Reschedule
                                      </Button>

                                      <div className="mt-4 p-3 bg-gray-100/50 rounded-lg">
                                        <Label className="text-gray-500 text-xs mb-2 block">Meeting Link</Label>
                                        <div className="flex gap-2">
                                          <Input
                                            value={meetingLinks[app.id] ?? app.meetingLink ?? ''}
                                            onChange={(e) => setMeetingLinks(prev => ({ ...prev, [app.id]: e.target.value }))}
                                            placeholder="Paste meeting link here..."
                                            className="bg-white border-gray-600 text-gray-900 text-xs h-8 flex-1"
                                          />
                                          <Button
                                            onClick={() => saveMeetingLinkMutation.mutate({ appId: app.id, meetingLink: meetingLinks[app.id] ?? app.meetingLink ?? '' })}
                                            disabled={saveMeetingLinkMutation.isPending || !(meetingLinks[app.id] ?? app.meetingLink)}
                                            className="bg-blue-600 hover:bg-blue-500 text-xs h-8 px-3"
                                          >
                                            {saveMeetingLinkMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Send className="w-3 h-3 mr-1" /> Save</>}
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {app.interviewUpdatedAt && !app.scheduledInterviewDate && (
                                    <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                                      <h4 className="text-sm font-semibold text-purple-400 mb-3">Interview Availability</h4>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                        <div><span className="text-gray-500">Available From:</span> <span className="text-gray-700">{app.interviewAvailableFrom || 'N/A'}</span></div>
                                        <div><span className="text-gray-500">Available To:</span> <span className="text-gray-700">{app.interviewAvailableTo || 'N/A'}</span></div>
                                        <div className="col-span-2"><span className="text-gray-500">Preferred Time:</span> <span className="text-gray-700">{app.interviewPreferredTime || 'N/A'}</span></div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="lg:w-72 space-y-3 shrink-0">
                                  <div className="relative z-20">
                                    <Label className="text-gray-500 text-xs mb-2 block">Update Status</Label>
                                    <Select
                                      value={pendingUpdates[app.id]?.status || app.status}
                                      onValueChange={(status) => {
                                        initPendingUpdate(app.id, app.status, app.adminRemarks);
                                        updatePendingStatus(app.id, status);
                                      }}
                                    >
                                      <SelectTrigger className="bg-gray-100 border-gray-300 text-gray-900" data-testid={`select-status-${app.id}`}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent side="top" position="popper" className="z-[300] max-h-80 overflow-y-auto bg-white">
                                        <div className="px-2 py-1 text-xs text-gray-500 font-semibold">Initial Stage</div>
                                        {APPLICATION_STATUS_GROUPS.initial.map(status => (
                                          <SelectItem key={status} value={status}>{status}</SelectItem>
                                        ))}
                                        <div className="h-px bg-gray-600 my-2" />
                                        <div className="px-2 py-1 text-xs text-gray-500 font-semibold">Round 1 - Technical</div>
                                        {APPLICATION_STATUS_GROUPS.round1.map(status => (
                                          <SelectItem key={status} value={status}>{status}</SelectItem>
                                        ))}
                                        <div className="h-px bg-gray-600 my-2" />
                                        <div className="px-2 py-1 text-xs text-gray-500 font-semibold">Round 2 - LSP-E</div>
                                        {APPLICATION_STATUS_GROUPS.round2.map(status => (
                                          <SelectItem key={status} value={status}>{status}</SelectItem>
                                        ))}
                                        <div className="h-px bg-gray-600 my-2" />
                                        <div className="px-2 py-1 text-xs text-gray-500 font-semibold">Round 3 - Manager</div>
                                        {APPLICATION_STATUS_GROUPS.round3.map(status => (
                                          <SelectItem key={status} value={status}>{status}</SelectItem>
                                        ))}
                                        <div className="h-px bg-gray-600 my-2" />
                                        <div className="px-2 py-1 text-xs text-gray-500 font-semibold">Final Selection</div>
                                        {APPLICATION_STATUS_GROUPS.selection.map(status => (
                                          <SelectItem key={status} value={status}>{status}</SelectItem>
                                        ))}
                                        <div className="h-px bg-gray-600 my-2" />
                                        <div className="px-2 py-1 text-xs text-gray-500 font-semibold">Closed</div>
                                        {APPLICATION_STATUS_GROUPS.closed.map(status => (
                                          <SelectItem key={status} value={status}>{status}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {REJECTION_REQUIRES_REMARKS.includes(pendingUpdates[app.id]?.status || app.status) && pendingUpdates[app.id] && (
                                    <div>
                                      <Label className="text-red-400 text-xs mb-2 block font-semibold">Internal Reason (Required)</Label>
                                      <Textarea
                                        placeholder="Enter internal reason for rejection..."
                                        value={pendingUpdates[app.id]?.internalRemarks ?? ''}
                                        onChange={(e) => updatePendingInternalRemarks(app.id, e.target.value)}
                                        className="bg-red-950/20 border-red-900/50 text-gray-900 min-h-[80px]"
                                      />
                                    </div>
                                  )}

                                  <div>
                                    <Label className="text-gray-500 text-xs mb-2 block">Remarks to Candidate</Label>
                                    <Textarea
                                      placeholder="Add remarks for the candidate..."
                                      value={pendingUpdates[app.id]?.remarks ?? app.adminRemarks ?? ''}
                                      onChange={(e) => {
                                        initPendingUpdate(app.id, app.status, app.adminRemarks);
                                        updatePendingRemarks(app.id, e.target.value);
                                      }}
                                      className="bg-gray-100 border-gray-300 text-gray-900 min-h-[80px]"
                                    />
                                  </div>

                                 <Button
                                    onClick={() => submitStatusUpdate(app.id)}
                                    className="w-full text-white bg-[#0D4A7A]"
                                  >
                                    {updateStatusMutation.isPending ? 'Updating...' : 'Save'}
                                  </Button>

                                  {INTERVIEW_INVITE_STATUSES.includes(app.status) && (
                                    <Button
                                      variant="outline"
                                      onClick={() => resendConfirmationMutation.mutate(app.id)}
                                      disabled={resendConfirmationMutation.isPending}
                                      className="w-full border-[#0D4A7A] text-[#0D4A7A] hover:bg-[#0D4A7A]/5"
                                    >
                                      {resendConfirmationMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      ) : (
                                        <Mail className="w-4 h-4 mr-2" />
                                      )}
                                      Resend Interview Invitation
                                    </Button>
                                  )}

                                  {app.internalRemarks && !pendingUpdates[app.id] && (
                                    <div className="p-2 bg-red-950/20 border border-red-900/30 rounded text-xs">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-red-400 font-semibold">Internal Reason:</span>
                                        <button
                                          className="text-gray-500 hover:text-gray-900 text-xs underline"
                                          onClick={() => { setInlineRemarksEditId(app.id); setInlineRemarksText(app.internalRemarks || ''); }}
                                        >Edit</button>
                                      </div>
                                      {inlineRemarksEditId === app.id ? (
                                        <div className="space-y-2 mt-1">
                                          <Textarea
                                            value={inlineRemarksText}
                                            onChange={(e) => setInlineRemarksText(e.target.value)}
                                            className="bg-red-950/30 border-red-900/50 text-gray-900 text-xs min-h-[60px]"
                                          />
                                          <div className="flex gap-2">
                                            <Button size="sm" className="text-xs h-7 bg-red-700"
                                              disabled={updateInternalRemarksMutation.isPending || !inlineRemarksText.trim()}
                                              onClick={() => updateInternalRemarksMutation.mutate({ id: app.id, internalRemarks: inlineRemarksText })}
                                            >Save</Button>
                                            <Button size="sm" variant="ghost" className="text-xs h-7 text-gray-500"
                                              onClick={() => { setInlineRemarksEditId(null); setInlineRemarksText(''); }}
                                            >Cancel</Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="text-red-300/80 mt-1">{app.internalRemarks}</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      {activeStatusTab === 'Rejected'
                        ? 'No rejected applications'
                        : activeStatusTab === 'Selected'
                          ? `No ${activeSelectedSubTab.toLowerCase()} candidates`
                          : `No ${activeStatusTab.toLowerCase()} applications`
                      }
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' ? (
            <>
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Registered Users ({filteredUsers.length})</h2>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative w-full sm:w-[280px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        placeholder="Search users..."
                        value={usersSearch}
                        onChange={(e) => setUsersSearch(e.target.value)}
                        className="pl-10 bg-white border-gray-200"
                      />
                    </div>
                 
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#eef2ff] border-b-2 border-blue-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">S.No</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Name</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Email</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Mobile</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Status</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-blue-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {usersLoading ? (
                          <tr>
                            <td colSpan="7" className="text-center py-8 text-gray-500">Loading...</td>
                          </tr>
                        ) : filteredUsers.length > 0 ? (
                          paginatedUsers.map((user, index) => (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 text-sm text-gray-600">{(usersPage - 1) * TABLE_PAGE_SIZE + index + 1}</td>
                              <td className="px-6 py-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{user.mobileNumber}</td>
                              <td className="px-6 py-4">
                                <Badge className={user.isBlocked ? 'bg-red-500/20 text-red-600' : 'bg-green-500/20 text-green-600'}>
                                  {user.isBlocked ? 'Blocked' : 'Active'}
                                </Badge>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-left gap-2">
                                   <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => blockUserMutation.mutate({ userId: user.id, isBlocked: !user.isBlocked })}
                                    className={user.isBlocked ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}
                                  >
                                    {user.isBlocked ? 'Unblock' : 'Block'}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedUserId(user.id)}
                                    className="text-black"
                                  >
                                    <Eye size={16} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteUserMutation.mutate(user.id)}
                                    className="text-black"
                                    disabled={deleteUserMutation.isPending}
                                  >
                                     <Trash2 size="16" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" className="text-center py-8 text-gray-500">
                              {usersSearch ? 'No users match your search' : 'No users registered yet'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <TablePagination
                    totalItems={filteredUsers.length}
                    currentPage={usersPage}
                    onPageChange={setUsersPage}
                  />
                </div>
              </div>

              <Dialog
                open={selectedUserId !== null}
                onOpenChange={(open) => {
                  if (!open) setSelectedUserId(null);
                }}
              >
                <DialogContent className="bg-white border-gray-300 text-gray-900 max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-gray-900">User Details</DialogTitle>
                    <DialogDescription className="text-gray-500">
                      View the registered user profile and account status.
                    </DialogDescription>
                  </DialogHeader>

                  {userDetailsLoading || !userDetails ? (
                    <div className="text-center py-8 text-gray-500">Loading user details...</div>
                  ) : (
                    <div className="space-y-6">
                      <div className="glassmorphism rounded-xl p-6 border border-gray-300">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h2 className="text-xl font-bold text-gray-900">
                              {userDetails.user.firstName} {userDetails.user.lastName}
                            </h2>
                            <p className="text-gray-500">{userDetails.user.email}</p>
                            <p className="text-gray-500 text-sm">{userDetails.user.mobileNumber}</p>
                          </div>
                          <div className="flex items-center gap-4 flex-wrap justify-end">
                            <Badge className={userDetails.user.emailVerified ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                              {userDetails.user.emailVerified ? 'Verified' : 'Unverified'}
                            </Badge>
                            <Badge className={userDetails.user.isBlocked ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}>
                              {userDetails.user.isBlocked ? 'Blocked' : 'Active'}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => blockUserMutation.mutate({ userId: userDetails.user.id, isBlocked: !userDetails.user.isBlocked })}
                              className={userDetails.user.isBlocked ? 'text-green-400 border-green-500/50 hover:bg-green-500/20' : 'text-red-400 border-red-500/50 hover:bg-red-500/20'}
                              disabled={blockUserMutation.isPending}
                            >
                              {userDetails.user.isBlocked ? 'Unblock' : 'Block'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteUserMutation.mutate(userDetails.user.id)}
                              className="text-red-400 border-red-500/50 hover:bg-red-500/20"
                              disabled={deleteUserMutation.isPending}
                            >
                              {deleteUserMutation.isPending ? 'Deleting...' : 'Delete'}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {userDetails.profile && (
                        <>
                          <div className="glassmorphism rounded-xl p-6 border border-gray-300">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Details</h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                              <div><span className="text-gray-500">Date of Birth:</span> <span className="text-gray-700 ml-2">{userDetails.profile.dateOfBirth || 'N/A'}</span></div>
                              <div><span className="text-gray-500">Gender:</span> <span className="text-gray-700 ml-2">{userDetails.profile.gender || 'N/A'}</span></div>
                              <div><span className="text-gray-500">City:</span> <span className="text-gray-700 ml-2">{userDetails.profile.city || 'N/A'}</span></div>
                              <div><span className="text-gray-500">State:</span> <span className="text-gray-700 ml-2">{userDetails.profile.state || 'N/A'}</span></div>
                              <div><span className="text-gray-500">Country:</span> <span className="text-gray-700 ml-2">{userDetails.profile.country || 'N/A'}</span></div>
                              <div><span className="text-gray-500">Pincode:</span> <span className="text-gray-700 ml-2">{userDetails.profile.pincode || 'N/A'}</span></div>
                            </div>
                          </div>

                          <div className="glassmorphism rounded-xl p-6 border border-gray-300">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Details</h3>
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                              <div><span className="text-gray-500">Current Job Title:</span> <span className="text-gray-700 ml-2">{userDetails.profile.currentJobTitle || 'N/A'}</span></div>
                              <div><span className="text-gray-500">Current Company:</span> <span className="text-gray-700 ml-2">{userDetails.profile.currentCompany || 'N/A'}</span></div>
                              <div><span className="text-gray-500">Total Experience:</span> <span className="text-gray-700 ml-2">{userDetails.profile.totalExperience || 'N/A'}</span></div>
                              <div><span className="text-gray-500">Skills:</span> <span className="text-gray-700 ml-2">{userDetails.profile.skills || 'N/A'}</span></div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </>
          ) : null}

          {/* SLOTS TAB */}
          {activeTab === 'slots' && renderSlotsPanel()}

      </div>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialog.open} onOpenChange={(open) => !open && setRescheduleDialog({ open: false, appId: null, message: '' })}>
        <DialogContent className="bg-white border-gray-300 text-gray-900 max-w-md">
          <DialogHeader>
            <DialogTitle>Request Interview Reschedule</DialogTitle>
            <DialogDescription>
              This will clear the scheduled interview and ask the candidate to provide new availability.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-gray-500">Message to Candidate (Optional)</Label>
              <Textarea
                placeholder="e.g., We couldn't make it on the scheduled date..."
                value={rescheduleDialog.message}
                onChange={(e) => setRescheduleDialog(prev => ({ ...prev, message: e.target.value }))}
                className="bg-gray-100 border-gray-300 text-gray-900 min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleDialog({ open: false, appId: null, message: '' })}>Cancel</Button>
            <Button
              onClick={() => {
                if (rescheduleDialog.appId) {
                  requestRescheduleMutation.mutate({
                    id: rescheduleDialog.appId,
                    message: rescheduleDialog.message || 'We need to reschedule your interview.'
                  });
                  setRescheduleDialog({ open: false, appId: null, message: '' });
                }
              }}
              className="bg-orange-600 hover:bg-orange-500"
            >
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Warning Dialog */}
      <Dialog open={exportWarningDialog.open} onOpenChange={(open) => !open && setExportWarningDialog({ open: false, missingApps: [] })}>
        <DialogContent className="bg-white border-gray-300 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-yellow-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Missing Internal Reasons
            </DialogTitle>
            <DialogDescription>
              {exportWarningDialog.missingApps.length} rejected application(s) have no internal reason recorded.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {exportWarningDialog.missingApps.map(app => (
              <div key={app.id} className="bg-gray-100 rounded p-2 flex justify-between items-center">
                <span className="text-sm">{app.applicantName} - {app.status}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-yellow-400"
                  onClick={() => {
                    setExportWarningDialog({ open: false, missingApps: [] });
                    setInlineRemarksEditId(app.id);
                    setActiveStatusTab('Rejected');
                  }}
                >
                  Add Reason
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setExportWarningDialog({ open: false, missingApps: [] })}>Cancel</Button>
            <Button
              className="bg-purple-700"
              onClick={() => {
                const rejectedApps = (applications || []).filter(app => REJECTION_STATUSES_ALL.includes(app.status));
                doExportRejectionsPDF(rejectedApps);
              }}
            >
              Export Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
    </div>
  );
}

// =============================================================================
// MAIN ADMIN COMPONENT
// =============================================================================

export default function CareersAdmin() {
  const { logout } = useAuth();
  return <AdminContent onLogout={logout} />;
}
