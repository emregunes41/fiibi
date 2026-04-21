"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const C = {
  orange: "#FF5F1F",
  orangeLight: "#FFAA4C",
  orangeDark: "#D94800",
  cream: "#FFF6F2",
  bg: "#F5F5F4",
  black: "#1A1A1A",
  dark: "#2E2E2E",
  muted: "#A3A3A3",
  secondary: "#555555",
  white: "#FFFFFF",
};

const SECTORS = [
  { icon: "📸", name: "Fotoğrafçı" },
  { icon: "🩺", name: "Doktor" },
  { icon: "🦷", name: "Diş Hekimi" },
  { icon: "🧠", name: "Psikolog" },
  { icon: "🥗", name: "Diyetisyen" },
  { icon: "🏋️", name: "Spor Hocası" },
  { icon: "💇", name: "Güzellik" },
  { icon: "🐾", name: "Veteriner" },
  { icon: "📚", name: "Eğitmen" },
  { icon: "⚖️", name: "Avukat" },
  { icon: "💼", name: "Danışman" },
  { icon: "🏢", name: "Diğer" },
];

const FEATURES = [
  { icon: "📅", title: "Online Randevu", desc: "Müşterileriniz 7/24 online randevu alsın. Takvim otomatik yönetilsin." },
  { icon: "💳", title: "Ödeme Takibi", desc: "Nakit, havale, kart — tüm tahsilatlarınızı tek ekranda takip edin." },
  { icon: "📊", title: "Yönetim Paneli", desc: "Rezervasyonlar, müşteriler, hatırlatmalar. Her şey tek panelde." },
  { icon: "🌐", title: "Kendi Web Siteniz", desc: "2 dakikada profesyonel web siteniz hazır. Özel alan adı desteği." },
  { icon: "📱", title: "SMS & E-posta", desc: "Otomatik hatırlatmalar ve onay bildirimleri." },
  { icon: "📋", title: "Sözleşme & Form", desc: "Dijital sözleşme onayı ve özel müşteri formları." },
];

const STEPS = [
  { num: "01", title: "Kayıt Ol", desc: "Sektörünüzü seçin, işletme bilgilerinizi girin. 2 dakika sürer." },
  { num: "02", title: "Hizmetlerini Ekle", desc: "Paketlerinizi, fiyatlarınızı ve çalışma saatlerinizi belirleyin." },
  { num: "03", title: "Randevu Almaya Başla", desc: "Siteniz hazır! Müşterileriniz online randevu alsın." },
];

function useReveal() {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, vis];
}

