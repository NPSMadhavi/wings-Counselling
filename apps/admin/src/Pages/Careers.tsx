import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { MapPin, Clock, Briefcase, ChevronRight, DollarSign, User, ExternalLink, Calendar, Building2, Award } from "lucide-react";
import { useCandidateAuth } from "../context/CandidateAuthContext";

const BASE = "/api";

interface Job {
  id: number;
  jobId?: string;
  title: string;
  department: string;
  location: string;
  description: string;
  requirements: string;
  employmentType: string;
  salaryRange?: string;
  postedAt?: string;
  closesAt?: string;
}

/* ─── Job Card Component ────────────────────────────────────────────────────────── */
function JobCard({ job, onApply }: { job: Job; onApply: (job: Job) => void }) {
  const [expanded, setExpanded] = useState(false);
  const daysLeft = job.closesAt ? Math.ceil((new Date(job.closesAt).getTime() - Date.now()) / 86400000) : null;
  const isClosingSoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {job.jobId && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded" style={{ background: "rgba(0,70,137,0.08)", color: "#004689" }}>
                  {job.jobId}
                </span>
              )}
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {job.employmentType}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                {job.department}
              </span>
              {isClosingSoon && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 animate-pulse">
                  Closes in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-extrabold text-gray-800 text-lg leading-tight mb-2">
              {job.title}
            </h3>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin size={13} /> {job.location}
              </span>
              {job.salaryRange && (
                <span className="flex items-center gap-1">
                  <DollarSign size={13} /> {job.salaryRange}
                </span>
              )}
              {job.postedAt && (
                <span className="flex items-center gap-1">
                  <Clock size={13} /> Posted {new Date(job.postedAt).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              )}
              {job.closesAt && !isClosingSoon && daysLeft && daysLeft > 0 && (
                <span className="flex items-center gap-1 text-gray-400">
                  <Calendar size={13} /> Closes {new Date(job.closesAt).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}
                </span>
              )}
            </div>
          </div>

          {/* Apply button */}
          <button
            onClick={() => onApply(job)}
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 hover:scale-105 whitespace-nowrap"
            style={{ background: "#004689", boxShadow: "0 2px 8px rgba(0,70,137,0.2)" }}
          >
            Apply Now <ChevronRight size={14} />
          </button>
        </div>

        {/* Description preview */}
        <p className="text-sm text-gray-600 mt-4 leading-relaxed line-clamp-2">
          {job.description}
        </p>

        {/* Expand/collapse button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1"
        >
          {expanded ? "Show less" : "View full details"}
          <ChevronRight size={12} className={`transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
        </button>

        {/* Expanded details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 size={16} className="text-gray-400" />
                  <h4 className="font-bold text-gray-700 text-sm">About the Role</h4>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {job.description}
                </p>

                {job.requirements && (
                  <>
                    <div className="flex items-center gap-2 mt-5 mb-3">
                      <Award size={16} className="text-gray-400" />
                      <h4 className="font-bold text-gray-700 text-sm">Requirements & Qualifications</h4>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                      {job.requirements}
                    </p>
                  </>
                )}

                <button
                  onClick={() => onApply(job)}
                  className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 hover:scale-105"
                  style={{ background: "#004689" }}
                >
                  Apply for this Position <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ─── Main Careers Page Component ───────────────────────────────────────────────── */
export default function Careers() {
  const { candidate } = useCandidateAuth();
  const [, navigate] = useLocation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${BASE}/careers`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load job listings");
        return r.json();
      })
      .then((data) => {
        // Filter only active jobs and sort by posted date (newest first)
        const activeJobs = Array.isArray(data) ? data.filter((job: Job) => {
          // Optional: filter out expired jobs
          if (job.closesAt && new Date(job.closesAt) < new Date()) return false;
          return true;
        }) : [];
        activeJobs.sort((a, b) => new Date(b.postedAt || 0).getTime() - new Date(a.postedAt || 0).getTime());
        setJobs(activeJobs);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading jobs:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  function handleApply(job: Job) {
    // If candidate is logged in, go to candidate portal with apply param
    if (candidate) {
      navigate(`/candidate?apply=${job.id}`);
    } else {
      // If not logged in, go to auth page with return URL
      navigate(`/candidate?apply=${job.id}&return=/careers`);
    }
  }

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Inter', 'Nunito', sans-serif", background: "#f8fafc" }}>
      
      {/* Candidate portal banner - shown when logged in */}
      {candidate && (
        <div className="pt-6">
          <div className="max-w-4xl mx-auto px-4 py-2">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl px-5 py-3 text-sm font-semibold"
              style={{ background: "rgba(0,70,137,0.08)", border: "1px solid rgba(0,70,137,0.15)" }}
            >
              <div className="flex items-center gap-2" style={{ color: "#004689" }}>
                <User size={15} />
                <span>
                  Welcome back, <strong>{candidate.firstName} {candidate.lastName}</strong>
                </span>
              </div>
              <button
                onClick={() => navigate("/candidate")}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-white text-xs font-bold transition-all hover:opacity-90"
                style={{ background: "#004689" }}
              >
                Go to My Portal <ChevronRight size={12} />
              </button>
            </motion.div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className={`${candidate ? "pt-6" : "pt-20"} pb-16 px-4 relative overflow-hidden`}>
        {/* Background gradient */}
        <div
          className="absolute inset-0 z-0"
          style={{ background: "linear-gradient(160deg, #daeaf8 0%, #c3dcf2 40%, #e8f1fa 100%)" }}
        />
        
        {/* Decorative circles */}
        <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-blue-200/20 blur-3xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-indigo-200/20 blur-3xl" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 text-xs font-bold uppercase tracking-wider"
              style={{ background: "rgba(0,70,137,0.1)", color: "#004689" }}
            >
              <Briefcase size={13} /> Join Our Team
            </div>
            
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4" style={{ color: "#004689" }}>
              Careers at WINGS
            </h1>
            
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Join a passionate team dedicated to transforming mental health care in Singapore. 
              We're looking for compassionate professionals who share our mission.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 mt-8">
              <div className="text-center">
                <p className="text-2xl font-extrabold" style={{ color: "#004689" }}>10+</p>
                <p className="text-xs text-gray-500">Years of Impact</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-extrabold" style={{ color: "#004689" }}>50+</p>
                <p className="text-xs text-gray-500">Team Members</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-extrabold" style={{ color: "#004689" }}>10k+</p>
                <p className="text-xs text-gray-500">Lives Touched</p>
              </div>
            </div>

            {/* CTA for non-authenticated users */}
            {!candidate && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-10 inline-flex flex-col sm:flex-row items-center gap-4 px-6 py-4 rounded-2xl"
                style={{ background: "rgba(0,70,137,0.05)", border: "1px solid rgba(0,70,137,0.12)" }}
              >
                <div className="flex items-center gap-2">
                  <User size={16} style={{ color: "#004689" }} />
                  <span className="text-sm font-medium" style={{ color: "#004689" }}>Already have an account?</span>
                </div>
                <button
                  onClick={() => navigate("/candidate")}
                  className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-105"
                  style={{ background: "#004689" }}
                >
                  Sign In to Your Portal
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Job Listings Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Open Positions</h2>
            <p className="text-gray-500 text-sm">Find the role that matches your skills and passion</p>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div
                className="w-12 h-12 rounded-full border-3 animate-spin mb-4"
                style={{ borderColor: "#004689", borderTopColor: "transparent" }}
              />
              <p className="text-gray-500 text-sm">Loading opportunities...</p>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <Briefcase size={32} className="text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-700 mb-2">Unable to load jobs</h3>
              <p className="text-gray-400 text-sm mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2 rounded-xl text-sm font-semibold"
                style={{ background: "#004689", color: "white" }}
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && jobs.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
              <Briefcase size={48} className="mx-auto mb-4 text-gray-300" />
              <h2 className="text-xl font-bold text-gray-500 mb-2">No open positions at this time</h2>
              <p className="text-gray-400 text-sm">
                Check back soon — we regularly post new opportunities.
              </p>
            </div>
          )}

          {/* Job list */}
          {!loading && !error && jobs.length > 0 && (
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                <Briefcase size={14} />
                {jobs.length} Open Position{jobs.length !== 1 ? "s" : ""}
              </p>
              <div className="flex flex-col gap-5">
                {jobs.map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <JobCard job={job} onApply={handleApply} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Bottom CTA for non-authenticated users */}
      {!candidate && jobs.length > 0 && !loading && (
        <section className="py-16 px-4">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl p-8 text-center relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #004689, #1d4ed8)" }}
            >
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
              
              <div className="relative z-10">
                <h2 className="text-2xl font-extrabold text-white mb-3">Ready to Make a Difference?</h2>
                <p className="text-blue-100 text-sm mb-6 max-w-md mx-auto">
                  Create a free candidate account to submit your application and track its progress.
                </p>
                <button
                  onClick={() => navigate("/candidate")}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-extrabold text-sm transition-all hover:opacity-90 hover:scale-105 shadow-lg"
                  style={{ background: "white", color: "#004689" }}
                >
                  Create Account & Apply <ChevronRight size={15} />
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-200 mt-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-gray-400">
            WINGS Counselling Centre — A Community Project of Ramakrishna Mission
          </p>
          <p className="text-xs text-gray-400 mt-2">
            © {new Date().getFullYear()} WINGS Counselling Centre. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}