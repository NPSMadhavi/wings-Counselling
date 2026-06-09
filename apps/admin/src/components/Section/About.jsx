import { motion } from "framer-motion";
import { useLocation } from "wouter";

function ShieldIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 36" fill="none">
      <path
        d="M16 1L2 7V17C2 24.7 8.2 31.9 16 34C23.8 31.9 30 24.7 30 17V7L16 1Z"
        fill="#DE5753"
      />
      <path
        d="M10 18L14 22L22 13"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 6L15 12L9 18"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const features = [
  "Compassion first",
  "Evidence-based",
  "Confidential & safe",
  "Holistic support",
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const item = {
  hidden: { opacity: 0, x: -40 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export function About() {
  const [, navigate] = useLocation();

  return (
    <motion.section
      id="about"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8 }}
      className="w-full bg-[#E8EEF5] pt-[60px] pb-[clamp(20px,3vw,20px)]"
    >
      <div className="w-full navbar-align-outer">
        <div className="navbar-align-inner">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-[clamp(40px,6vw,90px)]">

          {/* ───────── LEFT CONTENT ───────── */}
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="flex-1 text-left"
          >
            {/* Label */}
            <motion.div variants={item} className="mb-3">
              <div className="w-[130px] h-[40px]  flex items-center justify-center rounded-full text-white text-[20px] font-medium bg-[linear-gradient(90deg,#0D4A7A,#42A0BD)] font-['DM_Sans']">
                About us
              </div>
            </motion.div>

            {/* Heading */}
            <motion.h2
              variants={item}
              className="font-['Outfit'] font-medium text-[#0D4A7A]
              text-[35px] max-w-[750px] mb-5"
            >
              A Sanctuary for healing in the heart of singapore
            </motion.h2>

            {/* Paragraph */}
            <motion.p
              variants={item}
              className="font-['DM_Sans'] text-[20px] leading-[28px] sm:leading-[30px] text-black max-w-[750px] mb-8"
            >
              WINGS Counselling Centre was founded with a simple yet powerful
              mission: to provide accessible, compassionate mental health support
              to the Singapore community. Since 2008, we've been a safe haven for
              individuals, couples, and families navigating life's most
              challenging moments.
            </motion.p>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 mb-8 max-w-[600px]">
              {features.map((f) => (
                <motion.div
                  key={f}
                  variants={item}
                  className="flex items-center gap-3"
                >
                  <ShieldIcon size={28} />
                  <span className="font-['DM_Sans'] font-medium text-[18px] sm:text-[20px]">
                    {f}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Button */}
            <motion.button
              variants={item}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/about-us")}
              className="
                inline-flex items-center gap-2
                h-[48px] px-7
                rounded-full
                bg-[#1B4585]
                text-white text-[16px] sm:text-[18px]
                font-medium font-['DM_Sans']
              "
            >
              Read more <ArrowIcon />
            </motion.button>
          </motion.div>

          {/* ───────── RIGHT IMAGES ───────── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative w-full max-w-[520px] aspect-[4/5]"
          >
            <div
              className="absolute top-0 left-0 w-[52%] h-[55%] bg-cover bg-center rounded-[0_90px_90px_90px]"
              style={{ backgroundImage: "url('/assets/about1.jpg')" }}
            />

            <div
              className="absolute top-[25%] left-[55%] w-[30%] h-[25%] bg-cover bg-center rounded-[90px_0_90px_90px]"
              style={{ backgroundImage: "url('/assets/about2.jpg')" }}
            />

            <div
              className="absolute top-[60%] left-0 w-[25%] h-[22%] bg-cover bg-center rounded-[90px_90px_90px_0]"
              style={{ backgroundImage: "url('/assets/about3.jpg')" }}
            />

            <div
              className="absolute top-[60%] left-[28%] w-[55%] h-[28%] bg-cover bg-center rounded-[90px_0_90px_90px]"
              style={{ backgroundImage: "url('/assets/about4.jpg')" }}
            />
          </motion.div>

        </div>
        </div>
      </div>
    </motion.section>
  );
}