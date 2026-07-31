import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

const FALLBACK_PARTNERS = [
    {
        id: 1,
        name: "Partner",
        logo: "/assets/partnerlogo1.png",
        websiteLink: "",
    },
    {
        id: 2,
        name: "Partner",
        logo: "/assets/partnerlogo2.png",
        websiteLink: "",
    },
];

const CARD_WIDTH_MOBILE = 170;
const CARD_WIDTH_DESKTOP = 220;
const CARD_GAP_MOBILE = 16;
const CARD_GAP_DESKTOP = 24;

function normalizeWebsiteLink(link) {
    if (!link || typeof link !== "string") return "";
    const trimmed = link.trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
}

function PartnerCard({ partner }) {
    const cardClassName =
        "bg-white rounded-[20px] p-4 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow w-[170px] h-[210px] md:w-[220px] md:h-[240px] shrink-0";

    const content = (
        <>
            <div className="h-[80px] md:h-[100px] flex items-center justify-center mb-3 md:mb-4">
                <img
                    src={partner.logo}
                    alt={partner.name || "Partner logo"}
                    className="w-[110px] h-[80px] md:w-[140px] md:h-[100px] object-contain"
                    onError={(e) => {
                        e.currentTarget.src = "/assets/partnerlogo1.png";
                    }}
                />
            </div>
            {partner.name && (
                <p className="text-[#0D4A7A] text-center font-['Outfit'] font-medium text-[11px] md:text-[15px] lg:text-[16px] leading-snug line-clamp-3 w-full px-1">
                    {partner.name}
                </p>
            )}
        </>
    );

    const websiteLink = normalizeWebsiteLink(partner.websiteLink);

    if (websiteLink) {
        return (
            <a
                href={websiteLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`${cardClassName} cursor-pointer`}
            >
                {content}
            </a>
        );
    }

    return <div className={cardClassName}>{content}</div>;
}

