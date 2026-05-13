import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/* ─── Service Data ─────────────────────────────────────────── */
const services = [
  {
    id: 1,
    title: "Personal Therapy",
    description:
      "One-on-one sessions tailored to your unique needs, using evidence-based approaches like CBT, EMDR, and mindfulness.",
    image: "/assets/aboutImage1.jpg",
  },
  {
    id: 2,
    title: "Supervision",
    description:
      "Interactive sessions focusing on stress management, communication skills, and building resilience for all age groups.",
    image: "/assets/supervisonImage.png",
  },
  {
    id: 3,
    title: "Family Support & Counseling",
    description:
      "Support for families navigating challenges such as conflict resolution, parenting strategies, and improving family dynamics.",
    image: "/assets/FamilySupport.png",
  },
  {
    id: 4,
    title: "Couples Counselling",
    description:
      "One-on-one support for adults, youth, and children (2.5–65 years). Covering anxiety, grief, depression, life transitions, and more.",
    image: "/assets/couplesImage.png",
  },
  {
    id: 5,
    title: "Youth Counselling",
    description:
      "Specialised support for adolescents navigating the pressures of school, identity, relationships, and mental health challenges.",
    image: "/assets/aboutImage2.jpg",
  },
  {
    id: 6,
    title: "Grief & Loss Support",
    description:
      "Compassionate guidance to help individuals process loss and find a path toward healing and acceptance.",
    image: "/assets/aboutImage3.jpg",
  },
  {
    id: 7,
    title: "Trauma & PTSD Therapy",
    description:
      "Evidence-based trauma therapy using EMDR, somatic approaches, and narrative techniques to help you heal from past wounds.",
    image: "/assets/howituseImage.jpg",
  },
  {
    id: 8,
    title: "Child & Play Therapy",
    description:
      "Creative, child-friendly therapeutic approaches for children aged 2.5–12 years to express and process their emotions.",
    image: "/assets/FamilySupport.png",
  },
];

/* ─── Arrow Icon ────────────────────────────────────────────── */
function ArrowIcon({ direction = "right" }) {
  if (direction === "left") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="17" height="13" viewBox="0 0 17 13" fill="none">
        <path d="M15.4167 6.25H0.75M0.75 6.25L6.25 11.75M0.75 6.25L6.25 0.75" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="13" viewBox="0 0 17 13" fill="none">
      <path d="M0.75 6.25H15.4167M15.4167 6.25L9.9167 11.75M15.4167 6.25L9.9167 0.75" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Animation variants for cards
const cardVariants = {
  hidden: {
    opacity: 0,
    y: 80,
    scale: 0.9
  },
  visible: (custom) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
      delay: custom * 0.15
    }
  })
};

const arrowVariants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 15,
      delay: 1.2
    }
  },
  hover: {
    scale: 1.1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  },
  tap: {
    scale: 0.95
  }
};

