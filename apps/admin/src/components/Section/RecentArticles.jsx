import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

function ArrowIcon({ color = "currentColor" }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
        >
            <path
                d="M8 5L16 12L8 19"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function ArticleCard({ article, index }) {
    const [isHovered, setIsHovered] = useState(false);
    const [, navigate] = useLocation();

    // Remove HTML tags from content
    const plainContent = (article.content || "").replace(/<[^>]+>/g, "");

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => navigate("/GroundingTechniques")}
            className="flex flex-col bg-white rounded-[10px] overflow-hidden transition-all duration-300 cursor-pointer"
            style={{
                width: "100%",
                maxWidth: "400px",
                height: "480px",
                boxShadow: isHovered
                    ? "0 10px 30px rgba(0,0,0,0.08)"
                    : "0 2px 15px rgba(0,0,0,0.04)",
                transform: isHovered
                    ? "translateY(-5px)"
                    : "translateY(0)"
            }}
        >
            {/* Image Section */}
            <div className="relative w-full h-[200px] overflow-hidden">
                <img
                    src={article.coverImage || "/assets/article.jpg"}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-500"
                    style={{
                        transform: isHovered ? "scale(1.05)" : "scale(1)",
                        borderTopLeftRadius: "10px",
                        borderTopRightRadius: "10px"
                    }}
                    onError={(e) => {
                        e.target.src = "/assets/article.jpg";
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
                        className="font-['Plus_Jakarta_Sans'] font-semibold text-[9px] tracking-[1.2px] text-center"
                        style={{
                            color: "#1E3A8A",
                            width: "93px",
                            height: "16px",
                            lineHeight: "16px"
                        }}
                    >
                        {article.category || "General"}
                    </span>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-[20px] flex flex-col flex-1">

                {/* Author & Date */}
                <div className="flex justify-between items-center mb-4">
                    <span
                        className="font-['DM_Sans'] font-medium text-[12px] leading-[1]"
                        style={{ color: "#1E3A8A" }}
                    >
                        {article.author || "WINGS Team"}
                    </span>

                    <span
                        className="font-['DM_Sans'] font-medium text-[12px] leading-[1]"
                        style={{ color: "#1E3A8A" }}
                    >
                        {article.publishedAt
                            ? new Date(article.publishedAt).toLocaleDateString(
                                  "en-US",
                                  {
                                      month: "long",
                                      year: "numeric",
                                  }
                              )
                            : "Recent"}
                    </span>
                </div>

                {/* Title */}
                <h3
                    className="
                        font-['DM_Sans']
                        font-semibold
                        text-[20px]
                        leading-[1.2]
                        mb-4
                        text-black
                        line-clamp-3
                    "
                >
                    {article.title}
                </h3>

                {/* Content Preview */}
                <p
                    className="
                        font-['DM_Sans']
                        font-normal
                        text-[15px]
                        leading-[1.4]
                        text-black
                        mb-4
                        line-clamp-3
                    "
                >
                    {plainContent.substring(0, 140)}
                    {plainContent.length > 140 ? "..." : ""}
                </p>

                {/* Bottom Arrow */}
                <div className="mt-auto flex justify-end">
                    <motion.div
                        animate={{ x: isHovered ? 5 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center justify-center"
                    >
                        <div
                            className="mt-auto pt-4 flex justify-end"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate("/GroundingTechniques");
                            }}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                className="transition-transform duration-300 group-hover:translate-x-1"
                            >
                                <path
                                    d="M9 18L15 12L9 6"
                                    stroke="#1E3A8A"
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}

export function RecentArticles() {
    const [, navigate] = useLocation();

    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchArticles();
    }, []);

    const fetchArticles = async () => {
        try {
            setLoading(true);

            const response = await fetch("/api/articles");

            if (!response.ok) {
                throw new Error("Failed to fetch articles");
            }

            const data = await response.json();

            // ONLY PUBLISHED ARTICLES
            const publishedArticles = data.filter(
                (article) => article.isPublished === true
            );

            // SORT LATEST FIRST
            const sortedArticles = publishedArticles.sort(
                (a, b) =>
                    new Date(b.publishedAt || b.createdAt) -
                    new Date(a.publishedAt || a.createdAt)
            );

            // GET ONLY LATEST 4 ARTICLES
            const latestArticles = sortedArticles.slice(0, 4);

            setArticles(latestArticles);
            setError(null);

        } catch (err) {
            console.error("Error fetching articles:", err);
            setError("Unable to load articles. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    // Loading State
    if (loading) {
        return (
            <section
                id="recent-articles"
                className="w-full pt-[40px] pb-[60px] box-border"
                style={{ backgroundColor: "#D9E1E8" }}
            >
                <div className="navbar-align-outer">
                <div className="navbar-align-inner flex justify-center items-center py-20">
                    <div className="w-12 h-12 border-4 border-[#1B4585] border-t-transparent rounded-full animate-spin"></div>
                </div>
                </div>
            </section>
        );
    }

    // Error State
    if (error) {
        return (
            <section
                id="recent-articles"
                className="w-full pt-[40px] pb-[60px] box-border"
                style={{ backgroundColor: "#D9E1E8" }}
            >
                <div className="navbar-align-outer">
                <div className="navbar-align-inner text-center py-20">
                    <p className="text-red-600">{error}</p>

                    <button
                        onClick={fetchArticles}
                        className="mt-4 px-6 py-2 bg-[#1B4585] text-white rounded-full"
                    >
                        Try Again
                    </button>
                </div>
                </div>
            </section>
        );
    }

    return (
        <section
            id="recent-articles"
            className="w-full pt-[40px] pb-[60px] box-border"
            style={{ backgroundColor: "#D9E1E8" }}
        >
            <div className="navbar-align-outer">
            <div className="navbar-align-inner flex flex-col items-center">

                {/* Header */}
                <div className="text-center mb-10">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="
                            font-['Outfit']
                            font-medium
                            text-[28px]
                            sm:text-[32px]
                            md:text-[35px]
                            leading-[1.2]
                            mb-4
                            text-[#0D4A7A]
                            text-center
                        "
                    >
                        Our recent articles
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="
                            font-['DM_Sans']
                            font-medium
                            text-[16px]
                            sm:text-[18px]
                            md:text-[20px]
                            leading-[1.4]
                            text-black
                            text-center
                        "
                    >
                        Stay informed with our latest insights
                    </motion.p>
                </div>

                {/* Articles Grid */}
                {articles.length > 0 ? (
                    <div
                        className="
                            grid
                            grid-cols-1
                            md:grid-cols-2
                            xl:grid-cols-4
                            gap-6
                            xl:gap-8
                            w-full
                            mb-10
                            justify-items-center
                        "
                    >
                        {articles.map((article, index) => (
                            <ArticleCard
                                key={article.id}
                                article={article}
                                index={index}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10">
                        <p className="font-['DM_Sans'] text-gray-600">
                            No published articles available at the moment.
                        </p>
                    </div>
                )}

                {/* View All Button */}
                <motion.button
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate("/articles")}
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
        </section>
    );
}