export function Partners() {
    const { t, i18n } = useTranslation();
    const sectionRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const [partners, setPartners] = useState(FALLBACK_PARTNERS);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(false);

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"],
    });

    const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "5%"]);

    useEffect(() => {
        let cancelled = false;
        const lang = (i18n.language || "en").split("-")[0];

        const loadPartners = async () => {
            try {
                const response = await fetch(
                    `/api/partners?lang=${encodeURIComponent(lang)}`
                );
                if (!response.ok) throw new Error("Failed to fetch partners");

                const data = await response.json();
                if (!cancelled && Array.isArray(data) && data.length) {
                    setPartners(
                        data.map((partner) => ({
                            id: partner.id,
                            name: partner.name,
                            logo: partner.logo || "/assets/partnerlogo1.png",
                            websiteLink: partner.websiteLink || "",
                        }))
                    );
                }
            } catch (error) {
                console.error("Error fetching partners:", error);
            }
        };

        loadPartners();

        return () => {
            cancelled = true;
        };
    }, [i18n.language]);

    useEffect(() => {
        const updateAutoScroll = () => {
            const container = scrollContainerRef.current;
            if (!container) return;

            const isMobile = window.innerWidth < 768;
            const cardWidth = isMobile ? CARD_WIDTH_MOBILE : CARD_WIDTH_DESKTOP;
            const gap = isMobile ? CARD_GAP_MOBILE : CARD_GAP_DESKTOP;
            const cardsPerView = isMobile
                ? 1
                : Math.max(1, Math.floor((container.clientWidth + gap) / (cardWidth + gap)));

            setShouldAutoScroll(partners.length > cardsPerView);
        };

        updateAutoScroll();
        window.addEventListener("resize", updateAutoScroll);

        return () => {
            window.removeEventListener("resize", updateAutoScroll);
        };
    }, [partners.length]);

    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer) return;

        let isDragging = false;
        let startX = 0;
        let scrollStart = 0;

        const onMouseDown = (e) => {
            if (e.button !== 0) return;

            isDragging = true;
            startX = e.pageX;
            scrollStart = scrollContainer.scrollLeft;
            scrollContainer.style.cursor = "grabbing";
            scrollContainer.style.userSelect = "none";
        };

        const onMouseMove = (e) => {
            if (!isDragging) return;

            e.preventDefault();
            scrollContainer.scrollLeft = scrollStart - (e.pageX - startX);
        };

        const stopDragging = () => {
            if (!isDragging) return;

            isDragging = false;
            scrollContainer.style.cursor = "grab";
            scrollContainer.style.userSelect = "";
        };

        scrollContainer.addEventListener("mousedown", onMouseDown);
        scrollContainer.addEventListener("mousemove", onMouseMove);
        scrollContainer.addEventListener("mouseup", stopDragging);
        scrollContainer.addEventListener("mouseleave", stopDragging);
        document.addEventListener("mouseup", stopDragging);

        return () => {
            scrollContainer.removeEventListener("mousedown", onMouseDown);
            scrollContainer.removeEventListener("mousemove", onMouseMove);
            scrollContainer.removeEventListener("mouseup", stopDragging);
            scrollContainer.removeEventListener("mouseleave", stopDragging);
            document.removeEventListener("mouseup", stopDragging);
        };
    }, [partners.length]);

    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer || !shouldAutoScroll) return;

        let animationId;
        let isHovering = false;
        let lastTimestamp = 0;

        const SCROLL_SPEED = 35;

        const autoScroll = (currentTime) => {
            if (!scrollContainer) return;

            if (!isHovering) {
                if (lastTimestamp === 0) {
                    lastTimestamp = currentTime;
                    animationId = requestAnimationFrame(autoScroll);
                    return;
                }

                const delta = Math.min(100, currentTime - lastTimestamp) / 1000;
                const scrollAmount = SCROLL_SPEED * delta;

                scrollContainer.scrollLeft += scrollAmount;

                const loopWidth = scrollContainer.scrollWidth / 2;
                if (loopWidth > 0 && scrollContainer.scrollLeft >= loopWidth) {
                    scrollContainer.scrollLeft -= loopWidth;
                }
            }

            lastTimestamp = currentTime;
            animationId = requestAnimationFrame(autoScroll);
        };

        const handleMouseEnter = () => {
            isHovering = true;
        };

        const handleMouseLeave = () => {
            isHovering = false;
            lastTimestamp = 0;
        };

        animationId = requestAnimationFrame(autoScroll);

        scrollContainer.addEventListener("mouseenter", handleMouseEnter);
        scrollContainer.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            cancelAnimationFrame(animationId);
            scrollContainer.removeEventListener("mouseenter", handleMouseEnter);
            scrollContainer.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, [shouldAutoScroll, partners.length]);

    return (
        <section
            id="partners"
            ref={sectionRef}
            className="
                relative
                w-full
                flex
                flex-col
                items-center
                overflow-hidden
                bg-[#E8EEF5]
                pt-[55px]
                pb-[60px]
            "
        >
            <motion.div
                className="absolute inset-0 pointer-events-none opacity-50"
                style={{ y: bgY }}
            />

            <div className="w-full navbar-align-outer">
                <div className="navbar-align-inner flex flex-col items-center">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="
                            text-[clamp(26px,4.8vw,28px)]
                            md:text-[35px]
                            text-center
                            font-['Outfit']
                            font-medium
                            leading-[1.2]
                            mb-[50px]
                            text-[#0D4A7A]
                        "
                    >
                        {t("partners.title")}
                    </motion.h2>

                    <div
                        ref={scrollContainerRef}
                        className="w-full overflow-x-auto scrollbar-hide cursor-grab"
                        style={{
                            scrollbarWidth: "none",
                            msOverflowStyle: "none",
                            WebkitOverflowScrolling: "touch",
                        }}
                    >
                        <div className="flex gap-4 md:gap-6 w-max mx-auto px-1 pt-[10px] pb-[10px]">
                            {(shouldAutoScroll ? [...partners, ...partners] : partners).map(
                                (partner, index) => (
                                <motion.div
                                    key={`${partner.id}-${index}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    className="shrink-0"
                                >
                                    <PartnerCard partner={partner} />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
