import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { Footer } from "@/components/Layout/Footer";
import { motion } from "framer-motion";

const FALLBACK_PARTNERS = [
  {
    id: 1,
    name: "Holy Tree Sri Balasubramaniar Temple",
    logo: "/assets/holy-tree-logo.png",
    description:
      "Role of the Temple is to provide for the spiritual needs of our devotees, a significant priority is also to reach out and serve the needs of all who live in the vicinity.",
    websiteLink: "https://www.htsbt.org.sg/",
  },
  {
    id: 2,
    name: "Iyad Perdaus",
    logo: "/assets/iyad-perdaus-logo.png",
    description:
      "Long-standing collaboration providing community-based support and early childhood development resources.",
    websiteLink: "https://www.iyadperdaus.sg/",
  },
];

const PartnerPage = () => {
  const [partners, setPartners] = useState(FALLBACK_PARTNERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadPartners = async () => {
      try {
        const response = await fetch("/api/partners");
        if (!response.ok) throw new Error("Failed to fetch partners");

        const data = await response.json();
        if (!cancelled && Array.isArray(data) && data.length) {
          setPartners(data);
        }
      } catch (error) {
        console.error("Error fetching partners:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPartners();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="w-full bg-[#F5F9FF]">
      {/* Hero Section */}
      <section
        className="relative w-full min-h-[520px] md:min-h-[650px] lg:min-h-[790px] flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: `url('/assets/partners-hero.jpg')` }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(58, 58, 58, 0.7) 0%, rgba(0, 0, 0, 0.7) 75.96%)' }}></div>

        <div className="relative z-10 w-full navbar-align-outer">
          <div className="navbar-align-inner">
            <div className="max-w-full mx-auto px-4 text-center mt-20 md:mt-24">
              <h1 className="text-white text-[32px] sm:text-[44px] md:text-[45px] lg:text-[60px] font-semibold font-['Outfit'] mb-6 leading-tight">
                Our trusted partners
              </h1>
              <p className="text-white text-[clamp(15px,2.5vw,20px)] font-normal font-['DM_Sans'] max-w-3xl mx-auto mb-10 leading-relaxed">
                We collaborate with community organizations, health experts, and local leaders to build a holistic support system for mental wellness in Singapore.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  document
                    .getElementById("partners-section")
                    ?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                }}
                className="bg-[#0D4A7A] transition-colors text-white rounded-full px-8 py-4 inline-flex items-center gap-3"
              >
                <span className="font-['Plus_Jakarta_Sans'] font-semibold text-[18px]">
                  Explore our partners
                </span>

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
        </div>
      </section>

      {/* Partners Section */}
      <section id="partners-section" className=" py-20 md:py-24 bg-[#F7F6F3]">
        <div className="w-full navbar-align-outer ">
          <div className="navbar-align-inner">
            <h2 className="text-[#0D4A7A] text-3xl md:text-[40px] font-medium font-['Outfit'] mb-12">
              Our partners
            </h2>

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 rounded-full border-2 border-[#0D4A7A] border-t-transparent animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
                {partners.map((partner) => (
                  <div
                    key={partner.id}
                    className="bg-white rounded-[20px] p-8 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="h-[140px] flex items-center justify-center mb-6">
                      <img
                        src={partner.logo || "/assets/partnerlogo1.png"}
                        alt={partner.name || "Partner"}
                        className="max-h-[140px] object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                    {partner.name && (
                      <h3 className="text-[#0D4A7A] text-[20px] font-semibold font-['Outfit'] mt-3 mb-4">
                        {partner.name}
                      </h3>
                    )}
                    {partner.description && (
                      <p className="text-[#4B5563] text-[18px] font-normal font-['DM_Sans'] leading-[150%] mb-7 flex-grow">
                        {partner.description}
                      </p>
                    )}
                    {partner.websiteLink && (
                      <a
                        href={partner.websiteLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[#0D4A7A] text-[15px] font-semibold font-['DM_Sans'] group mt-auto w-max"
                      >
                        Visit Website
                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* The Strength of Partnership */}
      <section className="bg-[#D9E1E8] py-20 md:py-24">
        <div className="w-full navbar-align-outer">
          <div className="navbar-align-inner">
            <div className="text-center mb-16 max-w-4xl mx-auto">
              <h2 className="text-[#0D4A7A] text-3xl md:text-[35px] font-medium font-['Outfit'] mb-6">
                The strength of partnership
              </h2>
              <p className="text-black text-lg md:text-[18px] font-normal font-['DM_Sans'] leading-[30px]">
                No one can heal in isolation. Our partnerships allow us to provide a level of care that goes beyond the counseling room.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="bg-white rounded-[20px] p-8 shadow-sm">
                <div className="w-[60px] h-[60px] rounded-[16px] bg-[#E8F4FD] flex items-center justify-center mb-6 text-[#0D4A7A]">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <path d="M9 12l2 2 4-4"/>
                  </svg>
                </div>
                <h3 className="text-black text-[25px] font-medium font-['DM_Sans'] mb-4">
                  Holistic network
                </h3>
                <p className="text-black/80 text-[18px] font-normal font-['DM_Sans'] leading-[25px]">
                  By connecting with medical and social services, we ensure our clients receive complete care for every aspect of their life.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white rounded-[20px] p-8 shadow-sm">
                <div className="w-[60px] h-[60px] rounded-[16px] bg-[#E8F4FD] flex items-center justify-center mb-6 text-[#0D4A7A]">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <h3 className="text-black text-[25px] font-medium font-['DM_Sans'] mb-4">
                  Community reach
                </h3>
                <p className="text-black/80 text-[18px] font-normal font-['DM_Sans'] leading-[25px]">
                  Partnerships help us bring mental health awareness into the heartlands, reaching those who might not otherwise seek help.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white rounded-[20px] p-8 shadow-sm">
                <div className="w-[60px] h-[60px] rounded-[16px] bg-[#E8F4FD] flex items-center justify-center mb-6 text-[#0D4A7A]">
                  <svg
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M3 21v-5h5" />
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                  </svg>
                </div>
                <h3 className="text-black text-[25px] font-medium font-['DM_Sans'] mb-4">
                  Seamless referrals
                </h3>
                <p className="text-black/80 text-[18px] font-normal font-['DM_Sans'] leading-[25px]">
                  Our established pathways ensure that if you need specialized medical care, the transition is fast, safe and supported.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 md:py-24 bg-[#F7F6F3]">
        <div className="w-full navbar-align-outer">
          <div className="navbar-align-inner">
            <div className="bg-[#0D4A7A] rounded-[20px] p-10 md:p-16 flex flex-col items-center text-center w-full mx-auto">
              <h2 className="text-white text-3xl md:text-[35px] font-medium font-['Outfit'] mb-6">
                Interested in partnering with WINGS?
              </h2>
              <p className="text-white text-lg md:text-[20px] font-normal font-['DM_Sans'] max-w-4xl mb-12">
                Whether you're a local community organization, a healthcare provider or a corporate entity looking to support mental wellness, we'd love to explore how we can work together.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white hover:bg-gray-50 transition-colors text-[#0D4A7A] rounded-full px-8 py-4 inline-flex items-center gap-3 group"
              >
                <span className="font-['DM_Sans'] font-medium text-[16px]">
                  Inquire about partnership
                </span>

                <ChevronRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </motion.button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PartnerPage;
