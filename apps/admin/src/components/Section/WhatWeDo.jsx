import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ChevronRight } from "lucide-react";
import { useAppointment } from "@/context/AppointmentContext";
import { useLocation } from "wouter";

const services = [
  { id: 1, title: "Family conflicts" },
  { id: 2, title: "Lifestyle issues" },
  { id: 3, title: "Trauma & PTSD" },
  { id: 4, title: "Addiction" },
  { id: 5, title: "Grief & Loss" },
  { id: 6, title: "Stress / Anxiety" },
  { id: 7, title: "Relationship issues" },
  { id: 8, title: "Parenting challenges" },
  { id: 9, title: "Financial disputes" },
  { id: 10, title: "Burnout & Work stress" },
  { id: 11, title: "Self-Esteem & Identity" },
  { id: 12, title: "Feeling lonely" },
];

export function WhatWeDo() {
  const { openModal } = useAppointment();
  const [, setLocation] = useLocation();
  const sectionRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "8%"]);

  const renderServiceCard = (service, index) => (
    <motion.div
      key={service.id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: index * 0.02 }}
      whileHover={{ scale: 1.04 }}
      onClick={() => setLocation("/StressAnxiety")}
      className="
        group
        flex items-center justify-center
        px-4 py-3 md:px-6 md:py-4
        rounded-full
        border border-[#25528A]
        bg-white
        cursor-pointer
        transition-all duration-300
        hover:bg-[#1B4585]
        hover:shadow-md
        w-full
      "
    >
      <h3
        className="
          text-[13px] sm:text-[14px] md:text-[16px]
          font-medium
          text-[#25528A]
          group-hover:text-white
          whitespace-nowrap
        "
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {service.title}
      </h3>

      <ChevronRight
        size={18}
        className="
          ml-2
          text-[#25528A]
          group-hover:text-white
          transition-transform duration-300
          group-hover:translate-x-1
        "
      />
    </motion.div>
  );

  return (
    <motion.section
      ref={sectionRef}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7 }}
      className="relative w-full pt-[60px]  pb-[60px] overflow-hidden bg-[#F7F6F3] flex justify-center"
    >
      {/* Background */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{ y: bgY }}
      />

      {/* CONTAINER — aligned with Navbar */}
      <div className="relative w-full navbar-align-outer">
        <div className="navbar-align-inner flex flex-col items-center">

        {/* HEADER */}
        <div className="text-center mb-10 md:mb-14">
          <div
            className="
              inline-flex
              items-center
              justify-center
              px-5 py-2
              rounded-full
              text-white
              text-base md:text-[20px]
              font-medium
              bg-gradient-to-r from-[#0D4A7A] to-[#42A0BD]
              mb-6
            "
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            How can we help you
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="
              text-[28px]
              md:text-[35px]
              text-center
              mb-4
              font-['Outfit']
              font-medium
              "
            style={{ color: "#0D4A7A" }}
          >
            Find the help you need today
          </motion.h2>

          <p
            className="
              text-[14px] sm:text-[16px] md:text-[14px] lg:text-[20px]
              max-w-[650px]
              mx-auto
              text-[#111]
            "
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Pick a topic below that you’d like to explore:
          </p>
        </div>

        {/* ✅ RESPONSIVE GRID (2 per row on mobile) */}
        <div
          className="
            w-full
            grid
            grid-cols-2
            sm:grid-cols-2
            md:grid-cols-3
            lg:grid-cols-4
            gap-3 md:gap-4
          "
        >
          {services.map((service, index) =>
            renderServiceCard(service, index)
          )}
        </div>

        </div>
      </div>
    </motion.section>
  );
}