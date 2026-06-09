import { FaInstagram, FaFacebookF, FaYoutube } from "react-icons/fa";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="w-full bg-[#1F2937] overflow-hidden">

      {/* Container — aligned with Navbar */}
      <div className="navbar-align-outer pt-10 sm:pt-[60px] pb-6 sm:pb-[30px]">
        <div className="navbar-align-inner">

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-16 mb-8 sm:mb-[50px] items-start">

          {/* COLUMN 1 */}
          <div className="flex flex-col gap-6">

            {/* Logo */}
            <Link href="/">
              <div
                className="
                  w-full
                  max-w-[291px]
                  rounded-[12px]
                  bg-white
                  flex items-center justify-center
                  p-3
                  cursor-pointer
                  hover:opacity-90
                  transition
                "
              >
                <img
                  src="/assets/wingsLogo.png"
                  alt="WINGS Logo"
                  className="w-full h-auto object-contain"
                />
              </div>
            </Link>

            {/* Description */}
            <p className="text-white/90 text-base sm:text-[18px] leading-relaxed sm:leading-[28px]">
              We are committed to providing affordable & professional
              counselling services to the community, regardless of creed,
              race or religion. Supporting lives since 1995.
            </p>

            {/* Social Icons */}
            <div className="flex gap-2">

              {[
                {
                  icon: <FaInstagram />,
                  link: "https://www.instagram.com/wingscounselling",
                },
                {
                  icon: <FaFacebookF />,
                  link: "https://www.facebook.com/wingscounselling",
                },
                {
                  icon: <FaYoutube />,
                  link: "https://www.youtube.com/@wingscounselling",
                },
              ].map((item, index) => (

                <a
                  key={index}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    w-[44px] h-[44px]
                    rounded-full
                    bg-white/10
                    flex items-center justify-center
                    text-white text-[18px]
                    transition-all duration-300
                    hover:bg-white hover:text-[#1F2937]
                  "
                >
                  {item.icon}
                </a>

              ))}

            </div>
          </div>

          {/* COLUMN 2 */}
          <div className="flex flex-col items-start md:items-center w-full">

            {/* Links Container */}
            <div className="w-full max-w-[160px] flex flex-col gap-[16px]">

              {/* Heading */}
              <h3 className="text-white text-2xl sm:text-[30px] font-semibold mb-4">
                Links
              </h3>

              <Link
                href="/"
                className="text-white/90 text-[15px] hover:text-white transition"
              >
                Home
              </Link>

              <Link
                href="/about-us"
                className="text-white/90 text-[15px] hover:text-white transition"
              >
                About us
              </Link>

              <Link
                href="/services"
                className="text-white/90 text-[15px] hover:text-white transition"
              >
                Services
              </Link>

              <Link
                href="/team"
                className="text-white/90 text-[15px] hover:text-white transition"
              >
                Our team
              </Link>

              <Link
                href="/events"
                className="text-white/90 text-[15px] hover:text-white transition"
              >
                Events
              </Link>

              <Link
                href="/#contact"
                className="text-white/90 text-[15px] hover:text-white transition"
              >
                Contact us
              </Link>

            </div>

          </div>

          {/* COLUMN 3 */}
          <div className="flex flex-col gap-6">

            <h3 className="text-white text-2xl sm:text-[30px] font-semibold">
              Stay connected
            </h3>

            <p className="text-white/70 text-base sm:text-[17px] leading-relaxed sm:leading-[28px]">
              We are committed to providing affordable &
              professional counselling services.
            </p>

            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => e.preventDefault()}
            >

              {/* Full Name */}
              <input
                type="text"
                placeholder="Full Name"
                className="
                  w-full h-[54px]
                  rounded-[14px]
                  border border-white/20
                  bg-white/5
                  px-5
                  text-white placeholder:text-white/60
                  outline-none
                  focus:bg-white/10
                "
              />

              {/* Email + Button */}
              <div className="flex flex-col sm:flex-row gap-3">

                <input
                  type="email"
                  placeholder="Email Address"
                  className="
                    flex-1 h-[54px]
                    rounded-[14px]
                    border border-white/20
                    bg-white/5
                    px-5
                    text-white placeholder:text-white/60
                    outline-none
                    focus:bg-white/10
                  "
                />

                <button
                  type="submit"
                  className="
                    w-[54px] h-[54px]
                    rounded-[14px]
                    bg-white
                    flex items-center justify-center
                    hover:scale-105 transition
                  "
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="#1B4585"
                  >
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>

              </div>

            </form>
          </div>

        </div>

        {/* DIVIDER */}
        <div className="w-full h-[1px] bg-white/20 mb-8" />

        {/* BOTTOM */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">

          <p className="text-white/80 text-[15px] text-center md:text-left">
            © 2026 WINGS Counselling Centre. All rights reserved.
            Powered by{" "}
           <span className="text-[#FF543E]">
  <a
    href="https://netopsys.in/"
    target="_blank"
    rel="noopener noreferrer"
    className="hover:underline"
  >
    Netopsys AI Private Limited.
  </a>
</span>
          </p>

          <div className="flex items-center gap-4">

            <Link
              // href="/privacy-policy"
              className="text-white/80 hover:text-white transition"
            >
              Privacy policy
            </Link>

            <span className="text-white/40">|</span>

            <Link
              // href="/terms-of-service"
              className="text-white/80 hover:text-white transition"
            >
              Terms of service
            </Link>

          </div>

        </div>

        </div>
      </div>

    </footer>
  );
}