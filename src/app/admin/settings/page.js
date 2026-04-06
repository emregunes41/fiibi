"use client";

import { useState, useEffect } from "react";
import { getSiteConfig, updateSiteConfig, uploadHeroBg, getDiscountCodes, createDiscountCode, deleteDiscountCode, toggleDiscountCode } from "../core-actions";
import { 
  Save, Home, Phone, Mail, Instagram, MessageCircle, MapPin,
  Type, Sparkles, Layout, Globe, CheckCircle2, AlertCircle, Loader2, Banknote, Monitor, Upload, Palette, FileText, Tag, Trash2, Plus, Power
} from "lucide-react";

const inp = {
  width: "100%", boxSizing: "border-box",
  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12, padding: "14px 16px", fontSize: 14, color: "#fff",
  outline: "none", transition: "all 0.2s",
};

const inpIcon = { ...inp, paddingLeft: 44 };

const label = {
  display: "block", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)",
  textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, paddingLeft: 2,
};

const sectionCard = {
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 16, padding: "24px", marginBottom: 16,
};

const sectionHeader = (Icon, title, desc) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 24 }}>
    <div style={{
      width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center",
      justifyContent: "center", flexShrink: 0,
    }}>
      <Icon size={16} style={{ color: "rgba(255,255,255,0.6)" }} />
    </div>
    <div>
      <h2 style={{ fontSize: 14, fontWeight: 800, color: "#fff", margin: "0 0 3px", letterSpacing: "0.02em" }}>{title}</h2>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>{desc}</p>
    </div>
  </div>
);

