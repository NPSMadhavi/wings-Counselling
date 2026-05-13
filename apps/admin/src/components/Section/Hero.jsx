import { motion, AnimatePresence, useScroll, useTransform, useInView } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useAppointment } from "@/context/AppointmentContext";

// Hero content items that will rotate
const heroItems = [
  {
    id: 1,
    badge: "A SAFE SPACE FOR YOU",
    headline: "Feeling Overwhelmed ?",
    description: "At Wings, we believe in a sanctuary for the mind. Our non clinical, empathetic approach helps you navigate life's complexities with professional guidance",
    highlightText: "You're not alone.",
    highlightColor: "#42A0BD",
    buttonText: "Book an appointment",
    buttonLink: "#contact",
    secondaryButtonText: "Learn Our Approach",
    secondaryButtonLink: "#about"
  },
  {
    id: 2,
    badge: "PROFESSIONAL SUPPORT",
    headline: "Find the path that feels right for you.",
    description: "We offer specialized counselling for every stage of life. Explore our therapeutic services designed to bring clarity and peace to your unique journey.",
    highlightText: "",
    buttonText: "Book an appointment",
    buttonLink: "#contact",
    secondaryButtonText: "Learn Our Approach",
    secondaryButtonLink: "#about"
  },
];

// Staggered animation variants for bottom to top animation
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.4,
      delayChildren: 0.2
    }
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.1,
      staggerDirection: -1
    }
  }
};

// Bottom to top animation for each item
const itemVariants = {
  hidden: {
    opacity: 0,
    y: 60
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 250,
      damping: 25,
      duration: 0.7
    }
  },
  exit: {
    opacity: 0,
    y: -30,
    transition: {
      duration: 0.3
    }
  }
};

// Bottom to top animation for buttons
const buttonVariants = {
  hidden: {
    opacity: 0,
    y: 60
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 250,
      damping: 25,
      duration: 0.7,
      delay: 0.8
    }
  },
  exit: {
    opacity: 0,
    y: -30,
    transition: {
      duration: 0.3
    }
  }
};

// Arrow icon component for button hover effect
const ArrowIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ marginLeft: "8px" }}
  >
    <path
      d="M5 12H19M19 12L13 6M19 12L13 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function Hero() {
  const { openModal } = useAppointment();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const isInView = useInView(containerRef, { amount: 0.1 });

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Slower video scale and opacity transitions
  const videoScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.02]);
  const videoOpacity = useTransform(scrollYProgress, [0, 1], [0.7, 0.3]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    if (videoRef.current) {
      if (isInView) {
        videoRef.current.play().catch(() => { });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isInView]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % heroItems.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const currentItem = heroItems[currentIndex];

  return (
    <section
      id="home"
      ref={containerRef}
      className="relative h-screen min-h-[600px] flex items-center overflow-hidden"
      style={{ width: "100%" }}
    >
      {/* Background Video with Slower Zoom/Fade Parallax */}
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
          style={{ objectPosition: "center" }}
        >
          <source src="/assets/WingsVideo.mp4" type="video/mp4" />
        </video>
      </motion.div>

      {/* Dark Overlay for Text Clarity - Reduced opacity */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, rgba(7, 7, 7, 0.35) 0%, rgba(0, 0, 0, 0.55) 75.96%)"
        }}
      />

      {/* Content Container - Centered content */}
      <motion.div
        className="relative z-10 w-full mx-auto px-6 sm:px-10 md:px-[80px] lg:px-[120px] xl:px-[200px]"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <div className="max-w-[900px] mx-auto text-center w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentItem.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {/* Badge */}
                <motion.div variants={itemVariants}>
                  <div
                    style={{
                      display: "inline-flex",
                      borderRadius: "9999px",
                      background: "rgba(255, 255, 255, 0.1)",
                      backdropFilter: "blur(4px)",
                      color: "#FFF",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontWeight: "700",
                      letterSpacing: "1.2px",
                      textTransform: "uppercase",
                    }}
                    className="text-[11px] sm:text-[12px] md:text-[13px] px-4 sm:px-5 py-1.5 sm:py-2 mb-5 sm:mb-6 md:mb-8"
                  >
                    {currentItem.badge}
                  </div>
                </motion.div>

                {/* Headline */}
                <motion.div variants={itemVariants}>
                  <h1
                    className="text-[32px] sm:text-[42px] md:text-[52px] lg:text-[62px] xl:text-[72px] font-semibold mb-4 sm:mb-5 md:mb-6"
                    style={{
                      color: "#FFF",
                      fontFamily: "Outfit, sans-serif",
                      lineHeight: "1.2",
                    }}
                  >
                    {currentItem.headline}
                    {currentItem.highlightText && (
                      <>
                        <br />
                        <span style={{ color: currentItem.highlightColor || "#42A0BD" }}>
                          {currentItem.highlightText}
                        </span>
                      </>
                    )}
                  </h1>
                </motion.div>

                {/* Description - Exactly 2 lines with line clamp */}
                <motion.div variants={itemVariants}>
                  <p
                    className="text-[16px] sm:text-[18px] md:text-[20px] lg:text-[22px] max-w-[795px] mx-auto mb-8 sm:mb-10 md:mb-12 lg:mb-14 line-clamp-2"
                    style={{
                      color: "#FFF",
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: "400",
                      lineHeight: "1.5",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}
                  >
                    {currentItem.description}
                  </p>
                </motion.div>

                {/* Buttons */}
                <motion.div
                  variants={buttonVariants}
                  className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-5 justify-center"
                >
                  {/* Primary Button with HOVER Animation */}
                  <motion.button
                    onClick={(e) => {
                      e.preventDefault();
                      openModal();
                    }}
                    onHoverStart={() => setIsHovering(true)}
                    onHoverEnd={() => setIsHovering(false)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      display: "inline-flex",
                      justifyContent: "center",
                      alignItems: "center",
                      borderRadius: "9999px",
                      background: "#1B4585",
                      color: "#F5F9FF",
                      textDecoration: "none",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontWeight: "600",
                      boxShadow: "0 4px 14px rgba(27, 69, 133, 0.3)",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      cursor: "pointer"
                    }}
                    className="text-[14px] sm:text-[16px] md:text-[18px] px-5 sm:px-6 md:px-8 py-3 sm:py-4"
                  >
                    <span>{currentItem.buttonText}</span>
                    <AnimatePresence mode="wait">
                      {isHovering && (
                        <motion.span
                          key="arrow"
                          initial={{ opacity: 0, x: -10, width: 0 }}
                          animate={{ opacity: 1, x: 0, width: "auto" }}
                          exit={{ opacity: 0, x: -10, width: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            overflow: "hidden"
                          }}
                        >
                          <ArrowIcon />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  {/* Secondary Button */}
                  <motion.a
                    href={currentItem.secondaryButtonLink}
                    whileHover={{ scale: 1.05, background: "rgba(255, 255, 255, 0.15)" }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      display: "inline-flex",
                      justifyContent: "center",
                      alignItems: "center",
                      borderRadius: "9999px",
                      border: "2px solid #FFF",
                      color: "#FFF",
                      textDecoration: "none",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontWeight: "600",
                      transition: "background 0.3s ease, border-color 0.3s ease",
                      background: "transparent",
                      cursor: "pointer"
                    }}
                    className="text-[14px] sm:text-[16px] md:text-[18px] px-5 sm:px-6 md:px-8 py-3 sm:py-4"
                  >
                    {currentItem.secondaryButtonText}
                  </motion.a>
                </motion.div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </section>
  );
}