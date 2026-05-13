import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export const LogoIntro = ({ onComplete }) => {
  const [stage, setStage] = useState("center");

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setStage("moving");
    }, 2000);

    const timer2 = setTimeout(() => {
      setStage("completed");
      onComplete();
    }, 3200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  const getTargetDimensions = () => {
    if (typeof window === "undefined") return { width: 400, height: 95, x: 0, y: 0 };

    const width = window.innerWidth;
    const height = window.innerHeight;

    let logoWidth = 140;
    let outerPaddingX = 12;
    let outerPaddingY = 12;

    if (width >= 1280) {
      logoWidth = 300;
      outerPaddingX = 150;
      outerPaddingY = 20;
    } else if (width >= 1024) {
      logoWidth = 260;
      outerPaddingX = 64;
      outerPaddingY = 20;
    } else if (width >= 768) {
      logoWidth = 220;
      outerPaddingX = 40;
      outerPaddingY = 20;
    } else if (width >= 640) {
      logoWidth = 190;
      outerPaddingX = 24;
      outerPaddingY = 20;
    }

    const innerPaddingX = Math.max(16, Math.min(width * 0.03, 40));
    const navbarHeight = Math.max(60, Math.min(width * 0.1, 90));

    // Approximate aspect ratio from original design (193/46)
    const logoHeight = logoWidth / (193 / 46);

    const targetLeft = outerPaddingX + innerPaddingX;
    const targetTop = outerPaddingY + (navbarHeight - logoHeight) / 2;

    return {
      width: logoWidth,
      height: logoHeight,
      x: targetLeft - width / 2 + logoWidth / 2,
      y: targetTop - height / 2 + logoHeight / 2
    };
  };

  const target = getTargetDimensions();
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  return (
    <AnimatePresence>
      {stage !== "completed" && (
        <motion.div
          id="logo-intro"
          className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden pointer-events-none"
        >
          {/* Dynamic Background with Geometric Design */}
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: stage === "moving" ? 0 : 1 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            {/* Base Gradient */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, #FFFFFF 0%, #F5F9FF 50%, #FFFFFF 100%)",
              }}
            />

            {/* Animated Geometric Shapes - Top Left */}
            <motion.div
              initial={{ x: -200, y: -200, opacity: 0 }}
              animate={{ x: 0, y: 0, opacity: 0.15 }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
              className="absolute top-0 left-0 w-96 h-96"
              style={{
                background:
                  "linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)",
                borderRadius: "0 0 200px 0",
              }}
            />

            {/* Animated Geometric Shapes - Bottom Right */}
            <motion.div
              initial={{ x: 200, y: 200, opacity: 0 }}
              animate={{ x: 0, y: 0, opacity: 0.12 }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }}
              className="absolute bottom-0 right-0 w-80 h-80"
              style={{
                background:
                  "linear-gradient(135deg, #06B6D4 0%, #0E7490 100%)",
                borderRadius: "200px 0 0 0",
              }}
            />

            {/* Animated Circle - Center Right */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.08 }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
              className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full"
              style={{
                background: "radial-gradient(circle, #8B5CF6 0%, transparent 100%)",
              }}
            />

            {/* Grid Pattern Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.04 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(0deg, transparent 24%, rgba(59, 130, 246, 0.08) 25%, rgba(59, 130, 246, 0.08) 26%, transparent 27%, transparent 74%, rgba(59, 130, 246, 0.08) 75%, rgba(59, 130, 246, 0.08) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(59, 130, 246, 0.08) 25%, rgba(59, 130, 246, 0.08) 26%, transparent 27%, transparent 74%, rgba(59, 130, 246, 0.08) 75%, rgba(59, 130, 246, 0.08) 76%, transparent 77%, transparent)",
                backgroundSize: "50px 50px",
              }}
            />
          </motion.div>

          {/* Logo Only */}
          <motion.img
            src="/assets/wingsLogo.png"
            alt="Wings Logo"
            initial={{
              scale: 0.5,
              opacity: 0,
              width: isMobile ? 240 : 400,
              y: 40,
              x: 0,
            }}
            animate={
              stage === "center"
                ? {
                  scale: 1.2,
                  opacity: 1,
                  y: 0,
                  x: 0,
                  width: isMobile ? 240 : 400,
                }
                : {
                  scale: 1,
                  opacity: 1,
                  x: target.x,
                  y: target.y,
                  width: target.width,
                  height: target.height,
                }
            }
            transition={{
              duration: stage === "center" ? 1.5 : 1.2,
              ease: [0.43, 0.13, 0.23, 0.96],
              opacity: { duration: 0.5 },
            }}
            style={{
              objectFit: "contain",
              filter: "drop-shadow(0 20px 40px rgba(30, 64, 175, 0.12))",
              position: "relative",
              zIndex: 10001,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};