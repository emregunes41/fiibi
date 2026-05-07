"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Sayfa Ziyaret Takipçisi (Çerez Onayına Bağlı)
 * Yalnızca kullanıcı analitik çerezleri kabul ettiğinde çalışır.
 */
export default function PageTracker() {
  const pathname = usePathname();
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    // İlk yükleme: mevcut onay durumunu kontrol et
    const consent = localStorage.getItem("fiibi_cookie_consent");
    setHasConsent(consent === "accepted");

    // Çerez onay değişikliklerini dinle
    const handleConsentChange = () => {
      const c = localStorage.getItem("fiibi_cookie_consent");
      setHasConsent(c === "accepted");
    };
    window.addEventListener("cookie_consent_changed", handleConsentChange);
    return () => window.removeEventListener("cookie_consent_changed", handleConsentChange);
  }, []);

  useEffect(() => {
    // Onay yoksa takip yapma
    if (!hasConsent) return;

    // Admin ve API isteklerini sayma
    if (pathname.startsWith("/admin") || pathname.startsWith("/api") || pathname.startsWith("/super-admin")) {
      return;
    }

    // sendBeacon kullan — sayfa kapansa bile gönderir, async, blocking değil
    const data = JSON.stringify({ path: pathname });
    
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([data], { type: "application/json" }));
    } else {
      fetch("/api/track", { method: "POST", body: data, keepalive: true }).catch(() => {});
    }
  }, [pathname, hasConsent]);

  return null; // Görsel element yok
}
