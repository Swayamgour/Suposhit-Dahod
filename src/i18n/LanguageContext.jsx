import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations, languages } from "./translations.js";

const LanguageContext = createContext(null);

const STORAGE_KEY = "suposhit-dahod-lang";

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    if (typeof window === "undefined") return "en";
    return localStorage.getItem(STORAGE_KEY) || "en";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useMemo(() => {
    const dict = translations[lang] || translations.en;
    return (key) => dict[key] ?? translations.en[key] ?? key;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t, languages }), [lang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
