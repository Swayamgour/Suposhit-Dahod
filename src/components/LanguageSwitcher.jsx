import React, { useEffect, useRef, useState } from "react";
import { Languages, Check } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function LanguageSwitcher({ align = "right" }) {
  const { lang, setLang, languages, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const current = languages.find((l) => l.code === lang) ?? languages[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        title={t("topbar.language")}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-2.5 text-muted hover:bg-primary/10 hover:text-primary"
      >
        <Languages size={18} />
        <span className="hidden text-xs font-semibold uppercase sm:inline">{lang}</span>
      </button>

      {open && (
        <div
          className={`absolute top-full z-30 mt-2 w-48 overflow-hidden rounded-xl border border-line bg-surface py-1.5 shadow-card animate-scale-in ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <p className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
            {t("topbar.language")}
          </p>
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-sm hover:bg-primary-light/50 ${
                l.code === lang ? "font-semibold text-primary-dark" : "text-ink"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-xs text-muted">{l.label}</span>
                <span>{l.native}</span>
              </span>
              {l.code === lang && <Check size={14} className="text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
