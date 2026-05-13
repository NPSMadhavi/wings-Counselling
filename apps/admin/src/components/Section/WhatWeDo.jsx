import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { useAppointment } from "@/context/AppointmentContext";
import { useLocation } from "wouter";

const services = [
  { id: 1, title: "Stress / Anxiety" },
  { id: 2, title: "Relationship issues" },
  { id: 3, title: "Parenting challenges" },
  { id: 4, title: "Sleep & Lifestyle Issues" },
  { id: 5, title: "Grief & Loss" },
  { id: 6, title: "Family Conflicts" },
  { id: 7, title: "Financial Disputes" },
  { id: 8, title: "Trauma & PTSD" },
  { id: 9, title: "Anger&Emotional Regulation" },
  { id: 10, title: "Burnout & Work Stress" },
  { id: 11, title: "Self-Esteem & Identity" },
  { id: 12, title: "Sleep & Lifestyle Issues" }
];

export function WhatWeDo() {
  const { openModal } = useAppointment();
  const [, setLocation] = useLocation();
  const sectionRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);

  return (
    <motion.section
      ref={sectionRef}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative py-12 md:py-20 flex flex-col items-center overflow-hidden"
      style={{ background: "#F7F6F3", width: "100%" }}
    >
      {/* Background motion */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{ y: bgY }}
      />

      {/* Main container with EXACT 150px padding on both sides on desktop, responsive on mobile */}
      <div className="w-full px-4 md:px-12 lg:px-[150px] flex flex-col items-center">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-10 md:mb-14 w-full">
          <div
            className="mb-6"
            style={{
              display: "inline-flex",
              padding: "8px 20px",
              borderRadius: "9999px",
              background: "linear-gradient(90deg, #0D4A7A 0%, #1888E0 100%)",
              color: "#FFF",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: "14px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            HOW CAN WE HELP YOU?
          </div>

          <h2
            className="text-[36px] md:text-[48px] leading-tight mb-4"
            style={{
              color: "#000",
              fontFamily: "Outfit, sans-serif",
              fontWeight: "600",
              maxWidth: "800px"
            }}
          >
            What are you going through right now?
          </h2>

          <p
            className="text-base md:text-[20px] leading-relaxed"
            style={{
              maxWidth: "650px",
              color: "#111",
              textAlign: "center",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: "400",
            }}
          >
            We provide a confidential, judgment-free space to explore your challenges and develop tools for lasting change.
          </p>
        </div>

        {/* Services Grid - Row 1 (5 items) */}
        <div className="flex flex-wrap justify-center gap-5 w-full mt-2">
          {/* First Row - 5 items */}
          <div className="flex flex-wrap justify-center gap-5 w-full mb-5">
            {services.slice(0, 5).map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.03 }}
                whileHover={{ scale: 1.03, boxShadow: "0 15px 35px -8px rgba(0,0,0,0.15)" }}
                onClick={() => setLocation("/services")}
                className="bg-white rounded-[16px] px-8 py-5 cursor-pointer border border-[#E2E8F0] hover:border-[#1888E0]/40 transition-all flex items-center justify-center"
                style={{
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  minWidth: "140px",
                  flex: "1 1 auto",
                  maxWidth: "280px"
                }}
              >
                <h3
                  className="text-[18px] md:text-[20px] font-semibold whitespace-nowrap"
                  style={{
                    color: "#000",
                    fontFamily: "'DM Sans', sans-serif",
                    lineHeight: "1.4"
                  }}
                >
                  {service.title}
                </h3>
              </motion.div>
            ))}
          </div>

          {/* Second Row - 4 items */}
          <div className="flex flex-wrap justify-center gap-5 w-full mb-5">
            {services.slice(5, 9).map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (index + 5) * 0.03 }}
                whileHover={{ scale: 1.03, boxShadow: "0 15px 35px -8px rgba(0,0,0,0.15)" }}
                onClick={() => setLocation("/services")}
                className="bg-white rounded-[16px] px-8 py-5 cursor-pointer border border-[#E2E8F0] hover:border-[#1888E0]/40 transition-all flex items-center justify-center"
                style={{
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  minWidth: "140px",
                  flex: "1 1 auto",
                  maxWidth: "280px"
                }}
              >
                <h3
                  className="text-[18px] md:text-[20px] font-semibold whitespace-nowrap"
                  style={{
                    color: "#000",
                    fontFamily: "'DM Sans', sans-serif",
                    lineHeight: "1.4"
                  }}
                >
                  {service.title}
                </h3>
              </motion.div>
            ))}
          </div>

          {/* Third Row - 3 items */}
          <div className="flex flex-wrap justify-center gap-5 w-full">
            {services.slice(9, 12).map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (index + 9) * 0.03 }}
                whileHover={{ scale: 1.03, boxShadow: "0 15px 35px -8px rgba(0,0,0,0.15)" }}
                className="bg-white rounded-[16px] px-8 py-5 cursor-pointer border border-[#E2E8F0] hover:border-[#1888E0]/40 transition-all flex items-center justify-center"
                style={{
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  minWidth: "140px",
                  flex: "1 1 auto",
                  maxWidth: "280px"
                }}
              >
                <h3
                  className="text-[18px] md:text-[20px] font-semibold whitespace-nowrap"
                  style={{
                    color: "#000",
                    fontFamily: "'DM Sans', sans-serif",
                    lineHeight: "1.4"
                  }}
                >
                  {service.title}
                </h3>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-5 sm:gap-8 mt-14 md:mt-16 w-full">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openModal()}
            className="group flex items-center justify-center gap-2 px-12 py-5 rounded-full"
            style={{
              background: "#25528A",
              color: "#FFF",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "18px",
              fontWeight: "600",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(37, 82, 138, 0.3)"
            }}
          >
            Find the right support →
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 px-12 py-5 rounded-full bg-transparent"
            style={{
              color: "#25528A",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "18px",
              fontWeight: "600",
              border: "2px solid #94A3B8",
              cursor: "pointer"
            }}
          >
            Learn More
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
}