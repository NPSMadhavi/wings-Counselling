import React from "react";
import {
  ChevronDown,
  ArrowRight,
  Check,
} from "lucide-react";

import { Footer } from "@/components/layout/Footer";

const heroImg = "/assets/card1.jpg.jpeg";
const therapyImg = "/assets/card2.jpg.jpeg";
const c1 = "/assets/Mala1.jpg";
const c2 = "/assets/Madhura1.jpg";
const c3 = "/assets/Shalini1.jpg";
import { useLocation } from "wouter";
import { useAppointment } from "@/context/AppointmentContext";
import { motion } from "framer-motion";
const counsellors = [
  {
    name: "Dr. Michael Chen",
    role: "Counsellor · MAP (Counselling psychology)",
    exp: "5+ Years experience",
    desc: "Michael holds a Masters in applied psychology (Counselling Psychology) and has been practising for more than 5 years. He is fluent in English and Malay, and brings a deeply client-centred approach to every session.",
    tags: ["CBT", "Motion-Focused therapy", "Youth"],
    img: c1,
  },
  {
    name: "Dr. Sunita Nair",
    role: "Counsellor · Masters in counselling",
    exp: "7+ Years experience",
    desc: "Sunita holds a Bachelor of Science in Psychology and a Master's degree in Counselling. Her passion for supporting youth is evident across all her work — both professional and voluntary.",
    tags: ["Clinical supervision", "Couples"],
    img: c2,
  },
  {
    name: "Sin Teck",
    role: "Registered counsellor & Registered social worker",
    exp: "12+ Years experience",
    desc: "Sin Teck is a Registered Counsellor with the Singapore Association of Counselling (SAC) and a Registered Social Worker with the Singapore Association of Social Work (SASW).",
    tags: ["Family therapy", "Social work", "Divorce support"],
    img: c3,
  },
];

