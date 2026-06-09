import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import axios from "axios";

export function OurTeam() {
    const [hoveredId, setHoveredId] = useState(null);
    const [team, setTeam] = useState([]);

    const sectionRef = useRef(null);
    const scrollContainerRef = useRef(null);

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"]
    });

    const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "5%"]);

    // FETCH TEAM API
    useEffect(() => {
        fetchTeam();
    }, []);

    const fetchTeam = async () => {
        try {
            const response = await axios.get("/api/team");

            const payload = response.data;

            const members = Array.isArray(payload)
                ? payload
                : Array.isArray(payload?.data)
                    ? payload.data
                    : Array.isArray(payload?.team)
                        ? payload.team
                        : Array.isArray(payload?.members)
                            ? payload.members
                            : [];

            setTeam(members);
        } catch (error) {
            console.error("Error fetching team:", error);
            setTeam([]);
        }
    };

    // AUTO SCROLL
    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;

        if (!scrollContainer) return;

        let animationId;
        let isHovering = false;
        let scrollDirection = 1;
        let lastTimestamp = 0;

        const SCROLL_SPEED = 120;

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

                const atRightEdge =
                    scrollContainer.scrollLeft + scrollContainer.clientWidth >=
                    scrollContainer.scrollWidth - 20;

                const atLeftEdge = scrollContainer.scrollLeft <= 20;

                if (atRightEdge) {
                    scrollDirection = -1;
                } else if (atLeftEdge) {
                    scrollDirection = 1;
                }

                scrollContainer.scrollLeft += scrollDirection * scrollAmount;
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
    }, []);

    return (
        <motion.section
            id="team"
            ref={sectionRef}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.8 }}
            className="relative w-full flex flex-col items-center pt-[40px] pb-[40px] overflow-hidden bg-[#F7F6F3]"
        >
            {/* Background Motion */}
            <motion.div
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{ y: bgY }}
            />

            <div className="w-full flex flex-col items-center">

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
                    Our team
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
                    Meet our counsellors
                </motion.h2>

                {/* Description */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-lg md:text-[20px] text-center mb-10 md:mb-[60px] text-black font-['DM_Sans'] font-normal leading-[1.6] max-w-[760px] px-5"
                >
                    Our team of accredited professionals are not just highly trained —
                    they are genuinely compassionate people who care about your wellbeing.
                </motion.p>

                {/* TEAM CARDS */}
                <div
                    ref={scrollContainerRef}
                    className="w-full overflow-x-auto scrollbar-hide cursor-grab"
                    style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                        WebkitOverflowScrolling: "touch"
                    }}
                >
                    <div className="flex gap-4 md:gap-6 w-max px-4 pt-[10px] pb-[30px]">

                        {(Array.isArray(team) ? team : []).map((member, index) => {

                            const isHovered = hoveredId === member.id;

                            return (
                                <motion.div
                                    key={member.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.05 }}
                                    className="w-[280px] md:w-[350px] flex-shrink-0 flex flex-col"
                                    onMouseEnter={() => setHoveredId(member.id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                >
                                    {/* CARD */}
                                    <div
                                        className="relative w-full h-[320px] md:h-[420px] rounded-[10px] shadow-sm overflow-hidden bg-white bg-cover bg-center bg-no-repeat"
                                        style={{
                                            backgroundImage: `url('${member.photoUrl}')`
                                        }}
                                    >
                                           {/* GRADIENT OVERLAY */}
    <div
        className="absolute inset-0 z-10"
        style={{
            background:
                "linear-gradient(180deg, rgba(0, 0, 0, 0.00) 48.5%, rgba(0, 0, 0, 0.80) 100%)"
        }}
    />

                                        {/* DEFAULT CONTENT */}
                                        {!isHovered && (
                                            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5 z-10">

                                                {/* NAME */}
                                                <h3 className="text-white text-xl md:text-[23px] font-medium mb-3 font-['DM_Sans']">
                                                    {member.name}
                                                </h3>

                                                {/* ROLE */}
                                                <p className="text-white text-sm md:text-[15px] font-medium font-['DM_Sans']">
                                                    {member.role}
                                                </p>

                                            </div>
                                        )}

                                        {/* HOVER CONTENT */}
                                        <AnimatePresence>
                                            {isHovered && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="absolute inset-0 bg-black/85 flex flex-col justify-end items-start p-6 md:p-8 z-20 text-left"
                                                >
                                                    {/* NAME */}
                                                    <motion.h4
                                                        initial={{ y: 20, opacity: 0 }}
                                                        animate={{ y: 0, opacity: 1 }}
                                                        className="text-white text-xl md:text-2xl font-semibold mb-2 font-['Outfit']"
                                                    >
                                                        {member.name}
                                                    </motion.h4>

                                                    {/* TITLE */}
                                                    <motion.p
                                                        initial={{ y: 20, opacity: 0 }}
                                                        animate={{ y: 0, opacity: 1 }}
                                                        transition={{ delay: 0.1 }}
                                                        className="text-white/80 text-sm md:text-[15px] mb-3 font-['DM_Sans']"
                                                    >
                                                        {member.title}
                                                    </motion.p>

                                                    {/* ROLE */}
                                                 {/* ROLE */}
<motion.div
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay: 0.15 }}
    className="mb-4 flex justify-start"
>
    <span className="inline-flex items-center px-0 py-1 text-white text-xs md:text-sm font-medium">
        {member.role}
    </span>
</motion.div>

                                                    {/* EXPERTISE */}
                                                    <motion.div
                                                        initial={{ y: 20, opacity: 0 }}
                                                        animate={{ y: 0, opacity: 1 }}
                                                        transition={{ delay: 0.2 }}
                                                        className="mb-4"
                                                    >
                                                        <h5 className="text-white font-medium mb-1">
                                                            Expertise:
                                                        </h5>

                                                        <p className="text-white/90 text-sm md:text-[15px] leading-relaxed">
                                                            {member.specialisations?.join(", ")}
                                                        </p>
                                                    </motion.div>

                                                    {/* BIO */}
                                                    <motion.p
                                                        initial={{ y: 20, opacity: 0 }}
                                                        animate={{ y: 0, opacity: 1 }}
                                                        transition={{ delay: 0.3 }}
                                                        className="text-white/80 text-sm md:text-[15px] leading-relaxed"
                                                    >
                                                        {member.bio}
                                                    </motion.p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </motion.section>
    );
}