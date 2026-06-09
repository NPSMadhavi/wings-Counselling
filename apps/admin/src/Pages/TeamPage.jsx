import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Mail } from "lucide-react";

const LinkedinIcon = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 114.126 0 2.063 2.063 0 01-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
);

const getPractitionerTags = (practitioner) => {
    const tags = [
        ...(Array.isArray(practitioner.specialisations) ? practitioner.specialisations : []),
        ...(Array.isArray(practitioner.credentials) ? practitioner.credentials : []),
    ].filter(Boolean);

    return tags.slice(0, 4);
};

const getPractitionerDesignation = (practitioner) => {
    const role = practitioner.role?.trim();
    const title = practitioner.title?.trim();

    if (role && title) return `${role} · ${title}`;
    return role || title || "";
};

const PractitionerCard = ({ practitioner, resolveImageUrl }) => {
    const designation = getPractitionerDesignation(practitioner);
    const tags = getPractitionerTags(practitioner);
    const linkedinUrl = practitioner.linkedinUrl || practitioner.linkedin_url;
    const email = practitioner.email;

    return (
        <motion.article
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45 }}
            className="bg-white rounded-[10px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.08)] text-left flex flex-col h-full hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] transition-all duration-300 group"
        >
            {/* Image */}
            <div className="relative h-[290px] shrink-0 overflow-hidden bg-[#E8EEF5]">
                <img
                    src={resolveImageUrl(practitioner.photoUrl)}
                    alt={practitioner.name}
                    className="w-full h-full object-cover object-[center_15%]"
                    loading="lazy"
                    onError={(e) => {
                        e.currentTarget.src = "/assets/placeholder-image.jpg";
                    }}
                />
                <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />
                <div className="absolute bottom-5 left-5 right-5 text-white">
                    <h3 className="font-['DM_Sans'] text-[20px] font-semibold leading-tight">
                        {practitioner.name}
                    </h3>
                    {designation && (
                        <p className="mt-2 font-['DM_Sans'] text-[14px] sm:text-[15px] leading-snug text-white/90 line-clamp-2">
                            {designation}
                        </p>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col flex-1 min-h-[275px]">
                {practitioner.experience && (
                    <p className="font-['DM_Sans'] text-[15px] text-[#214E9A] font-medium leading-snug">
                        <span className="mr-1">●</span>
                        {practitioner.experience}
                    </p>
                )}

                {practitioner.bio && (
                    <p className="mt-5 font-['DM_Sans'] text-[15px] leading-[24px] text-[#222] line-clamp-4 flex-1">
                        {practitioner.bio}
                    </p>
                )}

                <div className="mt-auto pt-6 flex flex-wrap items-center justify-between gap-3">
                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-3 items-center flex-1">
                            {tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="bg-[#DCE8F1] text-[#0F4F7C] rounded-[8px] px-3 py-2 font-['DM_Sans'] text-[12px] font-medium whitespace-nowrap inline-flex items-center justify-center min-h-[32px]"
                                >
                                    {tag.length > 28 ? `${tag.substring(0, 25)}...` : tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {(linkedinUrl || email) && (
                        <div className="flex items-center gap-2 shrink-0">
                            {linkedinUrl && (
                                <a
                                    href={linkedinUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`${practitioner.name} on LinkedIn`}
                                    className="w-9 h-9 rounded-full border border-[#DCE8F1] bg-white flex items-center justify-center text-[#0F4F7C] hover:bg-[#0F4F7C] hover:text-white transition-colors"
                                >
                                    <LinkedinIcon size={16} />
                                </a>
                            )}
                            {email && (
                                <a
                                    href={`mailto:${email}`}
                                    aria-label={`Email ${practitioner.name}`}
                                    className="w-9 h-9 rounded-full border border-[#DCE8F1] bg-white flex items-center justify-center text-[#0F4F7C] hover:bg-[#0F4F7C] hover:text-white transition-colors"
                                >
                                    <Mail size={16} />
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </motion.article>
    );
};

const TeamPage = () => {
    const [practitioners, setPractitioners] = useState([]);
    const [director, setDirector] = useState(null);
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
                
                // Separate director from practitioners based on role
                const directorData = data.find(m => m.role === "Senior director" || m.title?.includes("Director"));
                const practitionersData = data.filter(m => m.role !== "Senior director" && !m.title?.includes("Director"));
                
                setDirector(directorData || null);
                setPractitioners(practitionersData);
                setLoading(false);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
                setLoading(false);
            }
        };

        fetchTeamMembers();
    }, []);

    // Helper function to resolve image URL
    const resolveImageUrl = (url) => {
        if (!url) return "/assets/placeholder-image.jpg";
        if (url.startsWith('http')) return url;
        if (url.startsWith('/')) return url;
        return `/${url}`;
    };

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
                <motion.div
                    className="relative z-10 flex flex-col items-center text-center px-6 md:px-12 lg:px-[150px] w-full max-w-[1440px]"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="flex items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md mb-6 md:mb-8 px-4 py-1.5 w-fit"
                    >
                        <span className="text-white font-['Plus_Jakarta_Sans'] font-semibold text-[20px] leading-[16px] tracking-[1.2px] whitespace-nowrap">
                            Our team
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="text-white font-['Outfit'] font-semibold mb-6 md:mb-8 text-[32px] sm:text-[44px] md:text-[54px] lg:text-[60px] leading-[1.1] md:leading-[1.1]"
                        style={{ width: '100%', maxWidth: '843px' }}
                    >
                        The people behind your healing
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.8 }}
                        className="text-white font-['DM_Sans'] font-normal mb-6 text-[16px] sm:text-[18px] md:text-[20px] leading-[2] text-center"
                        style={{ width: '100%', maxWidth: '1001px' }}
                    >
                        Our counsellors are not just highly trained professionals — they are genuinely compassionate people who care deeply about your wellbeing. Every practitioner at WINGS brings empathy, clinical expertise, and a personal commitment to your journey.
                    </motion.p>
                    
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 1.2 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center justify-center bg-[#1B4585] rounded-full transition-all hover:bg-[#16386b] hover:shadow-xl group px-8 py-4 w-fit min-w-[240px]"
                        style={{ gap: '12px' }}
                        onClick={() => {
                            const directorSection = document.querySelector('#director-section');
                            directorSection?.scrollIntoView({ behavior: 'smooth' });
                        }}
                    >
                        <span className="text-white font-['DM_Sans'] font-semibold text-[18px] md:text-[20px] whitespace-nowrap">
                            Explore our team
                        </span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M6 9L12 15L18 9" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </motion.button>
                </motion.div>
            </section>

          {/* Director Section */}
            <section className="relative w-full bg-[#FFFEFA] py-20 lg:py-32 px-6 md:px-12 lg:px-[150px]">
                <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row items-center lg:items-start gap-12 lg:gap-24">
                    {/* Left Side: Image Composition */}
                    <div className="relative flex-shrink-0 w-full max-w-[500px] lg:w-[479px]">
                        <div className="absolute bg-[#0D4A7A] rounded-[20px] -bottom-3 -right-3 lg:-bottom-6 lg:-right-6 w-full h-full" style={{ zIndex: 0 }} />
                        <img
                            src="/assets/ShasiImage.png"
                            alt="Mr. Shasikaran Kalimuthu"
                            className="w-full h-[600px] aspect-[479/640] rounded-[20px] object-cover relative shadow-xl text-#0D4A7A"
                            style={{ zIndex: 1, position: 'relative' }}
                        />
                        {/* Experience Badge */}
                        <div
                            className="absolute z-20 bg-white border border-[#E5E7EB] flex flex-col items-center justify-center"
                            style={{
                                width: "150px",
                                height: "92px",
                                borderRadius: "14px",
                                bottom: "-38px",
                                right: "25px",
                                boxShadow: "0px 10px 30px rgba(0,0,0,0.18)",
                            }}
                        >
                            <span className="font-['DM_Sans'] font-bold text-[34px] leading-none text-[#111827]">16+</span>
                            <span className="font-['DM_Sans'] font-medium text-[13px] leading-[16px] text-[#6B7280] text-center mt-2">Years of Experience</span>
                        </div>
                    </div>

                    {/* Right Side: Content */}
                    <div className="flex flex-col items-start text-left w-full">
                        <div className="flex items-center justify-center rounded-full bg-[#0D4A7A2E] py-1.5 px-4 w-fit">
                            <span className="text-[#0D4A7A] font-['Plus_Jakarta_Sans'] font-semibold text-[20px] px-[20px] py-[8px] leading-[16px] tracking-[1.2px] whitespace-nowrap">
                                Director & Senior practitioner
                            </span>
                        </div>
                        <h2 className="text-[#0D4A7A] font-['Outfit'] font-medium mt-[22px] text-[32px] md:text-[40px] leading-tight">
                            Mr. Shasikaran Kalimuthu
                        </h2>
                        <div className="mt-[20px] flex flex-col gap-6 w-full max-w-full md:max-w-[750px]">
                            <p className="font-['DM_Sans'] font-medium text-[16px] md:text-[18px] leading-relaxed text-[#333]">
                                Shasi is the Director of WINGS Counselling Centre and one of Singapore's most experienced social service professionals. With over 16 years of dedicated work within disadvantaged communities, he brings both deep expertise and genuine compassion to his leadership and practice.
                            </p>
                            <p className="font-['DM_Sans'] font-medium text-[16px] md:text-[18px] leading-relaxed text-[#333]">
                                His past positions include Head of Home at Ramakrishna Mission Boys Home and Head of Social Work Department at the Singapore Association of the Visually Handicapped (SAVH). He trains upcoming cohorts of helping professionals through SSI/NCSS and provides consultancy to statutory boards across Singapore's social service landscape.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-12 mt-10 w-full max-w-full md:max-w-[654px]">
                            {[
                                "Bachelors in social work",
                                "ACLP Certified adult educator",
                                "Masters in counselling",
                                "Registered field work supervisor",
                                "Registered social worker",
                                "Registered social work supervisor"
                            ].map((q, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="w-[15px] h-[15px] rounded-full bg-[#1E3A8A] shrink-0" />
                                    <span className="font-['DM_Sans'] font-medium text-[16px] md:text-[17px] leading-tight text-[#333]">{q}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-3 md:gap-4 mt-10">
                            {[
                                "Disadvantaged youth",
                                "Family support",
                                "Rehabilitation",
                                "Training & Supervision",
                                "Community consultation"
                            ].map((tag, i) => (
                                <div key={i} className="flex items-center justify-center px-4 rounded-[10px] bg-[#0D4A7A2E] text-[#0D4A7A] font-['DM_Sans'] font-medium text-[13px] md:text-[14px]" style={{ height: '35px' }}>
                                    {tag}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

       {/* Practitioners Section */}
            <section className="relative w-full bg-[#F5F4F1] flex flex-col items-center pt-10 pb-20 lg:pb-32 overflow-x-hidden">
                <div className="navbar-align-outer w-full ">
                    <div className="navbar-align-inner flex flex-col items-center w-full">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="inline-flex items-center justify-center px-5 py-2 rounded-full bg-gradient-to-r from-[#0D4A7A] to-[#42A0BD] text-white font-['Plus_Jakarta_Sans'] text-[20px] font-semibold tracking-[1.2px] mb-6 min-w-[180px] h-[42px]"
                        >
                            Our practitioners
                        </motion.div>

                        <h2 className="text-[#0D4A7A] font-['Outfit'] font-medium text-center mb-5 text-[28px] sm:text-[32px] md:text-[35px] leading-tight">
                            Meet the whole team
                        </h2>

                        <p className="text-[#333] font-['DM_Sans'] font-medium text-center mb-12 sm:mb-14 w-full max-w-[994px] text-[16px] sm:text-[18px] md:text-[20px] leading-relaxed">
                            Each counsellor brings a unique set of skills, languages, and therapeutic approaches — so you can find the right fit for your journey.
                        </p>

                        {practitioners.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full items-stretch">
                                {practitioners.map((p) => (
                                    <PractitionerCard
                                        key={p.id}
                                        practitioner={p}
                                        resolveImageUrl={resolveImageUrl}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 w-full">
                                <p className="text-[#666] font-['DM_Sans'] font-medium text-[18px]">
                                    No practitioners found.
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