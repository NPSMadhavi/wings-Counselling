import { FaInstagram, FaFacebookF, FaYoutube } from "react-icons/fa";

export function Footer() {
  return (
    <footer className="w-full flex flex-col items-center pt-[60px] md:pt-[100px] pb-[40px] font-['DM_Sans']" style={{ backgroundColor: "#1F2937" }}>
      <div className="w-full px-6 md:px-12 lg:px-[200px] flex flex-col items-center">

        {/* Main Content Grid */}
        <div className="flex flex-col lg:flex-row justify-between w-full mb-[60px] md:mb-[100px] gap-12 lg:gap-10">

          {/* Column 1: Logo and About Section */}
          <div className="flex flex-col gap-[25px] md:gap-[30px] w-full max-w-[350px]">
            <div
              className="w-[240px] md:w-[291px] h-auto rounded-[10px] bg-white flex items-center justify-center p-2"
              style={{ aspectRatio: "291/70" }}
            >
              <img
                src="/assets/wingsLogo.png"
                alt="WINGS Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-white font-['Plus_Jakarta_Sans'] text-[16px] md:text-[18px] font-[500] leading-[24px] md:leading-[28px]">
              We are committed to providing affordable & professional counselling services to the community, regardless of creed, race or religion. Supporting lives since 1995.
            </p>
            <div className="flex gap-[15px]">
              <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="relative w-[40px] h-[40px] flex items-center justify-center hover:opacity-80 transition-opacity">
                <svg className="absolute inset-0" width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="20" r="20" fill="#E8F4FD" fillOpacity="0.2" />
                </svg>
                <FaInstagram className="text-white relative z-10 w-[20px] h-[20px]" />
              </a>
              <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="relative w-[40px] h-[40px] flex items-center justify-center hover:opacity-80 transition-opacity">
                <svg className="absolute inset-0" width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="20" r="20" fill="#E8F4FD" fillOpacity="0.2" />
                </svg>
                <FaFacebookF className="text-white relative z-10 w-[18px] h-[18px]" />
              </a>
              <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" className="relative w-[40px] h-[40px] flex items-center justify-center hover:opacity-80 transition-opacity">
                <svg className="absolute inset-0" width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="20" r="20" fill="#E8F4FD" fillOpacity="0.2" />
                </svg>
                <FaYoutube className="text-white relative z-10 w-[20px] h-[20px]" />
              </a>
            </div>
          </div>

          {/* Column 2: Links Section */}
          <div className="flex flex-col gap-[20px] md:gap-[30px] min-w-[150px]">
            <h3 className="text-white font-['Outfit'] text-[22px] md:text-[25px] font-[500] leading-normal">Links</h3>
            <ul className="flex flex-col gap-[12px] md:gap-[15px] list-none p-0 m-0">
              {["Home", "about us", "services", "our team", "events", "contact us"].map((item) => (
                <li key={item}>
                  <a
                    href={item === "contact us" ? "/#get-in-touch" : `/${item.replace(/\s/g, '').toLowerCase()}`}
                    className="text-white font-['DM_Sans'] text-[16px] md:text-[18px] font-[400] leading-normal capitalize hover:opacity-80 transition-opacity"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Stay Connected */}
          <div className="flex flex-col gap-[15px] w-full max-w-[388px]">
            <h3 className="text-white font-['Outfit'] text-[25px] md:text-[30px] font-[500] leading-[100%] m-0">
              Stay Connected
            </h3>
            <p className="text-white font-['DM_Sans'] text-[16px] md:text-[18px] font-[400] leading-[1.4] m-0 mb-[10px]">
              We are committed to providing affordable & professional counselling services to the community
            </p>
            <form className="flex flex-col gap-[15px]" onSubmit={(e) => e.preventDefault()}>
              <input
                type="text"
                placeholder="Full name"
                className="w-full max-w-[354px] h-[50px] rounded-[10px] border border-white/50 bg-transparent px-[15px] text-white font-['DM_Sans'] text-[15px] outline-none placeholder:text-white/70 focus:border-white transition-colors box-border"
              />
              <div className="flex gap-[10px] w-full max-w-[354px]">
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full max-w-[294px] h-[50px] rounded-[10px] border border-white/50 bg-transparent px-[15px] text-white font-['DM_Sans'] text-[15px] outline-none placeholder:text-white/70 focus:border-white transition-colors box-border"
                />
                <button
                  type="submit"
                  className="w-[50px] h-[50px] rounded-[10px] bg-white flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#1B4585">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Separator */}
        <div className="w-full h-[1px] bg-[rgba(255,255,255,0.25)] mb-[30px]"></div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center w-full text-white font-['DM_Sans'] text-[14px] md:text-[15px] font-[400] leading-normal gap-4 text-center md:text-left">
          <p>© 2026 WINGS Counselling Centre. All rights reserved.</p>
          <div className="flex items-center gap-[20px] md:gap-[40px]">
            <a href="/privacy-policy" className="hover:opacity-80 transition-opacity">Privacy Policy</a>
            <span className="opacity-100">|</span>
            <a href="/terms-of-service" className="hover:opacity-80 transition-opacity">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}