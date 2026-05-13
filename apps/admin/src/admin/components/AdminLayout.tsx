import { type ReactNode, useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Users,
  FileText,
  Briefcase,
  Calendar,
  LogOut,
  LayoutDashboard,
  Bell,
  Eye,
  ChevronRight,
  User,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

/* ================= TYPES ================= */

type SSEEventType =
  | "new_application"
  | "status_updated"
  | "interview_scheduled"
  | "interview_booked"
  | "interview_time_requested"
  | "new_job";

type SSENotification = {
  type: SSEEventType;
  data: Record<string, any>;
  timestamp: number;
};

/* ================= BEEP ================= */

function playBeep() {
  try {
    const ctx = new (window.AudioContext ||
      (window as any).webkitAudioContext)();

    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const g = ctx.createGain();

    o1.connect(g);
    o2.connect(g);
    g.connect(ctx.destination);

    o1.frequency.setValueAtTime(880, ctx.currentTime);
    o2.frequency.setValueAtTime(1100, ctx.currentTime + 0.12);

    g.gain.setValueAtTime(0.18, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

    o1.start(ctx.currentTime);
    o1.stop(ctx.currentTime + 0.18);

    o2.start(ctx.currentTime + 0.12);
    o2.stop(ctx.currentTime + 0.55);
  } catch { }
}

/* ================= NOTIFICATIONS PAGE COMPONENT ================= */
function NotificationsPage({ notifications, onClose, onMarkRead, onNavigate }) {
  function ago(ts: number) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
  }

  function notifLabel(n) {
    const d = n.data;
    if (n.type === "new_application") return `New application: ${d.candidateName} → ${d.jobTitle}`;
    if (n.type === "status_updated") return `Status update: ${d.applicationNumber} → ${d.status}`;
    if (n.type === "interview_scheduled") return `Interview scheduled for App #${d.applicationId}`;
    if (n.type === "interview_booked") return `${d.candidateName} booked interview — ${d.date} ${d.timeSlot}`;
    if (n.type === "interview_time_requested") return `Custom time request: ${d.candidateName}`;
    if (n.type === "new_job") return `Job posted: ${d.title}`;
    return "Notification";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Bell size={20} style={{ color: "#004689" }} />
            <h2 className="text-xl font-bold" style={{ color: "#004689" }}>Notifications</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bell size={48} className="text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No notifications yet</p>
              <p className="text-sm text-gray-400 mt-1">New notifications will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((n, i) => (
                <div
                  key={i}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    if (n.type === "new_application") onNavigate("/admin/careers?tab=applications");
                    if (n.type === "interview_scheduled") onNavigate("/admin/careers?tab=slots");
                    onClose();
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <Bell size={14} style={{ color: "#004689" }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{notifLabel(n)}</p>
                      <p className="text-xs text-gray-400 mt-1">{ago(n.timestamp)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onMarkRead}
              className="w-full py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: "#004689", color: "white" }}
            >
              Mark All as Read
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= COMPONENT ================= */

export default function AdminLayout({
  children
}: {
  children: ReactNode;
}) {
  const [location, navigate] = useLocation();
  const { logout, token } = useAuth();

  const [notifications, setNotifications] = useState<SSENotification[]>([]);
  const [showNotifsPage, setShowNotifsPage] = useState(false);
  const [unread, setUnread] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const _sseRef = useRef<EventSource | null>(null);

  const push = useCallback(
    (type: SSEEventType, data: Record<string, any>) => {
      setNotifications((prev) => [
        { type, data, timestamp: Date.now() },
        ...prev
      ].slice(0, 50));

      setUnread((n) => n + 1);
      playBeep();
    },
    []
  );

  /* ================= SSE ================= */

  useEffect(() => {
    if (!token) return;

    const es = new EventSource(
      `/api/admin/notifications/stream?token=${encodeURIComponent(token)}`
    );

    _sseRef.current = es;

    es.addEventListener("new_application", (e) =>
      push("new_application", JSON.parse((e as MessageEvent).data))
    );

    es.addEventListener("status_updated", (e) =>
      push("status_updated", JSON.parse((e as MessageEvent).data))
    );

    es.addEventListener("interview_scheduled", (e) =>
      push("interview_scheduled", JSON.parse((e as MessageEvent).data))
    );

    es.addEventListener("interview_booked", (e) =>
      push("interview_booked", JSON.parse((e as MessageEvent).data))
    );

    es.addEventListener("interview_time_requested", (e) =>
      push("interview_time_requested", JSON.parse((e as MessageEvent).data))
    );

    es.addEventListener("new_job", (e) =>
      push("new_job", JSON.parse((e as MessageEvent).data))
    );

    es.onerror = () => {
      es.close();
    };

    return () => es.close();
  }, [push, token]);

  /* ================= HELPERS ================= */

  // Get current tab from URL
  const getCurrentTab = () => {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get('tab');
  };

  const isActive = (href: string) => {
    const currentTab = getCurrentTab();

    // Handle dashboard
    if (href === "/admin") {
      return location === "/admin";
    }

    // Handle team
    if (href === "/admin/team") {
      return location === "/admin/team";
    }

    // Handle articles
    if (href === "/admin/articles") {
      return location === "/admin/articles";
    }

    // Handle events
    if (href === "/admin/events") {
      return location === "/admin/events";
    }

    // Handle careers base (Jobs tab)
    if (href === "/admin/careers") {
      return location === "/admin/careers" && (!currentTab || currentTab === "jobs");
    }

    // Handle careers with applications tab
    if (href === "/admin/careers?tab=applications") {
      return location === "/admin/careers" && currentTab === "applications";
    }

    // Handle careers with slots tab
    if (href === "/admin/careers?tab=slots") {
      return location === "/admin/careers" && currentTab === "slots";
    }

    return false;
  };

  const handleMarkAllRead = () => {
    setUnread(0);
  };

  // Function to navigate with tab parameter
  const handleNavigate = (href: string) => {
    console.log("Navigating to:", href);

    if (href === "/admin/careers?tab=applications") {
      navigate("/admin/careers?tab=applications");
    } else if (href === "/admin/careers?tab=slots") {
      navigate("/admin/careers?tab=slots");
    } else if (href === "/admin/careers") {
      navigate("/admin/careers");
    } else {
      navigate(href);
    }
  };

  return (
    <div className="h-screen flex bg-[#f8fafc] overflow-hidden font-sans">
      {/* ================= SIDEBAR ================= */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-[280px]'} bg-white border-r border-gray-100 flex flex-col transition-all duration-300 relative z-20 h-full flex-shrink-0 shadow-sm`}>

        {/* Logo Section */}
        <div className={`p-6 mb-2 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
          <div className="flex items-center justify-start">
            <img
              src="/assets/wingsLogo.png"
              alt="Logo"
              className={`${sidebarCollapsed ? 'h-8' : 'h-14'} w-auto object-contain`}
            />
          </div>
        </div>

        {/* Scrollable Menu Area */}
        <div className="flex-1 overflow-y-auto px-4 space-y-7" style={{ scrollbarWidth: 'none' }}>
          {/* Dashboard Link */}
          <div className="pt-2">
            <button
              onClick={() => navigate("/admin")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all relative ${isActive("/admin")
                ? "bg-blue-50 text-[#004689]"
                : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                }`}
            >
              {isActive("/admin") && <div className="absolute left-0 top-2 bottom-2 w-1.5 bg-[#004689] rounded-r-full" />}
              <LayoutDashboard size={18} className={isActive("/admin") ? "text-[#004689]" : "text-gray-400"} />
              {!sidebarCollapsed && <span>Dashboard</span>}
            </button>
          </div>

          {/* MANAGE Section */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <h3 className="text-[11px] font-black text-gray-300 uppercase tracking-[0.15em] px-4 mb-3">MANAGE</h3>
            )}
            <button
              onClick={() => handleNavigate("/admin/team")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all relative ${isActive("/admin/team")
                ? "bg-blue-50 text-[#004689]"
                : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                }`}
            >
              {isActive("/admin/team") && <div className="absolute left-0 top-2 bottom-2 w-1.5 bg-[#004689] rounded-r-full" />}
              <Users size={18} className={isActive("/admin/team") ? "text-[#004689]" : "text-gray-400"} />
              {!sidebarCollapsed && <span>Team Members</span>}
            </button>
            <button
              onClick={() => handleNavigate("/admin/articles")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all relative ${isActive("/admin/articles")
                ? "bg-blue-50 text-[#004689]"
                : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                }`}
            >
              {isActive("/admin/articles") && <div className="absolute left-0 top-2 bottom-2 w-1.5 bg-[#004689] rounded-r-full" />}
              <FileText size={18} className={isActive("/admin/articles") ? "text-[#004689]" : "text-gray-400"} />
              {!sidebarCollapsed && <span>Articles</span>}
            </button>
            <button
              onClick={() => handleNavigate("/admin/careers")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all relative ${isActive("/admin/careers")
                ? "bg-blue-50 text-[#004689]"
                : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                }`}
            >
              {isActive("/admin/careers") && <div className="absolute left-0 top-2 bottom-2 w-1.5 bg-[#004689] rounded-r-full" />}
              <Briefcase size={18} className={isActive("/admin/careers") ? "text-[#004689]" : "text-gray-400"} />
              {!sidebarCollapsed && <span>Careers / Jobs</span>}
            </button>
            <button
              onClick={() => handleNavigate("/admin/events")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all relative ${isActive("/admin/events")
                ? "bg-blue-50 text-[#004689]"
                : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                }`}
            >
              {isActive("/admin/events") && <div className="absolute left-0 top-2 bottom-2 w-1.5 bg-[#004689] rounded-r-full" />}
              <Calendar size={18} className={isActive("/admin/events") ? "text-[#004689]" : "text-gray-400"} />
              {!sidebarCollapsed && <span>Events</span>}
            </button>
          </div>

          {/* APPLICATIONS Section */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <h3 className="text-[11px] font-black text-gray-300 uppercase tracking-[0.15em] px-4 mb-3">APPLICATIONS</h3>
            )}
            <button
              onClick={() => handleNavigate("/admin/careers?tab=applications")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all relative ${isActive("/admin/careers?tab=applications")
                ? "bg-blue-50 text-[#004689]"
                : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                }`}
            >
              {isActive("/admin/careers?tab=applications") && <div className="absolute left-0 top-2 bottom-2 w-1.5 bg-[#004689] rounded-r-full" />}
              <FileText size={18} className={isActive("/admin/careers?tab=applications") ? "text-[#004689]" : "text-gray-400"} />
              {!sidebarCollapsed && <span>Applications</span>}
            </button>
            <button
              onClick={() => handleNavigate("/admin/careers?tab=slots")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all relative ${isActive("/admin/careers?tab=slots")
                ? "bg-blue-50 text-[#004689]"
                : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                }`}
            >
              {isActive("/admin/careers?tab=slots") && <div className="absolute left-0 top-2 bottom-2 w-1.5 bg-[#004689] rounded-r-full" />}
              <Calendar size={18} className={isActive("/admin/careers?tab=slots") ? "text-[#004689]" : "text-gray-400"} />
              {!sidebarCollapsed && <span>Interview Slots</span>}
            </button>
          </div>

          {/* SETTINGS Section */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <h3 className="text-[11px] font-black text-gray-300 uppercase tracking-[0.15em] px-4 mb-3">SETTINGS</h3>
            )}
            <button
              onClick={() => setShowNotifsPage(true)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all relative ${showNotifsPage
                ? "bg-blue-50 text-[#004689]"
                : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                }`}
            >
              {showNotifsPage && <div className="absolute left-0 top-2 bottom-2 w-1.5 bg-[#004689] rounded-r-full" />}
              <Bell size={18} className={showNotifsPage ? "text-[#004689]" : "text-gray-400"} />
              {!sidebarCollapsed && <span>Notifications</span>}
              {unread > 0 && (
                <span className={`${sidebarCollapsed ? 'absolute -top-1 -right-1' : 'ml-auto'} w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold`}>
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <LogOut size={18} className="text-gray-400" />
              {!sidebarCollapsed && <span>Sign Out</span>}
            </button>
          </div>
        </div>

        {/* Bottom Fixed Section */}
        <div className="flex-shrink-0 border-t border-gray-100 p-6 pt-4 space-y-4">
          <button
            onClick={() => window.open("/", "_blank")}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-bold text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all"
          >
            <Eye size={18} className="text-gray-400" />
            {!sidebarCollapsed && <span>View Website</span>}
          </button>

          <div className="pt-0">
            {!sidebarCollapsed ? (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50/50 border border-gray-50">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-[#004689] font-bold shadow-sm">
                  <User size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-800 truncate">Administrator</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Admin</div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center p-2">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-[#004689] font-bold shadow-sm">
                  <User size={18} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-[80px] w-6 h-6 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-all z-30"
        >
          <ChevronRight size={12} className={`text-gray-400 transform transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 h-full overflow-hidden">
        <main className="h-full overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Notifications Modal */}
      {showNotifsPage && (
        <NotificationsPage
          notifications={notifications}
          onClose={() => setShowNotifsPage(false)}
          onMarkRead={handleMarkAllRead}
          onNavigate={navigate}
        />
      )}
    </div>
  );
}