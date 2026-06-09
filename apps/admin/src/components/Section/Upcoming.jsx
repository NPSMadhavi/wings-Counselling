import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { GetInTouch } from "./GetInTouch";
import { RecentArticles } from "./RecentArticles";
import { CalendarDays, Clock3, MapPin } from "lucide-react";

const events = [
    {
        id: 1,
        type: "Workshop",
        title: "Managing anxiety in modern life",
        description:
            "A practical, evidence-based workshop on understanding the anxiety cycle and developing personalised tools to reclaim calm.",
        date: "Saturday, 10 May 2025",
        time: "9:00 AM – 12:00 PM",
        location: "Wings center, Orchard road",
        btnLabel: "Register now"
    },
    {
        id: 2,
        type: "Webinar",
        title: "Mindful parenting programme",
        description:
            "A 3-session series for parents seeking to deepen connection with their children and manage the unique stresses of modern parenthood.",
        date: "Wednesday, 21 May 2025",
        time: "6:00 PM – 7:30 PM",
        location: "Online - Zoom",
        btnLabel: "Register now"
    },
    {
        id: 3,
        type: "Seminar",
        title: "Building resilience in stressful times",
        description:
            "Learn strategies to strengthen emotional resilience and bounce back from setbacks with confidence.",
        date: "Thursday, 5 June 2025",
        time: "2:00 PM – 4:00 PM",
        location: "Harmony hall, Civic center",
        btnLabel: "Register now"
    },
    {
        id: 4,
        type: "Seminar",
        title: "Positive parenting strategies",
        description:
            "Build a positive parent-child relationship with effective, compassionate strategies.",
        date: "Friday, 5 June 2025",
        time: "2:00 PM – 4:00 PM",
        location: "Harmony hall, Civic center",
        btnLabel: "Register now"
    }
];

/* ─── Event Card ───────────────────────────────────────────── */

function EventCard({ event, index }) {
    const [hovered, setHovered] = useState(false);

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
            className={`
                w-full
                max-w-[400px]
                min-h-[450px]
                rounded-[10px]
                bg-[#F7F6F3]
                overflow-hidden
                flex
                flex-col
                transition-all
                duration-300
                ${hovered
                    ? "shadow-[0_8px_24px_rgba(0,0,0,0.12)] -translate-y-2 scale-[1.02]"
                    : "shadow-[0_2px_8px_rgba(0,0,0,0.08)]"}
            `}
        >
            {/* Top Gradient */}
            <div className="w-full h-[15px] bg-gradient-to-r from-[#1B4585] to-[#42A0BD]" />

            <div className="p-6 flex flex-col flex-1">

                {/* Type Badge */}
                <div className="inline-flex px-4 py-1 rounded-full border border-[#1B4585] w-fit mb-5">
                    <span className="text-[#1B4585] text-[12px] font-semibold tracking-[0.5px] font-['DM_Sans']">
                        {event.type}
                    </span>
                </div>

                {/* Title */}
                <h3 className="text-black font-['DM_Sans'] text-[20px] font-semibold mb-3">
                    {event.title}
                </h3>

                {/* Description */}
                <p className="text-black font-['DM_Sans'] text-[15px] leading-[1.5] mb-6">
                    {event.description}
                </p>

                {/* Info - Fixed position section */}
                <div className="flex flex-col gap-4 mt-auto mb-6">
                    {/* Date */}
                    <div className="flex items-center gap-4">
                        <CalendarDays className="text-[#1E3A8A] w-5 h-5" />
                        <span className="text-[15px] font-medium text-black font-['DM_Sans']">
                            {event.date}
                        </span>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-4">
                        <Clock3 className="text-[#1E3A8A] w-5 h-5" />
                        <span className="text-[15px] font-medium text-black font-['DM_Sans']">
                            {event.time}
                        </span>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-4">
                        <MapPin className="text-[#1E3A8A] w-5 h-5 mt-0.5" />
                        <span className="text-[15px] font-medium text-black font-['DM_Sans'] leading-[1.4]">
                            {event.location}
                        </span>
                    </div>
                </div>

                {/* Register Button */}
                <motion.a
                    href="#"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.open("https://ramakrishna.org.sg/event", "_blank") }
                    className={`
                        w-full
                        h-[42px]
                        rounded-full
                        border
                        border-[#1B4585]
                        flex
                        items-center
                        justify-center
                        gap-3
                        font-['DM_Sans']
                        text-[15px]
                        font-medium
                        transition-all
                        duration-300
                        ${hovered
                            ? "bg-[#1B4585] text-white"
                            : "bg-white text-[#1B4585]"}
                    `}
                >
                    {event.btnLabel}

                    {/* Arrow Icon */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        className={`transition-transform duration-300 ${hovered ? "translate-x-1" : ""}`}
                    >
                        <path
                            d="M8 5L16 12L8 19"
                            stroke={hovered ? "white" : "#1B4585"}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </motion.a>
            </div>
        </motion.div>
    );
}

/* ─── Main Component ───────────────────────────────────────── */

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
            className="
                relative
                w-full
                flex
                flex-col
                items-center
                overflow-hidden
                bg-[#F7F6F3]
            "
        >
            <motion.div
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{ y: bgY }}
            />

            {/* UPCOMING SECTION */}
            <section
                id="upcoming"
                className="w-full flex flex-col items-center pt-[40px] pb-[60px] box-border"
            >
                <div className="w-full navbar-align-outer">
                <div className="navbar-align-inner flex flex-col items-center">
                {/* Heading */}
                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="
                        text-[28px]
                        sm:text-[32px]
                        md:text-[35px]
                        text-center
                        font-medium
                        font-['Outfit']
                        mb-4
                        text-[#0D4A7A]
                    "
                >
                    Upcoming events & Workshops
                </motion.h2>

                {/* Subheading */}
                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="
                        text-[16px]
                        sm:text-[18px]
                        md:text-[20px]
                        text-center
                        font-['DM_Sans']
                        font-medium
                        leading-[1.5]
                        max-w-[800px]
                        mb-8
                    "
                >
                    Join our community events designed to educate, connect,
                    and empower. Healing doesn't always happen alone
                </motion.p>

                {/* Events Grid */}
                <div className="
                    grid
                    grid-cols-1
                    md:grid-cols-2
                    xl:grid-cols-4
                    gap-6
                    xl:gap-8
                    w-full
                    mb-6
                    justify-items-center
                ">
                    {events.map((event, index) => (
                        <EventCard
                            key={event.id}
                            event={event}
                            index={index}
                        />
                    ))}
                </div>

                {/* View All Button */}
                <div className="mt-2 md:mt-4">
                    <motion.button
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        // transition={{ duration: 0.6, delay: 0.6 }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate("/events")}
                        className="
                            group
                            flex
                            items-center
                            justify-center
                            gap-2
                            whitespace-nowrap
                            rounded-full
                            bg-[#1B4585]
                            text-white
                            font-['Plus_Jakarta_Sans']
                            font-[700]
                            transition-all
                            duration-300
                            shadow-[0_4px_12px_rgba(27,69,133,0.3)]
                        "
                        style={{
                            height: "46px",
                            padding: "0 24px",
                            fontSize: "clamp(13px,0.9vw,15px)",
                        }}
                    >
                        View all
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                        >
                            <path
                                d="M9 18L15 12L9 6"
                                stroke="currentColor"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </motion.button>
                </div>
                </div>
                </div>
            </section>

            {/* RECENT ARTICLES */}
            <RecentArticles />

            {/* GET IN TOUCH */}
            <GetInTouch />
        </motion.div>
    );
}