export default function SettingsPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);

  // Discount codes
  const [discountCodes, setDiscountCodes] = useState([]);
  const [dcForm, setDcForm] = useState({ code: "", discountPercent: "", maxUses: "", description: "" });
  const [dcLoading, setDcLoading] = useState(false);
  const [dcMessage, setDcMessage] = useState("");

  useEffect(() => {
    async function loadConfig() {
      const data = await getSiteConfig();
      if (data) setConfig(data);
      setLoading(false);
    }
    async function loadDiscountCodes() {
      const codes = await getDiscountCodes();
      setDiscountCodes(codes);
    }
    loadConfig();
    loadDiscountCodes();
  }, []);

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage("");
    setIsError(false);
    const res = await updateSiteConfig(config);
    if (res.success) {
      setMessage("Ayarlar başarıyla güncellendi.");
      setTimeout(() => setMessage(""), 3000);
    } else {
      setMessage("Hata: " + res.error);
      setIsError(true);
    }
    setSaving(false);
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <Loader2 size={24} style={{ color: "rgba(255,255,255,0.3)", animation: "spin 1s linear infinite" }} />
    </div>
  );

  if (!config) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: 24 }}>
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "40px 32px", textAlign: "center", maxWidth: 360 }}>
        <AlertCircle size={32} style={{ color: "rgba(255,68,68,0.5)", margin: "0 auto 12px" }} />
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Bağlantı Kesildi</h2>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 20 }}>Ayarları yükleyemiyoruz.</p>
        <button onClick={() => window.location.reload()} style={{ background: "#fff", color: "#000", border: "none", borderRadius: 10, padding: "10px 24px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          Yenile
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <Globe size={14} style={{ color: "rgba(255,255,255,0.35)" }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Anasayfa Ayarları</span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em", margin: 0 }}>Site Yapılandırması</h1>
      </div>

      <form onSubmit={handleSubmit}>

        {/* 1. Hero Başlıkları */}
        <div style={sectionCard}>
          {sectionHeader(Type, "Sinematik Başlıklar", "Anasayfada görünen büyük başlık ve slogan.")}

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={label}>Hero Ana Başlık</label>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>Alt satır için Enter</span>
            </div>
            <textarea
              value={config.heroTitle}
              onChange={(e) => setConfig({ ...config, heroTitle: e.target.value })}
              style={{ ...inp, minHeight: 100, resize: "vertical", lineHeight: 1.6 }}
              placeholder={"Anları Sanata\nDönüştürüyoruz"}
              required
            />
          </div>

          <div>
            <label style={label}>Hero Üst Başlık (Küçük)</label>
            <input
              type="text"
              value={config.heroSubtitle}
              onChange={(e) => setConfig({ ...config, heroSubtitle: e.target.value })}
              style={inp}
              placeholder="Premium Photography Service"
              required
            />
          </div>
        </div>

        {/* 2. Preview Card */}
        <div style={{ ...sectionCard, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Layout size={13} style={{ color: "rgba(255,255,255,0.35)" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Canlı Önizleme</span>
          </div>
          <div style={{
            background: "#000", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)",
            padding: "40px 24px", textAlign: "center", position: "relative", overflow: "hidden",
          }}>
            {/* Glow */}
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 200, height: 200, background: "rgba(255,255,255,0.04)", borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <span style={{ display: "block", fontSize: 8, textTransform: "uppercase", letterSpacing: "0.4em", color: "rgba(255,255,255,0.35)", marginBottom: 10 }}>
                {config.heroSubtitle || "Premium Photography Service"}
              </span>
              <h1 style={{ fontSize: 22, fontFamily: "Georgia, serif", color: "#fff", lineHeight: 1.4, margin: "0 0 14px", whiteSpace: "pre-line" }}>
                {config.heroTitle || "Anları Sanata\nDönüştürüyoruz"}
              </h1>
              <div style={{ width: 40, height: 1, background: "rgba(255,255,255,0.2)", margin: "0 auto" }} />
            </div>
          </div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 12, fontStyle: "italic", lineHeight: 1.5 }}>
            * Başlıktaki enter tuşu anasayfada tasarımın dengeli durmasını sağlar.
          </p>
        </div>

        {/* 2.5 Hero Arka Plan */}
        <div style={sectionCard}>
          {sectionHeader(Monitor, "Arka Plan Ayarı", "Anasayfadaki hero bölümünün arka planını değiştirin.")}

          {/* Type Selector */}
          <div style={{ marginBottom: 20 }}>
            <label style={label}>Arka Plan Türü</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { value: "video", label: "Video", icon: "🎬" },
                { value: "image", label: "Fotoğraf", icon: "🖼️" },
                { value: "color", label: "Düz Renk", icon: "🎨" },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setConfig({ ...config, heroBgType: opt.value })}
                  style={{
                    flex: 1, padding: "12px 8px", borderRadius: 10, border: "1px solid",
                    borderColor: config.heroBgType === opt.value ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)",
                    background: config.heroBgType === opt.value ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
                    color: config.heroBgType === opt.value ? "#fff" : "rgba(255,255,255,0.5)",
                    cursor: "pointer", fontSize: 12, fontWeight: 700, textAlign: "center",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{opt.icon}</div>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Video or Image Upload */}
          {(config.heroBgType === "video" || config.heroBgType === "image") && (
            <div style={{ marginBottom: 16 }}>
              <label style={label}>{config.heroBgType === "video" ? "Video Dosyası" : "Fotoğraf"} Yükle</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Upload size={16} style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
                <input
                  type="file"
                  accept={config.heroBgType === "video" ? "video/*" : "image/*"}
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setUploadingBg(true);
                    const fd = new FormData();
                    fd.append('file', file);
                    const res = await uploadHeroBg(fd);
                    if (res.success) {
                      setConfig({ ...config, heroBgUrl: res.url });
                    } else {
                      alert("Yükleme hatası: " + res.error);
                    }
                    setUploadingBg(false);
                  }}
                  style={{ ...inp, cursor: "pointer", flex: 1 }}
                />
              </div>
              {uploadingBg && <p style={{ fontSize: 11, color: "#facc15", marginTop: 6 }}>Yükleniyor...</p>}
              {config.heroBgUrl && (
                <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                  Mevcut: <span style={{ color: "#4ade80" }}>{config.heroBgUrl}</span>
                </div>
              )}
            </div>
          )}

          {/* Color Picker */}
          {config.heroBgType === "color" && (
            <div style={{ marginBottom: 16 }}>
              <label style={label}>Arka Plan Rengi</label>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <input
                  type="color"
                  value={config.heroBgColor || "#000000"}
                  onChange={(e) => setConfig({ ...config, heroBgColor: e.target.value })}
                  style={{ width: 48, height: 48, border: "none", borderRadius: 10, cursor: "pointer", background: "none" }}
                />
                <input
                  type="text"
                  value={config.heroBgColor || "#000000"}
                  onChange={(e) => setConfig({ ...config, heroBgColor: e.target.value })}
                  style={{ ...inp, maxWidth: 160 }}
                  placeholder="#000000"
                />
                <div style={{ width: 48, height: 48, borderRadius: 10, background: config.heroBgColor || "#000", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
            </div>
          )}
        </div>

        {/* 3. Stüdyo & İletişim */}
        <div style={sectionCard}>
          {sectionHeader(Home, "Stüdyo & İletişim", "Alt panelde yer alan adres ve iletişim detayları.")}

          <div style={{ marginBottom: 16 }}>
            <label style={label}>Stüdyo Adresi</label>
            <input
              type="text"
              value={config.address}
              onChange={(e) => setConfig({ ...config, address: e.target.value })}
              style={inp}
              placeholder="Moda, Kadıköy / İstanbul"
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={label}>İletişim No</label>
              <div style={{ position: "relative" }}>
                <Phone size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
                <input
                  type="text"
                  value={config.phone}
                  onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                  style={inpIcon}
                  placeholder="+90 5XX XXX XX XX"
                  required
                />
              </div>
            </div>
            <div>
              <label style={label}>E-Posta</label>
              <div style={{ position: "relative" }}>
                <Mail size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
                <input
                  type="email"
                  value={config.email}
                  onChange={(e) => setConfig({ ...config, email: e.target.value })}
                  style={inpIcon}
                  placeholder="hello@pinowed.com"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Sosyal Kanallar */}
        <div style={sectionCard}>
          {sectionHeader(Instagram, "Sosyal Kanallar", "Müşterilerinizin size ulaşabileceği linkler.")}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={label}>Instagram</label>
              <div style={{ position: "relative" }}>
                <Instagram size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
                <input
                  type="text"
                  value={config.instagram}
                  onChange={(e) => setConfig({ ...config, instagram: e.target.value })}
                  style={inpIcon}
                  placeholder="https://instagram.com/pinowed"
                />
              </div>
            </div>
            <div>
              <label style={label}>WhatsApp</label>
              <div style={{ position: "relative" }}>
                <MessageCircle size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
                <input
                  type="text"
                  value={config.whatsapp}
                  onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })}
                  style={inpIcon}
                  placeholder="905550000000"
                />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={label}>Google Maps Yol Tarifi Linki</label>
            <div style={{ position: "relative" }}>
              <MapPin size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
              <input
                type="text"
                value={config.googleMapsUrl || ""}
                onChange={(e) => setConfig({ ...config, googleMapsUrl: e.target.value })}
                style={inpIcon}
                placeholder="https://maps.app.goo.gl/..."
              />
            </div>
          </div>
        </div>

        {/* 5. Bildirim Kanalları */}
        <div style={sectionCard}>
          {sectionHeader(Mail, "Bildirim Kanalları", "Müşterilere gönderilecek bildirimlerin kanallarını yönetin.")}

          {/* Toggle Switches */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {/* Email Toggle */}
            <div style={{
              background: config.emailEnabled ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${config.emailEnabled ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 14, padding: "18px 16px", cursor: "pointer", transition: "all 0.2s",
            }}
              onClick={() => setConfig({ ...config, emailEnabled: !config.emailEnabled })}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Mail size={16} style={{ color: config.emailEnabled ? "#4ade80" : "rgba(255,255,255,0.3)" }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: config.emailEnabled ? "#fff" : "rgba(255,255,255,0.5)" }}>E-Posta</span>
                </div>
                <div style={{
                  width: 40, height: 22, borderRadius: 11, position: "relative",
                  background: config.emailEnabled ? "#4ade80" : "rgba(255,255,255,0.15)", transition: "all 0.2s",
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%", background: "#fff",
                    position: "absolute", top: 2, transition: "all 0.2s",
                    left: config.emailEnabled ? 20 : 2,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                  }} />
                </div>
              </div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                Resend API ile e-posta bildirimleri
              </p>
            </div>

            {/* SMS Toggle */}
            <div style={{
              background: config.smsEnabled ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${config.smsEnabled ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 14, padding: "18px 16px", cursor: "pointer", transition: "all 0.2s",
            }}
              onClick={() => setConfig({ ...config, smsEnabled: !config.smsEnabled })}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Phone size={16} style={{ color: config.smsEnabled ? "#4ade80" : "rgba(255,255,255,0.3)" }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: config.smsEnabled ? "#fff" : "rgba(255,255,255,0.5)" }}>SMS</span>
                </div>
                <div style={{
                  width: 40, height: 22, borderRadius: 11, position: "relative",
                  background: config.smsEnabled ? "#4ade80" : "rgba(255,255,255,0.15)", transition: "all 0.2s",
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%", background: "#fff",
                    position: "absolute", top: 2, transition: "all 0.2s",
                    left: config.smsEnabled ? 20 : 2,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                  }} />
                </div>
              </div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                Netgsm API ile SMS bildirimleri
              </p>
            </div>
          </div>

          {/* Resend API - E-posta aktifken göster */}
          {config.emailEnabled && (
            <div style={{
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12, padding: 20, marginBottom: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Mail size={13} style={{ color: "rgba(255,255,255,0.35)" }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Resend API (E-posta)</span>
              </div>
              <div>
                <label style={label}>API Key</label>
                <input
                  type="password"
                  value={config.resendApiKey || ""}
                  onChange={(e) => setConfig({ ...config, resendApiKey: e.target.value })}
                  style={inp}
                  placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxx"
                />
              </div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 10, lineHeight: 1.6 }}>
                📖 <a href="https://resend.com" target="_blank" rel="noopener" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "underline" }}>resend.com</a> → API Keys bölümünden alabilirsiniz. Boş bırakırsanız .env dosyasındaki key kullanılır.
              </p>
            </div>
          )}

          {/* Netgsm API - SMS aktifken göster */}
          {config.smsEnabled && (
            <div style={{
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12, padding: 20, marginBottom: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Phone size={13} style={{ color: "rgba(255,255,255,0.35)" }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Netgsm API (SMS)</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={label}>Kullanıcı Kodu</label>
                  <input type="text" value={config.netgsmUsercode || ""}
                    onChange={(e) => setConfig({ ...config, netgsmUsercode: e.target.value })}
                    style={inp} placeholder="850XXXXXXX"
                  />
                </div>
                <div>
                  <label style={label}>Şifre</label>
                  <input type="password" value={config.netgsmPassword || ""}
                    onChange={(e) => setConfig({ ...config, netgsmPassword: e.target.value })}
                    style={inp} placeholder="••••••••"
                  />
                </div>
                <div>
                  <label style={label}>Mesaj Başlığı</label>
                  <input type="text" value={config.netgsmMsgHeader || ""}
                    onChange={(e) => setConfig({ ...config, netgsmMsgHeader: e.target.value })}
                    style={inp} placeholder="PINOWED"
                  />
                </div>
              </div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 10, lineHeight: 1.6 }}>
                📖 <a href="https://www.netgsm.com.tr" target="_blank" rel="noopener" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "underline" }}>netgsm.com.tr</a> → Ayarlar → API Bilgileri bölümünden alabilirsiniz.
              </p>
            </div>
          )}

          {/* Bildirim Tercihleri - Checkbox'lı */}
          <div style={{ marginTop: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Bildirim Tercihleri</p>
            {[
              { key: "notifyReservation", icon: "📅", text: "Rezervasyon onayı", desc: "Rezervasyon oluşturulduğunda" },
              { key: "notifyPayment", icon: "💰", text: "Ödeme alındı", desc: "Ödeme başarılı olduğunda" },
              { key: "notifyReminder", icon: "⏰", text: "Etkinlik hatırlatma", desc: "Çekime 1 hafta kala" },
              { key: "notifyPhotosReady", icon: "📸", text: "Fotoğraflar hazır", desc: "Fotoğraflar teslim edildiğinde" },
            ].map((item) => (
              <div
                key={item.key}
                onClick={() => setConfig({ ...config, [item.key]: !config[item.key] })}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                  marginBottom: 6, borderRadius: 12, cursor: "pointer", transition: "all 0.2s",
                  background: config[item.key] ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.01)",
                  border: `1px solid ${config[item.key] ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)"}`,
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                  border: `2px solid ${config[item.key] ? "#4ade80" : "rgba(255,255,255,0.2)"}`,
                  background: config[item.key] ? "#4ade80" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s",
                }}>
                  {config[item.key] && (
                    <CheckCircle2 size={12} style={{ color: "#000" }} />
                  )}
                </div>

                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: config[item.key] ? "#fff" : "rgba(255,255,255,0.4)", transition: "all 0.2s" }}>{item.text}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{item.desc}</div>
                </div>

                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  {config.emailEnabled && config[item.key] && <span style={{ fontSize: 8, background: "rgba(74,222,128,0.15)", color: "#4ade80", padding: "2px 6px", borderRadius: 5, fontWeight: 700 }}>EMAIL</span>}
                  {config.smsEnabled && config[item.key] && <span style={{ fontSize: 8, background: "rgba(96,165,250,0.15)", color: "#60a5fa", padding: "2px 6px", borderRadius: 5, fontWeight: 700 }}>SMS</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Rezervasyon Sözleşmesi */}
        <div style={sectionCard}>
          {sectionHeader(FileText, "Rezervasyon Sözleşmesi", "Müşterinin ödeme öncesi onaylaması gereken sözleşme metni.")}

          <div>
            <label style={label}>Sözleşme İçeriği</label>
            <textarea
              value={config.contractText || ""}
              onChange={(e) => setConfig({ ...config, contractText: e.target.value })}
              style={{
                ...inp,
                minHeight: 200,
                resize: "vertical",
                lineHeight: 1.7,
                fontFamily: "inherit",
              }}
              placeholder={"Örnek:\n\nRezervasyonunuzu onaylayarak aşağıdaki koşulları kabul etmiş olursunuz:\n\n1. Çekim tarihi değişikliği en geç 7 gün öncesinden bildirilmelidir.\n2. İptal durumunda kapora iade edilmez.\n3. Fotoğraf teslim süresi paket detaylarında belirtilmiştir."}
            />
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 8, lineHeight: 1.6 }}>
              💡 Boş bırakırsanız sözleşme adımı gösterilmez. Doldurursanız müşteri ödeme öncesi bu metni onaylamak zorundadır.
            </p>
          </div>
        </div>

        {/* İndirim Kodları Section */}
        <div style={sectionCard}>
          {sectionHeader(Tag, "İndirim Kodları", "Müşterilere verebileceğiniz indirim kuponları")}

          {/* Create new code */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={{ flex: 2, minWidth: 120 }}>
                <label style={label}>Kod</label>
                <input
                  value={dcForm.code}
                  onChange={(e) => setDcForm(p => ({ ...p, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))}
                  placeholder="Ör: YENIYIL25"
                  style={inp}
                  maxLength={20}
                />
              </div>
              <div style={{ flex: 1, minWidth: 80 }}>
                <label style={label}>İndirim %</label>
                <input
                  type="number"
                  value={dcForm.discountPercent}
                  onChange={(e) => setDcForm(p => ({ ...p, discountPercent: e.target.value }))}
                  placeholder="10"
                  style={inp}
                  min={1} max={100}
                />
              </div>
              <div style={{ flex: 1, minWidth: 80 }}>
                <label style={label}>Max Kullanım</label>
                <input
                  type="number"
                  value={dcForm.maxUses}
                  onChange={(e) => setDcForm(p => ({ ...p, maxUses: e.target.value }))}
                  placeholder="0 = Sınırsız"
                  style={inp}
                  min={0}
                />
              </div>
            </div>
            <div>
              <label style={label}>Açıklama (Opsiyonel)</label>
              <input
                value={dcForm.description}
                onChange={(e) => setDcForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Ör: Yeni yıl kampanyası"
                style={inp}
              />
            </div>
            <button
              type="button"
              disabled={dcLoading || !dcForm.code || !dcForm.discountPercent}
              onClick={async () => {
                setDcLoading(true);
                setDcMessage("");
                const res = await createDiscountCode(dcForm);
                if (res.success) {
                  setDcForm({ code: "", discountPercent: "", maxUses: "", description: "" });
                  setDiscountCodes(await getDiscountCodes());
                  setDcMessage("✅ Kod oluşturuldu!");
                  setTimeout(() => setDcMessage(""), 3000);
                } else {
                  setDcMessage("❌ " + res.error);
                }
                setDcLoading(false);
              }}
              style={{
                padding: "12px 20px", borderRadius: 10, border: "none",
                background: (dcForm.code && dcForm.discountPercent) ? "#4ade80" : "rgba(255,255,255,0.06)",
                color: (dcForm.code && dcForm.discountPercent) ? "#000" : "rgba(255,255,255,0.3)",
                fontWeight: 700, fontSize: 12, cursor: (dcForm.code && dcForm.discountPercent) ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <Plus size={14} />
              {dcLoading ? "Oluşturuluyor..." : "İndirim Kodu Ekle"}
            </button>
            {dcMessage && <div style={{ fontSize: 12, fontWeight: 600, color: dcMessage.includes("✅") ? "#4ade80" : "#f87171" }}>{dcMessage}</div>}
          </div>

          {/* Existing codes */}
          {discountCodes.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Mevcut Kodlar ({discountCodes.length})</div>
              {discountCodes.map((dc) => (
                <div key={dc.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                  padding: "12px 14px", borderRadius: 12,
                  background: dc.isActive ? "rgba(74,222,128,0.04)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${dc.isActive ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.06)"}`,
                  opacity: dc.isActive ? 1 : 0.5,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#fff", fontFamily: "monospace", letterSpacing: "0.05em" }}>{dc.code}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
                        background: dc.isActive ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.06)",
                        color: dc.isActive ? "#4ade80" : "rgba(255,255,255,0.3)",
                      }}>
                        %{dc.discountPercent} İndirim
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                      {dc.description && <span>{dc.description} · </span>}
                      Kullanım: {dc.usedCount}{dc.maxUses > 0 ? `/${dc.maxUses}` : " (Sınırsız)"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={async () => {
                        await toggleDiscountCode(dc.id);
                        setDiscountCodes(await getDiscountCodes());
                      }}
                      title={dc.isActive ? "Pasifleştir" : "Aktifleştir"}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: dc.isActive ? "#4ade80" : "rgba(255,255,255,0.25)" }}
                    >
                      <Power size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm("Bu kodu silmek istediğinize emin misiniz?")) {
                          await deleteDiscountCode(dc.id);
                          setDiscountCodes(await getDiscountCodes());
                        }
                      }}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "rgba(255,68,68,0.5)" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Status Message */}
        {message && (
          <div style={{
            padding: "12px 16px", borderRadius: 12, display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
            background: isError ? "rgba(239,68,68,0.08)" : "rgba(74,222,128,0.08)",
            border: `1px solid ${isError ? "rgba(239,68,68,0.15)" : "rgba(74,222,128,0.15)"}`,
            color: isError ? "#f87171" : "#4ade80",
          }}>
            {isError ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
            <span style={{ fontSize: 12, fontWeight: 700 }}>{message}</span>
          </div>
        )}

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          style={{
            width: "100%", padding: 16, borderRadius: 14, border: "none",
            background: "#fff", color: "#000", fontWeight: 800, fontSize: 13,
            textTransform: "uppercase", letterSpacing: "0.08em",
            cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.5 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            transition: "all 0.2s", marginBottom: 40,
          }}
        >
          {saving ? (
            <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <Save size={16} />
          )}
          {saving ? "Kaydediliyor..." : "Değişiklikleri Uygula"}
        </button>

      </form>
    </div>
  );
}
