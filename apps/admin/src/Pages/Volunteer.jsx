// src/pages/Volunteer.jsx


import React from "react";
import { useLocation } from "wouter";

import { motion } from "framer-motion";

import { Footer } from "@/components/Layout/Footer";

import {

  HeartHandshake,

  Mic,

  Users,

  TreePine,

  ClipboardList,

  GraduationCap,

  Briefcase,

  Heart,

} from "lucide-react";



/* ───────────── DATA ───────────── */


const volunteerCards = [

  {

    title: "Learn & Grow",

    text: "Gain valuable experience in counselling support environments, communication, teamwork, event coordination, and community engagement.",

    image: "/assets/vimg1.jpg",

  },

  {

    title: "Make a Positive Impact",

    text: "Support meaningful initiatives and contribute directly to emotional well-being and community care programs.",

    image: "/assets/vimg2.jpg",

  },

  {

    title: "Be Part of a Supportive Community",

    text: "Connect with like-minded people who care deeply about creating positive change in the community.",

    image: "/assets/vimg3.jpg",

  },

  {

    title: "Flexible Involvement",

    text: "Choose opportunities that fit your schedule and availability while making a genuine difference.",

    image: "/assets/vimg4.jpg",

  },

];



const opportunities = [

  {

    icon: <Mic size={24} strokeWidth={2} />,

    title: "Talks & Workshops",

    subtitle: "Best for: confident speakers, specialists",

    description:

      "Help us run mental wellness workshops, talks for parents, mindfulness sessions, and community fundraisers. Setup, greeting, logistics — the warm welcome that makes people feel safe enough to stay.",

    tags: ["Weekends only", "2-3 hour sessions"],

  },

  {

    icon: <Users size={24} strokeWidth={2} />,

    title: "Outreach",

    subtitle: "Best for: people who love connecting",

    description:

      "Represent WINGS at schools, community events, and corporate wellness fairs. You'll spread awareness about mental health support and help people who need us actually find us.",

    tags: ["Event based", "Schools & community spaces"],

  },

  {

    icon: <TreePine size={24} strokeWidth={2} />,

    title: "Outings & Activities",

    subtitle: "Best for: warm, patient, playful people",

    description:

      "Help with outings for the youth and children we support: games, day trips, art sessions. This is where lifelong memories get made, sometimes for kids who don't get many of them.",

    tags: ["Weekends", "Child-friendly"],

  },

  {

    icon: <ClipboardList size={24} strokeWidth={2} />,

    title: "Administrative support",

    subtitle: "Best for: quietly helpful, detail-oriented",

    description:

      "Behind every event is paperwork, logistics, and coordination. If you'd rather support quietly from a desk than be front-of-house, this is where you shine.",

    tags: ["Weekday office", "2-3 hour sessions"],

  },

];



const processSteps = [

  {

    step: 1,

    title: "Fill the form",

    desc: "A few details about you, what you'd like to do, and your availability.",

  },

  {

    step: 2,

    title: "Team review",

    desc: "Our coordinator reads your application and calls you for a relaxed conversation.",

  },

  {

    step: 3,

    title: "Orientation",

    desc: "Meet your coordinator and senior counsellors. Everything you need to know, in person.",

  },

  {

    step: 4,

    title: "Start volunteering",

    desc: "We pair you with experienced volunteers for your first events. Nobody starts alone.",

  },

];



const whoVolunteers = [

  {

    icon: <GraduationCap size={28} strokeWidth={2} />,

    title: "Students",

    description:

      "University students looking to give back, gain experience, and fulfill community involvement hours in a safe, supportive setting.",

  },

  {

    icon: <Briefcase size={28} strokeWidth={2} />,

    title: "Working professionals",

    description:

      "Those who want to give a couple of hours to a social cause that fits your schedule — a meaningful outlet from your day-to-day.",

  },

  {

    icon: <Heart size={28} strokeWidth={2} />,

    title: "Retirees & seniors",

    description:

      "With a lifetime of experience, wisdom and compassion, your steady presence can have a powerful impact on vulnerable communities.",

  },

];



/* ───────────── ANIMATION VARIANTS ───────────── */



