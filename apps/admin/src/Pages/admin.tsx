import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, Save, X, Briefcase, FolderOpen, ChevronRight, ChevronDown, ChevronUp, ArrowLeft, Lock, LogOut, Users, FileText, Download, CheckCircle, Clock, Calendar, Search, Filter, Mail, RefreshCw, Loader2, Send, Bell, Eye, MessageCircle, Copy, Trophy, AlertCircle, Brain, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import type { JobPosting, JobCategory, InsertJobPosting, InsertJobCategory, APPLICATION_STATUSES } from "@shared/schema";

const sessionStorage = {
    getItem: (key: string) => {
        if (key === 'adminToken') {
            return window.localStorage.getItem('wings_admin_token');
        }
        return window.sessionStorage.getItem(key);
    },
    setItem: (key: string, val: string) => {
        if (key === 'adminToken') {
            window.localStorage.setItem('wings_admin_token', val);
        } else {
            window.sessionStorage.setItem(key, val);
        }
    },
    removeItem: (key: string) => {
        if (key === 'adminToken') {
            window.localStorage.removeItem('wings_admin_token');
        } else {
            window.sessionStorage.removeItem(key);
        }
    }
};

function to12Hour(time24: string): string {
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

function formatTimeRange12(timeRange: string): string {
    return timeRange.split(' - ').map(t => to12Hour(t.trim())).join(' - ');
}

function formatDateReadable(dateStr: string): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const [y, m, d] = dateStr.split('-');
    return `${d}-${months[parseInt(m) - 1]}-${y}`;
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

type TabType = 'jobs' | 'categories' | 'applications' | 'users' | 'slots';

interface InterviewAvailableDate {
    id: number;
    availableDate: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface AdminNotification {
    id: number;
    type: string;
    title: string;
    message: string;
    applicationId: number | null;
    bookingId: number | null;
    isRead: boolean;
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

interface PendingStatusUpdate {
    status: string;
    remarks: string;
    internalRemarks: string;
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

const APPLICATION_STATUS_GROUPS = {
    initial: ['Pending', 'Under Review', 'Shortlisted'],
    round1: ['Round 1 Scheduled', 'Reschedule Round 1', 'Round 1 Confirmed', 'Round 1 Completed', 'Round 1 Selected', 'Round 1 Not Selected'],
    round2: ['Round 2 Scheduled', 'Reschedule Round 2', 'Round 2 Confirmed', 'Round 2 Completed', 'Round 2 Selected', 'Round 2 Not Selected'],
    round3: ['Round 3 Scheduled', 'Reschedule Round 3', 'Round 3 Confirmed', 'Round 3 Completed', 'Round 3 Selected', 'Round 3 Not Selected'],
    selection: ['Final Selected', 'Offer Extended', 'Onboarded'],
    closed: ['Not Selected', 'Withdrawn by Candidate', 'Position Closed', 'Rejected - Candidate non responsive'],
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'Pending': return 'bg-yellow-500/20 text-yellow-400';
        case 'Under Review': return 'bg-blue-500/20 text-blue-400';
        case 'Shortlisted': return 'bg-purple-500/20 text-purple-400';
        // Round 1 - Technical Interview
        case 'Round 1 Scheduled': return 'bg-cyan-500/20 text-cyan-400';
        case 'Round 1 Confirmed': return 'bg-blue-500/20 text-blue-400';
        case 'Round 1 Completed': return 'bg-indigo-500/20 text-indigo-400';
        case 'Round 1 Selected': return 'bg-purple-500/20 text-purple-400';
        case 'Round 1 Not Selected': return 'bg-red-500/20 text-red-400';
        // Round 2 - LSP-E
        case 'Round 2 Scheduled': return 'bg-cyan-500/20 text-cyan-400';
        case 'Round 2 Confirmed': return 'bg-blue-500/20 text-blue-400';
        case 'Round 2 Completed': return 'bg-indigo-500/20 text-indigo-400';
        case 'Round 2 Selected': return 'bg-purple-500/20 text-purple-400';
        case 'Round 2 Not Selected': return 'bg-red-500/20 text-red-400';
        // Round 3 - Manager/HR
        case 'Round 3 Scheduled': return 'bg-cyan-500/20 text-cyan-400';
        case 'Round 3 Confirmed': return 'bg-blue-500/20 text-blue-400';
        case 'Round 3 Completed': return 'bg-indigo-500/20 text-indigo-400';
        case 'Round 3 Selected': return 'bg-green-500/20 text-green-400';
        case 'Round 3 Not Selected': return 'bg-red-500/20 text-red-400';
        // Final stages
        case 'Interview Scheduled': return 'bg-cyan-500/20 text-cyan-400';
        case 'Interview Completed': return 'bg-indigo-500/20 text-indigo-400';
        case 'Final Selected': return 'bg-green-500/20 text-green-400';
        case 'Reschedule Round 1': return 'bg-orange-500/20 text-orange-400';
        case 'Reschedule Round 2': return 'bg-orange-500/20 text-orange-400';
        case 'Reschedule Round 3': return 'bg-orange-500/20 text-orange-400';
        case 'Offer Extended': return 'bg-teal-500/20 text-teal-400';
        case 'Onboarded': return 'bg-emerald-500/20 text-emerald-400';
        case 'Not Selected': return 'bg-red-500/20 text-red-400';
        case 'Withdrawn by Candidate': return 'bg-orange-500/20 text-orange-400';
        case 'Position Closed': return 'bg-gray-500/20 text-gray-400';
        case 'Rejected - Candidate non responsive': return 'bg-red-500/20 text-red-400';
        default: return 'bg-gray-500/20 text-gray-400';
    }
};

function AdminLogin({ onLogin }: { onLogin: (token: string) => void }) {
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            const data = await res.json();

            if (data.success && data.token) {
                sessionStorage.setItem('adminToken', data.token);
                onLogin(data.token);
            } else {
                setError(data.message || 'Invalid password');
            }
        } catch (err) {
            setError('Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glassmorphism rounded-2xl p-8 border border-purple-500/30 w-full max-w-md mx-4"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-purple-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Admin Login</h1>
                    <p className="text-gray-400">Enter the admin password to continue</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Input
                            type="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-gray-800 border-gray-700 text-white"
                            data-testid="input-admin-password"
                        />
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm">{error}</p>
                    )}

                    <Button
                        type="submit"
                        disabled={isLoading || !password}
                        className="w-full bg-purple-600 hover:bg-purple-500"
                        data-testid="button-admin-login"
                    >
                        {isLoading ? 'Logging in...' : 'Login'}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <Link href="/">
                        <span className="text-gray-400 hover:text-white text-sm cursor-pointer">Back to Home</span>
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}

function AdminContent({ onLogout }: { onLogout: () => void }) {
    const [activeTab, setActiveTab] = useState<TabType>('jobs');
    const [showNotifications, setShowNotifications] = useState(false);
    const bellRef = useRef<HTMLButtonElement>(null);
    const [notifPos, setNotifPos] = useState({ top: 100, right: 24 });

    useEffect(() => {
        if (showNotifications && bellRef.current) {
            const rect = bellRef.current.getBoundingClientRect();
            setNotifPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
        }
    }, [showNotifications]);

    useEffect(() => {
        if (!showNotifications) return;
        const handleScroll = () => setShowNotifications(false);
        window.addEventListener('scroll', handleScroll, true);
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, [showNotifications]);
    const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
    const [editingCategory, setEditingCategory] = useState<JobCategory | null>(null);
    const [showJobForm, setShowJobForm] = useState(false);
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const { toast } = useToast();

    const { data: jobs, isLoading: jobsLoading } = useQuery<JobPosting[]>({
        queryKey: ['/api/jobs'],
    });

    const { data: categories } = useQuery<JobCategory[]>({
        queryKey: ['/api/categories'],
    });

    const { data: users, isLoading: usersLoading } = useQuery<AdminUser[]>({
        queryKey: ['/api/admin/users'],
        queryFn: async () => {
            const token = sessionStorage.getItem('adminToken');
            const res = await fetch('/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch users');
            return res.json();
        },
        enabled: activeTab === 'users',
    });

    const { data: userDetails, isLoading: userDetailsLoading } = useQuery<UserDetails>({
        queryKey: ['/api/admin/users', selectedUserId],
        queryFn: async () => {
            const token = sessionStorage.getItem('adminToken');
            const res = await fetch(`/api/admin/users/${selectedUserId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch user details');
            return res.json();
        },
        enabled: selectedUserId !== null,
    });

    // Interview dates state and queries
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
    const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());

    const { data: slotSettings, isLoading: slotSettingsLoading } = useQuery<{ id: number; round: number; timeSlot: string; isActive: boolean }[]>({
        queryKey: ['/api/admin/slot-settings'],
        queryFn: async () => {
            const token = sessionStorage.getItem('adminToken');
            const res = await fetch('/api/admin/slot-settings', { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error('Failed to fetch slot settings');
            return res.json();
        },
        enabled: activeTab === 'slots',
    });

    const toggleSlotMutation = useMutation({
        mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
            const token = sessionStorage.getItem('adminToken');
            const res = await fetch(`/api/admin/slot-settings/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ isActive }),
            });
            return res.json();
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/admin/slot-settings'] }),
    });

    const { data: availableDates, isLoading: datesLoading } = useQuery<InterviewAvailableDate[]>({
        queryKey: ['/api/admin/interview-dates'],
        queryFn: async () => {
            const token = sessionStorage.getItem('adminToken');
            const res = await fetch('/api/admin/interview-dates', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch dates');
            return res.json();
        },
        enabled: activeTab === 'slots',
    });

    const { data: notifications, isLoading: notificationsLoading } = useQuery<AdminNotification[]>({
        queryKey: ['/api/admin/notifications'],
        queryFn: async () => {
            const token = sessionStorage.getItem('adminToken');
            const res = await fetch('/api/admin/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch notifications');
            return res.json();
        },
    });

    const { data: unreadData } = useQuery<{ count: number }>({
        queryKey: ['/api/admin/notifications/unread'],
        queryFn: async () => {
            const token = sessionStorage.getItem('adminToken');
            const res = await fetch('/api/admin/notifications/unread', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch unread count');
            return res.json();
        },
        refetchInterval: 10000,
    });

    const toggleDateMutation = useMutation({
        mutationFn: async ({ date, isActive }: { date: string; isActive: boolean }) => {
            const token = sessionStorage.getItem('adminToken');
            const res = await fetch('/api/admin/interview-dates/toggle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ date, isActive })
            });
            if (!res.ok) throw new Error('Failed to toggle date');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/interview-dates'] });
            toast({ title: "Success", description: "Date availability updated" });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to update date availability", variant: "destructive" });
        }
    });

    const removeDateMutation = useMutation({
        mutationFn: async (id: number) => {
            const token = sessionStorage.getItem('adminToken');
            const res = await fetch(`/api/admin/interview-dates/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to remove date');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/interview-dates'] });
            toast({ title: "Success", description: "Date removed" });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to remove date", variant: "destructive" });
        }
    });

    const bulkUpdateDatesMutation = useMutation({
        mutationFn: async ({ dates, isActive }: { dates: string[]; isActive: boolean }) => {
            const token = sessionStorage.getItem('adminToken');
            const res = await fetch('/api/admin/interview-dates/bulk-update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ dates, isActive })
            });
            if (!res.ok) throw new Error('Failed to bulk update dates');
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/interview-dates'] });
            setSelectedDates([]);
            toast({
                title: "Success",
                description: `${variables.dates.length} date(s) marked as ${variables.isActive ? 'available' : 'not available'}`
            });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to update dates", variant: "destructive" });
        }
    });

    const markNotificationReadMutation = useMutation({
        mutationFn: async (id: number) => {
            const token = sessionStorage.getItem('adminToken');
            const res = await fetch(`/api/admin/notifications/${id}/read`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to mark notification as read');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications'] });
            queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications/unread'] });
        }
    });

    const markAllReadMutation = useMutation({
        mutationFn: async () => {
            const token = sessionStorage.getItem('adminToken');
            const res = await fetch('/api/admin/notifications/read-all', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to mark all as read');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications'] });
            queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications/unread'] });
        }
    });

    const blockUserMutation = useMutation({
        mutationFn: async ({ userId, isBlocked }: { userId: number; isBlocked: boolean }) => {
            const token = sessionStorage.getItem('adminToken');
            const res = await fetch(`/api/admin/users/${userId}/block`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ isBlocked })
            });
            if (!res.ok) throw new Error('Failed to update user');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
            queryClient.invalidateQueries({ queryKey: ['/api/admin/users', selectedUserId] });
            toast({ title: "Success", description: "User status updated successfully" });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to update user status", variant: "destructive" });
        }
    });

    const invalidateJobQueries = () => {
        queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
        queryClient.invalidateQueries({ queryKey: ['/api/jobs?active=true'] });
    };

    const createJobMutation = useMutation({
        mutationFn: (data: InsertJobPosting) => apiRequest('POST', '/api/jobs', data),
        onSuccess: () => {
            invalidateJobQueries();
            setShowJobForm(false);
            setEditingJob(null);
            toast({ title: "Success", description: "Job posting created successfully" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message || "Failed to create job posting", variant: "destructive" });
        }
    });

    const updateJobMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<InsertJobPosting> }) =>
            apiRequest('PATCH', `/api/jobs/${id}`, data),
        onSuccess: () => {
            invalidateJobQueries();
            setShowJobForm(false);
            setEditingJob(null);
            toast({ title: "Success", description: "Job posting updated successfully" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message || "Failed to update job posting", variant: "destructive" });
        }
    });

    const deleteJobMutation = useMutation({
        mutationFn: (id: number) => apiRequest('DELETE', `/api/jobs/${id}`),
        onSuccess: () => {
            invalidateJobQueries();
            toast({ title: "Success", description: "Job posting deleted successfully" });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to delete job posting", variant: "destructive" });
        }
    });

    const createCategoryMutation = useMutation({
        mutationFn: (data: InsertJobCategory) => apiRequest('POST', '/api/categories', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
            setShowCategoryForm(false);
            setEditingCategory(null);
            toast({ title: "Success", description: "Category created successfully" });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to create category", variant: "destructive" });
        }
    });

    const updateCategoryMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<InsertJobCategory> }) =>
            apiRequest('PATCH', `/api/categories/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
            setEditingCategory(null);
            toast({ title: "Success", description: "Category updated successfully" });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to update category", variant: "destructive" });
        }
    });

    const deleteCategoryMutation = useMutation({
        mutationFn: (id: number) => apiRequest('DELETE', `/api/categories/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
            toast({ title: "Success", description: "Category deleted successfully" });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to delete category", variant: "destructive" });
        }
    });

    const adminToken = sessionStorage.getItem('adminToken');

    const { data: applications, isLoading: applicationsLoading } = useQuery<EnrichedApplication[]>({
        queryKey: ['/api/admin/applications'],
        queryFn: async () => {
            const res = await fetch('/api/admin/applications', {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            if (!res.ok) throw new Error('Failed to fetch applications');
            return res.json();
        },
        enabled: activeTab === 'applications',
        refetchInterval: 5000,
        refetchIntervalInBackground: true,
    });

    const [pendingUpdates, setPendingUpdates] = useState<Record<number, PendingStatusUpdate>>({});
    const [scheduleData, setScheduleData] = useState<Record<number, { date: string; time: string }>>({});
    const [expandedApps, setExpandedApps] = useState<Set<number>>(new Set());
    const [appSearchQuery, setAppSearchQuery] = useState('');
    const [appStatusFilter, setAppStatusFilter] = useState<string>('all');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
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

    // Normalize status to handle case variations and empty/null values
    const normalizeStatus = (status: string | null | undefined): string => {
        if (!status || status.trim() === '') return 'Pending';
        // Handle case-insensitive matching
        if (status.toLowerCase() === 'pending') return 'Pending';
        return status;
    };

    const getTabStatuses = (tabKey: string) => {
        const tab = STATUS_TABS.find(t => t.key === tabKey);
        if (!tab) return [];
        if (tab.hasSubTabs && tabKey === 'Selected') {
            return [activeSelectedSubTab];
        }
        return tab.statuses;
    };

    const getApplicationsForTab = (tabKey: string) => {
        if (!applications) return [];
        const statuses = STATUS_TABS.find(t => t.key === tabKey)?.statuses || [];
        return applications.filter(app => {
            const normalizedAppStatus = normalizeStatus(app.status);
            const matchesStatus = statuses.includes(normalizedAppStatus);
            const matchesSearch = appSearchQuery === '' ||
                app.applicantName.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
                app.applicantEmail.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
                app.jobTitle.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
                app.jobIdCode.toLowerCase().includes(appSearchQuery.toLowerCase());
            return matchesStatus && matchesSearch;
        });
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

    const toggleAppExpand = (appId: number) => {
        setExpandedApps(prev => {
            const newSet = new Set(prev);
            if (newSet.has(appId)) {
                newSet.delete(appId);
            } else {
                newSet.add(appId);
            }
            return newSet;
        });
    };

    const toggleCategoryExpand = (categoryName: string) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryName)) {
                newSet.delete(categoryName);
            } else {
                newSet.add(categoryName);
            }
            return newSet;
        });
    };

    const filteredApplications = applications?.filter(app => {
        const matchesSearch = appSearchQuery === '' ||
            app.applicantName.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
            app.applicantEmail.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
            app.jobTitle.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
            app.jobIdCode.toLowerCase().includes(appSearchQuery.toLowerCase());
        const matchesStatus = appStatusFilter === 'all' || normalizeStatus(app.status) === appStatusFilter;
        return matchesSearch && matchesStatus;
    }) || [];

    const applicationsByCategory = filteredApplications.reduce((acc, app) => {
        const category = app.categoryName || 'Uncategorized';
        if (!acc[category]) acc[category] = [];
        acc[category].push(app);
        return acc;
    }, {} as Record<string, EnrichedApplication[]>);

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status, remarks, internalRemarks }: { id: number; status: string; remarks?: string | null; internalRemarks?: string }) => {
            const res = await fetch(`/api/admin/applications/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${adminToken}`
                },
                body: JSON.stringify({ status, remarks, internalRemarks })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to update status');
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/applications'] });
            setPendingUpdates(prev => {
                const updated = { ...prev };
                delete updated[variables.id];
                return updated;
            });
            toast({ title: "Success", description: "Application status updated and email sent" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message || "Failed to update status", variant: "destructive" });
        },
    });

    const updateInternalRemarksMutation = useMutation({
        mutationFn: async ({ id, internalRemarks }: { id: number; internalRemarks: string }) => {
            const res = await fetch(`/api/admin/applications/${id}/internal-remarks`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
                body: JSON.stringify({ internalRemarks })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to update');
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/applications'] });
            setInlineRemarksEditId(null);
            setInlineRemarksText('');
            toast({ title: "Saved", description: "Internal rejection reason updated." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const scheduleInterviewMutation = useMutation({
        mutationFn: async ({ id, scheduledDate, scheduledTime }: { id: number; scheduledDate: string; scheduledTime: string }) => {
            const res = await fetch(`/api/admin/applications/${id}/schedule-interview`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${adminToken}`
                },
                body: JSON.stringify({ scheduledDate, scheduledTime })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to schedule interview');
            }
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/applications'] });
            setScheduleData(prev => {
                const updated = { ...prev };
                delete updated[variables.id];
                return updated;
            });
            toast({ title: "Success", description: "Interview scheduled! Confirmation request sent to candidate." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const resendConfirmationMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/admin/applications/${id}/resend-confirmation`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${adminToken}`
                }
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to resend confirmation');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/applications'] });
            toast({ title: "Success", description: "Interview confirmation email resent to candidate." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const saveMeetingLinkMutation = useMutation({
        mutationFn: async ({ appId, meetingLink }: { appId: number; meetingLink: string }) => {
            const res = await fetch(`/api/admin/applications/${appId}/meeting-link`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${adminToken}`
                },
                body: JSON.stringify({ meetingLink })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to save meeting link');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/applications'] });
            toast({ title: "Meeting Link Saved", description: "Meeting link saved and email sent to the candidate with interview details." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });

    const requestRescheduleMutation = useMutation({
        mutationFn: async ({ id, message }: { id: number; message?: string }) => {
            const res = await fetch(`/api/admin/applications/${id}/request-reschedule`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${adminToken}`
                },
                body: JSON.stringify({ message })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to request reschedule');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/applications'] });
            toast({ title: "Success", description: "Reschedule request sent! Candidate will receive an email to provide new availability." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const REJECTION_STATUSES = ['Not Selected', 'Round 1 Not Selected', 'Round 2 Not Selected', 'Round 3 Not Selected', 'Rejected - Candidate non responsive', 'Withdrawn by Candidate'];

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
        if (REJECTION_STATUSES.includes(pending.status) && !pending.internalRemarks.trim()) {
            toast({ title: "Required", description: "Please enter an internal rejection reason before saving.", variant: "destructive" });
            return;
        }
        updateStatusMutation.mutate({
            id: appId,
            status: pending.status,
            remarks: pending.remarks.trim() || null,
            internalRemarks: REJECTION_STATUSES.includes(pending.status) ? pending.internalRemarks.trim() : undefined
        });
    };

    // ALL statuses that appear in the Rejected tab
    const REJECTION_STATUSES_ALL = ['Rejected', 'Not Selected', 'Round 1 Not Selected', 'Round 2 Not Selected', 'Round 3 Not Selected', 'Withdrawn by Candidate', 'Position Closed', 'Rejected - Candidate non responsive'];
    // Statuses that REQUIRE internal remarks (not Position Closed)
    const REJECTION_REQUIRES_REMARKS = ['Not Selected', 'Round 1 Not Selected', 'Round 2 Not Selected', 'Round 3 Not Selected', 'Rejected - Candidate non responsive', 'Rejected', 'Withdrawn by Candidate'];

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
            new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
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
                new Date(app.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
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
            toast({ title: "No Data", description: "No rejected applications found to export.", variant: "destructive" });
            return;
        }
        // Check for missing internal remarks on apps that require them
        const missingRemarks = rejectedApps.filter(app => REJECTION_REQUIRES_REMARKS.includes(app.status) && !app.internalRemarks?.trim());
        if (missingRemarks.length > 0) {
            setExportWarningDialog({ open: true, missingApps: missingRemarks });
            return;
        }
        doExportRejectionsPDF(rejectedApps);
    };

    const getCategoryName = (categoryId: number) => {
        return categories?.find(cat => cat.id === categoryId)?.name || 'Unknown';
    };

    return (
        <div className="min-h-screen bg-gray-950">

            <section className="pt-24 sm:pt-32 pb-6 dark-gradient-bg relative">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2 sm:gap-4">
                            <Link href="/">
                                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white px-2 sm:px-3" data-testid="button-back">
                                    <ArrowLeft className="w-4 h-4 sm:mr-2" />
                                    <span className="hidden sm:inline">Back</span>
                                </Button>
                            </Link>
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                            <span className="text-purple-400 text-sm sm:text-base">Admin Panel</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* NOTIFICATION BELL - HIDDEN FOR NOW, RE-ENABLE LATER */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onLogout}
                                className="text-gray-400 hover:text-white px-2 sm:px-3"
                                data-testid="button-logout"
                            >
                                <LogOut className="w-4 h-4 sm:mr-2" />
                                <span className="hidden sm:inline">Logout</span>
                            </Button>
                        </div>
                    </div>

                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1">
                        Job Management
                    </h1>
                    <p className="text-gray-400 text-sm">Create and manage job postings and categories</p>
                </div>
            </section>

            <section className="py-6 bg-gray-950">
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
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap text-sm flex-shrink-0 ${activeTab === tab.id
                                    ? 'bg-[#7C3AED] text-white shadow-lg shadow-purple-500/20'
                                    : 'bg-[#1A1F2C] text-gray-400 hover:bg-gray-800 hover:text-white border border-gray-800'
                                    }`}
                                data-testid={tab.testId}
                            >
                                {tab.icon}
                                <span className="hidden sm:inline">{tab.label}</span>
                                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                            </button>
                        ))}
                    </div>

                    {activeTab === 'jobs' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold text-white">Job Postings ({jobs?.length || 0})</h2>
                                <Button
                                    onClick={() => { setShowJobForm(true); setEditingJob(null); }}
                                    className="bg-[#7C3AED] hover:bg-[#6D28D9] font-bold text-white px-5 py-2.5 rounded-xl transition-all duration-200 shadow-md"
                                    data-testid="button-add-job"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Job
                                </Button>
                            </div>

                            <Dialog
                                open={showJobForm}
                                onOpenChange={(open) => {
                                    setShowJobForm(open);
                                    if (!open) setEditingJob(null);
                                }}
                            >
                                <DialogContent className="!max-w-5xl !w-[95vw] !max-h-[90vh] !overflow-y-auto !p-0 !bg-transparent !border-0 !shadow-none">
                                    <JobForm
                                        key={editingJob?.id ?? 'new'}
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
                                </DialogContent>
                            </Dialog>

                            <div className="space-y-4">
                                {jobsLoading ? (
                                    <div className="text-center py-8 text-gray-400">Loading...</div>
                                ) : jobs && jobs.length > 0 ? (
                                    jobs.map((job) => (
                                        <motion.div
                                            key={job.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="bg-[#0B0F19] rounded-2xl p-6 border border-gray-800"
                                            data-testid={`admin-job-${job.id}`}
                                        >
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                        <span className="text-xs font-semibold bg-[#2D1B4E] text-[#B983FF] px-3 py-1 rounded-md">
                                                            {job.jobId}
                                                        </span>
                                                        <span className="text-xs font-semibold bg-[#1A2E4C] text-[#58A6FF] px-3 py-1 rounded-md">
                                                            {getCategoryName(job.categoryId)}
                                                        </span>
                                                        <span className={`text-xs font-semibold px-3 py-1 rounded-md ${job.isActive ? 'bg-[#133A1F] text-[#44D46C]' : 'bg-[#374151] text-[#9CA3AF]'}`}>
                                                            {job.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-xl font-bold text-white mt-3 mb-1">{job.title}</h3>
                                                    <p className="text-sm text-gray-400 font-medium">{job.location} • {job.employmentType} • {job.experience}</p>
                                                </div>
                                                <div className="flex gap-3 shrink-0">
                                                    <Button
                                                        onClick={() => { setEditingJob(job); setShowJobForm(true); }}
                                                        className="bg-white hover:bg-gray-100 text-[#7C3AED] hover:text-[#6D28D9] font-bold border-none rounded-lg px-4 py-2 flex items-center gap-1 shadow-sm transition-all duration-200"
                                                        data-testid={`button-edit-job-${job.id}`}
                                                    >
                                                        <Edit2 className="w-4 h-4 mr-1" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        onClick={() => deleteJobMutation.mutate(job.id)}
                                                        className="bg-white hover:bg-gray-100 text-[#EF4444] hover:text-[#DC2626] font-bold border-none rounded-lg px-4 py-2 flex items-center gap-1 shadow-sm transition-all duration-200"
                                                        data-testid={`button-delete-job-${job.id}`}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-1" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-400">No job postings yet</div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'categories' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold text-white">Categories ({categories?.length || 0})</h2>
                                <Button
                                    onClick={() => { setShowCategoryForm(true); setEditingCategory(null); }}
                                    className="bg-purple-600 hover:bg-purple-500"
                                    data-testid="button-add-category"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Category
                                </Button>
                            </div>

                            <Dialog
                                open={showCategoryForm}
                                onOpenChange={(open) => {
                                    setShowCategoryForm(open);
                                    if (!open) setEditingCategory(null);
                                }}
                            >
                                <DialogContent className="!max-w-2xl !w-[92vw] !max-h-[90vh] !overflow-y-auto !p-0 !bg-transparent !border-0 !shadow-none">
                                    <CategoryForm
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
                                </DialogContent>
                            </Dialog>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {categories && categories.length > 0 ? (
                                    categories.map((category) => (
                                        <motion.div
                                            key={category.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="glassmorphism rounded-xl p-6 border border-gray-700"
                                            data-testid={`admin-category-${category.id}`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                                                    <p className="text-sm text-gray-400 mt-1">{category.description || 'No description'}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => { setEditingCategory(category); setShowCategoryForm(true); }}
                                                        data-testid={`button-edit-category-${category.id}`}
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => deleteCategoryMutation.mutate(category.id)}
                                                        className="text-red-400 hover:text-red-300"
                                                        data-testid={`button-delete-category-${category.id}`}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-400 col-span-full">No categories yet</div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'applications' && (
                        <><div>
                            {/* Header with search */}
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold text-white mb-3">Applications ({applications?.length || 0})</h2>
                                <div className="relative max-w-md">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        placeholder="Search by name, email, or job title..."
                                        value={appSearchQuery}
                                        onChange={(e) => setAppSearchQuery(e.target.value)}
                                        className="pl-10 bg-gray-800 border-gray-700 text-white"
                                        data-testid="input-search-applications"
                                    />
                                </div>
                            </div>

                            {/* Status Tabs */}
                            <div className="mb-6">
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {STATUS_TABS.map((tab) => (
                                        <button
                                            key={tab.key}
                                            onClick={() => setActiveStatusTab(tab.key)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeStatusTab === tab.key
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                                                }`}
                                            data-testid={`tab-status-${tab.key}`}
                                        >
                                            {tab.label}
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${activeStatusTab === tab.key
                                                ? 'bg-purple-500/50 text-white'
                                                : 'bg-gray-700 text-gray-400'
                                                }`}>
                                                {getTabCount(tab.key)}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {/* Sub-tabs for Selected */}
                                {activeStatusTab === 'Selected' && (
                                    <div className="flex gap-2 ml-4 mb-4">
                                        {SELECTED_SUB_TABS.map((subTab) => (
                                            <button
                                                key={subTab}
                                                onClick={() => setActiveSelectedSubTab(subTab)}
                                                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-2 ${activeSelectedSubTab === subTab
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
                                                    }`}
                                                data-testid={`subtab-${subTab}`}
                                            >
                                                {subTab}
                                                <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeSelectedSubTab === subTab
                                                    ? 'bg-green-500/50 text-white'
                                                    : 'bg-gray-600 text-gray-400'
                                                    }`}>
                                                    {getSubTabCount(subTab)}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Rejected tab sort + export controls */}
                            {activeStatusTab === 'Rejected' && (
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 text-xs">Sort:</span>
                                        <button
                                            onClick={() => setRejectionSortOrder('newest')}
                                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${rejectionSortOrder === 'newest' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                                        >Newest First</button>
                                        <button
                                            onClick={() => setRejectionSortOrder('oldest')}
                                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${rejectionSortOrder === 'oldest' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                                        >Oldest First</button>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="text-xs bg-purple-700 hover:bg-purple-600 text-white gap-1.5"
                                        onClick={() => exportRejectionsPDF()}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                        Export PDF
                                    </Button>
                                </div>
                            )}

                            {/* Applications List */}
                            <div className="space-y-3">
                                {applicationsLoading ? (
                                    <div className="text-center py-8 text-gray-400">Loading...</div>
                                ) : (() => {
                                    const currentApps = activeStatusTab === 'Selected'
                                        ? (applications || []).filter(app => {
                                            const matchesStatus = app.status === activeSelectedSubTab;
                                            const matchesSearch = appSearchQuery === '' ||
                                                app.applicantName.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
                                                app.applicantEmail.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
                                                app.jobTitle.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
                                                app.jobIdCode.toLowerCase().includes(appSearchQuery.toLowerCase());
                                            return matchesStatus && matchesSearch;
                                        })
                                        : getApplicationsForTab(activeStatusTab);

                                    const isScheduledTab = activeStatusTab === 'Interview Scheduled';
                                    const todayStr = new Date().toISOString().split('T')[0];

                                    const upcomingApps = isScheduledTab
                                        ? currentApps.filter(a => a.scheduledInterviewDate && a.scheduledInterviewDate >= todayStr).sort((a, b) => (a.scheduledInterviewDate || '').localeCompare(b.scheduledInterviewDate || ''))
                                        : currentApps;
                                    const missedApps = isScheduledTab
                                        ? currentApps.filter(a => a.scheduledInterviewDate && a.scheduledInterviewDate < todayStr).sort((a, b) => (b.scheduledInterviewDate || '').localeCompare(a.scheduledInterviewDate || ''))
                                        : [];
                                    const appsWithoutDate = isScheduledTab
                                        ? currentApps.filter(a => !a.scheduledInterviewDate)
                                        : [];
                                    const isRejectedTab = activeStatusTab === 'Rejected';
                                    const sortedApps = isScheduledTab ? [...upcomingApps, ...appsWithoutDate]
                                        : isRejectedTab
                                            ? [...currentApps].sort((a, b) => {
                                                const dateA = new Date(a.createdAt).getTime();
                                                const dateB = new Date(b.createdAt).getTime();
                                                return rejectionSortOrder === 'newest' ? dateB - dateA : dateA - dateB;
                                            })
                                            : currentApps;

                                    const allDisplayApps = isScheduledTab ? [...sortedApps, ...missedApps] : sortedApps;
                                    const missedStartIndex = isScheduledTab ? sortedApps.length : -1;

                                    return currentApps.length > 0 ? (
                                        <>{allDisplayApps.map((app, idx) => (
                                            <div key={app.id}>
                                                {isScheduledTab && idx === missedStartIndex && missedApps.length > 0 && (
                                                    <div className="flex items-center gap-3 mt-6 mb-3">
                                                        <hr className="flex-1 border-amber-500/40" />
                                                        <span className="text-amber-400 text-sm font-semibold whitespace-nowrap">Missed Interviews ({missedApps.length})</span>
                                                        <hr className="flex-1 border-amber-500/40" />
                                                    </div>
                                                )}
                                                <div
                                                    className={`rounded-lg border overflow-hidden ${isScheduledTab && idx >= missedStartIndex && missedApps.length > 0 ? 'bg-amber-900/10 border-amber-700/30' : 'bg-gray-800/30 border-gray-700/50'}`}
                                                    data-testid={`admin-application-${app.id}`}
                                                >
                                                    {/* Compact Card Header */}
                                                    <div
                                                        className="p-3 cursor-pointer flex items-center justify-between hover:bg-gray-700/30 transition-colors"
                                                        onClick={() => toggleAppExpand(app.id)}
                                                    >
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            {/* Left: name, job, date (date visible on mobile only) */}
                                                            <div className="flex flex-col min-w-0 flex-1">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="text-sm font-medium text-white">{app.applicantName}</span>
                                                                    <span className="text-xs text-gray-500 min-w-0 truncate">({app.applicantEmail})</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                                    <span className="text-xs font-mono text-purple-400">{app.jobIdCode}</span>
                                                                    <span className="text-xs text-gray-400">{app.jobTitle}</span>
                                                                </div>
                                                                {/* Date shown below name on mobile only */}
                                                                {app.scheduledInterviewDate && app.scheduledInterviewTime && (
                                                                    <span className="sm:hidden text-xs text-cyan-300 flex items-center gap-1 bg-cyan-900/30 px-2 py-0.5 rounded mt-1 self-start">
                                                                        <Calendar className="w-3 h-3 shrink-0" />
                                                                        {formatDateReadable(app.scheduledInterviewDate)} &bull; {formatTimeRange12(convertISTtoSGT(app.scheduledInterviewTime))} SGT
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {/* Right: icons + date (desktop) + badge + chevron */}
                                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                                {app.screeningUpdatedAt && (
                                                                    <span className="text-green-400" title="Screening Submitted">
                                                                        <CheckCircle className="w-3 h-3" />
                                                                    </span>
                                                                )}
                                                                {app.interviewUpdatedAt && (
                                                                    <span className="text-purple-400" title="Interview Availability Submitted">
                                                                        <Calendar className="w-3 h-3" />
                                                                    </span>
                                                                )}
                                                                {app.scheduledInterviewDate && (
                                                                    <span className={`${app.interviewConfirmed ? 'text-cyan-400' : 'text-yellow-400'}`} title={app.interviewConfirmed ? 'Interview Confirmed' : 'Awaiting Confirmation'}>
                                                                        <Clock className="w-3 h-3" />
                                                                    </span>
                                                                )}
                                                                {/* Date shown in right column on desktop only */}
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
                                                                    <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                                                                ) : (
                                                                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Expanded Details */}
                                                    {expandedApps.has(app.id) && (
                                                        <div className="px-4 pb-4 border-t border-gray-700/50 pt-4">
                                                            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                                                                <div className="flex-1 space-y-4">
                                                                    <div className="text-sm text-gray-400">
                                                                        Applied: {new Date(app.createdAt).toLocaleDateString()}
                                                                    </div>

                                                                    {app.coverLetter && (
                                                                        <div>
                                                                            <p className="text-xs text-gray-500 mb-1">Cover Letter:</p>
                                                                            <p
                                                                                className="text-sm text-gray-300 bg-gray-800/50 p-3 rounded max-h-48 overflow-y-auto whitespace-pre-wrap"
                                                                            >{app.coverLetter}</p>
                                                                        </div>
                                                                    )}

                                                                    {app.resumePath && (
                                                                        <a
                                                                            href={app.resumePath}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300"
                                                                        >
                                                                            <Download className="w-4 h-4" />
                                                                            View Resume
                                                                        </a>
                                                                    )}

                                                                    {app.screeningUpdatedAt && (
                                                                        <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                                                                            <h4 className="text-sm font-semibold text-blue-400 mb-3">Screening Details</h4>
                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                                                                <div><span className="text-gray-500">Full Name:</span> <span className="text-gray-300">{app.screeningFullName || 'N/A'}</span></div>
                                                                                <div><span className="text-gray-500">DOB:</span> <span className="text-gray-300">{app.screeningDob || 'N/A'}</span></div>
                                                                                <div><span className="text-gray-500">Gender:</span> <span className="text-gray-300">{app.screeningGender || 'N/A'}</span></div>
                                                                                <div><span className="text-gray-500">Location:</span> <span className="text-gray-300">{app.screeningCurrentLocation || 'N/A'}</span></div>
                                                                                <div><span className="text-gray-500">Work From Office:</span> <span className="text-gray-300">{app.screeningWillingWorkFromOffice || 'N/A'}</span></div>
                                                                                <div><span className="text-gray-500">Exp Documents:</span> <span className="text-gray-300">{app.screeningWillingProvideExpDocs || 'N/A'}</span></div>
                                                                                <div><span className="text-gray-500">Bank Statements:</span> <span className="text-gray-300">{app.screeningWillingBankStatements || 'N/A'}</span></div>
                                                                                <div><span className="text-gray-500">Experience:</span> <span className="text-gray-300">{app.screeningYearsExperience || 'N/A'}</span></div>
                                                                                <div><span className="text-gray-500">Education:</span> <span className="text-gray-300">{app.screeningEducationalQualification || 'N/A'}</span></div>
                                                                                <div><span className="text-gray-500">Current CTC:</span> <span className="text-gray-300">{app.screeningCurrentCtc || 'N/A'}</span></div>
                                                                                <div><span className="text-gray-500">Expected CTC:</span> <span className="text-gray-300">{app.screeningExpectedCtc || 'N/A'}</span></div>
                                                                                <div><span className="text-gray-500">BG Check:</span> <span className="text-gray-300">{app.screeningWillingBackgroundCheck || 'N/A'}</span></div>
                                                                                <div><span className="text-gray-500">Notice Period:</span> <span className="text-gray-300">{app.screeningNoticePeriod || 'N/A'}</span></div>
                                                                                <div><span className="text-gray-500">Willing to Relocate to Vizag:</span> <span className="text-gray-300">{app.screeningWillingJoinDate || 'N/A'}</span></div>
                                                                            </div>
                                                                            <p className="text-xs text-gray-500 mt-2">Updated: {new Date(app.screeningUpdatedAt).toLocaleString()}</p>
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
                                                                                <div>
                                                                                    <div><span className="text-gray-500">Date:</span> <span className="text-white font-medium">{formatDateReadable(app.scheduledInterviewDate)}</span></div>
                                                                                    <div className="mt-1"><span className="text-gray-500">Round:</span> <span className="text-purple-300 font-medium">{app.status.includes('Round 3') ? 'Round 3 - Manager/HR' : app.status.includes('Round 2') ? 'Round 2 - LSP-E' : 'Round 1 - Technical'}</span></div>
                                                                                </div>
                                                                                <div>
                                                                                    <div><span className="text-gray-500">Time:</span> <span className="text-white font-medium">{formatTimeRange12(app.scheduledInterviewTime)} IST</span></div>
                                                                                    <div className="mt-1"><span className="text-gray-500">SGT:</span> <span className="text-white font-medium">{formatTimeRange12(convertISTtoSGT(app.scheduledInterviewTime))} SGT</span></div>
                                                                                </div>
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
                                                                            {app.interviewConfirmedAt && (
                                                                                <p className="text-xs text-gray-500 mt-1">Confirmed: {new Date(app.interviewConfirmedAt).toLocaleString()}</p>
                                                                            )}
                                                                            <Button
                                                                                onClick={() => setRescheduleDialog({
                                                                                    open: true,
                                                                                    appId: app.id,
                                                                                    message: ''
                                                                                })}
                                                                                disabled={requestRescheduleMutation.isPending}
                                                                                className="mt-3 w-full bg-orange-600 hover:bg-orange-500 text-xs h-8 flex items-center justify-center gap-2"
                                                                            >
                                                                                <RefreshCw className="w-3 h-3" />
                                                                                Request Reschedule
                                                                            </Button>

                                                                            <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-600/30">
                                                                                <Label className="text-gray-400 text-xs mb-2 block">Meeting Link (Teams / Zoom / Google Meet)</Label>
                                                                                <div className="flex gap-2">
                                                                                    <Input
                                                                                        value={meetingLinks[app.id] ?? app.meetingLink ?? ''}
                                                                                        onChange={(e) => setMeetingLinks(prev => ({ ...prev, [app.id]: e.target.value }))}
                                                                                        placeholder="Paste meeting link here..."
                                                                                        className="bg-gray-900 border-gray-600 text-white text-xs h-8 flex-1"
                                                                                    />
                                                                                    <Button
                                                                                        onClick={() => saveMeetingLinkMutation.mutate({ appId: app.id, meetingLink: meetingLinks[app.id] ?? app.meetingLink ?? '' })}
                                                                                        disabled={saveMeetingLinkMutation.isPending || !(meetingLinks[app.id] ?? app.meetingLink)}
                                                                                        className="bg-blue-600 hover:bg-blue-500 text-xs h-8 px-3"
                                                                                    >
                                                                                        {saveMeetingLinkMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Send className="w-3 h-3 mr-1" /> Save & Email</>}
                                                                                    </Button>
                                                                                </div>
                                                                                {app.meetingLink && (
                                                                                    <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                                                                                        <CheckCircle className="w-3 h-3" /> Meeting link saved
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {app.interviewUpdatedAt && !app.scheduledInterviewDate && (
                                                                        <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                                                                            <h4 className="text-sm font-semibold text-purple-400 mb-3">Interview Availability</h4>
                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                                                                <div><span className="text-gray-500">Available From:</span> <span className="text-gray-300">{app.interviewAvailableFrom || 'N/A'}</span></div>
                                                                                <div><span className="text-gray-500">Available To:</span> <span className="text-gray-300">{app.interviewAvailableTo || 'N/A'}</span></div>
                                                                                <div className="col-span-2"><span className="text-gray-500">Preferred Time:</span> <span className="text-gray-300">{app.interviewPreferredTime || 'N/A'}</span></div>
                                                                            </div>
                                                                            <p className="text-xs text-gray-500 mt-2">Updated: {new Date(app.interviewUpdatedAt).toLocaleString()}</p>
                                                                        </div>
                                                                    )}

                                                                </div>

                                                                <div className="lg:w-72 space-y-3">
                                                                    <div>
                                                                        <Label className="text-gray-400 text-xs mb-2 block">Update Status</Label>
                                                                        <Select
                                                                            value={pendingUpdates[app.id]?.status || app.status}
                                                                            onValueChange={(status) => {
                                                                                initPendingUpdate(app.id, app.status, app.adminRemarks);
                                                                                updatePendingStatus(app.id, status);
                                                                            }}
                                                                        >
                                                                            <SelectTrigger className="bg-gray-800 border-gray-700 text-white" data-testid={`select-status-${app.id}`}>
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                            <SelectContent className="max-h-80 overflow-y-auto">
                                                                                <div className="px-2 py-1 text-xs text-gray-500 font-semibold">Initial Stage</div>
                                                                                {APPLICATION_STATUS_GROUPS.initial.map((status) => (
                                                                                    <SelectItem key={status} value={status}>{status}</SelectItem>
                                                                                ))}
                                                                                <div className="h-px bg-gray-600 my-2" />
                                                                                <div className="px-2 py-1 text-xs text-gray-500 font-semibold">Round 1 - Technical Interview</div>
                                                                                {APPLICATION_STATUS_GROUPS.round1.map((status) => (
                                                                                    <SelectItem key={status} value={status}>{status}</SelectItem>
                                                                                ))}
                                                                                <div className="h-px bg-gray-600 my-2" />
                                                                                <div className="px-2 py-1 text-xs text-gray-500 font-semibold">Round 2 - LSP-E</div>
                                                                                {APPLICATION_STATUS_GROUPS.round2.map((status) => (
                                                                                    <SelectItem key={status} value={status}>{status}</SelectItem>
                                                                                ))}
                                                                                <div className="h-px bg-gray-600 my-2" />
                                                                                <div className="px-2 py-1 text-xs text-gray-500 font-semibold">Round 3 - Manager/HR</div>
                                                                                {APPLICATION_STATUS_GROUPS.round3.map((status) => (
                                                                                    <SelectItem key={status} value={status}>{status}</SelectItem>
                                                                                ))}
                                                                                <div className="h-px bg-gray-600 my-2" />
                                                                                <div className="px-2 py-1 text-xs text-gray-500 font-semibold">Final Selection</div>
                                                                                {APPLICATION_STATUS_GROUPS.selection.map((status) => (
                                                                                    <SelectItem key={status} value={status}>{status}</SelectItem>
                                                                                ))}
                                                                                <div className="h-px bg-gray-600 my-2" />
                                                                                <div className="px-2 py-1 text-xs text-gray-500 font-semibold">Closed</div>
                                                                                {APPLICATION_STATUS_GROUPS.closed.map((status) => (
                                                                                    <SelectItem key={status} value={status}>{status}</SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>

                                                                    {/* Internal rejection reason - required for rejection statuses */}
                                                                    {REJECTION_STATUSES.includes(pendingUpdates[app.id]?.status || app.status) && pendingUpdates[app.id] && (
                                                                        <div>
                                                                            <Label className="text-red-400 text-xs mb-2 block font-semibold">⚠ Internal Rejection Reason (Required — not sent to candidate)</Label>
                                                                            <Textarea
                                                                                placeholder="Enter internal reason for rejection (e.g. lack of technical depth, communication issues, etc.)..."
                                                                                value={pendingUpdates[app.id]?.internalRemarks ?? ''}
                                                                                onChange={(e) => updatePendingInternalRemarks(app.id, e.target.value)}
                                                                                className="bg-red-950/20 border-red-900/50 text-white min-h-[80px] placeholder:text-red-900/70"
                                                                                data-testid={`textarea-internal-remarks-${app.id}`}
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    <div>
                                                                        <Label className="text-gray-400 text-xs mb-2 block">Remarks to Candidate (Optional)</Label>
                                                                        <Textarea
                                                                            placeholder="Add remarks for the candidate..."
                                                                            value={pendingUpdates[app.id]?.remarks ?? app.adminRemarks ?? ''}
                                                                            onChange={(e) => {
                                                                                initPendingUpdate(app.id, app.status, app.adminRemarks);
                                                                                updatePendingRemarks(app.id, e.target.value);
                                                                            }}
                                                                            className="bg-gray-800 border-gray-700 text-white min-h-[80px]"
                                                                            data-testid={`textarea-remarks-${app.id}`}
                                                                        />
                                                                    </div>

                                                                    <Button
                                                                        onClick={() => submitStatusUpdate(app.id)}
                                                                        disabled={updateStatusMutation.isPending || !pendingUpdates[app.id]}
                                                                        className="w-full bg-purple-600 hover:bg-purple-500"
                                                                        data-testid={`button-submit-status-${app.id}`}
                                                                    >
                                                                        {updateStatusMutation.isPending ? 'Updating...' : 'Submit Status Update'}
                                                                    </Button>

                                                                    {app.adminRemarks && !pendingUpdates[app.id] && (
                                                                        <div className="p-2 bg-gray-800/50 rounded text-xs">
                                                                            <span className="text-gray-500">Candidate Remarks:</span>
                                                                            <p className="text-gray-300 mt-1">{app.adminRemarks}</p>
                                                                        </div>
                                                                    )}
                                                                    {app.internalRemarks && !pendingUpdates[app.id] && (
                                                                        <div className="p-2 bg-red-950/20 border border-red-900/30 rounded text-xs">
                                                                            <div className="flex items-center justify-between mb-1">
                                                                                <span className="text-red-400 font-semibold">Internal Reason:</span>
                                                                                <button
                                                                                    className="text-gray-400 hover:text-white text-xs underline"
                                                                                    onClick={() => { setInlineRemarksEditId(app.id); setInlineRemarksText(app.internalRemarks || ''); }}
                                                                                >Edit</button>
                                                                            </div>
                                                                            {inlineRemarksEditId === app.id ? (
                                                                                <div className="space-y-2 mt-1">
                                                                                    <Textarea
                                                                                        value={inlineRemarksText}
                                                                                        onChange={(e) => setInlineRemarksText(e.target.value)}
                                                                                        className="bg-red-950/30 border-red-900/50 text-white text-xs min-h-[60px]"
                                                                                    />
                                                                                    <div className="flex gap-2">
                                                                                        <Button size="sm" className="text-xs h-7 bg-red-700 hover:bg-red-600"
                                                                                            disabled={updateInternalRemarksMutation.isPending || !inlineRemarksText.trim()}
                                                                                            onClick={() => updateInternalRemarksMutation.mutate({ id: app.id, internalRemarks: inlineRemarksText })}
                                                                                        >Save</Button>
                                                                                        <Button size="sm" variant="ghost" className="text-xs h-7 text-gray-400"
                                                                                            onClick={() => { setInlineRemarksEditId(null); setInlineRemarksText(''); }}
                                                                                        >Cancel</Button>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <p className="text-red-300/80 mt-1">{app.internalRemarks}</p>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    {/* Missing internal remarks alert for old rejections */}
                                                                    {REJECTION_STATUSES.includes(app.status) && !app.internalRemarks && !pendingUpdates[app.id] && (
                                                                        <div className="p-2 bg-yellow-950/30 border border-yellow-700/50 rounded text-xs">
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="text-yellow-400">⚠ No internal reason recorded.</span>
                                                                                <button
                                                                                    className="text-yellow-400 hover:text-yellow-300 text-xs underline"
                                                                                    onClick={() => { setInlineRemarksEditId(app.id); setInlineRemarksText(''); initPendingUpdate(app.id, app.status, app.adminRemarks); setPendingUpdates(prev => { const upd = { ...prev }; delete upd[app.id]; return upd; }); }}
                                                                                >Add Now</button>
                                                                            </div>
                                                                            {inlineRemarksEditId === app.id && (
                                                                                <div className="space-y-2 mt-2">
                                                                                    <Textarea
                                                                                        value={inlineRemarksText}
                                                                                        onChange={(e) => setInlineRemarksText(e.target.value)}
                                                                                        placeholder="Enter internal rejection reason..."
                                                                                        className="bg-yellow-950/20 border-yellow-700/50 text-white text-xs min-h-[60px]"
                                                                                    />
                                                                                    <div className="flex gap-2">
                                                                                        <Button size="sm" className="text-xs h-7 bg-yellow-700 hover:bg-yellow-600"
                                                                                            disabled={updateInternalRemarksMutation.isPending || !inlineRemarksText.trim()}
                                                                                            onClick={() => updateInternalRemarksMutation.mutate({ id: app.id, internalRemarks: inlineRemarksText })}
                                                                                        >Save</Button>
                                                                                        <Button size="sm" variant="ghost" className="text-xs h-7 text-gray-400"
                                                                                            onClick={() => { setInlineRemarksEditId(null); setInlineRemarksText(''); }}
                                                                                        >Cancel</Button>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}</>
                                    ) : (
                                        <div className="text-center py-8 text-gray-400">
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

                            <Dialog open={rescheduleDialog.open} onOpenChange={(open) => !open && setRescheduleDialog({ open: false, appId: null, message: '' })}>
                                <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
                                    <DialogHeader>
                                        <DialogTitle className="text-white">Request Interview Reschedule</DialogTitle>
                                        <DialogDescription className="text-gray-400">
                                            This will clear the scheduled interview and ask the candidate to provide new availability dates.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div>
                                            <Label className="text-gray-400 text-sm mb-2 block">Message to Candidate (Optional)</Label>
                                            <Textarea
                                                placeholder="e.g., We couldn't make it on the scheduled date. Please provide new dates that work for you..."
                                                value={rescheduleDialog.message}
                                                onChange={(e) => setRescheduleDialog(prev => ({ ...prev, message: e.target.value }))}
                                                className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter className="gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setRescheduleDialog({ open: false, appId: null, message: '' })}
                                            className="border-gray-600 text-gray-300 hover:bg-gray-800"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                if (rescheduleDialog.appId) {
                                                    requestRescheduleMutation.mutate({
                                                        id: rescheduleDialog.appId,
                                                        message: rescheduleDialog.message || 'We need to reschedule your interview. Please log in and provide new availability dates.'
                                                    });
                                                    setRescheduleDialog({ open: false, appId: null, message: '' });
                                                }
                                            }}
                                            disabled={requestRescheduleMutation.isPending}
                                            className="bg-orange-600 hover:bg-orange-500 text-white"
                                        >
                                            {requestRescheduleMutation.isPending ? 'Sending...' : 'Send Reschedule Request'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            {/* Export Warning Dialog — missing internal remarks */}
                            <Dialog open={exportWarningDialog.open} onOpenChange={(open) => !open && setExportWarningDialog({ open: false, missingApps: [] })}>
                                <DialogContent className="bg-gray-900 border-gray-700 max-w-lg max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle className="text-yellow-400 flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                            Missing Internal Rejection Reasons
                                        </DialogTitle>
                                        <DialogDescription className="text-gray-400">
                                            {exportWarningDialog.missingApps.length} rejected application{exportWarningDialog.missingApps.length > 1 ? 's have' : ' has'} no internal reason recorded. Please add reasons before exporting, or export anyway (those records will show "—" in the PDF).
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-2 my-2">
                                        {exportWarningDialog.missingApps.map(app => (
                                            <div key={app.id} className="flex items-center justify-between bg-gray-800 rounded px-3 py-2 text-sm">
                                                <div>
                                                    <p className="text-white font-medium">{app.applicantName}</p>
                                                    <p className="text-gray-400 text-xs">{app.jobTitle} · {app.status}</p>
                                                </div>
                                                <button
                                                    className="text-yellow-400 hover:text-yellow-300 text-xs underline ml-4 shrink-0"
                                                    onClick={() => {
                                                        setExportWarningDialog({ open: false, missingApps: [] });
                                                        setInlineRemarksEditId(app.id);
                                                        setInlineRemarksText('');
                                                        setActiveStatusTab('Rejected');
                                                    }}
                                                >
                                                    Add Reason
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <DialogFooter className="flex gap-2 sm:justify-between">
                                        <Button
                                            variant="ghost"
                                            className="text-gray-400 hover:text-white"
                                            onClick={() => setExportWarningDialog({ open: false, missingApps: [] })}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            className="bg-purple-700 hover:bg-purple-600 text-white gap-1.5"
                                            onClick={() => {
                                                const rejectedApps = (applications || []).filter(app => REJECTION_STATUSES_ALL.includes(app.status));
                                                doExportRejectionsPDF(rejectedApps);
                                            }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                            Export Anyway
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </>
                    )}

                    {activeTab === 'users' && (
                        <div>
                            {selectedUserId && userDetails ? (
                                <div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedUserId(null)}
                                        className="text-gray-400 hover:text-white mb-4"
                                        data-testid="button-back-to-users"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back to Users
                                    </Button>

                                    {userDetailsLoading ? (
                                        <div className="text-center py-8 text-gray-400">Loading user details...</div>
                                    ) : (
                                        <div className="space-y-6">
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="glassmorphism rounded-xl p-6 border border-gray-700"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h2 className="text-xl font-bold text-white">
                                                            {userDetails.user.firstName} {userDetails.user.lastName}
                                                        </h2>
                                                        <p className="text-gray-400">{userDetails.user.email}</p>
                                                        <p className="text-gray-500 text-sm">{userDetails.user.mobileNumber}</p>
                                                    </div>
                                                    <div className="flex items-center gap-4">
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
                                                            data-testid={`button-toggle-block-${userDetails.user.id}`}
                                                        >
                                                            {userDetails.user.isBlocked ? 'Unblock' : 'Block'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </motion.div>

                                            {userDetails.profile && (
                                                <>
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="glassmorphism rounded-xl p-6 border border-gray-700"
                                                    >
                                                        <h3 className="text-lg font-semibold text-white mb-4">Personal Details</h3>
                                                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                                            <div><span className="text-gray-500">Date of Birth:</span> <span className="text-gray-300 ml-2">{userDetails.profile.dateOfBirth || 'N/A'}</span></div>
                                                            <div><span className="text-gray-500">Gender:</span> <span className="text-gray-300 ml-2">{userDetails.profile.gender || 'N/A'}</span></div>
                                                            <div><span className="text-gray-500">City:</span> <span className="text-gray-300 ml-2">{userDetails.profile.city || 'N/A'}</span></div>
                                                            <div><span className="text-gray-500">State:</span> <span className="text-gray-300 ml-2">{userDetails.profile.state || 'N/A'}</span></div>
                                                            <div><span className="text-gray-500">Country:</span> <span className="text-gray-300 ml-2">{userDetails.profile.country || 'N/A'}</span></div>
                                                            <div><span className="text-gray-500">Pincode:</span> <span className="text-gray-300 ml-2">{userDetails.profile.pincode || 'N/A'}</span></div>
                                                            <div className="md:col-span-2 lg:col-span-3"><span className="text-gray-500">Address:</span> <span className="text-gray-300 ml-2">{userDetails.profile.address || 'N/A'}</span></div>
                                                        </div>
                                                    </motion.div>

                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="glassmorphism rounded-xl p-6 border border-gray-700"
                                                    >
                                                        <h3 className="text-lg font-semibold text-white mb-4">Educational Background</h3>
                                                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                                                            <div><span className="text-gray-500">Highest Education:</span> <span className="text-gray-300 ml-2">{userDetails.profile.highestEducation || 'N/A'}</span></div>
                                                            <div className="md:col-span-2"><span className="text-gray-500">Education Details:</span> <span className="text-gray-300 ml-2">{userDetails.profile.educationDetails || 'N/A'}</span></div>
                                                        </div>
                                                    </motion.div>

                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="glassmorphism rounded-xl p-6 border border-gray-700"
                                                    >
                                                        <h3 className="text-lg font-semibold text-white mb-4">Professional Summary</h3>
                                                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                                            <div><span className="text-gray-500">Current Job Title:</span> <span className="text-gray-300 ml-2">{userDetails.profile.currentJobTitle || 'N/A'}</span></div>
                                                            <div><span className="text-gray-500">Current Company:</span> <span className="text-gray-300 ml-2">{userDetails.profile.currentCompany || 'N/A'}</span></div>
                                                            <div><span className="text-gray-500">Total Experience:</span> <span className="text-gray-300 ml-2">{userDetails.profile.totalExperience || 'N/A'}</span></div>
                                                            <div className="md:col-span-2 lg:col-span-3"><span className="text-gray-500">Skills:</span> <span className="text-gray-300 ml-2">{userDetails.profile.skills || 'N/A'}</span></div>
                                                        </div>
                                                    </motion.div>

                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="glassmorphism rounded-xl p-6 border border-gray-700"
                                                    >
                                                        <h3 className="text-lg font-semibold text-white mb-4">Social Links & Resume</h3>
                                                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                                            <div>
                                                                <span className="text-gray-500">LinkedIn:</span>
                                                                {userDetails.profile.linkedinUrl ? (
                                                                    <a href={userDetails.profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 ml-2">{userDetails.profile.linkedinUrl}</a>
                                                                ) : (
                                                                    <span className="text-gray-300 ml-2">N/A</span>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500">GitHub:</span>
                                                                {userDetails.profile.githubUrl ? (
                                                                    <a href={userDetails.profile.githubUrl} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 ml-2">{userDetails.profile.githubUrl}</a>
                                                                ) : (
                                                                    <span className="text-gray-300 ml-2">N/A</span>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500">Portfolio:</span>
                                                                {userDetails.profile.portfolioUrl ? (
                                                                    <a href={userDetails.profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 ml-2">{userDetails.profile.portfolioUrl}</a>
                                                                ) : (
                                                                    <span className="text-gray-300 ml-2">N/A</span>
                                                                )}
                                                            </div>
                                                            <div className="md:col-span-2 lg:col-span-3">
                                                                <span className="text-gray-500">Resume:</span>
                                                                {userDetails.profile.resumePath ? (
                                                                    <a href={userDetails.profile.resumePath} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 ml-2">
                                                                        <Download className="w-4 h-4" />
                                                                        Download Resume
                                                                    </a>
                                                                ) : (
                                                                    <span className="text-gray-300 ml-2">Not uploaded</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                </>
                                            )}

                                            {!userDetails.profile && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="glassmorphism rounded-xl p-6 border border-gray-700 text-center"
                                                >
                                                    <p className="text-gray-400">Profile not yet created by the candidate</p>
                                                </motion.div>
                                            )}

                                            {userDetails.certifications.length > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="glassmorphism rounded-xl p-6 border border-gray-700"
                                                >
                                                    <h3 className="text-lg font-semibold text-white mb-4">Certifications ({userDetails.certifications.length})</h3>
                                                    <div className="space-y-3">
                                                        {userDetails.certifications.map(cert => (
                                                            <div key={cert.id} className="bg-gray-800/50 p-4 rounded">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <p className="text-white font-medium">{cert.certificateName}</p>
                                                                        <p className="text-gray-400 text-sm">{cert.issuingOrganization}</p>
                                                                    </div>
                                                                    {cert.certificateUrl && (
                                                                        <a href={cert.certificateUrl} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 text-sm">
                                                                            View Certificate
                                                                        </a>
                                                                    )}
                                                                </div>
                                                                <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                                                                    {cert.issueDate && <span>Issued: {cert.issueDate}</span>}
                                                                    {cert.expiryDate && <span>Expires: {cert.expiryDate}</span>}
                                                                    {cert.certificateNumber && <span>ID: {cert.certificateNumber}</span>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}

                                            {userDetails.workExperience.length > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="glassmorphism rounded-xl p-6 border border-gray-700"
                                                >
                                                    <h3 className="text-lg font-semibold text-white mb-4">Work Experience ({userDetails.workExperience.length})</h3>
                                                    <div className="space-y-4">
                                                        {userDetails.workExperience.map(exp => (
                                                            <div key={exp.id} className="bg-gray-800/50 p-4 rounded border-l-2 border-purple-500">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <p className="text-white font-medium">{exp.jobTitle}</p>
                                                                        <p className="text-purple-400 text-sm">{exp.companyName}</p>
                                                                        {exp.location && <p className="text-gray-500 text-sm">{exp.location}</p>}
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-gray-400 text-sm">{exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}</p>
                                                                        {exp.isCurrent && <Badge className="bg-green-500/20 text-green-400 border-0 mt-1">Current</Badge>}
                                                                    </div>
                                                                </div>
                                                                {exp.description && <p className="text-gray-300 text-sm mt-3">{exp.description}</p>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}

                                            {userDetails.applications.length > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="glassmorphism rounded-xl p-6 border border-gray-700"
                                                >
                                                    <h3 className="text-lg font-semibold text-white mb-4">Job Applications ({userDetails.applications.length})</h3>
                                                    <div className="space-y-3">
                                                        {userDetails.applications.map(app => (
                                                            <div key={app.id} className="bg-gray-800/50 p-3 rounded flex justify-between items-center">
                                                                <div>
                                                                    <p className="text-white font-medium">{app.jobTitle}</p>
                                                                    <p className="text-gray-500 text-xs">{app.jobIdCode} | Applied: {new Date(app.createdAt).toLocaleDateString()}</p>
                                                                </div>
                                                                <Badge className={`${getStatusColor(app.status)} border-0`}>{app.status}</Badge>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-semibold text-white">Registered Users ({users?.length || 0})</h2>
                                        <Button
                                            size="sm"
                                            className="text-xs bg-emerald-700 hover:bg-emerald-600 text-white gap-1.5"
                                            onClick={() => exportUsersCSV()}
                                            disabled={!users || users.length === 0}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                            Export CSV
                                        </Button>
                                    </div>

                                    <div className="space-y-4">
                                        {usersLoading ? (
                                            <div className="text-center py-8 text-gray-400">Loading...</div>
                                        ) : users && users.length > 0 ? (
                                            users.map((user) => (
                                                <motion.div
                                                    key={user.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="glassmorphism rounded-xl p-6 border border-gray-700"
                                                    data-testid={`admin-user-${user.id}`}
                                                >
                                                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                                                <Badge className={user.emailVerified ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                                                                    {user.emailVerified ? 'Verified' : 'Unverified'}
                                                                </Badge>
                                                                <Badge className={user.isBlocked ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}>
                                                                    {user.isBlocked ? 'Blocked' : 'Active'}
                                                                </Badge>
                                                            </div>
                                                            <h3 className="text-lg font-semibold text-white">{user.firstName} {user.lastName}</h3>
                                                            <div className="mt-1 space-y-1">
                                                                <p className="text-sm text-gray-300">{user.email}</p>
                                                                <p className="text-sm text-gray-400">{user.mobileNumber}</p>
                                                                <p className="text-xs text-gray-500">Registered: {new Date(user.createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setSelectedUserId(user.id)}
                                                                className="text-purple-400 border-purple-500/50 hover:bg-purple-500/20"
                                                                data-testid={`button-view-user-${user.id}`}
                                                            >
                                                                View Details
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => blockUserMutation.mutate({ userId: user.id, isBlocked: !user.isBlocked })}
                                                                className={user.isBlocked ? 'text-green-400 border-green-500/50 hover:bg-green-500/20' : 'text-red-400 border-red-500/50 hover:bg-red-500/20'}
                                                                disabled={blockUserMutation.isPending}
                                                                data-testid={`button-block-user-${user.id}`}
                                                            >
                                                                {user.isBlocked ? 'Unblock' : 'Block'}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-gray-400">No users registered yet</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'slots' && (
                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Calendar Date Picker */}
                            <div className="lg:col-span-2">
                                <div className="glassmorphism rounded-xl p-3 sm:p-6 border border-purple-500/30">
                                    <div className="flex items-center justify-between mb-3">
                                        <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                                            <Calendar className="w-5 h-5 text-purple-400 shrink-0" />
                                            Interview Availability Calendar
                                        </h2>
                                    </div>
                                    <p className="text-gray-400 text-xs sm:text-sm mb-4">
                                        Select dates and mark them Available or Not Available. Candidates see only available dates when booking.
                                    </p>

                                    {/* Month Navigation */}
                                    <div className="flex items-center justify-between mb-4">
                                        <button
                                            onClick={() => {
                                                if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1); }
                                                else setCalendarMonth(m => m - 1);
                                                setSelectedDates([]);
                                            }}
                                            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all"
                                        >
                                            <ChevronDown className="w-4 h-4 rotate-90" />
                                        </button>
                                        <span className="text-white font-semibold">
                                            {new Date(calendarYear, calendarMonth, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                                        </span>
                                        <button
                                            onClick={() => {
                                                if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1); }
                                                else setCalendarMonth(m => m + 1);
                                                setSelectedDates([]);
                                            }}
                                            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all"
                                        >
                                            <ChevronDown className="w-4 h-4 -rotate-90" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-4">
                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                            <div key={i} className="text-center text-gray-400 text-xs py-2 font-medium">
                                                <span className="sm:hidden">{day}</span>
                                                <span className="hidden sm:inline">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}</span>
                                            </div>
                                        ))}
                                        {(() => {
                                            const today = new Date();
                                            const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1);
                                            const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                                            const firstDayOfWeek = firstDayOfMonth.getDay();
                                            const days = [];

                                            for (let i = 0; i < firstDayOfWeek; i++) {
                                                days.push(<div key={`empty-${i}`} className="h-10" />);
                                            }

                                            for (let day = 1; day <= daysInMonth; day++) {
                                                const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                                const dateRecord = availableDates?.find(d => d.availableDate === dateStr);
                                                const isAvailable = dateRecord?.isActive === true;
                                                const isNotAvailable = dateRecord?.isActive === false;
                                                const isPast = new Date(dateStr) < new Date(today.toDateString());
                                                const isSunday = new Date(dateStr).getDay() === 0;
                                                const isSelected = selectedDates.includes(dateStr);

                                                days.push(
                                                    <button
                                                        key={day}
                                                        disabled={isPast || isSunday || bulkUpdateDatesMutation.isPending}
                                                        onClick={() => {
                                                            if (isPast || isSunday) return;
                                                            setSelectedDates(prev =>
                                                                prev.includes(dateStr)
                                                                    ? prev.filter(d => d !== dateStr)
                                                                    : [...prev, dateStr]
                                                            );
                                                        }}
                                                        className={`h-8 sm:h-10 rounded-lg text-xs sm:text-sm font-medium transition-all relative ${isPast || isSunday
                                                            ? 'bg-gray-800/30 text-gray-600 cursor-not-allowed'
                                                            : isSelected
                                                                ? 'bg-purple-500/50 text-purple-200 border-2 border-purple-400 ring-2 ring-purple-400/50'
                                                                : isAvailable
                                                                    ? 'bg-green-500/30 text-green-400 border border-green-500/50 hover:bg-green-500/40'
                                                                    : isNotAvailable
                                                                        ? 'bg-red-500/30 text-red-400 border border-red-500/50 hover:bg-red-500/40'
                                                                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700'
                                                            }`}
                                                        data-testid={`date-${dateStr}`}
                                                        title={isSunday ? 'Sundays not available' : isPast ? 'Past date' : isSelected ? 'Selected' : isAvailable ? 'Available' : isNotAvailable ? 'Not Available' : 'Not set'}
                                                    >
                                                        {day}
                                                        {isSelected && (
                                                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full flex items-center justify-center">
                                                                <CheckCircle className="w-2 h-2 text-white" />
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            }

                                            return days;
                                        })()}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-2 mb-4 p-3 sm:p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                                        <p className="text-sm text-gray-400">
                                            {selectedDates.length > 0
                                                ? `${selectedDates.length} date(s) selected`
                                                : 'Click on dates to select them'}
                                        </p>
                                        <div className="flex gap-2 flex-wrap">
                                            <Button
                                                onClick={() => bulkUpdateDatesMutation.mutate({ dates: selectedDates, isActive: true })}
                                                disabled={selectedDates.length === 0 || bulkUpdateDatesMutation.isPending}
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Mark Available
                                            </Button>
                                            <Button
                                                onClick={() => bulkUpdateDatesMutation.mutate({ dates: selectedDates, isActive: false })}
                                                disabled={selectedDates.length === 0 || bulkUpdateDatesMutation.isPending}
                                                className="bg-red-600 hover:bg-red-700 text-white"
                                            >
                                                <X className="w-4 h-4 mr-2" />
                                                Mark Not Available
                                            </Button>
                                            {selectedDates.length > 0 && (
                                                <Button
                                                    onClick={() => setSelectedDates([])}
                                                    variant="outline"
                                                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                                >
                                                    Clear Selection
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded bg-green-500/30 border border-green-500/50" />
                                            <span className="text-gray-400">Available</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded bg-red-500/30 border border-red-500/50" />
                                            <span className="text-gray-400">Not Available</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded bg-purple-500/50 border-2 border-purple-400" />
                                            <span className="text-gray-400">Selected</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded bg-gray-800/50 border border-gray-700" />
                                            <span className="text-gray-400">Not Set</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Available Dates List */}
                                <div className="glassmorphism rounded-xl p-6 border border-gray-700 mt-6">
                                    <h3 className="text-lg font-semibold text-white mb-4">Available Dates ({availableDates?.length || 0})</h3>
                                    {datesLoading ? (
                                        <div className="text-center py-4 text-gray-400">Loading...</div>
                                    ) : availableDates && availableDates.length > 0 ? (
                                        <div className="space-y-2">
                                            {availableDates.map((date) => (
                                                <div
                                                    key={date.id}
                                                    className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Calendar className="w-4 h-4 text-green-400" />
                                                        <span className="text-white">
                                                            {new Date(date.availableDate).toLocaleDateString('en-IN', {
                                                                weekday: 'long',
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeDateMutation.mutate(date.id)}
                                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                                        disabled={removeDateMutation.isPending}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 text-gray-400">
                                            No dates selected. Click on calendar dates to make them available.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Notifications Panel */}
                            <div className="lg:col-span-1">
                                <div className="glassmorphism rounded-xl p-6 border border-purple-500/30">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <Mail className="w-5 h-5 text-purple-400" />
                                        Interview Bookings
                                    </h3>
                                    {notificationsLoading ? (
                                        <div className="text-center py-4 text-gray-400">Loading...</div>
                                    ) : notifications && notifications.length > 0 ? (
                                        <div className="space-y-3 max-h-96 overflow-y-auto">
                                            {notifications.filter(n => n.type === 'interview_booked').map((notification) => (
                                                <div
                                                    key={notification.id}
                                                    className={`p-3 rounded-lg border transition-all cursor-pointer ${notification.isRead
                                                        ? 'bg-gray-800/30 border-gray-700'
                                                        : 'bg-purple-500/10 border-purple-500/30'
                                                        }`}
                                                    onClick={() => !notification.isRead && markNotificationReadMutation.mutate(notification.id)}
                                                >
                                                    <p className="text-white text-sm font-medium">{notification.title}</p>
                                                    <p className="text-gray-400 text-xs mt-1">{notification.message}</p>
                                                    <p className="text-gray-500 text-xs mt-2">
                                                        {new Date(notification.createdAt).toLocaleString('en-IN')}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 text-gray-400 text-sm">
                                            No interview bookings yet. When candidates book interviews, you'll see notifications here.
                                        </div>
                                    )}
                                </div>

                                <div className="glassmorphism rounded-xl p-6 border border-cyan-500/30 mt-6">
                                    <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-cyan-400" />
                                        Time Slot Control
                                    </h3>
                                    <p className="text-gray-400 text-xs mb-4">Toggle which time slots candidates can book for each round.</p>
                                    {slotSettingsLoading ? (
                                        <div className="text-center py-4 text-gray-400 text-sm">Loading...</div>
                                    ) : (
                                        <div className="space-y-5">
                                            {[
                                                { round: 1, label: 'Round 1 — Technical', color: 'purple', duration: '1 hr' },
                                                { round: 2, label: 'Round 2 — LSP-E', color: 'cyan', duration: '2 hrs' },
                                                { round: 3, label: 'Round 3 — Manager/HR', color: 'green', duration: '1 hr' },
                                            ].map(({ round, label, color, duration }) => {
                                                const roundSlots = (slotSettings || []).filter(s => s.round === round).sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
                                                const activeCount = roundSlots.filter(s => s.isActive).length;
                                                return (
                                                    <div key={round} className={`p-3 rounded-lg border border-${color}-500/20 bg-${color}-900/10`}>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div>
                                                                <p className={`text-sm font-semibold text-${color}-300`}>{label}</p>
                                                                <p className="text-gray-500 text-xs">{duration} · {activeCount}/{roundSlots.length} active</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {roundSlots.map(slot => {
                                                                const [h, m] = slot.timeSlot.split(':').map(Number);
                                                                const ampm = h >= 12 ? 'PM' : 'AM';
                                                                const h12 = h % 12 || 12;
                                                                const label12 = `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
                                                                return (
                                                                    <button
                                                                        key={slot.id}
                                                                        onClick={() => toggleSlotMutation.mutate({ id: slot.id, isActive: !slot.isActive })}
                                                                        disabled={toggleSlotMutation.isPending}
                                                                        className={`px-2.5 py-1 rounded text-xs font-medium transition-all border ${slot.isActive
                                                                            ? 'bg-green-500/20 border-green-500/50 text-green-300 hover:bg-green-500/30'
                                                                            : 'bg-gray-800/50 border-gray-600/50 text-gray-500 hover:bg-gray-700/50'
                                                                            }`}
                                                                        title={slot.isActive ? 'Click to disable' : 'Click to enable'}
                                                                    >
                                                                        {label12}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
}

function JobForm({
    job,
    categories,
    onSave,
    onCancel,
    isLoading
}: {
    job: JobPosting | null;
    categories: JobCategory[];
    onSave: (data: Partial<InsertJobPosting>) => void;
    onCancel: () => void;
    isLoading: boolean;
}) {
    const [formData, setFormData] = useState({
        jobId: job?.jobId || '',
        title: job?.title || '',
        categoryId: job?.categoryId || (categories[0]?.id || 1),
        location: job?.location || '',
        employmentType: job?.employmentType || 'Full-time',
        experience: job?.experience || '',
        summary: job?.summary || '',
        description: job?.description || '',
        requirements: job?.requirements || '',
        isActive: job?.isActive ?? true,
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glassmorphism rounded-xl p-6 border border-purple-500/30 mb-6"
        >
            <h3 className="text-lg font-semibold text-white mb-4">{job ? 'Edit Job' : 'New Job Posting'}</h3>
            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <Label className="text-gray-300">Job ID</Label>
                    <Input
                        value={formData.jobId}
                        onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
                        placeholder="e.g. NET-ENG-001"
                        className="bg-gray-800 border-gray-700 text-white"
                        data-testid="input-jobid"
                    />
                </div>
                <div>
                    <Label className="text-gray-300">Title</Label>
                    <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Job Title"
                        className="bg-gray-800 border-gray-700 text-white"
                        data-testid="input-title"
                    />
                </div>
                <div>
                    <Label className="text-gray-300">Category</Label>
                    <Select
                        value={String(formData.categoryId)}
                        onValueChange={(v) => setFormData({ ...formData, categoryId: parseInt(v) })}
                    >
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white" data-testid="select-category">
                            <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((cat) => (
                                <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="text-gray-300">Location</Label>
                    <Input
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g. Hyderabad / Remote"
                        className="bg-gray-800 border-gray-700 text-white"
                        data-testid="input-location"
                    />
                </div>
                <div>
                    <Label className="text-gray-300">Employment Type</Label>
                    <Select
                        value={formData.employmentType}
                        onValueChange={(v) => setFormData({ ...formData, employmentType: v })}
                    >
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white" data-testid="select-employment">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Full-time">Full-time</SelectItem>
                            <SelectItem value="Part-time">Part-time</SelectItem>
                            <SelectItem value="Contract">Contract</SelectItem>
                            <SelectItem value="Internship">Internship</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="text-gray-300">Experience</Label>
                    <Input
                        value={formData.experience}
                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                        placeholder="e.g. 3+ years"
                        className="bg-gray-800 border-gray-700 text-white"
                        data-testid="input-experience"
                    />
                </div>
                <div className="md:col-span-2">
                    <Label className="text-gray-300">Summary</Label>
                    <Input
                        value={formData.summary}
                        onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                        placeholder="Brief job summary"
                        className="bg-gray-800 border-gray-700 text-white"
                        data-testid="input-summary"
                    />
                </div>
                <div className="md:col-span-2">
                    <Label className="text-gray-300">Description</Label>
                    <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Full job description. Use bullet points with '- ' or '• ' at the start of each line."
                        className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                        data-testid="input-description"
                    />
                    <p className="text-xs text-gray-500 mt-1">Tip: Start lines with "- " or "• " for bullet points</p>
                </div>
                <div className="md:col-span-2">
                    <Label className="text-gray-300">Requirements</Label>
                    <Textarea
                        value={formData.requirements}
                        onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                        placeholder="Job requirements. Use bullet points with '- ' or '• ' at the start of each line."
                        className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                        data-testid="input-requirements"
                    />
                    <p className="text-xs text-gray-500 mt-1">Tip: Start lines with "- " or "• " for bullet points</p>
                </div>
                <div className="flex items-center gap-2">
                    <Switch
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                        data-testid="switch-active"
                    />
                    <Label className="text-gray-300">Active</Label>
                </div>
            </div>
            <div className="flex gap-3 mt-6">
                <Button
                    onClick={() => onSave(formData)}
                    disabled={isLoading}
                    className="bg-purple-600 hover:bg-purple-500"
                    data-testid="button-save-job"
                >
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? 'Saving...' : 'Save Job'}
                </Button>
                <Button
                    onClick={onCancel}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-200"
                    data-testid="button-cancel-job"
                >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                </Button>
            </div>
        </motion.div>
    );
}

function CategoryForm({
    category,
    onSave,
    onCancel,
    isLoading
}: {
    category: JobCategory | null;
    onSave: (data: Partial<InsertJobCategory>) => void;
    onCancel: () => void;
    isLoading: boolean;
}) {
    const [formData, setFormData] = useState({
        name: category?.name || '',
        description: category?.description || '',
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glassmorphism rounded-xl p-6 border border-purple-500/30 mb-6"
        >
            <h3 className="text-lg font-semibold text-white mb-4">{category ? 'Edit Category' : 'New Category'}</h3>
            <div className="grid gap-4">
                <div>
                    <Label className="text-gray-300">Name</Label>
                    <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Category name"
                        className="bg-gray-800 border-gray-700 text-white"
                        data-testid="input-category-name"
                    />
                </div>
                <div>
                    <Label className="text-gray-300">Description</Label>
                    <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Category description"
                        className="bg-gray-800 border-gray-700 text-white"
                        data-testid="input-category-description"
                    />
                </div>
            </div>
            <div className="flex gap-3 mt-6">
                <Button
                    onClick={() => onSave(formData)}
                    disabled={isLoading}
                    className="bg-purple-600 hover:bg-purple-500"
                    data-testid="button-save-category"
                >
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? 'Saving...' : 'Save Category'}
                </Button>
                <Button
                    variant="ghost"
                    onClick={onCancel}
                    data-testid="button-cancel-category"
                >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                </Button>
            </div>
        </motion.div>
    );
}

// ─── MCQ Panel ──────────────────────────────────────────────────────────────

const ROUND1_STATUSES = ['Round 1 Scheduled', 'Reschedule Round 1', 'Round 1 Confirmed', 'Round 1 Completed', 'Round 1 Selected', 'Round 1 Not Selected'];

interface McqQuestionDetail {
    id: number;
    questionOrder: number;
    questionText: string;
    optionA: string; optionB: string; optionC: string; optionD: string;
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

function slugCandidateName(name: string) {
    return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

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

    const testUrl = `${window.location.origin}/technical-evaluation/${jobIdCode}/${appId}-${slugCandidateName(candidateName)}`;

    const loadSession = async () => {
        const token = sessionStorage.getItem('adminToken');
        const res = await fetch(`/api/admin/mcq/session/${appId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setSessionData(data.session ?? null);
        }
        setLoading(false);
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
        const token = sessionStorage.getItem('adminToken');
        try {
            const res = await fetch(`/api/admin/mcq/generate/${appId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                toast({ title: 'MCQ questions generated', description: '30 personalised questions ready. Test link sent to candidate.' });
                await loadSession();
                setShowQuestions(true);
            } else {
                toast({ title: 'Generation failed', description: data.message, variant: 'destructive' });
            }
        } catch {
            toast({ title: 'Error', description: 'Failed to generate MCQ questions', variant: 'destructive' });
        }
        setGenerating(false);
    };

    const handleVoid = async () => {
        if (!sessionData) return;
        setVoiding(true);
        const token = sessionStorage.getItem('adminToken');
        try {
            const res = await fetch(`/api/admin/mcq/sessions/${sessionData.id}/void`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                toast({ title: 'Session voided', description: 'Admin can now regenerate questions.' });
                await loadSession();
            }
        } catch {
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
        const token = sessionStorage.getItem('adminToken');
        try {
            const res = await fetch(`/api/admin/mcq/invite/${appId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setInviteSent(true);
                toast({ title: 'Invite sent', description: 'Technical evaluation email sent to the candidate.' });
                setTimeout(() => setInviteSent(false), 4000);
            } else {
                toast({ title: 'Failed to send', description: data.message || 'Could not send invite email.', variant: 'destructive' });
            }
        } catch {
            toast({ title: 'Error', description: 'Failed to send invite email.', variant: 'destructive' });
        }
        setSendingInvite(false);
    };

    const handleOverride = async () => {
        if (!overrideType || !overrideReason.trim()) return;
        setOverriding(true);
        const token = sessionStorage.getItem('adminToken');
        try {
            const res = await fetch(`/api/admin/mcq/override/${appId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ overrideType, reason: overrideReason.trim() })
            });
            const data = await res.json();
            if (data.success) {
                toast({ title: 'Override applied', description: `Status updated to ${data.newStatus}. Email sent to candidate.` });
                setOverrideType(null);
                setOverrideReason('');
                await loadSession();
                queryClient.invalidateQueries({ queryKey: ['/api/admin/applications'] });
            } else {
                toast({ title: 'Override failed', description: data.message, variant: 'destructive' });
            }
        } catch {
            toast({ title: 'Error', description: 'Failed to apply override', variant: 'destructive' });
        }
        setOverriding(false);
    };

    const handleSendReport = async () => {
        setSendingReport(true);
        const token = sessionStorage.getItem('adminToken');
        try {
            const res = await fetch(`/api/admin/mcq/report/${appId}/email`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                toast({ title: 'Report sent', description: 'Detailed question-by-question report emailed to candidate.' });
            } else {
                toast({ title: 'Failed', description: data.message, variant: 'destructive' });
            }
        } catch {
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
        <div className="p-4 bg-violet-900/20 border border-violet-500/30 rounded-lg">
            <h4 className="text-sm font-semibold text-violet-400 mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                MCQ Technical Evaluation
                {isInProgress && <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full">In Progress</span>}
                {isCompleted && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${sessionData?.passed ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                        {sessionData?.passed ? 'Passed' : 'Failed'}
                    </span>
                )}
                {isVoided && <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded-full">Voided</span>}
            </h4>

            {/* No session — generate button */}
            {(!hasSession || isVoided) && (
                <div className="space-y-3">
                    {isVoided && <p className="text-xs text-gray-400">Previous session was voided. Generate new questions to resend the test.</p>}
                    <Button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="w-full bg-violet-600 hover:bg-violet-500 text-sm h-9 flex items-center justify-center gap-2"
                    >
                        {generating ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Generating 30 questions with AI...</>
                        ) : (
                            <><Brain className="w-4 h-4" /> {isVoided ? 'Regenerate MCQ Questions' : 'Generate MCQ Questions'}</>
                        )}
                    </Button>
                    {generating && (
                        <div className="space-y-2">
                            <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="h-full bg-violet-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${Math.min((genElapsed / 30) * 100, 95)}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-400 text-center">
                                AI is personalising 30 questions from the resume… {genElapsed}s elapsed
                                {genElapsed >= 30 && ' — almost done, retry in progress…'}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Expired session */}
            {isExpired && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-orange-400 text-xs">
                        <AlertCircle className="w-3 h-3" /> Test session expired — candidate did not complete within 45 minutes.
                    </div>
                    <Button onClick={handleGenerate} disabled={generating} className="w-full bg-orange-600 hover:bg-orange-500 text-sm h-9 flex items-center gap-2">
                        {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><RefreshCw className="w-4 h-4" /> Regenerate Questions</>}
                    </Button>
                    {generating && (
                        <div className="space-y-1">
                            <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                <div className="h-full bg-orange-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min((genElapsed / 30) * 100, 95)}%` }} />
                            </div>
                            <p className="text-xs text-gray-400 text-center">AI working… {genElapsed}s elapsed</p>
                        </div>
                    )}
                </div>
            )}

            {/* Active / pending session */}
            {hasSession && !isVoided && !isExpired && (
                <div className="space-y-4">

                    {/* Shareable test link */}
                    <div>
                        <Label className="text-gray-400 text-xs mb-1.5 block">Shareable Test Link</Label>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-1.5 flex items-center gap-2 min-w-0">
                                <ExternalLink className="w-3 h-3 text-gray-500 flex-shrink-0" />
                                <span className="text-xs text-gray-300 truncate">{testUrl}</span>
                            </div>
                            <Button size="sm" variant="outline" className="border-gray-600 text-xs h-8 px-2 flex-shrink-0" onClick={handleCopy}>
                                {copied ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSendInvite}
                                disabled={sendingInvite}
                                className="bg-violet-700/60 hover:bg-violet-600/70 text-violet-100 text-xs h-8 px-3 flex-shrink-0 flex items-center gap-1.5 border-0"
                                title="Send invite email to candidate"
                            >
                                {sendingInvite ? <Loader2 className="w-3 h-3 animate-spin" /> : inviteSent ? <CheckCircle className="w-3 h-3 text-green-300" /> : <Mail className="w-3 h-3" />}
                                {sendingInvite ? 'Sending…' : inviteSent ? 'Sent!' : 'Send Email'}
                            </Button>
                        </div>
                    </div>

                    {/* In-progress status */}
                    {isInProgress && (
                        <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                            <p className="text-xs text-yellow-300 font-medium">⏱ Test is currently in progress</p>
                            {sessionData?.startedAt && (
                                <p className="text-xs text-gray-400 mt-1">Started: {new Date(sessionData.startedAt).toLocaleString()}</p>
                            )}
                            {sessionData?.expiresAt && (
                                <p className="text-xs text-gray-400">Expires: {new Date(sessionData.expiresAt).toLocaleString()}</p>
                            )}
                            {(sessionData?.warningCount ?? 0) > 0 && (
                                <p className="text-xs text-orange-300 mt-1">⚠ Warnings: {sessionData?.warningCount}</p>
                            )}
                            <Button onClick={handleVoid} disabled={voiding} className="mt-2 w-full bg-gray-700 hover:bg-gray-600 text-xs h-7">
                                {voiding ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Void & Allow Regeneration'}
                            </Button>
                        </div>
                    )}

                    {/* Completed results */}
                    {isCompleted && (
                        <div className="space-y-3">
                            <div className="p-3 bg-gray-900/60 border border-gray-700/50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-400 font-semibold">Score</span>
                                    <div className="flex items-center gap-2">
                                        <Trophy className={`w-4 h-4 ${sessionData?.passed ? 'text-green-400' : 'text-red-400'}`} />
                                        <span className={`text-lg font-bold ${sessionData?.passed ? 'text-green-400' : 'text-red-400'}`}>
                                            {score}/{total}
                                        </span>
                                        <span className="text-xs text-gray-400">({pct}%)</span>
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
                                        <div className={`font-semibold ${(sessionData?.warningCount ?? 0) > 0 ? 'text-orange-300' : 'text-gray-300'}`}>
                                            {sessionData?.warningCount ?? 0}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-gray-500">Auto-Sub</div>
                                        <div className={`font-semibold ${sessionData?.autoSubmitted ? 'text-red-300' : 'text-gray-300'}`}>
                                            {sessionData?.autoSubmitted ? 'Yes' : 'No'}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-gray-500">Time</div>
                                        <div className="text-gray-300 font-semibold">
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
                                    className="flex-1 bg-violet-900/40 hover:bg-violet-800/50 text-violet-300 border border-violet-500/40 text-xs h-8 flex items-center gap-2"
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

                            {/* Override control */}
                            <div className="p-3 bg-gray-900/40 border border-gray-700/40 rounded-lg">
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
                                            <button className="text-gray-500 hover:text-white text-xs" onClick={() => { setOverrideType(null); setOverrideReason(''); }}>✕ Cancel</button>
                                        </div>
                                        <Textarea
                                            placeholder="Mandatory: enter reason for override..."
                                            value={overrideReason}
                                            onChange={(e) => setOverrideReason(e.target.value)}
                                            className="bg-gray-800 border-gray-600 text-white text-xs min-h-[60px] placeholder:text-gray-600"
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

                            {/* Reconduct Test */}
                            <div className="p-3 bg-gray-900/40 border border-amber-700/30 rounded-lg">
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
                                        <p className="text-xs text-gray-400 leading-snug">
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
                                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs h-7 border-0"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Question preview (for pending sessions) */}
                    {(isPending || isCompleted) && sessionData?.questions && sessionData.questions.length > 0 && (
                        <div>
                            <button
                                onClick={() => setShowQuestions(v => !v)}
                                className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors w-full text-left"
                            >
                                {showQuestions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                {showQuestions ? 'Hide' : 'Preview'} {sessionData.questions.length} Questions
                            </button>
                            {showQuestions && (
                                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto pr-1">
                                    {sessionData.questions.map((q) => (
                                        <div key={q.id} className="bg-gray-900/60 rounded p-2 border border-gray-700/40 text-xs">
                                            <div className="flex items-start gap-2">
                                                <span className="text-gray-500 flex-shrink-0 font-mono">{q.questionOrder}.</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-gray-200 leading-relaxed">{q.questionText}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`px-1.5 py-0.5 rounded text-xs ${CATEGORY_COLORS[q.category] ?? 'bg-gray-500/20 text-gray-400'}`}>
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

                    {/* Regenerate button for pending sessions */}
                    {(isPending || isInProgress) && (
                        <Button
                            onClick={handleGenerate}
                            disabled={generating || isInProgress}
                            variant="outline"
                            className="w-full border-gray-600 text-gray-400 hover:text-white text-xs h-8 flex items-center gap-2"
                        >
                            {generating ? <><Loader2 className="w-3 h-3 animate-spin" /> Regenerating...</> : <><RefreshCw className="w-3 h-3" /> Regenerate Questions</>}
                        </Button>
                    )}
                </div>
            )}

            {/* Full Breakdown Modal */}
            <Dialog open={showBreakdown} onOpenChange={setShowBreakdown}>
                <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-4xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <Brain className="w-5 h-5 text-violet-400" />
                            MCQ Full Breakdown
                            {sessionData && (
                                <Badge className={`text-xs border-0 ml-2 ${sessionData.passed ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                    {score}/{total} — {pct}% — {sessionData.passed ? 'PASS' : 'FAIL'}
                                </Badge>
                            )}
                        </DialogTitle>
                        <DialogDescription className="text-gray-400 text-xs">
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
                                                                    'text-gray-400'
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
                                                <span className={`px-1.5 py-0.5 rounded ${CATEGORY_COLORS[q.category] ?? 'bg-gray-500/20 text-gray-400'}`}>
                                                    {q.category.replace('_', ' ')}
                                                </span>
                                                <span className="text-gray-500">{q.difficulty}</span>
                                                {unanswered && <span className="text-orange-400">Not answered</span>}
                                                {!unanswered && !isCorrect && <span className="text-red-400">Candidate chose: {selected}</span>}
                                                {isCorrect && <span className="text-green-400">Correct ✓</span>}
                                            </div>
                                            {(q as any).explanation && (
                                                <div className="mt-2 px-2 py-1.5 bg-blue-900/20 border border-blue-700/30 rounded text-xs text-blue-200 leading-relaxed">
                                                    <span className="font-semibold text-blue-400">Explanation: </span>{(q as any).explanation}
                                                </div>
                                            )}
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
                        <Button variant="outline" onClick={() => setShowBreakdown(false)} className="border-gray-600 text-gray-300">
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ─── Q&A Section ─────────────────────────────────────────────────────────────

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
            const token = sessionStorage.getItem('adminToken');
            const res = await fetch(`/api/admin/applications/${appId}/qa`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setQA(await res.json());
            } else if (res.status === 401) {
                setQA({ questions: [], answers: [] });
                toast({ title: 'Session expired', description: 'Please log out and log back in to the admin panel.', variant: 'destructive' });
            }
        } catch {
            // Network error — leave qa as null, will show empty state
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadQA(); }, [appId]);

    const addQuestion = async () => {
        if (!questionText.trim()) return;
        setSubmitting(true);
        try {
            const token = sessionStorage.getItem('adminToken');
            const res = await fetch(`/api/admin/applications/${appId}/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    questionText: questionText.trim(),
                    questionType,
                    options: questionType === 'multiple_choice' ? options.filter(o => o.trim()) : null,
                }),
            });
            if (res.ok) {
                setQuestionText('');
                setOptions(['', '']);
                setQuestionType('text');
                loadQA();
                toast({ title: 'Question sent', description: 'Candidate has been notified by email.' });
            } else {
                const errData = await res.json().catch(() => ({}));
                if (res.status === 401) {
                    toast({ title: 'Session expired', description: 'Please log out and log in to the admin panel again.', variant: 'destructive' });
                } else {
                    toast({ title: 'Failed to send question', description: errData.message || `Server returned ${res.status}. Please try again.`, variant: 'destructive' });
                }
            }
        } catch (err) {
            toast({ title: 'Network error', description: 'Could not reach the server. Check your connection and try again.', variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    const deleteQuestion = async (qId: number) => {
        const token = sessionStorage.getItem('adminToken');
        await fetch(`/api/admin/questions/${qId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        loadQA();
    };

    if (loading) return <div className="text-xs text-gray-500 py-2">Loading Q&A...</div>;

    const answeredMap = new Map((qa?.answers || []).map((a: any) => [a.questionId, a]));
    const pendingCount = (qa?.questions || []).filter((q: any) => !answeredMap.has(q.id)).length;

    return (
        <div className="p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
            <h4 className="text-sm font-semibold text-indigo-400 mb-3 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Questions &amp; Answers
                {pendingCount > 0 && (
                    <span className="bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingCount} pending</span>
                )}
            </h4>

            {(qa?.questions || []).length === 0 && (
                <p className="text-xs text-gray-500 mb-3">No questions yet. Add one below.</p>
            )}

            <div className="space-y-3 mb-4">
                {(qa?.questions || []).map((q: any) => {
                    const answer = answeredMap.get(q.id);
                    return (
                        <div key={q.id} className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                    <p className="text-xs text-indigo-300 font-medium mb-1">You asked:</p>
                                    <p className="text-sm text-white">{q.questionText}</p>
                                    {q.questionType === 'multiple_choice' && q.options && (
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {q.options.map((opt: string, i: number) => (
                                                <span key={i} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">{opt}</span>
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
                                    <p className="text-sm text-gray-300">{answer.answerText}</p>
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
                <p className="text-xs text-gray-400 font-medium">Ask a question</p>
                <Textarea
                    value={questionText}
                    onChange={e => setQuestionText(e.target.value)}
                    placeholder="Type your question here..."
                    className="bg-gray-900 border-gray-700 text-white text-xs min-h-[60px]"
                />
                <div className="flex gap-2 flex-wrap">
                    <Select value={questionType} onValueChange={(v: any) => setQuestionType(v)}>
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white text-xs h-8 w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="text">Text answer</SelectItem>
                            <SelectItem value="multiple_choice">Multiple choice</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        onClick={addQuestion}
                        disabled={submitting || !questionText.trim()}
                        className="bg-indigo-600 hover:bg-indigo-500 text-xs h-8"
                    >
                        {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Send className="w-3 h-3 mr-1" />Send &amp; Email</>}
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
                                    className="bg-gray-900 border-gray-700 text-white text-xs h-7 flex-1"
                                />
                                {options.length > 2 && (
                                    <button onClick={() => setOptions(options.filter((_, j) => j !== i))} className="text-gray-500 hover:text-red-400">
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button onClick={() => setOptions([...options, ''])} className="text-xs text-indigo-400 hover:text-indigo-300">
                            + Add option
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Admin() {
    const [, navigate] = useLocation();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        window.scrollTo(0, 0);

        const token = localStorage.getItem('wings_admin_token');
        if (token) {
            setIsAuthenticated(true);
        } else {
            setIsAuthenticated(false);
            navigate('/admin');
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('wings_admin_token');
        setIsAuthenticated(false);
        navigate('/admin');
    };

    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return <AdminContent onLogout={handleLogout} />;
}
