"use client";

import { useState, useEffect } from "react";
import { getSiteConfig, updateSiteConfig, uploadHeroBg, getDiscountCodes, createDiscountCode, deleteDiscountCode, toggleDiscountCode } from "../core-actions";
import { getBanners, createBanner, updateBanner, deleteBanner, reorderBanners } from "../banner-actions";
import { getContentBlocks, createContentBlock, updateContentBlock, deleteContentBlock } from "../content-actions";
import { sendTestSMS } from "../test-sms-action";
import { CldUploadWidget } from "next-cloudinary";
import { 
  Save, Home, Phone, Mail, Instagram, MessageCircle, MapPin,
  Type, Sparkles, Layout, Globe, CheckCircle2, AlertCircle, Loader2, Banknote, Monitor, Upload, Palette, FileText, Tag, Trash2, Plus, Power, Bot, Image as ImageIcon, ArrowUp, ArrowDown, Eye, EyeOff, UploadCloud
} from "lucide-react";

const inp = {
  width: "100%", boxSizing: "border-box",
  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 0, padding: "14px 16px", fontSize: 14, color: "#fff",
  outline: "none", transition: "all 0.2s",
};

const inpIcon = { ...inp, paddingLeft: 44 };

const label = {
  display: "block", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)",
  textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, paddingLeft: 2,
};

const sectionCard = {
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 0, padding: "24px", marginBottom: 16,
};

