"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

/**
 * Çerez Onay Banneri (Cookie Consent Banner)
 * KVKK ve ePrivacy uyumlu çerez bilgilendirme ve onay bileşeni.
 * Kullanıcı onay verene kadar analitik/takip çerezleri çalışmaz.
 * 
 * Renk değişkenleri layout.js tarafından html elemanına set edilir:
 * --bg, --bg-card, --text, --text-muted, --border, --btn-bg, --btn-text
 */
export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const consent = localStorage.getItem("fiibi_cookie_consent");
    if (!consent) {
      // İlk ziyarette 1.5 saniye sonra göster
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("fiibi_cookie_consent", "accepted");
    setVisible(false);
    // Dispatch event so PageTracker can start
    window.dispatchEvent(new Event("cookie_consent_changed"));
  };

  const handleReject = () => {
    localStorage.setItem("fiibi_cookie_consent", "rejected");
    setVisible(false);
    window.dispatchEvent(new Event("cookie_consent_changed"));
  };

  if (!mounted || !visible) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 99999,
      padding: "0 16px 16px",
      pointerEvents: "none",
      animation: "cookieSlideUp 0.5s ease-out",
    }}>
      <div style={{
        maxWidth: 520,
        margin: "0 auto",
        background: "var(--bg-card, rgba(15,15,15,0.97))",
        backdropFilter: "blur(20px)",
        border: "1px solid var(--border, rgba(255,255,255,0.1))",
        borderRadius: 12,
        padding: "20px 24px",
        pointerEvents: "auto",
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: "var(--border, rgba(255,255,255,0.06))",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, marginTop: 2,
          }}>
            <Cookie size={18} style={{ color: "var(--text-muted, rgba(255,255,255,0.6))" }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{
              margin: "0 0 6px",
              fontSize: 14,
              fontWeight: 700,
              color: "var(--text, #FEFEFE)",
            }}>
              Çerez Kullanımı
            </p>
            <p style={{
              margin: "0 0 16px",
              fontSize: 12,
              lineHeight: 1.6,
              color: "var(--text-muted, rgba(255,255,255,0.5))",
            }}>
              Bu site, oturum yönetimi için zorunlu çerezler ve site kullanım
              istatistikleri için analitik çerezler kullanmaktadır.{" "}
              <Link
                href="/cerez-politikasi"
                style={{ color: "var(--accent, rgba(255,255,255,0.7))", textDecoration: "underline" }}
              >
                Çerez Politikası
              </Link>
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleAccept}
                style={{
                  background: "#fff",
                  color: "#000",
                  border: "none",
                  padding: "8px 20px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "opacity 0.2s",
                }}
              >
                Kabul Et
              </button>
              <button
                onClick={handleReject}
                style={{
                  background: "transparent",
                  color: "var(--text-muted, rgba(255,255,255,0.6))",
                  border: "1px solid var(--border, rgba(255,255,255,0.1))",
                  padding: "8px 20px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Reddet
              </button>
            </div>
          </div>
          <button
            onClick={handleReject}
            style={{
              background: "none", border: "none", color: "var(--text-muted, rgba(255,255,255,0.3))",
              cursor: "pointer", padding: 4, flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes cookieSlideUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}

/**
 * Çerez onayı kontrol helper'ı.
 * PageTracker ve diğer analitik bileşenler tarafından kullanılır.
 */
export function hasCookieConsent() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("fiibi_cookie_consent") === "accepted";
}
