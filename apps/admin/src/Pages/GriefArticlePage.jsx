import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Copy, Mail, Download, Printer, Check } from "lucide-react";
import { Footer } from "@/components/Layout/Footer";
import { useLocation } from "wouter";
import { useAppointment } from "@/context/AppointmentContext";

const heroImg = "/assets/ihero1.jpeg";
const introImg = "/assets/img4.jpg";

const sections = [
  { label: "Introduction", id: "what-is-grief" },
  { label: "1. What grief can feel like", id: "what-grief-feels-like" },
  { label: "2. Losses that can cause grief", id: "losses-that-cause-grief" },
  { label: "3. When life becomes heavy with grief", id: "when-life-becomes-heavy" },
  { label: "4. Getting support", id: "getting-support" },
  { label: "Final thought", id: "final-thought" },
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
  const [activeSection, setActiveSection] = useState("what-is-grief");
  const articleRef = useRef(null);
  const mainContentRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const sectionIds = [
        "what-is-grief",
        "what-grief-feels-like",
        "losses-that-cause-grief",
        "when-life-becomes-heavy",
        "getting-support",
        "final-thought",
      ];

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
    const subject = encodeURIComponent("GRIEF - a hidden crisis?");
    const body = encodeURIComponent(
      `Check out this article on grief and support:\n\n${window.location.href}`
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

    const addWrappedText = (
      text,
      x,
      fontSize,
      color,
      maxWidth,
      lineHeight = 7,
      fontStyle = "normal"
    ) => {
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

    doc.setFillColor(13, 74, 122);
    doc.rect(0, 0, pageWidth, 70, "F");

    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);

    const titleLines = doc.splitTextToSize(
      "GRIEF - a hidden crisis?",
      contentWidth - 10
    );

    let titleY = 22;

    titleLines.forEach((line) => {
      doc.text(line, margin, titleY);
      titleY += 10;
    });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(210, 225, 240);

    const subtitle =
      "Grief is a natural reaction to loss. It can arise from many kinds of meaningful loss and may affect emotions, physical health, and daily life.";

    const subLines = doc.splitTextToSize(subtitle, contentWidth - 10);

    let subY = titleY + 4;

    subLines.forEach((line) => {
      doc.text(line, margin, subY);
      subY += 5;
    });

    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(180, 200, 220);
    doc.text("By WINGS Counselling Centre", margin, subY + 3);

    y = 78;

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

    checkPage(55);

    doc.setFillColor(237, 243, 248);
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
      "1. What grief can feel like",
      "2. Losses that can cause grief",
      "3. When life becomes heavy with grief",
      "4. Getting support",
      "What grounding can — and cannot — do",
      "Final thought",
    ];

    tocItems.forEach((item) => {
      doc.text("•  " + item, margin + 8, y);
      y += 5.5;
    });

    y += 14;

    const addSection = (
      title,
      paragraphs,
      callout = null,
      listItems = null,
      calloutType = "info"
    ) => {
      checkPage(25);

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, y, margin + contentWidth, y);

      y += 10;

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(13, 74, 122);

      const headLines = doc.splitTextToSize(title, contentWidth);

      headLines.forEach((line) => {
        checkPage(9);
        doc.text(line, margin, y);
        y += 9;
      });

      y += 5;

      paragraphs.forEach((para) => {
        addWrappedText(para, margin, 10, [61, 57, 53], contentWidth, 5.5);
        y += 4;
      });

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

      if (callout) {
        y += 3;
        checkPage(22);

        const boxColor =
          calloutType === "error" ? [255, 84, 62] : [62, 86, 109];

        const bgColor =
          calloutType === "error" ? [255, 240, 238] : [234, 241, 247];

        doc.setFillColor(...bgColor);

        const calloutLines = doc.splitTextToSize(
          callout.text,
          contentWidth - 20
        );

        const boxHeight = calloutLines.length * 5 + 20;

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

    addSection("GRIEF - a hidden crisis?", [
      "Grief is a natural reaction, a kind of acute pain that accompanies a loss. However, this reaction is not only limited to the loss of a loved one. It can also arise from the loss of a treasured pet, a position in society, a job, or a relationship that was meaningful.",
      "Because grief reflects what or who we love, when something or someone we love is taken away, it can feel overwhelmingly painful or all-encompassing. Sometimes the same pain can become complex when a person does not have the opportunity or space to experience the pain fully because of overwhelming responsibilities around them.",
    ]);

    addSection("1. What grief can feel like", [
      "Grief can affect both emotional and physical wellbeing.",
      "In grief, one may experience all kinds of difficult and unexpected emotions, ranging from shock or anger to disbelief, guilt, and profound sadness.",
      "The pain of grief can disrupt physical health, making it difficult to sleep, eat, or even think straight. These are normal reactions to loss, and the more significant the loss, the more intense the grief may feel.",
      "The grief experience and the grief process are common occurrences interwoven throughout our lives. The intensity and duration of grief depends on one’s personal reaction to a particular loss. Every crisis involves an element of grief because crisis often involves loss, and loss results in grief.",
    ]);

    addSection(
      "2. Losses that can cause grief",
      [
        "Grief is not limited to the death of a loved one.",
        "People may associate grieving with the death of a loved one, which is often the cause of the most intense type of grief. However, any meaningful loss can cause grief, including:",
        "Even subtle losses in life can trigger grief. For example, one might grieve after moving away from an ancestral home or changing jobs.",
      ],
      null,
      [
        "Divorce or relationship breakup",
        "Loss of health",
        "Losing a job",
        "Loss of financial stability",
        "A miscarriage",
        "Retirement",
        "A loved one’s serious illness",
        "Loss of a friendship",
        "Loss of safety after a trauma",
      ]
    );

    addSection("3. When life becomes heavy with grief", [
      "Taking care of yourself is important, even while grieving.",
      "Firstly, taking care of one’s own self is important even when grieving. You may experience difficulty sleeping or a lack of motivation, but having a healthy diet, maintaining exercise, and keeping a hygienic routine are important for emotional healing.",
      "Time can be the best healer in many cases, but there are other avenues of help as well. Speaking to a trusted friend or relative about overwhelming experiences can help a person feel less alone.",
    ]);

    addSection("4. Getting support", [
      "Counselling may help when grief feels intense or prolonged.",
      "One can also seek assistance from a trained counsellor who understands that whatever your loss may be, it is personal and unique to you. Counselling can help you process the loss in a safe and supportive space.",
      "Although not everyone will need counselling, if someone is experiencing intense grief for a long time after the loss, counselling may indeed be necessary.",
    ]);

    addSection("Final thought", [
      "Whatever it is, there is no need to feel scared or ashamed about how you feel, or to believe that it is strange to behave or feel the way you are feeling.",
      "Instead, believe that in time to come, you can come to terms with your loss, find new meaning, and eventually move on with your life. Temporarily, you may feel disoriented, numb, or empty, and it is okay to need help from others.",
    ]);

    const footerY = pageHeight - 10;

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text("WINGS Counselling Centre", pageWidth / 2, footerY, {
      align: "center",
    });

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
            window.open(pdfUrl, "_blank");
          }
        }, 500);
      };
    } else {
      doc.save("Grief-a-hidden-crisis.pdf");
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

        <div className="relative z-10 w-full h-full navbar-align-outer">
          <div className="navbar-align-inner h-full flex items-center justify-center">
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
                You don’t have to navigate grief alone
              </h1>

              <p className="max-w-[560px] mx-auto mt-6 text-[15px] md:text-[17px] leading-[190%] text-white/90">
                Learn more about grief, understand how loss can affect you,
                and discover professional support tailored to your needs.
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
                  Explore grief support
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
        </div>
      </section>

      {/* BREADCRUMB */}
      <div className="w-full navbar-align-outer">
        <div className="navbar-align-inner py-[22px]">
          <p className="text-[16px] leading-[160%]">
            <span
              onClick={() => navigate("/")}
              className="cursor-pointer underline hover:opacity-70 transition"
            >
              Home
            </span>

            <span className="mx-1">/</span>

            <span
              onClick={() => navigate("/articles")}
              className="cursor-pointer underline hover:opacity-70 transition"
            >
              Back to articles
            </span>

            <span className="mx-1">/</span>

            <span id="anxiety-article">Grief & Loss</span>
          </p>
        </div>
      </div>

      {/* INTRO SECTION */}
      <section className="w-full">
        <div className="grid lg:grid-cols-2 min-h-[410px]">
          {/* LEFT */}
          <div className="bg-[#0D4A7A] px-[24px] md:px-[34px] lg:px-[74px] py-[54px] text-white flex items-center">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-[700px]"
            >
              <p className="mb-7 text-white/80 text-[15px] tracking-wide">
                Last updated on february 27, 2026
              </p>

              <h2 className="text-[25px] md:text-[28px] lg:text-[38px] leading-[115%] tracking-[-0.03em] font-medium">
                4 Grief support for when anxiety spikes
              </h2>

              <p className="mt-7 text-white/85 text-[16px] leading-[190%]">
                Grief is a natural reaction to loss, but it is not limited to the
                death of a loved one. Any meaningful loss can feel deeply painful
                and may need care, time, and support.
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
      <section className="bg-[#F5F3F0] xl:h-screen xl:overflow-hidden">
    <div className="w-full xl:h-full">
  <div className="w-full px-[24px] md:px-[34px] lg:px-[74px] py-[72px] xl:h-full">
            <div
              ref={articleRef}
             className="grid grid-cols-1 xl:grid-cols-[220px_1fr] gap-[58px] items-start xl:h-full"
            >
              {/* LEFT SIDEBAR */}
              <aside
               className="sidebar-scroll hidden xl:block w-full xl:w-[220px] self-start max-h-[calc(100vh-8rem)] overflow-y-auto overflow-x-hidden"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                <div>
                  {/* AUTHOR */}
                  <div className="text-[16px] leading-[190%] text-[#595550]">
                    <p>By Dr. Elena Morris · Relationship expert</p>
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
                          className={`block w-full text-left text-[16px] leading-[160%] py-[10px] pl-5 border-l-2 transition-all duration-300 ${
                            isActive
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
                        className={`${
                          index !== 0 ? "border-t border-[#D7D2CB]" : ""
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
              <main
                ref={mainContentRef}
                className="sidebar-scroll w-full xl:self-stretch xl:overflow-y-auto"
                style={{
                  scrollBehavior: "smooth",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                {/* INTRO */}
                <motion.div
                  id="what-is-grief"
                  initial={{ opacity: 0, y: 26 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <h2
                    className="text-[35px] leading-[120%] tracking-[-0.03em] font-medium text-[#111111]"
                    style={styles.heading}
                  >
                    GRIEF - a hidden crisis?
                  </h2>

                  <div className="mt-7 space-y-6 text-[18px] leading-[210%] text-[#3D3935]">
                    <p>
                      Grief is a natural reaction, a kind of acute pain that
                      accompanies a loss. However, this reaction is not only
                      limited to the loss of a loved one. It can also arise from
                      the loss of a treasured pet, a position in society, a job,
                      or a relationship that was meaningful.
                    </p>

                    <p>
                      Because grief reflects what or who we love, when something
                      or someone we love is taken away, it can feel
                      overwhelmingly painful or all-encompassing. Sometimes the
                      same pain can become complex when a person does not have
                      the opportunity or space to experience the pain fully
                      because of overwhelming responsibilities around them.
                    </p>
                  </div>
                </motion.div>

                {/* SECTION 1 */}
                <section id="what-grief-feels-like" className="mt-[72px]">
                  <h3
                    className="text-[26px] leading-[120%] tracking-[-0.03em] font-medium"
                    style={styles.heading}
                  >
                    1. What grief can feel like
                  </h3>

                  <div className="mt-7 rounded-[6px] bg-[#EAF4DF] px-5 py-[10px] inline-block w-full">
                    <p className="text-[#59713F] text-[18px] font-medium">
                      Grief can affect both emotional and physical wellbeing.
                    </p>
                  </div>

                  <div className="mt-7 space-y-6 text-[18px] leading-[210%] text-[#3D3935]">
                    <p>
                      In grief, one may experience all kinds of difficult and
                      unexpected emotions, ranging from shock or anger to
                      disbelief, guilt, and profound sadness.
                    </p>

                    <p>
                      The pain of grief can disrupt physical health, making it
                      difficult to sleep, eat, or even think straight. These are
                      normal reactions to loss, and the more significant the
                      loss, the more intense the grief may feel.
                    </p>

                    <p>
                      The grief experience and the grief process are common
                      occurrences interwoven throughout our lives. The intensity
                      and duration of grief depends on one’s personal reaction to
                      a particular loss. Every crisis involves an element of
                      grief because crisis often involves loss, and loss results
                      in grief.
                    </p>
                  </div>
                </section>

                {/* SECTION 2 */}
                <section id="losses-that-cause-grief" className="mt-[72px]">
                  <h3
                    className="text-[30px] leading-[120%] tracking-[-0.03em] font-medium"
                    style={styles.heading}
                  >
                    2. Losses that can cause grief
                  </h3>

                  <div className="mt-7 rounded-[6px] bg-[#EAF4DF] px-5 py-[10px] inline-block w-full">
                    <p className="text-[#59713F] text-[18px] font-medium">
                      Grief is not limited to the death of a loved one.
                    </p>
                  </div>

                  <div className="mt-7 space-y-6 text-[18px] leading-[210%] text-[#3D3935]">
                    <p>
                      People may associate grieving with the death of a loved
                      one, which is often the cause of the most intense type of
                      grief. However, any meaningful loss can cause grief,
                      including:
                    </p>

                    <ul className="list-disc pl-5 space-y-2">
                      <li>Divorce or relationship breakup</li>
                      <li>Loss of health</li>
                      <li>Losing a job</li>
                      <li>Loss of financial stability</li>
                      <li>A miscarriage</li>
                      <li>Retirement</li>
                      <li>A loved one’s serious illness</li>
                      <li>Loss of a friendship</li>
                      <li>Loss of safety after a trauma</li>
                    </ul>

                    <p>
                      Even subtle losses in life can trigger grief. For example,
                      one might grieve after moving away from an ancestral home
                      or changing jobs.
                    </p>
                  </div>
                </section>

                {/* SECTION 3 */}
                <section id="when-life-becomes-heavy" className="mt-[72px]">
                  <h3
                    className="text-[30px] leading-[120%] tracking-[-0.03em] font-medium"
                    style={styles.heading}
                  >
                    3. When life becomes heavy with grief
                  </h3>

                  <div className="mt-7 rounded-[6px] bg-[#EAF4DF] px-5 py-[10px] inline-block w-full">
                    <p className="text-[#59713F] text-[18px] font-medium">
                      Taking care of yourself is important, even while grieving.
                    </p>
                  </div>

                  <div className="mt-7 space-y-6 text-[18px] leading-[210%] text-[#3D3935]">
                    <p>
                      Firstly, taking care of one’s own self is important even
                      when grieving. You may experience difficulty sleeping or a
                      lack of motivation, but having a healthy diet, maintaining
                      exercise, and keeping a hygienic routine are important for
                      emotional healing.
                    </p>

                    <p>
                      Time can be the best healer in many cases, but there are
                      other avenues of help as well. Speaking to a trusted
                      friend or relative about overwhelming experiences can help
                      a person feel less alone.
                    </p>
                  </div>
                </section>

                {/* SECTION 4 */}
                <section id="getting-support" className="mt-[72px]">
                  <h3
                    className="text-[30px] leading-[120%] tracking-[-0.03em] font-medium"
                    style={styles.heading}
                  >
                    4. Getting support
                  </h3>

                  <div className="mt-7 rounded-[6px] bg-[#EAF4DF] px-5 py-[10px] inline-block w-full">
                    <p className="text-[#59713F] text-[18px] font-medium">
                      Counselling may help when grief feels intense or
                      prolonged.
                    </p>
                  </div>

                  <div className="mt-7 space-y-6 text-[18px] leading-[210%] text-[#3D3935]">
                    <p>
                      One can also seek assistance from a trained counsellor who
                      understands that whatever your loss may be, it is personal
                      and unique to you. Counselling can help you process the
                      loss in a safe and supportive space.
                    </p>

                    <p>
                      Although not everyone will need counselling, if someone is
                      experiencing intense grief for a long time after the loss,
                      counselling may indeed be necessary.
                    </p>
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
                      Whatever it is, there is no need to feel scared or ashamed
                      about how you feel, or to believe that it is strange to
                      behave or feel the way you are feeling.
                    </p>

                    <p>
                      Instead, believe that in time to come, you can come to
                      terms with your loss, find new meaning, and eventually
                      move on with your life. Temporarily, you may feel
                      disoriented, numb, or empty, and it is okay to need help
                      from others.
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
                Ready to talk to someone?
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
        </div>
      </section>

      <Footer />
    </div>
  );
}