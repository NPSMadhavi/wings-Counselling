import { useEffect, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { api } from "../lib/api";

/**
 * Shared language dropdown for Partners / Testimonials / Services-style admin pages.
 */
export function useAdminLanguages() {
  const [languages, setLanguages] = useState([]);
  const [selectedLanguageId, setSelectedLanguageId] = useState(null);
  const [openLangMenu, setOpenLangMenu] = useState(null);
  const [isSwitchingLanguage, setIsSwitchingLanguage] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const langs = await api.getLanguages();
        const list = Array.isArray(langs) ? langs : [];
        setLanguages(list);
        const en = list.find((l) => String(l.code).toLowerCase() === "en");
        setSelectedLanguageId(en?.id || list[0]?.id || null);
      } catch {
        setLanguages([
          { id: 0, code: "en", name: "English" },
          { id: 0, code: "zh", name: "中文" },
          { id: 0, code: "ms", name: "Bahasa Melayu" },
          { id: 0, code: "hi", name: "हिंदी" },
          { id: 0, code: "ta", name: "தமிழ்" },
        ]);
      }
    })();
  }, []);

  const selectedLanguage =
    languages.find((l) => l.id === selectedLanguageId) || null;
  const selectedLangCode = String(selectedLanguage?.code || "en").toLowerCase();

  return {
    languages,
    selectedLanguageId,
    setSelectedLanguageId,
    selectedLanguage,
    selectedLangCode,
    openLangMenu,
    setOpenLangMenu,
    isSwitchingLanguage,
    setIsSwitchingLanguage,
  };
}

export function AdminLanguageDropdown({
  languages,
  selectedLanguageId,
  selectedLanguage,
  openLangMenu,
  setOpenLangMenu,
  menuId = "header",
  light = false,
  isSwitchingLanguage = false,
  onSelect,
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() =>
          setOpenLangMenu((v) => (v === menuId ? null : menuId))
        }
        disabled={isSwitchingLanguage}
        className={
          light
            ? "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-white/15 text-white hover:bg-white/25 disabled:opacity-60"
            : "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border border-[#0D4A7A]/25 text-[#0D4A7A] bg-white hover:bg-[#eef2ff] disabled:opacity-60 shadow-sm"
        }
      >
        {isSwitchingLanguage
          ? "Loading..."
          : selectedLanguage?.name || "Language"}{" "}
        <ChevronDown size={14} />
      </button>
      {openLangMenu === menuId && (
        <div className="absolute top-[48px] right-0 min-w-[200px] bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.18)] border border-black/5 overflow-hidden z-[60] py-2">
          {(languages.length
            ? languages
            : [{ id: 0, code: "en", name: "English" }]
          ).map((lang) => {
            const selected = lang.id === selectedLanguageId;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  if (!lang.id) return;
                  void onSelect?.(lang.id);
                }}
                className={`w-full flex items-center justify-between gap-4 px-5 py-3 text-left transition-all ${
                  selected
                    ? "bg-[#E8F1FB] text-[#0A66C2]"
                    : "text-[#222] hover:bg-[#F7F7F5]"
                }`}
              >
                <span className="text-[15px] font-medium">{lang.name}</span>
                {selected ? <Check size={18} className="text-[#0A66C2]" /> : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
