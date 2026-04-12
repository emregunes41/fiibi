"use client";

import { useState } from "react";
import { Camera, ArrowRight, Check, Sparkles, Globe } from "lucide-react";
import { registerPhotographer } from "../actions/register-photographer";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const [form, setForm] = useState({
    businessName: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    password: "",
    slug: "",
  });

  // Slug otomatik oluştur
  function handleBusinessName(value) {
    const slug = value
      .toLowerCase()
      .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ı/g, 'i')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);
    setForm(prev => ({ ...prev, businessName: value, slug }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await registerPhotographer(form);
    if (res.error) {
      setError(res.error);
      setLoading(false);
      return;
    }

    setResult(res.tenant);
    setStep(3);
    setLoading(false);
  }

  const domain = typeof window !== "undefined" 
    ? (process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "localhost:3000")
    : "photoapp.co";

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
      <div style={{ width: "100%", maxWidth: 520 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)", display: "inline-flex",
            alignItems: "center", justifyContent: "center", marginBottom: 20
          }}>
            <Camera size={26} style={{ color: "rgba(255,255,255,0.8)" }} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 8 }}>
            Stüdyonuzu Kurun
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, maxWidth: 360, margin: "0 auto" }}>
            2 dakikada kendi profesyonel CRM'inize sahip olun. Kredi kartı gerekmez.
          </p>
        </div>

        {/* Steps Indicator */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 36 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              width: s <= step ? 40 : 24, height: 4, borderRadius: 2,
              background: s <= step ? "#fff" : "rgba(255,255,255,0.1)",
              transition: "all 0.3s"
            }} />
          ))}
        </div>

        {step === 3 && result ? (
          /* Success */
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)",
            padding: 40, textAlign: "center"
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%", background: "rgba(74,222,128,0.1)",
              border: "2px solid rgba(74,222,128,0.3)", display: "inline-flex",
              alignItems: "center", justifyContent: "center", marginBottom: 24
            }}>
              <Check size={32} style={{ color: "#4ade80" }} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Tebrikler! 🎉</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, marginBottom: 32 }}>
              <strong>{result.businessName}</strong> stüdyonuz başarıyla oluşturuldu.
            </p>

            <div style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              padding: 20, marginBottom: 24
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 8 }}>
                <Globe size={14} style={{ color: "rgba(255,255,255,0.5)" }} />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Stüdyo Adresiniz</span>
              </div>
              <code style={{
                fontSize: 18, fontWeight: 700, color: "#fff",
                display: "block", wordBreak: "break-all"
              }}>
                {result.slug}.{domain}
              </code>
            </div>

            <div style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              padding: 16, marginBottom: 32, fontSize: 13, color: "rgba(255,255,255,0.55)"
            }}>
              <Sparkles size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
              14 günlük ücretsiz deneme süresi başladı. Tüm özellikler aktif!
            </div>

            <a
              href={`http://${result.slug}.${domain}/admin/login`}
              style={{
                display: "inline-block", background: "#fff", color: "#000",
                padding: "14px 32px", fontWeight: 700, fontSize: 14,
                textDecoration: "none", transition: "opacity 0.2s"
              }}
            >
              Admin Paneline Git →
            </a>
          </div>
        ) : (
          /* Form */
          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleSubmit}>
            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)",
              padding: "32px 28px", display: "flex", flexDirection: "column", gap: 20
            }}>

              {step === 1 && (
                <>
                  <div>
                    <label style={labelStyle}>Stüdyo Adı *</label>
                    <input
                      type="text" required value={form.businessName}
                      onChange={e => handleBusinessName(e.target.value)}
                      placeholder="Ahmet Photography"
                      style={inputStyle}
                    />
                    {form.slug && (
                      <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                        Adresiniz: <span style={{ color: "rgba(255,255,255,0.7)" }}>{form.slug}.{domain}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={labelStyle}>Stüdyo Adresi (URL) *</label>
                    <div style={{ display: "flex", alignItems: "stretch" }}>
                      <input
                        type="text" required value={form.slug}
                        onChange={e => setForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                        placeholder="ahmet"
                        style={{ ...inputStyle, borderRight: "none", flex: 1 }}
                      />
                      <div style={{
                        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                        padding: "0 14px", display: "flex", alignItems: "center",
                        fontSize: 13, color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap"
                      }}>
                        .{domain}
                      </div>
                    </div>
                  </div>

                  <button type="submit" style={btnStyle}>
                    Devam Et <ArrowRight size={16} />
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <label style={labelStyle}>Adınız Soyadınız *</label>
                    <input
                      type="text" required value={form.ownerName}
                      onChange={e => setForm(prev => ({ ...prev, ownerName: e.target.value }))}
                      placeholder="Ahmet Yılmaz"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>E-posta *</label>
                    <input
                      type="email" required value={form.ownerEmail}
                      onChange={e => setForm(prev => ({ ...prev, ownerEmail: e.target.value }))}
                      placeholder="ahmet@gmail.com"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Telefon</label>
                    <input
                      type="tel" value={form.ownerPhone}
                      onChange={e => setForm(prev => ({ ...prev, ownerPhone: e.target.value }))}
                      placeholder="0555 123 45 67"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Şifre *</label>
                    <input
                      type="password" required minLength={6} value={form.password}
                      onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="En az 6 karakter"
                      style={inputStyle}
                    />
                  </div>

                  {error && (
                    <div style={{
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                      padding: 14, fontSize: 13, color: "rgba(255,255,255,0.7)", textAlign: "center"
                    }}>
                      {error}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 12 }}>
                    <button type="button" onClick={() => setStep(1)} style={{ ...btnStyle, background: "rgba(255,255,255,0.06)", color: "#fff", flex: 1 }}>
                      Geri
                    </button>
                    <button type="submit" disabled={loading} style={{ ...btnStyle, flex: 2, opacity: loading ? 0.5 : 1 }}>
                      {loading ? "Oluşturuluyor..." : "Stüdyo Oluştur"} {!loading && <Sparkles size={16} />}
                    </button>
                  </div>
                </>
              )}

            </div>
          </form>
        )}

        <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 24 }}>
          Zaten hesabınız var mı? <a href="/admin/login" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "underline" }}>Giriş yapın</a>
        </p>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block", fontSize: 12, fontWeight: 600,
  color: "rgba(255,255,255,0.5)", marginBottom: 6,
  textTransform: "uppercase", letterSpacing: "0.05em"
};

const inputStyle = {
  width: "100%", background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)", padding: "12px 14px",
  color: "#fff", fontSize: 14, outline: "none",
  transition: "border-color 0.2s"
};

const btnStyle = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  width: "100%", background: "#fff", color: "#000",
  border: "none", padding: "14px 24px", fontWeight: 700,
  fontSize: 14, cursor: "pointer", transition: "opacity 0.2s"
};
