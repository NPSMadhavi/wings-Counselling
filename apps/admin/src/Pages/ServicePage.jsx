import React, { useState } from "react";
import { ArrowDown, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Footer } from "../components/Layout/Footer.jsx";
import { useAppointment } from "@/context/AppointmentContext";
import { useLocation } from "wouter";

const counsellingCards = [
    {
        title: "Family support & Counselling program",
        description: "Family Support & Counselling Program (FSCP) is an integrated counselling programme for children, youths, individuals, couples and families from ages between 2.5 and 65 years old. The service is open to anyone seeking help regardless of their ethnicity or religious affiliation. At WINGS Counselling Centre, we understand that seeking help is a difficult first step to achieving the life you want which is why a strict confidentiality policy is maintained. Our niche area of work is to serve children and at-risk youth. The aim of the programme is to help clients enhance the quality of their personal, social, emotional, behavioural, family and marital life, while overcoming developmental or other challenge.",
        price: "From $60/Session",
        duration: "15 Min",
        image: "/assets/familysupportservice.png"
    },
    {
        title: "Marital & Couple therapy",
        description: "Couples today face a myriad of stressors juggling work, home, children and trying to live up to expectations of their spouse and extended family. As a result, many marriages break down and couples end up on the brink of divorce. Furthermore, the never-ending adjustment and challenges that couples face in the early years of marriage adjusting to their new partner, in-laws, expectations, differing life goals, work or simply managing differences-pose a threat to them.",
        price: "From $60/Session",
        duration: "15 Min",
        image: "/assets/counselling2.jpg"
    },
    {
        title: "Individual therapy",
        description: "The friendly counsellors at WINGS Counselling Centre provide assistance to individuals and adults who may be experiencing a variety of personal issues such as work stress, relationship difficulties, transitional challenges or family and personal dilemmas. Our counsellors are specially trained to employ a range of techniques based on systemic communication, experiential relationship building, therapeutic dialogue, cognitive-behavioural therapy and expressive therapy to help clients create meaningful changes in their lives that elevate and improve their overall well-being, while facilitating the quality of their relationship with significant others.",
        price: "From $60/Session",
        duration: "15 Min",
        image: "/assets/indvidualservice.png"
    },
    {
        title: "Pre-school children",
        description: "Younger children aged between 2.5 and 7 years not only display developmental challenges but also encounter social, emotional, behavioural or learning-related difficulties. Research has shown that these manifested difficulties that children go through may have arisen from deeper underlying issues, things that are unclear or go unseen by parents. Such challenges during the early years of learning may severely limit the child’s ability to fully enjoy pre-school leaning and socialise amongst his or her peers. If left undetected, these difficulties could ultimately affect the young child’s confidence and self-esteem.",
        price: "From $60/Session",
        duration: "15 Min",
        image: "/assets/preschoolservice.png"
    },
    {
        title: " Youth",
        description: "The children and youth of today face many challenges that range from self-esteem to relationship issues. A lack of motivation toward studies and navigating the developmental issues that adolescents face are issues that adults often misunderstand. WINGS Counselling Centre’s niche area of work is helping children and youth through timely intervention. We have also been providing school-based counselling since 1995. We adopt a collaborative approach by working closely with students, their parents and schools to identify and address the challenges that youths face. We aim to empower youths with a sensible voice coupled with a sense of responsibility as well as provide them with a nurturing environment within which they can flourish and grow as individuals.",
        price: "From $60/Session",
        duration: "15 Min",
        image: "/assets/youthservice.png"
    },
    {
        title: "Adults ",
        description: "The friendly counsellors at WINGS Counselling Centre provide assistance to individuals and adults who may be experiencing a variety of personal issues such as work stress, relationship difficulties, transitional challenges or family and personal dilemmas. Our counsellors are specially trained to employ a range of techniques based on systemic communication, experiential relationship building, therapeutic dialogue, cognitive-behavioural therapy and expressive therapy to help clients create meaningful changes in their lives that elevate and improve their overall well-being, while facilitating the quality of their relationship with significant others",
        price: "From $60/Session",
        duration: "15 Min",
        image: "/assets/adultservice.jpeg"
    }
];

