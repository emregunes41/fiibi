"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const C = {
  orange: "#FF5F1F", orangeLight: "#FFAA4C", orangeDark: "#D94800",
  cream: "#FFF6F2", bg: "#F5F5F4", black: "#1A1A1A", dark: "#2E2E2E",
  muted: "#A3A3A3", secondary: "#555555", white: "#FFFFFF",
};

const SECTORS = [
  { icon: "📸", name: "Fotoğrafçı" }, { icon: "🩺", name: "Doktor" },
  { icon: "🦷", name: "Diş Hekimi" }, { icon: "🧠", name: "Psikolog" },
  { icon: "🥗", name: "Diyetisyen" }, { icon: "🏋️", name: "Spor Hocası" },
  { icon: "💇", name: "Güzellik" }, { icon: "🐾", name: "Veteriner" },
  { icon: "📚", name: "Eğitmen" }, { icon: "⚖️", name: "Avukat" },
  { icon: "💼", name: "Danışman" }, { icon: "🏢", name: "Diğer" },
];

const FEATURES = [
  { title: "Online Randevu", desc: "Müşterileriniz 7/24 online randevu alsın. Takvim otomatik yönetilsin.", icon: "📅" },
  { title: "Ödeme Takibi", desc: "Nakit, havale, kart — tüm tahsilatlarınızı tek ekranda takip edin.", icon: "💳" },
  { title: "Yönetim Paneli", desc: "Rezervasyonlar, müşteriler, hatırlatmalar. Her şey tek panelde.", icon: "📊" },
  { title: "Kendi Web Siteniz", desc: "2 dakikada profesyonel web siteniz hazır. Özel alan adı desteği.", icon: "🌐" },
  { title: "SMS & E-posta", desc: "Otomatik hatırlatmalar ve onay bildirimleri. Müşteri kaybı sıfır.", icon: "📱" },
  { title: "Sözleşme & Form", desc: "Dijital sözleşme onayı ve özel müşteri formları.", icon: "📋" },
];

function useReveal() {
  const ref = useRef(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); o.disconnect(); } }, { threshold: 0.1 });
    o.observe(el);
    return () => o.disconnect();
  }, []);
  return [ref, v];
}

