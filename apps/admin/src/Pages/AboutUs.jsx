import React from "react";
import { Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { useAppointment } from "@/context/AppointmentContext";
import { useLocation } from "wouter";
import { Footer } from "@/components/Layout/Footer";

const timelineData = [
  {
    year: "1995",
    category: "The beginning",
    title: "Ramakrishna mission counselling centre opens",
    desc: "With funding from the NCSS 25th anniversary endowment fund, the Ramakrishna mission launched a pilot project with three counsellors and one administrative assistant, operating from a single room in the mission library. Counsellors immediately began networking with neighbourhood schools to identify students who could benefit from professional support."
  },
  {
    year: "1996",
    category: "Recognition",
    title: "NCSS officially recognises the centre",
    desc: "The National Council of Social Service (NCSS) recognised the Centre's positive community impact and made it a fully funded agency for School Social Work (SSW) — cementing its role in Singapore's social welfare ecosystem."
  },
  {
    year: "1997",
    category: "Growth",
    title: "First major relocation — Sarada hall",
    desc: "Growing client demand required a larger footprint. The Centre moved to Sarada Hall, gaining three counselling rooms, an admin office, and a conference space for case discussions and team meetings — marking the beginning of a true centre-based approach."
  },
  {
    year: "2002",
    category: "Transformation",
    title: "Rebranded to WINGS — and a new home",
    desc: "The management committee repositioned the centre as a secular community service provider, renaming it \"WINGS Counselling Centre\" — symbolising the capacity to rise and grow. Simultaneously, the Centre moved to a state-of-the-art facility featuring one-way mirror counselling rooms, play therapy suites, and art therapy observation spaces."
  },
  {
    year: "2004",
    category: "Expansion",
    title: "Family-Life education programme launched",
    desc: "Recognising the power of working with entire family units, WINGS became a service provider for the School Family-life Education (SFE) programme under MCYS (now MSF). Skill-based parenting workshops were delivered to primary and secondary schools island-wide using a three-pronged approach: schools, homes, and community."
  },
  {
    year: "2009",
    category: "Pioneering",
    title: "Singapore's first pre-school support programme",
    desc: "In collaboration with NCSS, WINGS launched the groundbreaking Pre-School Support Programme (PSSP) — Singapore's first preventive intervention programme for children aged 2.5 to below 7 years. The programme helped pre-schoolers navigate the transition from home-based informal learning to structured school environments, ensuring every child could reach their full potential."
  },
  {
    year: "2012",
    category: "Milestone",
    title: "Family support & Counselling programme (FSCP)",
    desc: "WINGS repositioned as a fully centre-based counselling organisation, developing the internally researched Family Support and Counselling Programme (FSCP) — serving clients aged 7 to 65 with specialised, evidence-based therapeutic interventions across individual, couples, and family modalities."
  },
  {
    year: "Today",
    category: "Present",
    title: "WINGS in schools & Centre — serving all of singapore",
    desc: "WINGS now delivers counselling in primary and secondary schools island-wide, working alongside school leaders and counsellors to support students with family-related challenges. Our centre continues to serve clients from 2.5 to 65 years old, using expressive therapies — including sand-tray, play therapy, and symbol work — tailored to each individual's journey."
  }
];

export default function AboutUs() {
  const { openModal } = useAppointment();
  const [, navigate] = useLocation();
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    },
  };

  return (
    <div className="w-full flex flex-col min-h-screen">
      {/* Hero Section - CENTERED */}
      <div
        className="w-full flex justify-center items-center overflow-hidden relative shrink-0"
        style={{
          background: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url("/assets/AboutusImage.jpg")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          minHeight: "480px",
          height: "clamp(480px, 55vw, 790px)",
        }}
      >
        <motion.div
          className="w-full px-4 sm:px-6 md:px-8 lg:px-[150px] flex flex-col items-center justify-center text-center relative h-full"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center justify-center mb-6 sm:mb-8"
            style={{
              padding: "6px 16px",
              borderRadius: "9999px",
              border: "1px solid rgba(255,255,255,0.4)",
              backgroundColor: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(4px)",
              color: "#FFFFFF",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 600,
              fontSize: "20x",
              letterSpacing: "1.2px",
            }}
          >
            About WINGS Counselling Centre
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-[32px] sm:text-[44px] md:text-[54px] lg:text-[60px] font-semibold leading-tight mb-6 sm:mb-8 text-white"
            style={{ fontFamily: "'Outfit', sans-serif", maxWidth: "800px" }}
          >
            Healing hearts <br />
            <span style={{ color: "#4BB6CF" }}>since 1995.</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-[15px] sm:text-[17px] md:text-[20px] leading-relaxed mb-8 sm:mb-10 text-white"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, maxWidth: "800px" }}
          >
            Born from a deep belief that everyone deserves compassionate support, WINGS has grown
            from a single counselling room into Singapore's most trusted community mental wellness
            centre — serving children, families, and adults across every stage of life.
          </motion.p>

          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              const journey = document.getElementById('journey-section');
              journey?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer"
            style={{
              padding: "12px 28px",
              borderRadius: "9999px",
              background: "#1B4585",
              color: "#F5F9FF",
              border: "none",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 600,
              fontSize: "clamp(15px, 1.5vw, 18px)",
            }}
          >
            Explore our story
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
      </div>

     {/* Quote Section (Refined) */}
<div
  className="w-full flex justify-center items-center relative overflow-hidden shrink-0 py-8 sm:py-10 md:py-12"
  style={{ background: "#E8F4FD" }}
>
  <div className="w-full max-w-[1100px] relative flex flex-col items-center justify-center px-4 sm:px-10 md:px-14 py-4 md:py-6">

    <p
      className="text-center z-10 text-[18px] sm:text-[24px] md:text-[32px] lg:text-[38px] font-semibold mb-4 sm:mb-5"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        lineHeight: "1.4",
        color: "#1B4585",
        maxWidth: "1000px",
      }}
    >
      "Guidance and support provided at an early stage greatly enhances the
      ability of children and youth to cope — and to grow into well-adjusted,
      thriving adults."
    </p>

    <p
      className="text-center z-10 text-[15px] sm:text-[17px] md:text-[20px]"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 500,
        color: "#111827",
      }}
    >
      — Swami Jayadevananda, Founder's Vision, 1995
    </p>
  </div>
