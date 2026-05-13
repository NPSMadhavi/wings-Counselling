import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useLocation } from "wouter";
import { useAppointment } from "@/context/AppointmentContext";

const navLinks = [
  { name: "Home", href: "/#home", route: false },
  { name: "About Us", href: "/about-us", route: true },
  { name: "Services", href: "/services", route: true },
  { name: "Team", href: "/team", route: true },
  { name: "Events", href: "/events", route: true },
  { name: "Contact", href: "/#contact", route: false },
  { name: "Careers", href: "/careers", route: true },
];

export function Navbar() {
  const { openModal } = useAppointment();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location, navigate] = useLocation();

  // Controls navbar visibility
  const [showNavbar, setShowNavbar] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Wait until intro finishes
  useEffect(() => {
    const checkIntro = () => {
      const intro = document.getElementById("logo-intro");

      if (!intro) {
        setShowNavbar(true);
      } else {
        setShowNavbar(false);
      }
    };

    const interval = setInterval(checkIntro, 100);

    return () => clearInterval(interval);
  }, []);

  // Handle hash scrolling after intro finishes
  useEffect(() => {
    if (showNavbar && window.location.hash) {
      const id = window.location.hash;
      const el = document.querySelector(id);
      if (el) {
        // Small delay to ensure the page has fully transitioned
        const timer = setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth" });
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [showNavbar, location.pathname, location.hash]);

  const handleNavClick = (e, link) => {
    e.preventDefault();
    setMobileOpen(false);
    if (link.route) {
      navigate(link.href);
    } else {
      // Handle links with hashes (e.g., /#contact)
      const [path, hashPart] = link.href.split("#");
      const targetPath = path || "/";
      const targetHash = hashPart ? `#${hashPart}` : "";

      const currentPath = location.pathname;
      // Normalize paths for comparison (ensure trailing slash consistency if needed)
      const normalizedCurrent = currentPath === "/" ? "/" : currentPath;
      const normalizedTarget = targetPath === "/" ? "/" : targetPath;

      // Always set skip flag when navigating to a hash target so Home skips intro
      try {
        if (targetHash) sessionStorage.setItem("skipLogoIntro", "1");
      } catch (err) {
        // ignore storage errors
      }

      if (normalizedCurrent === normalizedTarget && targetHash) {
        // If already on the target page, try to scroll immediately. If the
        // element isn't present yet, set the hash as a fallback which also
        // allows other parts of the app to handle scrolling.
        const el = document.querySelector(targetHash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        } else {
          window.location.hash = targetHash;
          // Try again shortly after in case the element mounts asynchronously.
          setTimeout(() => {
            const el2 = document.querySelector(targetHash);
            if (el2) el2.scrollIntoView({ behavior: "smooth" });
          }, 250);
        }
      } else {
        // Navigate to the target (Home with hash). Home will read the skip flag
        // and avoid showing the intro, and the Navbar's hash-effect will
        // perform scrolling after intro/state settles.
        navigate(link.href);
      }
    }
  };

  return (
    <>
      {/* Navbar */}
      <AnimatePresence>
        {showNavbar && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed top-0 left-0 right-0 w-full z-[99999] pointer-events-none"
            style={{ position: 'fixed' }}
          >
            <div
              className={`w-full flex justify-center transition-all duration-300 ${isScrolled ? "pt-0 pb-3 sm:pb-5 px-6 md:px-12 lg:px-24 xl:px-[100px]" : "py-3 sm:py-5 px-6 md:px-12 lg:px-24 xl:px-[100px]"
                }`}
            >

              <div
                className="w-full flex items-center justify-between pointer-events-auto transition-all duration-300"
                style={{
                  height: "clamp(60px, 10vw, 90px)",
                  padding: "0 clamp(16px, 3vw, 40px)",
                  borderRadius: isScrolled ? "0 0 clamp(16px, 3vw, 30px) clamp(16px, 3vw, 30px)" : "clamp(16px, 3vw, 30px)",
                  background: "#FFF",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.08)"
                }}
              >

                {/* Logo - MUCH BIGGER SIZE */}
                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/");
                  }}
                  className="shrink-0"
                >
                  <img
                    src="/assets/wingsLogo.png"
                    alt="Wings Counselling Centre"
                    className="w-[140px] sm:w-[190px] md:w-[220px] lg:w-[260px] xl:w-[300px]"
                    style={{
                      height: "auto",
                      objectFit: "contain"
                    }}
                  />
                </a>

                {/* Desktop Navigation Links - LARGER TEXT SIZE */}
                <div className="hidden lg:flex items-center gap-[12px]">
                  {navLinks.map((link) => {
                    const isActive = link.route ? location === link.href : false;
                    return (
                      <a
                        key={link.name}
                        href={link.href}
                        onClick={(e) => handleNavClick(e, link)}
                        className="transition-all duration-300 nav-link"
                        style={{
                          color: isActive ? "#1B4585" : "#000",
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: "22px",
                          fontWeight: "500",
                          textDecoration: "none",
                          whiteSpace: "nowrap",
                          padding: "8px 16px",
                          borderRadius: "8px",
                          transition: "all 0.3s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#E8F4FD";
                          e.currentTarget.style.color = "#1B4585";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          if (!isActive) {
                            e.currentTarget.style.color = "#000";
                          } else {
                            e.currentTarget.style.color = "#1B4585";
                          }
                        }}
                      >
                        {link.name}
                      </a>
                    );
                  })}
                </div>

                {/* Right Side Buttons - Donate & Book now - LARGER TEXT */}
                <div className="hidden lg:flex items-center gap-4">
                  {/* Donate Button */}
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); window.open("https://ramakrishna.org.sg/Authentication/Login?returnUrl=%2FDonation%2FDonateNow", "_blank"); }}
                    className="transition-transform hover:scale-105"
                    style={{
                      padding: "12px 28px",
                      borderRadius: "9999px",
                      background: "transparent",
                      border: "2px solid #1B4585",
                      color: "#1B4585",
                      textDecoration: "none",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: "20px",
                      fontWeight: "600",
                      whiteSpace: "nowrap"
                    }}
                  >
                    Donate
                  </a>

                  {/* Book now Button - LARGER AND MORE PROMINENT */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      openModal();
                    }}
                    className="transition-transform hover:scale-105"
                    style={{
                      padding: "12px 32px",
                      borderRadius: "9999px",
                      background: "#1B4585",
                      color: "#F5F9FF",
                      textDecoration: "none",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: "22px",
                      fontWeight: "700",
                      whiteSpace: "nowrap",
                      boxShadow: "0 4px 12px rgba(27, 69, 133, 0.3)"
                    }}
                  >
                    Book an Appointment
                  </button>
                </div>

                {/* Mobile Menu Button */}
                <button
                  className="lg:hidden flex items-center justify-center"
                  onClick={() => setMobileOpen(!mobileOpen)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "8px"
                  }}
                >
                  {mobileOpen
                    ? <X size={28} color="#1B4585" />
                    : <Menu size={28} color="#1B4585" />
                  }
                </button>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="fixed top-[90px] sm:top-[100px] left-2 right-2 sm:left-4 sm:right-4 z-[9998]"
            style={{
              background: "#FFF",
              borderRadius: "20px",
              padding: "20px 24px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}
          >
            {navLinks.map((link) => {
              const isActive = link.route ? location === link.href : false;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link)}
                  style={{
                    color: isActive ? "#1B4585" : "#000",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "22px",
                    fontWeight: "500",
                    textDecoration: "none",
                    padding: "12px 12px",
                    borderRadius: "8px",
                    transition: "all 0.3s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#E8F4FD";
                    e.currentTarget.style.color = "#1B4585";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    if (!isActive) {
                      e.currentTarget.style.color = "#000";
                    } else {
                      e.currentTarget.style.color = "#1B4585";
                    }
                  }}
                >
                  {link.name}
                </a>
              );
            })}

            {/* Mobile Donate Button */}
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); window.open("https://ramakrishna.org.sg/Authentication/Login?returnUrl=%2FDonation%2FDonateNow", "_blank"); }}
              style={{
                display: "inline-flex",
                padding: "14px 20px",
                borderRadius: "9999px",
                background: "transparent",
                border: "2px solid #1B4585",
                color: "#1B4585",
                textDecoration: "none",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: "20px",
                fontWeight: "600",
                alignItems: "center",
                justifyContent: "center",
                marginTop: "8px"
              }}
            >
              Donate
            </a>

            {/* Mobile Book now Button - LARGER */}
            <button
              onClick={(e) => {
                e.preventDefault();
                openModal();
              }}
              style={{
                display: "inline-flex",
                padding: "14px 20px",
                borderRadius: "9999px",
                background: "#1B4585",
                color: "#F5F9FF",
                textDecoration: "none",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: "22px",
                fontWeight: "700",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(27, 69, 133, 0.3)"
              }}
            >
              Book an Appointment
            </button>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Add this style block for additional CSS hover effects */}
      <style jsx>{`
        .nav-link {
          transition: all 0.3s ease;
        }
        .nav-link:hover {
          background-color: #E8F4FD !important;
          color: #1B4585 !important;
        }
      `}</style>
    </>
  );
}