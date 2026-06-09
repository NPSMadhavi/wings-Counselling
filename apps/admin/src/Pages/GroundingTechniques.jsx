import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Copy, Mail, Download, Printer, Check } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { useLocation } from "wouter";
import { useAppointment } from "@/context/AppointmentContext";

const heroImg = "/assets/ihero1.jpeg";
const introImg = "/assets/img4.jpg";

const sections = [
  { label: "Introduction", id: "what-is-anxiety" },
  { label: "1. The 5–4–3–2–1 Method", id: "5-4-3-2-1-method" },
  { label: "2. Controlled Breathing", id: "controlled-breathing" },
  { label: "3. Physical Grounding Through Touch", id: "physical-grounding" },
  { label: "4. Micro-Movements", id: "micro-movements" },
  { label: "What Grounding Can — and Cannot — Do", id: "what-grounding" },
  { label: "Final Thought", id: "final-thought" },
];

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
  const { openModal } = useAppointment();
  const [activeSection, setActiveSection] = useState("what-is-anxiety");
  const articleRef = useRef(null);
  const mainContentRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const sectionIds = [
        "what-is-anxiety",
        "5-4-3-2-1-method",
        "controlled-breathing",
        "physical-grounding",
        "micro-movements",
        "what-grounding",
        "final-thought",
      ];

      let currentSection = sectionIds[0];
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          // If the top of the section is at or above the top 200px of the viewport, it's the active one
          if (rect.top <= 200) {
            currentSection = id;
          }
        }
      }
      setActiveSection(currentSection);
    };

    const mainEl = mainContentRef.current;
    window.addEventListener("scroll", handleScroll);
    if (mainEl) mainEl.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (mainEl) mainEl.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent("4 Grounding Techniques for When Anxiety Spikes");
    const body = encodeURIComponent(
      `Check out this article on grounding techniques for anxiety:\n\n${window.location.href}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_self");
  };

  const generatePDF = async (mode = "download") => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const checkPage = (needed = 12) => {
      if (y + needed > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    const addWrappedText = (text, x, fontSize, color, maxWidth, lineHeight = 7, fontStyle = "normal") => {
      doc.setFontSize(fontSize);
      doc.setTextColor(...color);
      doc.setFont("helvetica", fontStyle);
      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach((line) => {
        checkPage(lineHeight);
        doc.text(line, x, y);
        y += lineHeight;
      });
    };

    // ─── HEADER BAR ───
    doc.setFillColor(13, 74, 122); // #0D4A7A
    doc.rect(0, 0, pageWidth, 70, "F");

    // Title (first)
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    const titleLines = doc.splitTextToSize("4 Grounding Techniques for When Anxiety Spikes", contentWidth - 10);
    let titleY = 22;
    titleLines.forEach((line) => {
      doc.text(line, margin, titleY);
      titleY += 10;
    });

    // Description (below title)
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(210, 225, 240);
    const subtitle = "Do you have anxiety? Have you had an anxiety attack? Here's how to recognize the signs and symptoms of anxiety — and find the anxiety treatment and therapies you need.";
    const subLines = doc.splitTextToSize(subtitle, contentWidth - 10);
    let subY = titleY + 4;
    subLines.forEach((line) => {
      doc.text(line, margin, subY);
      subY += 5;
    });

    // Authors (below description)
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(180, 200, 220);
    doc.text("By Melinda Smith, M.A., Lawrence Robinson, Jeanne Segal, Ph.D., and Sheldon Reid", margin, subY + 3);

    y = 78;

    // ─── LOAD & ADD INTRO IMAGE ───
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = "/assets/img4.jpeg";
      });
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const imgData = canvas.toDataURL("image/jpeg", 0.85);
      const imgHeight = (contentWidth * img.naturalHeight) / img.naturalWidth;
      const displayHeight = Math.min(imgHeight, 65);
      checkPage(displayHeight + 5);
      doc.addImage(imgData, "JPEG", margin, y, contentWidth, displayHeight);
      y += displayHeight + 12;
    } catch {
      // Skip image if it fails to load
    }

    // ─── TABLE OF CONTENTS ───
    checkPage(55);
    doc.setFillColor(237, 243, 248); // #EDF3F8
    doc.roundedRect(margin, y, contentWidth, 55, 3, 3, "F");
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(13, 74, 122);
    doc.text("Table of Contents", margin + 8, y + 10);
    y += 16;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const tocItems = [
      "Introduction",
      "1. The 5-4-3-2-1 Method",
      "2. Controlled Breathing",
      "3. Physical Grounding Through Touch",
      "4. Micro-Movements",
      "What Grounding Can — and Cannot — Do",
      "Final Thought",
    ];
    tocItems.forEach((item) => {
      doc.text("•  " + item, margin + 8, y);
      y += 5.5;
    });
    y += 14;

    // ─── HELPER: ADD SECTION ───
    const addSection = (title, paragraphs, callout = null, listItems = null, calloutType = "info") => {
      checkPage(25);

      // Divider line before section
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, y, margin + contentWidth, y);
      y += 10;

      // Section heading
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(13, 74, 122); // #0D4A7A
      const headLines = doc.splitTextToSize(title, contentWidth);
      headLines.forEach((line) => {
        checkPage(9);
        doc.text(line, margin, y);
        y += 9;
      });
      y += 5;

      // Paragraphs
      paragraphs.forEach((para) => {
        addWrappedText(para, margin, 10, [61, 57, 53], contentWidth, 5.5); // #3D3935
        y += 4;
      });

      // List items
      if (listItems) {
        y += 2;
        listItems.forEach((item) => {
          checkPage(7);
          doc.setFontSize(10);
          doc.setTextColor(61, 57, 53);
          doc.setFont("helvetica", "normal");
          const bulletLines = doc.splitTextToSize(item, contentWidth - 10);
          doc.text("•", margin + 3, y);
          bulletLines.forEach((line) => {
            checkPage(6);
            doc.text(line, margin + 10, y);
            y += 5.5;
          });
        });
        y += 4;
      }

      // Callout box
      if (callout) {
        y += 3;
        checkPage(22);
        const boxColor = calloutType === "error" ? [255, 84, 62] : [62, 86, 109];
        const bgColor = calloutType === "error" ? [255, 240, 238] : [234, 241, 247];
        doc.setFillColor(...bgColor);
        const calloutLines = doc.splitTextToSize(callout.text, contentWidth - 20);
        const boxHeight = (calloutLines.length * 5) + 20;
        doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, "F");
        y += 9;
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...boxColor);
        doc.text(callout.title, margin + 10, y);
        y += 7;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        calloutLines.forEach((line) => {
          checkPage(5);
          doc.text(line, margin + 10, y);
          y += 5;
        });
        y += 6;
      }

      y += 10;
    };

    // ─── SECTION: Introduction ───
    addSection("What is Anxiety?", [
      "Anxiety is a normal reaction to danger, the body's automatic fight-or-flight response that is triggered when you feel threatened, under pressure, or are facing a challenging situation. However, when anxiety is constant or overwhelming, it can interfere with your daily life and relationships.",
      "Sometimes it creeps in slowly — tight shoulders, racing thoughts, shallow breathing. Other times it hits all at once, overwhelming you with a sudden wave of panic that makes it feel like you can't breathe.",
      "The problem is that when anxiety spikes, logic often stops working. Telling yourself to 'calm down' or 'relax' rarely works because your brain's emotional center has taken over.",
      "That's where grounding techniques help.",
      "Grounding is not about \"eliminating\" anxiety instantly. It's about reconnecting your brain to the present moment, helping your nervous system realize you are safe right now.",
      "Here are four grounding techniques that actually work in everyday situations.",
    ]);

    // ─── SECTION 1 ───
    addSection(
      "1. The 5–4–3–2–1 Method",
      ["Best for: Racing thoughts and panic spirals", "This is one of the fastest ways to pull your attention away from anxious thinking and back into your environment. Focus on:"],
      { title: "Example:", text: "You're sitting in a stressful meeting and feel panic rising. Instead of focusing on catastrophic thoughts, you intentionally notice: the texture of your chair, the hum of the AC, the color of someone's notebook, the smell of coffee nearby. This forces your brain to shift from \"imagined danger\" to \"present reality.\"" },
      ["5 things you can see", "4 things you can touch", "3 things you can hear", "2 things you can smell", "1 thing you can taste"],
    );

    // ─── SECTION 2 ───
    addSection(
      "2. Controlled Breathing",
      ["Best for: Fast heartbeat and physical anxiety symptoms", "When anxiety spikes, breathing becomes shallow and rapid. Your body interprets this as danger, which increases stress even more.", "Repeat for 1-2 minutes.", "The longer exhale is important because it activates the parasympathetic nervous system — the body's calming response."],
      { title: "Common Mistake:", text: "People often breathe too aggressively when anxious. Don't force 'deep' breaths; Focus on slower, softer breathing instead." },
      ["Inhale for 4 seconds", "Hold for 4 seconds", "Exhale for 6 seconds"],
      "error",
    );

    // ─── SECTION 3 ───
    addSection(
      "3. Physical Grounding Through Touch",
      ["Best for: Feeling disconnected or overwhelmed", "Physical touch is one of the most effective ways to anchor yourself. Try:", "These actions create sensory feedback that reconnects your brain with your body."],
      null,
      ["Holding a cold water bottle", "Pressing your feet firmly into the floor", "Running your hands under cold water", "Touching textured fabric or jewelry", "Clenching and releasing your fists"],
    );

    // ─── SECTION 4 ───
    addSection(
      "4. Micro-Movements",
      ["Best for: Anxiety during work or social situations", "Anxiety creates physical tension. Your body prepares to react even when there's no real threat. Small movements can release some of that stored stress without drawing attention.", "Even tiny movements help regulate your nervous system."],
      null,
      ["Rolling your shoulders", "Relaxing your jaw", "Stretching your fingers", "Slowly rotating your ankles", "Taking a short walk", "Standing up briefly between tasks"],
    );

    // ─── SECTION 5 ───
    addSection(
      "What Grounding Can — and Cannot — Do",
      ["Grounding techniques are tools, not cures.", "They help you:", "But if anxiety is constant, severely disruptive, or affecting daily functioning, grounding alone may not be enough.", "Chronic anxiety often requires broader support:"],
      null,
      ["Regain focus", "Reduce nervous system overload", "Slow spiraling thoughts", "Feel more present", "Therapy", "Lifestyle adjustments", "Stress management", "Sleep regulation", "Medical care"],
    );

    // ─── SECTION 6 ───
    addSection(
      "Final Thought",
      ["You do not need perfect calm to regain control. Sometimes the goal is simply:", "That's often enough to help your nervous system remember: you are here, you are safe, and this moment will pass."],
      null,
      ["One slower breath", "One grounded moment", "One interruption to the spiral"],
    );

    // ─── FOOTER on last page ───
    const footerY = pageHeight - 10;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text("WINGS Counselling Centre  •  www.wingscounselling.org", pageWidth / 2, footerY, { align: "center" });

    if (mode === "print") {
      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.left = "-9999px";
      iframe.style.top = "-9999px";
      iframe.style.width = "1px";
      iframe.style.height = "1px";
      iframe.src = pdfUrl;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          } catch {
            // fallback: open in new tab
            window.open(pdfUrl, "_blank");
          }
        }, 500);
      };
    } else {
      doc.save("Grounding-Techniques-for-Anxiety.pdf");
    }
  };

  const handleDownloadPDF = () => generatePDF("download");

  const handlePrint = () => generatePDF("print");

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
      <section className="relative h-[640px] md:h-[700px] overflow-hidden">
        <img
          src={heroImg}
          className="absolute inset-0 w-full h-full object-cover"
          alt=""
        />

        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 flex items-center justify-center h-full px-5">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-[760px] flex flex-col items-center text-center text-white"
          >
            <h1
              className="text-[44px] md:text-[58px] leading-[108%] tracking-[-0.04em] font-medium"
              style={{
                ...styles.heading,
                maxWidth: "620px",
              }}
            >
              You don’t have to navigate anxiety alone
            </h1>

            <p className="max-w-[560px] mx-auto mt-6 text-[15px] md:text-[17px] leading-[190%] text-white/90">
              Learn more about stress and anxiety, explore practical coping
              strategies, and discover professional support tailored to your
              needs.
            </p>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                document
                  .getElementById("anxiety-article")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="group flex items-center gap-2 cursor-pointer rounded-full bg-[#15467B] h-[46px] px-6 mt-9"
            >
              <span className="text-white text-[14px] font-medium">
                Explore support resources
              </span>

              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M6 9L12 15L18 9"
                  stroke="white"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* BREADCRUMB */}
      <div className="max-w-[1630px] mx-auto px-5 py-[22px]">
        <p className="text-[16px] leading-[160%]">
          <span
            onClick={() => navigate("/")}
            className="cursor-pointer underline hover:opacity-70 transition"
          >
            Home
          </span>

          <span className="mx-1">/</span>

          <span
            onClick={() => navigate("/StressAnxiety")}
            className="cursor-pointer underline hover:opacity-70 transition"
          >
            Stress & Anxiety
          </span>

          <span className="mx-1">/</span>

          <span id="anxiety-article">Grounding techniques</span>
        </p>
      </div>

      {/* INTRO SECTION */}
      <section className="w-full">
        <div className="grid lg:grid-cols-2 min-h-[410px]">
            {/* LEFT */}
          <div className="bg-[#0D4A7A] px-[154px] py-[54px] text-white flex items-center">
  <motion.div
    initial={{ opacity: 0, y: 28 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6 }}
    // Remove max-w-[430px] or increase it significantly
    className="max-w-[700px]"  // Changed from 430px to 700px
  >
    <p className="mb-7 text-white/80 text-[15px] uppercase tracking-wide">
      Last updated on February 27, 2026
    </p>

    <h2
      className="text-[38px] leading-[115%] tracking-[-0.03em] font-medium"
      // Remove max-w completely from h2
    >
      4 Grounding techniques for when anxiety spikes
    </h2>

    <p className="mt-7 text-white/85 text-[16px] leading-[190%]">
      Do you have anxiety? Have you had an anxiety attack? Here's how
      to recognize the signs and symptoms of anxiety—and find the
      anxiety treatment and therapies you need.
    </p>
  </motion.div>
</div>

            {/* RIGHT */}
            <div className="relative min-h-[410px] overflow-hidden">
              <img
                src={introImg}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
      </section>

      {/* ARTICLE */}
      <section className="bg-[#F5F3F0] lg:h-screen lg:overflow-hidden">
        <div className="mx-auto max-w-[1630px] px-5 py-[72px] lg:h-full">
          <div ref={articleRef} className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-[58px] items-start lg:h-full">
            {/* LEFT SIDEBAR */}
            <aside className="sidebar-scroll w-full lg:w-[220px] self-start max-h-[calc(100vh-8rem)] overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <div>
                {/* AUTHOR */}
                <div className="text-[16px] leading-[190%] text-[#595550]">
                  <p>
                    By Melinda Smith, M.A., Lawrence Robinson, Jeanne Segal,
                    Ph.D., and Sheldon Reid
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
                        className={`block w-full text-left text-[16px] leading-[160%] py-[10px] pl-5 border-l-2 transition-all duration-300 ${isActive
                            ? "border-[#0D4A7A] text-[#0D4A7A] font-bold bg-[#EDF3F8]"
                            : "border-[#D8D3CC] text-[#6D6862] hover:text-[#0D4A7A] hover:border-[#9DB4C9]"
                          }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                {/* RELATED ARTICLES */}
                <div className="mt-[58px]">
                  {[1, 2, 3, 4].map((_, index) => (
                    <div
                      key={index}
                      className={`${index !== 0 ? "border-t border-[#D7D2CB]" : ""
                        } pt-[22px] pb-[26px]`}
                    >
                      <h4
                        className="text-[18px] leading-[135%] tracking-[-0.02em] text-[#2C2C2A] font-normal"
                        style={{
                          fontFamily: "Outfit, sans-serif",
                        }}
                      >
                        Difficult conversations with your partner without
                        becoming an argument
                      </h4>

                      <p className="mt-[14px] text-[14px] leading-[165%] text-[#2C2C2A]">
                        Communication breakdowns are at the heart of most
                        relationship struggles.
                      </p>

                      <div className="mt-[10px] flex items-center gap-[10px]">
                        <span className="text-[13px] text-[#0D4A7A]">
                          6 min read
                        </span>

                        <span className="w-[3px] h-[3px] rounded-full bg-[#0D4A7A]" />

                        <span className="text-[13px] text-[#0D4A7A]">
                          Priya Anand
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            {/* RIGHT ARTICLE CONTENT */}
            <main ref={mainContentRef} className="sidebar-scroll w-full lg:self-stretch lg:overflow-y-auto" style={{ scrollBehavior: 'smooth', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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
                  1. The 5–4–3–2–1 Method
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
                  2. Controlled Breathing
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
                  <h4 className="text-[#FF0000] text-[18px] font-bold mb-2">Common Mistake:</h4>
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
                  3. Physical Grounding Through Touch
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
                  4. Micro-Movements
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
                  What Grounding Can — and Cannot — Do
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
                  Final Thought
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

              {/* ACTION BUTTONS */}
              <div className="mt-16 flex flex-wrap gap-3 border-t border-[#D9D4CD] pt-8">
                {[
                  {
                    icon: copied ? Check : Copy,
                    label: copied ? "Copied!" : "Copy Link",
                    onClick: handleCopyLink,
                  },
                  {
                    icon: Mail,
                    label: "Share via Email",
                    onClick: handleShareEmail,
                  },
                  {
                    icon: Download,
                    label: "Download PDF",
                    onClick: handleDownloadPDF,
                  },
                  {
                    icon: Printer,
                    label: "Print Document",
                    onClick: handlePrint,
                  },
                ].map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={item.onClick}
                      className={`flex items-center gap-2 rounded-[6px] border px-4 h-[34px] text-[12px] cursor-pointer transition-colors ${
                        copied && index === 0
                          ? "border-green-400 bg-green-50 text-green-700"
                          : "border-[#D8D2CB] bg-white text-[#49433E] hover:bg-[#F0EDEA]"
                      }`}
                    >
                      <Icon size={13} />
                      {item.label}
                    </motion.button>
                  );
                })}
              </div>
            </main>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24 bg-[#F5F3F0]">
        <div className="max-w-[1630px] mx-auto px-5">
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
              Ready to Talk to Someone?
            </h2>

            <p className="mx-auto mt-5 max-w-[720px] text-white/85 text-[15px] leading-[190%]">
              Our counselling team is here to listen, support, and guide you in a
              safe and confidential environment.
            </p>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openModal()}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white h-[46px] px-6 text-[14px] font-semibold text-[#0D4A7A] cursor-pointer"
            >
              Book an appointment

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
      </section>

      <Footer />
    </div>
  );
}