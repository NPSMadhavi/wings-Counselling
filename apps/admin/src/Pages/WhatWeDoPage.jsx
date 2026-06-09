import React, { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

import { Footer } from "@/components/layout/Footer";
import { useAppointment } from "@/context/AppointmentContext";
import {
  Ear,
  ShieldCheck,
  Wrench,
  PersonStanding,
  ArrowRight,
} from "lucide-react";


const img1 = "/assets/ihero1.jpeg";
const img2 = "/assets/img2.jpg";
const img3 = "/assets/img3.jpg";
const img4 = "/assets/img4.jpg";
const img5 = "/assets/img5.jpg";
const img6 = "/assets/img6.jpg";
const img7 = "/assets/img7.jpg";
const img8 = "/assets/img8.jpg";
const img9 = "/assets/img9.png";
const img10 = "/assets/img10.png";
const img11 = "/assets/img11.png";

const articles = [
  {
    category: "Understanding",
    title: "Understanding stress vs anxiety: the difference matters",
    desc: "They're often used interchangeably, but knowing which one you're dealing with changes how you can help yourself.",
    image: img3,
    author: "Sin Teck",
    time: "5 mins read",
    date: "May 2025",
  },
  {
    category: "Techniques",
    title: "5 grounding techniques for when anxiety spikes",
    desc: "Quick tools you can use anywhere, even in a meeting.",
    image: img4,
    author: "Dr. Elena Morris",
    time: "4 min read",
    date: "June 2025",
  },
  {
    category: "Daily life",
    title: "Healthy ways to manage stress at work",
    desc: "When you can't quit, but you can't keep going like this either.",
    image: img5,
    author: "Marcus Lee",
    time: "7 min read",
    date: "July 2025",
  },
  {
    category: "Getting help",
    title: "When Should You Seek Professional Support?",
    desc: "They're often used interchangeably, but knowing which one you're dealing with changes how you can help yourself.",
    image: img6,
    author: "Sin Teck",
    time: "5 mins read",
    date: "May 2025",
  },
  {
    category: "Sleep",
    title: "5 Healthy Ways to Cope with Everyday Stress",
    desc: "Quick tools you can use anywhere, even in a meeting.",
    image: img7,
    author: "Dr. Elena Morris",
    time: "4 min read",
    date: "June 2025",
  },
  {
    category: "Body & Mind",
    title: "How Counselling Can Help With Anxiety",
    desc: "When you can't quit, but you can't keep going like this either.",
    image: img8,
    author: "Marcus Lee",
    time: "7 min read",
    date: "July 2025",
  },
];

const services = [
  {
    title: "Individual therapy",
    image: img9,
    desc: "For individuals experiencing work stress, relationship difficulties, transitional challenges, or personal dilemmas. Our counsellors use systemic communication, CBT, and expressive therapy to help you create lasting, meaningful change and improve your overall wellbeing.",
  },
  {
    title: "Children & Youth counselling",
    image: img10,
    desc: "Couples face a myriad of stressors — work, children, differing life goals, and expectations. We employ a systemic therapeutic model that builds self-awareness, fosters understanding, and creates a secure space for both partners to work through challenges together or individually.",
  },
  {
    title: "Adult counselling (Ages 21–65)",
    image: img11,
    desc: "Life transitions, grief, marital difficulties, and work-related stress affect adults in profound ways. Our counsellors provide tailored, evidence-based support using therapeutic dialogue, experiential relationship building, and cognitive-behavioural techniques to help you achieve meaningful and lasting change.",
  },
];

const styles = {
  heading: {
    fontFamily: "Outfit, sans-serif",
    fontWeight: 500,
    fontSize: "35px",
    lineHeight: "100%",
    letterSpacing: "0%",
    color: "#0D4A7A",
  },
  body: {
    fontFamily: "DM Sans, sans-serif",
    fontWeight: 400,
    fontSize: "20px",
    lineHeight: "160%",
    letterSpacing: "0%",
  },
};

export default function AnxietyPage() {
  const [, navigate] = useLocation();

  const { openModal } = useAppointment();

  const [hoveredButton, setHoveredButton] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredArticles =
  selectedCategory === "All"
    ? articles
    : articles.filter(
        (article) =>
          article.category.toLowerCase() ===
          selectedCategory.toLowerCase()
      );

  return (
    <div className="bg-[#F5F5F5] text-black overflow-x-hidden">
      {/* Fonts */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Outfit:wght@400;500;600;700&display=swap');
        `}
      </style>

      {/* HERO SECTION */}
      <section className="relative min-h-screen">
        <img
          src={img1}
          className="absolute inset-0 w-full h-full object-cover"
          alt=""
        />

        <div className="absolute inset-0 bg-black/65" />

        {/* HERO CONTENT */}
        <div className="relative z-10 navbar-align-outer flex items-center justify-center min-h-screen">
          <div className="navbar-align-inner flex items-center justify-center w-full">
          <div className="max-w-[900px] flex items-center flex-col text-center text-white w-full">
            <h1
              className="text-[64px] leading-[90px] font-medium mb-6"
              style={{
                fontFamily: "Outfit",
              }}
            >
              You don’t have to navigate anxiety alone
            </h1>

            <p
              className="max-w-[720px] mx-auto text-[24px] leading-[34px] opacity-90 mb-10"
              style={styles.body}
            >
              Learn more about stress and anxiety, explore practical coping
              strategies, and discover professional support tailored to your
              needs.
            </p>

            {/* Explore support resources */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                document
                  .getElementById("anxiety-section")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="group flex items-center gap-3 cursor-pointer"
              style={{
                height: "56px",
                padding: "0 28px",
                borderRadius: "9999px",
                backgroundColor: "#1B4585",
                color: "#FFFFFF",
                fontWeight: 600,
                border: "none",
              }}
            >
              <span>Explore support resources</span>

              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M6 9L12 15L18 9"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.button>
          </div>
          </div>
        </div>
      </section>

      {/* BREADCRUMB */}
      <div className="navbar-align-outer py-10">
        <div className="navbar-align-inner">
        <p style={styles.body}>
          <span
            onClick={() => navigate("/")}
            className="underline cursor-pointer hover:opacity-70 transition"
          >
            Home
          </span>{" "}
          <div id="anxiety-section" className="inline-flex items-center gap-2"> 
            / Stress & Anxiety
          </div>
        </p>
        </div>
      </div>

      {/* UNDERSTANDING SECTION */}
      <section className="w-full pb-13">
        <div className="grid lg:grid-cols-2 min-h-[420px]">

          {/* LEFT SIDE */}
          <div className="bg-[#0D4A7A] text-white flex">
            <div className="w-full navbar-align-outer py-14 sm:py-16 flex items-center">
              <div className="navbar-align-inner max-w-[650px]">
                <h2
                  className="mb-8 text-white text-[20px] sm:text-[30px] lg:text-[35px] leading-[110%] "
                  style={{
                    fontFamily: "Outfit",
                    fontWeight: 500,
                  }}
                >
                  Understanding anxiety: Signs, Causes & How to cope
                </h2>

                <p
                  className="text-[15px] sm:text-[16px] leading-[180%] text-white/90"
                  style={styles.body}
                >
                  Anxiety is a feeling of fear, worry, or nervousness when one is
                  about to do something challenging. Everybody experiences anxiety
                  across different situations, and it is a normal experience.
                  However, anxiety becomes a medical condition when it is
                  prolonged and starts to impact the way one would normally
                  perform ordinary tasks.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="relative min-h-[320px] lg:min-h-full">
            <img
              src={img2}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ARTICLES */}
      <section className="py-24">
        <div className="navbar-align-outer">
        <div className="navbar-align-inner">
        <div className="mb-16">
          <h2 className="mb-5" style={styles.heading}>
            Articles that might help
          </h2>

          <p className="mb-8" style={styles.body}>
            Written by the people who'd be in the room with you.
          </p>

          {/* Category Buttons */}
          <div className="flex flex-wrap gap-4">
            {[
              "All",
              "Understanding",
              "Techniques",
              "Getting help",
              "Daily life",
              "Sleep",
              "Body & Mind",
            ].map((item, i) => (
              <button
                key={i}
                onClick={() => setSelectedCategory(item)}
                className={`h-[50px] px-7 rounded-full border transition-all duration-300 ${
                  selectedCategory === item
                    ? "bg-[#1E3A8A] text-white border-[#1E3A8A]"
                    : "bg-white border-[#D2D2D2] hover:border-[#1E3A8A] hover:text-[#1E3A8A]"
                }`}
                style={styles.body}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 2xl:grid-cols-3 gap-8">
          {filteredArticles.map((article, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white group cursor-pointer"
              onClick={() => navigate("/GroundingTechniques")}
              style={{
                width: "100%",
                minHeight: "480px",
                borderRadius: "10px",
                boxShadow: "0 2px 15px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* Image */}
              <div className="relative">
                <img
                  src={article.image}
                  alt=""
                  className="w-full h-[180px] object-cover"
                />

                <div className="absolute top-4 left-4 bg-white rounded-full px-4 py-1 text-[12px]">
                  {article.category}
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-1">

                {/* Meta */}
                <div
                  className="flex justify-between text-[#1E3A8A] text-[13px] mb-4"
                  style={styles.body}
                >
                  <span>
                    {article.author} · {article.time}
                  </span>

                  <span>{article.date}</span>
                </div>

                {/* Title */}
                <h3
                  className="text-[26px] leading-[34px] mb-4"
                  style={{
                    fontFamily: "Outfit",
                    fontWeight: 500,
                  }}
                >
                  {article.title}
                </h3>

                {/* Description */}
                <p
                  className="text-[#333] mb-6 flex-1"
                  style={styles.body}
                >
                  {article.desc}
                </p>

                {/* Arrow */}
                <div className="mt-auto pt-4 flex justify-end">
                  <svg
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
              </div>
            </motion.div>
          ))}
        </div>
        </div>
        </div>
      </section>

      {/* WHAT HAPPENS */}
      <section className="pb-24">
        <div className="navbar-align-outer">
        <div className="navbar-align-inner">
        <div className="grid lg:grid-cols-2 rounded-[20px] overflow-hidden min-h-[520px] bg-white">

          {/* LEFT SIDE */}
          <div className="bg-[#0D4A7A] text-white">
            <div className="h-full flex flex-col justify-start px-8 sm:px-10 md:px-12 lg:px-14 py-12 sm:py-14 lg:py-16">

              {/* Badge */}
              <div className="border border-white rounded-full px-5 py-2 inline-flex items-center w-fit mb-8">
                <span
                  className="text-[12px] sm:text-[13px]"
                  style={styles.body}
                >
                  How counselling helps
                </span>
              </div>

              {/* Heading */}
              <h2
                className="text-[42px] sm:text-[52px] lg:text-[60px] leading-[110%] tracking-[-1px] mb-8 max-w-[430px]"
                style={{
                  fontFamily: "Outfit",
                  fontWeight: 500,
                }}
              >
                What happens in the room
              </h2>

              {/* Description */}
              <p
                className="max-w-[500px] text-[15px] sm:text-[16px] leading-[180%] text-white/90"
                style={styles.body}
              >
                Counselling isn't lying on a couch while someone analyzes you.
                It's a conversation with a trained person who is fully on your
                side, helping you understand what's going on and what to do about
                it.
              </p>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="bg-white">
            <div className="h-full flex flex-col justify-between px-6 sm:px-8 md:px-10 lg:px-14 py-12 sm:py-14 lg:py-8">

              {[
                {
                  icon: <Ear size={30} color="#DE5753" strokeWidth={2.2} />,
                  title: "You're heard without being fixed",
                  desc: "No advice you didn’t ask for. No rushing to solutions. Just space for what you’re carrying.",
                },
                {
                  icon: (
                    <ShieldCheck
                      size={30}
                      color="#DE5753"
                      strokeWidth={2.2}
                    />
                  ),
                  title: "Everything is confidential",
                  desc: "What you share stays in the room. Even your family or employer won't know unless you tell them.",
                },
                {
                  icon: (
                    <Wrench
                      size={30}
                      color="#DE5753"
                      strokeWidth={2.2}
                    />
                  ),
                  title: "You leave with real tools",
                  desc: "Techniques you can use between sessions. Ways of thinking that genuinely help when anxiety rises.",
                },
                {
                  icon: (
                    <PersonStanding
                      size={30}
                      color="#DE5753"
                      strokeWidth={2.2}
                    />
                  ),
                  title: "You set the pace, always",
                  desc: "Come weekly, monthly, or just once. Stop whenever you want. There’s no 'right' way to do this.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 sm:gap-5"
                >

                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {item.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h4
                      className="text-[18px] sm:text-[20px] lg:text-[22px] leading-[125%] mb-2 mt-2 text-[#111]"
                      style={{
                        fontFamily: "Outfit",
                        fontWeight: 500,
                      }}
                    >
                      {item.title}
                    </h4>

                    <p
                      className="text-[15px] sm:text-[16px] leading-[170%] text-[#333]"
                      style={styles.body}
                    >
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="pb-24">
        <div className="navbar-align-outer">
        <div className="navbar-align-inner">

        {/* Heading */}
        <div className="text-center max-w-[900px] mx-auto mb-16 sm:mb-20">
          <h2
            className="mb-5 sm:mb-6"
            style={styles.heading}
          >
            Support services you may find helpful
          </h2>

          <p
            className="text-[15px] sm:text-[16px] leading-[170%]"
            style={styles.body}
          >
            Professional assistance and guidance in resolving personal,
            relational, and psychological challenges — for individuals,
            couples, families, and children of all ages.
          </p>
        </div>

        {/* Cards */}
        <div className="grid lg:grid-cols-3 gap-7">

          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white rounded-[14px] overflow-hidden shadow-md flex flex-col h-full"
            >

              {/* Image */}
              <div className="relative">
                <img
                  src={service.image}
                  alt=""
                  className="w-full h-[220px] object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <h3
                  className="absolute bottom-5 left-5 right-5 text-white text-[24px] sm:text-[26px] leading-[120%]"
                  style={{
                    fontFamily: "Outfit",
                    fontWeight: 500,
                  }}
                >
                  {service.title}
                </h3>
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col flex-1">

                {/* Description */}
                <p
                  className="mb-8 flex-1 text-[15px] sm:text-[16px] leading-[170%] text-[#333]"
                  style={styles.body}
                >
                  {service.desc}
                </p>

                {/* Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openModal(service.title)}
                  className="flex items-center justify-center gap-2 mt-auto w-full cursor-pointer transition-all duration-300 min-h-[52px]"
                  style={{
                    padding: "12px 20px",
                    borderRadius: "9999px",
                    backgroundColor:
                      hoveredButton === index
                        ? "#1B4585"
                        : "#FFFFFF",
                    border: "1px solid #1B4585",
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                    fontSize: "14px",
                    color:
                      hoveredButton === index
                        ? "#FFFFFF"
                        : "#1B4585",
                  }}
                  onMouseEnter={() => setHoveredButton(index)}
                  onMouseLeave={() => setHoveredButton(null)}
                >
                  Book an appointment

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
          ))}
        </div>
        </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24 bg-[#F5F3F0]">
        <div className="navbar-align-outer">
        <div className="navbar-align-inner">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-[12px] bg-[#0D4A7A] px-8 py-[56px] text-center text-white w-full"
          >
            <h2
              className="text-[38px] leading-[115%] tracking-[-0.03em] font-semibold font-family: 'Outfit', sans-serif;"
              
            >
              Ready to talk to someone?
            </h2>

            <p className="mx-auto mt-5 max-w-[900px] text-white/85 text-[18px] leading-[190%]">
              Our counselling team is here to listen, support, and guide you in a
              safe and confidential environment.
            </p>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openModal()}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white h-[46px] px-6 text-[14px] font-semibold text-[#0D4A7A] cursor-pointer"
            >
              Book an appointment

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
          </motion.div>
        </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}