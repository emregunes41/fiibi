"use client";

import { useState, useEffect } from "react";
import { Sparkles, Camera, Palette, Phone, Mail, MapPin, Upload, ArrowRight, Check, Globe, Instagram, MessageCircle, Type, ChevronRight, SkipForward, Store, Briefcase, Scissors, Heart, Stethoscope, GraduationCap, Dumbbell, Scale } from "lucide-react";
import { updateSiteConfig } from "../core-actions";
import { CldUploadWidget } from "next-cloudinary";
import { useRouter } from "next/navigation";
import { getBusinessType } from "@/lib/business-types";

const ACCENT_PRESETS = [
  { name: "Saf Beyaz", value: "#ffffff" },
  { name: "Altın", value: "#d4a853" },
  { name: "Gül", value: "#e8a0bf" },
  { name: "Okyanus", value: "#4fc3f7" },
  { name: "Zümrüt", value: "#66bb6a" },
  { name: "Leylak", value: "#b39ddb" },
  { name: "Mercan", value: "#ff8a65" },
  { name: "Buz", value: "#80deea" },
];

export default function SetupWizard({ config }) {
  const [step, setStep] = useState(0); // 0 = welcome, 1-4 = steps
  const [businessType, setBusinessType] = useState("photographer");
  const [tenantSlug, setTenantSlug] = useState("");

  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then(data => {
      if (data?.tenant?.businessType) setBusinessType(data.tenant.businessType);
      if (data?.tenant?.slug) setTenantSlug(data.tenant.slug);
    }).catch(() => {});
  }, []);

  const bt = getBusinessType(businessType);

  const [form, setForm] = useState({
    businessName: config?.businessName || "",
    phone: config?.phone || "",
    email: config?.email || "",
    heroTitle: config?.heroTitle || "",
    heroSubtitle: config?.heroSubtitle || "",
    logoUrl: config?.logoUrl || "",
    address: config?.address || "",
    instagram: config?.instagram || "",
    whatsapp: config?.whatsapp || "",
    accentColor: config?.accentColor || "#ffffff",
    footerTagline: config?.footerTagline || "",
  });
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const totalSteps = 4;

  async function handleSkip() {
    setSaving(true);
    await updateSiteConfig({ ...config, setupCompleted: true });
    setSaving(false);
    window.location.href = "/admin/dashboard";
  }

  async function handleFinish() {
    setSaving(true);
    const payload = { ...config, ...form, setupCompleted: true };
    // Set defaults if empty
    if (!payload.heroTitle) payload.heroTitle = bt.heroTitle || "Hoş Geldiniz";
    if (!payload.heroSubtitle) payload.heroSubtitle = bt.heroSub || "";
    const result = await updateSiteConfig(payload);
    setSaving(false);
    if (result?.success) {
      window.location.href = "/admin/dashboard";
    }
  }

  const sectorIcons = {
    photographer: Camera,
    beauty: Scissors,
    psychologist: Heart,
    dentist: Stethoscope,
    doctor: Stethoscope,
    lawyer: Scale,
    tutor: GraduationCap,
    fitness: Dumbbell,
    consultant: Briefcase,
  };
  const SectorIcon = sectorIcons[businessType] || Store;

  const stepStyle = {
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
    padding: "32px 28px", maxWidth: 520, width: "100%", margin: "0 auto",
  };

  const inp = {
    width: "100%", boxSizing: "border-box",
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 0, padding: "14px 16px", fontSize: 14, color: "#fff",
    outline: "none", marginBottom: 14, transition: "border-color 0.2s",
  };

  const label = {
    display: "flex", alignItems: "center", gap: 6,
    fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6,
  };

  const btnPrimary = {
    flex: 2, padding: "14px", background: "#fff", color: "#000", border: "none",
    fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex",
    alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s",
  };

  const btnSecondary = {
    flex: 1, padding: "14px", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)",
    border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
  };

  const skipBtn = {
    position: "fixed", top: 24, right: 24,
    padding: "8px 16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700, cursor: "pointer",
    display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s", zIndex: 100,
  };

  return (
    <div style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, position: "relative" }}>
      {/* GEÇ button — always visible */}
      <button type="button" onClick={handleSkip} disabled={saving} style={skipBtn}
        onMouseEnter={e => { e.target.style.color = "#fff"; e.target.style.borderColor = "rgba(255,255,255,0.3)"; }}
        onMouseLeave={e => { e.target.style.color = "rgba(255,255,255,0.4)"; e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
      >
        <SkipForward size={13} /> {saving ? "..." : "GEÇ"}
      </button>

      {/* Progress bar — visible after welcome */}
      {step > 0 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 32, alignItems: "center" }}>
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} style={{
              width: i + 1 <= step ? 48 : 32, height: 3,
              background: i + 1 <= step ? "#fff" : "rgba(255,255,255,0.08)",
              transition: "all 0.4s ease",
            }} />
          ))}
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginLeft: 8, fontWeight: 700 }}>
            {step}/{totalSteps}
          </span>
        </div>
      )}

      {/* ═══════════ STEP 0: Welcome ═══════════ */}
      {step === 0 && (
        <div style={{ textAlign: "center", maxWidth: 520, animation: "fadeIn 0.5s ease" }}>
          <div style={{
            width: 72, height: 72, margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          }}>
            <SectorIcon size={32} style={{ color: "rgba(255,255,255,0.6)" }} />
          </div>

          <h1 style={{ fontSize: "clamp(1.4rem, 5vw, 2rem)", fontWeight: 900, letterSpacing: "-0.04em", marginBottom: 8 }}>
            fiibi'ye Hoş Geldiniz! 🎉
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, lineHeight: 1.7, marginBottom: 32, maxWidth: 400, margin: "0 auto 32px" }}>
            Birkaç adımda işletmenizi online'a taşıyalım.
            Müşterileriniz sizin markanızla karşılaşacak.
          </p>

          {/* Feature cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 32, textAlign: "left" }}>
            {[
              { icon: <Store size={16} />, title: "İşletme Bilgileri", desc: "Ad, telefon, e-posta" },
              { icon: <Camera size={16} />, title: "Görsel Kimlik", desc: "Logo ve marka rengi" },
              { icon: <Type size={16} />, title: "Ana Sayfa", desc: "Başlık ve alt metin" },
              { icon: <Globe size={16} />, title: "Sosyal Medya", desc: "Instagram, WhatsApp" },
            ].map((f, i) => (
              <div key={i} style={{
                padding: "14px 16px", background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{ color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>{f.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{f.title}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{f.desc}</div>
              </div>
            ))}
          </div>

          {tenantSlug && (
            <div style={{
              padding: "10px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              marginBottom: 24, fontSize: 12, color: "rgba(255,255,255,0.5)",
            }}>
              Siteniz: <span style={{ color: "#fff", fontWeight: 700 }}>{tenantSlug}.fiibi.co</span>
            </div>
          )}

          <button type="button" onClick={() => setStep(1)} style={{
            ...btnPrimary, width: "100%", padding: "16px", fontSize: 14, gap: 10,
          }}>
            Kuruluma Başla <ArrowRight size={16} />
          </button>

          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 16 }}>
            Tüm ayarları daha sonra "Ayarlar" sekmesinden değiştirebilirsiniz.
          </p>
        </div>
      )}

      {/* ═══════════ STEP 1: İşletme Bilgileri ═══════════ */}
      {step === 1 && (
        <div style={stepStyle}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <Store size={24} style={{ color: "rgba(255,255,255,0.5)", marginBottom: 10 }} />
            <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 4 }}>İşletme Bilgileri</h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Müşterilerinizin sizi bulmasını kolaylaştırın.</p>
          </div>

          <label style={label}><Store size={11} /> İşletme Adı *</label>
          <input type="text" value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })} style={inp} placeholder={bt.name + " Stüdyo"} autoFocus />

          <label style={label}><Phone size={11} /> Telefon</label>
          <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inp} placeholder="0555 123 4567" />

          <label style={label}><Mail size={11} /> E-posta</label>
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp} placeholder="info@isletme.com" />

          <label style={label}><MapPin size={11} /> Adres (opsiyonel)</label>
          <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={inp} placeholder="İstanbul, Kadıköy" />

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button type="button" onClick={() => setStep(0)} style={btnSecondary}>Geri</button>
            <button type="button" onClick={() => setStep(2)} disabled={!form.businessName} style={{
              ...btnPrimary, opacity: form.businessName ? 1 : 0.4,
              cursor: form.businessName ? "pointer" : "not-allowed",
            }}>
              Devam <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════ STEP 2: Görsel Kimlik ═══════════ */}
      {step === 2 && (
        <div style={stepStyle}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <Palette size={24} style={{ color: "rgba(255,255,255,0.5)", marginBottom: 10 }} />
            <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 4 }}>Görsel Kimlik</h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Markanızı yansıtan logo ve renk seçin.</p>
          </div>

          {/* Logo Upload */}
          <label style={label}><Camera size={11} /> Logo</label>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            {form.logoUrl ? (
              <div style={{
                width: 64, height: 64, border: "1px solid rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                background: "rgba(255,255,255,0.04)",
              }}>
                <img src={form.logoUrl} alt="Logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              </div>
            ) : (
              <div style={{
                width: 64, height: 64, border: "1px dashed rgba(255,255,255,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(255,255,255,0.02)",
              }}>
                <Upload size={20} style={{ color: "rgba(255,255,255,0.15)" }} />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <CldUploadWidget
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                options={{ maxFiles: 1, resourceType: "image", folder: "logos" }}
                onSuccess={(result) => setForm({ ...form, logoUrl: result.info.secure_url })}
              >
                {({ open }) => (
                  <button type="button" onClick={() => open()} style={{
                    padding: "10px 20px", background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 700, cursor: "pointer",
                    width: "100%",
                  }}>
                    {form.logoUrl ? "Değiştir" : "Logo Yükle"}
                  </button>
                )}
              </CldUploadWidget>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 6 }}>PNG/SVG önerilir · Şeffaf arka plan idealdir</p>
            </div>
          </div>

          {/* Accent Color Picker */}
          <label style={label}><Palette size={11} /> Marka Rengi</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            {ACCENT_PRESETS.map(c => (
              <button key={c.value} type="button" onClick={() => setForm({ ...form, accentColor: c.value })} style={{
                width: 36, height: 36, background: c.value, border: form.accentColor === c.value ? "2px solid #fff" : "2px solid transparent",
                cursor: "pointer", transition: "all 0.2s", outline: "none",
                boxShadow: form.accentColor === c.value ? `0 0 12px ${c.value}40` : "none",
              }} title={c.name} />
            ))}
            <div style={{ position: "relative", width: 36, height: 36 }}>
              <input type="color" value={form.accentColor} onChange={e => setForm({ ...form, accentColor: e.target.value })} style={{
                width: 36, height: 36, border: "none", cursor: "pointer", padding: 0, background: "none",
              }} title="Özel renk seç" />
            </div>
          </div>

          {/* Footer Tagline */}
          <label style={label}><Type size={11} /> Slogan (opsiyonel)</label>
          <input type="text" value={form.footerTagline} onChange={e => setForm({ ...form, footerTagline: e.target.value })} style={inp} placeholder="Profesyonel hizmetin adresi" />

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button type="button" onClick={() => setStep(1)} style={btnSecondary}>Geri</button>
            <button type="button" onClick={() => setStep(3)} style={btnPrimary}>
              Devam <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════ STEP 3: Ana Sayfa & Sosyal ═══════════ */}
      {step === 3 && (
        <div style={stepStyle}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <Globe size={24} style={{ color: "rgba(255,255,255,0.5)", marginBottom: 10 }} />
            <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 4 }}>Sayfa & Sosyal Medya</h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Ziyaretçilerinizi karşılayan ilk izlenim.</p>
          </div>

          <label style={label}><Type size={11} /> Ana Başlık *</label>
          <textarea
            value={form.heroTitle || ""}
            onChange={e => setForm({ ...form, heroTitle: e.target.value })}
            style={{ ...inp, minHeight: 72, resize: "vertical", lineHeight: 1.5 }}
            placeholder={bt.heroTitle || "Ana başlık metni..."}
          />

          <label style={label}><Type size={11} /> Üst Başlık</label>
          <input type="text"
            value={form.heroSubtitle || ""}
            onChange={e => setForm({ ...form, heroSubtitle: e.target.value })}
            style={inp}
            placeholder={bt.heroSub || "Kısa tanıtım cümlesi"}
          />

          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 0 18px" }} />

          <label style={label}><Instagram size={11} /> Instagram</label>
          <input type="text" value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} style={inp} placeholder="@kullanici_adi" />

          <label style={label}><MessageCircle size={11} /> WhatsApp Numarası</label>
          <input type="tel" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} style={inp} placeholder="905551234567" />

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button type="button" onClick={() => setStep(2)} style={btnSecondary}>Geri</button>
            <button type="button" onClick={() => setStep(4)} style={btnPrimary}>
              Devam <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════ STEP 4: Özet & Tamamla ═══════════ */}
      {step === 4 && (
        <div style={stepStyle}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{
              width: 56, height: 56, margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
            }}>
              <Check size={26} style={{ color: "#22c55e" }} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 4 }}>Hazırsınız! 🎉</h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Son bir göz atın, sorun yoksa tamamlayalım.</p>
          </div>

          {/* Summary */}
          <div style={{ marginBottom: 24 }}>
            {[
              { label: "İşletme", value: form.businessName, required: true },
              { label: "Telefon", value: form.phone },
              { label: "E-posta", value: form.email },
              { label: "Adres", value: form.address },
              { label: "Başlık", value: form.heroTitle?.split("\n")[0] },
              { label: "Instagram", value: form.instagram },
              { label: "WhatsApp", value: form.whatsapp },
              { label: "Slogan", value: form.footerTagline },
            ].map((item, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>{item.label}</span>
                <span style={{
                  fontSize: 12, fontWeight: 700, maxWidth: 280,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  color: item.value ? "#fff" : "rgba(255,255,255,0.15)",
                }}>
                  {item.value || "—"}
                </span>
              </div>
            ))}

            {/* Color + Logo preview */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)",
            }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>Marka Rengi</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 18, height: 18, background: form.accentColor, border: "1px solid rgba(255,255,255,0.2)" }} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>{form.accentColor}</span>
              </div>
            </div>
            {form.logoUrl && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 0",
              }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>Logo</span>
                <img src={form.logoUrl} alt="Logo" style={{ height: 28, maxWidth: 100, objectFit: "contain" }} />
              </div>
            )}
          </div>

          {/* Info box */}
          <div style={{
            padding: "12px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
            marginBottom: 20, fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.6,
          }}>
            💡 Tüm bu ayarları daha sonra <strong style={{ color: "rgba(255,255,255,0.6)" }}>Ayarlar</strong> sekmesinden istediğiniz zaman güncelleyebilirsiniz.
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => setStep(3)} style={btnSecondary}>Geri</button>
            <button type="button" onClick={handleFinish} disabled={saving} style={{
              ...btnPrimary, background: "#22c55e", flex: 2,
            }}>
              {saving ? "Kaydediliyor..." : "Tamamla & Panele Git"} <Check size={15} />
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input:focus, textarea:focus {
          border-color: rgba(255,255,255,0.25) !important;
        }
      `}</style>
    </div>
  );
}
