import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Heart, Globe } from "lucide-react";

import { useLocation, Link } from "wouter";

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
    name: "Careers",
    href: "/career",
    route: true,
    newTab: true,
  },
];

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

  const [
    activeLangDropdown,
    setActiveLangDropdown,
  ] = useState(false);

  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);

  const [showNavbar, setShowNavbar] =
    useState(false);

  const [isScrolled, setIsScrolled] =
    useState(false);

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
              z-[99999]
              pointer-events-none
            "
          >
            {/* =====================================================
               NAVBAR WRAPPER
            ===================================================== */}

            <div
              className={`
                w-full
                flex
                justify-center
                transition-all
                duration-300
                px-3
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
                className="
                  w-full
                  max-w-[1500px]
                  2xl:max-w-[1600px]
                  mx-auto
                  flex
                  items-center
                  justify-between
                  gap-4
                  min-w-0
                  pointer-events-auto
                  transition-all
                  duration-300
                "
                style={{
                  minHeight: "clamp(70px, 5vw, 88px)",
                  padding: "12px clamp(16px, 2vw, 24px)",

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
                      w-[120px]
                      sm:w-[145px]
                      md:w-[170px]
                      lg:w-[190px]
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
                    lg:flex
                    flex-1
                    items-center
                    justify-center
                    gap-0.5
                    xl:gap-1
                    2xl:gap-3
                    min-w-0
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

                      return (
                        <div
                          key={
                            link.name
                          }

                          className="
                            relative
                            group
                          "

                          onMouseEnter={() =>
                            hasDropdown &&
                            setActiveDropdown(
                              link.name
                            )
                          }

                          onMouseLeave={() =>
                            hasDropdown &&
                            setActiveDropdown(
                              null
                            )
                          }
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
                                      activeDropdown ===
                                        link.name
                                        ? "#1B4585"
                                        : "#000",
                                    fontFamily:
                                      "'DM Sans', sans-serif",
                                    fontSize:
                                      "clamp(14px,0.95vw,18px)",
                                    fontWeight:
                                      "500",
                                    textDecoration:
                                      "none",
                                    padding:
                                      "8px 14px",
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
                                    activeDropdown ===
                                      link.name
                                      ? "#1B4585"
                                      : "#000",

                                  fontFamily:
                                    "'DM Sans', sans-serif",

                                  fontSize:
                                    "clamp(14px,0.95vw,18px)",

                                  fontWeight:
                                    "500",

                                  textDecoration:
                                    "none",

                                  padding:
                                    "8px 14px",

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
                                    activeDropdown ===
                                      link.name
                                      ? "#1B4585"
                                      : "#000",

                                  fontFamily:
                                    "'DM Sans', sans-serif",

                                  fontSize:
                                    "clamp(14px,0.95vw,18px)",

                                  fontWeight:
                                    "500",

                                  padding:
                                    "8px 14px",

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
                              {(activeDropdown ===
                                link.name ||
                                (isActive &&
                                  activeDropdown ===
                                    null)) && (
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
                                    duration: 0.3,
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
                                    min-w-[240px]
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
                                              px-6
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
                                                "clamp(14px,0.95vw,16px)",

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
                                              px-6
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
                                                "clamp(14px,0.95vw,16px)",

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
                    lg:flex
                    items-center
                    gap-1.5
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
                        gap-2
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
                          "clamp(14px,0.95vw,18px)",

                        fontWeight:
                          "500",

                        padding:
                          "8px 14px",

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
                            min-w-[220px]
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
                                    px-6
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
                                      "clamp(14px,0.95vw,16px)",

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
                      gap-2
                      whitespace-nowrap
                    "
                    style={{
                      height: "46px",
                      padding: "0 18px",
                      borderRadius: "9999px",
                      border: "2px solid #1B4585",
                      color: "#1B4585",
                      textDecoration: "none",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: "clamp(13px,0.9vw,15px)",
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
                      gap-2
                      whitespace-nowrap
                    "
                    style={{
                      height: "46px",
                      padding: "0 18px",
                      borderRadius: "9999px",
                      background: "#1B4585",
                      color: "#F5F9FF",
                      textDecoration: "none",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: "clamp(13px,0.9vw,15px)",
                      fontWeight: "700",
                      boxShadow: "0 4px 12px rgba(27,69,133,0.3)",
                      border: "none",
                    }}
                  >
                    <span className="hidden xl:inline">Book an appointment</span>
                    <span className="xl:hidden">Book</span>

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
                    lg:hidden
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
         MOBILE MENU
      ===================================================== */}

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{
              opacity: 0,
              y: -10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -10,
            }}
            transition={{
              duration: 0.25,
            }}
            className="
              fixed
              top-[clamp(72px,14vw,96px)]
              left-3
              right-3
              sm:left-4
              sm:right-4
              bg-white
              rounded-3xl
              shadow-2xl
              z-[99998]
              overflow-hidden
              max-h-[calc(100vh-100px)]
              overflow-y-auto
              lg:hidden
            "
          >
            <div className="p-4 flex flex-col gap-2">

              {navLinks.map((link) => {
                const hasDropdown = !!link.dropdown;

                return (
                  <div
                    key={link.name}
                    className="w-full"
                  >
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
                        px-4
                        py-3
                        rounded-2xl
                        text-[#1B4585]
                        font-semibold
                        text-[15px]
                        hover:bg-[#F5F9FF]
                        transition-all
                      "
                    >
                      <span>{link.name}</span>

                      {hasDropdown && (
                        <ChevronDown
                          size={18}
                          className={`
                            transition-transform
                            duration-300
                            ${
                              activeDropdown === link.name
                                ? "rotate-180"
                                : ""
                            }
                          `}
                        />
                      )}
                    </button>

                    {/* DROPDOWN */}

                    <AnimatePresence>
                      {hasDropdown &&
                        activeDropdown === link.name && (
                          <motion.div
                            initial={{
                              opacity: 0,
                              height: 0,
                            }}
                            animate={{
                              opacity: 1,
                              height: "auto",
                            }}
                            exit={{
                              opacity: 0,
                              height: 0,
                            }}
                            className="
                              overflow-hidden
                              ml-2
                              mt-1
                              flex
                              flex-col
                              gap-1
                            "
                          >
                            {link.dropdown.map(
                              (subItem) => (
                                <button
                                  key={subItem.name}
                                  onClick={(e) =>
                                    handleNavClick(
                                      e,
                                      subItem
                                    )
                                  }
                                  className="
                                    text-left
                                    px-4
                                    py-3
                                    rounded-xl
                                    text-[14px]
                                    text-gray-700
                                    hover:bg-[#F5F9FF]
                                    hover:text-[#1B4585]
                                    transition-all
                                  "
                                >
                                  {subItem.name}
                                </button>
                              )
                            )}
                          </motion.div>
                        )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {/* MOBILE LANGUAGE */}

              <div className="mt-2 border-t pt-3">
                <div className="relative">

                  {/* LANGUAGE BUTTON */}

                  <button
                    onClick={() =>
                      setActiveLangDropdown(
                        !activeLangDropdown
                      )
                    }
                    className="
                      w-full
                      flex
                      items-center
                      justify-between
                      px-4
                      py-3
                      rounded-2xl
                      text-[#1B4585]
                      font-semibold
                      text-[15px]
                      hover:bg-[#F5F9FF]
                      transition-all
                    "
                  >
                    <div className="flex items-center gap-3">
                      <Globe size={18} />

                      <span>
                        {selectedLanguage.displayName}
                      </span>
                    </div>

                    <ChevronDown
                      size={18}
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
                  </button>

                  {/* LANGUAGE DROPDOWN */}

                  <AnimatePresence>
                    {activeLangDropdown && (
                      <motion.div
                        initial={{
                          opacity: 0,
                          height: 0,
                        }}
                        animate={{
                          opacity: 1,
                          height: "auto",
                        }}
                        exit={{
                          opacity: 0,
                          height: 0,
                        }}
                        className="
                          overflow-hidden
                          mt-2
                          flex
                          flex-col
                          gap-1
                        "
                      >
                        {languages.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => {
                              handleLanguageSelect(lang);
                            }}
                            className="
                              w-full
                              flex
                              items-center
                              gap-3
                              px-4
                              py-3
                              rounded-xl
                              hover:bg-[#F5F9FF]
                              transition-all
                              text-left
                            "
                          >
                            <span className="text-[18px]">
                              {lang.flag}
                            </span>

                            <span
                              className={`
                                font-medium
                                ${
                                  selectedLanguage.code ===
                                  lang.code
                                    ? "text-[#1B4585]"
                                    : "text-gray-700"
                                }
                              `}
                            >
                              {lang.displayName}
                            </span>

                            {selectedLanguage.code ===
                              lang.code && (
                              <span className="ml-auto text-[#1B4585]">
                                ✓
                              </span>
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* MOBILE BUTTONS */}

              <div className="flex flex-col gap-3 mt-3">

                <button
                  onClick={() =>
                    window.open(
                      "https://ramakrishna.org.sg/Authentication/Login?returnUrl=%2FDonation%2FDonateNow",
                      "_blank"
                    )
                  }
                  className="
                    w-full
                    border-2
                    border-[#1B4585]
                    text-[#1B4585]
                    rounded-full
                    py-3
                    font-semibold
                  "
                >
                  Donate
                </button>

                <button
                  onClick={() => {
                    setMobileOpen(false);
                    openModal();
                  }}
                  className="
                    w-full
                    bg-[#1B4585]
                    text-white
                    rounded-full
                    py-3
                    font-semibold
                  "
                >
                  Book an appointment
                </button>
              </div>
            </div>
          </motion.div>
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
      `}</style>
    </>
  );
}