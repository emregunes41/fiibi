"use client";

import { useState, useEffect } from "react";
import { Camera, ArrowRight, Check, Sparkles, BarChart3, Calendar, Shield, Users, CreditCard, Star, Palette } from "lucide-react";
import { registerPhotographer } from "../actions/register-photographer";

function buildPlans(prices) {
  return [
    { id: "monthly", name: "Aylık", price: prices.monthly, period: "/ay", color: "#8b5cf6", popular: false, savings: null },
    { id: "yearly", name: "Yıllık", price: prices.yearly, period: "/yıl", monthlyEquiv: Math.round(prices.yearly / 12), color: "#f59e0b", popular: true, savings: Math.round(100 - (prices.yearly / (prices.monthly * 12)) * 100) },
    { id: "lifetime", name: "Ömürlük", price: prices.lifetime, period: "tek seferlik", color: "#4ade80", popular: false, savings: null },
  ];
}

export default function OnboardingPage() {
  const [showRegister, setShowRegister] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [scrollY, setScrollY] = useState(0);
  const [plans, setPlans] = useState(buildPlans({ monthly: 2499, yearly: 24999, lifetime: 69500 }));
  const [faq, setFaq] = useState(null);

  const [form, setForm] = useState({
    businessName: "", ownerName: "", ownerEmail: "", ownerPhone: "", password: "", slug: "", selectedPlan: "", referralCode: "",
  });

  // URL'den referans kodu al
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) setForm(prev => ({ ...prev, referralCode: ref.toUpperCase() }));
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetch("/api/pricing").then(r => r.json()).then(p => setPlans(buildPlans(p))).catch(() => {});
  }, []);

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
    const res = await registerPhotographer({
      businessName: form.businessName, ownerName: form.ownerName, ownerEmail: form.ownerEmail,
      ownerPhone: form.ownerPhone, password: form.password, slug: form.slug,
      selectedPlan: form.selectedPlan, referralCode: form.referralCode,
    });
    if (res.error) { setError(res.error); setLoading(false); return; }
    setResult(res.tenant);
    setStep(4);
    setLoading(false);
  }

  const domain = typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "localhost:3000") : "photoapp.co";
  const selectedPlanObj = plans.find(p => p.id === form.selectedPlan);

  const features = [
    { icon: Calendar, title: "Rezervasyon Yönetimi", desc: "Online randevu, otomatik hatırlatma, takvim" },
    { icon: CreditCard, title: "Ödeme Takibi", desc: "Taksit, nakit, havale — tüm ödemeler tek yerde" },
    { icon: BarChart3, title: "Muhasebe", desc: "Gelir analizi, aylık raporlar, bakiye takibi" },
    { icon: Palette, title: "Portfolyo Sitesi", desc: "Profesyonel site — kendi domain'inizle" },
    { icon: Users, title: "Müşteri Paneli", desc: "Fotoğraf seçimi, albüm onayı, sözleşme" },
    { icon: Shield, title: "Bildirimler", desc: "SMS + E-posta ile otomatik müşteri bildirimleri" },
  ];

  // ─── Registration Flow ───
  if (showRegister) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
        <div style={{ width: "100%", maxWidth: step === 1 ? 720 : 480 }}>

          <button onClick={() => { if (step > 1) setStep(step - 1); else { setShowRegister(false); setStep(1); } }}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer", marginBottom: 24, padding: 0, display: "flex", alignItems: "center", gap: 6 }}>
            ← {step === 1 ? "Ana Sayfa" : "Geri"}
          </button>

          <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
            {[1, 2, 3, 4].map(s => (
              <div key={s} style={{ flex: 1, height: 3, background: s <= step ? "#fff" : "rgba(255,255,255,0.06)", transition: "all 0.4s" }} />
            ))}
          </div>

          {/* Step 1: Paket */}
          {step === 1 && (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>Planınızı Seçin</h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 28 }}>7 gün ücretsiz deneyin, beğenmezseniz ödeme çekilmez.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
                {plans.map((p) => {
                  const sel = form.selectedPlan === p.id;
                  return (
                    <div key={p.id} onClick={() => setForm(prev => ({ ...prev, selectedPlan: p.id }))}
                      style={{ background: sel ? `${p.color}08` : "rgba(255,255,255,0.02)", border: sel ? `2px solid ${p.color}50` : p.popular ? `2px solid ${p.color}20` : "1px solid rgba(255,255,255,0.06)", cursor: "pointer", transition: "all 0.2s", position: "relative" }}>
                      {p.popular && (
                        <div style={{ background: p.color, color: "#000", fontSize: 10, fontWeight: 800, padding: "4px 12px", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          <Star size={9} style={{ marginRight: 4, verticalAlign: "middle" }} /> En Popüler
                        </div>
                      )}
                      <div style={{ padding: "20px 18px" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>{p.name}</div>
                        <div style={{ marginBottom: 4 }}>
                          <span style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.03em" }}>{p.price.toLocaleString("tr-TR")}</span>
                          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginLeft: 4 }}>₺</span>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginLeft: 6 }}>{p.period}</span>
                        </div>
                        {p.monthlyEquiv && <div style={{ fontSize: 11, color: p.color, marginBottom: 2 }}>~{p.monthlyEquiv.toLocaleString("tr-TR")} ₺/ay</div>}
                        {p.savings && <div style={{ display: "inline-block", background: `${p.color}15`, border: `1px solid ${p.color}25`, padding: "2px 8px", fontSize: 10, fontWeight: 700, color: p.color, marginTop: 4 }}>%{p.savings} TASARRUF</div>}
                        {sel && <div style={{ position: "absolute", top: p.popular ? 32 : 10, right: 10 }}><div style={{ width: 22, height: 22, background: p.color, display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={14} style={{ color: "#000" }} /></div></div>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                <Shield size={14} style={{ flexShrink: 0 }} />
                <span>7 gün ücretsiz deneme. İptal ederseniz <strong style={{ color: "#fff" }}>hiçbir ücret çekilmez</strong>.</span>
              </div>
              <button onClick={() => form.selectedPlan && setStep(2)} disabled={!form.selectedPlan} style={{ ...btnStyle, opacity: form.selectedPlan ? 1 : 0.3 }}>
                Devam <ArrowRight size={16} />
              </button>
            </>
          )}

          {/* Step 2: Stüdyo */}
          {step === 2 && (
            <form onSubmit={(e) => { e.preventDefault(); setStep(3); }}>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", padding: "32px 28px" }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Stüdyo Bilgileri</h2>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 28 }}>İşletme adınız ve web adresiniz.</p>
                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>Stüdyo Adı *</label>
                  <input type="text" required value={form.businessName} onChange={e => handleBusinessName(e.target.value)} placeholder="Ahmet Photography" style={inputStyle} />
                  {form.slug && <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>→ <span style={{ color: "rgba(255,255,255,0.6)" }}>{form.slug}.{domain}</span></div>}
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>URL Adresi *</label>
                  <div style={{ display: "flex" }}>
                    <input type="text" required value={form.slug} onChange={e => setForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} placeholder="ahmet" style={{ ...inputStyle, borderRight: "none", flex: 1 }} />
                    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "0 14px", display: "flex", alignItems: "center", fontSize: 13, color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>.{domain}</div>
                  </div>
                </div>
                <button type="submit" disabled={!form.businessName || !form.slug} style={{ ...btnStyle, opacity: (!form.businessName || !form.slug) ? 0.4 : 1 }}>Devam <ArrowRight size={16} /></button>
              </div>
            </form>
          )}

          {/* Step 3: Hesap */}
          {step === 3 && (
            <form onSubmit={handleSubmit}>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", padding: "32px 28px" }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Hesap Bilgileri</h2>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 28 }}>Admin paneline giriş bilgileriniz.</p>
                <div style={{ marginBottom: 16 }}><label style={labelStyle}>Ad Soyad *</label><input type="text" required value={form.ownerName} onChange={e => setForm(prev => ({ ...prev, ownerName: e.target.value }))} placeholder="Ahmet Yılmaz" style={inputStyle} /></div>
                <div style={{ marginBottom: 16 }}><label style={labelStyle}>E-posta *</label><input type="email" required value={form.ownerEmail} onChange={e => setForm(prev => ({ ...prev, ownerEmail: e.target.value }))} placeholder="ahmet@gmail.com" style={inputStyle} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                  <div><label style={labelStyle}>Telefon</label><input type="tel" value={form.ownerPhone} onChange={e => setForm(prev => ({ ...prev, ownerPhone: e.target.value }))} placeholder="0555 123 45 67" style={inputStyle} /></div>
                  <div><label style={labelStyle}>Şifre *</label><input type="password" required minLength={6} value={form.password} onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))} placeholder="En az 6 karakter" style={inputStyle} /></div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>Referans Kodu <span style={{ fontWeight: 400, textTransform: "none", fontSize: 10 }}>(varsa)</span></label>
                  <input type="text" value={form.referralCode} onChange={e => setForm(prev => ({ ...prev, referralCode: e.target.value.toUpperCase() }))} placeholder="ABC123" maxLength={6} style={{ ...inputStyle, letterSpacing: "0.1em", textTransform: "uppercase" }} />
                  {form.referralCode && <div style={{ marginTop: 6, fontSize: 11, color: "rgba(74,222,128,0.7)" }}>✓ Referans kodu girildi</div>}
                </div>
                {selectedPlanObj && (
                  <div style={{ background: `${selectedPlanObj.color}08`, border: `1px solid ${selectedPlanObj.color}20`, padding: "14px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: selectedPlanObj.color }}>{selectedPlanObj.name} Plan</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>7 gün ücretsiz deneme</div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{selectedPlanObj.price.toLocaleString("tr-TR")} <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>₺{selectedPlanObj.period}</span></div>
                  </div>
                )}
                {error && <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.15)", padding: 14, fontSize: 13, color: "#f87171", textAlign: "center", marginBottom: 16 }}>{error}</div>}
                <button type="submit" disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.5 : 1 }}>{loading ? "Oluşturuluyor..." : "7 Gün Ücretsiz Başla"} {!loading && <Sparkles size={16} />}</button>
                <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: "rgba(255,255,255,0.2)" }}>Ödeme bilgileri deneme süresi sonunda istenecektir.</div>
              </div>
            </form>
          )}

          {/* Step 4: Başarılı */}
          {step === 4 && result && (
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "48px 32px", textAlign: "center" }}>
              <div style={{ width: 72, height: 72, background: "rgba(255,255,255,0.04)", border: "2px solid rgba(255,255,255,0.15)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                <Check size={36} style={{ color: "#fff" }} />
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 8 }}>Hazırsınız! 🎉</h2>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginBottom: 32 }}><strong style={{ color: "#fff" }}>{result.businessName}</strong> stüdyonuz oluşturuldu.</p>
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: 20, marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Stüdyo Adresiniz</div>
                <code style={{ fontSize: 18, fontWeight: 700, color: "#fff", wordBreak: "break-all" }}>{result.slug}.{domain}</code>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: 14, marginBottom: 32, fontSize: 13, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Sparkles size={14} /> 7 gün ücretsiz — tüm özellikler aktif
              </div>
              <a href={`http://${result.slug}.${domain}/admin/login`} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", color: "#000", padding: "14px 36px", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
                Admin Paneline Git <ArrowRight size={16} />
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Landing Page ───
  return (
    <div style={{ background: "#0a0a0a", color: "#f5f5f5", minHeight: "100vh" }}>

      {/* Navbar */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrollY > 50 ? "rgba(10,10,10,0.95)" : "transparent",
        backdropFilter: scrollY > 50 ? "blur(16px)" : "none",
        borderBottom: scrollY > 50 ? "1px solid rgba(255,255,255,0.05)" : "none",
        transition: "all 0.3s", padding: "0 24px"
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Camera size={18} style={{ color: "#fff" }} />
            <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em" }}>photostudio</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <a href="#nasil" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Nasıl Çalışır</a>
            <a href="#fiyat" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Fiyatlandırma</a>
            <a href="#sss" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>SSS</a>
            <button onClick={() => setShowRegister(true)} style={{ background: "#fff", color: "#000", border: "none", padding: "8px 18px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              Ücretsiz Başla
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", padding: "140px 24px 80px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ maxWidth: 620 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 24 }}>
            Fotoğrafçılar için iş yönetim platformu
          </div>
          <h1 style={{ fontSize: "clamp(38px, 5.5vw, 60px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.08, marginBottom: 24 }}>
            Çekimlerinize<br />odaklanın,<br />
            <span style={{ color: "rgba(255,255,255,0.45)" }}>gerisini biz halledelim.</span>
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, maxWidth: 440, marginBottom: 36 }}>
            Rezervasyon, ödeme takibi, müşteri yönetimi ve portfolyo sitesi — tek platformda. Kurulum 2 dakika.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => setShowRegister(true)} style={{
              background: "#fff", color: "#000", border: "none", padding: "14px 28px",
              fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8
            }}>
              7 Gün Ücretsiz Dene <ArrowRight size={16} />
            </button>
            <a href="#nasil" style={{ border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.5)", padding: "14px 24px", fontWeight: 600, fontSize: 14, textDecoration: "none", display: "flex", alignItems: "center" }}>
              Nasıl Çalışır?
            </a>
          </div>
        </div>
      </section>

      {/* Sayılar */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
          {[
            { val: "2 dk", label: "Kurulum süresi" },
            { val: "7 gün", label: "Ücretsiz deneme" },
            { val: "₺0", label: "Başlangıç ücreti" },
            { val: "7/24", label: "Platform erişimi" },
          ].map((s, i) => (
            <div key={i} style={{ padding: "28px 24px", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none", textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, letterSpacing: "-0.02em" }}>{s.val}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Nasıl Çalışır */}
      <section id="nasil" style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Başlamak çok kolay</div>
          <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 48 }}>Üç adımda hazır.</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 1, background: "rgba(255,255,255,0.05)" }}>
            {[
              { num: "01", title: "Kayıt olun", desc: "Stüdyo adınızı girin, URL'inizi seçin. E-posta ve şifre ile admin hesabınız hazır." },
              { num: "02", title: "Özelleştirin", desc: "Paketlerinizi ekleyin, fiyatlarınızı belirleyin, portfolyonuzu yükleyin." },
              { num: "03", title: "Yayına alın", desc: "Müşterileriniz online rezervasyon yapsın, siz sadece çekim yapın." },
            ].map((s, i) => (
              <div key={i} style={{ background: "#0a0a0a", padding: "36px 28px" }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: "rgba(255,255,255,0.06)", marginBottom: 16, letterSpacing: "-0.03em" }}>{s.num}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Özellikler */}
      <section style={{ padding: "60px 24px 100px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Özellikler</div>
          <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 48 }}>İhtiyacınız olan her şey, tek yerde.</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {features.map((f, i) => (
              <div key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "24px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <f.icon size={16} style={{ color: "rgba(255,255,255,0.3)" }} />
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{f.title}</h3>
                </div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, margin: 0, paddingLeft: 28 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sosyal Kanıt */}
      <section style={{ padding: "80px 24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Kullanıcı Görüşleri</div>
          <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 48 }}>Fotoğrafçılar ne diyor?</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {[
              { name: "Elif K.", role: "Düğün Fotoğrafçısı · İstanbul", text: "Eskiden Excel'de takip ediyordum her şeyi. Artık müşteri kendi fotoğraflarını seçiyor, ödemeleri görüyorum, albüm sürecini takip ediyorum. Hayat kurtarıcı." },
              { name: "Burak M.", role: "Doğum Fotoğrafçısı · Ankara", text: "Müşterilerime profesyonel bir site sunabilmek çok fark yarattı. 10 dakikada kurdum, o günden beri kullanıyorum." },
              { name: "Selin A.", role: "Dış Çekim · İzmir", text: "Rezervasyon karmaşası bitti. Müşteri online seçip tarih alıyor, ben sadece çekime odaklanıyorum. Tam istediğim şeydi." },
            ].map((t, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: "28px 24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, margin: "0 0 24px 0", fontStyle: "italic" }}>"{t.text}"</p>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fiyatlandırma */}
      <section id="fiyat" style={{ padding: "80px 24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Fiyatlandırma</div>
            <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 8 }}>Basit, şeffaf fiyatlar.</h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>Tüm planlar aynı özellikleri içerir. Fark yalnızca süre.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 1, background: "rgba(255,255,255,0.05)" }}>
            {plans.map((p) => (
              <div key={p.id} style={{ background: "#0a0a0a", padding: "32px 24px", position: "relative", borderTop: p.popular ? "2px solid #fff" : "none" }}>
                {p.popular && <div style={{ position: "absolute", top: -1, right: 20, background: "#fff", color: "#000", fontSize: 9, fontWeight: 800, padding: "3px 10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Popüler</div>}
                <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>{p.name}</div>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em" }}>{p.price.toLocaleString("tr-TR")}</span>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", marginLeft: 6 }}>₺ {p.period}</span>
                </div>
                {p.monthlyEquiv && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>aylık ~{p.monthlyEquiv.toLocaleString("tr-TR")} ₺</div>}
                {p.savings && <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>%{p.savings} tasarruf</div>}
                <button onClick={() => { setForm(f => ({ ...f, selectedPlan: p.id })); setShowRegister(true); }}
                  style={{ width: "100%", marginTop: 20, padding: "12px 0", background: p.popular ? "#fff" : "transparent", color: p.popular ? "#000" : "rgba(255,255,255,0.6)", border: p.popular ? "none" : "1px solid rgba(255,255,255,0.1)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Ücretsiz Dene
                </button>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: "rgba(255,255,255,0.2)" }}>Tüm planlar KDV dahildir. 7 gün ücretsiz deneme. İstediğiniz zaman iptal.</div>
        </div>
      </section>

      {/* SSS */}
      <section id="sss" style={{ padding: "80px 24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Sıkça Sorulan Sorular</div>
          <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 36 }}>Merak edilenler.</h2>
          {[
            { q: "Ücretsiz deneme nasıl çalışıyor?", a: "Kayıt olduktan sonra 7 gün boyunca tüm özellikleri ücretsiz kullanabilirsiniz. Kredi kartı gerekmez. 7 gün sonunda ödeme yapmazsanız hesabınız dondurulur, verileriniz silinmez." },
            { q: "Müşterilerim siteyi nasıl görecek?", a: "Kayıt olduğunuzda size özel bir adres verilir (ornek.photostudio.co). Müşterileriniz bu adresten portfolyonuzu görebilir ve online rezervasyon yapabilir." },
            { q: "Kendi domain'imi kullanabilir miyim?", a: "Yıllık ve ömürlük planlarda custom domain desteği bulunuyor. Mevcut domain'inizi yönlendirmeniz yeterli." },
            { q: "Kaç paket ve rezervasyon ekleyebilirim?", a: "Tüm planlarda sınırsız paket ve sınırsız rezervasyon hakkınız var." },
            { q: "Verilerim güvende mi?", a: "Tüm veriler şifreli bağlantı üzerinden iletilir ve güvenli sunucularda saklanır. KVKK uyumlu çalışıyoruz." },
            { q: "İstediğim zaman iptal edebilir miyim?", a: "Evet, herhangi bir taahhüt yoktur. Aboneliğinizi dilediğiniz zaman iptal edebilirsiniz." },
          ].map((item, i) => (
            <div key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <button onClick={() => setFaq(faq === i ? null : i)} style={{ width: "100%", padding: "20px 0", background: "none", border: "none", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left" }}>
                {item.q}
                <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 18, transition: "transform 0.2s", transform: faq === i ? "rotate(45deg)" : "none", flexShrink: 0, marginLeft: 16 }}>+</span>
              </button>
              {faq === i && <div style={{ paddingBottom: 20, fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>{item.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* Son CTA */}
      <section style={{ padding: "80px 24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 500, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 12 }}>İşinizi büyütmeye<br />hazır mısınız?</h2>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, marginBottom: 32 }}>2 dakikada kayıt olun. 7 gün ücretsiz deneyin.</p>
          <button onClick={() => setShowRegister(true)} style={{ background: "#fff", color: "#000", border: "none", padding: "14px 36px", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
            Ücretsiz Başla <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "48px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 32 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Camera size={16} style={{ color: "rgba(255,255,255,0.4)" }} />
              <span style={{ fontWeight: 700, fontSize: 14 }}>photostudio</span>
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.6, maxWidth: 240 }}>Fotoğrafçılar için profesyonel iş yönetim platformu.</p>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Platform</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <a href="#nasil" style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>Nasıl Çalışır</a>
              <a href="#fiyat" style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>Fiyatlandırma</a>
              <a href="#sss" style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>SSS</a>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Yasal</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>Gizlilik Politikası</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>Kullanım Koşulları</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>KVKK</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>İletişim</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>destek@photostudio.co</span>
              <a href="/super-admin/login" style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", textDecoration: "none" }}>Yönetici Girişi</a>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 900, margin: "32px auto 0", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 20, textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.15)" }}>
          © {new Date().getFullYear()} photostudio — Tüm hakları saklıdır.
        </div>
      </footer>

      <style jsx global>{`html { scroll-behavior: smooth; }`}</style>
    </div>
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
  color: "#fff", fontSize: 14, outline: "none"
};
const btnStyle = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  width: "100%", background: "#fff", color: "#000",
  border: "none", padding: "14px 24px", fontWeight: 700,
  fontSize: 14, cursor: "pointer"
};
