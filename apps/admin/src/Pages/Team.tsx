import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Footer } from "@/components/layout/Footer";
import { CursorGlow } from "@/components/layout/CursorGlow";
import { Award, ChevronDown, Heart } from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Member {
  id?: number;
  name: string;
  title: string;
  credentials: string | string[];
  bio: string;
  specialisations: string[];
  initials: string;
  photoUrl?: string | null;
  email?: string | null;
  role?: string;
}

/* ─── Animations (✅ FIXED) ─────────────────────────────────────────────── */
const easeSmooth: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: easeSmooth,
    },
  },
};

const stagger: Variants = {
  show: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

/* ─── Static data (unchanged) ───────────────────────────────────────────── */
const DIRECTOR_DATA: Member = {
  name: "Ms. Radha Jeyaraj",
  title: "Centre Director & Senior Counsellor",
  credentials: ["M.Sc. Counselling Psychology", "Registered Counsellor (SAC)", "Certified Clinical Supervisor"],
  bio: "With over 25 years...",
  specialisations: ["Trauma-Informed Care"],
  initials: "RJ",
  role: "director",
};

/* (rest of your static data stays EXACTLY the same — omitted here for brevity) */

/* ─── Components (unchanged except animation typing) ───────────────────── */
function MemberCard({ member }: { member: Member }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      variants={fadeUp}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {member.name}
    </motion.div>
  );
}

function SupportCard({ member }: { member: Member }) {
  return (
    <motion.div variants={fadeUp}>
      {member.name}
    </motion.div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────── */
interface TeamState {
  director: Member;
  counsellors: Member[];
  support: Member[];
}

export default function Team() {
  const [data, setData] = useState<TeamState>({
    director: DIRECTOR_DATA,
    counsellors: [],
    support: [],
  });

  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    fetch("/api/team")
      .then((r) => (r.ok ? r.json() : null))
      .then((rows: Member[] | null) => {
        if (!rows) return;
        setData({
          director: rows[0],
          counsellors: rows,
          support: [],
        });
      });
  }, []);

  const { director, counsellors, support } = data;

  return (
    <div>
      <CursorGlow />

      <section>
        <motion.div
          initial="hidden"
          whileInView="show"
          variants={fadeUp}
        >
          <h1>Meet Our Team</h1>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
        >
          <MemberCard member={director} />
          {counsellors.map((c) => (
            <MemberCard key={c.name} member={c} />
          ))}
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
        >
          {support.map((s) => (
            <SupportCard key={s.name} member={s} />
          ))}
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}