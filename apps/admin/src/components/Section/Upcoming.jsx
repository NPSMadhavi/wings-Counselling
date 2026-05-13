import { useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useLocation } from "wouter";
import { useAppointment } from "@/context/AppointmentContext";
import { GetInTouch } from "./GetInTouch";
import { RecentArticles } from "./RecentArticles";

const events = [
    {
        id: 1,
        type: "WORKSHOP",
        title: "Managing Anxiety in Modern Life",
        description: "A practical, evidence-based workshop on understanding the anxiety cycle and developing personalised tools to reclaim calm.",
        date: "Saturday, 10 May 2025",
        time: "9:00 AM – 12:00 PM",
        location: "Wings Center, Orchard Road",
        btnLabel: "Register here"
    },
    {
        id: 2,
        type: "WEBINAR",
        title: "Mindful Parenting Programme",
        description: "A 3-session series for parents seeking to deepen connection with their children and manage the unique stresses of modern parenthood.",
        date: "Wednesday, 21 May 2025",
        time: "6:00 PM – 7:30 PM",
        location: "Online - Zoom",
        btnLabel: "Sign up now"
    },
    {
        id: 3,
        type: "SEMINAR",
        title: "Building Resilience in Stressful Times",
        description: "Learn strategies to strengthen emotional resilience and bounce back from setbacks with confidence.",
        date: "Thursday, 5 June 2025",
        time: "2:00 PM – 4:00 PM",
        location: "Harmony Hall, Civic Center",
        btnLabel: "Reserve your seat"
    },
    {
        id: 4,
        type: "SEMINAR",
        title: "Positive Parenting Strategies",
        description: "Build a positive parent-child relationship with effective, compassionate strategies.",
        date: "Friday, 5 June 2025",
        time: "2:00 PM – 4:00 PM",
        location: "Harmony Hall, Civic Center",
        btnLabel: "Reserve your seat"
    }
];

/* ─── SVG Icons ────────────────────────────────────────────── */
function CalendarIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 4H17V3C17 2.73478 16.8946 2.48043 16.7071 2.29289C16.5196 2.10536 16.2652 2 16 2C15.7348 2 15.4804 2.10536 15.2929 2.29289C15.1054 2.48043 15 2.73478 15 3V4H9V3C9 2.73478 8.89464 2.48043 8.70711 2.29289C8.51957 2.10536 8.26522 2 8 2C7.73478 2 7.48043 2.10536 7.29289 2.29289C7.10536 2.48043 7 2.73478 7 3V4H5C4.20435 4 3.44129 4.31607 2.87868 4.87868C2.31607 5.44129 2 6.20435 2 7V19C2 19.7956 2.31607 20.5587 2.87868 21.1213C3.44129 21.6839 4.20435 22 5 22H19C19.7956 22 20.5587 21.6839 21.1213 21.1213C21.6839 20.5587 22 19.7956 22 19V7C22 6.20435 21.6839 5.44129 21.1213 4.87868C20.5587 4.31607 19.7956 4 19 4ZM20 19C20 19.2652 19.8946 19.5196 19.7071 19.7071C19.5196 19.8946 19.2652 20 19 20H5C4.73478 20 4.48043 19.8946 4.29289 19.7071C4.10536 19.5196 4 19.2652 4 19V12H20V19ZM20 10H4V7C4 6.73478 4.10536 6.48043 4.29289 6.29289C4.48043 6.10536 4.73478 6 5 6H7V7C7 7.26522 7.10536 7.51957 7.29289 7.70711C7.48043 7.89464 7.73478 8 8 8C8.26522 8 8.51957 7.89464 8.70711 7.70711C8.89464 7.51957 9 7.26522 9 7V6H15V7C15 7.26522 15.1054 7.51957 15.2929 7.70711C15.4804 7.89464 15.7348 8 16 8C16.2652 8 16.5196 7.89464 16.7071 7.70711C16.8946 7.51957 17 7.26522 17 7V6H19C19.2652 6 19.5196 6.10536 19.7071 6.29289C19.8946 6.48043 20 6.73478 20 7V10Z" fill="#1B4585" />
        </svg>
    );
}

function ClockIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22C6.477 22 2 17.523 2 12Z" stroke="#1B4585" strokeWidth="2" strokeLinecap="square" />
            <path d="M12 6.5V12L15 15" stroke="#1B4585" strokeWidth="2" strokeLinecap="square" />
        </svg>
    );
}

function LocationIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M16 10C16 7.79 14.21 6 12 6C9.79 6 8 7.79 8 10C8 12.21 9.79 14 12 14C14.21 14 16 12.21 16 10ZM10 10C10 8.9 10.9 8 12 8C13.1 8 14 8.9 14 10C14 11.1 13.1 12 12 12C10.9 12 10 11.1 10 10Z" fill="#1B4585" />
            <path d="M11.42 21.8102C11.59 21.9302 11.8 22.0002 12 22.0002C12.2 22.0002 12.41 21.9402 12.58 21.8102C12.88 21.5902 20.03 16.4402 20 9.99023C20 5.58023 16.41 1.99023 12 1.99023C7.59 1.99023 4 5.58023 4 9.99023C3.97 16.4302 11.12 21.5902 11.42 21.8102ZM12 4.00023C15.31 4.00023 18 6.69023 18 10.0002C18.02 14.4402 13.61 18.4302 12 19.7402C10.39 18.4302 5.98 14.4502 6 10.0002C6 6.69023 8.69 4.00023 12 4.00023Z" fill="#1B4585" />
        </svg>
    );
}

function ArrowIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M4 12L20 12M20 12L14 18M20 12L14 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

