"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

/* ─── BRAND TOKENS ─── */
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

/* ─── SECTORS ─── */
const SECTORS = [
  { icon: "📸", name: "Fotoğrafçı", desc: "Düğün, dış çekim, etkinlik" },
  { icon: "🩺", name: "Doktor", desc: "Klinik, muayenehane" },
  { icon: "🦷", name: "Diş Hekimi", desc: "Ağız ve diş sağlığı" },
  { icon: "🧠", name: "Psikolog", desc: "Bireysel & çift terapisi" },
  { icon: "🥗", name: "Diyetisyen", desc: "Beslenme danışmanlığı" },
  { icon: "🏋️", name: "Spor Hocası", desc: "PT, fitness, yoga" },
  { icon: "💇", name: "Güzellik", desc: "Kuaför, spa, cilt bakım" },
  { icon: "🐾", name: "Veteriner", desc: "Veteriner kliniği" },
  { icon: "📚", name: "Eğitmen", desc: "Özel ders, kurs" },
  { icon: "⚖️", name: "Avukat", desc: "Hukuk bürosu" },
  { icon: "💼", name: "Danışman", desc: "Koçluk, danışmanlık" },
  { icon: "🏢", name: "Diğer", desc: "Randevulu her sektör" },
];

/* ─── FEATURES ─── */
const FEATURES = [
  { icon: "📅", title: "Online Randevu", desc: "Müşterileriniz 7/24 online randevu alsın. Takvim otomatik yönetilsin." },
  { icon: "💳", title: "Ödeme Takibi", desc: "Nakit, havale, kart. Tüm tahsilatlarınızı tek ekranda takip edin." },
  { icon: "📊", title: "Yönetim Paneli", desc: "Rezervasyonlar, müşteriler, hatırlatmalar. Her şey tek panelde." },
  { icon: "🌐", title: "Kendi Web Siteniz", desc: "2 dakikada profesyonel web siteniz hazır. Özel alan adı desteği." },
  { icon: "📱", title: "SMS & E-posta", desc: "Otomatik hatırlatmalar, onay bildirimleri. Müşteri kaybı sıfır." },
  { icon: "📋", title: "Sözleşme & Form", desc: "Dijital sözleşme onayı ve özel müşteri formları." },
];

/* ─── STEPS ─── */
const STEPS = [
  { num: "01", title: "Kayıt Ol", desc: "Sektörünüzü seçin, işletme bilgilerinizi girin. 2 dakika sürer." },
  { num: "02", title: "Hizmetlerini Ekle", desc: "Paketlerinizi, fiyatlarınızı ve çalışma saatlerinizi belirleyin." },
  { num: "03", title: "Randevu Almaya Başla", desc: "Web siteniz hazır! Müşterileriniz online randevu alsın." },
];

/* ─── ANIMATED SECTION HOOK ─── */
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function Section({ children, style, id }) {
  const [ref, visible] = useReveal();
  return (
    <section ref={ref} id={id} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(32px)", transition: "opacity 0.7s ease, transform 0.7s ease", ...style }}>
      {children}
    </section>
  );
}

/* ─── LOGO SVG ─── */
function FiibiLogo({ size = 32, color = C.orange }) {
  return (
    <svg width={size * 2.8} height={size} viewBox="0 0 140 50" fill="none">
      <circle cx="18" cy="20" r="8" fill={color} />
      <circle cx="36" cy="20" r="8" fill={color} />
      <circle cx="18" cy="20" r="3" fill={C.white} />
      <circle cx="36" cy="20" r="3" fill={C.white} />
      <path d="M10 28 Q27 42 44 28" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
      <text x="52" y="34" fontFamily="'DM Sans', sans-serif" fontWeight="800" fontSize="30" fill={color}>fiibi</text>
    </svg>
  );
}

