import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { navigate } from "wouter/use-browser-location";

/* ─── Service Data ─────────────────────────────────────────── */
const services = [
  {
    id: 1,
    title: "Personal therapy",
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
    title: "Family support & Counseling",
    description:
      "Support for families navigating challenges such as conflict resolution, parenting strategies, and improving family dynamics.",
    image: "/assets/FamilySupport.png",
  },
  {
    id: 4,
    title: "Couples counselling",
    description:
      "One-on-one support for adults, youth, and children (2.5–65 years). Covering anxiety, grief, depression, life transitions, and more.",
    image: "/assets/couplesImage.png",
  },
  {
    id: 5,
    title: "Youth counselling",
    description:
      "Specialised support for adolescents navigating the pressures of school, identity, relationships, and mental health challenges.",
    image: "/assets/aboutImage2.jpg",
  },
  {
    id: 6,
    title: "Grief & Loss support",
    description:
      "Compassionate guidance to help individuals process loss and find a path toward healing and acceptance.",
    image: "/assets/aboutImage3.jpg",
  },
  {
    id: 7,
    title: "Trauma & PTSD therapy",
    description:
      "Evidence-based trauma therapy using EMDR, somatic approaches, and narrative techniques to help you heal from past wounds.",
    image: "/assets/howituseImage.jpg",
  },
  {
    id: 8,
    title: "Child & Play therapy",
    description:
      "Creative, child-friendly therapeutic approaches for children aged 2.5–12 years to express and process their emotions.",
    image: "/assets/FamilySupport.png",
  },
];

/* ─── Arrow Icon ───────────────────────────────────────────── */
function ArrowIcon({ direction = "right" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d={direction === "left" ? "M15 6L9 12L15 18" : "M9 6L15 12L9 18"}
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─── Animations ───────────────────────────────────────────── */
const cardVariants = {
  hidden: {
    opacity: 0,
    y: 60,
    scale: 0.95,
  },
  visible: (custom) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      delay: custom * 0.12,
    },
  }),
};

/* ─── Main Component ───────────────────────────────────────── */
export function Services() {
  const scrollRef = useRef(null);
  const sectionRef = useRef(null);

  const [isVisible, setIsVisible] = useState(false);
  const [cardsPerView, setCardsPerView] = useState(4);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "5%"]);

  /* Responsive Cards */
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

  /* Arrow States */
  const updateArrows = () => {
    const el = scrollRef.current;

    if (!el) return;

    setCanScrollLeft(el.scrollLeft > 5);

    setCanScrollRight(
      el.scrollLeft < el.scrollWidth - el.clientWidth - 5
    );
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

  /* Section Visibility */
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

  /* Scroll Function */
  const scrollBy = (dir) => {
    const container = scrollRef.current;

    if (!container) return;

    const cardWidth = container.children[0]?.offsetWidth || 0;

    const gap = 20;

    const scrollAmount = (cardWidth + gap) * cardsPerView;

    container.scrollBy({
      left: dir * scrollAmount,
      behavior: "smooth",
    });

    setTimeout(updateArrows, 300);
  };

  /* Card Width */
  const getCardWidth = () => {
    const totalGap = 20 * (cardsPerView - 1);

    return `calc((100% - ${totalGap}px) / ${cardsPerView})`;
  };

  return (
    <motion.section
      id="services"
      ref={sectionRef}
      className="
        relative
        w-full
        overflow-hidden
        bg-[#D9E1E8]
        pt-[40px]
        pb-[60px]

      "
    >
      {/* Background Motion */}
      <motion.div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{ y: bgY }}
      />

      {/* Main Container — aligned with Navbar */}
      <div className="relative w-full navbar-align-outer">
        <div className="navbar-align-inner">

        {/* Header */}
        <div className="relative flex flex-col items-center mb-10">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{
              display: "inline-flex",
              padding: "8px 20px",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "9999px",
              background: "linear-gradient(90deg,#0D4A7A,#42A0BD)",
              color: "#FFF",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: "20px",
              fontWeight: "600",
              letterSpacing: "1.2px",
              marginBottom: "24px",
              minWidth: "180px",
              height: "42px"
            }}
          >
            What we offer
          </motion.div>

          {/* Heading */}
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
            Our services
          </motion.h2>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="
              text-black
              text-center
              font-['DM_Sans']
              text-[15px]
              md:text-[20px]
              font-normal
              max-w-[700px]
            "
          >
            Comprehensive counselling support for every stage of life
          </motion.p>

        </div>

        {/* Cards Row with side arrows */}
        <div className="flex items-center gap-3">

          {/* Left Arrow */}
          <button
            onClick={() => scrollBy(-1)}
            disabled={!canScrollLeft}
            className={`
              hidden md:flex
              flex-shrink-0
              w-[44px] h-[44px]
              rounded-full
              items-center
              justify-center
              transition-all duration-300
              ${canScrollLeft
                ? "bg-[#1B4585] hover:scale-105 cursor-pointer shadow-md"
                : "bg-[#B0BAC4] opacity-50 cursor-not-allowed"
              }
            `}
          >
            <ArrowIcon direction="left" />
          </button>

          {/* Scrollable Cards */}
          <div
            ref={scrollRef}
            onScroll={updateArrows}
            className="flex items-stretch gap-5 overflow-x-auto scroll-smooth no-scrollbar flex-1"
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
                }}
                className="flex-shrink-0 flex flex-col"
              >
                <ServiceCard service={service} />
              </motion.div>
            ))}
          </div>

          {/* Right Arrow */}
          <button
            onClick={() => scrollBy(1)}
            disabled={!canScrollRight}
            className={`
              hidden md:flex
              flex-shrink-0
              w-[44px] h-[44px]
              rounded-full
              items-center
              justify-center
              transition-all duration-300
              ${canScrollRight
                ? "bg-[#1B4585] hover:scale-105 cursor-pointer shadow-md"
                : "bg-[#B0BAC4] opacity-50 cursor-not-allowed"
              }
            `}
          >
            <ArrowIcon direction="right" />
          </button>

        </div>
        </div>
      </div>
    </motion.section>
  );
}

/* ─── Service Card ─────────────────────────────────────────── */
function ServiceCard({ service }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      animate={{
        boxShadow: hovered
          ? "0 20px 40px rgba(0,0,0,0.15)"
          : "0 2px 8px rgba(0,0,0,0.08)",
      }}
      className="
        w-full
        h-full
        bg-white
        rounded-[12px]
        overflow-hidden
        flex
        flex-col
        transition-all
        duration-300
        cursor-pointer
        
      "
    >
      {/* Image */}
      <div
        className="
          relative
          w-full
          h-[220px]
          bg-cover
          bg-center
          flex
          items-end
          p-4
        "
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.65) 100%), url('${service.image}')`,
        }}
      >
        <h3
          className="
            text-white
            font-['Outfit']
            text-[22px]
            font-medium
            max-w-[260px]
          "
        >
          {service.title}
        </h3>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 min-h-0 p-4">

        {/* Description */}
        <p
          className="
            text-black
            font-['DM_Sans']
            text-[15px]
            leading-[1.6]
            line-clamp-3
            min-h-[4.8rem]
            flex-1
          "
        >
          {service.description}
        </p>

     {/* Learn More */}
<div className="flex items-center gap-2 mt-auto pt-4 cursor-pointer shrink-0">
  <span
  onClick={() => navigate("/SubService")}
    className="
      text-[#1E3A8A]
      font-['DM_Sans']
      text-[15px]
      font-medium
      flex items-center gap-1
    "
  >
    Read more

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
  </span>
</div>
      </div>
    </motion.div>
  );
}