const supervisionData = {
    title: "Supervision",
    description: "Clinical internships & supervision for budding counsellors. Kindly note that all our services are only available to Singapore citizens and permanent residents.",
    cards: [
        {
            title: " Supervision",
            appointmentSelection: {
                counsellingTypeName: "Supervision",
                subTypeName: "Supervision",
            },
            description: "WINGS Counselling Centre has been a popular destination for internships since 2000. We provide clinical internships and supervision for budding counsellors who have the theoretical knowledge in counselling but lack the micro skills required for its practical implementation. Supervision is a process in which a social service professional such as a counsellor can speak to a trained supervisor for guidance. Supervision can be in the form of clinical internships or attachments for professional counsellors, graduating and graduated students. Those seeking supervision for aiming to become a Registered Counsellor at the Singapore Association for Counselling. We have a collaborative relationship with a number of institutions such as UniSIM, Nanyang Polytechnic, Monash University, James Cook University and the Executive Counselling & Training Academy. Those pursuing a Certificate, Diploma, Degree or Masters in Counselling can contact us should they require clinical supervision. Independent counsellors seeking clinical supervision are welcomed as well.",
            image: "/assets/supervisionservice.png"
        },
        {
            title: "Personal therapy (for counsellors)",
            description: "While you are pursuing your studies to become a professional counsellor, it is critical for budding counsellors to seek personal therapy for a couple of reasons. Budding counsellors need to experience being a client to know the anxieties of meeting a counsellor for the first time and having to disclose personal or family matters without knowing how much the client can trust the counsellor.  When budding counsellors go through personal experiences they become more aware of the client’s challenges about disclosures, trust issues and their vulnerabilities. Furthermore, personal therapy also helps budding counsellors to manage their own discomforts so that they are better equipped to manage transferences and counter-transferences.",
            image: "/assets/personaltherpayservice.png"
        }
    ]
};

const trainingData = {
    title: "Training & Workshops",
    description: "Assessment, treatment and management of clinical conditions that impair emotional, cognitive, physical, behavioural and social functioning. Kindly note that all our services are only available to Singapore Citizens and Permanent Residents.",
    cards: [
        {
            title: "Workshops",
            appointmentSelection: {
                counsellingTypeName: "Training & Workshops",
                subTypeName: "Workshops",
            },
            description: "Workshops and talks can be organised for schools, national, multinational companies and community organisations. The purpose of outreach programmes are to facilitate the awareness of issues that may affect the targeted audience (i.e. students, parents or employees). Custom tailor-made programmes that suit the requirements of the target group are offered.",
           image: "/assets/workshopservice.png"
        }
    ]
};

