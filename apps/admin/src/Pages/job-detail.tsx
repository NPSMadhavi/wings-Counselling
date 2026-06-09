import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Clock,
  Briefcase,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Share2,
  Copy,
  Check,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { FaLinkedinIn } from "react-icons/fa6";

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import type { JobPosting } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

export default function JobDetail() {
  const params = useParams<{ id: string }>();
  const slug = params.id || "";
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuth();

  const { data: job, isLoading: jobQueryLoading } = useQuery<JobPosting>({
    queryKey: [`/api/jobs/by-job-id/${slug}`],
    enabled: !!slug,
  });

  const { data: applicationCheck } = useQuery<{ hasApplied: boolean }>({
    queryKey: [`/api/applications/check/${job?.id}`],
    enabled: isAuthenticated && !!job?.id,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shareRef.current && !shareRef.current.contains(event.target)) {
        setShareOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "ReactJS Developer - WINGS Counselling Centre",
          text: "Check out this job opening at WINGS: ReactJS Developer",
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      setShareOpen((prev) => !prev);
    }
  };

  const scrollToPositions = () => {
    const el = document.getElementById("job-detail-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (jobQueryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F6F3]">
        <Loader2 className="w-8 h-8 text-[#0D4A7A] animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#F7F6F3] flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-[#0D4A7A] mb-4">Job Not Found</h1>
        <Link href="/careers">
          <Button className="bg-[#0D4A7A] hover:bg-[#08345c]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Careers
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F6F3] overflow-x-hidden font-sans">
      {/* ═══════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════ */}
      <section
        className="relative w-full flex items-center justify-center overflow-hidden shrink-0"
        style={{
          background:
            'linear-gradient(rgba(58,58,58,0.8), rgba(0,0,0,0.8)), url("/assets/career1.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          minHeight: "480px",
          height: "clamp(480px, 55vw, 790px)",
        }}
      >
        <motion.div
          className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6 md:px-10 lg:px-[150px] w-full max-w-[1440px]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-white font-['Outfit'] font-semibold mb-6 md:mb-8 text-[32px] sm:text-[44px] md:text-[54px] lg:text-[60px] leading-[1.1]"
            style={{ maxWidth: "843px" }}
          >
            Build meaningful careers{" "}
            <span className="block">that create real impact</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-white/90 font-['DM_Sans'] font-normal text-[16px] sm:text-[18px] md:text-[20px] leading-relaxed max-w-[750px] mb-8 md:mb-10"
          >
            Join in WINGS and become part of a purpose-driven team dedicated to
            emotional wellness, counselling support, and community well-being.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            onClick={scrollToPositions}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#1B4585] hover:bg-[#16386b] text-white rounded-full font-['DM_Sans'] font-semibold text-[16px] transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer"
          >
            Explore open positions
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M6 9L12 15L18 9"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.button>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          BREADCRUMBS
      ═══════════════════════════════════════════ */}
      <div className="bg-[#F7F6F3] py-5">
        <div className="container mx-auto px-4 sm:px-6 md:px-10 lg:px-[150px] flex items-center gap-2 text-[16px] font-['DM_Sans']">
          <Link href="/">
            <span className="text-gray-800 hover:text-[#1B4585] transition-colors cursor-pointer underline">
              Home
            </span>
          </Link>
          <span className="text-gray-800">/</span>
          <Link href="/careers">
            <span className="text-gray-800 hover:text-[#1B4585] transition-colors cursor-pointer underline">
              Career
            </span>
          </Link>
          <span className="text-gray-800">/</span>
          <span className="text-gray-800">
            {job.title}
          </span>
        </div>
      </div>

      <section
        id="job-detail-section"
        className="bg-[#0D4A7A] pt-8 pb-10 border-b-4 border-[#1E3A8A]"
      >
        <div className="container mx-auto px-4 sm:px-6 md:px-10 lg:px-[150px]">
          {/* Tags */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <span className="px-4 py-1.5 rounded-full border border-white/60 text-white text-xs font-semibold font-['Plus_Jakarta_Sans'] tracking-wide">
              {job.jobId}
            </span>
            {job.department && (
              <span className="px-4 py-1.5 rounded-full border border-white/60 text-white text-xs font-semibold font-['Plus_Jakarta_Sans'] tracking-wide">
                {job.department}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-[28px] sm:text-[34px] md:text-[40px] font-semibold text-white font-['Outfit'] mb-5 leading-tight">
            {job.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-5 mb-6 text-white/90 font-['DM_Sans'] font-medium text-[15px]">
            <div className="flex items-center gap-2">
              <MapPin className="w-[18px] h-[18px] text-white" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-[18px] h-[18px] text-white" />
              <span>{job.experience}</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-[18px] h-[18px] text-white" />
              <span>{job.employmentType}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 flex-wrap">
            {applicationCheck?.hasApplied ? (
              <span className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-bold transition-all duration-300 bg-green-100 text-green-700 shadow-sm text-[15px] font-['DM_Sans']">
                <Check className="w-5 h-5" />
                Already Applied
              </span>
            ) : (
              <Link
                href={`/apply/${job.jobId}`}
                onClick={() => {
                  sessionStorage.setItem("careerApplyStage", "gate");
                  sessionStorage.setItem("returnTo", `/career/apply/${encodeURIComponent(job.jobId)}`);
                }}
              >
                <span className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-bold transition-all duration-300 bg-white hover:bg-gray-100 text-[#0D4A7A] shadow-sm cursor-pointer text-[15px] font-['DM_Sans']">
                  Apply now
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M9 18L15 12L9 6"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </Link>
            )}

            <div className="relative" ref={shareRef}>
              <button
                onClick={handleNativeShare}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-bold transition-all duration-300 bg-white hover:bg-gray-100 text-[#0D4A7A] shadow-sm text-[15px] font-['DM_Sans']"
              >
                Share
                <Share2 className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {shareOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50 font-['DM_Sans']"
                  >
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center gap-3 w-full px-4 py-3.5 text-sm text-gray-700 hover:bg-[#0D4A7A]/10 hover:text-[#0D4A7A] transition-colors"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500" />
                      )}
                      {copied ? "Link Copied!" : "Copy Link"}
                    </button>

                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `Check out this job at WINGS: ReactJS Developer - ${window.location.href}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 w-full px-4 py-3.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                      onClick={() => setShareOpen(false)}
                    >
                      <SiWhatsapp className="w-4 h-4 text-green-500" />
                      Share on WhatsApp
                    </a>

                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                        window.location.href
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 w-full px-4 py-3.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#1B4585] transition-colors"
                      onClick={() => setShareOpen(false)}
                    >
                      <FaLinkedinIn className="w-4 h-4 text-[#1B4585]" />
                      Share on LinkedIn
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          ABOUT THIS ROLE
      ═══════════════════════════════════════════ */}
      <section className="pt-5 pb-6 md:pt-8 md:pb-8 bg-[#F7F6F3]">
        <div className="container mx-auto px-4 sm:px-6 md:px-10 lg:px-[150px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-[20px] p-7 md:p-10 border border-gray-200"
          >
            <h2 className="text-[24px] sm:text-[26px] md:text-[25px] font-semibold text-[#0D4A7A] font-['Outfit'] mb-6">
              About This Role
            </h2>
            <div className="text-gray-700 font-['DM_Sans'] leading-[1.85] text-[16px] md:text-[17px] space-y-5 max-w-[900px] whitespace-pre-wrap">
              {job.description}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          KEY RESPONSIBILITIES
      ═══════════════════════════════════════════ */}
      <section className="pb-6 md:pb-8 bg-[#F7F6F3]">
        <div className="container mx-auto px-4 sm:px-6 md:px-10 lg:px-[150px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-[20px] p-7 md:p-10 border border-gray-200"
          >
            <h2 className="text-[24px] sm:text-[26px] md:text-[25px] font-semibold text-[#0D4A7A] font-['Outfit'] mb-8">
              Key Responsibilities
            </h2>
            <ul className="space-y-4 text-gray-700 font-['DM_Sans'] text-[16px] md:text-[17px] leading-relaxed max-w-[900px]">
              {[
                "Develop responsive and user-friendly frontend applications using React.js",
                "Convert UI/UX designs into functional and optimized interfaces",
                "Collaborate with UI/UX designers to improve accessibility and user experience",
                "Integrate frontend applications with APIs and backend services",
                "Maintain code quality, scalability, and performance standards",
                "Optimize applications for responsiveness across devices",
                "Participate in planning, debugging, testing, and deployment",
                "Work closely with cross-functional teams during development cycles",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-[7px] min-w-[7px] w-[7px] h-[7px] rounded-full bg-[#1B4585] shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SKILLS SECTION (3 Columns)
      ═══════════════════════════════════════════ */}
      <section className="pb-6 md:pb-8 bg-[#F7F6F3]">
        <div className="container mx-auto px-4 sm:px-6 md:px-10 lg:px-[150px]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Technical Skills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0 }}
              className="bg-white rounded-[20px] p-7 md:p-8 border border-gray-200"
            >
              <h3 className="text-[22px] font-semibold text-[#0D4A7A] font-['Outfit'] mb-6">
                Technical Skills
              </h3>
              <ul className="space-y-3 text-gray-700 font-['DM_Sans'] text-[15px] leading-relaxed">
                {[
                  "Strong knowledge of React.js",
                  "Good understanding of JavaScript (ES6+)",
                  "Experience with HTML5, CSS3, and responsive web design",
                  "Understanding of component-based architecture",
                  "Experience with REST APIs and API integration",
                  "Familiarity with Git version control systems",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-[7px] min-w-[6px] w-[6px] h-[6px] rounded-full bg-[#1B4585] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Preferred Skills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-white rounded-[20px] p-7 md:p-8 border border-gray-200"
            >
              <h3 className="text-[22px] font-semibold text-[#0D4A7A] font-['Outfit'] mb-6">
                Preferred Skills
              </h3>
              <ul className="space-y-3 text-gray-700 font-['DM_Sans'] text-[15px] leading-relaxed">
                {[
                  "Basic understanding of Node.js or Express.js",
                  "Experience working with modern architectures",
                  "Knowledge of performance optimization techniques",
                  "Familiarity with UI/UX best practices",
                  "Understanding of accessibility principles",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-[7px] min-w-[6px] w-[6px] h-[6px] rounded-full bg-[#1B4585] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Soft Skills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-white rounded-[20px] p-7 md:p-8 border border-gray-200"
            >
              <h3 className="text-[22px] font-semibold text-[#0D4A7A] font-['Outfit'] mb-6">
                Soft Skills
              </h3>
              <ul className="space-y-3 text-gray-700 font-['DM_Sans'] text-[15px] leading-relaxed">
                {[
                  "Problem-solving mindset",
                  "Good communication and collaboration skills",
                  "Attention to detail",
                  "Willingness to learn and adapt",
                  "Ability to work in a team-oriented environment",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-[7px] min-w-[6px] w-[6px] h-[6px] rounded-full bg-[#1B4585] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          WHAT YOU'LL WORK ON + PREFERRED QUALIFICATIONS
      ═══════════════════════════════════════════ */}
      <section className="pb-6 md:pb-8 bg-[#F7F6F3]">
        <div className="container mx-auto px-4 sm:px-6 md:px-10 lg:px-[150px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* What You'll Work On */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-[20px] p-7 md:p-8 border border-gray-200"
            >
              <h3 className="text-[22px] font-semibold text-[#0D4A7A] font-['Outfit'] mb-6">
                What You'll Work On
              </h3>
              <ul className="space-y-3 text-gray-700 font-['DM_Sans'] text-[15px] leading-relaxed">
                {[
                  "Counselling platform systems",
                  "Appointment booking systems",
                  "Community engagement features",
                  "Mental wellness awareness platforms",
                  "Responsive website experiences",
                  "Internal dashboards and management tools",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-[7px] min-w-[6px] w-[6px] h-[6px] rounded-full bg-[#1B4585] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Preferred Qualifications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-white rounded-[20px] p-7 md:p-8 border border-gray-200"
            >
              <h3 className="text-[22px] font-semibold text-[#0D4A7A] font-['Outfit'] mb-6">
                Preferred Qualifications
              </h3>
              <ul className="space-y-3 text-gray-700 font-['DM_Sans'] text-[15px] leading-relaxed">
                {[
                  "Bachelor's degree in Computer Science, IT, or related field",
                  "Internship or prior project experience in ReactJS development",
                  "Portfolio/GitHub projects showcasing frontend work is a plus",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-[7px] min-w-[6px] w-[6px] h-[6px] rounded-full bg-[#1B4585] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          APPLY BUTTON (Bottom CTA)
      ═══════════════════════════════════════════ */}
      <section className="pb-6 md:pb-8 bg-[#F7F6F3]">
        <div className="container mx-auto px-4 sm:px-6 md:px-10 lg:px-[150px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {applicationCheck?.hasApplied ? (
              <span className="inline-flex items-center gap-2 px-8 py-4 bg-green-100 text-green-700 rounded-full font-bold shadow-md text-[16px] font-['DM_Sans']">
                <Check className="w-5 h-5" />
                You have already applied for this position
              </span>
            ) : (
              <Link
                href={`/apply/${job.jobId}`}
                onClick={() => {
                  sessionStorage.setItem("careerApplyStage", "gate");
                  sessionStorage.setItem("returnTo", `/career/apply/${encodeURIComponent(job.jobId)}`);
                }}
              >
                <span className="inline-flex items-center gap-2 px-8 py-4 bg-[#1B4585] hover:bg-[#16386b] text-white rounded-full font-bold transition-all duration-300 shadow-md cursor-pointer text-[16px] font-['DM_Sans']">
                  Apply for this position
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M9 18L15 12L9 6"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════ */}
      <Footer />
    </div>
  );
}
