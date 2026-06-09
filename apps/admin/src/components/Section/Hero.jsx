import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useInView,
} from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useAppointment } from "@/context/AppointmentContext";
import { useLocation } from "wouter";

// Hero content items
const heroItems = [
  {
    id: 1,
    badge: "A Safe space for you",
    headline: "Feeling overwhelmed ?",
    description:
      "At Wings, we believe in a sanctuary for the mind. Our non clinical, empathetic approach helps you navigate life's complexities with professional guidance",
    highlightText: "You're not alone.",
    highlightColor: "#8EC9F0",
    buttonText: "Book an appointment",
    secondaryButtonText: "Learn our approach",
  },
  {
    id: 2,
    badge: "Professional support",
    headline: "Find the path that feels right for you.",
    description:
      "We offer specialized counselling for every stage of life. Explore our therapeutic services designed to bring clarity and peace to your unique journey.",
    buttonText: "Book an appointment",
    secondaryButtonText: "Learn our approach",
  },
];

// Animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.25,
      delayChildren: 0.15,
    },
  },
  exit: { opacity: 0 },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 220, damping: 22 },
  },
  exit: { opacity: 0, y: -20 },
};

const buttonVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 0.5 },
  },
};

const ArrowIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M9 18L15 12L9 6"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function Hero() {
  const { openModal } = useAppointment();
  const [, setLocation] = useLocation();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const containerRef = useRef(null);
  const videoRef = useRef(null);

  const isInView = useInView(containerRef, { amount: 0.2 });

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const videoScale = useTransform(scrollYProgress, [0, 1], [1.05, 1]);
  const videoOpacity = useTransform(scrollYProgress, [0, 1], [0.7, 0.3]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  // Video control
  useEffect(() => {
    if (!videoRef.current) return;

    videoRef.current.playbackRate = 0.6;

    if (isInView) {
      videoRef.current.play().catch(() => { });
    } else {
      videoRef.current.pause();
    }
  }, [isInView]);

  // Auto rotate content
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroItems.length);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const currentItem = heroItems[currentIndex];

  return (
    <section
      ref={containerRef}
      className="relative w-full min-h-screen flex items-center overflow-hidden"
    >
      {/* Background Video */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        style={{ scale: videoScale, opacity: videoOpacity }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/assets/WingsVideo.mp4" type="video/mp4" />
        </video>
      </motion.div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />

      {/* CONTENT CONTAINER (Amazon style) */}
      <motion.div
        className="relative z-10 w-full navbar-align-outer"
        style={{ y: contentY }}
      >
        <div className="navbar-align-inner text-center w-full flex flex-col items-center">
          {/* TEXT CONTENT */}
          <div className="w-full min-h-[342px] flex flex-col justify-center">

            <AnimatePresence mode="wait">
              <motion.div
                key={currentItem.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >

                  {/* BADGE */}
                  <motion.div variants={itemVariants}>
                    <div
                      className="
                        inline-flex 
                        items-center 
                        justify-center 
                        px-4 py-2 
                        rounded-full 
                        border border-white/70 
                        bg-white/20 
                        text-white 
                        backdrop-blur-md
                        mx-auto mb-6
                      "
                      style={{
                        fontSize: "clamp(14px, 1.2vw, 18px)",
                        width: "fit-content",
                        maxWidth: "90%",
                      }}
                    >
                      {currentItem.badge}
                    </div>
                  </motion.div>

                  {/* HEADING */}
                  <motion.div variants={itemVariants}>
                    <h1
                      className="font-semibold text-white leading-tight mb-5"
                      style={{
                        fontSize: "clamp(28px, 4vw, 64px)",
                        fontFamily: "Outfit, sans-serif",
                      }}
                    >
                      {currentItem.headline}

                      {currentItem.highlightText && (
                        <>
                          <br />
                          <span style={{ color: currentItem.highlightColor }}>
                            {currentItem.highlightText}
                          </span>
                        </>
                      )}
                    </h1>
                  </motion.div>

                  {/* DESCRIPTION */}
                  <motion.div variants={itemVariants}>
                    <p
                      className="
                        text-white/90 
                        max-w-2xl 
                        mx-auto
                      "
                      style={{
                        fontSize: "clamp(14px, 1.5vw, 20px)",
                        lineHeight: 1.6,
                      }}
                    >
                      {currentItem.description}
                    </p>
                  </motion.div>

                </motion.div>
              </motion.div>
            </AnimatePresence>

          </div>

          {/* STATIC BUTTONS */}
          <div
            className="
              mt-10
              flex 
              flex-col 
              sm:flex-row 
              flex-wrap 
              justify-center 
              items-center 
              gap-4 sm:gap-6
            "
          >

            {/* PRIMARY */}
            <button
              onClick={(e) => {
                e.preventDefault();
                openModal();
              }}
              className="
                flex items-center justify-center gap-2
                bg-[#1B4585] text-white
                px-8 py-4
                rounded-full
                w-full sm:w-auto
                min-w-[240px]
                shadow-lg
                transition-colors duration-300
                hover:scale-105
              
              "
              style={{
                fontSize: "clamp(14px, 1.2vw, 18px)",
              }}
            >
              <span>Book an appointment</span>

              <span className="flex items-center">
                <ArrowIcon />
              </span>
            </button>

            {/* SECONDARY */}
            <button
              onClick={() => setLocation("/about-us")}
              className="
                flex items-center justify-center
                border border-white/40 
                text-white 
                px-8 py-4 
                rounded-full 
                w-full sm:w-auto
                min-w-[240px]
                bg-white/5
                transition-colors duration-300
                hover:scale-105
                
              "
              style={{
                fontSize: "clamp(14px, 1.2vw, 18px)",
              }}
            >
              <span>Learn our approach</span>
            </button>

          </div>

        </div>
      </motion.div>
    </section>
  );
}