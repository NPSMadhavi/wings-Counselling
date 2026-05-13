import { Footer } from "@/components/layout/Footer";
import { MoveDown, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const TeamPage = () => {
    return (
        <div className="w-full bg-white font-sans overflow-x-hidden">
            {/* Hero Section */}
            <section
                className="relative w-full flex items-center justify-center overflow-hidden shrink-0"
                style={{
                    background: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url("/assets/Group_3 copy.png")',
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    minHeight: "480px",
                    height: "clamp(480px, 55vw, 790px)",
                }}
            >

                {/* Content Container */}
                <motion.div
                    className="relative z-10 flex flex-col items-center text-center px-6 md:px-12 lg:px-[150px] w-full max-w-[1440px]"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                >

                    {/* Tag: OUR TEAM */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="flex items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md mb-6 md:mb-8 px-4 py-1.5 w-fit"
                    >
                        <span
                            className="text-white font-['Plus_Jakarta_Sans'] font-semibold text-[12px] leading-[16px] tracking-[1.2px] uppercase whitespace-nowrap"
                        >
                            OUR TEAM
                        </span>
                    </motion.div>

                    {/* Heading */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="text-white font-['Outfit'] font-semibold mb-6 md:mb-8 text-[32px] sm:text-[44px] md:text-[54px] lg:text-[60px] leading-[1.1] md:leading-[1.1]"
                        style={{
                            width: '100%',
                            maxWidth: '843px',
                        }}
                    >
                        The people behind your healing
                    </motion.h1>

                    {/* Subtext with increased spacing */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.8 }}
                        className="text-white font-['DM_Sans'] font-normal mb-6 text-[16px] sm:text-[18px] md:text-[20px] leading-relaxed md:leading-[1.2]"
                        style={{
                            width: '100%',
                            maxWidth: '1001px',
                        }}
                    >
                        Our counsellors are not just highly trained professionals — they are genuinely compassionate people who care deeply about your wellbeing.
                    </motion.p>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 1.0 }}
                        className="text-white font-['DM_Sans'] font-normal mb-10 md:mb-14 text-[16px] sm:text-[18px] md:text-[20px] leading-relaxed md:leading-[1.2]"
                        style={{
                            width: '100%',
                            maxWidth: '1001px',
                        }}
                    >
                        Every practitioner at WINGS brings empathy, clinical expertise, and a personal commitment to your journey.
                    </motion.p>

                    {/* CTA Button with larger arrow */}
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 1.2 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center justify-center bg-[#1B4585] rounded-full transition-all hover:bg-[#16386b] hover:shadow-xl group px-8 py-4 w-fit min-w-[240px]"
                        style={{
                            gap: '12px',
                        }}
                        onClick={() => {
                            const directorSection = document.querySelector('section:nth-of-type(2)');
                            directorSection?.scrollIntoView({ behavior: 'smooth' });
                        }}
                    >
                        <span className="text-white font-['DM_Sans'] font-semibold text-[18px] md:text-[20px] whitespace-nowrap">
                            Explore Our Team
                        </span>
                        <MoveDown className="text-white w-8 h-8 group-hover:translate-y-1 transition-transform" />
                    </motion.button>
                </motion.div>
            </section>

            {/* Director Section - Refactored for Responsiveness */}
            <section className="relative w-full bg-[#FFFEFA] py-20 lg:py-32 px-6 md:px-12 lg:px-[150px]">
                <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row items-center lg:items-start gap-12 lg:gap-24">

                    {/* Left Side: Image Composition */}
                    <div className="relative flex-shrink-0 w-full max-w-[500px] lg:w-[479px]">
                        {/* Decorative Blue Box - Behind the image */}
                        <div
                            className="absolute bg-[#0D4A7A] rounded-[20px] -bottom-3 -right-3 lg:-bottom-6 lg:-right-6 w-full h-full"
                            style={{
                                zIndex: 0,
                            }}
                        />

                        {/* Main Profile Image */}
                        <img
                            src="/assets/Shasikaran.jpg"
                            alt="Mr. Shasikaran Kalimuthu"
                            className="w-full aspect-[479/640] rounded-[20px] object-cover relative shadow-xl"
                            style={{
                                zIndex: 1,
                                position: 'relative',
                            }}
                        />

                        {/* Experience Badge - Floating Box at bottom right */}
                        <div
                            className="absolute z-20 bg-white rounded-[10px] shadow-[0_15px_35px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center border border-gray-100 bottom-[-18px] right-[-12px] md:bottom-[-25px] md:right-[-20px] lg:bottom-[-25px] lg:right-[-20px]"
                            style={{
                                width: '150px',
                                height: '90px',
                            }}
                        >
                            <span className="font-['DM_Sans'] font-bold text-[32px] leading-none text-[#000]">16+</span>
                            <span className="font-['DM_Sans'] font-medium text-[12px] leading-tight text-[#666] mt-2 text-center px-2">Years of Experience</span>
                        </div>
                    </div>

                    {/* Right Side: Content */}
                    <div className="flex flex-col items-start text-left w-full">

                        {/* Role Tag */}
                        <div
                            className="flex items-center justify-center rounded-full bg-[#0D4A7A2E] py-1.5 px-4 w-fit"
                        >
                            <span className="text-[#0D4A7A] font-['Plus_Jakarta_Sans'] font-semibold text-[11px] leading-[16px] tracking-[1.2px] uppercase whitespace-nowrap">
                                DIRECTOR & SENIOR PRACTITIONER
                            </span>
                        </div>

                        {/* Name */}
                        <h2
                            className="text-[#000] font-['Outfit'] font-medium mt-[22px] text-[32px] md:text-[40px] leading-tight"
                        >
                            Mr. Shasikaran Kalimuthu
                        </h2>

                        {/* Description */}
                        <div className="mt-[20px] flex flex-col gap-6 w-full max-w-full md:max-w-[654px]">
                            <p className="font-['DM_Sans'] font-medium text-[16px] md:text-[18px] leading-relaxed text-[#333]">
                                Shasi is the Director of WINGS Counselling Centre and one of Singapore's most experienced social service professionals. With over 16 years of dedicated work within disadvantaged communities, he brings both deep expertise and genuine compassion to his leadership and practice.
                            </p>
                            <p className="font-['DM_Sans'] font-medium text-[16px] md:text-[18px] leading-relaxed text-[#333]">
                                His past positions include Head of Home at Ramakrishna Mission Boys Home and Head of Social Work Department at the Singapore Association of the Visually Handicapped (SAVH). He trains upcoming cohorts of helping professionals through SSI/NCSS and provides consultancy to statutory boards across Singapore's social service landscape.
                            </p>
                        </div>

                        {/* Qualifications Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-12 mt-10 w-full max-w-full md:max-w-[654px]">
                            {[
                                "Bachelors in Social Work",
                                "ACLP Certified Adult Educator (SSI/NCSS)",
                                "Masters in Counselling",
                                "Registered Field Work Supervisor",
                                "Registered Social Worker",
                                "Registered Social Work Supervisor"
                            ].map((q, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="w-[15px] h-[15px] rounded-full bg-[#1E3A8A] shrink-0" />
                                    <span className="font-['DM_Sans'] font-medium text-[16px] md:text-[17px] leading-tight text-[#333]">
                                        {q}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Specialization Tags */}
                        <div className="flex flex-wrap gap-3 md:gap-4 mt-10">
                            {[
                                "Disadvantaged Youth",
                                "Family Support",
                                "Rehabilitation",
                                "Training & Supervision",
                                "Community Consultation"
                            ].map((tag, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-center px-4 rounded-[10px] bg-[#0D4A7A2E] text-[#0D4A7A] font-['DM_Sans'] font-medium text-[13px] md:text-[14px]"
                                    style={{
                                        height: '35px',
                                    }}
                                >
                                    {tag}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Practitioners Section - With proper image visibility and reduced gap */}
            <section
                className="relative w-full bg-white flex flex-col items-center pt-10 pb-20 lg:pb-32"
            >
                <div className="w-full max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-[150px] flex flex-col items-center">

                    {/* Section Header */}
                    {/* Tag: OUR PRACTITIONERS */}
                    <div
                        className="flex items-center justify-center rounded-full bg-gradient-to-r from-[#0D4A7A] to-[#1888E0] mb-[20px] px-4 py-1.5 w-fit mx-auto lg:mx-0"
                    >
                        <span className="text-white font-['Plus_Jakarta_Sans'] font-semibold text-[12px] leading-[16px] tracking-[1.2px] uppercase whitespace-nowrap">
                            OUR PRACTITIONERS
                        </span>
                    </div>

                    {/* Heading: Meet the whole team */}
                    <h2
                        className="text-[#000] font-['Outfit'] font-medium text-center mb-[20px] text-[28px] sm:text-[32px] md:text-[35px] leading-tight max-w-[90vw]"
                    >
                        Meet the whole team
                    </h2>

                    {/* Subtext with proper spacing */}
                    <p
                        className="text-[#333] font-['DM_Sans'] font-medium text-center mb-4 w-full max-w-[994px] text-[16px] sm:text-[18px] md:text-[20px] leading-relaxed md:leading-[1.2]"
                    >
                        Each counsellor brings a unique set of skills, languages, and therapeutic approaches
                    </p>
                    <p
                        className="text-[#333] font-['DM_Sans'] font-medium text-center mb-[50px] w-full max-w-[994px] text-[16px] sm:text-[18px] md:text-[20px] leading-relaxed md:leading-[1.2]"
                    >
                        — so you can find the right fit for your journey.
                    </p>

                    {/* Filter Tabs */}
                    <div className="flex flex-wrap justify-center gap-[10px] md:gap-[15px] mb-[40px] md:mb-[60px] w-full">
                        {[
                            "All Practitioners",
                            "Individuals",
                            "Couples & Families",
                            "Children & Youth",
                            "Supervision"
                        ].map((tab, i) => (
                            <button
                                key={i}
                                className={`flex items-center justify-center rounded-[12px] md:rounded-[20px] font-['DM_Sans'] font-medium text-[16px] md:text-[20px] leading-[100%] transition-all whitespace-nowrap px-6 py-3 md:py-0 md:h-[60px]
                                    ${i === 0
                                        ? "bg-[#1E3A8A] text-white shadow-md md:w-[220px]"
                                        : "bg-white text-[#333] border border-gray-200 hover:border-[#1E3A8A] md:px-[30px]"}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Practitioners Grid - Increased gap between cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-[40px] gap-y-[50px] w-full justify-items-center">
                        {[
                            {
                                name: "Ms. Carolyn",
                                title: "Counsellor · MAP (Counselling Psychology)",
                                experience: "5+ Years Experience",
                                bio: "Michael holds a Masters in Applied Psychology (Counselling Psychology) and has been practising for more than 5 years. He is fluent in English and Malay, and brings a deeply client-centred approach to every session.",
                                image: "/assets/Carolyn1.jpg",
                                tags: ["CBT", "Emotion-Focused Therapy", "Youth"]
                            },
                            {
                                name: "Mr. James",
                                title: "Counsellor · Masters in Counselling",
                                experience: "7+ Years Experience",
                                bio: "Sunita holds a Bachelor of Science in Psychology and a Master's degree in Counselling. Her passion for supporting youth is evident across all her work — both professional and voluntary.",
                                image: "/assets/James1.jpg",
                                tags: ["Clinical Supervision", "Couples", "Eclectic Therapy"]
                            },
                            {
                                name: "Ms. Madhura",
                                title: "Registered Counsellor & Registered Social Worker",
                                experience: "12+ Years Experience",
                                bio: "Sin Teck is a Registered Counsellor with the Singapore Association of Counselling (SAC) and a Registered Social Worker with the Singapore Association of Social Workers (SASW).",
                                image: "/assets/Madhura1.jpg",
                                tags: ["Family Therapy", "Social Work", "Divorce Support"]
                            },
                            {
                                name: "Ms. Mala",
                                title: "Registered Counsellor · SAC",
                                experience: "10+ Years Experience",
                                bio: "Veronica is a Registered Counsellor with the Singapore Association for Counselling (SAC). She holds a Master's degree in Counselling and a Bachelor's Degree in Psychology.",
                                image: "/assets/Mala1.jpg",
                                tags: ["Children", "Bilingual Practice", "Community Mental Health"]
                            },
                            {
                                name: "Ms. Shalini",
                                title: "Provisional Clinical Member · SAC",
                                experience: "8+ Years Experience",
                                bio: "Shu Zhen is a Provisional Clinical Member with the Singapore Association of Counselling and a Graduate Member with the British Psychological Society.",
                                image: "/assets/Shalini1.jpg",
                                tags: ["Post-Traumatic Growth", "Transactional Analysis"]
                            },
                            {
                                name: "Mr. SinTeck",
                                title: "Counsellor · Masters in Applied Psychology",
                                experience: "10+ Years Experience",
                                bio: "Azri holds a Masters in Applied Psychology (Counselling Psychology) and has been practising for more than 5 years. He is fluent in English and Malay.",
                                image: "/assets/Sinteck1.jpg",
                                tags: ["Emotion-Focused Therapy", "Substance Use"]
                            }
                        ].map((p, i) => (
                            <div
                                key={i}
                                className="bg-white rounded-[10px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] transition-all duration-300 overflow-hidden flex flex-col group w-full max-w-full md:max-w-[400px]"
                                style={{ height: 'auto', minHeight: '540px' }}
                            >
                                {/* Image Layout - Fixed visibility */}
                                <div className="relative w-full h-[274px] overflow-hidden bg-gray-200">
                                    <img
                                        src={p.image}
                                        alt={p.name}
                                        className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                                        loading="eager"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                                    <div className="absolute bottom-5 left-5 right-5 text-left">
                                        <h3 className="text-white font-['DM_Sans'] font-semibold text-[20px] leading-[100%] mb-[8px]">{p.name}</h3>
                                        <p className="text-white/90 font-['DM_Sans'] font-normal text-[14px] leading-[100%]">{p.title}</p>
                                    </div>
                                </div>

                                <div className="p-[20px] flex flex-col flex-grow">
                                    {/* Experience Dot Layout */}
                                    <div className="flex items-center gap-[10px] mb-[12px]">
                                        <div className="w-[10px] h-[10px] rounded-full bg-[#1E3A8A]" />
                                        <span className="text-[#1E3A8A] font-['DM_Sans'] font-normal text-[15px] leading-[100%]">{p.experience}</span>
                                    </div>

                                    {/* Bio */}
                                    <p className="text-[#333] font-['DM_Sans'] font-normal text-[14px] leading-[22px] mb-[15px]">
                                        {p.bio}
                                    </p>

                                    {/* Tags - In One Line - No scroll */}
                                    <div className="flex flex-wrap gap-[8px] mb-[12px]">
                                        {p.tags?.map((tag, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-center px-[12px] py-[6px] rounded-[8px] bg-[#0D4A7A2E] text-[#0D4A7A] font-['DM_Sans'] font-medium text-[12px] leading-[100%] whitespace-nowrap"
                                            >
                                                {tag}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Read Full Profile - Reduced gap */}
                                    {/* <button className="mt-[8px] flex items-center text-[#1E3A8A] font-['DM_Sans'] font-medium text-[14px] leading-[100%] hover:underline group/btn">
                                        Read Full Profile
                                        <span className="ml-1 transition-transform group-hover/btn:translate-x-1">→</span>
                                    </button> */}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default TeamPage;