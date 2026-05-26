"use client";

import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

/**
 * Yasal sayfa client bileşeni.
 * Çerez Politikası, Gizlilik Politikası ve Kullanım Şartları sayfaları tarafından kullanılır.
 */
export default function LegalPageClient({ title, content }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg, #fff)", color: "var(--text, #1a1a1a)", padding: "60px 24px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>

        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "rgba(0,0,0,0.55)", textDecoration: "none", marginBottom: 32, fontSize: 14, fontWeight: 500, transition: "color 0.2s" }}>
          <ArrowLeft size={16} /> Ana Sayfaya Dön
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
          <div style={{ width: 48, height: 48, borderRadius: 0, background: "rgba(0,0,0,0.03)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={24} style={{ color: "rgba(0,0,0,0.65)" }} />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>{title}</h1>
        </div>

        <div style={{
          background: "rgba(0,0,0,0.02)",
          border: "1px solid rgba(0,0,0,0.06)",
          borderRadius: 0,
          padding: "clamp(24px, 5vw, 48px)",
          marginTop: 32,
          marginBottom: 40,
        }}>
          <div style={{
            color: "rgba(0,0,0,0.75)",
            fontSize: 14,
            lineHeight: 1.8,
            whiteSpace: "pre-wrap",
            fontFamily: "inherit",
          }}>
            {content}
          </div>
        </div>

        {/* Alt navigasyon */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 16,
          padding: "20px 0", marginBottom: 60,
          borderTop: "1px solid rgba(0,0,0,0.05)",
        }}>
          <Link href="/gizlilik-politikasi" style={{ color: "rgba(0,0,0,0.55)", fontSize: 12, textDecoration: "none" }}>Gizlilik Politikası</Link>
          <Link href="/cerez-politikasi" style={{ color: "rgba(0,0,0,0.55)", fontSize: 12, textDecoration: "none" }}>Çerez Politikası</Link>
          <Link href="/kullanim-sartlari" style={{ color: "rgba(0,0,0,0.55)", fontSize: 12, textDecoration: "none" }}>Kullanım Şartları</Link>
          <Link href="/sozlesme" style={{ color: "rgba(0,0,0,0.55)", fontSize: 12, textDecoration: "none" }}>Yasal Sözleşmeler</Link>
        </div>
      </div>
    </div>
  );
}
