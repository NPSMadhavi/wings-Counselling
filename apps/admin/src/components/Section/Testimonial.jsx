import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";

const FALLBACK_TESTIMONIALS = [
  {
    title: "Anxiety",
    text: "I was struggling with anxiety and didn't know where to turn. My counsellor helped me understand my emotions and develop practical coping strategies. I feel more confident and hopeful today.",
    name: "Anonymous Client",
    role: "Client of company"
  },
  {
    title: "Relationship",
    text: "The counselling sessions gave us the tools to rebuild trust and strengthen our relationship. We are grateful for the guidance and support.",
    name: "Anonymous Client",
    role: "Client of company"
  },
  {
    title: "Family",
    text: "Our family communication has improved tremendously. We learned how to listen, understand each other better and work through conflicts together.",
    name: "Anonymous Client",
    role: "Client of company"
  }
];

export const Testimonial = () => {
  const { t, i18n } = useTranslation();
  const testimonialsRef = useRef(null);
  const [testimonials, setTestimonials] = useState(FALLBACK_TESTIMONIALS);

  useEffect(() => {
    let cancelled = false;
    const lang = (i18n.language || "en").split("-")[0];

    const loadTestimonials = async () => {
      try {
        const response = await fetch(
          `/api/testimonials?lang=${encodeURIComponent(lang)}`
        );
        if (!response.ok) throw new Error("Failed to fetch testimonials");

        const data = await response.json();
        if (!cancelled && Array.isArray(data) && data.length) {
          setTestimonials(
            data.map((item) => ({
              id: item.id,
              title: item.serviceName,
              text: item.description || "",
              name: item.clientName,
              role: item.clientCompanyName || "",
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching testimonials:", error);
      }
    };

    loadTestimonials();

    return () => {
      cancelled = true;
    };
  }, [i18n.language]);

  const handleTestimonialScroll = (direction) => {
    const container = testimonialsRef.current;
    if (!container) return;

    const card = container.querySelector("[data-testimonial-card]");
    if (!card) return;

    const scrollAmount = card.offsetWidth + 24;

    container.scrollBy({
      left: direction === "next" ? scrollAmount : -scrollAmount,
      behavior: "smooth"
    });
  };

  return (
    <section className="w-full bg-[#0D4A7A] pt-[60px] pb-[60px] overflow-hidden">
      <div className="w-full navbar-align-outer">
        <div className="navbar-align-inner flex flex-col items-center">
        
          {/* Header Section */}
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-white text-[clamp(22px,4.8vw,28px)] md:text-[35px] font-medium font-['Outfit'] leading-tight mb-4">
              {t("testimonials.title")}
            </h2>
            <p className="text-white text-[16px] md:text-[18px] lg:text-[20px] font-medium font-['DM_Sans'] max-w-3xl mx-auto leading-relaxed">
              {t("testimonials.description")}
            </p>
          </div>

          {/* Cards Container */}
          <div
            ref={testimonialsRef}
            className="w-full flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory no-scrollbar"
          >
            {testimonials.map((item, index) => (
              <div 
                key={item.id ?? index}
                data-testimonial-card
                className="bg-white rounded-2xl p-8 min-w-full basis-full md:min-w-0 md:basis-[calc((100%_-_24px)/2)] lg:basis-[calc((100%_-_48px)/3)] flex-shrink-0 snap-center flex flex-col min-h-[270px] h-auto md:h-auto overflow-hidden shadow-lg">
                {/* Card Header */}
                <div className="flex items-center gap-4 mb-6">
                  {/* Top Quote Icon*/}
                <div className="flex-shrink-0 flex">
                  {/* First Quote */}
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 12 27"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-8 h-8"
                  >
                    <path
                      d="M4.00004 1.3335C3.2928 1.3335 2.61452 1.61445 2.11442 2.11454C1.61433 2.61464 1.33337 3.29292 1.33337 4.00016V12.0002C1.33337 12.7074 1.61433 13.3857 2.11442 13.8858C2.61452 14.3859 3.2928 14.6668 4.00004 14.6668C4.35366 14.6668 4.6928 14.8073 4.94285 15.0574C5.1929 15.3074 5.33337 15.6465 5.33337 16.0002V17.3335C5.33337 18.0407 5.05242 18.719 4.55233 19.2191C4.05223 19.7192 3.37395 20.0002 2.66671 20.0002C2.31309 20.0002 1.97395 20.1406 1.7239 20.3907C1.47385 20.6407 1.33337 20.9799 1.33337 21.3335V24.0002C1.33337 24.3538 1.47385 24.6929 1.7239 24.943C1.97395 25.193 2.31309 25.3335 2.66671 25.3335C4.78844 25.3335 6.82327 24.4906 8.32356 22.9904C9.82385 21.4901 10.6667 19.4552 10.6667 17.3335V4.00016C10.6667 3.29292 10.3858 2.61464 9.88566 2.11454C9.38556 1.61445 8.70728 1.3335 8.00004 1.3335H4.00004Z"
                      stroke="#0D4A7A"
                      strokeOpacity="1"
                      strokeWidth="2.66667"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                  {/* Second Quote */}
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 12 27"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-8 h-8 -ml-4"
                  >
                    <path
                      d="M4.00004 1.3335C3.2928 1.3335 2.61452 1.61445 2.11442 2.11454C1.61433 2.61464 1.33337 3.29292 1.33337 4.00016V12.0002C1.33337 12.7074 1.61433 13.3857 2.11442 13.8858C2.61452 14.3859 3.2928 14.6668 4.00004 14.6668C4.35366 14.6668 4.6928 14.8073 4.94285 15.0574C5.1929 15.3074 5.33337 15.6465 5.33337 16.0002V17.3335C5.33337 18.0407 5.05242 18.719 4.55233 19.2191C4.05223 19.7192 3.37395 20.0002 2.66671 20.0002C2.31309 20.0002 1.97395 20.1406 1.7239 20.3907C1.47385 20.6407 1.33337 20.9799 1.33337 21.3335V24.0002C1.33337 24.3538 1.47385 24.6929 1.7239 24.943C1.97395 25.193 2.31309 25.3335 2.66671 25.3335C4.78844 25.3335 6.82327 24.4906 8.32356 22.9904C9.82385 21.4901 10.6667 19.4552 10.6667 17.3335V4.00016C10.6667 3.29292 10.3858 2.61464 9.88566 2.11454C9.38556 1.61445 8.70728 1.3335 8.00004 1.3335H4.00004Z"
                      stroke="#0D4A7A"
                      strokeOpacity="1"
                      strokeWidth="2.66667"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                  <h3 className="text-[#3A3A3A] text-[20px] font-medium font-['DM_Sans']">
                    {item.title}
                  </h3>
                </div>
                
                {/* Card Body */}
                <p className="text-[#3A3A3A] text-[15px] font-normal font-['DM_Sans'] leading-[25px] flex-grow mb-8">
                  {item.text}
                </p>
                
                {/* Card Footer */}
                <div className="border-t border-[#0000001F] pt-6 mt-auto">
                  <h4 className="text-[#3A3A3A] text-[16px] font-medium font-['DM_Sans'] mb-1">
                    {item.name}
                  </h4>
                  <p className="text-[#0D4A7A] text-[14px] font-medium font-['DM_Sans']">
                    {item.role}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-4 mt-8 md:mt-12">
            <button
              onClick={() => handleTestimonialScroll("prev")}
              className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors"
              aria-label="Previous"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#0D4A7A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <button
              onClick={() => handleTestimonialScroll("next")}
              className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors"
              aria-label="Next"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 19M19 12L12 5" stroke="#0D4A7A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

        </div>
      </div>
    </section>
  );
};