export default function ServicePage() {
    const { openModal } = useAppointment();
    const [activeTab, setActiveTab] = useState("counselling");
    const [hoveredButton, setHoveredButton] = useState(null);
    const [, setLocation] = useLocation();

    const counsellingRoutes = [
        "/Familysupport",
        "/Marital",
        "/SubService",
        "/Pre-school",
        "/Youth",
        "/Adult",
    ];
    const supervisionRoutes = [
      "/Clinicalsupervision",
      "/Personaltherapy",
    ];
    const trainingRoutes = [
      "/Schooloutreach",
      "/Workplace",
      "/Community",
      "/Skill",
    ];

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
                return "Professional assistance and guidance in resolving personal, relational and psychological challenges for individuals, couples, families and children of all ages.";
            case "supervision":
                return supervisionData.description;
            case "training":
                return trainingData.description;
            default:
                return "Professional assistance and guidance in resolving personal, relational, and psychological challenges-for individuals, couples, families, and children of all ages.";
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
                    minHeight: "480px",
                    height: "clamp(480px, 55vw, 790px)",
                    background: "linear-gradient(180deg, rgba(58,58,58,0.8) 0%, rgba(0,0,0,0.7) 100%), url('/assets/howituseImage.jpg')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            >
                <div className="relative w-full h-full px-4 min-[375px]:px-6 sm:px-10 md:px-16 lg:px-24 xl:px-[150px]">
                    <div className="flex flex-col items-center justify-center text-center h-full max-w-[900px] mx-auto">
                        <h1 className="text-[clamp(28px,6vw,60px)] font-semibold leading-[1.1] sm:leading-tight mb-4 sm:mb-6 font-['Outfit'] text-white">
                            Professional care, tailored to you
                        </h1>

                        <p className="text-[clamp(15px,2.5vw,20px)] leading-relaxed mb-6 sm:mb-8 font-['DM_Sans'] font-normal text-white max-w-[750px] px-1">
                         We offer a comprehensive range of counselling & therapy, supervision and training & workshops designed to support individuals, families, professionals, schools, workplaces and community organisations. Every service is tailored to meet the unique needs and goals of those we serve.
                        </p>

                        <button
                            onClick={() => {
                                document
                                    .getElementById("services-tabs")
                                    ?.scrollIntoView({
                                        behavior: "smooth",
                                        block: "start",
                                    });
                            }}
                            className="flex items-center justify-center border-none cursor-pointer h-[clamp(46px,6vw,60px)] rounded-full bg-[#1B4585] px-5 min-[375px]:px-6 sm:px-8 gap-2 sm:gap-[10px]"
                        >
                            <span className="text-[14px] sm:text-[16px] md:text-[18px] font-['Plus_Jakarta_Sans'] font-semibold text-white whitespace-nowrap">
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
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Tabs + Cards Section ── WITH 150px PADDING */}
            <div className="w-full flex flex-col pb-12 sm:pb-16 md:pb-20 px-4 min-[375px]:px-6 sm:px-10 md:px-12 lg:px-24 xl:px-[150px] overflow-x-hidden">

                {/* Tab Selector - CENTERED */}
                <div
                    id="services-tabs"
                    className="tab-selector grid grid-cols-3 gap-1.5 sm:flex sm:gap-1 mt-8 sm:mt-12 md:mt-16 lg:mt-20 w-full max-w-full sm:max-w-[800px] mx-auto rounded-[28px] sm:rounded-[30px] bg-gradient-to-r from-[#0D4A7A] to-[#1B4585] p-1.5 sm:p-1 min-h-[52px] sm:min-h-0 sm:h-[clamp(48px,7vw,60px)] items-stretch sm:items-center shrink-0"
                >
                    {["counselling", "supervision", "training"].map((tab) => (
                        <div
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`rounded-[22px] sm:rounded-[30px] flex items-center justify-center text-center font-['DM_Sans'] font-medium text-[9px] min-[360px]:text-[10px] min-[390px]:text-[11px] sm:text-[clamp(12px,2vw,16px)] leading-[1.15] sm:leading-normal px-1 min-[360px]:px-1.5 sm:px-3 md:px-4 py-2 sm:py-0 sm:flex-1 sm:min-w-0 sm:h-[clamp(38px,5vw,52px)] cursor-pointer transition-all duration-300 sm:whitespace-nowrap ${
                                activeTab === tab
                                    ? "bg-white text-[#0D4A7A] shadow-sm"
                                    : "bg-transparent text-white"
                            }`}
                        >
                            {tab === "counselling"
                                ? "Counselling & Therapy"
                                : tab === "supervision"
                                ? "Supervision"
                                : "Training & Workshops"}
                        </div>
                    ))}
                </div>

                {/* Section Title - CENTERED */}
                <div className="mt-8 sm:mt-12 md:mt-16 lg:mt-[90px] text-center px-1">
                    <h2 className="text-[clamp(22px,5vw,35px)] font-medium mb-3 sm:mb-4 font-['Outfit'] text-[#0D4A7A] leading-[1.2]">
                        {getTitle()}
                    </h2>
                    <p
                        className={`text-[clamp(14px,2.5vw,20px)] leading-relaxed mx-auto whitespace-pre-line font-['DM_Sans'] font-medium text-[#333333] max-w-[930px] ${
                            activeTab === "training" ? "line-clamp-3 sm:line-clamp-none" : ""
                        }`}
                    >
                        {renderDescription(getDescription())}
                    </p>
                </div>

                {/* Cards Grid */}
                <div
                    className={`mt-8 sm:mt-10 md:mt-12 grid gap-4 sm:gap-5 md:gap-6 w-full cursor-pointer ${
                        isCounsellingTab
                            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                            : "grid-cols-1 md:grid-cols-2 max-w-[1000px] mx-auto"
                    }`}
                >
                    {getCards().map((card, index) => (
                        <div
                            key={index}
                            className="flex flex-col w-full transition-all duration-300 hover:-translate-y-1 sm:hover:-translate-y-2 rounded-[10px] bg-white shadow-[0px_10px_30px_rgba(0,0,0,0.05)] overflow-hidden max-w-full h-full"
                        >
                            {/* Image */}
                            <div
                                onClick={() => {
                                    if (isCounsellingTab) {
                                      setLocation(counsellingRoutes[index]);
                                    } else if (isSupervisionTab) {
                                      setLocation(supervisionRoutes[index]);
                                    } else if (isTrainingTab) {
                                      setLocation(trainingRoutes[index]);
                                    }
                                  }}
                                className="w-full relative shrink-0 transition-transform duration-300 hover:scale-[1.02] aspect-[16/10] sm:aspect-[2/1] md:aspect-auto md:h-[clamp(160px,22vw,206px)] bg-cover bg-center"
                                style={{
                                    backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%), url(${card.image})`,
                                }}
                            >
                                <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 font-['Outfit'] font-medium text-[clamp(14px,2vw,18px)] leading-[1.3] text-white line-clamp-2">
                                    {card.title}
                                </div>
                            </div>

                            {/* Body */}
                            <div className="flex flex-col flex-1 p-4 sm:p-5 min-w-0">
                                {/* Description */}
                                <p className="text-[13px] sm:text-[14px] md:text-[15px] leading-relaxed mb-3 sm:mb-4 font-['DM_Sans'] font-normal text-black">
                                    <span className="line-clamp-4 sm:line-clamp-5">
                                        {card.description}
                                    </span>

                                    <span
                                      onClick={() => {
                                        if (isCounsellingTab) {
                                          setLocation(counsellingRoutes[index]);
                                        } else if (isSupervisionTab) {
                                          setLocation(supervisionRoutes[index]);
                                        } else if (isTrainingTab) {
                                          setLocation(trainingRoutes[index]);
                                        }
                                      }}
                                        className="text-[#1B4585] underline cursor-pointer font-medium ml-1 inline-block mt-1"
                                    >
                                        Read more
                                    </span>
                                </p>

                                {/* Tags – Training tab */}
                                {isTrainingTab && card.tags && (
                                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                                        {card.tags.map((tag, tagIndex) => (
                                            <span
                                                key={tagIndex}
                                                className="font-['DM_Sans'] font-medium text-[11px] sm:text-[13px] md:text-[14px] px-2.5 sm:px-3 py-1 bg-[#F0F4F8] text-[#1B4585] rounded-full"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Book an Appointment Button */}
                                <button
                                        onClick={() => openModal(card.appointmentSelection || card.title)}
                                        className={`flex items-center justify-center gap-2 mt-auto w-full cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] py-3 px-4 sm:py-3 sm:px-5 rounded-full border border-[#1B4585] font-['DM_Sans'] font-semibold text-[13px] sm:text-[14px] ${
                                            hoveredButton === `${activeTab}-${index}`
                                                ? "bg-[#1B4585] text-white"
                                                : "bg-white text-[#1B4585]"
                                        }`}
                                        onMouseEnter={() => setHoveredButton(`${activeTab}-${index}`)}
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
                                    </button>
                            </div>
                        </div>
                    ))}
                </div>
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