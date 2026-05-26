"use client";

import { Instagram, Twitter, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageContext";

export default function Footer({ businessName = "Studio", phone = "", email = "", address = "", instagram = "", footerTagline = "" }) {
  const { t } = useLanguage();
  return (
    <footer style={{ position: "relative", zIndex: 10, background: "#1a1a1a", borderTop: "1px solid rgba(255,255,255,0.1)", padding: "64px 24px 32px", marginTop: 80 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 48 }}>
        
        {/* Brand */}
        <div>
          <div style={{ fontWeight: 900, fontSize: 24, letterSpacing: "-0.04em", color: "#ffffff", marginBottom: 24 }}>{businessName}.</div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>
            {footerTagline || "Profesyonel hizmet anlayışıyla yanınızdayız."}
          </p>
          <div style={{ display: "flex", gap: 16 }}>
            {instagram && (
              <a href={instagram.startsWith("http") ? instagram : `https://instagram.com/${instagram}`} target="_blank" rel="noopener" style={{ padding: 8, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)", textDecoration: "none", transition: "all 0.2s" }}>
                <Instagram size={20} />
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`} style={{ padding: 8, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)", textDecoration: "none", transition: "all 0.2s" }}>
                <Mail size={20} />
              </a>
            )}
          </div>
        </div>

        {/* Links */}
        <div>
          <h4 style={{ color: "#ffffff", fontWeight: 700, marginBottom: 24 }}>{t.footer.quickLinks}</h4>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 16, padding: 0, margin: 0 }}>
            <li><Link href="/" style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, textDecoration: "none", transition: "color 0.2s" }}>{t.nav.home}</Link></li>
            <li><Link href="/#packages" style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, textDecoration: "none", transition: "color 0.2s" }}>{t.nav.packages}</Link></li>
            <li><Link href="/#about" style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, textDecoration: "none", transition: "color 0.2s" }}>{t.footer.about}</Link></li>
            <li><Link href="/#contact" style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, textDecoration: "none", transition: "color 0.2s" }}>{t.nav.contact}</Link></li>
          </ul>
        </div>

        {/* Contact info */}
        <div>
          <h4 style={{ color: "#ffffff", fontWeight: 700, marginBottom: 24 }}>{t.footer.contactInfo}</h4>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 16, padding: 0, margin: 0 }}>
            {address && (
              <li style={{ display: "flex", alignItems: "flex-start", gap: 12, color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
                <MapPin size={18} style={{ color: "#ffffff", flexShrink: 0 }} />
                <span>{address}</span>
              </li>
            )}
            {phone && (
              <li style={{ display: "flex", alignItems: "center", gap: 12, color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
                <Phone size={18} style={{ color: "#ffffff", flexShrink: 0 }} />
                <span>{phone}</span>
              </li>
            )}
            {email && (
              <li style={{ display: "flex", alignItems: "center", gap: 12, color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
                <Mail size={18} style={{ color: "#ffffff", flexShrink: 0 }} />
                <span>{email}</span>
              </li>
            )}
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 style={{ color: "#ffffff", fontWeight: 700, marginBottom: 24 }}>{t.footer.newsletter}</h4>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginBottom: 16 }}>{t.footer.newsletterDesc}</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input 
              type="email" 
              placeholder={t.footer.emailPlaceholder}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "8px 16px", fontSize: 14, color: "#ffffff", width: "100%", outline: "none" }}
            />
            <button style={{ background: "#ffffff", color: "#1a1a1a", fontWeight: 700, padding: "8px 16px", fontSize: 14, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
              {t.footer.join}
            </button>
          </div>
        </div>

      </div>

      
      <div style={{ maxWidth: 1280, margin: "64px auto 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, opacity: 0.5 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.15em", textTransform: "uppercase" }}>Güvenli Ödeme Altyapısı</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, flexWrap: "wrap", opacity: 0.8 }}>
          <img src="/assets/iyzico_footer.svg" alt="iyzico Korumalı Alışveriş" style={{ height: 24 }} />
          <a href="https://www.paytr.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 900, color: "#ffffff", letterSpacing: "-0.5px", opacity: 0.6, textDecoration: "none" }}>PayTR</a>
        </div>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textAlign: "center", maxWidth: 420, lineHeight: 1.6, margin: 0 }}>
          Bu internet sitesindeki ödeme hizmetleri{" "}
          <a href="https://www.paytr.com" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "underline" }}>PAYTR Ödeme ve Elektronik Para Kuruluşu A.Ş.</a>
          {" "}tarafından sağlanmaktadır.
        </p>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: 32, paddingTop: 32, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
                © {new Date().getFullYear()} {businessName}. {t.footer.rights}
      </div>
    </footer>
  );
}