</div>

      {/* Journey Section - TIMELINE WITH FIXED CENTER CIRCLE, BOXES APPEAR IN POSITION */}
<div
  id="journey-section"
  className="w-full pt-8 sm:pt-10 md:pt-14 flex justify-center bg-[#FDFDFD] pb-12 sm:pb-16 md:pb-[100px] overflow-hidden"
>
        <div className="w-full flex flex-col items-center">

          {/* Section Header */}
          <div className="flex flex-col items-center text-center mb-16 md:mb-[120px] px-4 sm:px-6 md:px-8 lg:px-[150px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center justify-center mb-6"
              style={{
                padding: "6px 16px",
                borderRadius: "9999px",
                background: "linear-gradient(90deg, #0D4A7A 0%, #1888E0 100%)",
                color: "#F7F6F3",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 600,
                fontSize: "20px",
                letterSpacing: "1.2px",
              }}
            >
              Our journey
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-[28px] sm:text-[32px] md:text-[35px] font-medium mb-6"
              style={{
                fontFamily: "'Outfit', sans-serif",
                color: "#111827",
                lineHeight: "100%",
                maxWidth: "675px"
              }}
            >
              Three decades of growing with Singapore
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-[16px] sm:text-[18px] md:text-[20px] leading-[1.6] font-medium"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                color: "#4B5563",
                maxWidth: "994px"
              }}
            >
              What began as a one-room pilot project in 1995 has evolved into a<br />
              multi-service counselling centre — shaped by community need, guided by compassion,<br />
              and trusted by thousands of families across Singapore.
            </motion.p>
          </div>

          {/* Timeline Container */}
          <div className="relative w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-0">
            {/* Center Line */}
            <div
              className="absolute left-1/2 -translate-x-1/2 h-full w-[3px] bg-[#1E3A8A] hidden md:block"
              style={{ top: 0 }}
            />

            <div className="flex flex-col w-full">
              {timelineData.map((item, idx) => {
                const isLeft = idx % 2 === 0;
                return (
                  <div key={idx} className="relative flex flex-col md:flex-row items-start w-full mb-16 md:mb-24 last:mb-0">
                    {/* Fixed Circle and Icon - Shadow removed */}
                    <div className="absolute left-1/2 -translate-x-1/2 z-10 hidden md:flex items-center justify-center">
                      <div className="w-[75px] h-[75px] rounded-full bg-[#1E3A8A] flex items-center justify-center">
                        <Trophy size={32} color="#FFFFFF" />
                      </div>
                    </div>

                    {/* Content Box with Gap (md:pr-16/pl-16) */}
                    <div className={`w-full md:w-1/2 ${isLeft ? "md:pr-16 md:text-left md:ml-0" : "md:pl-16 md:ml-auto"}`}>
                      <motion.div
                        initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: idx * 0.1, ease: "easeOut" }}
                        className="w-full bg-white border border-[#E5E7EB] rounded-[20px] p-5 md:p-6 transition-shadow"
                      >
                        <div
                          className="inline-flex items-center justify-center mb-4"
                          style={{
                            padding: "6px 16px",
                            borderRadius: "9999px",
                            background: "linear-gradient(90deg, #0D4A7A 0%, #1888E0 100%)",
                            color: "#FFFFFF",
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontWeight: 500,
                            fontSize: "14px",
                            letterSpacing: "1.2px",
                          }}
                        >
                          {item.category}
                        </div>
                        <h3
                          className="text-[18px] md:text-[20px] font-medium mb-3"
                          style={{
                            fontFamily: "'DM Sans', sans-serif",
                            color: "#111827",
                            lineHeight: "1.2",
                          }}
                        >
                          {item.title} ({item.year})
                        </h3>

                        <p
                          className="text-[14px] md:text-[15px] leading-[1.6]"
                          style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: 400,
                            color: "#4B5563",
                          }}
                        >
                          {item.desc}
                        </p>
                      </motion.div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Founding Vision */}
      <div className="w-full flex justify-center bg-[#F3F4EE] py-12 sm:py-16 md:py-20 overflow-hidden">
        <div className="w-full px-6 md:px-12 lg:px-[150px] flex flex-col lg:flex-row gap-8 lg:gap-20 items-start">
          <motion.div
            initial={{ opacity: 0, x: -80 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative shrink-0 w-full lg:w-[435px]"
            style={{ height: "clamp(300px, 40vw, 525px)" }}
          >
            <div
              className="absolute inset-0"
              style={{
                borderRadius: "20px",
                backgroundImage: 'url("/assets/aboutImage1.jpg")',
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: -30 }}
              whileInView={{ opacity: 1, scale: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="absolute hidden sm:block"
              style={{
                width: "clamp(160px, 22vw, 285px)",
                height: "clamp(110px, 15vw, 202px)",
                bottom: "-24px",
                right: "-24px",
                borderTopLeftRadius: "20px",
                borderBottomRightRadius: "20px",
                border: "8px solid #F3F4EE",
                backgroundImage: 'url("/assets/aboutImage2.jpg")',
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 80 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col flex-1"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              className="inline-flex  mb-5"
              style={{
                width: "max-content",
                padding: "6px 16px",
                borderRadius: "9999px",
                background: "linear-gradient(90deg, #0D4A7A 0%, #1888E0 100%)",
                color: "#FFFFFF",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 600,
                fontSize: "20px",
                letterSpacing: "1.2px",
              }}
            >
              The founding vision
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
              className="text-[22px] sm:text-[28px] md:text-[32px] lg:text-[35px] font-medium mb-5"
              style={{ fontFamily: "'Outfit', sans-serif", color: "#0D4A7A", lineHeight: "1.2" }}
            >
              Built on a belief that no one should struggle alone
            </motion.h2>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.6 } },
              }}
              className="text-[15px] sm:text-[17px] md:text-[20px] leading-relaxed max-w-[850px]"
              style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, color: "#000000" }}
            >
              {[
                "The late President of the Ramakrishna Mission, Swami Jayadevananda, had always felt a deep calling to provide meaningful support to children, youth, and their families in Singapore. He believed — with unwavering conviction — that timely guidance and compassionate intervention could change the entire trajectory of a young person's life.",
                "His vision was simple but profound: a safe, accessible, and non-judgmental space where anyone facing emotional, psychological, or social challenges could find professional support and grow into their full potential.",
                "Thirty years on, that founding spirit remains the heartbeat of everything WINGS does — from our front-line counsellors to our school programmes to our community workshops."
              ].map((text, i) => (
                <motion.p
                  key={i}
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } } }}
                  className={i < 2 ? "mb-5" : ""}
                >
                  {text}
                </motion.p>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Who We Serve */}
      <div className="w-full flex justify-center bg-[#0D4A7A] py-12 sm:py-16 md:py-20 overflow-hidden">
        <div className="w-full px-6 md:px-12 lg:px-[150px] flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex items-center justify-center mb-4 sm:mb-5"
            style={{
              width: "max-content",
              padding: "6px 16px",
              borderRadius: "9999px",
              border: "1px solid #FFFFFF",
              color: "#FFFFFF",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 600,
              fontSize: "20px",
              letterSpacing: "1.2px",
            }}
          >
            Who we serve
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="text-[22px] sm:text-[28px] md:text-[32px] lg:text-[35px] font-medium mb-4 text-white"
            style={{ fontFamily: "'Outfit', sans-serif", lineHeight: "1.2", maxWidth: "600px" }}
          >
            Counselling for every stage of life
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
            className="text-[14px] sm:text-[16px] md:text-[20px] lg:text-[20px] leading-relaxed text-white mb-8 sm:mb-10"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, maxWidth: "900px" }}
          >
            WINGS serves the full spectrum of life — from toddlers navigating their first classroom<br />
            to adults managing marriage, grief, or career stress.
          </motion.p>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.25, delayChildren: 0.5 } },
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
          >
            {[
              {
                age: "2.5 – 7 yrs", label: "Pre-schoolers",
                desc: "Singapore's first preventive intervention for early childhood — helping young ones transition to structured learning with confidence and emotional readiness.",
                tags: ["Play Therapy", "Sand-Tray", "Expressive Arts", "PSSP"]
              },
              {
                age: "7 – 20 yrs", label: "Children, Teens & Youth",
                desc: "Support for primary, secondary, JC, and polytechnic students facing social, emotional, family-related, or absenteeism challenges — in school or at the centre.",
                tags: ["School Counselling", "CBT", "Family Sessions", "FSCP"]
              },
              {
                age: "21 – 65 yrs", label: "Adults, Couples & Families",
                desc: "For individuals, couples, and families navigating personal, marital, or relational challenges — seeking professional support to improve the quality of their lives.",
                tags: ["Individual Therapy", "Couples Counselling", "Grief Support", "Family Therapy"]
              }
            ].map((card, i) => (
              <motion.div
                key={i}
                variants={{ hidden: { opacity: 0, y: 50, scale: 0.9 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: "easeOut" } } }}
                className="flex flex-col p-5 sm:p-6"
                style={{
                  borderRadius: "10px",
                  backgroundColor: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  minHeight: "240px",
                }}
              >
                <h3 className="text-[24px] sm:text-[26px] md:text-[30px] font-bold text-white mb-2"
                  style={{ fontFamily: "'Outfit', sans-serif" }}>
                  {card.age}
                </h3>
                <h4 className="text-[16px] sm:text-[18px] font-medium text-white mb-3"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {card.label}
                </h4>
                <p className="text-[13px] sm:text-[14px] md:text-[15px] text-white leading-relaxed mb-5 flex-1"
                  style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, opacity: 0.9 }}>
                  {card.desc}
                </p>
                <div className="flex flex-wrap gap-2 mt-auto">
                  {card.tags.map((tag, idx) => (
                    <span key={idx} className="flex items-center justify-center"
                      style={{ padding: "4px 12px", borderRadius: "9999px", border: "1px solid rgba(255,255,255,0.6)", color: "#FFFFFF", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, fontSize: "12px" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

     {/* Our Impact */}
   <div className="w-full flex justify-center bg-[#F9FAFB] relative pt-12 sm:pt-16 md:pt-[80px] pb-8 sm:pb-10 md:pb-16 overflow-hidden">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-[150px] flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    style={{
                        display: "inline-flex",
                        padding: "8px 20px",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "9999px",
                        background: "linear-gradient(90deg,#0D4A7A,#42A0BD)",
                        color: "#FFF",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: "20px",
                        fontWeight: "600",
                        letterSpacing: "1.2px",
                        marginBottom: "24px",
                        minWidth: "180px",
                        height: "42px"
                    }}
          >
            Our impact
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
            className="text-[22px] sm:text-[28px] md:text-[32px] lg:text-[35px] font-medium text-center mb-5"
            style={{ fontFamily: "'Outfit', sans-serif", lineHeight: "1.4", color: "#0D4A7A", maxWidth: "600px" }}
          >
            A community built on trust and results
          </motion.h2>

          <p
            className="text-[16px] sm:text-[18px] md:text-[20px] leading-[1.7] font-medium text-center mb-12"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              color: "#000000",
              maxWidth: "968px",
            }}
          >
            Over three decades, WINGS has become one of Singapore's most trusted
            Voluntary Welfare Organisations — delivering meaningful change not just
            in counselling rooms, but in homes, schools, and communities across the
            island.
          </p>

          <div className="w-full flex flex-col lg:flex-row justify-between items-center gap-6 lg:gap-12 mb-6 sm:mb-8 md:mb-12">
            <div className="flex flex-col gap-6 sm:gap-8 flex-1">
              {[
                "Served 15 primary and secondary schools across Singapore from 1995 to 2011 under the School Social Work initiative.",
                "Pioneered Singapore's first preventive intervention programme for pre-schoolers aged 2.5 to 7 years.",
                "Fully funded by the National Council of Social Service (NCSS), recognised for sustained community impact.",
                "Provided counselling and family support to clients aged 2.5 to 65 years, across all major life challenges.",
                "Active collaborator with MOE, MSF, NCSS, and community organisations island-wide.",
              ].map((text, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -60 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.9, delay: 0.6 + (index * 0.15), ease: [0.25, 0.1, 0.25, 1] }}
                  className="flex items-start gap-4"
                >
                  <div className="flex-shrink-0 flex items-center justify-center rounded-full"
                    style={{ width: "36px", height: "36px", background: "#8EC9F0" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13L9 17L19 7" stroke="#0D4A7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-[14px] sm:text-[16px] md:text-[18px] lg:text-[20px] leading-relaxed"
                    style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, color: "#000000" }}>
                    {text}
                  </p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 1.2, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              className="relative shrink-0 w-full lg:w-[430px]"
              style={{ height: "clamp(320px, 40vw, 582px)" }}
            >
              <img src="/assets/ourImpactImage.jpg" alt="Our Impact"
                className="w-full h-full object-cover" style={{ borderRadius: "40px" }} />
              {[
                { label: "30+", sub: "Years active", top: "11%", left: "-5%" },
                { label: "MSF", sub: "Accredited", top: "35%", right: "-5%" },
                { label: "15+", sub: "Schools served", bottom: "28%", left: "-5%" },
                { label: "NCSS", sub: "Funded agency", bottom: "7%", right: "-5%" },
              ].map((stat, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, scale: 0.7 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.9 + i * 0.2, ease: "backOut" }}
                  className="absolute bg-white flex flex-col justify-center items-center"
                  style={{
                    width: "clamp(90px,10vw,137px)",
                    height: "clamp(60px,7vw,93px)",
                    borderRadius: "10px",
                    border: "1px solid #E5E7EB",
                    top: stat.top, left: stat.left, right: stat.right, bottom: stat.bottom,
                  }}>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "clamp(18px,2.5vw,28px)", color: "#0D4A7A", marginBottom: "2px" }}>{stat.label}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: "clamp(10px,1.2vw,13px)", color: "#4B5563" }}>{stat.sub}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>


      {/* Navigation Support Section - Exact Design Specifications */}
     <section className="w-full flex justify-center bg-[#F9FAFB] pt-0 pb-4 md:pb-6 lg:pb-12 -mt-8 md:-mt-12 px-[clamp(16px,4vw,150px)]">

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full flex flex-col items-center justify-center relative overflow-hidden py-8 sm:py-10 md:py-12 lg:py-14 min-h-[260px] md:min-h-[300px] text-white rounded-[20px]"
          style={{
            backgroundImage: `linear-gradient(0deg, #00000094, #00000094), url('/assets/aboutusnavigate.jpg')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Title */}
          <h2
            className="font-medium text-center max-w-[90%] md:max-w-[823px] text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-tight md:leading-[100%] px-4"
            style={{ fontFamily: "'Outfit', sans-serif", color: "#FFFFFF" }}
          >
            You don't have to navigate this alone.
          </h2>

          {/* Description */}
          <p
            className="font-medium text-center mt-6 md:mt-[35px] max-w-[90%] md:max-w-[940px] text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed md:leading-[34px] px-4"
            style={{ fontFamily: "'DM Sans', sans-serif", color: "#FFFFFF" }}
          >
            Whether you're seeking support for yourself, your child, or your family —
            our compassionate, accredited counsellors are here. Reach out today;
            your first conversation is always confidential.
          </p>

          {/* Buttons - Side by side on ALL devices including mobile */}
          <div className="flex flex-row justify-center gap-3 sm:gap-4 md:gap-5 items-center mt-8 md:mt-[45px] px-4 w-full sm:w-auto">

            {/* Book Button */}
           <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openModal()}
              className="flex items-center justify-center cursor-pointer px-4 sm:px-6 md:px-8 py-3 md:py-4 gap-2 rounded-full bg-[#1B4585] text-white font-semibold text-sm sm:text-base md:text-lg transition-all whitespace-nowrap"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", minWidth: "140px" }}
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

         {/* Meet Team Button */}
          <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/team")}
              className="flex items-center justify-center cursor-pointer px-4 sm:px-6 md:px-8 py-3 md:py-4 rounded-full bg-transparent text-white border border-white font-semibold text-sm sm:text-base md:text-lg transition-all whitespace-nowrap"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", minWidth: "140px" }}
            >
              Meet our team
            </motion.button>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}