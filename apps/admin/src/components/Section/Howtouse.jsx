import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useState, useEffect, useRef } from "react";

const steps = [
    {
        number: "01",
        title: "Share your concern",
        description: "Reach out via phone, WhatsApp, or our booking form. Tell us what you're going through in a safe, confidential space.",
    },
    {
        number: "02",
        title: "Get matched with a counsellor",
        description: "We'll connect you with the right professional based on your needs, preferences, and situation.",
    },
    {
        number: "03",
        title: "Start sessions",
        description: "Begin your personalized counselling journey at your own pace, in-person or online.",
    }
];

// Animation variants for each step - SLOWER TIMING
const stepVariants = {
    hidden: {
        opacity: 0,
        y: 60,
        scale: 0.9
    },
    visible: (custom) => ({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: "spring",
            stiffness: 200,
            damping: 20,
            delay: custom * 0.6
        }
    })
};

const circleVariants = {
    hidden: {
        scale: 0,
        rotate: -180
    },
    visible: (custom) => ({
        scale: 1,
        rotate: 0,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 15,
            delay: custom * 0.6 + 0.3
        }
    }),
    hover: {
        scale: 1.1,
        boxShadow: "0 15px 30px rgba(13, 74, 122, 0.4)",
        transition: {
            type: "spring",
            stiffness: 400,
            damping: 10
        }
    },
    tap: {
        scale: 0.95
    }
};

const titleVariants = {
    hidden: {
        opacity: 0,
        x: -40
    },
    visible: (custom) => ({
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.6,
            delay: custom * 0.6 + 0.5
        }
    })
};

const descriptionVariants = {
    hidden: {
        opacity: 0,
        x: -40
    },
    visible: (custom) => ({
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.6,
            delay: custom * 0.6 + 0.7
        }
    })
};

export function Howtouse() {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const sectionRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"]
    });

    const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "5%"]);

    return (
        <motion.section
            id="howtouse"
            ref={sectionRef}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.8 }}
            className="relative w-full flex flex-col items-center py-12 md:py-20 overflow-hidden"
            style={{ background: "#F7F6F3" }}
        >
            <motion.div
                className="absolute inset-0 pointer-events-none opacity-50"
                style={{ y: bgY }}
            />
            {/* Main container with EXACT 150px padding on both sides - NO max-width restriction on desktop, responsive on mobile */}
            <div className="w-full px-4 md:px-12 lg:px-[150px] flex flex-col items-center">

                {/* HOW IT WORKS Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    style={{
                        display: "inline-flex",
                        padding: "6px 16px",
                        alignItems: "flex-start",
                        borderRadius: "9999px",
                        background: "linear-gradient(90deg, #0D4A7A 0%, #1888E0 100%)",
                        color: "#FFF",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: "12px",
                        fontWeight: "600",
                        lineHeight: "16px",
                        letterSpacing: "1.2px",
                        textTransform: "uppercase",
                        marginBottom: "24px"
                    }}
                >
                    HOW IT WORKS
                </motion.div>

                {/* Heading */}
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-[28px] md:text-[35px] text-center mb-4"
                    style={{
                        color: "#000",
                        fontFamily: "Outfit, sans-serif",
                        fontWeight: "500",
                        lineHeight: "normal",
                    }}
                >
                    Your journey to healing
                </motion.h2>

                {/* Subheading */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-lg md:text-[20px] text-center mb-12"
                    style={{
                        color: "#000",
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: "500",
                        lineHeight: "normal",
                        maxWidth: "600px"
                    }}
                >
                    We've made the process as simple and welcoming as possible.
                </motion.p>

                {/* Banner Image */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="w-full h-[150px] md:h-[201px] rounded-[20px] mb-0"
                    style={{
                        backgroundImage: "url('/assets/howituseImage.jpg')",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                        backgroundColor: "lightgray",
                    }}
                />

                {/* Steps Row - sequential animation with slower timing */}
                <div
                    className="w-full grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-10 -mt-10 md:-mt-[50px] px-4 md:px-0"
                >
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            custom={index}
                            variants={stepVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.3 }}
                            className="flex flex-col items-center text-center"
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            {/* Circle Number with hover effect - INCREASED SIZE */}
                            <motion.div
                                custom={index}
                                variants={circleVariants}
                                initial="hidden"
                                whileInView="visible"
                                whileHover="hover"
                                whileTap="tap"
                                viewport={{ once: true }}
                                style={{
                                    width: "100px",  // Increased from 80px
                                    height: "100px", // Increased from 80px
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    borderRadius: "50%",
                                    background: hoveredIndex === index
                                        ? "linear-gradient(135deg, #0D4A7A 0%, #1888E0 100%)"
                                        : "#0D4A7A",
                                    color: "#FFF",
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: "32px",  // Increased font size
                                    fontWeight: "700",
                                    lineHeight: "normal",
                                    flexShrink: 0,
                                    cursor: "pointer",
                                    transition: "all 0.3s ease"
                                }}
                            >
                                {step.number}
                            </motion.div>

                            {/* Step Title */}
                            <motion.h3
                                custom={index}
                                variants={titleVariants}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                className="text-xl md:text-[23px] mb-3 mt-6"
                                style={{
                                    maxWidth: "250px",
                                    color: hoveredIndex === index ? "#0D4A7A" : "#000",
                                    textAlign: "center",
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontWeight: "500",
                                    lineHeight: "normal",
                                    transition: "color 0.3s ease"
                                }}
                            >
                                {step.title}
                            </motion.h3>

                            {/* Step Description */}
                            <motion.p
                                custom={index}
                                variants={descriptionVariants}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                className="text-base md:text-[18px]"
                                style={{
                                    maxWidth: "320px",
                                    color: "#000",
                                    textAlign: "center",
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontWeight: "400",
                                    lineHeight: "1.4"
                                }}
                            >
                                {step.description}
                            </motion.p>
                        </motion.div>
                    ))}
                </div>

                {/* BOTTOM DOTS - REMOVED */}
                {/* The dots section has been completely removed */}

            </div>
        </motion.section >
    );
}