export default function Servicecards() {
  const { openModal } = useAppointment();
    const [_, navigate] = useLocation();
  return (
    <div className="w-full flex flex-col min-h-screen items-center bg-[#FAFAF5] overflow-x-hidden">

      {/* HERO SECTION */}
      <section
        className="relative w-full min-h-screen bg-cover bg-center bg-no-repeat overflow-hidden"
        style={{
          backgroundImage: `url(${heroImg})`,
        }}
      >
        {/* DARK OVERLAY */}
        <div className="absolute inset-0 bg-black/45 z-0" />

        {/* CONTENT */}
        <div className="relative z-10 navbar-align-outer min-h-screen flex items-center justify-center">
        <div className="navbar-align-inner flex flex-col items-center justify-center text-center w-full min-h-screen">

          {/* Badge */}
          <span
            className="inline-flex items-center justify-center mb-6 sm:mb-8"
            style={{
              padding: "6px 16px",
              borderRadius: "9999px",
              border: "1px solid rgba(255,255,255,0.4)",
              backgroundColor: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(4px)",
              color: "#FFFFFF",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 600,
              fontSize: "20px",
              letterSpacing: "1.2px",
            }}
          >
            Our services
          </span>

          {/* Heading */}
          <h1
            className="text-[36px] sm:text-[46px] md:text-[56px] lg:text-[60px] font-semibold leading-tight mb-4 sm:mb-6"
            style={{
              fontFamily: "'Outfit', sans-serif",
              color: "#FFFFFF",
            }}
          >
            Professional care, tailored to you
          </h1>

          {/* Description */}
          <p
            className="text-[16px] sm:text-[18px] md:text-[20px] leading-relaxed mb-6 sm:mb-8 max-w-[850px]"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 400,
              color: "#FFFFFF",
            }}
          >
            We customise every counselling and therapy service to suit each client's unique needs —
            based on the challenges they face, their developmental stage, and their age.
            Available to Singapore Citizens and Permanent Residents.
          </p>

          {/* Button */}
          <button 
            onClick={() => {
              document.getElementById("counselling-therapy")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="mt-6 h-[60px] px-8 rounded-full bg-[#1B4585]
           text-white font-['Plus_Jakarta_Sans',sans-serif] text-[16px] md:text-[18px] font-semibold flex items-center gap-3 hover:scale-105 transition-all duration-300">
           <span>Explore our services</span>
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
            
          </button>
        </div>
        </div>
      </section>

      {/* SERVICE DETAILS */}
      <section className="w-full bg-[#F5F4F1] py-16">
        <div className="navbar-align-outer">
        <div className="navbar-align-inner">

          <p className="font-['DM_Sans'] text-[18px] font-medium mb-12">
            <span
              onClick={() => navigate("/services#counselling-therapy")}
              className="underline cursor-pointer hover:opacity-70 transition"
            >
              Counselling & therapy service
            </span>{" "}
            
            <div
              id="counselling-therapy"
              className="inline-flex items-center gap-3 font-['DM_Sans'] text-[16px] font-medium"
            >
              / Individual therapy
            </div>
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-[475px_1fr] gap-0 rounded-[10px] overflow-hidden lg:min-h-[556px]">

            {/* Left Image */}
            <img
              src={therapyImg}
              alt="Individual therapy"
              className="w-full h-[560px] min-h-[360px] sm:min-h-[480px] lg:min-h-[450px] object-cover"
            />

            {/* Right Content */}
            <div
              className="bg-white p-6 sm:p-10 lg:px-[40px] lg:py-[25px] flex flex-col justify-start h-full"
            >
              <span
                className="w-fit inline-flex 
                px-5 py-1.5 rounded-full 
                bg-gradient-to-r from-[#0D4A7A] to-[#42A0BD] 
                text-white font-['Plus_Jakarta_Sans',sans-serif] 
                text-[20px] font-semibold"
              >
                About the service
              </span>

              <h2 className="mt-6 font-['Outfit'] text-[26px] md:text-[30px] font-medium leading-[100%] text-black">
                How individual therapy helps
              </h2>

              <p className="mt-6 max-w-[854px] font-['DM_Sans'] text-[16px] md:text-[18px] leading-[30px] text-black">
                Individual therapy provides a safe space to openly explore your
                thoughts, emotions, and personal experiences without judgment. At
                WINGS Counselling Centre, our counsellors work collaboratively with
                individuals to better understand emotional challenges, identify healthy
                coping strategies, and build meaningful personal growth.
              </p>

              <div className="mt-7 space-y-5">
                {[
                  "Therapeutic dialogue",
                  "Cognitive behavioural therapy (CBT)",
                  "Experiential therapy",
                  "Relationship-focused support",
                  "Systemic communication approaches",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-5 font-['DM_Sans'] text-[16px] md:text-[18px] font-medium text-black"
                  >
                    <span className="w-6 h-6 rounded-full bg-[#0F4F7C] text-white flex items-center justify-center shrink-0">
                      <Check size={15} />
                    </span>

                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* COUNSELLORS */}
      <section className="w-full bg-[#F5F4F1] py-12 md:py-20 text-center">
        <div className="navbar-align-outer">
        <div className="navbar-align-inner">

          {/* Badge */}
          <span
            className="inline-block 
            rounded-full
            bg-gradient-to-r from-[#0D4A7A] to-[#42A0BD] 
            text-white font-['Plus_Jakarta_Sans',sans-serif] 
            text-[20px] font-semibold px-5 py-1.5"
          >
            Meet the counsellors
          </span>

          {/* Heading */}
          <h2 className="mt-6 text-[#0D4A7A] font-['Outfit'] text-[35px] sm:text-[35px] font-medium leading-[100%]">
            The people who'd be in the room with you
          </h2>

          {/* Description */}
          <p className="mt-6 max-w-[994px] mx-auto font-['DM_Sans'] text-[17px] md:text-[20px] font-medium leading-[130%]">
            Each counsellor brings a unique set of skills, languages, and
            therapeutic approaches — so you can find the right fit for your journey.
          </p>

          {/* Cards */}
          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {counsellors.map((person) => (
              <div
                key={person.name}
                className="bg-white rounded-[10px] overflow-hidden shadow-md text-left hover:-translate-y-2 transition-all duration-300"
              >

                {/* Image */}
                <div className="relative h-[274px]">

                  <img
                    src={person.img}
                    alt={person.name}
                    className="w-full h-full object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

                  <div className="absolute bottom-5 left-5 right-5 text-white">

                    <h3 className="font-['DM_Sans'] text-[20px] font-small">
                      {person.name}
                    </h3>

                    <p className="mt-2 font-['DM_Sans'] text-[15px]">
                      {person.role}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 min-h-[280px] flex flex-col">

                  <p className="font-['DM_Sans'] text-[15px] text-[#214E9A] font-medium">
                    ● &nbsp; {person.exp}
                  </p>

                  <p className="mt-5 font-['DM_Sans']  text-[15px] leading-[24px] text-[#222]">
                    {person.desc}
                  </p>

                  {/* Tags */}
                  <div className="mt-auto pt-6 flex flex-wrap gap-3 items-center">

                    {person.tags.map((tag) => (
                      <span
                        key={tag}
                        className="
                          bg-[#DCE8F1]
                          text-[#0F4F7C]
                          rounded-[8px]
                          px-3
                          py-2
                          font-['DM_Sans']
                          text-[12px]
                          font-medium
                          whitespace-nowrap
                          inline-flex
                          items-center
                          justify-center
                          h-[32px]
                        "
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Appointment Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openModal}
            className="
              mt-12
              h-[60px]
              px-8
              rounded-full
              bg-[#1B4585]
              text-white
              font-['Plus_Jakarta_Sans',sans-serif]
              text-[17px]
              font-semibold
              inline-flex
              items-center
              gap-4
              hover:scale-105
              transition-all
              duration-300
            "
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
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}