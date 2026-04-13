"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
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
  }, [pathname]);

  return null; // Görsel element yok
}
