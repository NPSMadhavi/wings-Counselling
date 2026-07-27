import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Copy, Share2, Check } from "lucide-react";
import { Footer } from "@/components/Layout/Footer";
import { useLocation, useRoute } from "wouter";
import { useTranslation } from "react-i18next";
import { useAppointment } from "@/context/AppointmentContext";
import {
  loadPageContent,
  htmlWithHeadingIds,
  extractHeadingsFromHtml,
  htmlToPdfBlocks,
  getPageKeyFromCategory,
  savePageContent,
  extractFirstParagraphFromHtml,
} from "@/lib/articlePageContent";
import { resolveAssetUrl } from "@/admin/lib/api";

const heroImg = "/assets/ihero1.jpeg";
const introImg = "/assets/img4.jpg";

const DEFAULT_SECTIONS = [
  { label: "Introduction", id: "what-is-anxiety" },
  { label: "1. The 5–4–3–2–1 method", id: "5-4-3-2-1-method" },
  { label: "2. Controlled breathing", id: "controlled-breathing" },
  { label: "3. Physical grounding through touch", id: "physical-grounding" },
  { label: "4. Micro-movements", id: "micro-movements" },
  { label: "What grounding can — and cannot — do", id: "what-grounding" },
  { label: "Final thought", id: "final-thought" },
];

const PAGE_KEY = "GroundingTechniques";

const styles = {
  heading: {
    fontFamily: "Outfit, sans-serif",
  },

  body: {
    fontFamily: "DM Sans, sans-serif",
  },
};

