import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Heart, Globe, Home as HomeIcon, Users, HandHeart, FileText, Briefcase, Handshake } from "lucide-react";

import { useLocation, Link } from "wouter";
import { scrollToContactWithRetry, scrollToPartnersWithRetry } from "@/lib/scrollToSection";

import { useAppointment } from "@/context/AppointmentContext";

const navLinks = [
  { name: "Home", href: "/", route: true },

  {
    name: "About us",
    href: "/about-us",
    route: true,

    dropdown: [
      {
        name: "About us",
        href: "/about-us",
        route: true,
      },

      {
        name: "Team",
        href: "/team",
        route: true,
      },

      {
        name: "Contact",
        href: "/#contact",
        route: false,
      },
    ],
  },

  {
    name: "Services",
    href: "/services",
    route: true,

    dropdown: [
      {
        name: "Counselling & Therapy",
        href: "/services#counselling",
        route: false,
      },

      {
        name: "Supervision",
        href: "/services#supervision",
        route: false,
      },

      {
        name: "Training & Workshop",
        href: "/services#training",
        route: false,
      },
    ],
  },

  {
    name: "Resources",
    href: "/events",
    route: false,

    dropdown: [
      {
        name: "Events",
        href: "/events",
        route: true,
      },

      {
        name: "Articles",
        href: "/articles",
        route: true,
      },

      {
        name: "Volunteers",
        href: "/volunteer",
        route: true,
      },
    ],
  },

  {
    name: "Partners",
    href: "/partners",
    route: true,
  },

  {
    name: "Careers",
    href: "/career",
    route: true,
    newTab: true,
  },
];

const navIcons = {
  Home: HomeIcon,
  "About us": Users,
  Services: HandHeart,
  Resources: FileText,
  Partners: Handshake,
  Careers: Briefcase,
};

const languages = [
  {
    code: "EN",
    name: "English",
    flag: "🇺🇸",
    displayName: "Eng",
  },

  {
    code: "ZH",
    name: "Chinese",
    flag: "🇨🇳",
    displayName: "中文",
  },

  {
    code: "MS",
    name: "Malay",
    flag: "🇲🇾",
    displayName: "BM",
  },
];

