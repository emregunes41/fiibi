"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { getDictionary } from "@/lib/i18n";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState("tr");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("fiibi_lang");
    if (saved && (saved === "tr" || saved === "en")) {
      setLocale(saved);
    } else {
      const browserLang = navigator.language.split("-")[0];
      if (browserLang === "en") setLocale("en");
    }
    setMounted(true);
  }, []);

  const changeLanguage = (newLocale) => {
    setLocale(newLocale);
    localStorage.setItem("fiibi_lang", newLocale);
  };

  const t = getDictionary(locale);

  if (!mounted) return <div style={{ opacity: 0 }}>{children}</div>; // prevent hydration mismatch

  return (
    <LanguageContext.Provider value={{ locale, t, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    return { locale: "tr", t: getDictionary("tr"), changeLanguage: () => {} };
  }
  return context;
}