/* ─── Event Card Component ────────────────────────────────── */
function EventCard({ event, index }) {
    const [hovered, setHovered] = useState(false);

    // Card animation variants
    const cardVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 25,
                delay: index * 0.2
            }
        }
    };

    return (
        <motion.div
            custom={index}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                width: "100%",
                maxWidth: "400px",
                minHeight: "450px",
                borderRadius: "10px",
                background: "#F7F6F3",
                boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.12)" : "0 2px 8px rgba(0,0,0,0.08)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                transition: "box-shadow 0.3s ease, transform 0.3s ease",
                transform: hovered ? "translateY(-10px) scale(1.02)" : "translateY(0) scale(1)",
            }}
        >
            {/* Top Gradient Bar */}
            <div
                style={{
                    width: "100%",
                    height: "15px",
                    background: "linear-gradient(90deg, #1B4585 0%, #42A0BD 100%)"
                }}
            />

            <div style={{ padding: "24px", display: "flex", flexDirection: "column", flex: 1 }}>
                {/* Type Badge */}
                <div
                    style={{
                        display: "inline-flex",
                        padding: "4px 16px",
                        justifyContent: "center",
                        alignItems: "center",
                        borderRadius: "9999px",
                        border: "1px solid #1B4585",
                        width: "fit-content",
                        marginBottom: "20px"
                    }}
                >
                    <span style={{
                        color: "#1B4585",
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "12px",
                        fontWeight: "600",
                        letterSpacing: "0.5px",
                        textTransform: "uppercase"
                    }}>
                        {event.type}
                    </span>
                </div>

                {/* Title */}
                <h3
                    style={{
                        color: "#000",
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "20px",
                        fontWeight: "600",
                        lineHeight: "normal",
                        margin: "0 0 12px 0"
                    }}
                >
                    {event.title}
                </h3>

                {/* Description */}
                <p
                    style={{
                        color: "#000",
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "15px",
                        fontWeight: "400",
                        lineHeight: "1.5",
                        margin: "0 0 24px 0",
                    }}
                >
                    {event.description}
                </p>

                {/* Info Rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
                    {/* Date */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <CalendarIcon />
                        <span style={{ color: "#000", fontFamily: "'DM Sans', sans-serif", fontSize: "15px", fontWeight: "400" }}>
                            {event.date}
                        </span>
                    </div>

                    {/* Time */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <ClockIcon />
                        <span style={{ color: "#000", fontFamily: "'DM Sans', sans-serif", fontSize: "15px", fontWeight: "400" }}>
                            {event.time}
                        </span>
                    </div>

                    {/* Location */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <LocationIcon />
                        <span style={{ color: "#000", fontFamily: "'DM Sans', sans-serif", fontSize: "15px", fontWeight: "400" }}>
                            {event.location}
                        </span>
                    </div>
                </div>

                {/* Register Button */}
                <motion.a
                    href="#"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                        marginTop: "auto",
                        display: "flex",
                        width: "100%",
                        height: "40px",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "15px",
                        borderRadius: "9999px",
                        border: "1px solid #1B4585",
                        background: hovered ? "#1B4585" : "#FFF",
                        color: hovered ? "#FFF" : "#1B4585",
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "15px",
                        fontWeight: "500",
                        textDecoration: "none",
                        cursor: "pointer",
                        transition: "all 0.3s ease"
                    }}
                >
                    {event.btnLabel}
                    <ArrowIcon />
                </motion.a>
            </div>
        </motion.div>
    );
}

/* ─── Main Upcoming Component ────────────────────────────────── */
export function Upcoming() {
    const sectionRef = useRef(null);
    const [, navigate] = useLocation();
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"]
    });

    const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "5%"]);

    return (
        <motion.div
            ref={sectionRef}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 1 }}
            style={{ background: "#F7F6F3", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: "0px", position: "relative", overflow: "hidden" }}
        >
            <motion.div
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{ y: bgY }}
            />
            {/* UPCOMING EVENTS SECTION */}
            <section
                id="upcoming"
                className="w-full flex flex-col items-center py-20 lg:py-32 px-6 md:px-16 lg:px-24 xl:px-[150px] box-border"
            >
                {/* Heading */}
                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-2xl sm:text-3xl md:text-[35px] font-medium text-center mb-4"
                    style={{
                        color: "#000",
                        fontFamily: "Outfit, sans-serif",
                        lineHeight: "normal",
                        margin: "0 0 16px 0"
                    }}
                >
                    Upcoming events &amp; workshops
                </motion.h2>

                {/* Subheading */}
                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-base sm:text-lg md:text-[20px] text-center mb-10 sm:mb-14"
                    style={{
                        color: "#000",
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: "500",
                        lineHeight: "1.4",
                        maxWidth: "800px"
                    }}
                >
                    Join our community events designed to educate, connect, and empower. Healing doesn't always happen alone
                </motion.p>

                {/* Events Grid with 4 columns on desktop/laptop */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 xl:gap-8 w-full mb-12 justify-items-center">
                    {events.map((event, index) => (
                        <EventCard key={event.id} event={event} index={index} />
                    ))}
                </div>

                {/* View All Button */}
                <motion.button
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate("/events")}
                    className="w-full sm:w-auto flex justify-center items-center text-base sm:text-[18px]"
                    style={{
                        padding: "14px 48px",
                        borderRadius: "16px",
                        background: "#1B4585",
                        color: "#FFF",
                        border: "none",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontWeight: "600",
                        lineHeight: "28px",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        boxShadow: "0 4px 14px rgba(27, 69, 133, 0.25)",
                    }}
                >
                    View all
                </motion.button>
            </section>

            {/* RECENT ARTICLES SECTION */}
            <RecentArticles />

            {/* GET IN TOUCH SECTION */}
            <GetInTouch />
        </motion.div>
    );
}