export default function AnxietyArticlePage() {
  const [, navigate] = useLocation();
  const [isArticleRoute, articleParams] = useRoute("/article/:slug");
  const { t } = useTranslation();
  const { openModal } = useAppointment();
  const [activeSection, setActiveSection] = useState("what-is-anxiety");
  const articleRef = useRef(null);
  const mainContentRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const [customContent, setCustomContent] = useState(null);
  const [sections, setSections] = useState(DEFAULT_SECTIONS);

  // Prefer /article/:slug path param; also support legacy ?slug=
  const urlSlug = useMemo(() => {
    if (isArticleRoute && articleParams?.slug) {
      return decodeURIComponent(articleParams.slug);
    }
    try {
      return new URLSearchParams(window.location.search).get("slug") || "";
    } catch {
      return "";
    }
  }, [isArticleRoute, articleParams?.slug]);

  const applyArticleData = (next) => {
    if (!next) {
      setCustomContent(null);
      setSections(DEFAULT_SECTIONS);
      setActiveSection("what-is-anxiety");
      return;
    }
    const withIds = htmlWithHeadingIds(next.html || "");
    const headings = extractHeadingsFromHtml(withIds);
    setCustomContent({ ...next, html: withIds });
    if (withIds && headings.length) {
      setSections(headings);
      setActiveSection(headings[0].id);
    } else if (!withIds) {
      setSections(DEFAULT_SECTIONS);
      setActiveSection("what-is-anxiety");
    }
  };

  // Load THIS article from backend by slug — never reuse another article's data
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Clear previous article immediately so UI doesn't flash old content
      if (urlSlug) {
        setCustomContent(null);
        setSections(DEFAULT_SECTIONS);
      }

      try {
        const res = await fetch("/api/articles");
        if (!res.ok) throw new Error("Failed to fetch articles");
        const articles = await res.json();
        if (!Array.isArray(articles) || cancelled) return;

        let match = null;
        if (urlSlug) {
          match = articles.find(
            (a) => (a.slug || "").toLowerCase() === urlSlug.toLowerCase()
          );
        }
        // Legacy /GroundingTechniques with no slug → keep default template
        if (!match && !urlSlug) {
          if (!cancelled) {
            setCustomContent(null);
            setSections(DEFAULT_SECTIONS);
          }
          return;
        }
        if (!match) return;

        const pageKey = getPageKeyFromCategory(match.category) || PAGE_KEY;
        const stored = loadPageContent(pageKey, match.slug) || {};

        // Backend is source of truth for each article.
        const htmlFromBackend = (match.content || "").trim();
        const htmlFromLocal =
          stored.slug === match.slug && (stored.html || "").trim()
            ? stored.html
            : "";

        const next = {
          html: htmlFromBackend || htmlFromLocal || "",
          title: match.title || "",
          author: match.author || "WINGS Team",
          excerpt: match.excerpt || "",
          coverImage: match.coverImage
            ? resolveAssetUrl(match.coverImage)
            : "",
          slug: match.slug || "",
          updatedAt: match.updatedAt || match.publishedAt || null,
        };

        savePageContent(pageKey, next);
        if (!cancelled) applyArticleData(next);
      } catch (err) {
        console.error("Failed to load article from backend", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [urlSlug]);

  useEffect(() => {
    const handleScroll = () => {
      const sectionIds = sections.map((s) => s.id);

      let currentSection = sectionIds[0];
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200) {
            currentSection = id;
          }
        }
      }
      if (currentSection) setActiveSection(currentSection);
    };

    const mainEl = mainContentRef.current;
    window.addEventListener("scroll", handleScroll);
    if (mainEl) mainEl.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (mainEl) mainEl.removeEventListener("scroll", handleScroll);
    };
  }, [sections]);

  const displayTitle = customContent
    ? (customContent.title && customContent.title.trim()) ||
      sections[0]?.label ||
      "Article"
    : "4 Grounding techniques for when anxiety spikes";
  const displayAuthor = customContent
    ? (customContent.author && customContent.author.trim()) || "WINGS Team"
    : "Melinda Smith, M.A., Lawrence Robinson, Jeanne Segal, Ph.D., and Sheldon Reid";
  const firstBodyParagraph = customContent?.html
    ? extractFirstParagraphFromHtml(customContent.html)
    : "";
  const displayExcerpt = customContent
    ? (customContent.excerpt && customContent.excerpt.trim()) ||
      firstBodyParagraph ||
      ""
    : "Do you have anxiety? Have you had an anxiety attack? Here's how to recognize the signs and symptoms of anxiety—and find the anxiety treatment and therapies you need.";
  const displayCoverImage =
    (customContent?.coverImage && resolveAssetUrl(customContent.coverImage)) ||
    introImg;
  const lastUpdated = customContent?.updatedAt
    ? new Date(customContent.updatedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "february 27, 2026";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = async () => {
    const shareData = {
      title: displayTitle || document.title || "Grounding Techniques",
      text: displayExcerpt || "Check out this article on grounding techniques:",
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled share
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        const subject = encodeURIComponent(displayTitle || "Grounding Techniques");
        const body = encodeURIComponent(
          `Check out this article:\n\n${window.location.href}`
        );
        window.open(`mailto:?subject=${subject}&body=${body}`, "_self");
      }
    }
  };



  return (
    <div
      className="w-full bg-white text-[#111111]"
      style={styles.body}
    >
      {/* GOOGLE FONTS */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Outfit:wght@400;500;600;700&display=swap');

          html {
            scroll-behavior: smooth;
          }

          [id] {
            scroll-margin-top: 120px;
          }

          .sidebar-scroll::-webkit-scrollbar {
            display: none;
          }

          @media print {
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      {/* HERO */}
      <section
        className="relative flex w-full shrink-0 overflow-hidden"
        style={{
          minHeight: "480px",
          height: "clamp(480px, 55vw, 790px)",
        }}
      >
        <img
          src={heroImg}
          className="absolute inset-0 w-full h-full object-cover"
          alt=""
        />

        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 w-full h-full navbar-align-outer">
          <div className="navbar-align-inner h-full flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="flex flex-col items-center justify-center text-center w-full"
              style={{ maxWidth: "840px" }}
            >
              <h1
                className="text-[32px] sm:text-[44px] md:text-[54px] lg:text-[60px] font-semibold leading-[1.2] text-white mb-6"
                style={styles.heading}
              >
                {t("articleDetail.hero.title")}
              </h1>

              <p
                className="text-[16px] md:text-[20px] leading-[1.8] text-white max-w-[700px] mb-8"
                style={styles.body}
              >
                {t("articleDetail.hero.description")}
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  document
                    .getElementById("anxiety-article")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex items-center justify-center gap-2.5 min-h-[3.75rem] h-auto py-3 px-6 sm:px-8 rounded-full bg-[#1B4585] cursor-pointer"
              >
                <span className="text-white font-['Plus_Jakarta_Sans'] font-semibold text-[clamp(0.9rem,1.1rem,1.125rem)] whitespace-normal text-center">
                  {t("articleDetail.hero.button")}
                </span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 9L12 15L18 9"
                    stroke="white"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* BREADCRUMB */}
      <div className="w-full navbar-align-outer">
        <div className="navbar-align-inner py-4 sm:py-[22px]">
          <p className="text-[14px] sm:text-[16px] leading-[160%]">
            <span
              onClick={() => navigate("/")}
              className="cursor-pointer underline hover:opacity-70 transition"
            >
              {t("articleDetail.breadcrumb.home")}
            </span>

            <span className="mx-1">/</span>

            <span
              onClick={() => navigate("/articles")}
              className="cursor-pointer underline hover:opacity-70 transition"
            >
              {t("articleDetail.breadcrumb.backToArticles")}
            </span>

            <span className="mx-1">/</span>

            <span id="anxiety-article">{displayTitle}</span>
          </p>
        </div>
      </div>

      {/* INTRO SECTION */}
      <section className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* LEFT — text starts at same edge as navbar */}
          <div className="bg-[#0D4A7A] py-10 sm:py-12 lg:py-[54px] text-white flex items-center">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="w-full max-w-[700px] support-topic-text-pl"
            >
              <p className="mb-4 sm:mb-7 text-white/80 text-[13px] sm:text-[15px] tracking-wide">
                {t("articleDetail.breadcrumb.lastUpdated")} {lastUpdated}
              </p>

              <h2 className="text-[25px] md:text-[28px] lg:text-[38px] leading-[1.15] tracking-[-0.03em] font-medium">
                {displayTitle}
              </h2>

              {displayExcerpt ? (
                <p className="mt-4 sm:mt-7 text-white/85 text-[15px] sm:text-[16px] leading-[1.7] sm:leading-[190%]">
                  {displayExcerpt}
                </p>
              ) : null}
            </motion.div>
          </div>

          {/* RIGHT */}
          <div className="relative min-h-[260px] sm:min-h-[340px] lg:min-h-[410px] overflow-hidden">
            <img
              src={displayCoverImage}
              alt={displayTitle}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ARTICLE */}
      <section className="bg-[#F5F3F0]">
        <div className="w-full navbar-align-outer">
          <div className="navbar-align-inner py-[72px]">
            <div ref={articleRef} className="grid grid-cols-1 xl:grid-cols-[220px_1fr] gap-[58px] items-start xl:min-h-0">
              {/* LEFT SIDEBAR */}
              <aside className="hidden xl:block w-full xl:w-[220px] sticky top-[120px] self-start max-h-[calc(100vh-140px)] overflow-y-auto sidebar-scroll" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                <div>
                  {/* AUTHOR */}
                  <div className="text-[16px] leading-[190%] text-[#595550]">
                    <p>
                      {t("articleDetail.sidebar.by")} {displayAuthor}
                    </p>
                  </div>

                  {/* TOC */}
                  <div className="mt-8 space-y-0">
                    {sections.map((item, index) => {
                      const isActive = activeSection === item.id;
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            document.getElementById(item.id)?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                          }}
                          className={`block w-full text-left text-[16px] leading-snug whitespace-normal break-words py-[10px] pl-5 border-l-2 transition-all duration-300 ${isActive
                              ? "border-[#0D4A7A] text-[#0D4A7A] font-bold bg-[#EDF3F8]"
                              : "border-[#D8D3CC] text-[#6D6862] hover:text-[#0D4A7A] hover:border-[#9DB4C9]"
                            }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </aside>

              {/* RIGHT ARTICLE CONTENT */}
              <main ref={mainContentRef} className="sidebar-scroll w-full xl:max-h-[calc(100vh-140px)] xl:overflow-y-auto" style={{ scrollBehavior: "smooth", scrollbarWidth: "none", msOverflowStyle: "none" }}>
                {customContent?.html ? (
                  <div
                    className="word-article-body space-y-6 text-[18px] leading-[210%] text-[#3D3935]
                      [&_h1]:text-[35px] [&_h1]:leading-[120%] [&_h1]:tracking-[-0.03em] [&_h1]:font-medium [&_h1]:text-[#111111] [&_h1]:mb-6
                      [&_h2]:text-[30px] [&_h2]:leading-[120%] [&_h2]:tracking-[-0.03em] [&_h2]:font-medium [&_h2]:mt-[72px] [&_h2]:mb-6
                      [&_h3]:text-[26px] [&_h3]:leading-[120%] [&_h3]:tracking-[-0.03em] [&_h3]:font-medium [&_h3]:mt-[48px] [&_h3]:mb-4
                      [&_p]:mb-4
                      [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_ul]:mb-4
                      [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2 [&_ol]:mb-4
                      [&_strong]:font-semibold
                      [&_a]:text-[#0D4A7A] [&_a]:underline"
                    style={styles.heading}
                    dangerouslySetInnerHTML={{ __html: customContent.html }}
                  />
                ) : (
                  <>
                {/* INTRO */}
                <motion.div
                  id="what-is-anxiety"
                  initial={{ opacity: 0, y: 26 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <h2
                    className="text-[35px] leading-[120%] tracking-[-0.03em] font-medium text-[#111111]"
                    style={styles.heading}
                  >
                    What is anxiety?
                  </h2>

                  <div className="mt-7 space-y-6 text-[18px] leading-[210%] text-[#3D3935]">
                    <p>
                      Anxiety is a normal reaction to danger, the body’s automatic
                      fight-or-flight response that is triggered when you feel
                      threatened, under pressure, or are facing a challenging
                      situation. However, when anxiety is constant or overwhelming,
                      it can interfere with your daily life and relationships. It
                      can make it difficult to concentrate, sleep, or complete
                      everyday tasks, and can lead to physical symptoms like tension,
                      fatigue, and headaches.
                    </p>

                    <p>
                      Sometimes it creeps in slowly — tight shoulders, racing
                      thoughts, shallow breathing. Other times it hits all at
                      once, overwhelming you with a sudden wave of panic that makes
                      it feel like you can't breathe.
                    </p>

                    <p>
                      The problem is that when anxiety spikes, logic often stops
                      working. Telling yourself to 'calm down' or 'relax' rarely
                      works because your brain's emotional center has taken over.
                    </p>

                    <p>That’s where grounding techniques help.</p>

                    <p>
                      Grounding is not about “eliminating” anxiety instantly. It’s
                      about reconnecting your brain to the present moment, helping
                      your nervous system realize you are safe right now.
                    </p>

                    <p>
                      The best part: you can use most of them quietly — during
                      work meetings, while traveling, before presentations, or in
                      crowded spaces.
                    </p>

                    <p>
                      Here are four grounding techniques that actually work in
                      everyday situations.
                    </p>
                  </div>
                </motion.div>

                {/* SECTION 1 */}
                <section id="5-4-3-2-1-method" className="mt-[72px]">
                  <h3
                    className="text-[26px] leading-[120%] tracking-[-0.03em] font-medium"
                    style={styles.heading}
                  >
                    1. The 5–4–3–2–1 method
                  </h3>

                  <div className="mt-7 rounded-[6px] bg-[#EAF4DF] px-5 py-[10px] inline-block w-full">
                    <p className="text-[#59713F] text-[18px] font-medium">
                      Best for: Racing thoughts and panic spirals
                    </p>
                  </div>

                  <div className="mt-7 space-y-6 text-[18px] leading-[210%] text-[#3D3935]">
                    <p>
                      This is one of the fastest ways to pull your attention away
                      from anxious thinking and back into your environment. Focus on:
                    </p>

                    <ul className="list-disc pl-5 space-y-2">
                      <li>5 things you can see</li>
                      <li>4 things you can touch</li>
                      <li>3 things you can hear</li>
                      <li>2 things you can smell</li>
                      <li>1 thing you can taste</li>
                    </ul>
                  </div>

                  <div className="mt-8 rounded-[6px] bg-[#EAF1F7] px-[26px] py-[22px]">
                    <h4 className="text-[#3E566D] text-[148x] font-bold mb-2">Example:</h4>
                    <p className="text-[#3E566D] text-[18px] leading-[210%] mb-3">
                      You’re sitting in a stressful meeting and feel panic rising. Instead of focusing on catastrophic thoughts, you intentionally notice:
                    </p>
                    <ul className="space-y-1.5 text-[#3E566D] text-[18px] leading-[210%] list-disc pl-5 mb-3">
                      <li>The texture of your chair</li>
                      <li>The hum of the AC</li>
                      <li>The color of someone’s notebook</li>
                      <li>The smell of coffee nearby</li>
                    </ul>
                    <p className="text-[#3E566D] text-[148] leading-[210%]">
                      This forces your brain to shift from “imagined danger” to “present reality.”
                    </p>
                  </div>
                </section>

                {/* SECTION 2 */}
                <section id="controlled-breathing" className="mt-[72px]">
                  <h3
                    className="text-[30px] leading-[120%] tracking-[-0.03em] font-medium"
                    style={styles.heading}
                  >
                    2. Controlled breathing
                  </h3>

                  <div className="mt-7 rounded-[6px] bg-[#EAF4DF] px-5 py-[10px] inline-block w-full">
                    <p className="text-[#59713F] text-[18px] font-medium">
                      Best for: Fast heartbeat and physical anxiety symptoms
                    </p>
                  </div>

                  <div className="mt-7 space-y-6 text-[18px] leading-[210%] text-[#3D3935]">
                    <p>
                      When anxiety spikes, breathing becomes shallow and rapid. 
                      Your body interprets this as danger, which increases stress even more.
                    </p>

                    <ul className="list-disc pl-5 space-y-2">
                      <li>Inhale for 4 seconds</li>
                      <li>Hold for 4 seconds</li>
                      <li>Exhale for 6 seconds</li>
                    </ul>

                    <p>Repeat for 1-2 minutes.</p>

                    <p>
                      The longer exhale is important because it activates the parasympathetic nervous system — the body’s calming response.
                    </p>
                  </div>

                  <div className="mt-8 rounded-[6px] bg-[#FF543E33] px-[26px] py-[22px]">
                    <h4 className="text-[#FF0000] text-[18px] font-bold mb-2">Common mistake:</h4>
                    <p className="text-[#FF0000] text-[18px] leading-[210%]">
                      People often breathe too aggressively when anxious. Don't force
                      'deep' breaths; Focus on slower, softer breathing instead.
                    </p>
                  </div>
                </section>

                {/* SECTION 3 */}
                <section id="physical-grounding" className="mt-[72px]">
                  <h3
                    className="text-[30px] leading-[120%] tracking-[-0.03em] font-medium"
                    style={styles.heading}
                  >
                    3. Physical grounding through touch
                  </h3>

                  <div className="mt-7 rounded-[6px] bg-[#EAF4DF] px-5 py-[10px] inline-block w-full">
                    <p className="text-[#59713F] text-[18px] font-medium">
                      Best for: Feeling disconnected or overwhelmed
                    </p>
                  </div>

                  <div className="mt-7 space-y-6 text-[18px] leading-[210%] text-[#3D3935]">
                    <p>
                      Physical touch is one of the most effective ways to anchor yourself. Try:
                    </p>

                    <ul className="list-disc pl-5 space-y-2">
                      <li>Holding a cold water bottle</li>
                      <li>Pressing your feet firmly into the floor</li>
                      <li>Running your hands under cold water</li>
                      <li>Touching textured fabric or jewelry</li>
                      <li>Clenching and releasing your fists</li>
                    </ul>

                    <p>
                      These actions create sensory feedback that reconnects your brain with your body.
                    </p>
                  </div>
                </section>

                {/* SECTION 4 */}
                <section id="micro-movements" className="mt-[72px]">
                  <h3
                    className="text-[30px] leading-[120%] tracking-[-0.03em] font-medium"
                    style={styles.heading}
                  >
                    4. Micro-movements
                  </h3>

                  <div className="mt-7 rounded-[6px] bg-[#EAF4DF] px-5 py-[10px] inline-block w-full">
                    <p className="text-[#59713F] text-[18px] font-medium">
                      Best for: Anxiety during work or social situations
                    </p>
                  </div>

                  <div className="mt-7 space-y-6 text-[18px] leading-[210%] text-[#3D3935]">
                    <p>
                      Anxiety creates physical tension. Your body prepares to react even when there’s no real threat.
                      Small movements can release some of that stored stress without drawing attention.
                    </p>

                    <p>Try:</p>

                    <ul className="list-disc pl-5 space-y-1">
                      <li>Rolling your shoulders</li>
                      <li>Relaxing your jaw</li>
                      <li>Stretching your fingers</li>
                      <li>Slowly rotating your ankles</li>
                      <li>Taking a short walk</li>
                      <li>Standing up briefly between tasks</li>
                    </ul>

                    <p>
                      Even tiny movements help regulate your nervous system.
                    </p>
                  </div>
                </section>

                {/* WHAT GROUNDING CAN DO */}
                <section id="what-grounding" className="mt-[72px]">
                  <h3
                    className="text-[30px] leading-[120%] tracking-[-0.03em] font-medium text-[#111111]"
                    style={styles.heading}
                  >
                    What grounding can — and cannot — do
                  </h3>

                  <div className="mt-7 rounded-[6px] bg-[#EAF4DF] px-5 py-[10px] inline-block w-full">
                    <p className="text-[#59713F] text-[18px] font-medium">
                      Grounding techniques are tools, not cures.
                    </p>
                  </div>

                  <div className="mt-7 space-y-6 text-[18px] leading-[210%] text-[#3D3935]">
                    <p>They help you:</p>

                    <ul className="list-disc pl-5 space-y-1">
                      <li>regain focus,</li>
                      <li>reduce nervous system overload,</li>
                      <li>slow spiraling thoughts,</li>
                      <li>and feel more present.</li>
                    </ul>

                    <p>
                      But if anxiety is constant, severely disruptive, or
                      affecting daily functioning, grounding alone may not be
                      enough.
                    </p>

                    <p>Chronic anxiety often requires broader support:</p>

                    <ul className="list-disc pl-5 space-y-1">
                      <li>therapy,</li>
                      <li>lifestyle adjustments,</li>
                      <li>stress management,</li>
                      <li>sleep regulation,</li>
                      <li>or medical care.</li>
                    </ul>
                  </div>
                </section>

                {/* FINAL THOUGHT */}
                <section id="final-thought" className="mt-[72px]">
                  <h3
                    className="text-[30px] leading-[120%] tracking-[-0.03em] font-medium text-[#111111]"
                    style={styles.heading}
                  >
                    Final thought
                  </h3>

                  <div className="mt-7 space-y-6 text-[18px] leading-[210%] text-[#3D3935]">
                    <p>
                      You do not need perfect calm to regain control.
                      <br />
                      Sometimes the goal is simply:
                    </p>

                    <ul className="list-disc pl-5 space-y-1">
                      <li>One slower breath,</li>
                      <li>One grounded moment,</li>
                      <li>One interruption to the spiral.</li>
                    </ul>

                    <p>
                      That’s often enough to help your nervous system remember:
                      <br />
                      you are here, you are safe, and this moment will pass.
                    </p>
                  </div>
                </section>
                  </>
                )}

                {/* ACTION BUTTONS */}
                <div className="mt-16 flex flex-wrap gap-3 border-t border-[#D9D4CD] pt-8">
                  {[
                    {
                      icon: copied ? Check : Copy,
                      label: copied ? t("articleDetail.actions.copied") : t("articleDetail.actions.copyLink"),
                      onClick: handleCopyLink,
                    },
                    {
                      icon: Share2,
                      label: t("articleDetail.actions.share", { defaultValue: "Share" }),
                      onClick: handleShare,
                    },
                  ].map((item, index) => {
                    const Icon = item.icon;

                    return (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={item.onClick}
                        className={`flex items-center gap-2 rounded-[6px] border min-h-[2.125rem] h-auto py-2 px-4 text-[clamp(0.75rem,0.85rem,0.9rem)] cursor-pointer transition-colors ${
                          copied && index === 0
                            ? "border-green-400 bg-green-50 text-green-700"
                            : "border-[#D8D2CB] bg-white text-[#49433E] hover:bg-[#F0EDEA]"
                        }`}
                      >
                        <Icon size={14} />
                        {item.label}
                      </motion.button>
                    );
                  })}
                </div>
              </main>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24 bg-[#F5F3F0]">
        <div className="w-full navbar-align-outer">
          <div className="navbar-align-inner">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="rounded-[12px] bg-[#0D4A7A] px-8 py-[56px] text-center text-white w-full"
            >
              <h2
                className="text-[38px] leading-[115%] tracking-[-0.03em] font-medium"
                style={styles.heading}
              >
                {t("articleDetail.cta.title")}
              </h2>

              <p className="mx-auto mt-5 max-w-[720px] text-white/85 text-[15px] leading-[190%]">
                {t("articleDetail.cta.description")}
              </p>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => openModal()}
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-white min-h-[3.75rem] h-auto py-3 px-6 sm:px-8 text-[clamp(0.9rem,1.1rem,1.125rem)] font-semibold text-[#0D4A7A] cursor-pointer whitespace-normal text-center"
              >
                {t("articleDetail.cta.button")}

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
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}