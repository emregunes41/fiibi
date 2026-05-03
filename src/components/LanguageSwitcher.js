"use client";

import { useLanguage } from "@/components/LanguageContext";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const { locale, changeLanguage } = useLanguage();

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button 
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "transparent", border: "none", color: "inherit",
          cursor: "pointer", opacity: 0.8, fontSize: "0.85rem", fontWeight: 600
        }}
        onClick={() => changeLanguage(locale === "tr" ? "en" : "tr")}
      >
        <Globe size={16} />
        {locale === "tr" ? "EN" : "TR"}
      </button>
    </div>
  );
}
