import { Footer } from "@/components/layout/Footer";
import PractitionerCard from "@/components/ui/PractitionerCard";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const TeamPage = () => {
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch team members from API
    useEffect(() => {
        const fetchTeamMembers = async () => {
            try {
                const response = await fetch('/api/team');
                if (!response.ok) {
                    throw new Error('Failed to fetch team members');
                }
                const data = await response.json();

                setTeamMembers(Array.isArray(data) ? data : []);
                setLoading(false);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
                setLoading(false);
            }
        };

        fetchTeamMembers();
    }, []);

    // Show loading state
    if (loading) {
        return (
            <div className="w-full bg-white font-sans overflow-x-hidden min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B4585] mb-4"></div>
                    <p className="text-[#333] font-['DM_Sans']">Loading team members...</p>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="w-full bg-white font-sans overflow-x-hidden min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 font-['DM_Sans'] mb-4">Error: {error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="bg-[#1B4585] text-white px-6 py-2 rounded-full"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-white font-sans overflow-x-hidden">
            {/* Hero Section */}
            {/* Mobile: image on top, content below */}
            <div className="flex flex-col w-full md:hidden pt-[72px] min-[375px]:pt-[80px] sm:pt-[88px]">
                <div className="w-full bg-[#E8EEF5]">
                    <img
                        src="/assets/Group_3.png"
                        alt="WINGS counselling team"
                        className="w-full h-auto object-contain object-center"
                    />
                </div>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                    className="flex flex-col items-center justify-center text-center px-4 min-[375px]:px-6 py-8 min-[375px]:py-10 bg-white"
                >
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="text-[#0D4A7A] font-['Outfit'] font-semibold mb-4 min-[375px]:mb-6 text-[clamp(24px,7vw,32px)] leading-[1.15]"
                    >
                        The people behind your healing
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.8 }}
                        className="text-[#333] font-['DM_Sans'] font-normal mb-6 min-[375px]:mb-8 text-[clamp(14px,3.8vw,16px)] leading-[1.6] text-center max-w-[1001px]"
                    >
                        Our counsellors are not just highly trained professionals but they are genuinely compassionate people who care deeply about your wellbeing. Every practitioner at WINGS brings empathy, clinical expertise and a personal commitment to your journey.
                    </motion.p>

                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 1.0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center justify-center bg-[#1B4585] rounded-full transition-all hover:bg-[#16386b] hover:shadow-xl group px-6 min-[375px]:px-8 py-3.5 min-[375px]:py-4 w-fit min-w-[180px] min-[375px]:min-w-[200px]"
                        style={{ gap: '12px' }}
                        onClick={() => {
                            const teamSection = document.querySelector('#team-section');
                            teamSection?.scrollIntoView({ behavior: 'smooth' });
                        }}
                    >
                        <span className="text-white font-['DM_Sans'] font-semibold text-[15px] min-[375px]:text-[16px] whitespace-nowrap">
                            Explore our team
                        </span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M6 9L12 15L18 9" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </motion.button>
                </motion.div>
            </div>

            {/* Tablet, laptop & desktop: full image + chest-level text overlay */}
            <div className="relative hidden md:block w-full bg-[#E8EEF5]">
                <div className="relative w-full">
                    <img
                        src="/assets/Group_3 copy.png"
                        alt="WINGS counselling team"
                        className="w-full h-auto object-contain object-center block"
                    />

                    <div className="absolute inset-x-0 top-[42%] lg:top-[44%] xl:top-[46%] bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent pointer-events-none" />

                    <div className="absolute inset-x-0 top-[44%] md:top-[46%] lg:top-[48%] xl:top-[50%] flex flex-col items-center px-6 md:px-10 lg:px-[100px] pb-6 md:pb-8 lg:pb-10">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                            className="flex flex-col items-center justify-center text-center w-full max-w-[840px]"
                        >
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.6 }}
                                className="text-white font-['Outfit'] font-semibold mb-3 md:mb-4 lg:mb-5 text-[clamp(32px,4vw,56px)] leading-[1.1]"
                            >
                                The people behind your healing
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.8 }}
                                className="text-white font-['DM_Sans'] font-normal mb-4 md:mb-5 lg:mb-6 text-[clamp(15px,1.6vw,19px)] leading-[1.55] text-center max-w-[900px]"
                            >
                                Our counsellors are not just highly trained professionals-they are genuinely compassionate people who care deeply about your wellbeing. Every practitioner at WINGS brings empathy, clinical expertise, and a personal commitment to your journey.
                            </motion.p>

                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 1.0 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center justify-center bg-[#1B4585] rounded-full transition-all hover:bg-[#16386b] hover:shadow-xl group px-7 md:px-8 py-3.5 md:py-4 w-fit min-w-[200px] lg:min-w-[240px]"
                                style={{ gap: '12px' }}
                                onClick={() => {
                                    const teamSection = document.querySelector('#team-section');
                                    teamSection?.scrollIntoView({ behavior: 'smooth' });
                                }}
                            >
                                <span className="text-white font-['DM_Sans'] font-semibold text-[clamp(15px,1.4vw,20px)] whitespace-nowrap">
                                    Explore our team
                                </span>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M6 9L12 15L18 9" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </motion.button>
                        </motion.div>
                    </div>
                </div>
            </div>

        

            {/* Practitioners Section */}
            <section id="team-section" className="relative w-full bg-[#F5F4F1] flex flex-col items-center pt-10 pb-20 lg:pb-32 overflow-x-hidden">
                <div className="w-full navbar-align-outer">
                    <div className="navbar-align-inner flex flex-col items-center w-full">


                        <h2 className="text-[#0D4A7A] font-['Outfit'] font-medium text-center mb-5 text-[28px] sm:text-[32px] md:text-[35px] leading-tight">
                            Meet the whole team
                        </h2>

                        <p className="text-[#333] font-['DM_Sans'] font-medium text-center mb-12 sm:mb-14 w-full max-w-[994px] text-[16px] sm:text-[18px] md:text-[20px] leading-relaxed">
                        Each counsellor brings a unique set of skills, languages and therapeutic approaches so you can find the right fit for your journey.
                        </p>

                        {teamMembers.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8 w-full items-stretch">
                                {teamMembers.map((member) => (
                                    <PractitionerCard key={member.id} practitioner={member} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 w-full">
                                <p className="text-[#666] font-['DM_Sans'] font-medium text-[18px]">
                                    No team members found.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default TeamPage;