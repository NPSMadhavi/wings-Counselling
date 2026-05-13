import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

const articles = [
    {
        id: 1,
        category: "RELATIONSHIPS",
        author: "Sin Teck · TA Practitioner",
        date: "May 2025",
        title: "How to have difficult conversations with your partner without becoming an argument",
        excerpt: "Communication breakdowns are at the heart of most relationship struggles. Here are five evidence-based techniques our couples counsellors recommend.",
        image: "/assets/article.jpg",
        color: "#1E3A8A"
    },
    {
        id: 2,
        category: "WORKPLACE",
        author: "Dr. Elena Morris · Relationship Expert",
        date: "June 2025",
        title: "Burnout vs exhaustion: how to tell the difference and when to seek help",
        excerpt: "Not all tiredness is burnout. Understanding the distinction matters because the recovery path looks very different. Our counsellor breaks it down.",
        image: "/assets/article1.jpg",
        color: "#1E3A8A"
    },
    {
        id: 3,
        category: "GRIEF & LOSS",
        author: "Marcus Lee · Licensed Counselor",
        date: "July 2025",
        title: "Grieving a relationship: why breakups and divorce hurt so much — and how to heal",
        excerpt: "The end of a significant relationship is a genuine loss, and it deserves the same care and space as any other form of grief. Our counsellor explores the stages and paths forward.",
        image: "/assets/article2.jpg",
        color: "#1E3A8A"
    },
    {
        id: 4,
        category: "SELF-CARE",
        author: "Madhura · Senior Counselor",
        date: "August 2025",
        title: "The art of saying no: setting boundaries for your mental well-being",
        excerpt: "Boundaries are not walls; they are the gates that allow you to manage your energy and protect your peace of mind in a demanding world.",
        image: "/assets/counselling4.jpg",
        color: "#1E3A8A"
    }
];

function ArrowIcon() {
    return (
        <svg width="15" height="20" viewBox="0 0 15 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.5 10H13.5M13.5 10L8.5 5M13.5 10L8.5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function ArticleCard({ article, index }) {
    const [isHovered, setIsHovered] = useState(false);
    const [, navigate] = useLocation();

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => navigate("/services")}
            className="flex flex-col bg-white rounded-[10px] overflow-hidden transition-all duration-300 cursor-pointer"
            style={{
                width: "100%",
                maxWidth: "400px",
                height: "480px",
                boxShadow: isHovered ? "0 10px 30px rgba(0,0,0,0.08)" : "0 2px 15px rgba(0,0,0,0.04)",
                transform: isHovered ? "translateY(-5px)" : "translateY(0)"
            }}
        >
            {/* Image Section */}
            <div className="relative w-full h-[200px] overflow-hidden">
                <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-500"
                    style={{
                        transform: isHovered ? "scale(1.05)" : "scale(1)",
                        borderTopLeftRadius: "10px",
                        borderTopRightRadius: "10px"
                    }}
                />
                {/* Category Tag */}
                <div
                    className="absolute top-[15px] left-[15px] flex items-center justify-center rounded-[9999px] px-[16px] py-[6px]"
                    style={{
                        backgroundColor: "#FFF",
                        width: "125px",
                        height: "26px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                    }}
                >
                    <span
                        className="font-['Plus_Jakarta_Sans'] font-semibold text-[10px] uppercase tracking-[1.2px] text-center"
                        style={{ color: "#1E3A8A", width: "93px", height: "16px", lineHeight: "16px" }}
                    >
                        {article.category}
                    </span>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-[20px] flex flex-col flex-1">
                {/* Author & Date */}
                <div className="flex justify-between items-center mb-4">
                    <span
                        className="font-['DM_Sans'] font-medium text-[12px] leading-[1]"
                        style={{ color: "#1E3A8A", width: "auto", height: "16px" }}
                    >
                        {article.author}
                    </span>
                    <span
                        className="font-['DM_Sans'] font-medium text-[12px] leading-[1]"
                        style={{ color: "#1E3A8A", width: "auto", height: "16px" }}
                    >
                        {article.date}
                    </span>
                </div>

                {/* Title */}
                <h3
                    className="font-['DM_Sans'] font-semibold text-[20px] leading-[1.2] mb-4 text-black line-clamp-3"
                    style={{ height: "auto", minHeight: "40px" }}
                >
                    {article.title}
                </h3>

                {/* Excerpt */}
                <p
                    className="font-['DM_Sans'] font-normal text-[15px] leading-[1.4] text-black mb-4 line-clamp-3"
                    style={{ height: "auto" }}
                >
                    {article.excerpt}
                </p>

                {/* Bottom Arrow */}
                <div className="mt-auto flex justify-end p-[10px]">
                    <motion.div
                        animate={{ x: isHovered ? 5 : 0 }}
                        className="text-black flex items-center justify-center"
                        style={{ width: "15px", height: "20px" }}
                    >
                        <ArrowIcon />
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}

export function RecentArticles() {
    const [, navigate] = useLocation();

    return (
        <section
            id="recent-articles"
            className="w-full py-20 lg:py-32 px-6 md:px-16 lg:px-24 xl:px-[100px] box-border"
            style={{ backgroundColor: "#F7F6F3" }}
        >
            <div className="flex flex-col items-center">
                {/* Header */}
                <div className="text-center mb-12">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="font-['Outfit'] font-medium text-[35px] leading-[1] mb-4 text-black text-center"
                        style={{ width: "auto", height: "44px" }}
                    >
                        Our Recent Articles
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="font-['DM_Sans'] font-medium text-[20px] leading-[1] text-black text-center"
                        style={{ width: "auto", height: "26px" }}
                    >
                        Stay informed with our latest insights
                    </motion.p>
                </div>

                {/* Articles Grid - Updated to 4 columns on XL screens */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 xl:gap-8 w-full mb-16 justify-items-center">
                    {articles.map((article, index) => (
                        <ArticleCard key={article.id} article={article} index={index} />
                    ))}
                </div>

                {/* View All Button */}
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/articles")}
                    className="flex items-center justify-center rounded-[9999px] px-[32px] py-[16px] transition-all duration-300"
                    style={{
                        backgroundColor: "#1B4585",
                        color: "#FFF",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: "18px",
                        fontWeight: "600",
                        width: "130px",
                        height: "59px",
                        boxShadow: "0 4px 14px rgba(27, 69, 133, 0.25)",
                        cursor: "pointer"
                    }}
                >
                    View all
                </motion.button>
            </div>
        </section>
    );
}
