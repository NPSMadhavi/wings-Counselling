import { useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useAppointment } from "@/context/AppointmentContext";

const buttons = [
    {
        id: "call",
        label: "Call us",
        href: "tel:+6512345678",
        style: {
            background: "#FFF",
            border: "none",
            color: "#0D4A7A"
        },
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M19.95 21C17.8667 21 15.8083 20.546 13.775 19.638C11.7417 18.73 9.89167 17.4423 8.225 15.775C6.55833 14.1077 5.271 12.2577 4.363 10.225C3.455 8.19233 3.00067 6.134 3 4.05C3 3.75 3.1 3.5 3.3 3.3C3.5 3.1 3.75 3 4.05 3H8.1C8.33333 3 8.54167 3.07933 8.725 3.238C8.90833 3.39667 9.01667 3.584 9.05 3.8L9.7 7.3C9.73333 7.56667 9.725 7.79167 9.675 7.975C9.625 8.15833 9.53333 8.31667 9.4 8.45L6.975 10.9C7.30833 11.5167 7.704 12.1123 8.162 12.687C8.62 13.2617 9.12433 13.816 9.675 14.35C10.1917 14.8667 10.7333 15.346 11.3 15.788C11.8667 16.23 12.4667 16.634 13.1 17L15.45 14.65C15.6 14.5 15.796 14.3877 16.038 14.313C16.28 14.2383 16.5173 14.2173 16.75 14.25L20.2 14.95C20.4333 15.0167 20.625 15.1377 20.775 15.313C20.925 15.4883 21 15.684 21 15.9V19.95C21 20.25 20.9 20.5 20.7 20.7C20.5 20.9 20.25 21 19.95 21Z" fill="#0D4A7A" />
            </svg>
        )
    },
    {
        id: "book",
        label: "Book Online",
        href: "#contact",
        style: {
            background: "transparent",
            border: "1px solid #FFF",
            color: "#FFF"
        },
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M16 2V6M8 2V6M3 10H21M13 4H11C7.229 4 5.343 4 4.172 5.172C3.001 6.344 3 8.229 3 12V14C3 17.771 3 19.657 4.172 20.828C5.344 21.999 7.229 22 11 22H13C16.771 22 18.657 22 19.828 20.828C20.999 19.656 21 17.771 21 14V12C21 8.229 21 6.343 19.828 5.172C18.656 4.001 16.771 4 13 4Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 16.5C9 16.5 10.5 17 11 18.5C11 18.5 13.177 14.5 16 13.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    }
];

export function Needhelp() {
    const { openModal } = useAppointment();
    const sectionRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"]
    });

    const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);

    const handleClick = (id, href) => {
        if (id === "book") {
            openModal();
            return;
        }
        if (href.startsWith("#")) {
            const el = document.querySelector(href);
            if (el) el.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <motion.section
            id="needhelp"
            ref={sectionRef}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 1 }}
            className="relative w-full flex flex-col items-center justify-center py-12 md:py-20 lg:py-24 px-6 md:px-12 lg:px-[150px] overflow-hidden"
        >
            <div
                className="w-full flex flex-col items-center justify-center py-12 md:py-20 px-6 rounded-[30px] relative overflow-hidden"
                style={{ background: "#0D4A7A" }}
            >
                <motion.div
                    className="absolute inset-0 pointer-events-none opacity-20"
                    style={{ y: bgY }}
                />

                {/* Heading */}
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-[28px] sm:text-[36px] md:text-[50px] text-center mb-4 text-white"
                    style={{
                        fontFamily: "Outfit, sans-serif",
                        fontWeight: "500",
                        lineHeight: "1.1",
                        maxWidth: "850px"
                    }}
                >
                    Need help now? We're here for you
                </motion.h2>

                {/* Subheading */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-base md:text-[20px] text-center mb-10 text-white"
                    style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: "500",
                        lineHeight: "1.4",
                        maxWidth: "600px",
                        opacity: 0.9
                    }}
                >
                    Reach out in the way that feels most comfortable
                </motion.p>

                {/* Buttons Row */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="flex flex-col sm:flex-row flex-wrap justify-center gap-5 w-full sm:w-auto"
                >
                    {buttons.map((btn) => (
                        <a
                            key={btn.id}
                            href={btn.id === "call" ? btn.href : undefined}
                            onClick={(e) => {
                                if (btn.id === "book") e.preventDefault();
                                handleClick(btn.id, btn.href);
                            }}
                            className="transition-all duration-300 hover:scale-105 px-8 py-4 w-full sm:w-auto flex items-center justify-center rounded-full font-semibold text-[17px]"
                            style={{
                                gap: "12px",
                                background: btn.style.background,
                                border: btn.style.border,
                                color: btn.style.color,
                                textDecoration: "none",
                                cursor: "pointer",
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                height: "60px",
                                minWidth: "180px"
                            }}
                        >
                            {btn.icon}
                            {btn.label}
                        </a>
                    ))}
                </motion.div>
            </div>
        </motion.section>
    );
}
