import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Calendar,
    Clock,
    MapPin,
    ArrowRight,
    ChevronDown,
    ArrowDown,
    Mail
} from "lucide-react";

import { Footer } from "../components/Layout/Footer.jsx";

function Events() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hoveredButton, setHoveredButton] = useState(null);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/events");
                const data = await response.json();
                setEvents(data);
            } catch (error) {
                console.error("Error fetching events:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();

        // REAL-TIME AUTO UPDATE
        const eventSource = new EventSource(
            "http://localhost:5000/api/events/stream"
        );

        const handleRemoteUpdate = () => {
            fetchEvents();
        };

        eventSource.addEventListener("event_created", handleRemoteUpdate);
        eventSource.addEventListener("event_updated", handleRemoteUpdate);
        eventSource.addEventListener("event_deleted", handleRemoteUpdate);

        return () => {
            eventSource.close();
        };
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return "TBA";

        return new Date(dateString).toLocaleDateString("en-SG", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const formatTime = (dateString) => {
        if (!dateString) return "TBA";

        return new Date(dateString).toLocaleTimeString("en-SG", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <div className="w-full flex justify-center py-20">
                <div className="w-8 h-8 rounded-full border-2 border-[#0D4A7A] border-t-transparent animate-spin" />
            </div>
        );
    }

    return (
        <section
            id="events-section"
            className="w-full flex flex-col items-center py-10 sm:py-14 md:py-[100px] bg-[#FAFAF5]"
        >
            {/* RESPONSIVE PADDING */}
            <div
                className="w-full px-6 md:px-12 lg:px-[100px]"
            >
                {/* HEADER */}
                <div className="w-full flex flex-wrap justify-between items-center gap-4 mb-10">
                    <h2
                        className="text-[26px] sm:text-[30px] md:text-[35px]"
                        style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontWeight: 500,
                            color: "#000000",
                            lineHeight: "100%",
                        }}
                    >
                        All Events
                    </h2>

                    <button
                        className="flex items-center justify-between bg-white"
                        style={{
                            width: "140px",
                            height: "44px",
                            padding: "0 16px",
                            borderRadius: "8px",
                            border: "1px solid #E5E7EB",
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: 500,
                            fontSize: "16px",
                            color: "#000000",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                        }}
                    >
                        All events
                        <ChevronDown size={20} color="#6B7280" />
                    </button>
                </div>

                {/* RESPONSIVE GRID — 1 col mobile, 2 col tablet, 3-4 col desktop */}
                <div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                >
                    {events.map((event, index) => {
                        const isOnline =
                            event.location?.toLowerCase().includes("zoom") ||
                            event.location?.toLowerCase().includes("online");

                        return (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{
                                    delay: index * 0.08,
                                    duration: 0.5,
                                }}
                                whileHover={{
                                    y: -5,
                                    transition: { duration: 0.3 },
                                }}
                                className="flex flex-col"
                                style={{
                                    width: "100%",
                                    minHeight: "500px",
                                    borderRadius: "12px",
                                    backgroundColor: "#FFFFFF",
                                    boxShadow:
                                        "0px 10px 30px rgba(0,0,0,0.05)",
                                    overflow: "hidden",
                                }}
                            >
                                {/* IMAGE */}
                                <div
                                    style={{
                                        width: "100%",
                                        height: "220px",
                                        backgroundImage: `url('${event.photoUrls?.[0] ||
                                            "/assets/eventImage1.jpg"
                                            }')`,
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                        position: "relative",
                                        flexShrink: 0,
                                    }}
                                >
                                    {/* BADGE */}
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: "16px",
                                            right: "16px",
                                            height: "32px",
                                            backgroundColor: "#0D4A7A",
                                            borderRadius: "8px",
                                            padding: "0 14px",
                                            display: "flex",
                                            alignItems: "center",
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontFamily:
                                                    "'DM Sans', sans-serif",
                                                fontWeight: 500,
                                                fontSize: "13px",
                                                color: "#FFFFFF",
                                            }}
                                        >
                                            {isOnline
                                                ? "Online"
                                                : "In-person"}
                                        </span>
                                    </div>
                                </div>

                                {/* CONTENT */}
                                <div className="flex flex-col flex-1 p-5">
                                    <h3
                                        className="text-[18px] md:text-[20px]"
                                        style={{
                                            fontFamily:
                                                "'Outfit', sans-serif",
                                            color: "#000000",
                                            lineHeight: "1.3",
                                            fontWeight: 500,
                                            marginBottom: "12px",
                                        }}
                                    >
                                        {event.title}
                                    </h3>

                                    <p
                                        className="line-clamp-2 text-[14px] md:text-[15px]"
                                        style={{
                                            fontFamily:
                                                "'DM Sans', sans-serif",
                                            fontWeight: 400,
                                            color: "#333333",
                                            lineHeight: "1.6",
                                            marginBottom: "20px",
                                        }}
                                    >
                                        {event.description}
                                    </p>

                                    {/* DETAILS */}
                                    <div className="flex flex-col gap-3 mb-6">
                                        <div className="flex items-center gap-3">
                                            <Calendar
                                                size={16}
                                                color="#1E3A8A"
                                            />
                                            <span
                                                style={{
                                                    fontFamily:
                                                        "'DM Sans', sans-serif",
                                                    fontWeight: 500,
                                                    fontSize: "14px",
                                                    color: "#333333",
                                                }}
                                            >
                                                {formatDate(event.eventDate)}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Clock
                                                size={16}
                                                color="#1E3A8A"
                                            />
                                            <span
                                                style={{
                                                    fontFamily:
                                                        "'DM Sans', sans-serif",
                                                    fontWeight: 500,
                                                    fontSize: "14px",
                                                    color: "#333333",
                                                }}
                                            >
                                                {formatTime(event.eventDate)}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <MapPin
                                                size={16}
                                                color="#1E3A8A"
                                            />
                                            <span
                                                className="line-clamp-1"
                                                style={{
                                                    fontFamily:
                                                        "'DM Sans', sans-serif",
                                                    fontWeight: 500,
                                                    fontSize: "14px",
                                                    color: "#333333",
                                                }}
                                            >
                                                {event.location}
                                            </span>
                                        </div>
                                    </div>

                                    {/* PRICE + BUTTON */}
                                    <div className="mt-auto flex items-center justify-between">
                                        <span
                                            className="text-[20px] md:text-[24px]"
                                            style={{
                                                fontFamily:
                                                    "'DM Sans', sans-serif",
                                                color: "#000000",
                                                fontWeight: 700,
                                            }}
                                        >
                                            {event.price || "Free"}
                                        </span>

                                        <motion.button
                                            onMouseEnter={() =>
                                                setHoveredButton(index)
                                            }
                                            onMouseLeave={() =>
                                                setHoveredButton(null)
                                            }
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() =>
                                                event.registrationUrl &&
                                                window.open(
                                                    event.registrationUrl,
                                                    "_blank"
                                                )
                                            }
                                            style={{
                                                height: "40px",
                                                padding: "0 18px",
                                                borderRadius: "9999px",
                                                border:
                                                    "1px solid #1E3A8A",
                                                backgroundColor:
                                                    hoveredButton === index
                                                        ? "#1E3A8A"
                                                        : "transparent",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                                cursor: "pointer",
                                                transition:
                                                    "background-color 0.3s ease",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontFamily:
                                                        "'DM Sans', sans-serif",
                                                    fontWeight: 500,
                                                    fontSize: "14px",
                                                    color:
                                                        hoveredButton === index
                                                            ? "#FFFFFF"
                                                            : "#1E3A8A",
                                                    transition:
                                                        "color 0.3s ease",
                                                }}
                                            >
                                                Register
                                            </span>

                                            <ArrowRight
                                                size={14}
                                                color={
                                                    hoveredButton === index
                                                        ? "#FFFFFF"
                                                        : "#1E3A8A"
                                                }
                                            />
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

export default function EventsPage() {
    return (
        <div className="w-full flex flex-col min-h-screen items-center bg-[#FAFAF5]">
            {/* HERO SECTION */}
            <div
                className="relative flex w-full shrink-0 overflow-hidden"
                style={{
                    minHeight: "480px",
                    height: "clamp(480px, 55vw, 790px)",
                    background:
                        "linear-gradient(180deg, rgba(58,58,58,0.8) 0%, rgba(0,0,0,0.7) 100%), url('/assets/EventsHeroImage.jpg')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            >
                <div
                    className="relative w-full h-full flex items-center justify-center px-6 md:px-12 lg:px-[100px]"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.8,
                            delay: 0.3,
                            ease: "easeOut",
                        }}
                        className="flex flex-col items-center justify-center text-center"
                        style={{
                            maxWidth: "840px",
                        }}
                    >
                        <h1
                            className="text-[32px] sm:text-[44px] md:text-[54px] lg:text-[60px]"
                            style={{
                                fontFamily: "'Outfit', sans-serif",
                                color: "#FFFFFF",
                                fontWeight: 600,
                                lineHeight: "1.2",
                                marginBottom: "24px",
                            }}
                        >
                            Learn, Grow & Connect
                        </h1>

                        <p
                            className="text-[16px] md:text-[20px]"
                            style={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontWeight: 400,
                                color: "#FFFFFF",
                                maxWidth: "700px",
                                lineHeight: "1.8",
                                marginBottom: "32px",
                            }}
                        >
                            Join our evidence-based workshops and community
                            programs designed to support your mental wellness
                            journey
                        </p>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                height: "60px",
                                padding: "0 32px",
                                gap: "10px",
                                borderRadius: "9999px",
                                backgroundColor: "#1B4585",
                                border: "none",
                                display: "flex",
                                alignItems: "center",
                                cursor: "pointer",
                            }}
                            onClick={() => {
                                const eventsSection =
                                    document.getElementById("events-section");

                                if (eventsSection) {
                                    eventsSection.scrollIntoView({
                                        behavior: "smooth",
                                    });
                                }
                            }}
                        >
                            <span
                                style={{
                                    fontFamily:
                                        "'Plus Jakarta Sans', sans-serif",
                                    fontWeight: 600,
                                    color: "#FFFFFF",
                                    fontSize: "18px",
                                }}
                            >
                                Explore Our Events
                            </span>

                            <ArrowDown size={20} color="#FFFFFF" />
                        </motion.button>
                    </motion.div>
                </div>
            </div>

            {/* EVENTS */}
            <Events />

            {/* NEWSLETTER */}
            <div
                className="w-full py-16 md:py-24 bg-[#FAFAF5] px-6 md:px-12 lg:px-[100px]"
            >
                <div
                    className="w-full flex flex-col items-center justify-center py-20 px-6 rounded-[30px]"
                    style={{
                        background: "#0D4A7A",
                    }}
                >
                    <div
                        style={{
                            padding: "6px 16px",
                            borderRadius: "9999px",
                            border:
                                "1.5px solid rgba(255, 255, 255, 0.4)",
                            marginBottom: "24px",
                        }}
                    >
                        <span
                            style={{
                                fontFamily:
                                    "'Plus Jakarta Sans', sans-serif",
                                fontWeight: 600,
                                fontSize: "11px",
                                letterSpacing: "1.5px",
                                color: "#FFFFFF",
                                textTransform: "uppercase",
                            }}
                        >
                            Upcoming Events
                        </span>
                    </div>

                    <h2
                        className="text-[28px] sm:text-[36px] md:text-[50px]"
                        style={{
                            fontFamily: "'Outfit', sans-serif",
                            lineHeight: "1.1",
                            maxWidth: "850px",
                            color: "#FFFFFF",
                            fontWeight: 500,
                            textAlign: "center",
                            marginBottom: "20px",
                        }}
                    >
                        Great Things Are Being Planned !
                    </h2>

                    <p
                        className="text-[16px] md:text-[20px]"
                        style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: 500,
                            maxWidth: "940px",
                            opacity: 0.9,
                            color: "#FFFFFF",
                            textAlign: "center",
                            lineHeight: "1.8",
                            marginBottom: "40px",
                        }}
                    >
                        Our team is busy crafting meaningful workshops and
                        events for the community.
                    </p>

                    <div
                        className="flex flex-col sm:flex-row items-center gap-4 w-full"
                        style={{
                            maxWidth: "665px",
                        }}
                    >
                        <div
                            className="relative w-full"
                            style={{
                                height: "60px",
                            }}
                        >
                            <Mail
                                size={20}
                                color="#A1A0A0"
                                style={{
                                    position: "absolute",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    left: "24px",
                                }}
                            />

                            <input
                                type="email"
                                placeholder="Enter your email address"
                                className="w-full h-full rounded-full border-none pl-[58px] pr-6 bg-white outline-none"
                                style={{
                                    fontFamily:
                                        "'DM Sans', sans-serif",
                                    fontSize: "17px",
                                }}
                            />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full sm:w-auto px-9"
                            style={{
                                height: "60px",
                                borderRadius: "9999px",
                                border:
                                    "1.5px solid rgba(255,255,255,0.4)",
                                backgroundColor: "transparent",
                                color: "#FFFFFF",
                                cursor: "pointer",
                                fontFamily:
                                    "'Plus Jakarta Sans', sans-serif",
                                fontWeight: 600,
                                fontSize: "17px",
                                flexShrink: 0,
                            }}
                        >
                            Notify Me
                        </motion.button>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}