/* ─── MAIN COMPONENT ─── */
export default function FiibiLanding() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const wrap = { maxWidth: 1140, margin: "0 auto", padding: "0 24px", width: "100%" };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: C.black, background: C.white, minHeight: "100vh", overflowX: "hidden" }}>
      {/* Google Font */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap" />

      {/* ─── NAVBAR ─── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 24px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: scrolled ? "rgba(255,255,255,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? `1px solid rgba(0,0,0,0.06)` : "none",
        transition: "all 0.3s",
      }}>
        <div style={{ ...wrap, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <FiibiLogo size={28} />
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <a href="#features" style={{ color: C.secondary, fontSize: 14, fontWeight: 500, textDecoration: "none" }}>Özellikler</a>
            <a href="#sectors" style={{ color: C.secondary, fontSize: 14, fontWeight: 500, textDecoration: "none" }}>Sektörler</a>
            <a href="#pricing" style={{ color: C.secondary, fontSize: 14, fontWeight: 500, textDecoration: "none" }}>Fiyatlar</a>
            <Link href="/onboarding" style={{
              background: C.orange, color: C.white, padding: "10px 24px",
              borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: "none",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}>
              Ücretsiz Başla
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: `linear-gradient(160deg, ${C.white} 0%, ${C.cream} 50%, ${C.white} 100%)`,
        position: "relative", overflow: "hidden", paddingTop: 64,
      }}>
        {/* Decorative blobs */}
        <div style={{ position: "absolute", top: -120, right: -120, width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${C.orangeLight}22, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -80, left: -80, width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${C.orange}15, transparent 70%)`, pointerEvents: "none" }} />

        <div style={{ ...wrap, textAlign: "center", position: "relative", zIndex: 1, padding: "80px 24px" }}>
          <div style={{
            display: "inline-block", padding: "6px 16px", borderRadius: 50,
            background: `${C.orange}12`, border: `1px solid ${C.orange}25`,
            fontSize: 13, fontWeight: 600, color: C.orangeDark, marginBottom: 24,
          }}>
            🚀 Her sektöre uygun, hepsi bir arada CRM
          </div>

          <h1 style={{
            fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 800, lineHeight: 1.08,
            color: C.black, letterSpacing: "-0.03em", marginBottom: 20, maxWidth: 800, margin: "0 auto 20px",
          }}>
            İşletmeni <span style={{ color: C.orange }}>dijitale</span> taşı,
            <br />randevularını yönet.
          </h1>

          <p style={{
            fontSize: "clamp(16px, 2vw, 20px)", color: C.secondary, lineHeight: 1.6,
            maxWidth: 560, margin: "0 auto 40px", fontWeight: 400,
          }}>
            Online randevu, ödeme takibi, müşteri yönetimi ve kendi web siteniz. 2 dakikada kurulum, kredi kartı gerekmez.
          </p>

          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/onboarding" style={{
              background: C.orange, color: C.white, padding: "16px 36px",
              borderRadius: 10, fontSize: 16, fontWeight: 700, textDecoration: "none",
              boxShadow: `0 8px 30px ${C.orange}40`,
              transition: "transform 0.2s, box-shadow 0.2s",
            }}>
              Ücretsiz Dene →
            </Link>
            <a href="#features" style={{
              background: C.white, color: C.black, padding: "16px 36px",
              borderRadius: 10, fontSize: 16, fontWeight: 700, textDecoration: "none",
              border: `2px solid ${C.black}15`,
              transition: "all 0.2s",
            }}>
              Nasıl Çalışır?
            </a>
          </div>

          {/* Trust badges */}
          <div style={{ marginTop: 48, display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
            {["14 Gün Ücretsiz", "Kredi Kartı Gerekmez", "2 Dakikada Kurulum"].map(t => (
              <span key={t} style={{ fontSize: 13, color: C.muted, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: C.orange }}>✓</span> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <Section id="features" style={{ padding: "100px 24px", background: C.white }}>
        <div style={wrap}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.orange, textTransform: "uppercase", letterSpacing: "0.15em" }}>ÖZELLİKLER</span>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: C.black, letterSpacing: "-0.02em", marginTop: 8 }}>
              İşletmeni yönetmek için<br />ihtiyacın olan her şey.
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                padding: "32px 28px", borderRadius: 14,
                background: C.cream, border: `1px solid ${C.orange}10`,
                transition: "transform 0.2s, box-shadow 0.2s",
              }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.black, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: C.secondary, lineHeight: 1.7, fontWeight: 400 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ─── HOW IT WORKS ─── */}
      <Section style={{ padding: "100px 24px", background: C.bg }}>
        <div style={wrap}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.orange, textTransform: "uppercase", letterSpacing: "0.15em" }}>NASIL ÇALIŞIR?</span>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: C.black, letterSpacing: "-0.02em", marginTop: 8 }}>
              3 adımda hazırsın.
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ textAlign: "center", padding: "40px 28px" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 16, margin: "0 auto 20px",
                  background: `linear-gradient(135deg, ${C.orange}, ${C.orangeDark})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, fontWeight: 800, color: C.white,
                  boxShadow: `0 8px 24px ${C.orange}30`,
                }}>
                  {s.num}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: C.black, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: C.secondary, lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ─── SECTORS ─── */}
      <Section id="sectors" style={{ padding: "100px 24px", background: C.white }}>
        <div style={wrap}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.orange, textTransform: "uppercase", letterSpacing: "0.15em" }}>SEKTÖRLER</span>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: C.black, letterSpacing: "-0.02em", marginTop: 8 }}>
              Hangi sektörde olursan ol.
            </h2>
            <p style={{ fontSize: 16, color: C.muted, marginTop: 12, maxWidth: 500, margin: "12px auto 0" }}>
              fiibi, randevu ile çalışan her meslek dalına uygun altyapı sunar.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
            {SECTORS.map((s, i) => (
              <div key={i} style={{
                padding: "24px 16px", borderRadius: 12, textAlign: "center",
                background: C.cream, border: `1px solid ${C.orange}08`,
                transition: "transform 0.2s, border-color 0.2s",
                cursor: "default",
              }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>{s.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.black, marginBottom: 4 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ─── PRICING ─── */}
      <Section id="pricing" style={{ padding: "100px 24px", background: C.bg }}>
        <div style={wrap}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.orange, textTransform: "uppercase", letterSpacing: "0.15em" }}>FİYATLAR</span>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: C.black, letterSpacing: "-0.02em", marginTop: 8 }}>
              Basit ve şeffaf fiyatlandırma.
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, maxWidth: 800, margin: "0 auto" }}>
            {/* Free */}
            <div style={{
              padding: "40px 32px", borderRadius: 16,
              background: C.white, border: `1px solid rgba(0,0,0,0.08)`,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Deneme</div>
              <div style={{ fontSize: 40, fontWeight: 800, color: C.black, marginBottom: 4 }}>₺0<span style={{ fontSize: 16, fontWeight: 500, color: C.muted }}> / 14 gün</span></div>
              <p style={{ fontSize: 14, color: C.secondary, marginBottom: 28, lineHeight: 1.6 }}>Tüm özellikleri ücretsiz deneyin.</p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: 10 }}>
                {["Sınırsız randevu", "Kendi web siten", "Ödeme takibi", "SMS & e-posta bildirimi"].map(f => (
                  <li key={f} style={{ fontSize: 14, color: C.secondary, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: C.orange, fontWeight: 700 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/onboarding" style={{
                display: "block", textAlign: "center", padding: "14px",
                borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: "none",
                border: `2px solid ${C.black}`, color: C.black,
              }}>
                Ücretsiz Başla
              </Link>
            </div>

            {/* Pro */}
            <div style={{
              padding: "40px 32px", borderRadius: 16,
              background: C.black, color: C.white,
              position: "relative", overflow: "hidden",
              boxShadow: `0 16px 48px rgba(0,0,0,0.15)`,
            }}>
              <div style={{
                position: "absolute", top: 16, right: 16, background: C.orange,
                color: C.white, padding: "4px 12px", borderRadius: 50,
                fontSize: 11, fontWeight: 700,
              }}>
                POPÜLER
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Pro</div>
              <div style={{ fontSize: 40, fontWeight: 800, marginBottom: 4 }}>₺499<span style={{ fontSize: 16, fontWeight: 500, color: C.muted }}> / ay</span></div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 28, lineHeight: 1.6 }}>İşletmeniz için tam donanım.</p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: 10 }}>
                {["Deneme planındaki her şey", "Özel alan adı", "Öncelikli destek", "Gelişmiş raporlama", "Online ödeme entegrasyonu"].map(f => (
                  <li key={f} style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: C.orangeLight, fontWeight: 700 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/onboarding" style={{
                display: "block", textAlign: "center", padding: "14px",
                borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: "none",
                background: C.orange, color: C.white,
                boxShadow: `0 4px 16px ${C.orange}50`,
              }}>
                Hemen Başla →
              </Link>
            </div>
          </div>
        </div>
      </Section>

      {/* ─── CTA ─── */}
      <Section style={{
        padding: "100px 24px",
        background: `linear-gradient(135deg, ${C.orange}, ${C.orangeDark})`,
        textAlign: "center",
      }}>
        <div style={wrap}>
          <h2 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 800, color: C.white, letterSpacing: "-0.02em", marginBottom: 16 }}>
            İşletmeni büyütmeye hazır mısın?
          </h2>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.8)", marginBottom: 40, maxWidth: 500, margin: "0 auto 40px" }}>
            14 gün ücretsiz dene. Kredi kartı gerekmez. İstediğin zaman iptal et.
          </p>
          <Link href="/onboarding" style={{
            display: "inline-block", background: C.white, color: C.orangeDark,
            padding: "18px 48px", borderRadius: 12, fontSize: 18, fontWeight: 800,
            textDecoration: "none", boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          }}>
            Ücretsiz Başla →
          </Link>
        </div>
      </Section>

      {/* ─── FOOTER ─── */}
      <footer style={{ padding: "48px 24px 24px", background: C.black }}>
        <div style={{ ...wrap, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24 }}>
          <div>
            <FiibiLogo size={24} color={C.white} />
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 8 }}>Her sektöre uygun, hepsi bir arada CRM platformu.</p>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            <a href="mailto:destek@fiibi.co" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>destek@fiibi.co</a>
          </div>
        </div>
        <div style={{ ...wrap, borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 32, paddingTop: 20, textAlign: "center" }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>© {new Date().getFullYear()} fiibi. Tüm hakları saklıdır.</span>
        </div>
      </footer>
    </div>
  );
}
