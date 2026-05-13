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
            const response = await axios.get("http://localhost:5000/api/team");
            setTeam(response.data);
        } catch (error) {
            console.error("Error fetching team:", error);
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
            className="relative w-full flex flex-col items-center py-12 md:py-20 overflow-hidden"
            style={{ background: "#F7F6F3" }}
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
                        padding: "6px 16px",
                        borderRadius: "9999px",
                        background: "linear-gradient(90deg, #0D4A7A 0%, #1888E0 100%)",
                        color: "#FFF",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: "11px",
                        fontWeight: "700",
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        marginBottom: "24px"
                    }}
                >
                    OUR TEAM
                </motion.div>

                {/* Heading */}
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-[32px] md:text-[45px] text-center mb-6"
                    style={{
                        color: "#000",
                        fontFamily: "Outfit, sans-serif",
                        fontWeight: "600",
                        lineHeight: "1.1",
                        padding: "0 20px"
                    }}
                >
                    Meet our counsellors
                </motion.h2>

                {/* Description */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-lg md:text-[20px] text-center mb-10 md:mb-[60px]"
                    style={{
                        color: "#000",
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: "400",
                        lineHeight: "1.6",
                        maxWidth: "760px",
                        padding: "0 20px"
                    }}
                >
                    Our team of accredited professionals are not just highly trained —
                    they are genuinely compassionate people who care about your wellbeing.
                </motion.p>

                {/* TEAM CARDS */}
                <div
                    ref={scrollContainerRef}
                    className="w-full overflow-x-auto scrollbar-hide"
                    style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                        cursor: "grab",
                        WebkitOverflowScrolling: "touch"
                    }}
                >
                    <div className="flex gap-4 md:gap-6 w-max px-4 pt-[10px] pb-[30px]">

                        {team.map((member, index) => {
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
                                        className="relative w-full h-[320px] md:h-[420px] rounded-[10px] shadow-sm overflow-hidden"
                                        style={{
                                            backgroundImage: `url('${member.photoUrl}')`,
                                            backgroundSize: "cover",
                                            backgroundPosition: "center",
                                            backgroundRepeat: "no-repeat",
                                            backgroundColor: "#FFF",
                                        }}
                                    >
                                        {/* FULL IMAGE OVERLAY */}
                                        <div
                                            className="absolute inset-0"
                                            style={{
                                                background:
                                                    "linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.85) 100%)",
                                            }}
                                        />

                                        {/* DEFAULT CONTENT */}
                                        {!isHovered && (
                                            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5 z-10">
                                                <h3
                                                    className="text-white text-xl md:text-[23px] font-medium mb-1"
                                                    style={{
                                                        fontFamily: "'DM Sans', sans-serif"
                                                    }}
                                                >
                                                    {member.name}
                                                </h3>

                                                <p
                                                    className="text-white/90 text-sm md:text-[15px]"
                                                    style={{
                                                        fontFamily: "'DM Sans', sans-serif"
                                                    }}
                                                >
                                                    {member.credentials?.join(", ")}
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
                                                    className="absolute inset-0 bg-black/80 flex flex-col justify-end p-6 md:p-8 z-20"
                                                >
                                                    <motion.h4
                                                        initial={{ y: 20, opacity: 0 }}
                                                        animate={{ y: 0, opacity: 1 }}
                                                        className="text-white text-xl md:text-2xl font-semibold mb-2"
                                                        style={{
                                                            fontFamily: "Outfit, sans-serif"
                                                        }}
                                                    >
                                                        {member.name}
                                                    </motion.h4>

                                                    <motion.p
                                                        initial={{ y: 20, opacity: 0 }}
                                                        animate={{ y: 0, opacity: 1 }}
                                                        transition={{ delay: 0.1 }}
                                                        className="text-white/80 text-sm md:text-[15px] mb-4"
                                                        style={{
                                                            fontFamily: "'DM Sans', sans-serif"
                                                        }}
                                                    >
                                                        {member.title}
                                                    </motion.p>

                                                    <motion.div
                                                        initial={{ y: 20, opacity: 0 }}
                                                        animate={{ y: 0, opacity: 1 }}
                                                        transition={{ delay: 0.2 }}
                                                        className="mb-4"
                                                    >
                                                        <h5 className="text-white font-medium mb-1">
                                                            Expertise:
                                                        </h5>

                                                        <p className="text-white/90 text-sm md:text-[15px]">
                                                            {member.specialisations?.join(", ")}
                                                        </p>
                                                    </motion.div>

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