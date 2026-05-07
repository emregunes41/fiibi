"use client";

import { useState, useEffect, useRef } from "react";
import { registerBusiness, preCheckRegistration } from "@/app/actions/register-photographer";
import { sendVerificationCode } from "@/app/actions/verification";
import { getBusinessTypeList } from "@/lib/business-types";

import { useLanguage } from "@/components/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const C = {
  orange: "#FF5F1F", orangeLight: "#FFAA4C", orangeDark: "#D94800",
  cream: "#FFF6F2", bg: "#F5F5F4", black: "#1A1A1A", dark: "#2E2E2E",
  muted: "#A3A3A3", secondary: "#555555", white: "#FFFFFF",
};

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
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const FEATURES = [
    { title: t.landing.stats.appointment, desc: "Müşterileriniz 7/24 online randevu alsın. Takvim otomatik yönetilsin.", icon: "📅" },
    { title: t.landing.pricing.m5, desc: "Nakit, havale, kart — tüm tahsilatlarınızı tek ekranda takip edin.", icon: "💳" },
    { title: "Yönetim Paneli", desc: "Rezervasyonlar, müşteriler, hatırlatmalar. Her şey tek panelde.", icon: "📊" },
    { title: t.landing.pricing.m2, desc: "2 dakikada profesyonel web siteniz hazır. Özel alan adı desteği.", icon: "🌐" },
    { title: t.landing.pricing.m4, desc: "Otomatik hatırlatmalar ve onay bildirimleri. Müşteri kaybı sıfır.", icon: "📱" },
    { title: "Sözleşme & Form", desc: "Dijital sözleşme onayı ve özel müşteri formları.", icon: "📋" },
  ];
  const [result, setResult] = useState(null);
  const [plans, setPlans] = useState(buildPlans({ monthly: 2499, yearly: 24999 }));
  
  const [form, setForm] = useState({
    businessName: "", ownerName: "", ownerEmail: "", ownerPhone: "", password: "", slug: "", selectedPlan: "", referralCode: "", businessType: "", verificationCode: "", kvkkAccepted: false, serviceAgreementAccepted: false
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

  async function handleAccountSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    // 1. Check if email/phone/slug/name is already used
    const preCheck = await preCheckRegistration({
      slug: form.slug, ownerEmail: form.ownerEmail, ownerPhone: form.ownerPhone, businessName: form.businessName
    });
    if (preCheck.error) {
      setError(preCheck.error);
      setLoading(false);
      return;
    }

    // 2. Send verification code
    const sendRes = await sendVerificationCode(form.ownerEmail, form.ownerName);
    if (sendRes.error) {
      setError(sendRes.error);
      setLoading(false);
      return;
    }

    setStep(5);
    setLoading(false);
  }

  async function handleVerifyAndRegister(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await registerBusiness({
      businessName: form.businessName, ownerName: form.ownerName, ownerEmail: form.ownerEmail,
      ownerPhone: form.ownerPhone, password: form.password, slug: form.slug,
      selectedPlan: form.selectedPlan, referralCode: form.referralCode,
      businessType: form.businessType, verificationCode: form.verificationCode,
      kvkkAccepted: form.kvkkAccepted, serviceAgreementAccepted: form.serviceAgreementAccepted
    });
    if (res.error) { setError(res.error); setLoading(false); return; }
    setResult(res.tenant);
    setStep(6);
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
            {[1, 2, 3, 4, 5, 6].map(s => (
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
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", marginBottom: 32 }}>7 gün ücretsiz deneyin, beğenmezseniz iptal edin.</p>
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
            <form onSubmit={handleAccountSubmit}>
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
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>7 gün ücretsiz deneme</div>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{selectedPlanObj.price.toLocaleString("tr-TR")} <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>₺{selectedPlanObj.period}</span></div>
                  </div>
                )}
                
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24, padding: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                    <input type="checkbox" required checked={form.kvkkAccepted} onChange={e => setForm(prev => ({ ...prev, kvkkAccepted: e.target.checked }))} style={{ marginTop: 4 }} />
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
                      <a href="#" style={{ color: C.orange, textDecoration: "none" }}>Kişisel Verilerin Korunması Kanunu</a> kapsamında aydınlatma metnini okudum ve kabul ediyorum. *
                    </span>
                  </label>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                    <input type="checkbox" required checked={form.serviceAgreementAccepted} onChange={e => setForm(prev => ({ ...prev, serviceAgreementAccepted: e.target.checked }))} style={{ marginTop: 4 }} />
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
                      <a href="#" style={{ color: C.orange, textDecoration: "none" }}>Hizmet Sözleşmesini</a> okudum ve kabul ediyorum. *
                    </span>
                  </label>
                </div>

                {error && <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", padding: 14, fontSize: 14, color: "rgba(255,255,255,0.6)", textAlign: "center", marginBottom: 20 }}>{error}</div>}
                <button type="submit" disabled={loading || !form.kvkkAccepted || !form.serviceAgreementAccepted} style={{ ...btnStyle, opacity: (loading || !form.kvkkAccepted || !form.serviceAgreementAccepted) ? 0.5 : 1 }}>{loading ? "Kontrol Ediliyor..." : "Devam →"}</button>
                <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "rgba(255,255,255,0.2)" }}>Sonraki adımda e-posta doğrulaması yapılacaktır.</div>
              </div>
            </form>
          )}

          {/* Step 5: Doğrulama (OTP) */}
          {step === 5 && (
            <form onSubmit={handleVerifyAndRegister}>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", padding: "32px 28px" }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>E-Posta Doğrulama</h2>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 32 }}><strong>{form.ownerEmail}</strong> adresine gönderilen 6 haneli doğrulama kodunu girin.</p>
                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>Doğrulama Kodu *</label>
                  <input type="text" required value={form.verificationCode} onChange={e => setForm(prev => ({ ...prev, verificationCode: e.target.value }))} placeholder="123456" maxLength={6} style={{ ...inputStyle, textAlign: "center", fontSize: 24, letterSpacing: "0.2em", fontWeight: 800 }} />
                </div>
                {error && <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", padding: 14, fontSize: 14, color: "rgba(255,255,255,0.6)", textAlign: "center", marginBottom: 20 }}>{error}</div>}
                <button type="submit" disabled={loading || form.verificationCode.length !== 6} style={{ ...btnStyle, opacity: (loading || form.verificationCode.length !== 6) ? 0.5 : 1 }}>{loading ? "Oluşturuluyor..." : "Doğrula ve Ücretsiz Başla"}</button>
                <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "rgba(255,255,255,0.2)" }}>7 gün ücretsiz · İstediğiniz zaman iptal · Kart bilginiz kayıt sonrası alınacak</div>
              </div>
            </form>
          )}

          {/* Step 6: Başarılı */}
          {step === 6 && result && (
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
              <a href={`http://${result.slug}.${domain}/admin/login${result.token ? "?auto_login=" + result.token : ""}`} style={{ display: "inline-flex", alignItems: "center", gap: 10, background: C.white, color: C.black, padding: "16px 40px", fontWeight: 800, fontSize: 15, textDecoration: "none", marginTop: 24 }}>
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
            <a href="#ozellikler" className="fiibi-nav-link" style={{ color: scrolled ? C.secondary : "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>{t.landing.nav.features}</a>
            <a href="#sektorler" className="fiibi-nav-link" style={{ color: scrolled ? C.secondary : "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>{t.landing.nav.sectors}</a>
            <a href="#fiyatlar" className="fiibi-nav-link" style={{ color: scrolled ? C.secondary : "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>{t.landing.nav.pricing}</a>
            <button onClick={() => setShowRegister(true)} style={{
              background: C.orange, color: C.white, padding: "10px 24px",
              fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif"
            }}>{t.landing.nav.startFree}</button>
            <div style={{ color: scrolled ? C.secondary : "rgba(255,255,255,0.7)" }}>
              <LanguageSwitcher />
            </div>
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
            {t.landing.hero.subtitle}
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
              {t.landing.hero.cta}
            </button>
          </form>

          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 14 }}>
            {t.landing.hero.note}
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
            <span style={{ fontSize: 12, fontWeight: 700, color: C.orange, textTransform: "uppercase", letterSpacing: "0.12em" }}>{t.landing.features.tag}</span>
            <h2 style={{ fontSize: 44, fontWeight: 800, color: C.black, letterSpacing: "-0.03em", marginTop: 12, lineHeight: 1.1 }}>
              {t.landing.features.title}
            </h2>
            <p style={{ fontSize: 16, color: C.secondary, marginTop: 16, lineHeight: 1.7 }}>
              {t.landing.features.subtitle}
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
            <span style={{ fontSize: 12, fontWeight: 700, color: C.orange, textTransform: "uppercase", letterSpacing: "0.12em" }}>{t.landing.how.tag}</span>
            <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.03em", marginTop: 12, lineHeight: 1.1 }}>
              {t.landing.how.title}
            </h2>
          </div>
          <div className="fiibi-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0 }}>
            {[
              { n: "01", t: "1", d: t.landing.how.s1 },
              { n: "02", t: "2", d: t.landing.how.s2 },
              { n: "03", t: "3", d: t.landing.how.s3 },
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
              <span style={{ fontSize: 12, fontWeight: 700, color: C.orange, textTransform: "uppercase", letterSpacing: "0.12em" }}>{t.landing.sectors.tag}</span>
              <h2 style={{ fontSize: 44, fontWeight: 800, color: C.black, letterSpacing: "-0.03em", marginTop: 12, lineHeight: 1.1 }}>
                {t.landing.sectors.title}
              </h2>
            </div>
            <p style={{ fontSize: 15, color: C.secondary, maxWidth: 360, lineHeight: 1.6 }}>
              {t.landing.sectors.subtitle}
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
            <span style={{ fontSize: 12, fontWeight: 700, color: C.orange, textTransform: "uppercase", letterSpacing: "0.12em" }}>{t.landing.pricing.tag}</span>
            <h2 style={{ fontSize: 44, fontWeight: 800, color: C.black, letterSpacing: "-0.03em", marginTop: 12, lineHeight: 1.1 }}>
              {t.landing.pricing.title}
            </h2>
          </div>
          <div className="fiibi-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, maxWidth: 760, margin: "0 auto" }}>
            {/* Aylık */}
            <div style={{ padding: "44px 36px", background: C.white }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{t.landing.pricing.monthly}</div>
              <div style={{ fontSize: 48, fontWeight: 800, color: C.black, letterSpacing: "-0.03em" }}>₺{plans[0]?.price?.toLocaleString("tr-TR") || "—"}</div>
              <div style={{ fontSize: 14, color: C.muted, marginBottom: 28 }}>{t.landing.pricing.allFeatures}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
                {[t.landing.pricing.m1, t.landing.pricing.m2, t.landing.pricing.m3, t.landing.pricing.m4, t.landing.pricing.m5, t.landing.pricing.m6].map(f => (
                  <span key={f} style={{ fontSize: 14, color: C.secondary }}><span style={{ color: C.orange, marginRight: 8 }}>✓</span>{f}</span>
                ))}
              </div>
              <button onClick={() => { setForm(prev => ({...prev, selectedPlan: "monthly"})); setShowRegister(true); }} style={{ display: "block", width: "100%", textAlign: "center", padding: "14px", fontSize: 14, fontWeight: 700, border: `2px solid ${C.black}`, background: "transparent", color: C.black, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{t.landing.pricing.startNow}</button>
            </div>
            {/* Yıllık */}
            <div style={{ padding: "44px 36px", background: C.black, color: C.white, position: "relative" }}>
              {plans[1]?.savings > 0 && <div style={{ position: "absolute", top: 16, right: 16, background: C.orange, color: C.white, padding: "4px 12px", fontSize: 10, fontWeight: 700 }}>%{plans[1].savings} {t.landing.pricing.savings}</div>}
              <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{t.landing.pricing.yearly}</div>
              <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-0.03em" }}>₺{plans[1]?.price?.toLocaleString("tr-TR") || "—"}</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 28 }}>{plans[1]?.monthlyEquiv ? `~₺${plans[1].monthlyEquiv.toLocaleString("tr-TR")}/ay` : "yıllık"} · Her şey dahil</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
                {[t.landing.pricing.y1, t.landing.pricing.m3, t.landing.pricing.m4, t.landing.pricing.m5, t.landing.pricing.m6].map(f => (
                  <span key={f} style={{ fontSize: 14, color: "rgba(255,255,255,0.55)" }}><span style={{ color: C.orangeLight, marginRight: 8 }}>✓</span>{f}</span>
                ))}
              </div>
              <button onClick={() => { setForm(prev => ({...prev, selectedPlan: "yearly"})); setShowRegister(true); }} style={{ display: "block", width: "100%", textAlign: "center", padding: "14px", fontSize: 14, fontWeight: 700, background: C.orange, border: "none", color: C.white, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{t.landing.pricing.startNow}</button>
            </div>
          </div>
          <p style={{ textAlign: "center", marginTop: 24, fontSize: 15, color: C.secondary }}>
            🎁 {t.landing.pricing.freeTrialNote}
          </p>
        </div>
      </Reveal>

      
      {/* ── FAQ ── */}
      <Reveal id="sss" style={{ padding: "100px 32px", background: C.white }}>
        <div style={wrap}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.orange, textTransform: "uppercase", letterSpacing: "0.12em" }}>Sıkça Sorulan Sorular</span>
            <h2 style={{ fontSize: 44, fontWeight: 800, color: C.black, letterSpacing: "-0.03em", marginTop: 12, lineHeight: 1.1 }}>
              Aklınıza Takılanlar
            </h2>
          </div>
          <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 2 }}>
            {[
              { q: "Kurulum gerçekten 2 dakika mı sürüyor?", a: "Evet, Fiibi ile kayıt olduğunuz anda mağazanız sizin için özel bir alt alan adında saniyeler içinde oluşturulur. Kendi alan adınızı sonradan ayarlar menüsünden bağlayabilirsiniz." },
              { q: "Ödeme altyapısı nasıl çalışıyor?", a: "Ödemeler için hiçbir ekstra entegrasyonla uğraşmazsınız. Fiibi, kendi güvenli ödeme sistemi üzerinden tüm kartlardan çekim yapar ve hak edişinizi komisyonlar kesildikten sonra otomatik olarak banka hesabınıza yatırır." },
              { q: "Müşterilerim benden nasıl randevu alacak?", a: "Size tahsis edilen web sitenizde müşterilerinizin paketlerinizi görüp istedikleri tarih/saat aralığında randevu oluşturabileceği akıllı bir takvim bulunur." },
              { q: "Yıllık planda iade hakkım var mı?", a: "Evet, yıllık planlarımızda ilk 14 gün içerisinde koşulsuz şartsız tam iade garantimiz bulunmaktadır." }
            ].map((faq, i) => (
              <div key={i} style={{ padding: "24px", background: C.cream }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.black, marginBottom: 8 }}>{faq.q}</h3>
                <p style={{ fontSize: 14, color: C.secondary, lineHeight: 1.6 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ── TESTIMONIAL ── */}
      <Reveal style={{ padding: "100px 32px", background: C.bg }}>
        <div style={wrap}>
          <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
            <div style={{ fontSize: 64, color: C.orangeLight, lineHeight: 0.5, marginBottom: 24 }}>“</div>
            <p style={{ fontSize: 24, fontWeight: 700, color: C.black, lineHeight: 1.5, marginBottom: 32, letterSpacing: "-0.01em" }}>
              "Fiibi sayesinde tüm fotoğrafçılık süreçlerimi, rezervasyonlarımı ve ödemelerimi tek ekrandan yönetebiliyorum. Müşterilerim web sitemden randevu alıyor, ödemesini güvenle yapıyor. Gerçek bir zaman tasarrufu!"
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.orange, color: C.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800 }}>
                P
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.black }}>Pinowed</div>
                <div style={{ fontSize: 13, color: C.secondary }}>Kurucu & Kullanıcı</div>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ── CTA ── */}
      <Reveal style={{ padding: "120px 32px", background: C.orange, textAlign: "center" }}>
        <div style={wrap}>
          <h2 style={{ fontSize: 52, fontWeight: 800, color: C.white, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 20 }}>
            {t.landing.cta.title1}<br/>{t.landing.cta.title2}
          </h2>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.8)", marginBottom: 36, maxWidth: 480, margin: "0 auto 36px" }}>
            {t.landing.cta.subtitle}
          </p>
          <button onClick={() => setShowRegister(true)} style={{
            display: "inline-block", background: C.white, color: C.orangeDark,
            padding: "18px 48px", fontSize: 17, fontWeight: 800, textDecoration: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif"
          }}>
            {t.landing.nav.startFree}
          </button>
        </div>
      </Reveal>

      {/* ── FOOTER ── */}
      <footer style={{ padding: "56px 32px 24px", background: C.black }}>
        <div style={{ ...wrap, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 32 }}>
          <div>
            <Logo dark size={40} />
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginTop: 10, maxWidth: 280, lineHeight: 1.6 }}>
              {t.landing.footer.desc}
            </p>
          </div>
          <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 14 }}>Platform</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <a href="#ozellikler" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>{t.landing.nav.features}</a>
                <a href="#fiyatlar" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>{t.landing.nav.pricing}</a>
                <a href="#sektorler" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>{t.landing.nav.sectors}</a>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 14 }}>{t.nav.contact}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <a href="mailto:destek@fiibi.co" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>destek@fiibi.co</a>
              </div>
            </div>
          </div>
        </div>
        
          <div style={{ width: "100%", marginTop: 40, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.15em" }}>Güvenli Ödeme Altyapısı</div>
            <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", justifyContent: "center", opacity: 0.5 }}>
              {/* Visa */}
              <svg width="40" height="13" viewBox="0 0 40 13" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.22 0.280029L9.93 12.63H6.5L3.92 2.87003C3.76 2.27003 3.65 2.06003 3.2 1.80003C2.42 1.34003 1.15 0.950029 0 0.700029L0.08 0.280029H5.63C6.33 0.280029 6.96 0.760029 7.12 1.57003L8.52 8.76003L11.75 0.280029H15.22ZM28.53 8.52003C28.53 5.34003 24.18 5.16003 24.2 3.73003C24.21 3.30003 24.62 2.83003 25.5 2.69003C25.94 2.62003 27.23 2.56003 28.56 3.18003L29.09 0.690029C28.37 0.430029 27.42 0.210029 26.29 0.210029C23.12 0.210029 20.93 1.89003 20.91 4.33003C20.89 6.13003 22.54 7.14003 23.77 7.74003C25.04 8.35003 25.46 8.74003 25.46 9.28003C25.44 10.1 24.46 10.46 23.57 10.48C22.07 10.5 20.93 10.08 20.08 9.68003L19.53 12.23C20.25 12.57 21.56 12.86 22.95 12.88C26.33 12.88 28.53 11.22 28.53 8.52003ZM36.96 12.63H39.88L37.96 0.280029H35.15C34.54 0.280029 34.02 0.650029 33.78 1.20003L28.84 12.63H32.22L32.89 10.74H37.04L36.96 12.63ZM33.82 8.21003L35.48 3.59003L36.46 8.21003H33.82ZM19.82 0.280029H17.06L13.56 12.63H16.81L19.82 0.280029Z" fill="#fff"/></svg>
              {/* Mastercard */}
              <svg width="22" height="13" viewBox="0 0 22 13" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.05001 0.490005C4.24001 0.490005 1.76001 2.05001 0.5 4.38001C1.65 6.43001 1.65 8.95001 0.5 11.01C1.75 13.34 4.24001 14.9 7.05001 14.9C10.74 14.9 13.84 12.16 14.28 8.62001C13.88 4.70001 10.74 1.62001 7.05001 0.490005Z" fill="#fff"/><path d="M14.95 0.490005C11.26 1.62001 8.11999 4.70001 7.71999 8.62001C8.15999 12.16 11.26 14.9 14.95 14.9C17.76 14.9 20.24 13.34 21.5 11.01C20.35 8.96001 20.35 6.44001 21.5 4.38001C20.24 2.05001 17.76 0.490005 14.95 0.490005Z" fill="#fff"/></svg>
              {/* PayTR Text Logo */}
              <span style={{ fontSize: 16, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>PayTR</span>
              {/* Iyzico Text Logo */}
              <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>iyzico</span>
            </div>
          </div>

        <div style={{ ...wrap, borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 24, paddingTop: 20, textAlign: "center" }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.15)" }}>© {new Date().getFullYear()} fiibi. {t.footer.rights}</span>
        </div>
      </footer>
    </div>
  );
}
