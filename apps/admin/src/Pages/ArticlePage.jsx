import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { Footer } from "../components/Layout/Footer.jsx";
import { useLocation } from "wouter";
import { useAppointment } from "@/context/AppointmentContext";

export default function ArticlePage() {
    const [, navigate] = useLocation();
    const { openModal } = useAppointment();

    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);

    // FETCH ARTICLES
    const fetchArticles = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/articles");

            if (!response.ok) {
                throw new Error("Failed to fetch articles");
            }

            const data = await response.json();

            console.log("ARTICLES DATA:", data);

            setArticles(data);
        } catch (error) {
            console.error("Error fetching articles:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchArticles();
    }, []);

    return (
        <div className="w-full flex flex-col min-h-screen bg-[#FAFAF5]">

            {/* HERO SECTION */}
            <div
                className="relative w-full overflow-hidden"
                style={{
                    height: "780px",
                    background: `linear-gradient(180deg, rgba(58, 58, 58, 0.8) 0%, rgba(0, 0, 0, 0.8) 75.96%), url('/assets/EventsHeroImage.jpg')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            >
                <div className="relative w-full h-full flex flex-col items-center justify-center text-center px-6">

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-white text-[60px] font-semibold mb-6"
                    >
                        Articles & mental health resources
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-white text-[20px] max-w-[750px]"
                    >
                        Practical guides, expert insights, and compassionate advice.
                    </motion.p>

                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="mt-10 bg-[#1B4585] rounded-full px-8 py-4 flex items-center gap-3 text-white"
                    >
                        Explore Our Articles
                        <ArrowDown size={20} />
                    </motion.button>
                </div>
            </div>

            {/* FEATURED ARTICLES SECTION */}
            <div className="w-full flex flex-col items-center py-16 md:py-24 bg-[#FAFAF5]">
                <div className="w-full px-6 md:px-12 lg:px-24 xl:px-[150px] flex flex-col">
                    {/* Title */}
                    <h2
                        style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontWeight: 600,
                            fontSize: "clamp(28px, 5vw, 35px)",
                            lineHeight: "100%",
                            color: "#000000",
                            marginBottom: "40px",
                        }}
                    >
                        Featured Articles
                    </h2>

                    {/* Featured Box */}
                    <div
                        className="w-full flex flex-col md:flex-row bg-white overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
                        style={{
                            minHeight: "420px",
                            borderRadius: "10px",
                        }}
                    >
                        {/* IMAGE */}
                        <div
                            className="w-full md:w-[420px] shrink-0 relative"
                            style={{
                                backgroundImage: `url('/assets/Articleimage.jpg')`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                            }}
                        >
                            <style>{`
                                @media (min-width: 768px) {
                                    .featured-image { height: 420px !important; }
                                }
                                .featured-image { height: 300px; }
                            `}</style>
                            <div className="featured-image w-full h-full relative">
                                {/* Tag on Image */}
                                <div
                                    className="absolute top-5 left-5 bg-white flex items-center justify-center px-4"
                                    style={{
                                        height: "26px",
                                        borderRadius: "9999px",
                                        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                                            fontWeight: 700,
                                            fontSize: "10px",
                                            letterSpacing: "1.2px",
                                            color: "#1E3A8A",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        Anxiety & Stress
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* CONTENT */}
                        <div
                            className="flex-1 flex flex-col justify-center p-8 md:px-12"
                        >
                            <span
                                style={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontWeight: 500,
                                    fontSize: "16px",
                                    color: "#1E3A8A",
                                    marginBottom: "12px",
                                }}
                            >
                                Sin Teck · TA Practitioner – May 2025
                            </span>

                            <h3
                                style={{
                                    fontFamily: "'Outfit', sans-serif",
                                    fontWeight: 600,
                                    fontSize: "clamp(22px, 4vw, 28px)",
                                    lineHeight: "1.2",
                                    color: "#000000",
                                    marginBottom: "16px",
                                    maxWidth: "600px",
                                }}
                            >
                                Understanding anxiety: what it is, why it happens, and how counselling can help
                            </h3>

                            <p
                                style={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontWeight: 400,
                                    fontSize: "16px",
                                    lineHeight: "26px",
                                    color: "#333333",
                                    marginBottom: "24px",
                                    maxWidth: "680px",
                                }}
                            >
                                Anxiety is one of the most common reasons people seek counselling support. But what exactly is it? In this guide, our senior counsellor explains the difference between everyday worry and clinical anxiety, the physical signs to look out for, and the evidence-based approaches WINGS uses to support clients through their anxiety journey.
                            </p>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    width: "190px",
                                    height: "50px",
                                    background: "#1E4B8A",
                                    borderRadius: "9999px",
                                    color: "#fff",
                                    border: "none",
                                    fontSize: "16px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "10px",
                                    fontFamily: "'DM Sans', sans-serif",
                                }}
                            >
                                <span>Read full article</span>
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>

            {/* FILTER & SEARCH SECTION */}
            <div className="w-full flex flex-col items-center py-10 bg-[#FAFAF5]">
                <div className="w-full px-6 md:px-12 lg:px-24 xl:px-[150px] flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    {/* Categories */}
                    <div className="flex flex-wrap items-center gap-3 md:gap-4">
                        {[
                            { name: "All", active: true },
                            { name: "Counselling", active: false },
                            { name: "Supervision", active: false },
                            { name: "Training & Workshop", active: false },
                        ].map((cat) => (
                            <button
                                key={cat.name}
                                style={{
                                    height: "50px",
                                    padding: "0 24px",
                                    borderRadius: "16px",
                                    backgroundColor: cat.active ? "#1B4585" : "#FFFFFF",
                                    color: cat.active ? "#FFFFFF" : "#000000CC",
                                    border: cat.active ? "none" : "1px solid #E5E7EB",
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: "16px",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.3s ease",
                                }}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    {/* Search Bar */}
                    <div
                        className="relative w-full lg:max-w-[420px]"
                        style={{ height: "60px" }}
                    >
                        <div
                            className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
                            style={{ width: "24px", height: "24px" }}
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search article"
                            style={{
                                width: "100%",
                                height: "100%",
                                borderRadius: "20px",
                                border: "1px solid #E5E7EB",
                                paddingLeft: "55px",
                                paddingRight: "20px",
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: "20px",
                                fontWeight: 500,
                                color: "#000000CC",
                                outline: "none",
                                background: "#FFFFFF",
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* ARTICLES GRID */}
            <div className="w-full flex flex-col items-center pt-6 py-20 bg-[#FAFAF5]">
                <div className="w-full px-6 md:px-12 lg:px-24 xl:px-[150px]">

                    {loading ? (
                        <div className="text-center text-[20px]">
                            Loading articles...
                        </div>
                    ) : articles.length === 0 ? (
                        <div className="text-center text-[20px]">
                            No articles found
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-10">

                            {articles.map((article, idx) => (
                                <motion.div
                                    key={article.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                                    viewport={{ once: true }}
                                    className="bg-white group cursor-pointer rounded-[10px] overflow-hidden shadow-md"
                                >
                                    {/* IMAGE */}
                                    <div className="relative w-full h-[220px] overflow-hidden">
                                        <img
                                            src={
                                                article.coverImage
                                                    ? article.coverImage
                                                    : "/assets/article.jpg"
                                            }
                                            alt={article.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />

                                        {/* CATEGORY */}
                                        <div className="absolute top-4 left-4 bg-white px-4 py-1 rounded-full">
                                            <span className="text-[#1E3A8A] text-[11px] font-semibold uppercase">
                                                {article.category}
                                            </span>
                                        </div>
                                    </div>

                                    {/* CONTENT */}
                                    <div className="p-6 flex flex-col">

                                        {/* AUTHOR + DATE */}
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-[#1E3A8A] text-[13px] font-medium">
                                                {article.author}
                                            </span>

                                            <span className="text-[#1E3A8A] text-[13px] font-medium">
                                                {article.publishedAt
                                                    ? new Date(article.publishedAt).toLocaleDateString()
                                                    : ""}
                                            </span>
                                        </div>

                                        {/* TITLE */}
                                        <h3 className="text-[20px] font-semibold leading-[1.4] mb-3">
                                            {article.title}
                                        </h3>

                                        {/* EXCERPT */}
                                        <p className="text-[14px] leading-[1.7] text-[#555] mb-5">
                                            {article.excerpt}
                                        </p>

                                        {/* BUTTON */}
                                        <button
                                            className="mt-auto bg-[#1B4585] text-white rounded-full h-[45px] px-5 text-[14px] font-medium hover:bg-[#16386b] transition-all"
                                            onClick={() => navigate(`/articles/${article.slug}`)}
                                        >
                                            Read Full Article
                                        </button>
                                    </div>
                                </motion.div>
                            ))}

                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
}