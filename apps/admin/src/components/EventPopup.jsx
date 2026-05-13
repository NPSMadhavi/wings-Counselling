import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Heart } from "lucide-react";

const SESSION_KEY = "wings_event_popup_v1";

const DONATE_URL =
  "https://ramakrishna.org.sg/Authentication/Login?returnUrl=%2FDonation%2FDonateNow";

export function EventPopup() {
  const [event, setEvent] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;

    fetch("/api/events")
      .then((r) => r.json())
      .then((events) => {
        const pick = events.find((e) => e.photoUrls?.length > 0);
        if (!pick) return;

        setEvent(pick);
        setTimeout(() => setVisible(true), 3000);
      })
      .catch(() => {});
  }, []);

  function dismiss() {
    setVisible(false);
    sessionStorage.setItem(SESSION_KEY, "1");
  }

  function handlePhotoClick() {
    if (event?.registrationUrl) {
      window.open(event.registrationUrl, "_blank");
    }
  }

  return (
    <AnimatePresence>
      {visible && event && (
        <>
          <motion.div
            className="fixed inset-0 z-[200]"
            style={{ background: "rgba(0,0,0,0.55)" }}
            onClick={dismiss}
          />

          <motion.div
            className="fixed z-[201] top-1/2 left-1/2"
            style={{ transform: "translate(-50%, -50%)" }}
          >
            <div className="w-[90vw] max-w-md bg-white rounded-3xl overflow-hidden">

              <button
                onClick={dismiss}
                className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-2"
              >
                <X size={16} />
              </button>

              <img
                src={event.photoUrls?.[0]}
                alt={event.title}
                onClick={event.registrationUrl ? handlePhotoClick : undefined}
                className="w-full max-h-80 object-cover"
              />

              <div className="p-5">
                <h3 className="font-bold text-lg">{event.title}</h3>

                <div className="flex gap-2 mt-4">
                  {event.registrationUrl && (
                    <a
                      href={event.registrationUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={dismiss}
                      className="px-4 py-2 bg-blue-800 text-white rounded-full"
                    >
                      Register
                    </a>
                  )}

                  <button
                    onClick={dismiss}
                    className="px-4 py-2 text-gray-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}