const fadeUp = {

  hidden: { opacity: 0, y: 30 },

  visible: (i = 0) => ({

    opacity: 1,

    y: 0,

    transition: { duration: 0.7, delay: i * 0.12, ease: "easeOut" },

  }),

};



const staggerContainer = {

  hidden: { opacity: 0 },

  visible: {

    opacity: 1,

    transition: { staggerChildren: 0.12, delayChildren: 0.15 },

  },

};



/* ───────────── COMPONENT ───────────── */



const Volunteer = () => {
  const [, navigate] = useLocation();

  return (

    <>

      <main className="bg-[#F7F6F3]">



        {/* ════════════════════  HERO  ════════════════════ */}

        <section

          className="relative w-full bg-cover bg-center"

          style={{

            backgroundImage: "url('/assets/vhero.jpg')",

            height: "clamp(520px, 55vw, 780px)",

          }}

        >

          <div className="absolute inset-0" style={{ background: "linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.65))" }} />



          <div

            className="relative z-10 flex flex-col items-center justify-center text-center text-white px-4 sm:px-6 md:px-10 h-full"

          >

            {/* Title — Outfit 500 60px line-height 100% center #FFFFFF */}

            <motion.h1

              initial={{ opacity: 0, y: 40 }}

              animate={{ opacity: 1, y: 0 }}

              transition={{ duration: 0.9, ease: "easeOut" }}

              style={{

                fontFamily: "'Outfit', sans-serif",

                fontWeight: 500,

                fontSize: "clamp(34px, 4.5vw, 60px)",

                lineHeight: "100%",

                textAlign: "center",

                color: "#FFFFFF",

                maxWidth: "715px",

              }}

            >

              Become a volunteer at WINGS

            </motion.h1>



            {/* Description — DM Sans 400 20px line-height 100% center */}

            <motion.p

              initial={{ opacity: 0, y: 30 }}

              animate={{ opacity: 1, y: 0 }}

              transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}

              style={{

                fontFamily: "'DM Sans', sans-serif",

                fontWeight: 400,

                fontSize: "clamp(14px, 1.4vw, 20px)",

                lineHeight: "160%",

                textAlign: "center",

                color: "#FFFFFF",

                maxWidth: "951px",

                marginTop: "24px",

              }}

            >

              At WINGS Counselling Centre, volunteers play an important role in

              supporting our mission of emotional well-being and community care.

              Whether through assisting events, supporting outreach activities,

              or helping us create a safe and welcoming environment, every

              contribution matters.

            </motion.p>



            {/* Button — Plus Jakarta Sans 500 18px color #F5F9FF bg #1B4585 radius 9999 padding 16/32 gap 10 */}

            <motion.button
               onClick={() => navigate("/volunteerform")}
              initial={{ opacity: 0, y: 20 }}

              animate={{ opacity: 1, y: 0 }}

              transition={{ duration: 0.7, delay: 0.4 }}

              whileHover={{ scale: 1.05 }}

              whileTap={{ scale: 0.95 }}

              style={{

                fontFamily: "'Plus Jakarta Sans', sans-serif",

                fontWeight: 500,

                fontSize: "18px",

                lineHeight: "28px",

                color: "#F5F9FF",

                backgroundColor: "#1B4585",

                borderRadius: "9999px",

                padding: "16px 32px",

                border: "none",

                cursor: "pointer",

                display: "inline-flex",

                alignItems: "center",

                gap: "10px",

                marginTop: "32px",

              }}

            >

              Become a volunteer

              <svg

                xmlns="http://www.w3.org/2000/svg"

                width="20"

                height="20"

                viewBox="0 0 24 24"

                fill="none"

              >

                <path

                  d="M9 18L15 12L9 6"

                  stroke="white"

                  strokeWidth="2.4"

                  strokeLinecap="round"

                  strokeLinejoin="round"

                />

              </svg>

            </motion.button>

          </div>

        </section>



        {/* ════════════════════  WHY VOLUNTEER  ════════════════════ */}

        <section style={{ paddingTop: "clamp(60px, 8vw, 100px)", paddingBottom: "clamp(60px, 8vw, 100px)" }}>

          <div className="container-main">



            <motion.div

              initial="hidden"

              whileInView="visible"

              viewport={{ once: true, amount: 0.3 }}

              variants={staggerContainer}

              className="flex flex-col items-center text-center"

            >

              {/* Pill badge */}

              <motion.span

                variants={fadeUp}

                style={{

                  display: "inline-flex",

                  alignItems: "center",

                  justifyContent: "center",

                  padding: "8px 20px",

                  borderRadius: "9999px",

                  background: "linear-gradient(90deg, #0D4A7A 0%, #1888E0 100%)",

                  fontFamily: "'Plus Jakarta Sans', sans-serif",

                  fontWeight: 500,

                  fontSize: "18px",

                  letterSpacing: "1px",

                  color: "#FFFFFF",

                }}

              >

                Why volunteer with WINGS?

              </motion.span>



              {/* Heading — Outfit 500 */}

              <motion.h2

                variants={fadeUp}

                style={{

                  fontFamily: "'Outfit', sans-serif",

                  fontWeight: 500,

                  fontSize: "clamp(28px, 4vw, 48px)",

                  lineHeight: "120%",

                  color: "#0D4A7A",

                  marginTop: "24px",

                }}

              >

                Giving your time, getting more back.

              </motion.h2>



              {/* Description — DM Sans 400 */}

              <motion.p

                variants={fadeUp}

                style={{

                  fontFamily: "'DM Sans', sans-serif",

                  fontWeight: 400,

                  fontSize: "clamp(14px, 1.15vw, 17px)",

                  lineHeight: "170%",

                  color: "#000000",

                  maxWidth: "900px",

                  marginTop: "20px",

                }}

              >

                At WINGS Counselling Centre, volunteers play an important role

                in supporting our mission of emotional well-being and community

                care. Whether through assisting events, supporting outreach

                activities, or helping us create a safe and welcoming

                environment, every contribution matters.

              </motion.p>

            </motion.div>



            {/* ── Volunteer Image Cards with HeartHandshake icon 24×24 ── */}

            <motion.div

              initial="hidden"

              whileInView="visible"

              viewport={{ once: true, amount: 0.1 }}

              variants={staggerContainer}

              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"

              style={{ marginTop: "50px" }}

            >

              {volunteerCards.map((card, index) => (

                <motion.div

                  key={index}

                  variants={fadeUp}

                  custom={index}

                  whileHover={{ y: -6, transition: { duration: 0.3 } }}

                  className="flex flex-col overflow-hidden"

                  style={{

                    borderRadius: "16px",

                    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",

                  }}

                >

                  {/* Image */}

                  <img

                    src={card.image}

                    alt={card.title}

                    style={{

                      width: "100%",

                      height: "260px",

                      objectFit: "cover",

                      display: "block",

                    }}

                  />



                  {/* Blue info section */}

                  <div

                    className="flex flex-col flex-1"

                    style={{

                      backgroundColor: "#0D4A7A",

                      padding: "23px 20px 20px 20px",

                      minHeight: "170px",

                    }}

                  >

                    {/* Icon + Title row — HeartHandshake 24×24 */}

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>

                      <HeartHandshake

                        size={24}

                        strokeWidth={2}

                        color="#FFFFFF"

                        style={{ flexShrink: 0 }}

                      />

                      <h3

                        style={{

                          fontFamily: "'Outfit', sans-serif",

                          fontWeight: 500,

                          fontSize: "18px",

                          lineHeight: "130%",

                          color: "#FFFFFF",

                          margin: 0,

                        }}

                      >

                        {card.title}

                      </h3>

                    </div>



                    {/* Description */}

                    <p

                      style={{

                        fontFamily: "'DM Sans', sans-serif",

                        fontWeight: 400,

                        fontSize: "16px",

                        lineHeight: "170%",

                        color: "rgba(255,255,255,0.85)",

                        marginTop: "12px",

                      }}

                    >

                      {card.text}

                    </p>

                  </div>

                </motion.div>

              ))}

            </motion.div>



          </div>

        </section>



        {/* ════════════════════  FOUR WAYS TO SHOW UP  ════════════════════ */}

        {/* Title: Outfit 500 40px line-height 100% color #0D4A7A */}

        <section style={{ backgroundColor: "#D9E1E8", paddingTop: "clamp(60px, 8vw, 100px)", paddingBottom: "clamp(60px, 8vw, 100px)" }}>

          <div className="container-main">



            <motion.div

              initial="hidden"

              whileInView="visible"

              viewport={{ once: true, amount: 0.3 }}

              variants={staggerContainer}

            >

              <motion.h2

                variants={fadeUp}

                style={{

                  fontFamily: "'Outfit', sans-serif",

                  fontWeight: 500,

                  fontSize: "clamp(28px, 3.2vw, 40px)",

                  lineHeight: "100%",

                  color: "#0D4A7A",

                }}

              >

                Four ways to show up.

              </motion.h2>



              <motion.p

                variants={fadeUp}

                style={{

                  fontFamily: "'DM Sans', sans-serif",

                  fontWeight: 400,

                  fontSize: "clamp(14px, 1.15vw, 17px)",

                  lineHeight: "160%",

                  color: "#000000",

                  marginTop: "12px",

                  maxWidth: "600px",

                }}

              >

                Pick what fits your skills, schedule, and the kind of contribution

                that feels meaningful to you.

              </motion.p>

            </motion.div>



            {/* Opportunity Cards 2×2 — icon box 60×60 radius 10 bg #DE5753 30% */}

            <motion.div

              initial="hidden"

              whileInView="visible"

              viewport={{ once: true, amount: 0.08 }}

              variants={staggerContainer}

              className="grid gap-6 md:grid-cols-2"

              style={{ marginTop: "40px" }}

            >

              {opportunities.map((item, index) => (

                <motion.div

                  key={index}

                  variants={fadeUp}

                  custom={index}

                  whileHover={{ y: -4, transition: { duration: 0.3 } }}

                  style={{

                    backgroundColor: "#F7F6F3",

                    borderRadius: "20px",

                    padding: "28px",

                  }}

                >

                  {/* Icon + Title + Subtitle ROW */}

                  <div

                    style={{

                      display: "flex",

                      alignItems: "flex-start",

                      gap: "16px",

                    }}

                  >

                    {/* Icon box — 60×60 radius 10 bg #DE5753 30% */}

                    <div

                      style={{

                        width: "60px",

                        height: "60px",

                        minWidth: "60px",

                        borderRadius: "10px",

                        backgroundColor: "rgba(222, 87, 83, 0.30)",

                        display: "flex",

                        alignItems: "center",

                        justifyContent: "center",

                        color: "#DE5753",

                      }}

                    >

                      {item.icon}

                    </div>



                    {/* Title + Subtitle stacked */}

                    <div>

                      <h3

                        style={{

                          fontFamily: "'Outfit', sans-serif",

                          fontWeight: 500,

                          fontSize: "clamp(20px, 1.8vw, 24px)",

                          lineHeight: "130%",

                          color: "#000204",

                          margin: 0,

                        }}

                      >

                        {item.title}

                      </h3>



                      <p

                        style={{

                          fontFamily: "'DM Sans', sans-serif",

                          fontWeight: 500,

                          fontSize: "14px",

                          lineHeight: "150%",

                          color: "#0D4A7A",

                          marginTop: "4px",

                        }}

                      >

                        {item.subtitle}

                      </p>

                    </div>

                  </div>



                  {/* Description */}

                  <p

                    style={{

                      fontFamily: "'DM Sans', sans-serif",

                      fontWeight: 400,

                      fontSize: "clamp(14px, 1.1vw, 16px)",

                      lineHeight: "170%",

                      color: "#000000",

                      marginTop: "16px",

                    }}

                  >

                    {item.description}

                  </p>



                  {/* Tags */}

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "18px" }}>

                    {item.tags.map((tag, i) => (

                      <span

                        key={i}

                        style={{

                          fontFamily: "'Plus Jakarta Sans', sans-serif",

                          fontWeight: 500,

                          fontSize: "12px",

                          lineHeight: "150%",

                          color: "#0D4A7A",

                          backgroundColor: "#D9E1E8",

                          borderRadius: "9999px",

                          padding: "5px 14px",

                        }}

                      >

                        {tag}

                      </span>

                    ))}

                  </div>

                </motion.div>

              ))}

            </motion.div>



          </div>

        </section>



        {/* ════════════════════  YOUR PATH TO IMPACT  ════════════════════ */}

        <section style={{ paddingTop: "clamp(60px, 8vw, 100px)", paddingBottom: "clamp(60px, 8vw, 100px)" }}>

          <div className="container-main" style={{ textAlign: "center" }}>



            <motion.h2

              initial={{ opacity: 0, y: 30 }}

              whileInView={{ opacity: 1, y: 0 }}

              viewport={{ once: true }}

              transition={{ duration: 0.7 }}

              style={{

                fontFamily: "'Outfit', sans-serif",

                fontWeight: 500,

                fontSize: "clamp(28px, 3.2vw, 40px)",

                lineHeight: "100%",

                color: "#0D4A7A",

              }}

            >

              Your path to impact

            </motion.h2>



            <motion.p

              initial={{ opacity: 0, y: 20 }}

              whileInView={{ opacity: 1, y: 0 }}

              viewport={{ once: true }}

              transition={{ duration: 0.7, delay: 0.15 }}

              style={{

                fontFamily: "'DM Sans', sans-serif",

                fontWeight: 400,

                fontSize: "clamp(14px, 1.15vw, 17px)",

                lineHeight: "160%",

                color: "#000000",

                marginTop: "12px",

              }}

            >

              A simple journey toward making a difference.

            </motion.p>



            {/* Steps with #DE5753 connector bars — 180×5 radius 10 */}

            <motion.div

              initial="hidden"

              whileInView="visible"

              viewport={{ once: true, amount: 0.2 }}

              variants={staggerContainer}

              style={{ marginTop: "60px" }}

            >

              {/* Desktop: Circles + Bars inline flex row */}

              <div

                className="hidden md:flex"

                style={{

                  alignItems: "center",

                  paddingLeft: "calc(12.5% - 30px)",

                  paddingRight: "calc(12.5% - 30px)",

                  marginBottom: "28px",

                }}

              >

                {processSteps.map((item, index) => (

                  <React.Fragment key={index}>

                    {/* Number circle */}

                    <motion.div

                      variants={fadeUp}

                      custom={index}

                      whileHover={{ scale: 1.1, transition: { duration: 0.3 } }}

                      style={{

                        width: "80px",

                        height: "80px",

                        minWidth: "80px",

                        borderRadius: "50%",

                        backgroundColor: "#1B4585",

                        display: "flex",

                        alignItems: "center",

                        justifyContent: "center",

                        fontFamily: "'Outfit', sans-serif",

                        fontWeight: 700,

                        fontSize: "24px",

                        color: "#FFFFFF",

                        position: "relative",

                        zIndex: 2,

                      }}

                    >

                      {item.step}

                    </motion.div>



                    {/* Connector bar between circles — rounded ends */}

                    {index < processSteps.length - 1 && (

                      <div

                        style={{

                          flex: 1,

                          marginLeft: "20px",

                          marginRight: "20px",                     

                          height: "5px",

                          borderRadius: "10px",

                          backgroundColor: "#DE5753",

                        }}

                      />

                    )}

                  </React.Fragment>

                ))}

              </div>



              {/* Mobile: circles stacked 2×2 without line */}

              <div

                className="grid grid-cols-2 gap-6 md:hidden"

                style={{ marginBottom: "24px" }}

              >

                {processSteps.map((item, index) => (

                  <div key={index} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>

                    <motion.div

                      variants={fadeUp}

                      custom={index}

                      style={{

                        width: "80px",

                        height: "80px",

                        borderRadius: "50%",

                        backgroundColor: "#1B4585",

                        display: "flex",

                        alignItems: "center",

                        justifyContent: "center",

                        fontFamily: "'Outfit', sans-serif",

                        fontWeight: 700,

                        fontSize: "24px",

                        color: "#FFFFFF",

                      }}

                    >

                      {item.step}

                    </motion.div>

                    <h3

                      style={{

                        fontFamily: "'Outfit', sans-serif",

                        fontWeight: 500,

                        fontSize: "18px",

                        lineHeight: "130%",

                        color: "#1B4585",

                        margin: 0,

                        marginTop: "16px",

                        textAlign: "center",

                      }}

                    >

                      {item.title}

                    </h3>

                    <p

                      style={{

                        fontFamily: "'DM Sans', sans-serif",

                        fontWeight: 400,

                        fontSize: "16px",

                        lineHeight: "160%",

                        color: "#000000",

                        marginTop: "8px",

                        textAlign: "center",

                      }}

                    >

                      {item.desc}

                    </p>

                  </div>

                ))}

              </div>



              {/* Desktop: Titles + Descriptions grid below circles */}

              <div

                className="hidden md:grid md:grid-cols-4"

                style={{ gap: "0px" }}

              >

                {processSteps.map((item, index) => (

                  <motion.div

                    key={index}

                    variants={fadeUp}

                    custom={index}

                    style={{

                      display: "flex",

                      flexDirection: "column",

                      alignItems: "center",

                      textAlign: "center",

                    }}

                  >

                    <h3

                      style={{

                        fontFamily: "'Outfit', sans-serif",

                        fontWeight: 500,

                        fontSize: "18px",

                        lineHeight: "130%",

                        color: "#1B4585",

                        margin: 0,

                      }}

                    >

                      {item.title}

                    </h3>



                    <p

                      style={{

                        fontFamily: "'DM Sans', sans-serif",

                        fontWeight: 400,

                        fontSize: "16px",

                        lineHeight: "160%",

                        color: "#000000",

                        marginTop: "8px",

                        maxWidth: "200px",

                      }}

                    >

                      {item.desc}

                    </p>

                  </motion.div>

                ))}

              </div>

            </motion.div>



          </div>

        </section>



        {/* ════════════════════  WHO VOLUNTEERS WITH US  ════════════════════ */}

        <section style={{ backgroundColor: "#D9E1E8", paddingTop: "clamp(60px, 8vw, 100px)", paddingBottom: "clamp(60px, 8vw, 100px)" }}>

          <div className="container-main">



            <motion.div

              initial="hidden"

              whileInView="visible"

              viewport={{ once: true, amount: 0.3 }}

              variants={staggerContainer}

              style={{ textAlign: "center" }}

            >

              <motion.h2

                variants={fadeUp}

                style={{

                  fontFamily: "'Outfit', sans-serif",

                  fontWeight: 500,

                  fontSize: "clamp(28px, 3.2vw, 40px)",

                  lineHeight: "100%",

                  color: "#0D4A7A",

                }}

              >

                Who volunteers with us?

              </motion.h2>



              <motion.p

                variants={fadeUp}

                style={{

                  fontFamily: "'DM Sans', sans-serif",

                  fontWeight: 400,

                  fontSize: "clamp(14px, 1.15vw, 17px)",

                  lineHeight: "160%",

                  color: "#000000",

                  marginTop: "12px",

                  maxWidth: "700px",

                  marginLeft: "auto",

                  marginRight: "auto",

                }}

              >

                Retirees, students, working professionals, parents — anyone with

                a few hours to give and a quiet kind of care to bring.

              </motion.p>

            </motion.div>



            {/* Who volunteers cards — icon box 60×60 radius 10 bg #DE5753 30% */}

            <motion.div

              initial="hidden"

              whileInView="visible"

              viewport={{ once: true, amount: 0.1 }}

              variants={staggerContainer}

              className="grid gap-6 md:grid-cols-3"

              style={{ marginTop: "50px" }}

            >

              {whoVolunteers.map((item, index) => (

                <motion.div

                  key={index}

                  variants={fadeUp}

                  custom={index}

                  whileHover={{ y: -5, transition: { duration: 0.3 } }}

                  style={{

                    backgroundColor: "#F7F6F3",

                    borderRadius: "20px",

                    padding: "32px",

                  }}

                >

                  {/* Icon box — 60×60 radius 10 bg #DE5753 30% */}

                  <div

                    style={{

                      width: "60px",

                      height: "60px",

                      borderRadius: "10px",

                      backgroundColor: "rgba(222, 87, 83, 0.30)",

                      display: "flex",

                      alignItems: "center",

                      justifyContent: "center",

                      color: "#DE5753",

                      marginBottom: "20px",

                    }}

                  >

                    {item.icon}

                  </div>



                  {/* Title */}

                  <h3

                    style={{

                      fontFamily: "'Outfit', sans-serif",

                      fontWeight: 500,

                      fontSize: "clamp(20px, 1.8vw, 24px)",

                      lineHeight: "130%",

                      color: "#1B4585",

                      margin: 0,

                    }}

                  >

                    {item.title}

                  </h3>



                  {/* Description */}

                  <p

                    style={{

                      fontFamily: "'DM Sans', sans-serif",

                      fontWeight: 400,

                      fontSize: "clamp(14px, 1.1vw, 16px)",

                      lineHeight: "170%",

                      color: "#000000",

                      marginTop: "16px",

                    }}

                  >

                    {item.description}

                  </p>

                </motion.div>

              ))}

            </motion.div>



          </div>

        </section>



        {/* ════════════════════  CTA  ════════════════════ */}

        <section style={{ paddingTop: "clamp(60px, 8vw, 100px)", paddingBottom: "clamp(60px, 8vw, 100px)" }}>

          <div className="container-main">



            <motion.div

              initial={{ opacity: 0, y: 40, scale: 0.97 }}

              whileInView={{ opacity: 1, y: 0, scale: 1 }}

              viewport={{ once: true, amount: 0.3 }}

              transition={{ duration: 0.8, ease: "easeOut" }}

              style={{

                backgroundColor: "#0D4A7A",

                borderRadius: "24px",

                padding: "clamp(48px, 6vw, 80px) clamp(24px, 4vw, 60px)",

                textAlign: "center",

                position: "relative",

                overflow: "hidden",

              }}

            >

              {/* Subtle decorative gradient circles */}

              <div

                style={{

                  position: "absolute",

                  top: "-80px",

                  left: "-80px",

                  width: "240px",

                  height: "240px",

                  borderRadius: "50%",

                  background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)",

                  pointerEvents: "none",

                }}

              />

              <div

                style={{

                  position: "absolute",

                  bottom: "-60px",

                  right: "-60px",

                  width: "200px",

                  height: "200px",

                  borderRadius: "50%",

                  background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)",

                  pointerEvents: "none",

                }}

              />



              {/* Title */}

              <h2

                style={{

                  fontFamily: "'Outfit', sans-serif",

                  fontWeight: 500,

                  fontSize: "clamp(28px, 3.5vw, 44px)",

                  lineHeight: "120%",

                  color: "#FFFFFF",

                  position: "relative",

                  zIndex: 1,

                }}

              >

                Ready to make a real difference?

              </h2>



              {/* Description */}

              <p

                style={{

                  fontFamily: "'DM Sans', sans-serif",

                  fontWeight: 400,

                  fontSize: "clamp(14px, 1.15vw, 17px)",

                  lineHeight: "170%",

                  color: "rgba(255,255,255,0.9)",

                  maxWidth: "700px",

                  marginTop: "20px",

                  marginLeft: "auto",

                  marginRight: "auto",

                  position: "relative",

                  zIndex: 1,

                }}

              >

                Take the first step toward becoming a pillar of support for your

                community. Our application process is warm, welcoming, and open

                to everyone.

              </p>



              {/* Button */}

              <motion.button
                onClick={() => navigate("/volunteerform")}
                whileHover={{ scale: 1.05 }}

                whileTap={{ scale: 0.95 }}

                style={{

                  fontFamily: "'Plus Jakarta Sans', sans-serif",

                  fontWeight: 600,

                  fontSize: "18px",

                  lineHeight: "28px",

                  color: "#1B4585",

                  backgroundColor: "#FFFFFF",

                  borderRadius: "9999px",

                  padding: "16px 32px",

                  border: "none",

                  cursor: "pointer",

                  display: "inline-flex",

                  alignItems: "center",

                  gap: "10px",

                  marginTop: "36px",

                  position: "relative",

                  zIndex: 1,

                }}

              >

                Apply as a volunteer

                <svg

                xmlns="http://www.w3.org/2000/svg"

                width="20"

                height="20"

                viewBox="0 0 24 24"

                fill="none"

              >

                <path

                  d="M9 18L15 12L9 6"

                  stroke="currentColor"

                  strokeWidth="2.4"

                  strokeLinecap="round"

                  strokeLinejoin="round"

                />

              </svg>

              </motion.button>

            </motion.div>



          </div>

        </section>



      </main>



      <Footer />

    </>

  );

};



export default Volunteer;