export function Navbar() {
  const { openModal } =
    useAppointment();

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [location, navigate] =
    useLocation();

 const [activeDropdown, setActiveDropdown] =
  useState(null);

const [hoveredNav, setHoveredNav] =
  useState(null);

  const [
    activeLangDropdown,
    setActiveLangDropdown,
  ] = useState(false);

  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);

  const [showNavbar, setShowNavbar] =
    useState(false);

  const [isScrolled, setIsScrolled] =
    useState(false);

  const [navbarHeight, setNavbarHeight] = useState(0);
  const navbarRef = useState(null);

  /* =====================================================
     SCROLL
  ===================================================== */

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener(
      "scroll",
      handleScroll
    );

    return () =>
      window.removeEventListener(
        "scroll",
        handleScroll
      );
  }, []);

  /* =====================================================
     INTRO CHECK
  ===================================================== */

  useEffect(() => {
    const checkIntro = () => {
      const intro =
        document.getElementById(
          "logo-intro"
        );

      if (!intro) {
        setShowNavbar(true);
      } else {
        setShowNavbar(false);
      }
    };

    const interval =
      setInterval(checkIntro, 100);

    return () =>
      clearInterval(interval);
  }, []);

  /* =====================================================
     MEASURE NAVBAR HEIGHT FOR MOBILE MENU POSITIONING
  ===================================================== */

  useEffect(() => {
    const measureNavbar = () => {
      const navEl = document.getElementById("wings-main-navbar");
      if (navEl) {
        setNavbarHeight(navEl.offsetHeight);
      }
    };

    measureNavbar();
    window.addEventListener("resize", measureNavbar);

    return () => window.removeEventListener("resize", measureNavbar);
  }, [showNavbar]);

  /* =====================================================
     ESC KEY TO CLOSE MOBILE MENU
  ===================================================== */

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && mobileOpen) {
        setMobileOpen(false);
        setActiveDropdown(null);
        setActiveLangDropdown(false);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [mobileOpen]);

  /* =====================================================
     BODY SCROLL LOCK WHEN MOBILE MENU IS OPEN
  ===================================================== */

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  /* =====================================================
     HASH SCROLL
  ===================================================== */

  useEffect(() => {
    if (
      showNavbar &&
      window.location.hash
    ) {
      const id =
        window.location.hash;

      const el =
        document.querySelector(id);

      if (el) {
        const timer =
          setTimeout(() => {
            el.scrollIntoView({
              behavior: "smooth",
            });
          }, 300);

        return () =>
          clearTimeout(timer);
      }
    }
  }, [showNavbar, location]);

  /* =====================================================
     NAVIGATION
  ===================================================== */

  const handleNavClick = (
    e,
    link
  ) => {
    e.preventDefault();

    if (link.dropdown) return;

    setMobileOpen(false);

    setActiveDropdown(null);

    if (link.newTab) {
      window.open(link.href, "_blank", "noopener,noreferrer");
      return;
    }

    if (link.route) {
      navigate(link.href);
    } else {
      const [path, hashPart] =
        link.href.split("#");

      const targetPath =
        path || "/";

      const targetHash =
        hashPart
          ? `#${hashPart}`
          : "";

      try {
        if (targetHash) {
          sessionStorage.setItem(
            "skipLogoIntro",
            "1"
          );
        }
      } catch (err) {}

      if (
        location === targetPath &&
        targetHash === "#contact"
      ) {
        scrollToContactWithRetry();
        return;
      }

      if (
        location === targetPath &&
        targetHash === "#partners"
      ) {
        scrollToPartnersWithRetry();
        return;
      }

      if (
        location === targetPath &&
        targetHash
      ) {
        const el =
          document.querySelector(
            targetHash
          );

        if (el) {
          el.scrollIntoView({
            behavior: "smooth",
          });
        } else {
          window.location.hash =
            targetHash;
        }
      } else if (
        targetPath === "/" &&
        targetHash
      ) {
        try {
          if (targetHash === "#contact") {
            sessionStorage.setItem(
              "scrollToContact",
              "1"
            );
          }
          if (targetHash === "#partners") {
            sessionStorage.setItem(
              "scrollToPartners",
              "1"
            );
          }
        } catch (err) {}

        navigate("/");
      } else {
        navigate(link.href);
      }
    }
  };

  /* =====================================================
     LANGUAGE
  ===================================================== */

  const handleLanguageSelect = (
    lang
  ) => {
    setSelectedLanguage(lang);

    setActiveLangDropdown(false);
  };

  const getLanguageDisplayText = () => {
      if (selectedLanguage) {
        return selectedLanguage.displayName;
      }

      return selectedLanguage.displayName;
    };

  return (
    <>
      <AnimatePresence>
        {showNavbar && (
          <motion.div
            initial={{
              opacity: 0,
              y: -20,
            }}

            animate={{
              opacity: 1,
              y: 0,
            }}

            transition={{
              duration: 0.5,
              ease: "easeOut",
            }}

            className="
              fixed
              top-0
              left-0
              right-0
              w-full
              z-[100002]
              pointer-events-none
            "
          >
            {/* =====================================================
               NAVBAR WRAPPER
            ===================================================== */}

            <div
              id="wings-navbar-wrapper"
              className={`
                w-full
                flex
                justify-center
                transition-all
                duration-300
                px-2
                min-[375px]:px-3
                sm:px-4
                md:px-5
                lg:px-6
                xl:px-8
                2xl:px-10

                ${
                  isScrolled
                    ? "pt-0 pb-2 sm:pb-3"
                    : "pt-2 pb-2 sm:pt-3 sm:pb-4"
                }
              `}
            >
              {/* =====================================================
                 MAIN NAVBAR
              ===================================================== */}

              <div
                id="wings-main-navbar"
                className="
                  w-full
                  max-w-[1500px]
                  2xl:max-w-[1600px]
                  min-[2560px]:max-w-[1800px]
                  mx-auto
                  flex
                  items-center
                  justify-between
                  gap-2
                  sm:gap-3
                  lg:gap-4
                  min-w-0
                  pointer-events-auto
                  transition-all
                  duration-300
                "
                style={{
                  minHeight: "clamp(64px, 5vw, 88px)",
                  padding: "clamp(8px, 1vw, 12px) clamp(12px, 2vw, 24px)",

                  borderRadius:
                    isScrolled
                      ? "0 0 clamp(16px,3vw,30px) clamp(16px,3vw,30px)"
                      : "clamp(16px,3vw,30px)",

                  background: "#FFF",

                  boxShadow:
                    "0 4px 15px rgba(0,0,0,0.08)",
                }}
              >
                {/* =====================================================
                   LOGO
                ===================================================== */}

                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();

                    navigate("/");
                  }}

                  className="
                    flex-shrink-0
                  "
                >
                  <img
                    src="/assets/wingsLogo.png"
                    alt="Wings Counselling Centre"
                    className="
                      w-[140px]
                      min-[375px]:w-[155px]
                      sm:w-[170px]
                      md:w-[170px]
                      lg:w-[180px]
                      xl:w-[210px]
                      2xl:w-[230px]
                    "
                    style={{
                      height: "auto",
                      objectFit:
                        "contain",
                    }}
                  />
                </a>

                {/* =====================================================
                   DESKTOP NAVIGATION
                ===================================================== */}

                <div
                  className="
                    hidden
                    min-[1132px]:flex
                    flex-1
                    items-center
                    justify-center
                    gap-0
                    lg:gap-0
                    xl:gap-1
                    2xl:gap-3
                    min-w-0
                    overflow-visible
                  "
                >
                  {navLinks.map(
                    (link) => {
                      const hasDropdown =
                        !!link.dropdown;

                      const isActive =
                        location ===
                          link.href ||
                        (hasDropdown &&
                          link.dropdown.some(
                            (d) =>
                              location ===
                              d.href
                          ));
                          const isHovered =
  hoveredNav === link.name;

                      return (
                        <div
                          key={
                            link.name
                          }

                          className="
                            relative
                            group
                          "

                          onMouseEnter={() => {
  setHoveredNav(link.name);

  if (hasDropdown) {
    setActiveDropdown(link.name);
  }
}}

onMouseLeave={() => {
  setHoveredNav(null);

  if (hasDropdown) {
    setActiveDropdown(null);
  }
}}
                        >
                          {/* =====================================================
                             NAV ITEM
                          ===================================================== */}

                          <div className="relative">
                            {link.route ? (
                              link.newTab ? (
                                <a
                                  href={link.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="
                                    flex
                                    items-center
                                    gap-1
                                    transition-all
                                    duration-300
                                    nav-item-parent
                                    whitespace-nowrap
                                  "
                                  style={{
  color:
  isActive ||
  isHovered ||
  activeDropdown === link.name
    ? "#1B4585"
    : "#000",
                                    fontFamily:
                                      "'DM Sans', sans-serif",
                                    fontSize:
                                      "clamp(13px,0.95vw,18px)",
                                    fontWeight:
                                      "500",
                                    textDecoration:
                                      "none",
                                    padding:
                                      "clamp(6px,0.5vw,8px) clamp(8px,0.8vw,14px)",
                                    borderRadius:
                                      "8px",
                                    cursor:
                                      "pointer",
                                  }}
                                >
                                  {link.name}
                                </a>
                              ) : (
                              <Link
                                href={
                                  link.href
                                }

                                className="
                                  flex
                                  items-center
                                  gap-1
                                  transition-all
                                  duration-300
                                  nav-item-parent
                                  whitespace-nowrap
                                "

                                style={{
                                 color:
  isActive ||
  isHovered ||
  activeDropdown === link.name
    ? "#1B4585"
    : "#000",

                                  fontFamily:
                                    "'DM Sans', sans-serif",

                                  fontSize:
                                    "clamp(13px,0.95vw,18px)",

                                  fontWeight:
                                    "500",

                                  textDecoration:
                                    "none",

                                  padding:
                                    "clamp(6px,0.5vw,8px) clamp(8px,0.8vw,14px)",

                                  borderRadius:
                                    "8px",

                                  cursor:
                                    "pointer",
                                }}

                                onClick={() => {
                                  setMobileOpen(
                                    false
                                  );

                                  setActiveDropdown(
                                    null
                                  );
                                }}
                              >
                                {
                                  link.name
                                }

                                {hasDropdown && (
                                  <ChevronDown
                                    size={
                                      18
                                    }

                                    className={`
                                      transition-transform
                                      duration-300

                                      ${
                                        activeDropdown ===
                                        link.name
                                          ? "rotate-180"
                                          : ""
                                      }
                                    `}
                                  />
                                )}
                              </Link>
                              )
                            ) : (
                              <div
                                className="
                                  flex
                                  items-center
                                  gap-1
                                  transition-all
                                  duration-300
                                  cursor-default
                                  nav-item-parent
                                  whitespace-nowrap
                                "
                                style={{
                                 color:
                                isActive ||
                                isHovered ||
                                activeDropdown === link.name
                                  ? "#1B4585"
                                  : "#000",

                                  fontFamily:
                                    "'DM Sans', sans-serif",

                                  fontSize:
                                    "clamp(13px,0.95vw,18px)",

                                  fontWeight:
                                    "500",

                                  padding:
                                    "clamp(6px,0.5vw,8px) clamp(8px,0.8vw,14px)",

                                  borderRadius:
                                    "8px",
                                }}
                              >
                                {
                                  link.name
                                }

                                {hasDropdown && (
                                  <ChevronDown
                                    size={
                                      18
                                    }

                                    className={`
                                      transition-transform
                                      duration-300

                                      ${
                                        activeDropdown ===
                                        link.name
                                          ? "rotate-180"
                                          : ""
                                      }
                                    `}
                                  />
                                )}
                              </div>
                            )}

                            <AnimatePresence>
                              {(isActive ||
  isHovered ||
  activeDropdown === link.name) && (
                                <motion.div
                                  layoutId="navUnderline"

                                  initial={{
                                    scaleX: 0,
                                    opacity: 0,
                                  }}

                                  animate={{
                                    scaleX: 1,
                                    opacity: 1,
                                  }}

                                  exit={{
                                    scaleX: 0,
                                    opacity: 0,
                                  }}

                                 transition={{
  duration: 0.25,
  ease: "easeOut",
}}

                                  className="
                                    absolute
                                    bottom-0
                                    left-4
                                    right-4
                                    h-[2px]
                                    bg-[#1B4585]
                                  "
                                />
                              )}
                            </AnimatePresence>
                          </div>

                          {/* =====================================================
                             DROPDOWN
                          ===================================================== */}

                          {hasDropdown && (
                            <AnimatePresence>
                              {activeDropdown ===
                                link.name && (
                                <motion.div
                                  initial={{
                                    opacity: 0,
                                    y: 10,
                                  }}

                                  animate={{
                                    opacity: 1,
                                    y: 0,
                                  }}

                                  exit={{
                                    opacity: 0,
                                    y: 10,
                                  }}

                                  transition={{
                                    duration: 0.2,
                                  }}

                                  className="
                                    absolute
                                    top-full
                                    left-0
                                    mt-2
                                    min-w-[220px]
                                    lg:min-w-[220px]
                                    xl:min-w-[240px]
                                    bg-white
                                    rounded-xl
                                    shadow-xl
                                    overflow-hidden
                                    border
                                    border-gray-100
                                    z-[100]
                                  "
                                >
                                  <div className="py-2">
                                    {link.dropdown.map(
                                      (
                                        subItem
                                      ) =>
                                        subItem.route ? (
                                          <Link
                                            key={
                                              subItem.name
                                            }

                                            href={
                                              subItem.href
                                            }

                                            className="
                                              block
                                              px-5
                                              lg:px-5
                                              xl:px-6
                                              py-3
                                              transition-all
                                              duration-200
                                              dropdown-item
                                              rounded-lg
                                              mx-2
                                            "

                                            style={{
                                              fontFamily:
                                                "'DM Sans', sans-serif",

                                              fontWeight:
                                                "500",

                                              fontSize:
                                                "clamp(13px,0.95vw,16px)",

                                              textDecoration:
                                                "none",

                                              color:
                                                location ===
                                                subItem.href
                                                  ? "#1B4585"
                                                  : "#333",

                                              backgroundColor:
                                                location ===
                                                subItem.href
                                                  ? "#EAF3FF"
                                                  : "transparent",
                                            }}

                                            onClick={() => {
                                              setActiveDropdown(
                                                null
                                              );

                                              setMobileOpen(
                                                false
                                              );
                                            }}
                                          >
                                            {
                                              subItem.name
                                            }
                                          </Link>
                                        ) : (
                                          <a
                                            key={
                                              subItem.name
                                            }

                                            href={
                                              subItem.href
                                            }

                                            onClick={(
                                              e
                                            ) =>
                                              handleNavClick(
                                                e,
                                                subItem
                                              )
                                            }

                                            className="
                                              block
                                              px-5
                                              lg:px-5
                                              xl:px-6
                                              py-3
                                              transition-all
                                              duration-200
                                              dropdown-item
                                              rounded-lg
                                              mx-2
                                            "

                                            style={{
                                              fontFamily:
                                                "'DM Sans', sans-serif",

                                              fontWeight:
                                                "500",

                                              fontSize:
                                                "clamp(13px,0.95vw,16px)",

                                              textDecoration:
                                                "none",

                                              color:
                                                "#333",
                                            }}
                                          >
                                            {
                                              subItem.name
                                            }
                                          </a>
                                        )
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>

                {/* =====================================================
                   RIGHT BUTTONS
                ===================================================== */}

                <div
                  className="
                    hidden
                    min-[1132px]:flex
                    items-center
                    gap-1
                    min-[1132px]:gap-1
                    xl:gap-2
                    2xl:gap-3
                    flex-shrink-0
                  "
                >

                  {/* =====================================================
                     LANGUAGE
                  ===================================================== */}

                  <div
                    className="
                      relative
                    "

                    onMouseEnter={() =>
                      setActiveLangDropdown(
                        true
                      )
                    }

                    onMouseLeave={() =>
                      setActiveLangDropdown(
                        false
                      )
                    }
                  >
                    <div
                      className="
                        flex
                        items-center
                        gap-1.5
                        xl:gap-2
                        cursor-pointer
                        nav-item-parent
                        whitespace-nowrap
                      "
                      style={{
                        color:
                          activeLangDropdown
                            ? "#1B4585"
                            : "#000",

                        fontFamily:
                          "'DM Sans', sans-serif",

                        fontSize:
                          "clamp(13px,0.95vw,18px)",

                        fontWeight:
                          "500",

                        padding:
                          "clamp(6px,0.5vw,8px) clamp(8px,0.8vw,14px)",

                        borderRadius:
                          "8px",
                      }}
                    >
                      <Globe
                        size={18}
                        color="#1B4585"
                      />

                      <span>
                        {getLanguageDisplayText()}
                      </span>

                      <ChevronDown
                        size={16}
                        className={`
                          transition-transform
                          duration-300

                          ${
                            activeLangDropdown
                              ? "rotate-180"
                              : ""
                          }
                        `}
                      />
                    </div>

                    <AnimatePresence>
                      {activeLangDropdown && (
                        <motion.div
                          initial={{
                            opacity: 0,
                            y: 10,
                          }}

                          animate={{
                            opacity: 1,
                            y: 0,
                          }}

                          exit={{
                            opacity: 0,
                            y: 10,
                          }}

                          transition={{
                            duration: 0.2,
                          }}

                          className="
                            absolute
                            top-full
                            right-0
                            mt-2
                            min-w-[200px]
                            xl:min-w-[220px]
                            bg-white
                            rounded-xl
                            shadow-xl
                            overflow-hidden
                            border
                            border-gray-100
                            z-[100]
                          "
                        >
                          <div className="py-2">
                            {languages.map(
                              (
                                lang
                              ) => (
                                <button
                                  key={
                                    lang.code
                                  }

                                  onClick={() =>
                                    handleLanguageSelect(
                                      lang
                                    )
                                  }

                                  className="
                                    w-full
                                    text-left
                                    px-5
                                    xl:px-6
                                    py-3
                                    transition-all
                                    duration-200
                                    dropdown-item
                                    rounded-lg
                                    mx-2
                                    flex
                                    items-center
                                    gap-3
                                  "

                                  style={{
                                    fontFamily:
                                      "'DM Sans', sans-serif",

                                    fontWeight:
                                      "500",

                                    fontSize:
                                      "clamp(13px,0.95vw,16px)",

                                    color:
                                      selectedLanguage?.code ===
                                      lang.code
                                        ? "#1B4585"
                                        : "#333",

                                    backgroundColor:
                                      selectedLanguage?.code ===
                                      lang.code
                                        ? "#EAF3FF"
                                        : "transparent",
                                  }}
                                >
                                  <span className="text-[18px]">
                                    {
                                      lang.flag
                                    }
                                  </span>

                                  <span>
                                    {
                                      lang.displayName
                                    }
                                  </span>

                                  {selectedLanguage?.code ===
                                    lang.code && (
                                    <span className="ml-auto text-[#1B4585]">
                                      ✓
                                    </span>
                                  )}
                                </button>
                              )
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* DONATE */}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();

                      window.open(
                        "https://ramakrishna.org.sg/Authentication/Login?returnUrl=%2FDonation%2FDonateNow",
                        "_blank"
                      );
                    }}
                    className="
                      transition-transform
                      hover:scale-105
                      flex
                      items-center
                      justify-center
                      gap-1.5
                      xl:gap-2
                      whitespace-nowrap
                    "
                    style={{
                      height: "clamp(40px, 3vw, 46px)",
                      padding: "0 clamp(12px, 1.2vw, 18px)",
                      borderRadius: "9999px",
                      border: "2px solid #1B4585",
                      color: "#1B4585",
                      textDecoration: "none",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: "clamp(12px,0.9vw,15px)",
                      fontWeight: "600",
                    }}
                  >
                    Donate

                    <Heart size={17} fill="currentColor" />
                  </a>

                  {/* APPOINTMENT */}

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      openModal();
                    }}
                    className="
                      transition-all
                      hover:scale-105
                      hover:shadow-xl
                      active:scale-95
                      active:shadow-md
                      flex
                      items-center
                      justify-center
                      gap-1.5
                      xl:gap-2
                      whitespace-nowrap
                    "
                    style={{
                      height: "clamp(40px, 3vw, 46px)",
                      padding: "0 clamp(12px, 1.2vw, 18px)",
                      borderRadius: "9999px",
                      background: "#1B4585",
                      color: "#F5F9FF",
                      textDecoration: "none",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: "clamp(12px,0.9vw,15px)",
                      fontWeight: "700",
                      boxShadow: "0 4px 12px rgba(27,69,133,0.3)",
                      border: "none",
                    }}
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
                  </button>
                </div>

                {/* =====================================================
                   MOBILE BUTTON
                ===================================================== */}

                <button
                  className="
                    min-[1132px]:hidden
                    flex
                    items-center
                    justify-center
                    p-2
                    flex-shrink-0
                  "

                  onClick={() =>
                    setMobileOpen(
                      !mobileOpen
                    )
                  }

                  style={{
                    background:
                      "none",

                    border:
                      "none",
                  }}
                >
                  {mobileOpen ? (
                    <X
                      size={28}
                      color="#1B4585"
                    />
                  ) : (
                    <Menu
                      size={28}
                      color="#1B4585"
                    />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================
         MOBILE MENU - GLASSMORPHISM RIGHT-SIDE PANEL
      ===================================================== */}

      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* BACKDROP OVERLAY */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="
                fixed
                inset-0
                z-[100000]
                min-[1132px]:hidden
              "
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
              }}
              onClick={() => {
                setMobileOpen(false);
                setActiveDropdown(null);
                setActiveLangDropdown(false);
              }}
            />

            {/* SLIDING PANEL */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 300,
                mass: 0.8,
              }}
              className="
                fixed
                right-2
                min-[375px]:right-3
                sm:right-4
                h-fit
                z-[100001]
                min-[1132px]:hidden
                overflow-hidden
                flex
                flex-col
              "
              style={{
                top: navbarHeight > 0
                  ? `${navbarHeight + 8}px`
                  : "clamp(72px,14vw,96px)",
                maxHeight: navbarHeight > 0
                  ? `calc(100vh - ${navbarHeight + 16}px)`
                  : "calc(100vh - 100px)",
                width: "85%",
                maxWidth: window.innerWidth >= 600 ? "400px" : "320px",
                borderRadius: "24px",
                background: "#FFFFFF",
                backdropFilter: "blur(24px) saturate(180%)",
                WebkitBackdropFilter: "blur(24px) saturate(180%)",
                boxShadow: "-8px 0 40px rgba(0, 0, 0, 0.12), -2px 0 8px rgba(0, 0, 0, 0.06)",
                borderLeft: "1px solid rgba(255, 255, 255, 0.5)",
              }}
            >


              {/* SCROLLABLE NAV CONTENT */}
              <div
                className="
                  overflow-y-auto
                  overflow-x-hidden
                "
                style={{
                  padding: "clamp(8px, 2vw, 16px) clamp(12px, 3vw, 20px) clamp(16px, 4vw, 24px)",
                }}
              >
                <div className="flex flex-col gap-1">
                  {navLinks.map((link) => {
                    const hasDropdown = !!link.dropdown;
                    const isActive =
                      location === link.href ||
                      (hasDropdown &&
                        link.dropdown.some((d) => location === d.href));
                    const NavIcon = navIcons[link.name];

                    return (
                      <div key={link.name} className="w-full">
                        {/* MAIN BUTTON */}
                        <button
                          onClick={(e) => {
                            if (hasDropdown) {
                              setActiveDropdown(
                                activeDropdown === link.name
                                  ? null
                                  : link.name
                              );
                            } else {
                              handleNavClick(e, link);
                            }
                          }}
                          className="
                            w-full
                            flex
                            items-center
                            justify-between
                            transition-all
                            duration-200
                          "
                          style={{
                            padding: "14px 16px",
                            borderRadius: "16px",
                            color: "#1B4585",
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: "15px",
                            fontWeight: isActive ? "700" : "600",
                            background: isActive ? "rgba(27, 69, 133, 0.07)" : "transparent",
                            border: "none",
                          }}
                        >
                          <span className="flex items-center gap-3">
                            {NavIcon && (
                              <NavIcon
                                size={20}
                                color="#1B4585"
                                strokeWidth={isActive ? 2.5 : 2}
                              />
                            )}
                            {link.name}
                          </span>

                          {hasDropdown && (
                            <ChevronDown
                              size={18}
                              className={`
                                transition-transform
                                duration-300
                                ${activeDropdown === link.name ? "rotate-180" : ""}
                              `}
                            />
                          )}
                        </button>

                        {/* DROPDOWN */}
                        <AnimatePresence>
                          {hasDropdown &&
                            activeDropdown === link.name && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.25, ease: "easeInOut" }}
                                className="overflow-hidden"
                              >
                                <div
                                  className="flex flex-col gap-0.5"
                                  style={{
                                    marginLeft: "16px",
                                    marginTop: "4px",
                                    marginBottom: "4px",
                                    paddingLeft: "12px",
                                    borderLeft: "2px solid rgba(27, 69, 133, 0.12)",
                                  }}
                                >
                                  {link.dropdown.map((subItem) => {
                                    const subActive = location === subItem.href;

                                    return (
                                      <button
                                        key={subItem.name}
                                        onClick={(e) => handleNavClick(e, subItem)}
                                        className="
                                          text-left
                                          transition-all
                                          duration-200
                                        "
                                        style={{
                                          padding: "10px 14px",
                                          borderRadius: "12px",
                                          fontSize: "14px",
                                          fontFamily: "'DM Sans', sans-serif",
                                          fontWeight: subActive ? "600" : "500",
                                          color: subActive ? "#1B4585" : "#555",
                                          background: subActive ? "rgba(27, 69, 133, 0.06)" : "transparent",
                                          border: "none",
                                          width: "100%",
                                        }}
                                      >
                                        {subItem.name}
                                      </button>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>

                {/* MOBILE LANGUAGE */}
                <div
                  style={{
                    marginTop: "12px",
                    paddingTop: "12px",
                    borderTop: "1px solid rgba(27, 69, 133, 0.08)",
                  }}
                >
                  <button
                    onClick={() =>
                      setActiveLangDropdown(!activeLangDropdown)
                    }
                    className="
                      w-full
                      flex
                      items-center
                      justify-between
                      transition-all
                      duration-200
                    "
                    style={{
                      padding: "12px 14px",
                      borderRadius: "14px",
                      color: "#1B4585",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "15px",
                      fontWeight: "600",
                      background: "transparent",
                      border: "none",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Globe size={18} color="#1B4585" />
                      <span>{selectedLanguage.displayName}</span>
                    </div>

                    <ChevronDown
                      size={18}
                      className={`
                        transition-transform
                        duration-300
                        ${activeLangDropdown ? "rotate-180" : ""}
                      `}
                    />
                  </button>

                  <AnimatePresence>
                    {activeLangDropdown && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div
                          className="flex flex-col gap-0.5"
                          style={{
                            marginLeft: "16px",
                            marginTop: "4px",
                            paddingLeft: "12px",
                            borderLeft: "2px solid rgba(27, 69, 133, 0.12)",
                          }}
                        >
                          {languages.map((lang) => (
                            <button
                              key={lang.code}
                              onClick={() => handleLanguageSelect(lang)}
                              className="
                                w-full
                                flex
                                items-center
                                gap-3
                                text-left
                                transition-all
                                duration-200
                              "
                              style={{
                                padding: "10px 14px",
                                borderRadius: "12px",
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: "14px",
                                fontWeight: selectedLanguage.code === lang.code ? "600" : "500",
                                color: selectedLanguage.code === lang.code ? "#1B4585" : "#555",
                                background:
                                  selectedLanguage.code === lang.code
                                    ? "rgba(27, 69, 133, 0.06)"
                                    : "transparent",
                                border: "none",
                              }}
                            >
                              <span style={{ fontSize: "18px" }}>{lang.flag}</span>
                              <span>{lang.displayName}</span>
                              {selectedLanguage.code === lang.code && (
                                <span className="ml-auto text-[#1B4585] font-bold">✓</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ACTION BUTTONS */}
                <div
                  style={{
                    marginTop: "16px",
                    paddingTop: "16px",
                    borderTop: "1px solid rgba(27, 69, 133, 0.08)",
                  }}
                >
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        window.open(
                          "https://ramakrishna.org.sg/Authentication/Login?returnUrl=%2FDonation%2FDonateNow",
                          "_blank"
                        );
                      }}
                      className="
                        w-full
                        flex
                        items-center
                        justify-center
                        gap-2
                        transition-all
                        duration-200
                        active:scale-[0.97]
                      "
                      style={{
                        height: "48px",
                        borderRadius: "9999px",
                        border: "2px solid #1B4585",
                        color: "#1B4585",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: "15px",
                        fontWeight: "600",
                        background: "transparent",
                      }}
                    >
                      Donate
                      <Heart size={16} fill="#1B4585" color="#1B4585" />
                    </button>

                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        openModal();
                      }}
                      className="
                        w-full
                        flex
                        items-center
                        justify-center
                        gap-2
                        transition-all
                        duration-200
                        active:scale-[0.97]
                      "
                      style={{
                        height: "48px",
                        borderRadius: "9999px",
                        background: "#1B4585",
                        color: "#F5F9FF",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: "15px",
                        fontWeight: "700",
                        boxShadow: "0 4px 16px rgba(27, 69, 133, 0.3)",
                        border: "none",
                      }}
                    >
                      Book an appointment
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .nav-item-parent:hover {
          color: #1b4585 !important;
        }

        .dropdown-item:hover {
          background-color: #eaf3ff !important;
          color: #1b4585 !important;
        }

        @media (max-width: 1131px) {
          .mobile-nav-panel::-webkit-scrollbar {
            width: 0px;
            background: transparent;
          }

          .mobile-nav-panel {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
        }

        @supports (max-width: 400px) {
          @media (min-width: 600px) and (max-width: 1131px) {
            .mobile-slide-panel {
              max-width: 480px !important;
            }
          }
        }
      `}</style>
    </>
  );
}