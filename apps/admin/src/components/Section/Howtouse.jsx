import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useRef } from "react";

const steps = [
    {
        number: "01",
        title: "Share your concern",
        description:
            "Reach out via phone, WhatsApp, or our booking form. Tell us what you're going through in a safe, confidential space.",
    },
    {
        number: "02",
        title: "Get matched with a counsellor",
        description:
            "We'll connect you with the right professional based on your needs, preferences, and situation.",
    },
    {
        number: "03",
        title: "Start sessions",
        description:
            "Begin your personalized counselling journey at your own pace, in-person or online.",
    }
];

/* ─── Animation Variants ───────────────────────── */

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
            className="
        relative
        w-full
        flex
        flex-col
        items-center
        overflow-hidden
        pt-[30px]
        pb-[60px]
    "
            style={{ background: "#F7F6F3" }}
        >
            {/* Background Motion */}
            <motion.div
                className="absolute inset-0 pointer-events-none opacity-50"
                style={{ y: bgY }}
            />

            {/* Main Container — aligned with Navbar */}
            <div className="w-full navbar-align-outer pt-4 md:pt-6">
            <div className="navbar-align-inner flex flex-col items-center">

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
                    How it works
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
                    Your journey to healing
                </motion.h2>

                {/* Subheading */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="
                        text-[16px]
                        md:text-[20px]
                        text-center
                        mb-12
                        font-['DM_Sans']
                        font-medium
                    "
                    style={{
                        color: "#000",
                        maxWidth: "600px",
                        lineHeight: "1.5"
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
                    className="
                        w-full
                        h-[150px]
                        md:h-[201px]
                        rounded-[20px]
                        mb-0
                    "
                    style={{
                        backgroundImage:
                            "url('/assets/howituseImage.jpg')",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                        backgroundColor: "lightgray",
                    }}
                />

                {/* Steps */}
                <div
                    className="
                        w-full
                        grid
                        grid-cols-1
                        md:grid-cols-3
                        gap-12
                        md:gap-10
                        -mt-10
                        md:-mt-[50px]
                    "
                >
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            custom={index}
                            variants={stepVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.3 }}
                            className="
                                flex
                                flex-col
                                items-center
                                text-center
                            "
                            onMouseEnter={() =>
                                setHoveredIndex(index)
                            }
                            onMouseLeave={() =>
                                setHoveredIndex(null)
                            }
                        >
                            {/* Circle */}
                            <motion.div
                                custom={index}
                                variants={circleVariants}
                                initial="hidden"
                                whileInView="visible"
                                whileHover="hover"
                                whileTap="tap"
                                viewport={{ once: true }}
                                style={{
                                    width: "100px",
                                    height: "100px",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    borderRadius: "50%",
                                    background:
                                        hoveredIndex === index
                                            ? "linear-gradient(135deg, #0D4A7A 0%, #1888E0 100%)"
                                            : "#0D4A7A",
                                    color: "#FFF",
                                    fontFamily:
                                        "'DM Sans', sans-serif",
                                    fontSize: "32px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                    transition:
                                        "all 0.3s ease"
                                }}
                            >
                                {step.number}
                            </motion.div>

                            {/* Title */}
                            <motion.h3
                                custom={index}
                                variants={titleVariants}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                className="
                                    text-xl
                                    md:text-[23px]
                                    mb-3
                                    mt-6
                                    font-['DM_Sans']
                                    font-medium
                                "
                                style={{
                                    maxWidth: "250px",
                                    color:
                                        hoveredIndex === index
                                            ? "#0D4A7A"
                                            : "#000",
                                    transition:
                                        "color 0.3s ease"
                                }}
                            >
                                {step.title}
                            </motion.h3>

                            {/* Description */}
                            <motion.p
                                custom={index}
                                variants={descriptionVariants}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                className="
                                    text-base
                                    md:text-[18px]
                                    font-['DM_Sans']
                                "
                                style={{
                                    maxWidth: "320px",
                                    color: "#000",
                                    lineHeight: "1.4"
                                }}
                            >
                                {step.description}
                            </motion.p>
                        </motion.div>
                    ))}
                </div>
            </div>
            </div>
        </motion.section>
    );
}