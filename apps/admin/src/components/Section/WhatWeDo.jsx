import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { SUPPORT_TOPICS, getSupportTopicPath } from "@/lib/supportTopicsConfig";

export function WhatWeDo() {
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
      onClick={() => setLocation(getSupportTopicPath(service.slug))}
      className="
        group
        flex items-center justify-center
        min-w-0
        px-2.5 py-3 sm:px-4 md:px-6 md:py-4
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
          min-w-0
          text-[12px] sm:text-[14px] md:text-[16px]
          font-medium
          text-[#25528A]
          group-hover:text-white
          text-center
          leading-tight
          whitespace-normal
          md:whitespace-nowrap
        "
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {service.label}
      </h3>

      <ChevronRight
        size={18}
        className="
          shrink-0
          ml-1 sm:ml-2
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
      className="relative w-full pt-[60px]  pb-[60px] overflow-hidden bg-[#F9F9F9] flex justify-center"
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


          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="
              text-[clamp(22px,4.8vw,28px)]
              md:text-[35px]
              text-center
              mb-4
              font-['Outfit']
              font-medium
              leading-[1.2]
              "
            style={{ color: "#0D4A7A" }}
          >
            Find the help you need today
          </motion.h2>

          <p
            className="
              text-black
              text-center
              font-['DM_Sans']
              text-[16px] md:text-[18px] lg:text-[20px] 
              font-normal
              max-w-[700px]
              mx-auto
              leading-[1.5]
              line-clamp-2
              md:line-clamp-none
            "
          >
            Pick a topic below that you’d like to explore
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
            gap-x-2 gap-y-3 sm:gap-3 md:gap-4
          "
        >
          {SUPPORT_TOPICS.map((service, index) =>
            renderServiceCard(service, index)
          )}
        </div>

        </div>
      </div>
    </motion.section>
  );
}