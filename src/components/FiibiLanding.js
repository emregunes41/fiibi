"use client";

import { useState, useEffect, useRef } from "react";
import { registerBusiness } from "@/app/actions/register-photographer";
import { getBusinessTypeList } from "@/lib/business-types";

const C = {
  orange: "#FF5F1F", orangeLight: "#FFAA4C", orangeDark: "#D94800",
  cream: "#FFF6F2", bg: "#F5F5F4", black: "#1A1A1A", dark: "#2E2E2E",
  muted: "#A3A3A3", secondary: "#555555", white: "#FFFFFF",
};

const FEATURES = [
  { title: "Online Randevu", desc: "Müşterileriniz 7/24 online randevu alsın. Takvim otomatik yönetilsin.", icon: "📅" },
  { title: "Ödeme Takibi", desc: "Nakit, havale, kart — tüm tahsilatlarınızı tek ekranda takip edin.", icon: "💳" },
  { title: "Yönetim Paneli", desc: "Rezervasyonlar, müşteriler, hatırlatmalar. Her şey tek panelde.", icon: "📊" },
  { title: "Kendi Web Siteniz", desc: "2 dakikada profesyonel web siteniz hazır. Özel alan adı desteği.", icon: "🌐" },
  { title: "SMS & E-posta", desc: "Otomatik hatırlatmalar ve onay bildirimleri. Müşteri kaybı sıfır.", icon: "📱" },
  { title: "Sözleşme & Form", desc: "Dijital sözleşme onayı ve özel müşteri formları.", icon: "📋" },
];

function buildPlans(prices) {
  return [
    { id: "monthly", name: "Aylık", price: prices.monthly, period: "/ay", popular: false, savings: null },
    { id: "yearly", name: "Yıllık", price: prices.yearly, period: "/yıl", monthlyEquiv: Math.round(prices.yearly / 12), popular: true, savings: Math.round(100 - (prices.yearly / (prices.monthly * 12)) * 100) },
  ];
}

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

const labelStyle = {
  display: "block", fontSize: 11, fontWeight: 600,
  color: "rgba(255,255,255,0.45)", marginBottom: 6,
  textTransform: "uppercase", letterSpacing: "0.06em"
};
const inputStyle = {
  width: "100%", boxSizing: "border-box",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)", padding: "13px 14px",
  color: "#fff", fontSize: 14, outline: "none",
  fontFamily: "'DM Sans', sans-serif"
};
const btnStyle = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  width: "100%", background: C.orange, color: C.white,
  border: "none", padding: "14px 24px", fontWeight: 700,
  fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif"
};

