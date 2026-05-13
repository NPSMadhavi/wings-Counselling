import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { api } from "../lib/api";
import {
  Users, FileText, Briefcase, Calendar, ArrowRight,
  ClipboardList, Clock, CheckCircle, UserCheck, UserX,
  CalendarCheck, TrendingUp, AlertCircle, ExternalLink,
  Layers, Activity,
} from "lucide-react";

const P = {
  bg: "#f8fafc",
  card: "#ffffff",
  border: "#f1f5f9",
  primary: "#004689",
  text: "#1e293b",
  muted: "#94a3b8",
  surface: "#f8fafc",
};

const STATUS_CONFIG = {
  submitted: { label: "Submitted", color: "#3b82f6", bg: "rgba(59,130,246,0.08)", icon: AlertCircle },
  under_review: { label: "Under Review", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", icon: Clock },
  shortlisted: { label: "Shortlisted", color: "#10b981", bg: "rgba(16,185,129,0.08)", icon: CheckCircle },
  not_shortlisted: { label: "Not Shortlisted", color: "#ef4444", bg: "rgba(239,68,68,0.08)", icon: UserX },
  interview_scheduled: { label: "Interview Sched.", color: "#8b5cf6", bg: "rgba(139,92,246,0.08)", icon: CalendarCheck },
  hired: { label: "Hired", color: "#059669", bg: "rgba(5,150,105,0.08)", icon: UserCheck },
  withdrawn: { label: "Withdrawn", color: "#94a3b8", bg: "rgba(148,163,184,0.08)", icon: UserX },
};

function StatCard({
  label, value, sub, icon: Icon, color, bg, onClick, loading,
}) {
  return (
    <div onClick={onClick}
      className="w-full text-left rounded-xl p-4 transition-all duration-300 group relative overflow-hidden"
      style={{ background: P.card, border: `1px solid ${P.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.02)", cursor: onClick ? "pointer" : "default" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: bg }}>
          <Icon size={16} style={{ color }} />
        </div>
        {onClick && (
          <div className="p-1 rounded-lg transition-colors group-hover:bg-gray-50">
            <ArrowRight size={12} className="text-gray-300 group-hover:text-blue-600 transition-colors" />
          </div>
        )}
      </div>
      {loading
        ? <div className="h-8 w-16 rounded-lg animate-pulse" style={{ background: "#f1f5f9" }} />
        : <p className="text-2xl font-bold tracking-tight" style={{ color: P.text }}>{value}</p>}
      <p className="text-[11px] font-bold mt-0.5 uppercase tracking-wider" style={{ color: P.muted }}>{label}</p>
      {sub && <p className="text-[10px] mt-0.5 font-bold" style={{ color: P.muted }}>{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [team, articles, careers, events, applications, slots] = await Promise.all([
          api.getTeam(),
          api.getArticles(),
          api.getCareers(),
          api.getEvents(),
          api.getApplications(),
          api.getInterviewAvailability(),
        ]);

        const today = new Date().toISOString().slice(0, 10);
        const appCounts = { total: 0, submitted: 0, under_review: 0, shortlisted: 0, not_shortlisted: 0, interview_scheduled: 0, hired: 0, withdrawn: 0 };
        for (const a of applications) {
          appCounts.total++;
          if (a.status in appCounts) appCounts[a.status]++;
        }

        setStats({
          team: team.length,
          articles: articles.length,
          jobs: {
            active: careers.filter((c) => c.isActive).length,
            total: careers.length,
          },
          events: {
            upcoming: events.filter((e) => e.eventDate && String(e.eventDate).slice(0, 10) >= today).length,
            total: events.length,
          },
          applications: appCounts,
          slots: {
            total: slots.length,
            available: slots.filter((s) => !s.isBooked).length,
            booked: slots.filter((s) => s.isBooked).length,
          },
          recentApps: [...applications]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 6),
        });
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-SG", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="w-full min-h-full" style={{ background: "#f2f5f5ff", padding: "24px 32px" }}>

      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: P.text }}>Dashboard</h1>
        <p className="text-[11px] font-bold mt-0.5" style={{ color: P.muted }}>{dateStr}</p>
      </div>

      {/* ── Primary stat cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Team Members" value={stats?.team ?? 0} sub="Counsellors & staff" icon={Users} color="#004689" bg="rgba(0,70,137,0.06)" onClick={() => navigate("/admin/team")} loading={loading} />
        <StatCard label="Articles" value={stats?.articles ?? 0} sub="Published resources" icon={FileText} color="#0891b2" bg="rgba(8,145,178,0.06)" onClick={() => navigate("/admin/articles")} loading={loading} />
        <StatCard label="Active Jobs" value={stats?.jobs.active ?? 0} sub={`${stats?.jobs.total ?? 0} total listings`} icon={Briefcase} color="#7c3aed" bg="rgba(124,58,237,0.06)" onClick={() => navigate("/admin/careers")} loading={loading} />
        <StatCard label="Upcoming Events" value={stats?.events.upcoming ?? 0} sub={`${stats?.events.total ?? 0} total events`} icon={Calendar} color="#059669" bg="rgba(5,150,105,0.06)" onClick={() => navigate("/admin/events")} loading={loading} />
      </div>

      {/* ── Secondary stat cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Applications" value={stats?.applications.total ?? 0} sub="All time" icon={ClipboardList} color="#2563eb" bg="rgba(37,99,235,0.06)" onClick={() => navigate("/admin/careers?tab=applications")} loading={loading} />
        <StatCard label="Pending Review" value={(stats?.applications.submitted ?? 0) + (stats?.applications.under_review ?? 0)} sub="Needs attention" icon={Clock} color="#d97706" bg="rgba(217,119,6,0.06)" onClick={() => navigate("/admin/careers?tab=applications")} loading={loading} />
        <StatCard label="Shortlisted" value={stats?.applications.shortlisted ?? 0} sub="Ready to interview" icon={TrendingUp} color="#10b981" bg="rgba(16,185,129,0.06)" onClick={() => navigate("/admin/careers?tab=applications")} loading={loading} />
        <StatCard label="Interview Slots" value={stats?.slots.available ?? 0} sub={`${stats?.slots.booked ?? 0} booked`} icon={CalendarCheck} color="#8b5cf6" bg="rgba(139,92,246,0.06)" onClick={() => navigate("/admin/careers?tab=slots")} loading={loading} />
      </div>

      {/* ── Lower section: funnel + recent activity ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 mb-6">

        {/* Application funnel */}
        <div className="lg:col-span-4 rounded-xl p-5" style={{ background: P.card, border: `1px solid ${P.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-blue-500" />
              <h2 className="font-bold text-xs tracking-tight" style={{ color: P.text }}>Application Funnel</h2>
            </div>
            <button onClick={() => navigate("/admin/careers?tab=applications")}
              className="text-[10px] font-bold flex items-center gap-1 text-blue-600 hover:underline">View all <ArrowRight size={9} /></button>
          </div>
          {loading
            ? [1, 2, 3, 4, 5].map(i => <div key={i} className="h-8 rounded-lg mb-2 animate-pulse" style={{ background: "#f1f5f9" }} />)
            : stats && (() => {
              const total = stats.applications.total || 1;
              const rows = [
                ["submitted", stats.applications.submitted],
                ["under_review", stats.applications.under_review],
                ["shortlisted", stats.applications.shortlisted],
                ["interview_scheduled", stats.applications.interview_scheduled],
                ["hired", stats.applications.hired],
              ];
              return rows.map(([status, count]) => {
                const cfg = STATUS_CONFIG[status];
                const pct = Math.round((count / total) * 100);
                const Icon = cfg.icon;
                return (
                  <div key={status} className="mb-3.5 last:mb-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Icon size={12} style={{ color: cfg.color }} />
                        <span className="text-[10px] font-bold text-gray-600">{cfg.label}</span>
                      </div>
                      <span className="text-[10px] font-extrabold" style={{ color: cfg.color }}>{count}</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "#f8fafc" }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: cfg.color, minWidth: count > 0 ? 3 : 0 }} />
                    </div>
                  </div>
                );
              });
            })()
          }
        </div>

        {/* Recent applications */}
        <div className="lg:col-span-6 rounded-xl p-5" style={{ background: P.card, border: `1px solid ${P.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-blue-500" />
              <h2 className="font-bold text-xs tracking-tight" style={{ color: P.text }}>Recent Applications</h2>
            </div>
            <button onClick={() => navigate("/admin/careers?tab=applications")}
              className="text-[10px] font-bold flex items-center gap-1 text-blue-600 hover:underline">View all <ArrowRight size={9} /></button>
          </div>
          {loading
            ? [1, 2, 3, 4].map(i => <div key={i} className="h-10 rounded-xl mb-2 animate-pulse" style={{ background: "#f1f5f9" }} />)
            : (stats?.recentApps ?? []).length === 0
              ? <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                  <ClipboardList size={20} className="text-gray-300" />
                </div>
                <p className="text-xs font-bold text-gray-800">No applications yet</p>
                <p className="text-[10px] text-gray-400 mt-1 max-w-[180px]">Applications will appear here once candidates apply</p>
              </div>
              : (stats?.recentApps ?? []).map((app) => {
                const cfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.submitted;
                const Icon = cfg.icon;
                const d = new Date(app.createdAt);
                const rel = (() => {
                  const s = Math.floor((Date.now() - d.getTime()) / 1000);
                  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
                  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
                  return `${Math.floor(s / 86400)}d ago`;
                })();
                return (
                  <button key={app.id}
                    onClick={() => navigate("/admin/careers?tab=applications")}
                    className="w-full flex items-center gap-3 py-2 px-3 rounded-xl mb-1.5 last:mb-0 transition-all hover:bg-gray-50 border border-transparent hover:border-gray-100 text-left group">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: cfg.bg }}>
                      <Icon size={14} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: P.text }}>{app.candidateName}</p>
                      <p className="text-[10px] font-semibold truncate text-gray-400 mt-0.5">{app.jobTitle}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                      <p className="text-[9px] font-bold mt-0.5" style={{ color: P.muted }}>{rel}</p>
                    </div>
                  </button>
                );
              })
          }
        </div>
      </div>

      {/* ── Quick navigation cards ─────────────────────────────────────── */}
      <div className="rounded-xl p-5" style={{ background: P.card, border: `1px solid ${P.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div className="flex items-center gap-2 mb-5">
          <ArrowRight size={14} className="text-blue-500" />
          <h2 className="font-bold text-xs tracking-tight" style={{ color: P.text }}>Quick Access</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Manage Team", sub: "Add or edit staff", href: "/admin/team", color: "#004689", bg: "rgba(0,70,137,0.05)", icon: Users },
            { label: "Manage Articles", sub: "Publish resources", href: "/admin/articles", color: "#0891b2", bg: "rgba(8,145,178,0.05)", icon: FileText },
            { label: "Job Listings", sub: "Post & manage openings", href: "/admin/careers", color: "#7c3aed", bg: "rgba(124,58,237,0.05)", icon: Briefcase },
            { label: "Manage Events", sub: "Create upcoming events", href: "/admin/events", color: "#059669", bg: "rgba(5,150,105,0.05)", icon: Calendar },
          ].map(({ label, sub, href, color, bg, icon: Icon }) => (
            <button key={href} onClick={() => navigate(href)}
              className="flex items-center gap-3 p-3 rounded-xl transition-all border border-transparent hover:border-gray-200 hover:shadow-sm text-left group"
              style={{ background: bg }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white shadow-sm transition-transform group-hover:scale-110">
                <Icon size={14} style={{ color }} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">{label}</p>
                <p className="text-[10px] font-bold text-gray-400">{sub}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-4 pt-4 flex flex-wrap gap-2 items-center" style={{ borderTop: `1px solid ${P.border}` }}>
          <p className="text-[10px] font-bold text-gray-400 mr-2 uppercase tracking-wider">Public Site:</p>
          {[
            { label: "Home", path: "/" },
            { label: "Team", path: "/team" },
            { label: "Articles", path: "/#articles" },
            { label: "Careers", path: "/careers" },
            { label: "Events", path: "/#events" },
          ].map(({ label, path }) => (
            <a key={path} href={path} target="_blank" rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg text-[9px] font-extrabold transition-all border border-gray-100 hover:border-blue-200 hover:text-blue-600 text-gray-500 bg-white">
              {label}
            </a>
          ))}
        </div>
      </div>

    </div>
  );
}