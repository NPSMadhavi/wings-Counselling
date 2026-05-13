import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Calendar, MapPin, ExternalLink, Heart, Clock, Sparkles, Mail, CheckCircle2, Loader2 } from "lucide-react";

interface Event {
  id: number;
  title: string;
  description: string;
  photoUrls: string[];
  eventDate?: string | null;
  location?: string | null;
  registrationUrl?: string | null;
  showDonationButton: boolean;
  isPublished: boolean;
}

const DONATE_URL = "https://ramakrishna.org.sg/Authentication/Login?returnUrl=%2FDonation%2FDonateNow";

// ✅ FIX: typed easing tuple
const easeSmooth: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ✅ FIX: typed variants
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: easeSmooth },
  },
};

function formatDate(dateStr?: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return {
    day: d.toLocaleDateString("en-SG", { day: "numeric" }),
    month: d.toLocaleDateString("en-SG", { month: "short" }),
    year: d.toLocaleDateString("en-SG", { year: "numeric" }),
    full: d.toLocaleDateString("en-SG", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    isPast: d < new Date(),
  };
}

function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "duplicate">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");

    try {
      const r = await fetch("/api/event-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (r.status === 409) {
        setStatus("duplicate");
        return;
      }

      if (!r.ok) throw new Error();

      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="mt-6 w-full max-w-sm mx-auto">
      <AnimatePresence mode="wait">
        {status === "success" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-2 text-center"
          >
            <CheckCircle2 className="w-10 h-10 text-green-500" />
            <p className="font-bold text-gray-800">You're on the list!</p>
            <p className="text-sm text-gray-500">
              We'll let you know as soon as something exciting is coming.
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setEmail(e.target.value);
                  setStatus("idle");
                }}
                placeholder="your@email.com"
                required
                className="w-full pl-9 pr-4 py-2.5 rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ "--tw-ring-color": "#004689" } as React.CSSProperties}
              />
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="shrink-0 inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold text-white transition-opacity disabled:opacity-70"
              style={{ background: "#004689" }}
            >
              {status === "loading" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Notify Me"
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {status === "duplicate" && (
        <p className="text-center text-xs text-amber-600 mt-2">
          You're already subscribed — we'll keep you posted!
        </p>
      )}

      {status === "error" && (
        <p className="text-center text-xs text-red-500 mt-2">
          Something went wrong. Please try again.
        </p>
      )}

      <p className="text-center text-xs text-gray-400 mt-3">
        No spam, ever. Unsubscribe anytime.
      </p>
    </div>
  );
}

export function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((data: Event[]) => setEvents(data))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const isEmpty = loading || events.length === 0;

  return (
    <section id="events" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">

        <motion.div
          initial="hidden"
          whileInView="show"
          variants={fadeUp}
          className="text-center mb-14"
        >
          <h2 className="text-4xl font-extrabold text-gray-900 mb-3">
            Events & Workshops
          </h2>
        </motion.div>

        {isEmpty && <SubscribeForm />}

      </div>
    </section>
  );
}