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
    const [subEmail, setSubEmail] = useState("");
    const [subStatus, setSubStatus] = useState("idle"); // idle | loading | success | duplicate | error

    const cleanArticleContent = (content = "") =>
        content
            .replace(/<!--[\s\S]*?-->/g, " ")
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/\s+/g, " ")
            .trim();

    const handleSubscribe = async (e) => {
        e.preventDefault();
        if (!subEmail.trim()) return;
        setSubStatus("loading");
        try {
            const res = await fetch("/api/event-subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: subEmail.trim() }),
            });
            if (res.status === 409) { setSubStatus("duplicate"); return; }
            if (!res.ok) throw new Error();
            setSubStatus("success");
            setSubEmail("");
        } catch {
            setSubStatus("error");
        }
    };

    // FETCH ARTICLES
    const fetchArticles = async () => {
        try {
            const response = await fetch("/api/articles");

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
                        onClick={() => {
                            document
                                .getElementById("featured-articles")
                                ?.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start",
                                });
                        }}
                        className="mt-10 bg-[#1B4585] rounded-full px-8 py-4 flex items-center gap-3 text-white"
                    >
                        Explore our articles
                     <svg
  width="20"
  height="20"
  viewBox="0 0 24 24"
  fill="none"
>
  <path
    d="M6 9L12 15L18 9"
    stroke="white"
    strokeWidth="3.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
</svg>
                    </motion.button>
                </div>
            </div>
            {/* FEATURED ARTICLES SECTION */}
        <div className="w-full flex flex-col items-center py-16 md:py-24 bg-[#FAFAF5]">
                <div className="w-full px-6 md:px-12 lg:px-24 xl:px-[150px] flex flex-col">
                    {/* Title */}
                    <div id="featured-articles">
                        <h2
                            style={{
                                fontFamily: "'Outfit', sans-serif",
                                fontWeight: 600,
                                fontSize: "clamp(28px, 5vw, 35px)",
                                lineHeight: "100%",
                                color: "#0D4A7A",
                                marginBottom: "40px",
                            }}
                        >
                            Featured articles
                        </h2>
                    </div>

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
                                    maxWidth: "900px",
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
                                    maxWidth: "900px",
                                }}
                            >
                                Anxiety is one of the most common reasons people seek counselling support. But what exactly is it? In this guide, our senior counsellor explains the difference between everyday worry and clinical anxiety, the physical signs to look out for, and the evidence-based approaches WINGS uses to support clients through their anxiety journey.
                            </p>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate("/GroundingTechniques")}
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
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                >
                                <path
                                    d="M9 18L15 12L9 6"
                                    stroke="white"
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
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
                            { name: "Counselling & Therapy", active: false },
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

            {/* ARTICLES GRID - Reduced bottom padding */}
            <div className="w-full flex flex-col items-center pt-6 pb-12 bg-[#FAFAF5]">
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
                                    onClick={() => navigate("/GroundingTechniques")}
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
                                            <span className="text-[#1E3A8A] text-[11px] font-semibold ">
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
                                            {cleanArticleContent(article.content)}
                                        </p>

                                        {/* BUTTON */}
                                        <button
                                            className="mt-auto ml-auto flex items-center justify-center text-black hover:translate-x-1 transition-all duration-300"
                                            onClick={() => navigate(`/articles/${article.slug}`)}
                                        >
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
                                        </button>
                                    </div>
                                </motion.div>
                            ))}

                        </div>
                    )}
                </div>
            </div>
            
            {/* NEWSLETTER / UPCOMING ARTICLES SECTION - Reduced top padding */}
            <div className="w-full flex flex-col items-center py-12 bg-[#FAFAF5]">
                <div
                    className="w-full mx-[150px] flex flex-col items-center justify-center relative overflow-hidden"
                    style={{
                        width: "calc(100% - 300px)",
                        height: "338px",
                        backgroundColor: "#0D4A7A",
                        borderRadius: "20px",
                        padding: "40px",
                    }}
                >
                    {/* Badge */}
                    <div
                        className="flex items-center justify-center border border-white mb-6"
                        style={{
                            padding: "6px 16px",
                            borderRadius: "9999px",
                        }}
                    >
                        <span
                            style={{
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                fontWeight: 600,
                                fontSize: "16px",
                                letterSpacing: "1.2px",
                                color: "#FFFFFF",
                            }}
                        >
                            Upcoming articles
                        </span>
                    </div>

                    {/* Title */}
                    <h2
                        style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontWeight: 500,
                            fontSize: "35px",
                            lineHeight: "100%",
                            color: "#FFFFFF",
                            marginBottom: "16px",
                        }}
                    >
                        Articles in your inbox
                    </h2>

                    {/* Subtitle */}
                    <p
                        style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: 500,
                            fontSize: "20px",
                            lineHeight: "100%",
                            color: "#FFFFFF",
                            marginBottom: "40px",
                            textAlign: "center",
                        }}
                    >
                        Monthly insights from our counsellors. No spam — ever.
                    </p>

                    {/* Form */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
                        {subStatus === "success" ? (
                            <p style={{ color: "#FFFFFF", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: "17px", textAlign: "center" }}>
                                ✅ You're subscribed! We'll notify you when new articles are published.
                            </p>
                        ) : (
                            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
                                <div
                                    className="relative"
                                    style={{
                                        width: "100%",
                                        maxWidth: "483px",
                                        height: "60px",
                                    }}
                                >
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2">
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="#9CA3AF"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                            <polyline points="22,6 12,13 2,6" />
                                        </svg>
                                    </div>
                                    <input
                                        type="email"
                                        value={subEmail}
                                        onChange={(e) => { setSubEmail(e.target.value); setSubStatus("idle"); }}
                                        placeholder="Enter your email address"
                                        required
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            borderRadius: "30px",
                                            border: "none",
                                            paddingLeft: "60px",
                                            paddingRight: "20px",
                                            fontFamily: "'DM Sans', sans-serif",
                                            fontWeight: 400,
                                            fontSize: "18px",
                                            outline: "none",
                                            background: "#FFFFFF",
                                        }}
                                    />
                                </div>

                                <motion.button
                                    type="submit"
                                    disabled={subStatus === "loading"}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                        width: "160px",
                                        height: "60px",
                                        background: "transparent",
                                        borderRadius: "9999px",
                                        border: "1px solid #FFFFFF",
                                        color: "#F5F9FF",
                                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                                        fontWeight: 600,
                                        fontSize: "18px",
                                        cursor: "pointer",
                                        transition: "all 0.3s ease",
                                        opacity: subStatus === "loading" ? 0.7 : 1,
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = "white";
                                        e.currentTarget.style.color = "#0D4A7A";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = "transparent";
                                        e.currentTarget.style.color = "#F5F9FF";
                                    }}
                                >
                                    {subStatus === "loading" ? "..." : "Notify me"}
                                </motion.button>
                            </form>
                        )}
                    </div>
                    {subStatus === "duplicate" && (
                        <p style={{ color: "#FFD700", fontFamily: "'DM Sans', sans-serif", fontSize: "14px", marginTop: "10px", textAlign: "center" }}>
                            You're already subscribed — we'll keep you posted!
                        </p>
                    )}
                    {subStatus === "error" && (
                        <p style={{ color: "#FCA5A5", fontFamily: "'DM Sans', sans-serif", fontSize: "14px", marginTop: "10px", textAlign: "center" }}>
                            Something went wrong. Please try again.
                        </p>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
}
