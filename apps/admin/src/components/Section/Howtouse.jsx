import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useRef } from "react";

const steps = [
    {
        number: "01",
        title: "Share your concern",
        description:
            "Reach out via phone or our booking form. Tell us what you're going through in a safe & confidential space.",
    },
    {
        number: "02",
        title: "Get matched with a counsellor",
        description:
            "We'll connect you with the right professional based on your needs, preferences and situation.",
    },
    {
        number: "03",
        title: "Start sessions",
        description:
            "Begin your personalized counselling journey at your own pace, in-person or online.",
    }
];

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
            style={{ background: "#F9F9F9" }}
        >
            {/* Background Motion */}
            <motion.div
                className="absolute inset-0 pointer-events-none opacity-50"
                style={{ y: bgY }}
            />

            {/* Main Container — aligned with Navbar */}
            <div className="w-full navbar-align-outer pt-4 md:pt-6">
            <div className="navbar-align-inner flex flex-col items-center">

                {/* Heading */}
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="
                        text-[clamp(26px,4.8vw,28px)]
                        md:text-[35px]
                        text-center
                        mb-4
                        font-['Outfit']
                        font-medium
                        leading-[1.2]
                    "
                    style={{ color: "#0D4A7A" }}
                >
                    How WINGS Counselling Centre works
                </motion.h2>

                {/* Subheading */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="
                        text-black
                        text-center
                        font-['DM_Sans']
                        text-[16px]
                        md:text-[20px]
                        font-normal
                        max-w-[700px]
                        leading-[1.5]
                        line-clamp-2
                        md:line-clamp-none
                        mb-12
                    "
                >
                    We've made the process as simple and welcoming as possible
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

                {/* Steps - Animation Removed */}
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
                        <div
                            key={index}
                            className="
                                flex
                                flex-col
                                items-center
                                text-center
                            "
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            {/* Circle */}
                            <div
                                className="
                                    w-[80px] h-[80px]
                                    md:w-[100px] md:h-[100px]
                                    flex justify-center items-center
                                    rounded-full
                                    text-white
                                    font-['DM_Sans']
                                    text-[26px] md:text-[32px]
                                    font-bold
                                    cursor-pointer
                                    transition-all duration-300
                                "
                                style={{
                                    background:
                                        hoveredIndex === index
                                            ? "linear-gradient(135deg, #0D4A7A 0%, #1888E0 100%)"
                                            : "#0D4A7A",
                                    transform: hoveredIndex === index ? "scale(1.1)" : "scale(1)",
                                    boxShadow:
                                        hoveredIndex === index
                                            ? "0 15px 30px rgba(13, 74, 122, 0.4)"
                                            : "none",
                                }}
                            >
                                {step.number}
                            </div>

                            {/* Title */}
                            <h3
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
                                    color: hoveredIndex === index ? "#0D4A7A" : "#000",
                                    transition: "color 0.3s ease",
                                }}
                            >
                                {step.title}
                            </h3>

                            {/* Description */}
                            <p
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
                            </p>
                        </div>
                    ))}
                </div>
            </div>
            </div>
        </motion.section>
    );
}