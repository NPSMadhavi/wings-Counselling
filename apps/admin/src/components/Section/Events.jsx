import React, { useState } from "react";
import { motion } from "framer-motion";
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
        <section className="w-full flex flex-col items-center py-10 sm:py-[70px] bg-[#FAFAF5] overflow-x-hidden">
            <div className="w-full max-w-[1240px] px-4 sm:px-6 md:px-8 flex flex-col">
                {/* Header Area */}
                <div className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 sm:mb-10">
                    <h2
                        className="font-['Outfit'] font-medium text-[28px] sm:text-[35px] text-black leading-tight"
                    >
                        All Events
                    </h2>

                    <button
                        className="flex items-center justify-between bg-white w-full sm:w-[140px] h-[44px] px-4 rounded-lg border border-[#E5E7EB] font-['DM_Sans'] font-medium text-base text-black shadow-sm"
                    >
                        All events
                        <ChevronDown size={20} color="#6B7280" />
                    </button>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
                    {eventData.map((event, index) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            whileHover={{ y: -5, transition: { duration: 0.3 } }}
                            className="w-full min-h-[520px] sm:min-h-[580px] rounded-[10px] bg-white shadow-[0px_10px_30px_rgba(0,0,0,0.05)] relative flex flex-col overflow-hidden"
                        >
                            {/* Image Section */}
                            <div
                                className="w-full h-[200px] sm:h-[246px] rounded-t-[10px] bg-cover bg-center relative shrink-0"
                                style={{
                                    backgroundImage: `url('${event.image}')`,
                                }}
                            >
                                <div className="absolute top-5 right-5 h-[35px] bg-[#0D4A7A] rounded-lg px-4 flex items-center justify-center">
                                    <span className="font-['DM_Sans'] font-medium text-sm text-white">
                                        {event.badge}
                                    </span>
                                </div>
                            </div>

                            {/* Content Section */}
                            <div className="flex flex-col flex-1 p-5 gap-4">
                                <h3 className="font-['Outfit'] font-medium text-lg sm:text-xl leading-snug text-black">
                                    {event.title}
                                </h3>

                                <p className="font-['DM_Sans'] text-base leading-relaxed text-[#333333] line-clamp-2">
                                    {event.description}
                                </p>

                                <div className="flex flex-col gap-3 mt-auto">
                                    <div className="flex items-center gap-3">
                                        <Calendar size={20} color="#1E3A8A" className="shrink-0" />
                                        <span className="font-['DM_Sans'] font-medium text-base text-[#333333]">
                                            {event.date}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Clock size={20} color="#1E3A8A" className="shrink-0" />
                                        <span className="font-['DM_Sans'] font-medium text-base text-[#333333]">
                                            {event.time}
                                        </span>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <MapPin size={20} color="#1E3A8A" className="shrink-0 mt-0.5" />
                                        <span className="font-['DM_Sans'] font-medium text-base text-[#333333] break-words">
                                            {event.location}
                                        </span>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                                        <div className="font-['DM_Sans'] font-semibold text-2xl sm:text-[30px] text-black">
                                            {event.price}
                                        </div>

                                        <motion.button
                                            onMouseEnter={() => setHoveredButton(index)}
                                            onMouseLeave={() => setHoveredButton(null)}
                                            whileTap={{ scale: 0.95 }}
                                            className={`w-full sm:w-auto min-w-[140px] sm:min-w-[165px] h-10 rounded-full border border-[#1E3A8A] flex items-center justify-center gap-2 cursor-pointer transition-colors duration-300 ${
                                                hoveredButton === index ? "bg-[#1E3A8A]" : "bg-transparent"
                                            }`}
                                        >
                                            <span
                                                className={`font-['DM_Sans'] font-medium text-[15px] transition-colors duration-300 ${
                                                    hoveredButton === index ? "text-white" : "text-[#1E3A8A]"
                                                }`}
                                            >
                                                Register Now
                                            </span>
                                            <ArrowRight
                                                size={16}
                                                color={hoveredButton === index ? "#FFFFFF" : "#1E3A8A"}
                                            />
                                        </motion.button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
