import React from "react";
import { ArrowDown, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { FaInstagram, FaFacebookF, FaYoutube } from "react-icons/fa";
import { useAppointment } from "@/context/AppointmentContext";

const timelineData = [
  {
    year: "1995",
    category: "THE BEGINNING",
    title: "Ramakrishna Mission Counselling Centre Opens",
    desc: "With funding from the NCSS 25th Anniversary Endowment Fund, the Ramakrishna Mission launched a Pilot Project with three counsellors and one administrative assistant, operating from a single room in the Mission Library. Counsellors immediately began networking with neighbourhood schools to identify students who could benefit from professional support."
  },
  {
    year: "1996",
    category: "RECOGNITION",
    title: "NCSS Officially Recognises the Centre",
    desc: "The National Council of Social Service (NCSS) recognised the Centre's positive community impact and made it a fully funded agency for School Social Work (SSW) — cementing its role in Singapore's social welfare ecosystem."
  },
  {
    year: "1997",
    category: "GROWTH",
    title: "First Major Relocation — Sarada Hall",
    desc: "Growing client demand required a larger footprint. The Centre moved to Sarada Hall, gaining three counselling rooms, an admin office, and a conference space for case discussions and team meetings — marking the beginning of a true centre-based approach."
  },
  {
    year: "2002",
    category: "TRANSFORMATION",
    title: "Rebranded to WINGS — and a New Home",
    desc: "The Management Committee repositioned the centre as a secular community service provider, renaming it \"WINGS Counselling Centre\" — symbolising the capacity to rise and grow. Simultaneously, the Centre moved to a state-of-the-art facility featuring one-way mirror counselling rooms, play therapy suites, and art therapy observation spaces."
  },
  {
    year: "2004",
    category: "EXPANSION",
    title: "Family-Life Education Programme Launched",
    desc: "Recognising the power of working with entire family units, WINGS became a service provider for the School Family-life Education (SFE) programme under MCYS (now MSF). Skill-based parenting workshops were delivered to primary and secondary schools island-wide using a three-pronged approach: schools, homes, and community."
  },
  {
    year: "2009",
    category: "PIONEERING",
    title: "Singapore's First Pre-School Support Programme",
    desc: "In collaboration with NCSS, WINGS launched the groundbreaking Pre-School Support Programme (PSSP) — Singapore's first preventive intervention programme for children aged 2.5 to below 7 years. The programme helped pre-schoolers navigate the transition from home-based informal learning to structured school environments, ensuring every child could reach their full potential."
  },
  {
    year: "2012",
    category: "MILESTONE",
    title: "Family Support & Counselling Programme (FSCP)",
    desc: "WINGS repositioned as a fully centre-based counselling organisation, developing the internally researched Family Support and Counselling Programme (FSCP) — serving clients aged 7 to 65 with specialised, evidence-based therapeutic interventions across individual, couples, and family modalities."
  },
  {
    year: "Today",
    category: "PRESENT",
    title: "WINGS in Schools & Centre — Serving All of Singapore",
    desc: "WINGS now delivers counselling in Primary and Secondary schools island-wide, working alongside school leaders and counsellors to support students with family-related challenges. Our centre continues to serve clients from 2.5 to 65 years old, using expressive therapies — including sand-tray, play therapy, and symbol work — tailored to each individual's journey."
  }
];

export function Footer() {
  return (
    <footer className="w-full flex flex-col items-center pt-[60px] md:pt-[100px] pb-[40px] font-['DM_Sans']" style={{ backgroundColor: "#1F2937" }}>
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-[200px] flex flex-col items-center">

        {/* Main Content Grid */}
        <div className="flex flex-col lg:flex-row justify-between w-full mb-[60px] md:mb-[100px] gap-12 lg:gap-10">

          {/* Column 1: Logo and About Section */}
          <div className="flex flex-col gap-[25px] md:gap-[30px] w-full max-w-[350px]">
            <div
              className="w-[240px] md:w-[291px] h-auto rounded-[10px] bg-white flex items-center justify-center p-2"
              style={{ aspectRatio: "291/70" }}
            >
              <img
                src="/assets/wingsLogo.png"
                alt="WINGS Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-white font-['Plus_Jakarta_Sans'] text-[16px] md:text-[18px] font-[500] leading-[24px] md:leading-[28px]">
              We are committed to providing affordable & professional counselling services to the community, regardless of creed, race or religion. Supporting lives since 1995.
            </p>
            <div className="flex gap-[15px]">
              <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="relative w-[40px] h-[40px] flex items-center justify-center hover:opacity-80 transition-opacity">
                <svg className="absolute inset-0" width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="20" r="20" fill="#E8F4FD" fillOpacity="0.2" />
                </svg>
                <FaInstagram className="text-white relative z-10 w-[20px] h-[20px]" />
              </a>
              <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="relative w-[40px] h-[40px] flex items-center justify-center hover:opacity-80 transition-opacity">
                <svg className="absolute inset-0" width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="20" r="20" fill="#E8F4FD" fillOpacity="0.2" />
                </svg>
                <FaFacebookF className="text-white relative z-10 w-[18px] h-[18px]" />
              </a>
              <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" className="relative w-[40px] h-[40px] flex items-center justify-center hover:opacity-80 transition-opacity">
                <svg className="absolute inset-0" width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="20" r="20" fill="#E8F4FD" fillOpacity="0.2" />
                </svg>
                <FaYoutube className="text-white relative z-10 w-[20px] h-[20px]" />
              </a>
            </div>
          </div>

          {/* Column 2: Links Section */}
          <div className="flex flex-col gap-[20px] md:gap-[30px] min-w-[150px]">
            <h3 className="text-white font-['Outfit'] text-[22px] md:text-[25px] font-[500] leading-normal">Links</h3>
            <ul className="flex flex-col gap-[12px] md:gap-[15px] list-none p-0 m-0">
              {["Home", "about us", "services", "our team", "events", "contact us"].map((item) => (
                <li key={item}>
                  <a href={`/${item.replace(/\s/g, '').toLowerCase()}`} className="text-white font-['DM_Sans'] text-[16px] md:text-[18px] font-[400] leading-normal capitalize hover:opacity-80 transition-opacity">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Stay Connected */}
          <div className="flex flex-col gap-[15px] w-full max-w-[388px]">
            <h3 className="text-white font-['Outfit'] text-[25px] md:text-[30px] font-[500] leading-[100%] m-0">
              Stay Connected
            </h3>
            <p className="text-white font-['DM_Sans'] text-[16px] md:text-[18px] font-[400] leading-[1.4] m-0 mb-[10px]">
              We are committed to providing affordable & professional counselling services to the community
            </p>
            <form className="flex flex-col gap-[15px]" onSubmit={(e) => e.preventDefault()}>
              <input
                type="text"
                placeholder="Full name"
                className="w-full max-w-[354px] h-[50px] rounded-[10px] border border-white/50 bg-transparent px-[15px] text-white font-['DM_Sans'] text-[15px] outline-none placeholder:text-white/70 focus:border-white transition-colors box-border"
              />
              <div className="flex gap-[10px] w-full max-w-[354px]">
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full max-w-[294px] h-[50px] rounded-[10px] border border-white/50 bg-transparent px-[15px] text-white font-['DM_Sans'] text-[15px] outline-none placeholder:text-white/70 focus:border-white transition-colors box-border"
                />
                <button
                  type="submit"
                  className="w-[50px] h-[50px] rounded-[10px] bg-white flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#1B4585">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Separator */}
        <div className="w-full h-[1px] bg-[rgba(255,255,255,0.25)] mb-[30px]"></div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center w-full text-white font-['DM_Sans'] text-[14px] md:text-[15px] font-[400] leading-normal gap-4 text-center md:text-left">
          <p>© 2026 WINGS Counselling Centre. All rights reserved.</p>
          <div className="flex items-center gap-[20px] md:gap-[40px]">
            <a href="/privacy-policy" className="hover:opacity-80 transition-opacity">Privacy Policy</a>
            <span className="opacity-100">|</span>
            <a href="/terms-of-service" className="hover:opacity-80 transition-opacity">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function AboutUs() {
  const { openModal } = useAppointment();
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
            className="inline-flex items-center justify-center uppercase mb-6 sm:mb-8"
            style={{
              padding: "6px 16px",
              borderRadius: "9999px",
              border: "1px solid rgba(255,255,255,0.4)",
              backgroundColor: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(4px)",
              color: "#FFFFFF",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 600,
              fontSize: "12px",
              letterSpacing: "1.2px",
            }}
          >
            About Wings Counselling centre
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
            Explore Our Story
            <ArrowDown size={18} color="#F5F9FF" />
          </motion.button>
        </motion.div>
      </div>

      {/* Quote Section (Refined) */}
      <div
        className="w-full flex justify-center items-center relative overflow-hidden shrink-0 py-12 sm:py-16 md:py-20"
        style={{ background: "#E8F4FD" }}
      >
        <div className="w-full max-w-[1100px] relative flex flex-col items-center justify-center px-4 sm:px-12 md:px-16 py-8 md:py-12">
          <p className="text-center z-10 text-[18px] sm:text-[24px] md:text-[32px] lg:text-[38px] font-semibold mb-6 sm:mb-8"
            style={{ fontFamily: "'DM Sans', sans-serif", lineHeight: "1.4", color: "#1B4585", maxWidth: "1000px" }}
          >
            "Guidance and support provided at an early stage greatly enhances the ability of children and youth to cope — and to grow into well-adjusted, thriving adults."
          </p>
          <p className="text-center z-10 text-[16px] sm:text-[18px] md:text-[22px]"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, color: "#111827" }}
          >
            — Swami Jayadevananda, Founder's Vision, 1995
          </p>
        </div>
      </div>

      {/* Journey Section - TIMELINE WITH FIXED CENTER CIRCLE, BOXES APPEAR IN POSITION */}
      <div id="journey-section" className="w-full flex justify-center bg-[#FDFDFD] py-12 sm:py-16 md:py-[100px] overflow-hidden">
        <div className="w-full flex flex-col items-center">

          {/* Section Header */}
          <div className="flex flex-col items-center text-center mb-16 md:mb-[120px] px-4 sm:px-6 md:px-8 lg:px-[150px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center justify-center uppercase mb-6"
              style={{
                padding: "6px 16px",
                borderRadius: "9999px",
                background: "linear-gradient(90deg, #0D4A7A 0%, #1888E0 100%)",
                color: "#F7F6F3",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 600,
                fontSize: "12px",
                letterSpacing: "1.2px",
              }}
            >
              Our Journey
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
                          className="inline-flex items-center justify-center uppercase mb-4"
                          style={{
                            padding: "6px 16px",
                            borderRadius: "9999px",
                            background: "linear-gradient(90deg, #0D4A7A 0%, #1888E0 100%)",
                            color: "#FFFFFF",
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontWeight: 500,
                            fontSize: "10px",
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
        <div className="w-full px-6 md:px-12 lg:px-[150px] flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">
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
              className="inline-flex uppercase mb-5"
              style={{
                width: "max-content",
                padding: "6px 16px",
                borderRadius: "9999px",
                background: "linear-gradient(90deg, #0D4A7A 0%, #1888E0 100%)",
                color: "#FFFFFF",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 600,
                fontSize: "12px",
                letterSpacing: "1.2px",
              }}
            >
              The Founding Vision
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
              className="text-[22px] sm:text-[28px] md:text-[32px] lg:text-[35px] font-medium mb-5"
              style={{ fontFamily: "'Outfit', sans-serif", color: "#000000", lineHeight: "1.2" }}
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
              className="text-[15px] sm:text-[17px] md:text-[20px] leading-relaxed"
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
            className="flex items-center justify-center uppercase mb-4 sm:mb-5"
            style={{
              width: "max-content",
              padding: "6px 16px",
              borderRadius: "9999px",
              border: "1px solid #FFFFFF",
              color: "#FFFFFF",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 600,
              fontSize: "12px",
              letterSpacing: "1.2px",
            }}
          >
            Who We Serve
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
            className="text-[14px] sm:text-[16px] md:text-[18px] lg:text-[20px] leading-relaxed text-white mb-8 sm:mb-10"
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
                      style={{ padding: "4px 12px", borderRadius: "9999px", border: "1px solid rgba(255,255,255,0.6)", color: "#FFFFFF", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, fontSize: "10px" }}>
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
      <div className="w-full flex justify-center bg-[#F9FAFB] relative py-12 sm:py-16 md:py-[100px] overflow-hidden">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-[150px] flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="flex items-center justify-center uppercase mb-5"
            style={{
              padding: "6px 16px",
              borderRadius: "9999px",
              background: "linear-gradient(90deg, #0D4A7A 0%, #1888E0 100%)",
              color: "#FFFFFF",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 600,
              fontSize: "12px",
              letterSpacing: "1.2px",
            }}
          >
            OUR IMPACT
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
            className="text-[22px] sm:text-[28px] md:text-[32px] lg:text-[35px] font-medium text-center mb-5"
            style={{ fontFamily: "'Outfit', sans-serif", lineHeight: "1.4", color: "#000000", maxWidth: "600px" }}
          >
            A community built on trust and results
          </motion.h2>

          <div className="w-full flex flex-col lg:flex-row justify-between items-center gap-10 lg:gap-12 mb-12 sm:mb-16 md:mb-[100px]">
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
      <section className="w-full flex justify-center bg-[#F9FAFB] pb-24 md:pb-32">

        {/* 150px Left & Right Space */}
        <div className="w-full px-[150px]">

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full flex flex-col items-center justify-center relative overflow-hidden py-12 md:py-0 md:h-[362px] text-white"
            style={{
              borderRadius: "20px",
              backgroundImage: `linear-gradient(0deg, #00000094, #00000094), url('/assets/aboutusnavigate.jpg')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Title */}
            <h2
              className="font-medium text-center max-w-[823px] text-[28px] md:text-[50px] leading-[100%]"
              style={{
                fontFamily: "'Outfit', sans-serif",
                color: "#FFFFFF",
              }}
            >
              You don't have to navigate this alone.
            </h2>

            {/* Description */}
            <p
              className="font-medium text-center mt-[35px] max-w-[940px] text-[16px] md:text-[20px] leading-[28px] md:leading-[34px]"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                color: "#FFFFFF",
              }}
            >
              Whether you're seeking support for yourself, your child, or your family —
              our compassionate, accredited counsellors are here. Reach out today;
              your first conversation is always confidential.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-[20px] items-center mt-[45px]">

              {/* Book Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => openModal()}
                className="flex items-center justify-center cursor-pointer whitespace-nowrap"
                style={{
                  padding: "16px 32px",
                  borderRadius: "9999px",
                  background: "#1B4585",
                  color: "#FFFFFF",
                  border: "none",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: "18px",
                  height: "60px",
                  width: "193px",
                }}
              >
                Book a session
              </motion.button>

              {/* Meet Team Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center cursor-pointer whitespace-nowrap"
                style={{
                  padding: "16px 32px",
                  borderRadius: "9999px",
                  background: "transparent",
                  color: "#FFFFFF",
                  border: "1px solid #FFFFFF",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: "18px",
                  height: "60px",
                  width: "191px",
                }}
              >
                Meet our team
              </motion.button>

            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}