/* ─── Main Component ────────────────────────────────────────── */
export function Services() {
  const scrollRef = useRef(null);
  const sectionRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [cardsPerView, setCardsPerView] = useState(4);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "5%"]);

  // Handle responsive cards per view
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setCardsPerView(1);
      } else if (width < 1024) {
        setCardsPerView(2);
      } else {
        setCardsPerView(4);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => {
      window.removeEventListener("resize", updateArrows);
    };
  }, [cardsPerView]);

  // Trigger animations when section comes into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const scrollBy = (dir) => {
    const container = scrollRef.current;
    if (!container) return;
    const cardWidth = container.children[0]?.offsetWidth || 0;
    const gap = 20;
    const scrollAmount = (cardWidth + gap) * cardsPerView;
    container.scrollBy({ left: dir * scrollAmount, behavior: "smooth" });
    setTimeout(updateArrows, 300);
  };

  // Calculate card width based on cards per view
  const getCardWidth = () => {
    const totalGap = 20 * (cardsPerView - 1);
    return `calc((100% - ${totalGap}px) / ${cardsPerView})`;
  };

  return (
    <motion.section
      id="services"
      ref={sectionRef}
      style={{
        width: "100%",
        background: "#D9E1E8",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "48px",
        paddingBottom: "60px",
        minHeight: "600px",
        position: "relative",
        overflow: "hidden"
      }}
      className="sm:py-12 md:py-16 lg:py-20"
    >
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{ y: bgY }}
      />
      {/* Main container - responsive padding */}
      <div className="w-full flex flex-col items-center px-4 sm:px-8 md:px-12 lg:px-[100px] xl:px-[150px] box-border">
        {/* Badge with animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{
            display: "inline-flex",
            padding: "6px 16px",
            borderRadius: "9999px",
            background: "linear-gradient(90deg, #0D4A7A 0%, #1888E0 100%)",
            color: "#FFF",
            fontSize: "12px",
            fontWeight: "600",
            letterSpacing: "1.2px",
            textTransform: "uppercase",
            marginBottom: "20px",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          WHAT WE OFFER
        </motion.div>

        {/* Heading with animation */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            color: "#000",
            textAlign: "center",
            fontFamily: "Outfit, sans-serif",
            fontSize: "28px",
            fontWeight: "600",
            marginBottom: "12px",
          }}
          className="sm:text-[36px] md:text-[42px] lg:text-[48px]"
        >
          Our Services
        </motion.h2>

        {/* Subheading with animation */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            color: "#000",
            textAlign: "center",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "14px",
            fontWeight: "400",
            marginBottom: "32px",
            maxWidth: "700px"
          }}
          className="sm:text-[16px] md:text-[18px] lg:text-[20px]"
        >
          Comprehensive counselling support for every stage of life
        </motion.p>

        {/* Carousel Container - Responsive cards */}
        <div
          ref={scrollRef}
          onScroll={updateArrows}
          style={{
            display: "flex",
            gap: "16px",
            overflowX: "auto",
            width: "100%",
            scrollBehavior: "smooth",
            position: "relative",
            cursor: "default",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          className="no-scrollbar"
        >
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              custom={index}
              variants={cardVariants}
              initial="hidden"
              animate={isVisible ? "visible" : "hidden"}
              viewport={{ once: true, amount: 0.2 }}
              style={{
                width: getCardWidth(),
                minWidth: getCardWidth(),
                flexShrink: 0
              }}
            >
              <ServiceCard service={service} cardIndex={index} />
            </motion.div>
          ))}
        </div>

        {/* Bottom Arrows */}
        <motion.div
          variants={arrowVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
          style={{ display: "flex", gap: "16px", marginTop: "32px" }}
          className="sm:gap-5 sm:mt-8 md:mt-10"
        >
          <motion.button
            onClick={() => scrollBy(-1)}
            whileHover="hover"
            whileTap="tap"
            variants={arrowVariants}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "9999px",
              background: canScrollLeft ? "#1B4585" : "#CCCCCC",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              cursor: canScrollLeft ? "pointer" : "not-allowed",
              opacity: canScrollLeft ? 1 : 0.5,
              transition: "all 0.3s ease"
            }}
            className="sm:w-[41px] sm:h-[39px]"
            disabled={!canScrollLeft}
          >
            <ArrowIcon direction="left" />
          </motion.button>

          <motion.button
            onClick={() => scrollBy(1)}
            whileHover="hover"
            whileTap="tap"
            variants={arrowVariants}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "9999px",
              background: canScrollRight ? "#1B4585" : "#CCCCCC",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              cursor: canScrollRight ? "pointer" : "not-allowed",
              opacity: canScrollRight ? 1 : 0.5,
              transition: "all 0.3s ease"
            }}
            className="sm:w-[41px] sm:h-[39px]"
            disabled={!canScrollRight}
          >
            <ArrowIcon direction="right" />
          </motion.button>
        </motion.div>
      </div>


    </motion.section>
  );
}

/* ─── Service Card ──────────────────────────────────────────── */
function ServiceCard({ service, cardIndex }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      variants={cardVariants}
      custom={cardIndex}
      style={{
        width: "100%",
        minHeight: "320px",
        borderRadius: "10px",
        background: "#FFF",
        boxShadow: hovered
          ? "0 20px 40px rgba(0,0,0,0.15)"
          : "0 2px 8px rgba(0,0,0,0.08)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.3s ease",
        cursor: "pointer",
        flexShrink: 0
      }}
    >
      {/* Image area with gradient overlay + title */}
      <div
        style={{
          width: "100%",
          height: "clamp(160px, 22vw, 206px)",
          borderRadius: "5px 5px 0 0",
          backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.0) 40%, rgba(0,0,0,0.65) 100%), url('${service.image}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          alignItems: "flex-end",
          padding: "0 0 15px 15px",
          boxSizing: "border-box",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <span
          style={{
            color: "#FFF",
            fontFamily: "Outfit, sans-serif",
            fontSize: "20px",
            fontWeight: "500",
            lineHeight: "normal",
            maxWidth: "260px",
            wordWrap: "break-word",
          }}
        >
          {service.title}
        </span>
      </div>

      {/* Card body */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "14px 14px 16px 14px",
          boxSizing: "border-box",
        }}
      >
        {/* Description */}
        <p
          style={{
            width: "100%",
            color: "#000",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "15px",
            fontWeight: "400",
            lineHeight: "1.5",
            margin: 0,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical",
          }}
        >
          {service.description}
        </p>

        {/* Learn More */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            marginTop: "12px",
          }}
          onClick={() => { }}
        >
          <span
            style={{
              color: "#1E3A8A",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "15px",
              fontWeight: "400",
              lineHeight: "normal",
            }}
          >
            Learn More
          </span>
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            style={{ display: "block", flexShrink: 0 }}
            animate={{ x: hovered ? 5 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <path
              d="M3.66666 11H18.3333M18.3333 11L12.8333 16.5M18.3333 11L12.8333 5.5"
              stroke="#1E3A8A"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        </div>
      </div>
    </motion.div>
  );
}