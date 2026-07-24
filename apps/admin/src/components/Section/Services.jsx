  import { useRef, useState, useEffect } from "react";
  import { motion, useScroll, useTransform } from "framer-motion";
  import { navigate } from "wouter/use-browser-location";
  import { useTranslation } from "react-i18next";
  const FALLBACK_SERVICE_IMAGE = "/assets/card2.jpg.jpeg";

  /* ─── Fallback service data (used if API is unavailable) ─── */
  const FALLBACK_SERVICES = [
    {
      id: 1,
      title: "Personal therapy (for counsellors)",
      description:
        "WINGS Counselling Centre has been a popular destination for internships since...",
      image: "/assets/personaltherpayservice.png",
       href: "/Personaltherapy",
    },
    {
      id: 2,
      title: "Supervision",
      description:
        "While you are pursuing your studies to become a professional counsellor, it is...",
      image: "/assets/supervisionservicesection.png",
      href: "/Clinicalsupervision",
    },
    {
      id: 3,
      title: "Family support & Counselling program",
      description:
        "Family Support & Counselling Program (FSCP) is an integrated counselling programme...",
      image: "/assets/familysupportservice.png",
      href: "/Familysupport",
    },
    {
      id: 4,
      title: "Individual therapy",
      description:
        "The friendly counsellors at WINGS Counselling Centre provide assistance to...",
      image: "/assets/indvidualservice.png",
      href: "/SubService",
    },
    {
      id: 5,
      title: "Marital & Couple therapy",
      description:
        "Couples today face a myriad of stressors – juggling work, home, children, and trying to...",
      image: "/assets/counselling2.jpg",
      href: "/Marital",
    },
    {
      id: 6,
      title: "Family & Parenting",
      description:
        "Parenting brings unique pressures—from managing behaviour and school...",
      image: "/assets/family&parenting.png",
      href: "/FamilyParenting",
    },
    {
      id: 7,
      title: "Youth",
      description:
        "The children and youth of today face many challenges that range from self-esteem to...",
      image: "/assets/youthservice.png",
      href: "/Youth",
    },
    {
      id: 8,
      title: "Pre-school children",
      description:
        "Younger children aged between 2.5 and 7 years not only display developmental...",
      image: "/assets/preschoolservice.png",
      href: "/Pre-school",
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

  /* ─── Main Component ───────────────────────────────────────── */
  export function Services() {
    const { t } = useTranslation();
    const scrollRef = useRef(null);
    const sectionRef = useRef(null);

    const [services, setServices] = useState(FALLBACK_SERVICES);
    const [isVisible, setIsVisible] = useState(false);
    const [cardsPerView, setCardsPerView] = useState(4);

    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);

    const { scrollYProgress } = useScroll({
      target: sectionRef,
      offset: ["start end", "end start"],
    });

    const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "5%"]);

    /* Fetch services from backend */
    useEffect(() => {
      let cancelled = false;

      const loadServices = async () => {
        try {
          const response = await fetch("/api/counselling-types");
          const json = await response.json();

          if (!cancelled && json.success && Array.isArray(json.data)) {
            const flattened = json.data.flatMap((mainType) =>
              (mainType.sub_types || [])
                .filter((sub) => sub.is_active !== false)
                .map((sub) => ({
                  id: sub.id,
                  title: sub.name,
                  description: sub.description || "",
                  image: sub.image_url || FALLBACK_SERVICE_IMAGE,
                  href: `/services/sub/${sub.id}`,
                }))
            );

            if (flattened.length) {
              setServices(flattened);
            }
          }
        } catch (error) {
          console.error("Error fetching services:", error);
        }
      };

      loadServices();

      return () => {
        cancelled = true;
      };
    }, []);

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

      if (cardsPerView === 1) {
        const cardWidth = el.children[0]?.offsetWidth || 0;
        const gap = 20;
        const index = cardWidth
          ? Math.round(el.scrollLeft / (cardWidth + gap))
          : 0;
        setActiveIndex(Math.min(Math.max(index, 0), services.length - 1));
      }
    };

    useEffect(() => {
      const el = scrollRef.current;

      if (!el) return;

      updateArrows();

      window.addEventListener("resize", updateArrows);

      return () => {
        window.removeEventListener("resize", updateArrows);
      };
    }, [cardsPerView, services]);

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

    const scrollToIndex = (index) => {
      const container = scrollRef.current;

      if (!container) return;

      const cardWidth = container.children[0]?.offsetWidth || 0;
      const gap = 20;

      container.scrollTo({
        left: index * (cardWidth + gap),
        behavior: "smooth",
      });

      setActiveIndex(index);
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
          pt-[60px]
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
            {/* Heading */}
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
              {t("services.title")}
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
                text-[16px]
                md:text-[18px]
                lg:text-[20px]
                font-normal
                max-w-[700px]
                leading-[1.5]
                line-clamp-2
                md:line-clamp-none
              "
            >
              {t("services.description")}
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

            {/* Scrollable Cards - Animation Removed */}
            <div
              ref={scrollRef}
              onScroll={updateArrows}
              className="flex items-stretch gap-5 overflow-x-auto scroll-smooth no-scrollbar flex-1"
            >
              {services.map((service, index) => (
                <div
                  key={service.id}
                  style={{
                    width: getCardWidth(),
                    minWidth: getCardWidth(),
                  }}
                  className="flex-shrink-0 flex flex-col"
                >
                  <ServiceCard service={service} />
                </div>
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

          {/* Mobile carousel dots */}
          <div className="flex md:hidden justify-center items-center gap-2 mt-6">
            {services.map((service, index) => (
              <button
                key={service.id}
                type="button"
                aria-label={`Go to ${service.title}`}
                onClick={() => scrollToIndex(index)}
                className={`rounded-full transition-all duration-300 ${
                  activeIndex === index
                    ? "w-2.5 h-2.5 bg-[#1B4585]"
                    : "w-2 h-2 bg-[#B0BAC4]"
                }`}
              />
            ))}
          </div>
          </div>
        </div>
      </motion.section>
    );
  }

  /* ─── Service Card ─────────────────────────────────────────── */
  function ServiceCard({ service }) {
    const { t } = useTranslation();
    const [hovered, setHovered] = useState(false);

    return (
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => navigate(service.href)}
        role="link"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigate(service.href);
          }
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
          hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)]
          shadow-[0_2px_8px_rgba(0,0,0,0.08)]
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
            text-[16px]
                md:text-[18px]
                lg:text-[20px]
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
    text-[14px]
    md:text-[15px]
    leading-[1.6]
    line-clamp-2
    overflow-hidden
    h-[3.2em]
  "
>
  {service.description}
</p>

          {/* Learn More */}
          <div className="flex items-center gap-2 mt-auto pt-4 cursor-pointer shrink-0">
            <span
              onClick={() => navigate(service.href)}
              className="
                text-[#1E3A8A]
                font-['DM_Sans']
                text-[16px]
                md:text-[15px]
                font-medium
                flex items-center gap-1
              "
            >
              {t("services.readMore")}

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
      </div>
    );
  }