function S({ children, style, id }) {
  const [ref, vis] = useReveal();
  return (
    <section ref={ref} id={id} style={{ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(24px)", transition: "opacity 0.6s ease, transform 0.6s ease", ...style }}>
      {children}
    </section>
  );
}

/* Logo — marka kılavuzundaki gerçek SVG path'leri */
function Logo({ dark, size = 28 }) {
  const eyeFill = dark ? "#1a1a1a" : "#fff";
  const textFill = dark ? "#fff" : "#1a1a1a";
  return (
    <svg height={size} viewBox="60 62 400 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M 104 90 C 116 74, 140 76, 148 92 C 156 108, 146 126, 128 130 C 110 134, 94 124, 92 108 C 90 94, 92 94, 104 90 Z" fill="#FF5F1F"/>
      <circle cx="108" cy="106" r="10" fill={eyeFill}/>
      <circle cx="130" cy="99" r="7" fill={eyeFill}/>
      <text x="166" y="128" fontFamily="'DM Sans',sans-serif" fontWeight="800" fontSize="46" fill={textFill} letterSpacing="-1.5">fiibi</text>
    </svg>
  );
}

export default function FiibiLanding() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const wrap = { maxWidth: 1100, margin: "0 auto", padding: "0 24px", width: "100%" };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: C.black, background: C.white, minHeight: "100vh" }}>

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, height: 60,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: scrolled ? "rgba(255,255,255,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "none",
        transition: "all 0.25s", padding: "0 24px",
      }}>
        <div style={{ ...wrap, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Logo />
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <a href="#ozellikler" style={{ color: C.secondary, fontSize: 14, fontWeight: 500, textDecoration: "none", display: "none" }} className="nav-link">Özellikler</a>
            <a href="#sektorler" style={{ color: C.secondary, fontSize: 14, fontWeight: 500, textDecoration: "none", display: "none" }} className="nav-link">Sektörler</a>
            <a href="#fiyatlar" style={{ color: C.secondary, fontSize: 14, fontWeight: 500, textDecoration: "none", display: "none" }} className="nav-link">Fiyatlar</a>
            <Link href="/onboarding" style={{
              background: C.orange, color: C.white, padding: "10px 22px",
              fontSize: 13, fontWeight: 700, textDecoration: "none", border: "none",
            }}>
              Ücretsiz Başla
            </Link>
          </div>
        </div>
      </nav>

      <style>{`@media(min-width:768px){.nav-link{display:inline-block !important;}}`}</style>

      {/* HERO */}
      <section style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: C.cream, position: "relative", overflow: "hidden", paddingTop: 60,
      }}>
        <div style={{ position: "absolute", top: -100, right: -100, width: 360, height: 360, background: `radial-gradient(circle, ${C.orangeLight}18, transparent 70%)`, pointerEvents: "none" }} />

        <div style={{ ...wrap, textAlign: "center", position: "relative", zIndex: 1, padding: "80px 24px 100px" }}>
          <div style={{
            display: "inline-block", padding: "5px 14px",
            background: `${C.orange}10`, border: `1px solid ${C.orange}20`,
            fontSize: 12, fontWeight: 600, color: C.orangeDark, marginBottom: 24, letterSpacing: "0.02em",
          }}>
            Her sektöre uygun, hepsi bir arada CRM
          </div>

          <h1 style={{
            fontSize: "clamp(32px, 5.5vw, 64px)", fontWeight: 800, lineHeight: 1.1,
            color: C.black, letterSpacing: "-0.03em", margin: "0 auto 20px", maxWidth: 720,
          }}>
            İşletmeni <span style={{ color: C.orange }}>dijitale</span> taşı,{" "}
            randevularını yönet.
          </h1>

          <p style={{
            fontSize: "clamp(15px, 1.8vw, 18px)", color: C.secondary, lineHeight: 1.65,
            maxWidth: 520, margin: "0 auto 36px", fontWeight: 400,
          }}>
            Online randevu, ödeme takibi, müşteri yönetimi ve kendi web siteniz. 2 dakikada kurulum, kredi kartı gerekmez.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/onboarding" style={{
              background: C.orange, color: C.white, padding: "14px 32px",
              fontSize: 15, fontWeight: 700, textDecoration: "none",
              boxShadow: `0 6px 24px ${C.orange}35`,
            }}>
              Ücretsiz Dene →
            </Link>
            <a href="#ozellikler" style={{
              background: C.white, color: C.black, padding: "14px 32px",
              fontSize: 15, fontWeight: 700, textDecoration: "none",
              border: `1.5px solid ${C.black}18`,
            }}>
              Nasıl Çalışır?
            </a>
          </div>

          <div style={{ marginTop: 40, display: "flex", justifyContent: "center", gap: 28, flexWrap: "wrap" }}>
            {["14 Gün Ücretsiz", "Kredi Kartı Gerekmez", "2 Dakikada Kurulum"].map(t => (
              <span key={t} style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>
                <span style={{ color: C.orange, marginRight: 4 }}>✓</span>{t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <S id="ozellikler" style={{ padding: "80px 24px", background: C.white }}>
        <div style={wrap}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.orange, textTransform: "uppercase", letterSpacing: "0.15em" }}>ÖZELLİKLER</span>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 40px)", fontWeight: 800, color: C.black, letterSpacing: "-0.02em", marginTop: 8 }}>
              İhtiyacın olan her şey, tek yerde.
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                padding: "28px 24px",
                background: C.cream, border: `1px solid rgba(0,0,0,0.04)`,
              }}>
                <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.black, marginBottom: 6 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: C.secondary, lineHeight: 1.7, fontWeight: 400 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </S>

      {/* STEPS */}
      <S style={{ padding: "80px 24px", background: C.bg }}>
        <div style={wrap}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.orange, textTransform: "uppercase", letterSpacing: "0.15em" }}>NASIL ÇALIŞIR?</span>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 40px)", fontWeight: 800, color: C.black, letterSpacing: "-0.02em", marginTop: 8 }}>
              3 adımda hazırsın.
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ textAlign: "center", padding: "32px 24px" }}>
                <div style={{
                  width: 56, height: 56, margin: "0 auto 18px",
                  background: C.orange, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, fontWeight: 800, color: C.white,
                }}>
                  {s.num}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.black, marginBottom: 6 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: C.secondary, lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </S>

      {/* SECTORS */}
      <S id="sektorler" style={{ padding: "80px 24px", background: C.white }}>
        <div style={wrap}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.orange, textTransform: "uppercase", letterSpacing: "0.15em" }}>SEKTÖRLER</span>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 40px)", fontWeight: 800, color: C.black, letterSpacing: "-0.02em", marginTop: 8 }}>
              Hangi sektörde olursan ol.
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
            {SECTORS.map((s, i) => (
              <div key={i} style={{
                padding: "20px 12px", textAlign: "center",
                background: C.cream, border: "1px solid rgba(0,0,0,0.03)",
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.black }}>{s.name}</div>
              </div>
            ))}
          </div>
        </div>
      </S>

      {/* PRICING */}
      <S id="fiyatlar" style={{ padding: "80px 24px", background: C.bg }}>
        <div style={wrap}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.orange, textTransform: "uppercase", letterSpacing: "0.15em" }}>FİYATLAR</span>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 40px)", fontWeight: 800, color: C.black, letterSpacing: "-0.02em", marginTop: 8 }}>
              Basit ve şeffaf fiyatlandırma.
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, maxWidth: 700, margin: "0 auto" }}>
            {/* Free */}
            <div style={{ padding: "36px 28px", background: C.white, border: "1px solid rgba(0,0,0,0.08)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Deneme</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: C.black, marginBottom: 4 }}>₺0<span style={{ fontSize: 14, fontWeight: 500, color: C.muted }}> / 14 gün</span></div>
              <p style={{ fontSize: 13, color: C.secondary, marginBottom: 24 }}>Tüm özellikleri ücretsiz deneyin.</p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 8 }}>
                {["Sınırsız randevu", "Kendi web siten", "Ödeme takibi", "SMS & e-posta"].map(f => (
                  <li key={f} style={{ fontSize: 13, color: C.secondary }}><span style={{ color: C.orange, fontWeight: 700, marginRight: 6 }}>✓</span>{f}</li>
                ))}
              </ul>
              <Link href="/onboarding" style={{
                display: "block", textAlign: "center", padding: "12px",
                fontSize: 13, fontWeight: 700, textDecoration: "none",
                border: `2px solid ${C.black}`, color: C.black,
              }}>Ücretsiz Başla</Link>
            </div>

            {/* Pro */}
            <div style={{ padding: "36px 28px", background: C.black, color: C.white, position: "relative" }}>
              <div style={{
                position: "absolute", top: 14, right: 14, background: C.orange,
                color: C.white, padding: "3px 10px", fontSize: 10, fontWeight: 700,
              }}>POPÜLER</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Pro</div>
              <div style={{ fontSize: 36, fontWeight: 800, marginBottom: 4 }}>₺499<span style={{ fontSize: 14, fontWeight: 500, color: C.muted }}> / ay</span></div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 24 }}>İşletmeniz için tam donanım.</p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 8 }}>
                {["Deneme planındaki her şey", "Özel alan adı", "Öncelikli destek", "Gelişmiş raporlama", "Online ödeme"].map(f => (
                  <li key={f} style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}><span style={{ color: C.orangeLight, fontWeight: 700, marginRight: 6 }}>✓</span>{f}</li>
                ))}
              </ul>
              <Link href="/onboarding" style={{
                display: "block", textAlign: "center", padding: "12px",
                fontSize: 13, fontWeight: 700, textDecoration: "none",
                background: C.orange, color: C.white,
              }}>Hemen Başla →</Link>
            </div>
          </div>
        </div>
      </S>

      {/* CTA */}
      <S style={{ padding: "80px 24px", background: C.orange, textAlign: "center" }}>
        <div style={wrap}>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 42px)", fontWeight: 800, color: C.white, letterSpacing: "-0.02em", marginBottom: 14 }}>
            İşletmeni büyütmeye hazır mısın?
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.8)", marginBottom: 32, maxWidth: 460, margin: "0 auto 32px" }}>
            14 gün ücretsiz dene. Kredi kartı gerekmez.
          </p>
          <Link href="/onboarding" style={{
            display: "inline-block", background: C.white, color: C.orangeDark,
            padding: "16px 40px", fontSize: 16, fontWeight: 800, textDecoration: "none",
          }}>
            Ücretsiz Başla →
          </Link>
        </div>
      </S>

      {/* FOOTER */}
      <footer style={{ padding: "40px 24px 20px", background: C.black }}>
        <div style={{ ...wrap, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
          <div>
            <Logo dark size={24} />
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>Hepsi bir arada CRM platformu.</p>
          </div>
          <a href="mailto:destek@fiibi.co" style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>destek@fiibi.co</a>
        </div>
        <div style={{ ...wrap, borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 24, paddingTop: 16, textAlign: "center" }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.15)" }}>© {new Date().getFullYear()} fiibi. Tüm hakları saklıdır.</span>
        </div>
      </footer>
    </div>
  );
}