export default function FiibiLanding() {
  const [scrolled, setScrolled] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [plans, setPlans] = useState(buildPlans({ monthly: 2499, yearly: 24999, lifetime: 69500 }));
  
  const [form, setForm] = useState({
    businessName: "", ownerName: "", ownerEmail: "", ownerPhone: "", password: "", slug: "", selectedPlan: "", referralCode: "", businessType: "",
  });

  const allBusinessTypes = getBusinessTypeList();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    fetch("/api/pricing").then(r => r.json()).then(p => setPlans(buildPlans(p))).catch(() => {});
  }, []);

  // Listen to ?register=true
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("register") === "true") {
      setShowRegister(true);
    }
    const ref = params.get("ref");
    if (ref) setForm(prev => ({ ...prev, referralCode: ref.toUpperCase() }));
  }, []);

  const wrap = { maxWidth: 1200, margin: "0 auto", padding: "0 32px", width: "100%" };

  function handleBusinessName(value) {
    const slug = value.toLowerCase()
      .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ı/g, 'i')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
    setForm(prev => ({ ...prev, businessName: value, slug }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await registerBusiness({
      businessName: form.businessName, ownerName: form.ownerName, ownerEmail: form.ownerEmail,
      ownerPhone: form.ownerPhone, password: form.password, slug: form.slug,
      selectedPlan: form.selectedPlan, referralCode: form.referralCode,
      businessType: form.businessType,
    });
    if (res.error) { setError(res.error); setLoading(false); return; }
    setResult(res.tenant);
    setStep(5);
    setLoading(false);
  }

  const domain = typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "fiibi.co") : "fiibi.co";
  const selectedPlanObj = plans.find(p => p.id === form.selectedPlan);

  // --- REGISTER FLOW ---
  if (showRegister) {
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: C.black, color: C.white, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
        <div style={{ width: "100%", maxWidth: step === 1 ? 720 : 480 }}>
          <button onClick={() => { if (step > 1) setStep(step - 1); else { setShowRegister(false); setStep(1); } }}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer", marginBottom: 24, padding: 0, display: "flex", alignItems: "center", gap: 6, fontFamily: "'DM Sans', sans-serif" }}>
            ← {step === 1 ? "Ana Sayfa" : "Geri"}
          </button>

          <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
            {[1, 2, 3, 4, 5].map(s => (
              <div key={s} style={{ flex: 1, height: 3, background: s <= step ? C.white : "rgba(255,255,255,0.06)", transition: "all 0.4s" }} />
            ))}
          </div>

          {/* Step 1: Sektör */}
          {step === 1 && (
            <>
              <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>Sektörünüzü Seçin</h2>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", marginBottom: 32 }}>Size özel bir deneyim oluşturalım.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8, marginBottom: 24 }}>
                {allBusinessTypes.filter(b => b.id !== "other").map((bt) => {
                  const sel = form.businessType === bt.id;
                  return (
                    <div key={bt.id} onClick={() => setForm(prev => ({ ...prev, businessType: bt.id }))}
                      style={{ background: sel ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)", border: sel ? `2px solid ${C.orange}` : "1px solid rgba(255,255,255,0.06)", cursor: "pointer", transition: "all 0.2s", padding: "20px 14px", textAlign: "center", position: "relative" }}>
                      <div style={{ fontSize: 32, marginBottom: 12 }}>{bt.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: sel ? C.white : "rgba(255,255,255,0.7)", marginBottom: 4 }}>{bt.name}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.4 }}>{bt.desc}</div>
                      {sel && <div style={{ position: "absolute", top: 8, right: 8 }}><div style={{ width: 18, height: 18, background: C.orange, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{color: C.white, fontSize: 10}}>✓</span></div></div>}
                    </div>
                  );
                })}
              </div>
              <button onClick={() => form.businessType && setStep(2)} disabled={!form.businessType} style={{ ...btnStyle, opacity: form.businessType ? 1 : 0.3 }}>
                Devam →
              </button>
            </>
          )}

          {/* Step 2: Paket */}
          {step === 2 && (
            <>
              <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>Planınızı Seçin</h2>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", marginBottom: 32 }}>14 gün ücretsiz deneyin, beğenmezseniz ödeme çekilmez.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
                {plans.map((p) => {
                  const sel = form.selectedPlan === p.id;
                  return (
                    <div key={p.id} onClick={() => setForm(prev => ({ ...prev, selectedPlan: p.id }))}
                      style={{ background: sel ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)", border: sel ? `2px solid ${C.orange}` : p.popular ? "2px solid rgba(255,255,255,0.15)" : "1px solid rgba(255,255,255,0.06)", cursor: "pointer", transition: "all 0.2s", position: "relative" }}>
                      {p.popular && (
                        <div style={{ background: C.white, color: C.black, fontSize: 10, fontWeight: 800, padding: "4px 12px", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          En Popüler
                        </div>
                      )}
                      <div style={{ padding: "24px 20px" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>{p.name}</div>
                        <div style={{ marginBottom: 4 }}>
                          <span style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-0.03em" }}>{p.price.toLocaleString("tr-TR")}</span>
                          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginLeft: 4 }}>₺</span>
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginLeft: 6 }}>{p.period}</span>
                        </div>
                        {p.monthlyEquiv && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>~{p.monthlyEquiv.toLocaleString("tr-TR")} ₺/ay</div>}
                        {p.savings && <div style={{ display: "inline-block", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", padding: "2px 8px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>%{p.savings} TASARRUF</div>}
                        {sel && <div style={{ position: "absolute", top: p.popular ? 32 : 12, right: 12 }}><div style={{ width: 22, height: 22, background: C.orange, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{color: C.white, fontSize: 12}}>✓</span></div></div>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => form.selectedPlan && setStep(3)} disabled={!form.selectedPlan} style={{ ...btnStyle, opacity: form.selectedPlan ? 1 : 0.3 }}>
                Devam →
              </button>
            </>
          )}

          {/* Step 3: İşletme */}
          {step === 3 && (
            <form onSubmit={(e) => { e.preventDefault(); setStep(4); }}>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", padding: "32px 28px" }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>İşletme Bilgileri</h2>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 32 }}>İşletme adınız ve web adresiniz.</p>
                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>İşletme Adı *</label>
                  <input type="text" required value={form.businessName} onChange={e => handleBusinessName(e.target.value)} placeholder="İşletme adınız" style={inputStyle} />
                  {form.slug && <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>→ <span style={{ color: "rgba(255,255,255,0.6)" }}>{form.slug}.{domain}</span></div>}
                </div>
                <div style={{ marginBottom: 32 }}>
                  <label style={labelStyle}>URL Adresi *</label>
                  <div style={{ display: "flex" }}>
                    <input type="text" required value={form.slug} onChange={e => setForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} placeholder="ahmet" style={{ ...inputStyle, borderRight: "none", flex: 1 }} />
                    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "0 14px", display: "flex", alignItems: "center", fontSize: 13, color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>.{domain}</div>
                  </div>
                </div>
                <button type="submit" disabled={!form.businessName || !form.slug} style={{ ...btnStyle, opacity: (!form.businessName || !form.slug) ? 0.4 : 1 }}>Devam →</button>
              </div>
            </form>
          )}

          {/* Step 4: Hesap */}
          {step === 4 && (
            <form onSubmit={handleSubmit}>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", padding: "32px 28px" }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Hesap Bilgileri</h2>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 32 }}>Admin paneline giriş bilgileriniz.</p>
                <div style={{ marginBottom: 20 }}><label style={labelStyle}>Ad Soyad *</label><input type="text" required value={form.ownerName} onChange={e => setForm(prev => ({ ...prev, ownerName: e.target.value }))} placeholder="Ahmet Yılmaz" style={inputStyle} /></div>
                <div style={{ marginBottom: 20 }}><label style={labelStyle}>E-posta *</label><input type="email" required value={form.ownerEmail} onChange={e => setForm(prev => ({ ...prev, ownerEmail: e.target.value }))} placeholder="ahmet@gmail.com" style={inputStyle} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                  <div><label style={labelStyle}>Telefon</label><input type="tel" value={form.ownerPhone} onChange={e => setForm(prev => ({ ...prev, ownerPhone: e.target.value }))} placeholder="0555 123 45 67" style={inputStyle} /></div>
                  <div><label style={labelStyle}>Şifre *</label><input type="password" required minLength={6} value={form.password} onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))} placeholder="En az 6 karakter" style={inputStyle} /></div>
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Referans Kodu <span style={{ fontWeight: 400, textTransform: "none", fontSize: 10 }}>(varsa)</span></label>
                  <input type="text" value={form.referralCode} onChange={e => setForm(prev => ({ ...prev, referralCode: e.target.value.toUpperCase() }))} placeholder="ABC123" maxLength={6} style={{ ...inputStyle, letterSpacing: "0.1em", textTransform: "uppercase" }} />
                </div>
                {selectedPlanObj && (
                  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", padding: "16px 20px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.white }}>{selectedPlanObj.name} Plan</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>14 gün ücretsiz deneme</div>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{selectedPlanObj.price.toLocaleString("tr-TR")} <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>₺{selectedPlanObj.period}</span></div>
                  </div>
                )}
                {error && <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", padding: 14, fontSize: 14, color: "rgba(255,255,255,0.6)", textAlign: "center", marginBottom: 20 }}>{error}</div>}
                <button type="submit" disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.5 : 1 }}>{loading ? "Oluşturuluyor..." : "Ücretsiz Başla"}</button>
                <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "rgba(255,255,255,0.2)" }}>Ödeme bilgileri deneme süresi sonunda istenecektir.</div>
              </div>
            </form>
          )}

          {/* Step 5: Başarılı */}
          {step === 5 && result && (
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "56px 40px", textAlign: "center" }}>
              <div style={{ width: 80, height: 80, background: "rgba(255,255,255,0.04)", border: "2px solid rgba(255,255,255,0.15)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 24, borderRadius: 0 }}>
                <span style={{ fontSize: 32, color: C.white }}>✓</span>
              </div>
              <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 12 }}>Hazırsınız! 🎉</h2>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, marginBottom: 40 }}><strong style={{ color: C.white }}>{result.businessName}</strong> işletmeniz oluşturuldu.</p>
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: 24, marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>İşletme Adresiniz</div>
                <code style={{ fontSize: 20, fontWeight: 700, color: C.white, wordBreak: "break-all" }}>{result.slug}.{domain}</code>
              </div>
              <a href={`http://${result.slug}.${domain}/admin/login`} style={{ display: "inline-flex", alignItems: "center", gap: 10, background: C.white, color: C.black, padding: "16px 40px", fontWeight: 800, fontSize: 15, textDecoration: "none", marginTop: 24 }}>
                Admin Paneline Git →
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- LANDING PAGE ---
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
            <button onClick={() => setShowRegister(true)} style={{
              background: C.orange, color: C.white, padding: "10px 24px",
              fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif"
            }}>Ücretsiz Başla</button>
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
            onSubmit={(e) => { e.preventDefault(); setShowRegister(true); setStep(1); }}
            className="fiibi-hero-form"
            style={{ display: "flex", gap: 0, maxWidth: 520, margin: "0 auto", alignItems: "stretch" }}
          >
            <input
              type="text"
              placeholder="İşletme adınız"
              value={form.businessName}
              onChange={e => handleBusinessName(e.target.value)}
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

      {/* ── HOW IT WORKS ── */}
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
            {allBusinessTypes.filter(b => b.id !== "other").map((s, i) => (
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
              <div style={{ fontSize: 14, color: C.muted, marginBottom: 28 }}>7 gün · Tüm özellikler</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
                {["Sınırsız randevu", "Kendi web siten", "Ödeme takibi", "SMS & e-posta"].map(f => (
                  <span key={f} style={{ fontSize: 14, color: C.secondary }}><span style={{ color: C.orange, marginRight: 8 }}>✓</span>{f}</span>
                ))}
              </div>
              <button onClick={() => setShowRegister(true)} style={{ display: "block", width: "100%", textAlign: "center", padding: "14px", fontSize: 14, fontWeight: 700, textDecoration: "none", border: `2px solid ${C.black}`, background: "transparent", color: C.black, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Ücretsiz Başla</button>
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
              <button onClick={() => { setForm(prev => ({...prev, selectedPlan: "yearly"})); setShowRegister(true); }} style={{ display: "block", width: "100%", textAlign: "center", padding: "14px", fontSize: 14, fontWeight: 700, textDecoration: "none", background: C.orange, border: "none", color: C.white, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Hemen Başla →</button>
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
            7 gün ücretsiz dene. Kredi kartı gerekmez. İstediğin zaman iptal et.
          </p>
          <button onClick={() => setShowRegister(true)} style={{
            display: "inline-block", background: C.white, color: C.orangeDark,
            padding: "18px 48px", fontSize: 17, fontWeight: 800, textDecoration: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif"
          }}>
            Ücretsiz Başla →
          </button>
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