const sectionHeader = (Icon, title, desc) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 24 }}>
    <div style={{
      width: 36, height: 36, borderRadius: 0, background: "rgba(255,255,255,0.06)",
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
  const [activeTab, setActiveTab] = useState("genel");

  // Discount codes
  const [discountCodes, setDiscountCodes] = useState([]);
  const [dcForm, setDcForm] = useState({ code: "", discountPercent: "", maxUses: "", description: "" });
  const [dcLoading, setDcLoading] = useState(false);
  const [dcMessage, setDcMessage] = useState("");

  // Banners
  const [banners, setBanners] = useState([]);
  const [bannerForm, setBannerForm] = useState({ title: "", subtitle: "", link: "" });
  const [bannerUploading, setBannerUploading] = useState(false);
  const [pendingBannerUrl, setPendingBannerUrl] = useState("");
  const [pendingMediaType, setPendingMediaType] = useState("image");

  // SMS Test
  const [testPhone, setTestPhone] = useState("");
  const [testSmsResult, setTestSmsResult] = useState(null);
  const [testSmsLoading, setTestSmsLoading] = useState(false);

  // Content Blocks
  const [contentBlocks, setContentBlocks] = useState([]);
  const [cbForm, setCbForm] = useState({ title: "", description: "", imageUrls: [] });
  const [cbUploading, setCbUploading] = useState(false);

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
    getBanners().then(setBanners);
    getContentBlocks().then(setContentBlocks);
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
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 0, padding: "40px 32px", textAlign: "center", maxWidth: 360 }}>
        <AlertCircle size={32} style={{ color: "rgba(255,255,255,0.4)", margin: "0 auto 12px" }} />
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Bağlantı Kesildi</h2>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 20 }}>Ayarları yükleyemiyoruz.</p>
        <button onClick={() => window.location.reload()} style={{ background: "#fff", color: "#000", border: "none", borderRadius: 0, padding: "10px 24px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
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

      {/* Tab Bar */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.08)", overflowX: "auto" }}>
        {[
          { id: "genel", label: "Genel" },
          { id: "marka", label: "Marka" },
          { id: "odeme", label: "Ödeme" },
          { id: "icerik", label: "İçerik" },
          { id: "bildirim", label: "Bildirimler" },
          { id: "sozlesme", label: "Sözleşme" },
          { id: "ai", label: "AI" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "10px 18px", fontSize: 12, fontWeight: activeTab === tab.id ? 800 : 500,
            color: activeTab === tab.id ? "#fff" : "rgba(255,255,255,0.4)",
            background: "none", border: "none", borderBottom: activeTab === tab.id ? "2px solid #fff" : "2px solid transparent",
            cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
          }}>{tab.label}</button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>

        {/* 1. Hero Başlıkları */}
        {activeTab === "genel" && <div style={sectionCard}>
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
        </div>}

        {/* 2. Preview Card */}
        {activeTab === "genel" && <div style={{ ...sectionCard, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Layout size={13} style={{ color: "rgba(255,255,255,0.35)" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Canlı Önizleme</span>
          </div>
          <div style={{
            background: "#000", borderRadius: 0, border: "1px solid rgba(255,255,255,0.06)",
            padding: "40px 24px", textAlign: "center", position: "relative", overflow: "hidden",
          }}>
            {/* Glow */}
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 200, height: 200, background: "rgba(255,255,255,0.04)", borderRadius: 0, filter: "blur(60px)", pointerEvents: "none" }} />
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
        </div>}

        {/* Banner Carousel Management */}
        {activeTab === "icerik" && <div style={sectionCard}>
          {sectionHeader(ImageIcon, "Banner Carousel", "Anasayfada portfolyo bölümünün üstünde görünen kayan banner görselleri.")}

          {/* Upload new banner */}
          <div style={{ marginBottom: 20 }}>
            <CldUploadWidget
              uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ""}
              onSuccess={(res) => {
                if (res.event === "success") {
                  setPendingBannerUrl(res.info.secure_url);
                  setPendingMediaType(res.info.resource_type === "video" ? "video" : "image");
                }
              }}
              options={{ multiple: false, cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, resourceType: "auto" }}
            >
              {({ open }) => (
                <button
                  type="button"
                  onClick={() => open()}
                  style={{
                    width: "100%", padding: "20px", borderRadius: 0, cursor: "pointer",
                    border: "2px dashed rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.02)",
                    color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    transition: "all 0.2s",
                  }}
                >
                  <UploadCloud size={18} />
                  Banner Yükle (Görsel veya Video)
                </button>
              )}
            </CldUploadWidget>
          </div>

          {/* Pending banner form */}
          {pendingBannerUrl && (
            <div style={{
              padding: 16, borderRadius: 0, marginBottom: 20,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)",
            }}>
              <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
                {pendingMediaType === "video" ? (
                  <video src={pendingBannerUrl} style={{ width: 120, height: 60, objectFit: "cover", borderRadius: 0, border: "1px solid rgba(255,255,255,0.1)" }} muted autoPlay loop />
                ) : (
                  <img src={pendingBannerUrl} alt="Preview" style={{ width: 120, height: 60, objectFit: "cover", borderRadius: 0, border: "1px solid rgba(255,255,255,0.1)" }} />
                )}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <input type="text" placeholder="Başlık (opsiyonel)" value={bannerForm.title}
                    onChange={(e) => setBannerForm(p => ({ ...p, title: e.target.value }))}
                    style={{ ...inp, padding: "10px 12px", fontSize: 12 }}
                  />
                  <input type="text" placeholder="Alt Başlık (opsiyonel)" value={bannerForm.subtitle}
                    onChange={(e) => setBannerForm(p => ({ ...p, subtitle: e.target.value }))}
                    style={{ ...inp, padding: "10px 12px", fontSize: 12 }}
                  />
                </div>
              </div>
              <input type="text" placeholder="Link (opsiyonel, ör: /booking)" value={bannerForm.link}
                onChange={(e) => setBannerForm(p => ({ ...p, link: e.target.value }))}
                style={{ ...inp, padding: "10px 12px", fontSize: 12, marginBottom: 12 }}
              />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => { setPendingBannerUrl(""); setPendingMediaType("image"); setBannerForm({ title: "", subtitle: "", link: "" }); }}
                  style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                >İptal</button>
                <button type="button"
                  disabled={bannerUploading}
                  onClick={async () => {
                    setBannerUploading(true);
                    const res = await createBanner({ imageUrl: pendingBannerUrl, mediaType: pendingMediaType, ...bannerForm });
                    if (res.success) {
                      setBanners(await getBanners());
                      setPendingBannerUrl("");
                      setPendingMediaType("image");
                      setBannerForm({ title: "", subtitle: "", link: "" });
                    }
                    setBannerUploading(false);
                  }}
                  style={{
                    padding: "10px 20px", borderRadius: 0, border: "none",
                    background: "#fff", color: "#000", fontWeight: 800, fontSize: 12,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  <Plus size={14} />
                  {bannerUploading ? "Ekleniyor..." : "Banner Ekle"}
                </button>
              </div>
            </div>
          )}

          {/* Existing banners list */}
          {banners.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {banners.map((b, idx) => (
                <div key={b.id} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                  borderRadius: 0, background: b.isActive ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.015)",
                  border: `1px solid ${b.isActive ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)"}`,
                  opacity: b.isActive ? 1 : 0.5,
                }}>
                  {b.mediaType === "video" ? (
                    <video src={b.imageUrl} muted playsInline style={{ width: 80, height: 40, objectFit: "cover", borderRadius: 0, flexShrink: 0 }} />
                  ) : (
                    <img src={b.imageUrl} alt="" style={{ width: 80, height: 40, objectFit: "cover", borderRadius: 0, flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 10, padding: "1px 5px", borderRadius: 0, background: b.mediaType === "video" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.06)", color: b.mediaType === "video" ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.4)", fontWeight: 800 }}>
                        {b.mediaType === "video" ? "🎬" : "🖼️"}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {b.title || "(Başlıksız)"}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                      Sıra: {idx + 1} {b.subtitle && `· ${b.subtitle}`}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    {/* Move up */}
                    <button type="button" disabled={idx === 0}
                      onClick={async () => {
                        const ids = banners.map(x => x.id);
                        [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
                        await reorderBanners(ids);
                        setBanners(await getBanners());
                      }}
                      style={{ background: "none", border: "none", cursor: idx === 0 ? "not-allowed" : "pointer", padding: 4, color: "rgba(255,255,255,0.3)", opacity: idx === 0 ? 0.3 : 1 }}
                    ><ArrowUp size={14} /></button>
                    {/* Move down */}
                    <button type="button" disabled={idx === banners.length - 1}
                      onClick={async () => {
                        const ids = banners.map(x => x.id);
                        [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
                        await reorderBanners(ids);
                        setBanners(await getBanners());
                      }}
                      style={{ background: "none", border: "none", cursor: idx === banners.length - 1 ? "not-allowed" : "pointer", padding: 4, color: "rgba(255,255,255,0.3)", opacity: idx === banners.length - 1 ? 0.3 : 1 }}
                    ><ArrowDown size={14} /></button>
                    {/* Toggle active */}
                    <button type="button"
                      onClick={async () => {
                        await updateBanner(b.id, { isActive: !b.isActive });
                        setBanners(await getBanners());
                      }}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: b.isActive ? "#fff" : "rgba(255,255,255,0.25)" }}
                    >{b.isActive ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                    {/* Delete */}
                    <button type="button"
                      onClick={async () => {
                        if (confirm("Bu banner'ı silmek istediğinize emin misiniz?")) {
                          await deleteBanner(b.id);
                          setBanners(await getBanners());
                        }
                      }}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "rgba(255,255,255,0.4)" }}
                    ><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "24px 0", color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
              Henüz banner eklenmemiş.
            </div>
          )}
        </div>}

        {/* 2.5 Hero Arka Plan */}
        {activeTab === "genel" && <div style={sectionCard}>
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
                    flex: 1, padding: "12px 8px", borderRadius: 0, border: "1px solid",
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
                    if (file.size > 50 * 1024 * 1024) {
                      alert("Dosya çok büyük (Maks 50MB)");
                      return;
                    }
                    setUploadingBg(true);
                    try {
                      const isVideo = file.type.startsWith('video/');
                      const resourceType = isVideo ? 'video' : 'image';
                      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
                      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
                      
                      const fd = new FormData();
                      fd.append('file', file);
                      fd.append('upload_preset', uploadPreset);
                      fd.append('folder', 'hero');

                      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
                        method: 'POST',
                        body: fd,
                      });
                      const result = await res.json();
                      if (result.secure_url) {
                        setConfig({ ...config, heroBgUrl: result.secure_url });
                      } else {
                        alert("Yükleme hatası: " + (result.error?.message || "Bilinmeyen hata"));
                      }
                    } catch (err) {
                      alert("Yükleme hatası: " + err.message);
                    }
                    setUploadingBg(false);
                  }}
                  style={{ ...inp, cursor: "pointer", flex: 1 }}
                />
              </div>
              {uploadingBg && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 6 }}>Yükleniyor... (büyük dosyalar biraz sürebilir)</p>}
              {config.heroBgUrl && (
                <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                  Mevcut: <span style={{ color: "#fff" }}>{config.heroBgUrl.length > 60 ? config.heroBgUrl.slice(0, 60) + "..." : config.heroBgUrl}</span>
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
                  style={{ width: 48, height: 48, border: "none", borderRadius: 0, cursor: "pointer", background: "none" }}
                />
                <input
                  type="text"
                  value={config.heroBgColor || "#000000"}
                  onChange={(e) => setConfig({ ...config, heroBgColor: e.target.value })}
                  style={{ ...inp, maxWidth: 160 }}
                  placeholder="#000000"
                />
                <div style={{ width: 48, height: 48, borderRadius: 0, background: config.heroBgColor || "#000", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
            </div>
          )}
        </div>}

        {/* 3. Stüdyo & İletişim */}
        {activeTab === "genel" && <div style={sectionCard}>
          {sectionHeader(Home, "Stüdyo & İletişim", "Alt panelde yer alan adres ve iletişim detayları.")}

          <div style={{ marginBottom: 16 }}>
            <label style={label}>Stüdyo Adresi</label>
            <input
              type="text"
              value={config.address}
              onChange={(e) => setConfig({ ...config, address: e.target.value })}
              style={inp}
              placeholder="Stüdyo adresi"
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
        </div>}

        {/* 4. Sosyal Kanallar */}
        {activeTab === "genel" && <div style={sectionCard}>
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
        </div>}

        {/* 5. Bildirim Kanalları */}
        {activeTab === "bildirim" && <div style={sectionCard}>
          {sectionHeader(Mail, "Bildirim Kanalları", "Müşterilere gönderilecek bildirimlerin kanallarını yönetin.")}

          {/* Toggle Switches */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {/* Email Toggle */}
            <div style={{
              background: config.emailEnabled ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${config.emailEnabled ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 0, padding: "18px 16px", cursor: "pointer", transition: "all 0.2s",
            }}
              onClick={() => setConfig({ ...config, emailEnabled: !config.emailEnabled })}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Mail size={16} style={{ color: config.emailEnabled ? "#fff" : "rgba(255,255,255,0.3)" }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: config.emailEnabled ? "#fff" : "rgba(255,255,255,0.5)" }}>E-Posta</span>
                </div>
                <div style={{
                  width: 40, height: 22, borderRadius: 0, position: "relative",
                  background: config.emailEnabled ? "#fff" : "rgba(255,255,255,0.15)", transition: "all 0.2s",
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 0, background: "#fff",
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
              background: config.smsEnabled ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${config.smsEnabled ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 0, padding: "18px 16px", cursor: "pointer", transition: "all 0.2s",
            }}
              onClick={() => setConfig({ ...config, smsEnabled: !config.smsEnabled })}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Phone size={16} style={{ color: config.smsEnabled ? "#fff" : "rgba(255,255,255,0.3)" }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: config.smsEnabled ? "#fff" : "rgba(255,255,255,0.5)" }}>SMS</span>
                </div>
                <div style={{
                  width: 40, height: 22, borderRadius: 0, position: "relative",
                  background: config.smsEnabled ? "#fff" : "rgba(255,255,255,0.15)", transition: "all 0.2s",
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 0, background: "#fff",
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
              borderRadius: 0, padding: 20, marginBottom: 12,
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
              borderRadius: 0, padding: 20, marginBottom: 12,
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

          {/* SMS Test Butonu */}
          {config.smsEnabled && config.netgsmUsercode && (
            <div style={{
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 0, padding: 16, marginBottom: 12,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                📱 SMS Test
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <label style={label}>Telefon Numarası</label>
                  <input
                    type="tel"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="05XX XXX XX XX"
                    style={inp}
                  />
                </div>
                <button
                  type="button"
                  disabled={!testPhone.trim() || testSmsLoading}
                  onClick={async () => {
                    setTestSmsLoading(true);
                    setTestSmsResult(null);
                    const res = await sendTestSMS(testPhone.trim());
                    setTestSmsResult(res);
                    setTestSmsLoading(false);
                  }}
                  style={{
                    padding: "10px 18px", borderRadius: 0, border: "none", flexShrink: 0,
                    background: testPhone.trim() && !testSmsLoading ? "#fff" : "rgba(255,255,255,0.06)",
                    color: testPhone.trim() && !testSmsLoading ? "#000" : "rgba(255,255,255,0.3)",
                    fontWeight: 800, fontSize: 11, cursor: testPhone.trim() && !testSmsLoading ? "pointer" : "not-allowed",
                    height: 42,
                  }}
                >
                  {testSmsLoading ? "Gönderiliyor..." : "Test SMS Gönder"}
                </button>
              </div>
              {testSmsResult && (
                <div style={{
                  marginTop: 10, padding: "8px 12px", borderRadius: 0, fontSize: 11, fontWeight: 600,
                  background: testSmsResult.success ? "rgba(255,255,255,0.06)" : "rgba(255,68,68,0.1)",
                  color: testSmsResult.success ? "#fff" : "#ff6b6b",
                  border: `1px solid ${testSmsResult.success ? "rgba(255,255,255,0.12)" : "rgba(255,68,68,0.2)"}`,
                }}>
                  {testSmsResult.success
                    ? "✅ SMS başarıyla gönderildi!"
                    : `❌ Hata: ${testSmsResult.error}`}
                </div>
              )}
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
                  marginBottom: 6, borderRadius: 0, cursor: "pointer", transition: "all 0.2s",
                  background: config[item.key] ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.01)",
                  border: `1px solid ${config[item.key] ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)"}`,
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width: 20, height: 20, borderRadius: 0, flexShrink: 0,
                  border: `2px solid ${config[item.key] ? "#fff" : "rgba(255,255,255,0.2)"}`,
                  background: config[item.key] ? "#fff" : "transparent",
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
                  {config.emailEnabled && config[item.key] && <span style={{ fontSize: 8, background: "rgba(255,255,255,0.1)", color: "#fff", padding: "2px 6px", borderRadius: 0, fontWeight: 700 }}>EMAIL</span>}
                  {config.smsEnabled && config[item.key] && <span style={{ fontSize: 8, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", padding: "2px 6px", borderRadius: 0, fontWeight: 700 }}>SMS</span>}
                </div>
              </div>
            ))}
          </div>
        </div>}

        {/* 6. Rezervasyon Sözleşmesi */}
        {activeTab === "sozlesme" && <div style={sectionCard}>
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
        </div>}

        {/* İndirim Kodları Section */}
        {activeTab === "sozlesme" && <div style={sectionCard}>
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
                padding: "12px 20px", borderRadius: 0, border: "none",
                background: (dcForm.code && dcForm.discountPercent) ? "#fff" : "rgba(255,255,255,0.06)",
                color: (dcForm.code && dcForm.discountPercent) ? "#000" : "rgba(255,255,255,0.3)",
                fontWeight: 700, fontSize: 12, cursor: (dcForm.code && dcForm.discountPercent) ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <Plus size={14} />
              {dcLoading ? "Oluşturuluyor..." : "İndirim Kodu Ekle"}
            </button>
            {dcMessage && <div style={{ fontSize: 12, fontWeight: 600, color: dcMessage.includes("✅") ? "#fff" : "rgba(255,255,255,0.6)" }}>{dcMessage}</div>}
          </div>

          {/* Existing codes */}
          {discountCodes.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Mevcut Kodlar ({discountCodes.length})</div>
              {discountCodes.map((dc) => (
                <div key={dc.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                  padding: "12px 14px", borderRadius: 0,
                  background: dc.isActive ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${dc.isActive ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)"}`,
                  opacity: dc.isActive ? 1 : 0.5,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#fff", fontFamily: "monospace", letterSpacing: "0.05em" }}>{dc.code}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 0,
                        background: dc.isActive ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.06)",
                        color: dc.isActive ? "#fff" : "rgba(255,255,255,0.3)",
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
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: dc.isActive ? "#fff" : "rgba(255,255,255,0.25)" }}
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
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "rgba(255,255,255,0.4)" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>}

        {/* 8. AI Chatbot Ayarları */}
        {activeTab === "ai" && <div style={sectionCard}>
          {sectionHeader(Bot, "AI Chatbot Ayarları", "Yapay zeka asistanının davranışını ve talimatlarını düzenleyin.")}

          {/* Toggle */}
          <div
            style={{
              background: config.chatbotEnabled ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${config.chatbotEnabled ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 0, padding: "18px 16px", cursor: "pointer", transition: "all 0.2s",
              marginBottom: 16,
            }}
            onClick={() => setConfig({ ...config, chatbotEnabled: !config.chatbotEnabled })}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Bot size={16} style={{ color: config.chatbotEnabled ? "#fff" : "rgba(255,255,255,0.3)" }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: config.chatbotEnabled ? "#fff" : "rgba(255,255,255,0.5)" }}>Chatbot Aktif</span>
              </div>
              <div style={{
                width: 40, height: 22, borderRadius: 0, position: "relative",
                background: config.chatbotEnabled ? "#fff" : "rgba(255,255,255,0.15)", transition: "all 0.2s",
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 0, background: "#fff",
                  position: "absolute", top: 2, transition: "all 0.2s",
                  left: config.chatbotEnabled ? 20 : 2,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                }} />
              </div>
            </div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>
              Anasayfada AI sohbet asistanını göster/gizle
            </p>
          </div>

          {config.chatbotEnabled && (
            <div>
              <label style={label}>Özel Talimatlar</label>
              <textarea
                value={config.chatbotInstructions || ""}
                onChange={(e) => setConfig({ ...config, chatbotInstructions: e.target.value })}
                style={{
                  ...inp,
                  minHeight: 250,
                  resize: "vertical",
                  lineHeight: 1.7,
                  fontFamily: "inherit",
                }}
                placeholder={`Buraya AI'ın nasıl davranmasını istediğini yaz. Örnekler:

• Kendini "Emre" olarak tanıt, samimi ol
• Müşterilere önce dış çekim paketini öner
• Fiyat sorulduğunda nakit indirimi mutlaka belirt
• Düğün tarihi yakınsa acil rezervasyon yapmasını söyle
• Rakipleri kötüleme
• Kısa ve öz cevaplar ver, uzun yazma
• Müşteriye her zaman "siz" diye hitap et
• Şaka yap, emoji kullan
• Bütçesi düşükse taksit seçeneğini belirt`}
              />
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 10, lineHeight: 1.8 }}>
                💡 <strong style={{ color: "rgba(255,255,255,0.5)" }}>Nasıl çalışır:</strong> Buraya yazdığın her şey AI'ın "beynine" eklenir. Paket bilgileri ve iletişim bilgileri zaten otomatik olarak AI'a verilir — sen sadece davranışını, üslubunu ve özel kurallarını belirle.
              </p>
              <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 0, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Otomatik bilinen bilgiler</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[
                    "📦 Tüm paketler & fiyatlar",
                    "📞 İletişim bilgileri", 
                    "💵 Nakit/kart seçenekleri",
                    "🗓️ Rezervasyon yönlendirmesi",
                  ].map((item, i) => (
                    <span key={i} style={{ fontSize: 10, fontWeight: 600, padding: "4px 10px", borderRadius: 0, background: "rgba(255,255,255,0.04)", color: "rgba(74,222,128,0.7)", border: "1px solid rgba(255,255,255,0.06)" }}>{item}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>}

        {/* Status Message */}
        {message && (
          <div style={{
            padding: "12px 16px", borderRadius: 0, display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
            background: isError ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${isError ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.1)"}`,
            color: isError ? "rgba(255,255,255,0.6)" : "#fff",
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
            width: "100%", padding: 16, borderRadius: 0, border: "none",
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

      {/* ── Content Blocks ── */}
      {activeTab === "icerik" && <div style={sectionCard}>
        {sectionHeader(Layout, "Anasayfa İçerik Blokları", "Anasayfada görsel ve metin ile bölümler ekleyin")}
        
        {/* Existing blocks */}
        {contentBlocks.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {contentBlocks.map((cb) => (
              <div key={cb.id} style={{ display: "flex", gap: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: 12, alignItems: "center" }}>
                {cb.imageUrls && cb.imageUrls.length > 0 && (
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    {cb.imageUrls.slice(0, 3).map((url, i) => (
                      <img key={i} src={url} alt="" style={{ width: 40, height: 40, objectFit: "cover" }} />
                    ))}
                    {cb.imageUrls.length > 3 && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", alignSelf: "center" }}>+{cb.imageUrls.length - 3}</span>}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{cb.title || "(Başlıksız)"}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cb.description || ""} — {cb.imageUrls?.length || 0} görsel</div>
                </div>
                <button onClick={async () => {
                  if (!confirm("Bu bloğu silmek istediğinize emin misiniz?")) return;
                  await deleteContentBlock(cb.id);
                  setContentBlocks(await getContentBlocks());
                }} style={{ background: "none", border: "none", color: "rgba(239,68,68,0.7)", cursor: "pointer", padding: 6, flexShrink: 0 }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new block */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <label style={label}>Başlık</label>
            <input value={cbForm.title} onChange={e => setCbForm(p => ({ ...p, title: e.target.value }))} placeholder="Bölüm başlığı" style={inp} />
          </div>
          <div>
            <label style={label}>Görseller ({cbForm.imageUrls.length} yüklendi)</label>
            {cbForm.imageUrls.length > 0 && (
              <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                {cbForm.imageUrls.map((url, i) => (
                  <div key={i} style={{ position: "relative", width: 56, height: 56 }}>
                    <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button onClick={() => setCbForm(p => ({ ...p, imageUrls: p.imageUrls.filter((_, idx) => idx !== i) }))} style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: "#ef4444", border: "none", color: "#fff", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, padding: 0 }}>×</button>
                  </div>
                ))}
              </div>
            )}
            <CldUploadWidget
              uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
              options={{ maxFiles: 10, resourceType: "image" }}
              onSuccess={(result) => {
                setCbForm(p => ({ ...p, imageUrls: [...p.imageUrls, result.info.secure_url] }));
              }}
            >
              {({ open }) => (
                <button type="button" onClick={() => open()} style={{ ...inp, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.5)" }}>
                  <UploadCloud size={14} />
                  Görsel Ekle
                </button>
              )}
            </CldUploadWidget>
          </div>
          <div>
            <label style={label}>Açıklama</label>
            <textarea value={cbForm.description} onChange={e => setCbForm(p => ({ ...p, description: e.target.value }))} placeholder="Bu bölümde anlatmak istediğiniz metin..." rows={3} style={{ ...inp, resize: "vertical" }} />
          </div>
          <button type="button" disabled={cbUploading || (!cbForm.title && cbForm.imageUrls.length === 0)} onClick={async () => {
            setCbUploading(true);
            await createContentBlock(cbForm);
            setCbForm({ title: "", description: "", imageUrls: [] });
            setContentBlocks(await getContentBlocks());
            setCbUploading(false);
          }} style={{
            padding: "12px 20px", borderRadius: 0, border: "none",
            background: (cbForm.title || cbForm.imageUrls.length > 0) ? "#22c55e" : "rgba(255,255,255,0.06)",
            color: (cbForm.title || cbForm.imageUrls.length > 0) ? "#000" : "rgba(255,255,255,0.3)",
            fontWeight: 800, fontSize: 12, cursor: (cbForm.title || cbForm.imageUrls.length > 0) ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", gap: 8, width: "fit-content",
          }}>
            <Plus size={14} /> {cbUploading ? "Ekleniyor..." : "Blok Ekle"}
          </button>
        </div>
      </div>}

        {/* ═══ MARKA SEKME ═══ */}
        {activeTab === "marka" && <div style={sectionCard}>
          {sectionHeader(Palette, "Marka & Kimlik", "Logo, renkler ve yazı tipi ayarları.")}

          {/* Logo */}
          <div style={{ marginBottom: 20 }}>
            <label style={label}>Logo</label>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {config.logoUrl ? (
                <div style={{ width: 64, height: 64, border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  <img src={config.logoUrl} alt="Logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                </div>
              ) : (
                <div style={{ width: 64, height: 64, border: "1px dashed rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ImageIcon size={20} style={{ color: "rgba(255,255,255,0.2)" }} />
                </div>
              )}
              <CldUploadWidget
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                options={{ maxFiles: 1, resourceType: "image", folder: "logos" }}
                onSuccess={(result) => setConfig({ ...config, logoUrl: result.info.secure_url })}
              >
                {({ open }) => (
                  <button type="button" onClick={() => open()} style={{
                    padding: "8px 16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 700, cursor: "pointer", borderRadius: 0,
                    display: "flex", alignItems: "center", gap: 6
                  }}>
                    <Upload size={13} /> Yükle
                  </button>
                )}
              </CldUploadWidget>
              {config.logoUrl && (
                <button type="button" onClick={() => setConfig({ ...config, logoUrl: "" })} style={{
                  padding: "8px", background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer"
                }}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* İşletme Adı */}
          <div style={{ marginBottom: 16 }}>
            <label style={label}>İşletme Adı</label>
            <input type="text" value={config.businessName || ""} onChange={e => setConfig({ ...config, businessName: e.target.value })} style={inp} placeholder="Studio" />
          </div>

          {/* Footer Slogan */}
          <div style={{ marginBottom: 16 }}>
            <label style={label}>Footer Sloganı</label>
            <input type="text" value={config.footerTagline || ""} onChange={e => setConfig({ ...config, footerTagline: e.target.value })} style={inp} placeholder="Hayatınızın en özel anlarını ölümsüzleştiriyoruz." />
          </div>

          {/* Accent Color */}
          <div style={{ marginBottom: 16 }}>
            <label style={label}>Vurgu Rengi</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input type="color" value={config.accentColor || "#ffffff"} onChange={e => setConfig({ ...config, accentColor: e.target.value })} style={{ width: 40, height: 40, border: "1px solid rgba(255,255,255,0.15)", background: "none", cursor: "pointer", padding: 2 }} />
              <input type="text" value={config.accentColor || "#ffffff"} onChange={e => setConfig({ ...config, accentColor: e.target.value })} style={{ ...inp, maxWidth: 140 }} placeholder="#ffffff" />
            </div>
          </div>

          {/* SEO */}
          <div style={{ marginBottom: 16 }}>
            <label style={label}>SEO Başlık</label>
            <input type="text" value={config.seoTitle || ""} onChange={e => setConfig({ ...config, seoTitle: e.target.value })} style={inp} placeholder="İşletme Adı | Profesyonel Fotoğrafçılık" />
          </div>
          <div>
            <label style={label}>SEO Açıklama</label>
            <textarea value={config.seoDescription || ""} onChange={e => setConfig({ ...config, seoDescription: e.target.value })} style={{ ...inp, minHeight: 70, resize: "vertical" }} placeholder="Profesyonel fotoğrafçılık hizmetleri..." />
          </div>
        </div>}

        {/* ═══ ÖDEME SEKME ═══ */}
        {activeTab === "odeme" && <div style={sectionCard}>
          {sectionHeader(Banknote, "Ödeme Ayarları", "Müşterilerinizden online ödeme almak için API bilgilerinizi girin.")}

          {/* Payment Mode */}
          <div style={{ marginBottom: 24 }}>
            <label style={label}>Ödeme Modu</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[{ id: "cash", label: "Nakit / Havale" }, { id: "card", label: "Kredi Kartı" }, { id: "both", label: "Her İkisi" }].map(m => (
                <button key={m.id} type="button" onClick={() => setConfig({ ...config, paymentMode: m.id })} style={{
                  padding: "10px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", borderRadius: 0,
                  border: config.paymentMode === m.id ? "1px solid rgba(255,255,255,0.4)" : "1px solid rgba(255,255,255,0.1)",
                  background: config.paymentMode === m.id ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
                  color: config.paymentMode === m.id ? "#fff" : "rgba(255,255,255,0.4)",
                }}>{m.label}</button>
              ))}
            </div>
          </div>

          {/* PayTR Keys */}
          {(config.paymentMode === "card" || config.paymentMode === "both") && <>
            <div style={{ padding: "12px 16px", background: "rgba(255,200,0,0.05)", border: "1px solid rgba(255,200,0,0.15)", marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: "rgba(255,200,0,0.7)", margin: 0 }}>⚠️ PayTR hesabınızdan Merchant ID, API Key ve Secret Key bilgilerinizi girin. Bu bilgiler olmadan kredi kartı ödemesi alamazsınız.</p>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={label}>PayTR Merchant ID</label>
              <input type="text" value={config.paytrMerchantId || ""} onChange={e => setConfig({ ...config, paytrMerchantId: e.target.value })} style={inp} placeholder="123456" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={label}>PayTR API Key</label>
              <input type="text" value={config.paytrApiKey || ""} onChange={e => setConfig({ ...config, paytrApiKey: e.target.value })} style={inp} placeholder="PayTR API anahtarınız" />
            </div>
            <div>
              <label style={label}>PayTR Secret Key</label>
              <input type="password" value={config.paytrSecretKey || ""} onChange={e => setConfig({ ...config, paytrSecretKey: e.target.value })} style={inp} placeholder="••••••••" />
            </div>
          </>}

          {config.paymentMode === "cash" && (
            <div style={{ padding: "20px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
              Müşterileriniz nakit veya havale ile ödeme yapacak. Online ödeme almak için modunu değiştirin.
            </div>
          )}
        </div>}

    </div>
  );
}
