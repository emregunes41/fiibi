"use client";

import { useState } from "react";
import { Sparkles, Camera, Phone, Mail, Upload, ArrowRight, Check } from "lucide-react";
import { updateSiteConfig } from "../core-actions";
import { CldUploadWidget } from "next-cloudinary";
import { useRouter } from "next/navigation";

export default function SetupWizard({ config, onComplete }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    businessName: config?.businessName || "",
    phone: config?.phone || "",
    email: config?.email || "",
    heroTitle: config?.heroTitle || "Anları Sanata\nDönüştürüyoruz",
    heroSubtitle: config?.heroSubtitle || "Premium Photography Service",
    logoUrl: config?.logoUrl || "",
  });
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const totalSteps = 3;

  async function handleFinish() {
    setSaving(true);
    const result = await updateSiteConfig({ ...config, ...form, setupCompleted: true });
    setSaving(false);
    if (result?.success) {
      window.location.href = "/admin/dashboard";
    }
  }

  const stepStyle = {
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
    padding: 32, maxWidth: 480, margin: "0 auto",
  };

  const inp = {
    width: "100%", boxSizing: "border-box",
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 0, padding: "14px 16px", fontSize: 14, color: "#fff",
    outline: "none", marginBottom: 16,
  };

  const label = {
    display: "block", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6,
  };

  return (
    <div style={{ minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      {/* Progress */}
      <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} style={{
            width: 40, height: 3,
            background: i + 1 <= step ? "#fff" : "rgba(255,255,255,0.1)",
            transition: "all 0.3s",
          }} />
        ))}
      </div>

      {/* Step 1: İşletme Bilgileri */}
      {step === 1 && (
        <div style={stepStyle}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <Sparkles size={28} style={{ color: "rgba(255,255,255,0.5)", marginBottom: 12 }} />
            <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 6 }}>Hoş Geldiniz! 🎉</h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>Birkaç bilgi ile stüdyonuzu kuralım.</p>
          </div>

          <label style={label}>İşletme Adı</label>
          <input type="text" value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })} style={inp} placeholder="Ahmet Photography" />

          <label style={label}>Telefon</label>
          <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inp} placeholder="0555 123 4567" />

          <label style={label}>E-posta</label>
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp} placeholder="info@studio.com" />

          <button type="button" onClick={() => setStep(2)} disabled={!form.businessName} style={{
            width: "100%", padding: "14px", background: form.businessName ? "#fff" : "rgba(255,255,255,0.06)",
            color: form.businessName ? "#000" : "rgba(255,255,255,0.3)", border: "none", fontSize: 13,
            fontWeight: 800, cursor: form.businessName ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            Devam <ArrowRight size={15} />
          </button>
        </div>
      )}

      {/* Step 2: Görsel Kimlik */}
      {step === 2 && (
        <div style={stepStyle}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <Camera size={28} style={{ color: "rgba(255,255,255,0.5)", marginBottom: 12 }} />
            <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 6 }}>Görsel Kimlik</h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>Logo yükleyin ve başlıkları ayarlayın.</p>
          </div>

          {/* Logo Upload */}
          <label style={label}>Logo (opsiyonel)</label>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            {form.logoUrl ? (
              <div style={{ width: 56, height: 56, border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                <img src={form.logoUrl} alt="Logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              </div>
            ) : (
              <div style={{ width: 56, height: 56, border: "1px dashed rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Upload size={18} style={{ color: "rgba(255,255,255,0.2)" }} />
              </div>
            )}
            <CldUploadWidget
              uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
              options={{ maxFiles: 1, resourceType: "image", folder: "logos" }}
              onSuccess={(result) => setForm({ ...form, logoUrl: result.info.secure_url })}
            >
              {({ open }) => (
                <button type="button" onClick={() => open()} style={{
                  padding: "8px 16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700, cursor: "pointer", borderRadius: 0,
                }}>Logo Yükle</button>
              )}
            </CldUploadWidget>
          </div>

          <label style={label}>Ana Başlık</label>
          <textarea value={form.heroTitle} onChange={e => setForm({ ...form, heroTitle: e.target.value })} style={{ ...inp, minHeight: 80, resize: "vertical" }} placeholder={"Anları Sanata\nDönüştürüyoruz"} />

          <label style={label}>Üst Başlık</label>
          <input type="text" value={form.heroSubtitle} onChange={e => setForm({ ...form, heroSubtitle: e.target.value })} style={inp} placeholder="Premium Photography Service" />

          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => setStep(1)} style={{
              flex: 1, padding: "14px", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)",
              border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>Geri</button>
            <button type="button" onClick={() => setStep(3)} style={{
              flex: 2, padding: "14px", background: "#fff", color: "#000", border: "none",
              fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>Devam <ArrowRight size={15} /></button>
          </div>
        </div>
      )}

      {/* Step 3: Özet & Tamamla */}
      {step === 3 && (
        <div style={stepStyle}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <Check size={28} style={{ color: "#22c55e", marginBottom: 12 }} />
            <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 6 }}>Hazırsınız!</h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>Bilgilerinizi kontrol edip tamamlayın.</p>
          </div>

          <div style={{ marginBottom: 24 }}>
            {[
              { label: "İşletme", value: form.businessName },
              { label: "Telefon", value: form.phone || "—" },
              { label: "E-posta", value: form.email || "—" },
              { label: "Başlık", value: form.heroTitle?.split("\n")[0] || "—" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{item.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{item.value}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => setStep(2)} style={{
              flex: 1, padding: "14px", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)",
              border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>Geri</button>
            <button type="button" onClick={handleFinish} disabled={saving} style={{
              flex: 2, padding: "14px", background: "#22c55e", color: "#000", border: "none",
              fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              {saving ? "Kaydediliyor..." : "Tamamla & Panele Git"} <Check size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
