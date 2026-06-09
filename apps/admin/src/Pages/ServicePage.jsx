import React, { useState } from "react";
import { ArrowDown, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Footer } from "../components/Layout/Footer.jsx";
import { useAppointment } from "@/context/AppointmentContext";
import { useLocation } from "wouter";

const counsellingCards = [
    {
        title: "Family support & Counselling",
        description: "Family therapy that helps resolve conflicts, improve communication, and strengthen bonds. We work with the entire family unit using a collaborative, systemic approach — addressing parenting challenges, family dynamics, and relational patterns that may be affecting the household.",
        price: "From $60/Session",
        duration: "15 Min",
        image: "/assets/FamilySupport.png"
    },
    {
        title: "Marital & Couple therapy",
        description: "Couples face a myriad of stressors — work, children, differing life goals, and expectations. We employ a systemic therapeutic model that builds self-awareness, fosters understanding, and creates a secure space for both partners to work through challenges together or individually.",
        price: "From $60/Session",
        duration: "15 Min",
        image: "/assets/counselling2.jpg"
    },
    {
        title: "Individual therapy",
        description: "For individuals experiencing work stress, relationship difficulties, transitional challenges, or personal dilemmas. Our counsellors use systemic communication, CBT, and expressive therapy to help you create lasting, meaningful change and improve your overall wellbeing.",
        price: "From $60/Session",
        duration: "15 Min",
        image: "/assets/counselling3.jpg"
    },
    {
        title: "Pre-School Children (Ages 2.5–7)",
        description: "Young children may encounter social, emotional, behavioural, or developmental challenges that, if unaddressed, can limit their confidence and learning. We use sand-tray, art, and play therapy to give young children a safe, non-threatening way to express themselves — with parents and caregivers as essential partners in the process.",
        price: "From $60/Session",
        duration: "15 Min",
        image: "/assets/counselling4.jpg"
    },
    {
        title: "Children & Youth counselling",
        description: "Young people face unique challenges during their developmental years. Our counsellors provide a safe, supportive space for children and youth to explore their feelings, build resilience, and develop healthy coping strategies.",
        price: "From $60/Session",
        duration: "15 Min",
        image: "/assets/counselling5.jpg"
    },
    {
        title: "Adult counselling (Ages 21–65)",
        description: "Life transitions, grief, marital difficulties, and work-related stress affect adults in profound ways. Our counsellors provide tailored, evidence-based support using therapeutic dialogue, experiential relationship building, and cognitive-behavioural techniques to help you achieve meaningful and lasting change",
        price: "From $60/Session",
        duration: "15 Min",
        image: "/assets/counselling6.jpg"
    }
];

const supervisionData = {
    title: "Supervision",
    description: "Clinical internships & supervision for budding counsellors. Kindly note that all our services are only available to singapore citizens, and permanent residents.",
    cards: [
        {
            title: "Clinical supervision",
            description: "WINGS has been a popular destination for internships since 2000. We provide clinical internships and supervision for budding counsellors who have strong theoretical knowledge but need to develop the micro-skills required for practical implementation. Supervision can be arranged as formal internships, attachments, or regular supervision sessions for those seeking SAC registration.",
            image: "/assets/supervisionImage.jpg"
        },
        {
            title: "Personal therapy for counsellors",
            description: "While training to become a counsellor, personal therapy is a critical part of professional development. Experiencing the client's role builds genuine empathy — helping counsellors understand the anxieties of first disclosure, the challenge of trust, and the vulnerability that clients bring to every session. Personal therapy also helps future counsellors manage their own discomforts and better handle transferences and counter-transferences in practice.",
            image: "/assets/supervisionImage1.jpg"
        }
    ]
};

