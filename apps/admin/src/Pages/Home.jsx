import { Hero } from "../components/Section/Hero";
import { WhatWeDo } from "../components/Section/WhatWeDo";
import { About } from "../components/Section/About";
import { Howtouse } from "../components/Section/Howtouse";
import { Services } from "../components/Section/Services";
import { OurTeam } from "../components/Section/OurTeam";
import { Needhelp } from "../components/Section/Needhelp";
import { Upcoming } from "../components/Section/Upcoming";
import { Footer } from "../components/Layout/Footer";
import { CursorGlow } from "../components/Layout/CursorGlow";
import { LogoIntro } from "../components/ui/LogoIntro";
import { useState, useEffect } from "react";
import { motion, useScroll, useSpring } from "framer-motion";

export default function Home() {
  // Skip intro if arriving via hash link (e.g., /#contact) or when
  // a navigation explicitly requested skipping the intro.
  const [showIntro, setShowIntro] = useState(() => {
    try {
      const hasHash = !!window.location.hash;
      const skipFlag = !!sessionStorage.getItem("skipLogoIntro");
      if (skipFlag) sessionStorage.removeItem("skipLogoIntro");
      return !(hasHash || skipFlag);
    } catch (err) {
      return !window.location.hash;
    }
  });

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <>
      {showIntro && <LogoIntro onComplete={() => setShowIntro(false)} />}

      {/* Ensure we scroll to any hash target (e.g., #contact) once intro is not shown */}
      {(!showIntro) && (() => {
        try {
          const hash = window.location.hash;
          if (hash) {
            const el = document.querySelector(hash);
            if (el) {
              // small timeout to let layout settle
              setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 50);
            } else {
              // try again shortly after in case element mounts late
              setTimeout(() => {
                const el2 = document.querySelector(hash);
                if (el2) el2.scrollIntoView({ behavior: 'smooth' });
              }, 300);
            }
          }
        } catch (err) {
          // ignore
        }
        return null;
      })()}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showIntro ? 0 : 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="min-h-screen bg-background font-sans selection:bg-primary/20 selection:text-primary"
      >
        {/* Scroll Progress Bar */}
        <motion.div
          className="fixed top-0 left-0 right-0 h-1 bg-primary z-[10001] origin-left"
          style={{ scaleX, backgroundColor: "#1B4585" }}
        />

        <CursorGlow />

        <div className="relative z-[2]">
          <main className="flex flex-col">
            <Hero />
            <WhatWeDo />
            <About />
            <Howtouse />
            <Services />
            <OurTeam />
            <Needhelp />
            <Upcoming />
            <Footer />
          </main>
        </div>
      </motion.div>
    </>
  );
}
