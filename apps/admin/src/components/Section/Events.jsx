import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, MapPin, ArrowRight, ChevronDown } from "lucide-react";

const eventData = [
    {
        id: 1,
        image: "/assets/eventImage1.jpg",
        badge: "In-person",
        title: "Couples Communication Masterclass",
        description: "Deepen connection and resolve conflicts with evidence-based communication skills.",
        date: "May 7th, 2026",
        time: "3:00 PM - 4:40 PM",
        location: "At Furama RiverFront ballroom",
        price: "$150"
    },
    {
        id: 2,
        image: "/assets/eventImage2.jpg",
        badge: "Online",
        title: "Mindful Relationships Workshop",
        description: "Explore mindfulness techniques to enhance emotional intimacy and presence.",
        date: "June 14th, 2026",
        time: "1:00 PM - 2:30 PM",
        location: "Zoom",
        price: "$120"
    },
    {
        id: 3,
        image: "/assets/eventImage3.jpg",
        badge: "In-person",
        title: "Positive Parenting Strategies",
        description: "Build a positive parent-child relationship with effective, compassionate strategies.",
        date: "July 22nd, 2026",
        time: "5:00 PM - 6:45 PM",
        location: "At The Ritz-Carlton Ballroom",
        price: "$130"
    },
    {
        id: 4,
        image: "/assets/eventmage4.jpg",
        badge: "In-person",
        title: "Workplace Stress & Burnout Prevention",
        description: "Corporate workshop on recognizing burnout signs and building workplace resilience.",
        date: "May 7th, 2026",
        time: "3:00 PM - 4:40 PM",
        location: "At Furama RiverFront ballroom",
        price: "$150"
    },
    {
        id: 5,
        image: "/assets/eventImage5.jpg",
        badge: "Online",
        title: "Healing After Relationship Loss",
        description: "Navigate grief, rebuild self-esteem, and find hope after relationship endings",
        date: "June 14th, 2026",
        time: "1:00 PM - 2:30 PM",
        location: "Zoom",
        price: "$120"
    },
    {
        id: 6,
        image: "/assets/eventImage6.jpg",
        badge: "In-person",
        title: "Mindfulness & Meditation Workshop",
        description: "Introduction to mindfulness practices for stress reduction and emotional balance",
        date: "July 22nd, 2026",
        time: "5:00 PM - 6:45 PM",
        location: "At The Ritz-Carlton Ballroom",
        price: "$130"
    }
];