const trainingData = {
    title: "Training & Workshops",
    description: "Assessment, treatment, and management of clinical conditions that impair emotional, cognitive, physical, behavioural, and social functioning.\nKindly note that all our services are only available to Singapore Citizens, and Permanent Residents.",
    cards: [
        {
            title: "School outreach programmes",
            description: "Custom workshops and talks for primary and secondary schools across singapore. Programmes are tailored for students, parents, or teachers — addressing social-emotional learning, mental health literacy, peer relationships, and resilience building. Delivered by trained counsellors with experience in school settings.",
            tags: ["Students", "Parents", "Teachers", "SEL"],
            image: "/assets/training.jpg"
        },
        {
            title: "Workplace wellness workshops",
            description: "For national and multinational companies seeking to invest in their employees' mental health. Our workshops cover stress management, burnout prevention, communication skills, and emotional resilience. Custom programmes can be designed to meet your organisation's specific goals and workforce profile.",
            tags: ["Stress management", "Burnout", "Resilience", "EQ skills"],
            image: "/assets/training1.jpg"
        },
        {
            title: "Community organisation programmes",
            description: "Talks and workshops designed for voluntary welfare organisations, religious groups, and community centres. We help community leaders and volunteers understand mental health, support vulnerable populations, and create environments where residents feel safe to seek help. All programmes are co-designed with your community in mind.",
            tags: ["VWOs", "CCs", "Religious groups", "Caregivers"],
            image: "/assets/training2.jpg"
        },
        {
            title: "Skill-based parenting workshops",
            description: "Developed originally under the Ministry of Community Youth and Sports' Family-life Education programme, our parenting workshops adopt a three-pronged approach — working with schools, homes, and the community together. Practical, skills-based, and delivered by counsellors who work with families daily.",
            tags: ["Stress management", "Burnout", "Resilience", "EQ skills"],
            image: "/assets/training3.jpg"
        }
    ]
};

export default function ServicePage() {
    const { openModal } = useAppointment();
    const [activeTab, setActiveTab] = useState("counselling");
    const [hoveredButton, setHoveredButton] = useState(null);
    const [, setLocation] = useLocation();

    // Sync tab with URL hash
    React.useEffect(() => {
        const handleHash = () => {
            const hash = window.location.hash.replace("#", "");
            if (["counselling", "supervision", "training"].includes(hash)) {
                setActiveTab(hash);
                // Scroll to tabs section if needed
                const tabsEl = document.querySelector(".tab-selector");
                if (tabsEl) {
                    tabsEl.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            }
        };

        handleHash();
        window.addEventListener("hashchange", handleHash);
        return () => window.removeEventListener("hashchange", handleHash);
    }, []);

    const getTitle = () => {
        switch (activeTab) {
            case "counselling": return "Counselling & Therapy";
            case "supervision": return supervisionData.title;
            case "training": return trainingData.title;
            default: return "Counselling & Therapy";
        }
    };

    const getDescription = () => {
        switch (activeTab) {
            case "counselling":
                return "Professional assistance and guidance in resolving personal, relational, and psychological challenges — for individuals, couples, families, and children of all ages.";
            case "supervision":
                return supervisionData.description;
            case "training":
                return trainingData.description;
            default:
                return "Professional assistance and guidance in resolving personal, relational, and psychological challenges — for individuals, couples, families, and children of all ages.";
        }
    };

    const getCards = () => {
        switch (activeTab) {
            case "counselling": return counsellingCards;
            case "supervision": return supervisionData.cards;
            case "training": return trainingData.cards;
            default: return counsellingCards;
        }
    };

    const isTrainingTab = activeTab === "training";
    const isSupervisionTab = activeTab === "supervision";
    const isCounsellingTab = activeTab === "counselling";

    const tabVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 }
    };

    // Split description into lines for training tab
    const renderDescription = (description) => {
        if (activeTab === "training" && description.includes("\n")) {
            return description.split("\n").map((line, i) => (
                <React.Fragment key={i}>
                    {line}
                    {i < description.split("\n").length - 1 && <br />}
                </React.Fragment>
            ));
        }
        return description;
    };

    return (
        <div className="w-full flex flex-col min-h-screen items-center bg-[#FAFAF5]">
            {/* ── Hero Section ── CENTERED */}
            <div
                className="relative flex w-full shrink-0 overflow-hidden items-center justify-center"
                style={{
                    minHeight: "500px",
                    height: "clamp(500px, 55vw, 790px)",
                    background: "linear-gradient(180deg, rgba(58,58,58,0.8) 0%, rgba(0,0,0,0.7) 100%), url('/assets/howituseImage.jpg')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            >
                <div className="relative w-full h-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-[150px]">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                        className="flex flex-col items-center justify-center text-center h-full"
                        style={{ maxWidth: "900px", margin: "0 auto" }}
                    >
                        <h1
                            className="text-[36px] sm:text-[46px] md:text-[56px] lg:text-[60px] font-semibold leading-tight mb-4 sm:mb-6"
                            style={{
                                fontFamily: "'Outfit', sans-serif",
                                color: "#FFFFFF",
                            }}
                        >
                            Professional care, tailored to you
                        </h1>

                        <p
                            className="text-[16px] sm:text-[18px] md:text-[20px] leading-relaxed mb-6 sm:mb-8"
                            style={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontWeight: 400,
                                color: "#FFFFFF",
                                maxWidth: "750px",
                            }}
                        >
                            We customise every counselling and therapy service to suit each client's unique needs —
                            based on the challenges they face, their developmental stage, and their age. Available to
                            Singapore Citizens and Permanent Residents.
                        </p>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                document
                                    .getElementById("services-tabs")
                                    ?.scrollIntoView({
                                        behavior: "smooth",
                                        block: "start",
                                    });
                            }}
                            className="flex items-center justify-center border-none cursor-pointer"
                            style={{
                                height: "clamp(48px, 6vw, 60px)",
                                borderRadius: "9999px",
                                backgroundColor: "#1B4585",
                                padding: "0 clamp(20px, 3vw, 32px)",
                                gap: "10px",
                            }}
                        >
                            <span
                                className="text-[15px] sm:text-[16px] md:text-[18px]"
                                style={{
                                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                                    fontWeight: 600,
                                    color: "#FFFFFF",
                                }}
                            >
                                Explore our services
                            </span>
                       <svg
  width="20"
  height="20"
  viewBox="0 0 24 24"
  fill="none"
