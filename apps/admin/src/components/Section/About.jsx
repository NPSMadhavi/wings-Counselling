import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Smile } from "lucide-react";
import { useLocation } from "wouter";


// Animation variants for sequential core values - SLOW from RIGHT
const valueContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.8, // 0.8 seconds delay between each value - SLOW
      delayChildren: 0.3
    }
  }
};

function ArrowIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M4 12L20 12M20 12L14 18M20 12L14 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const valueItemVariants = {
  hidden: {
    opacity: 0,
    x: 100 // Coming from RIGHT side (positive x value)
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 150, // Reduced for slower movement
      damping: 25,
      duration: 0.8 // Slower duration
    }
  }
};

export function About() {
  const [, navigate] = useLocation();
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "8%"]);

  return (
    <motion.section
      id="about"
      ref={sectionRef}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 1 }}
      className="relative overflow-hidden flex flex-col items-center py-12 md:py-20 lg:py-[100px]"
      style={{
        background: "#E8F4FD",
        width: "100%"
      }}
    >
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{ y: bgY }}
      />

      {/* Main container with EXACT 150px padding on both sides on desktop, responsive on mobile */}
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-[150px] mx-auto">
        {/* Upper Section: Text Left, Images Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-16 lg:mb-[150px]">
          {/* Left Column: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-start"
          >
            <div
              style={{
                display: "inline-flex",
                padding: "6px 16px",
                borderRadius: "9999px",
                background: "linear-gradient(90deg, #0D4A7A 0%, #1888E0 100%)",
                color: "#FFF",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: "12px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "24px"
              }}
            >
              ABOUT US
            </div>

            <h2
              className="text-[28px] md:text-[38px] leading-[1.2] mb-8"
              style={{
                maxWidth: "520px",
                color: "#000",
                fontFamily: "Outfit, sans-serif",
                fontWeight: "600",
              }}
            >
              A sanctuary for healing in the heart of Singapore
            </h2>

            <div
              className="text-[16px] md:text-[18px] leading-[1.6] mb-10"
              style={{
                maxWidth: "565px",
                color: "#000",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: "400",
              }}
            >
              <p className="mb-6">
                WINGS Counselling Centre was founded with a simple yet powerful mission: to provide accessible, compassionate mental health support to the Singapore community.
              </p>
              <p className="mb-6">
                Since 2008, we've been a safe haven for individuals, couples, and families navigating life's most challenging moments. Our name represents our purpose—to help you build the strength and resilience needed to soar above difficulties.
              </p>
              <p>
                With over 15 years of combined experience and a team of certified, registered counsellors, we offer evidence-based therapy tailored to your unique journey.
              </p>
            </div>

            <a
              href="/about-us"
              onClick={(e) => {
                e.preventDefault();
                navigate("/about-us");
              }}
              className="px-8 py-3 text-[16px] font-semibold transition-all hover:scale-105"
              style={{
                display: "inline-flex",
                borderRadius: "9999px",
                background: "#1B4585",
                color: "#FFF",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                textDecoration: "none",
                gap: "10px"
              }}
            >
              More About Us
              <ArrowIcon />
            </a>
          </motion.div>

          {/* Right Column: Overlapping Images */}
          <div className="relative h-[450px] sm:h-[550px] lg:h-[560px] w-full mt-12 lg:mt-0">
            {/* Main Vertical Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="absolute top-0 right-0 w-[75%] lg:w-[400px] h-[75%] lg:h-[450px] rounded-[24px] shadow-lg z-0"
              style={{
                backgroundImage: "url('/assets/aboutImage1.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            {/* Overlapping Image - WITH BORDER MATCHING BACKGROUND COLOR #E8F4FD */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="absolute bottom-0 left-[-10px] lg:left-[-20px] w-[85%] lg:w-[480px] h-[55%] lg:h-[320px] rounded-[24px] shadow-2xl z-10"
              style={{
                backgroundImage: "url('/assets/aboutImage2.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                border: "10px solid #E8F4FD"
              }}
            />
          </div>
        </div>

        {/* Lower Section: Image Left, Core Values Right - WITH SPACING */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
          {/* Left Column: Image */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-[435px] h-[400px] sm:h-[500px] lg:h-[589px] rounded-[20px] shadow-xl flex-shrink-0"
            style={{
              backgroundImage: "url('/assets/aboutImage3.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />

          {/* Right Column: Core Values with Sequential Animation - WITH LEFT PADDING FOR SPACING */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col flex-grow lg:pl-8 w-full"
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-[28px] md:text-[35px] mb-10 lg:mb-[48px]"
              style={{
                color: "#000",
                fontFamily: "Outfit, sans-serif",
                fontWeight: "500",
                lineHeight: "normal",
              }}
            >
              Our Core Values
            </motion.h2>

            {/* Values Container with sequential animation */}
            <motion.div
              variants={valueContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="space-y-8 lg:space-y-10"
            >
              {/* Value 1 - Circle background #0D4A7A */}
              <motion.div
                variants={valueItemVariants}
                className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center"
              >
                <div
                  style={{
                    width: "70px",
                    height: "70px",
                    borderRadius: "20px",
                    background: "#0D4A7A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <Smile size={35} color="#FFFFFF" />
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl md:text-[25px] font-semibold mb-2" style={{ color: "#000", fontFamily: "'DM Sans', sans-serif" }}>
                    Compassion First
                  </h3>
                  <p className="text-lg md:text-[22px]" style={{
                    color: "#000",
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: "400",
                  }}>
                    Every session is rooted in empathy and non-judgment
                  </p>
                </div>
              </motion.div>

              {/* Value 2 - Circle background #0D4A7A with white filter */}
              <motion.div
                variants={valueItemVariants}
                className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center"
              >
                <div
                  style={{
                    width: "70px",
                    height: "70px",
                    borderRadius: "20px",
                    background: "#0D4A7A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <img
                    src="/assets/mingcute_safe-lock-line.svg"
                    alt="Lock"
                    style={{
                      width: "35px",
                      height: "35px",
                      filter: "brightness(0) invert(1)"
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-xl md:text-[25px] font-semibold mb-2" style={{ color: "#000", fontFamily: "'DM Sans', sans-serif" }}>
                    Confidential & safe
                  </h3>
                  <p className="text-lg md:text-[22px]" style={{ color: "#000", fontFamily: "'DM Sans', sans-serif", fontWeight: "400" }}>
                    Everything you share stays within our secure, judgement-free environment.
                  </p>
                </div>
              </motion.div>

              {/* Value 3 - Circle background #0D4A7A with white filter */}
              <motion.div
                variants={valueItemVariants}
                className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center"
              >
                <div
                  style={{
                    width: "70px",
                    height: "70px",
                    borderRadius: "20px",
                    background: "#0D4A7A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <img
                    src="/assets/mdi_graph-line-variant.svg"
                    alt="Graph"
                    style={{
                      width: "35px",
                      height: "35px",
                      filter: "brightness(0) invert(1)"
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-xl md:text-[25px] font-semibold mb-2" style={{ color: "#000", fontFamily: "'DM Sans', sans-serif" }}>
                    Evidence-based methods
                  </h3>
                  <p className="text-lg md:text-[22px]" style={{ color: "#000", fontFamily: "'DM Sans', sans-serif", fontWeight: "400" }}>
                    CBT, play therapy, sand tray work, and systemic family approaches — grounded in research.
                  </p>
                </div>
              </motion.div>

              {/* Value 4 - Circle background #0D4A7A with white filter */}
              <motion.div
                variants={valueItemVariants}
                className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center"
              >
                <div
                  style={{
                    width: "70px",
                    height: "70px",
                    borderRadius: "20px",
                    background: "#0D4A7A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <img
                    src="/assets/mynaui_support.svg"
                    alt="Support"
                    style={{
                      width: "35px",
                      height: "35px",
                      filter: "brightness(0) invert(1)"
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-xl md:text-[25px] font-semibold mb-2" style={{ color: "#000", fontFamily: "'DM Sans', sans-serif" }}>
                    Holistic Support
                  </h3>
                  <p className="text-lg md:text-[22px]" style={{ color: "#000", fontFamily: "'DM Sans', sans-serif", fontWeight: "400" }}>
                    Addressing mind, emotions, and relationships
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}