function Reveal({ children, style, id, tag }) {
  const [ref, v] = useReveal();
  const Tag = tag || "section";
  return <Tag ref={ref} id={id} style={{ opacity: v ? 1 : 0, transform: v ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.5s ease, transform 0.5s ease", ...style }}>{children}</Tag>;
}

function Logo({ dark, size = 36 }) {
  const eyeFill = dark ? C.dark : C.white;
  const textFill = dark ? C.white : C.black;
  return (
    <svg height={size} viewBox="60 62 400 110" xmlns="http://www.w3.org/2000/svg">
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

  const wrap = { maxWidth: 1200, margin: "0 auto", padding: "0 32px", width: "100%" };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: C.black, background: C.white, minHeight: "100vh" }}>

      {/* ── NAV ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, height: scrolled ? 64 : 80,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: scrolled ? "rgba(255,255,255,0.96)" : "rgba(26,26,26,0.0)",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "none",
        transition: "all 0.3s", padding: "0 32px",
      }}>
        <div style={{ ...wrap, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {scrolled ? <Logo size={40} /> : <Logo dark size={60} />}
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <a href="#ozellikler" className="fiibi-nav-link" style={{ color: scrolled ? C.secondary : "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>Özellikler</a>
            <a href="#sektorler" className="fiibi-nav-link" style={{ color: scrolled ? C.secondary : "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>Sektörler</a>
            <a href="#fiyatlar" className="fiibi-nav-link" style={{ color: scrolled ? C.secondary : "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>Fiyatlar</a>
            <Link href="/onboarding?register=true" style={{
              background: C.orange, color: C.white, padding: "10px 24px",
              fontSize: 14, fontWeight: 700, textDecoration: "none",
            }}>Ücretsiz Başla</Link>
          </div>
        </div>
      </nav>

      <style>{`
        @media(max-width:768px){
          .fiibi-nav-link{display:none !important;}
          .fiibi-grid-3{grid-template-columns:1fr !important;}
          .fiibi-grid-2{grid-template-columns:1fr !important;}
          .fiibi-grid-sectors{grid-template-columns:repeat(3,1fr) !important;}
          .fiibi-stats{flex-direction:column !important;gap:24px !important;}
          .fiibi-hero-form{flex-direction:column !important;}
        }
      `}</style>

      {/* ── HERO — functional signup ── */}
      <section style={{
        minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        background: C.black, position: "relative", overflow: "hidden", paddingTop: 80,
      }}>
        <div style={{ position: "absolute", top: "10%", left: "15%", width: 500, height: 500, background: `radial-gradient(circle, ${C.orange}12, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "5%", right: "10%", width: 400, height: 400, background: `radial-gradient(circle, ${C.orangeLight}08, transparent 70%)`, pointerEvents: "none" }} />

        <div style={{ ...wrap, textAlign: "center", position: "relative", zIndex: 1, padding: "80px 32px 48px" }}>

          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", marginBottom: 32, lineHeight: 1.6, maxWidth: 420, margin: "0 auto 32px" }}>
            Online randevu, ödeme takibi, müşteri yönetimi ve kendi web siteniz — tek platformda.
          </p>

          {/* Functional form */}
          <form
            onSubmit={(e) => { e.preventDefault(); window.location.href = "/onboarding?register=true"; }}
            className="fiibi-hero-form"
            style={{ display: "flex", gap: 0, maxWidth: 520, margin: "0 auto", alignItems: "stretch" }}
          >
            <input
              type="text"
              placeholder="İşletme adınız"
              style={{
                flex: 1, padding: "16px 20px", fontSize: 15, fontWeight: 500,
                border: "none", outline: "none", background: "rgba(255,255,255,0.08)",
                color: C.white, fontFamily: "'DM Sans', sans-serif",
                borderRight: "1px solid rgba(255,255,255,0.06)",
              }}
            />
            <button
              type="submit"
              style={{
                background: C.orange, color: C.white, padding: "16px 32px",
                fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
              }}
            >
              Ücretsiz Başla →
            </button>
          </form>

          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 14 }}>
            Kredi kartı gerekmez · 2 dakikada kurulum · İstediğin zaman iptal
          </p>
        </div>

        {/* Stats bar */}
        <div className="fiibi-stats" style={{
          display: "flex", justifyContent: "center", gap: 64,
          padding: "40px 32px", borderTop: "1px solid rgba(255,255,255,0.06)", width: "100%",
          position: "relative", zIndex: 1,
        }}>
          {[
            { num: "12+", label: "Desteklenen Sektör" },
            { num: "7/24", label: "Online Randevu" },
            { num: "2 dk", label: "Kurulum Süresi" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: C.white, letterSpacing: "-0.02em" }}>{s.num}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 500, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <Reveal id="ozellikler" style={{ padding: "100px 32px", background: C.white }}>
        <div style={wrap}>
          <div style={{ maxWidth: 560, marginBottom: 64 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.orange, textTransform: "uppercase", letterSpacing: "0.12em" }}>ÖZELLİKLER</span>
            <h2 style={{ fontSize: 44, fontWeight: 800, color: C.black, letterSpacing: "-0.03em", marginTop: 12, lineHeight: 1.1 }}>
              İhtiyacın olan her şey, tek yerde.
            </h2>
            <p style={{ fontSize: 16, color: C.secondary, marginTop: 16, lineHeight: 1.7 }}>
              Randevu yönetiminden ödeme takibine, müşteri iletişiminden web sitenize — hepsi dahil.
            </p>
          </div>
          <div className="fiibi-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                padding: "36px 32px", background: C.cream,
                borderLeft: i % 3 !== 0 ? "none" : "none",
              }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.black, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: C.secondary, lineHeight: 1.7, fontWeight: 400 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ── HOW IT WORKS — Shopify step style ── */}
      <Reveal style={{ padding: "100px 32px", background: C.black, color: C.white }}>
        <div style={wrap}>
          <div style={{ textAlign: "center", marginBottom: 72 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.orange, textTransform: "uppercase", letterSpacing: "0.12em" }}>NASIL ÇALIŞIR?</span>
            <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.03em", marginTop: 12, lineHeight: 1.1 }}>
              3 adımda başla.
            </h2>
          </div>
          <div className="fiibi-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0 }}>
            {[
              { n: "01", t: "Kayıt Ol", d: "Sektörünüzü seçin, işletme bilgilerinizi girin. 2 dakika sürer." },
              { n: "02", t: "Hizmetlerini Ekle", d: "Paketlerinizi, fiyatlarınızı ve çalışma saatlerinizi belirleyin." },
              { n: "03", t: "Yayına Al", d: "Web siteniz hazır! Müşterileriniz online randevu almaya başlasın." },
            ].map((s, i) => (
              <div key={i} style={{ padding: "40px 32px", borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                <div style={{ fontSize: 48, fontWeight: 800, color: C.orange, marginBottom: 20, letterSpacing: "-0.04em" }}>{s.n}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{s.t}</h3>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ── SECTORS ── */}
      <Reveal id="sektorler" style={{ padding: "100px 32px", background: C.white }}>
        <div style={wrap}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48, flexWrap: "wrap", gap: 20 }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.orange, textTransform: "uppercase", letterSpacing: "0.12em" }}>SEKTÖRLER</span>
              <h2 style={{ fontSize: 44, fontWeight: 800, color: C.black, letterSpacing: "-0.03em", marginTop: 12, lineHeight: 1.1 }}>
                Hangi sektörde olursan ol.
              </h2>
            </div>
            <p style={{ fontSize: 15, color: C.secondary, maxWidth: 360, lineHeight: 1.6 }}>
              fiibi, randevu ile çalışan her meslek dalına uygun altyapı sunar. Sektörüne özel terminoloji otomatik uygulanır.
            </p>
          </div>
          <div className="fiibi-grid-sectors" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 2 }}>
            {SECTORS.map((s, i) => (
              <div key={i} style={{
                padding: "28px 16px", textAlign: "center", background: C.cream,
              }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>{s.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.black }}>{s.name}</div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ── PRICING ── */}
      <Reveal id="fiyatlar" style={{ padding: "100px 32px", background: C.bg }}>
        <div style={wrap}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.orange, textTransform: "uppercase", letterSpacing: "0.12em" }}>FİYATLAR</span>
            <h2 style={{ fontSize: 44, fontWeight: 800, color: C.black, letterSpacing: "-0.03em", marginTop: 12, lineHeight: 1.1 }}>
              Basit ve şeffaf.
            </h2>
          </div>
          <div className="fiibi-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, maxWidth: 760, margin: "0 auto" }}>
            {/* Free */}
            <div style={{ padding: "44px 36px", background: C.white }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Deneme</div>
              <div style={{ fontSize: 48, fontWeight: 800, color: C.black, letterSpacing: "-0.03em" }}>₺0</div>
              <div style={{ fontSize: 14, color: C.muted, marginBottom: 28 }}>14 gün · Tüm özellikler</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
                {["Sınırsız randevu", "Kendi web siten", "Ödeme takibi", "SMS & e-posta"].map(f => (
                  <span key={f} style={{ fontSize: 14, color: C.secondary }}><span style={{ color: C.orange, marginRight: 8 }}>✓</span>{f}</span>
                ))}
              </div>
              <Link href="/onboarding?register=true" style={{ display: "block", textAlign: "center", padding: "14px", fontSize: 14, fontWeight: 700, textDecoration: "none", border: `2px solid ${C.black}`, color: C.black }}>Ücretsiz Başla</Link>
            </div>
            {/* Pro */}
            <div style={{ padding: "44px 36px", background: C.black, color: C.white, position: "relative" }}>
              <div style={{ position: "absolute", top: 16, right: 16, background: C.orange, color: C.white, padding: "4px 12px", fontSize: 10, fontWeight: 700 }}>POPÜLER</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Pro</div>
              <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-0.03em" }}>₺499</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 28 }}>aylık · Her şey dahil</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
                {["Deneme planındaki her şey", "Özel alan adı", "Öncelikli destek", "Gelişmiş raporlama", "Online ödeme"].map(f => (
                  <span key={f} style={{ fontSize: 14, color: "rgba(255,255,255,0.55)" }}><span style={{ color: C.orangeLight, marginRight: 8 }}>✓</span>{f}</span>
                ))}
              </div>
              <Link href="/onboarding?register=true" style={{ display: "block", textAlign: "center", padding: "14px", fontSize: 14, fontWeight: 700, textDecoration: "none", background: C.orange, color: C.white }}>Hemen Başla →</Link>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ── CTA ── */}
      <Reveal style={{ padding: "120px 32px", background: C.orange, textAlign: "center" }}>
        <div style={wrap}>
          <h2 style={{ fontSize: 52, fontWeight: 800, color: C.white, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 20 }}>
            İşletmeni büyütmeye<br/>hazır mısın?
          </h2>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.8)", marginBottom: 36, maxWidth: 480, margin: "0 auto 36px" }}>
            14 gün ücretsiz dene. Kredi kartı gerekmez. İstediğin zaman iptal et.
          </p>
          <Link href="/onboarding?register=true" style={{
            display: "inline-block", background: C.white, color: C.orangeDark,
            padding: "18px 48px", fontSize: 17, fontWeight: 800, textDecoration: "none",
          }}>
            Ücretsiz Başla →
          </Link>
        </div>
      </Reveal>

      {/* ── FOOTER ── */}
      <footer style={{ padding: "56px 32px 24px", background: C.black }}>
        <div style={{ ...wrap, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 32 }}>
          <div>
            <Logo dark size={40} />
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginTop: 10, maxWidth: 280, lineHeight: 1.6 }}>
              Randevu ile çalışan her sektör için hepsi bir arada CRM platformu.
            </p>
          </div>
          <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 14 }}>Platform</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <a href="#ozellikler" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Özellikler</a>
                <a href="#fiyatlar" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Fiyatlar</a>
                <a href="#sektorler" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Sektörler</a>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 14 }}>İletişim</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <a href="mailto:destek@fiibi.co" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>destek@fiibi.co</a>
              </div>
            </div>
          </div>
        </div>
        <div style={{ ...wrap, borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 40, paddingTop: 20, textAlign: "center" }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.15)" }}>© {new Date().getFullYear()} fiibi. Tüm hakları saklıdır.</span>
        </div>
      </footer>
    </div>
  );
}