>
  <path
    d="M6 9L12 15L18 9"
    stroke="white"
    strokeWidth="3.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
</svg>
                        </motion.button>
                    </motion.div>
                </div>
            </div>

            {/* ── Tabs + Cards Section ── WITH 150px PADDING */}
            <div className="w-full flex flex-col pb-16 sm:pb-20 px-6 sm:px-10 md:px-20 lg:px-[150px] overflow-x-hidden">

                {/* Tab Selector - CENTERED */}
                <motion.div
                    id="services-tabs"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="flex mt-10 sm:mt-16 md:mt-20 w-full max-w-full sm:max-w-[800px] mx-auto overflow-x-auto no-scrollbar tab-selector"
                    style={{
                        height: "clamp(48px, 7vw, 60px)",
                        borderRadius: "30px",
                        background: "linear-gradient(90deg, #0D4A7A 0%, #1B4585 100%)",
                        alignItems: "center",
                        padding: "0 4px",
                        position: "relative",
                        flexShrink: 0,
                        scrollbarWidth: "none",
                    }}
                >
                    {["counselling", "supervision", "training"].map((tab) => (
                        <motion.div
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            animate={{
                                backgroundColor: activeTab === tab ? "#FFFFFF" : "transparent",
                                color: activeTab === tab ? "#0D4A7A" : "#FFFFFF",
                            }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            style={{
                                flex: 1,
                                minWidth: "90px",
                                height: "clamp(38px, 5vw, 52px)",
                                borderRadius: "30px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontFamily: "'DM Sans', sans-serif",
                                fontWeight: 500,
                                fontSize: "clamp(12px, 2vw, 16px)",
                                marginLeft: tab === "counselling" ? "4px" : "0",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                padding: "0 clamp(8px, 2vw, 16px)",
                            }}
                        >
                            {tab === "counselling" ? "Counselling & Therapy" : tab === "supervision" ? "Supervision" : "Training & Workshops"}
                        </motion.div>
                    ))}
                </motion.div>

                {/* Section Title - CENTERED */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab + "-title"}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="mt-10 sm:mt-16 md:mt-[90px] text-center"
                    >
                        <h2
                            className="text-[24px] sm:text-[28px] md:text-[32px] lg:text-[35px] font-medium mb-4"
                            style={{
                                fontFamily: "'Outfit', sans-serif",
                                color: "#0D4A7A",
                                lineHeight: "1.2",
                            }}
                        >
                            {getTitle()}
                        </h2>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.4 }}
                            className="text-[15px] sm:text-[17px] md:text-[18px] lg:text-[20px] leading-relaxed mx-auto whitespace-pre-line"
                            style={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontWeight: 500,
                                color: "#333333",
                                maxWidth: "930px",
                                display: activeTab === "training" ? "-webkit-box" : undefined,
                                WebkitLineClamp: activeTab === "training" ? 2 : undefined,
                                WebkitBoxOrient: activeTab === "training" ? "vertical" : undefined,
                                overflow: activeTab === "training" ? "hidden" : undefined,
                            }}
                        >
                            {renderDescription(getDescription())}
                        </motion.p>
                    </motion.div>
                </AnimatePresence>

                {/* Cards Grid */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        variants={tabVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className={`mt-10 sm:mt-12 grid gap-4 sm:gap-5 md:gap-6 w-full cursor-pointer ${isCounsellingTab
                            ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                            : "grid-cols-1 md:grid-cols-2 max-w-[1000px] mx-auto"
                            }`}
                    >
                        {getCards().map((card, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1, duration: 0.5 }}
                                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                                className="flex flex-col w-full"
                                style={{
                                    borderRadius: "10px",
                                    backgroundColor: "#FFFFFF",
                                    boxShadow: "0px 10px 30px rgba(0,0,0,0.05)",
                                    overflow: "hidden",
                                    maxWidth: "100%",
                                }}
                            >
                                {/* Image */}
                                <motion.div
                                    onClick={() => setLocation("/SubService")}
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ duration: 0.4 }}
                                    className="w-full"
                                    style={{
                                        height: "clamp(160px, 22vw, 206px)",
                                        backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%), url(${card.image})`,
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                        position: "relative",
                                        flexShrink: 0,
                                    }}
                                >
                                    <div
                                        style={{
                                            position: "absolute",
                                            bottom: "16px",
                                            left: "16px",
                                            right: "16px",
                                            fontFamily: "'Outfit', sans-serif",
                                            fontWeight: 500,
                                            fontSize: "clamp(15px, 2vw, 18px)",
                                            lineHeight: "1.3",
                                            color: "#FFFFFF",
                                        }}
                                    >
                                        {card.title}
                                    </div>
                                </motion.div>

                                {/* Body */}
                                <div className="flex flex-col flex-1 p-4 sm:p-5">
                                    {/* Description */}
                                 <p
    className="text-[14px] sm:text-[15px] md:text-[15px] leading-relaxed mb-4"
    style={{
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 400,
        color: "#000000",
    }}
>
    {card.description.slice(0, 180)}...

    <span
        onClick={() => setLocation("/SubService")}
        style={{
            color: "#1B4585",
            textDecoration: "underline",
            cursor: "pointer",
            fontWeight: 500,
            marginLeft: "2px",
        }}
    >
        Read more
    </span>
</p>

                                    {/* Tags – Training tab */}
                                    {isTrainingTab && card.tags && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {card.tags.map((tag, tagIndex) => (
                                                <span
                                                    key={tagIndex}
                                                    style={{
                                                        fontFamily: "'DM Sans', sans-serif",
                                                        fontWeight: 500,
                                                        fontSize: "14px",
                                                        padding: "4px 12px",
                                                        backgroundColor: "#F0F4F8",
                                                        color: "#1B4585",
                                                        borderRadius: "20px",
                                                    }}
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Book an Appointment Button - Only for Counselling */}
                                    {isCounsellingTab && (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => openModal(card.title)}
                                            className="flex items-center justify-center gap-2 mt-auto w-full cursor-pointer transition-all duration-300"
                                            style={{
                                                padding: "12px 20px",
                                                borderRadius: "9999px",
                                                backgroundColor: hoveredButton === index ? "#1B4585" : "#FFFFFF",
                                                border: "1px solid #1B4585",
                                                fontFamily: "'DM Sans', sans-serif",
                                                fontWeight: 600,
                                                fontSize: "14px",
                                                color: hoveredButton === index ? "#FFFFFF" : "#1B4585",
                                            }}
                                            onMouseEnter={() => setHoveredButton(index)}
                                            onMouseLeave={() => setHoveredButton(null)}
                                        >
                                            Book an appointment
                                            
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
                                        </motion.button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer */}
            <Footer />

            <style>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
