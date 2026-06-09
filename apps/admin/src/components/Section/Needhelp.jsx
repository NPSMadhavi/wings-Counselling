import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useAppointment } from "@/context/AppointmentContext";

const buttons = [
  {
    id: "book",
    label: "Book an appointment",
    href: "#contact",
    style: {
      background: "#FFF",
      border: "none",
      color: "#0D4A7A",
    },
  },
];

export function Needhelp() {
  const { openModal } = useAppointment();

  const sectionRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);

  const handleClick = (id, href) => {
    if (id === "book") {
      openModal();
      return;
    }

    if (href.startsWith("#")) {
      const el = document.querySelector(href);

      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <motion.section
      id="needhelp"
      ref={sectionRef}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 1 }}
      className="relative w-full flex flex-col items-center justify-center pt-[60px] pb-[60px] lg:pb-16 overflow-hidden"
    >
      <div className="w-full navbar-align-outer">
      <div className="navbar-align-inner">
      <div className="w-full flex flex-col items-center justify-center py-12 md:py-20 px-4 sm:px-6 rounded-[30px] relative overflow-hidden bg-[#0D4A7A]">
        
        <motion.div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{ y: bgY }}
        />

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-[28px] sm:text-[36px] md:text-[50px] text-center mb-4 text-white font-['Outfit'] font-medium leading-[1.1] max-w-[850px]"
        >
          Need help now? We're here for you
        </motion.h2>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-base md:text-[20px] text-center mb-10 text-white/90 font-['DM_Sans'] font-medium leading-[1.4] max-w-[600px]"
        >
          Reach out in the way that feels most comfortable
        </motion.p>

        {/* Buttons Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col sm:flex-row flex-wrap justify-center gap-5 w-full sm:w-auto"
        >
          {buttons.map((btn) => (
            <a
              key={btn.id}
              href={btn.id === "call" ? btn.href : undefined}
              onClick={(e) => {
                if (btn.id === "book") e.preventDefault();

                handleClick(btn.id, btn.href);
              }}
              className={`
                transition-all duration-300 hover:scale-105
                flex items-center justify-center gap-3
                px-8 h-[60px] min-w-[220px] w-full sm:w-auto
                rounded-full font-semibold text-[17px]
                font-['Plus_Jakarta_Sans'] no-underline cursor-pointer
                ${
                  btn.id === "call"
                    ? "bg-white text-[#0D4A7A] border-none"
                    : "bg-white text-[#0D4A7A] border border-white"
                }
              `}
            >
              {btn.icon}

              <span>{btn.label}</span>

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
            </a>
          ))}
        </motion.div>
      </div>
      </div>
      </div>
    </motion.section>
  );
}