export function Events() {
    const [hoveredButton, setHoveredButton] = useState(null);

    return (
        <section className="w-full flex flex-col items-center py-[70px] bg-[#FAFAF5]">
            <div className="w-full max-w-[1240px] flex flex-col">
                {/* Header Area */}
                <div className="w-full flex justify-between items-center mb-10">
                    <h2
                        style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontWeight: 500,
                            fontSize: "35px",
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
                            boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                        }}
                    >
                        All events
                        <ChevronDown size={20} color="#6B7280" />
                    </button>
                </div>

                {/* Cards Grid */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 400px)",
                        gap: "20px",
                    }}
                >
                    {eventData.map((event, index) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            whileHover={{ y: -5, transition: { duration: 0.3 } }}
                            style={{
                                width: "400px",
                                height: "580px",
                                borderRadius: "10px",
                                backgroundColor: "#FFFFFF",
                                boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.05)",
                                position: "relative",
                                display: "flex",
                                flexDirection: "column",
                            }}
                        >
                            {/* Image Section */}
                            <div
                                style={{
                                    width: "400px",
                                    height: "246px",
                                    borderTopLeftRadius: "10px",
                                    borderTopRightRadius: "10px",
                                    backgroundImage: `url('${event.image}')`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    position: "relative",
                                }}
                            >
                                {/* Badge */}
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "20px",
                                        right: "20px",
                                        height: "35px",
                                        backgroundColor: "#0D4A7A",
                                        borderRadius: "8px",
                                        padding: "0 16px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily: "'DM Sans', sans-serif",
                                            fontWeight: 500,
                                            fontSize: "14px",
                                            color: "#FFFFFF",
                                        }}
                                    >
                                        {event.badge}
                                    </span>
                                </div>
                            </div>

                            {/* Content Section */}
                            <div className="flex flex-col flex-1 relative">
                                {/* Title */}
                                <h3
                                    style={{
                                        position: "absolute",
                                        top: "20px",
                                        left: "20px",
                                        width: "326px",
                                        height: "auto",
                                        fontFamily: "'Outfit', sans-serif",
                                        fontWeight: 500,
                                        fontSize: "20px",
                                        lineHeight: "1.2",
                                        color: "#000000",
                                        margin: 0,
                                    }}
                                >
                                    {event.title}
                                </h3>

                                {/* Description */}
                                <p
                                    style={{
                                        position: "absolute",
                                        top: "60px",
                                        left: "20px",
                                        width: "357px",
                                        height: "50px",
                                        fontFamily: "'DM Sans', sans-serif",
                                        fontWeight: 400,
                                        fontSize: "16px",
                                        lineHeight: "25px",
                                        color: "#333333",
                                        margin: 0,
                                        overflow: "hidden",
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                    }}
                                >
                                    {event.description}
                                </p>

                                {/* Date */}
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "130px",
                                        left: "20px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "15px",
                                    }}
                                >
                                    <Calendar size={20} color="#1E3A8A" />
                                    <span
                                        style={{
                                            fontFamily: "'DM Sans', sans-serif",
                                            fontWeight: 500,
                                            fontSize: "16px",
                                            lineHeight: "25px",
                                            color: "#333333",
                                        }}
                                    >
                                        {event.date}
                                    </span>
                                </div>

                                {/* Time */}
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "165px",
                                        left: "20px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "15px",
                                    }}
                                >
                                    <Clock size={20} color="#1E3A8A" />
                                    <span
                                        style={{
                                            fontFamily: "'DM Sans', sans-serif",
                                            fontWeight: 500,
                                            fontSize: "16px",
                                            lineHeight: "25px",
                                            color: "#333333",
                                        }}
                                    >
                                        {event.time}
                                    </span>
                                </div>

                                {/* Location */}
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "200px",
                                        left: "20px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "15px",
                                    }}
                                >
                                    <MapPin size={20} color="#1E3A8A" />
                                    <span
                                        style={{
                                            fontFamily: "'DM Sans', sans-serif",
                                            fontWeight: 500,
                                            fontSize: "16px",
                                            lineHeight: "25px",
                                            color: "#333333",
                                        }}
                                    >
                                        {event.location}
                                    </span>
                                </div>

                                {/* Bottom Row: Price & Button */}
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "270px",
                                        left: "25px",
                                        right: "20px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontFamily: "'DM Sans', sans-serif",
                                            fontWeight: 600,
                                            fontSize: "30px",
                                            lineHeight: "100%",
                                            color: "#000000",
                                        }}
                                    >
                                        {event.price}
                                    </div>

                                    <motion.button
                                        onMouseEnter={() => setHoveredButton(index)}
                                        onMouseLeave={() => setHoveredButton(null)}
                                        whileTap={{ scale: 0.95 }}
                                        style={{
                                            width: "165px",
                                            height: "40px",
                                            borderRadius: "9999px",
                                            border: "1px solid #1E3A8A",
                                            backgroundColor: hoveredButton === index ? "#1E3A8A" : "transparent",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "10px",
                                            cursor: "pointer",
                                            transition: "background-color 0.3s ease",
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontFamily: "'DM Sans', sans-serif",
                                                fontWeight: 500,
                                                fontSize: "15px",
                                                lineHeight: "28px",
                                                color: hoveredButton === index ? "#FFFFFF" : "#1E3A8A",
                                                transition: "color 0.3s ease",
                                            }}
                                        >
                                            Register Now
                                        </span>
                                        <ArrowRight
                                            size={16}
                                            color={hoveredButton === index ? "#FFFFFF" : "#1E3A8A"}
                                            style={{ transition: "color 0.3s ease" }}
                                        />
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
