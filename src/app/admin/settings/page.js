"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSiteConfig, updateSiteConfig, uploadHeroBg, getDiscountCodes, createDiscountCode, deleteDiscountCode, toggleDiscountCode, getSubMerchantInfo, updateSubMerchantInfo, getTenantDomainInfo, updateTenantDomain, checkDomainAvailability } from "../core-actions";
import { getBanners, createBanner, updateBanner, deleteBanner, reorderBanners } from "../banner-actions";
import { getContentBlocks, createContentBlock, updateContentBlock, deleteContentBlock } from "../content-actions";
import { getPortfolioCategories, createPortfolioCategory, deletePortfolioCategory, addPhotoToPortfolio, deletePortfolioPhoto } from "../portfolio-actions";
import { sendTestSMS } from "../test-sms-action";
import { getBusinessType } from "@/lib/business-types";
import { useAdminSession } from "../AdminSessionContext";
import { CldUploadWidget } from "next-cloudinary";
import {
  Save, Home, Phone, Mail, Instagram, MessageCircle, MapPin,
  Type, Sparkles, Layout, Globe, CheckCircle2, AlertCircle, Loader2, Banknote, Monitor, Upload, Palette, FileText, Tag, Trash2, Plus, Power, Bot, Image as ImageIcon, ArrowUp, ArrowDown, Eye, EyeOff, UploadCloud, Building2, Shield, CreditCard, GripVertical, Layers, Package, Users
} from "lucide-react";
import { PLATFORM, LEGAL_TYPES } from "@/lib/constants";
import { getServiceAgreement, getDistanceSalesContract, getPreliminaryInfoForm, getKVKKText } from "@/lib/contracts";
import { getPlanLimits, hasFeature } from "@/lib/plan-limits";
import MembersList from "../components/MembersList";
import PostsManager from "./PostsManager";


const inp = {
  width: "100%", boxSizing: "border-box",
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 0, padding: "12px 16px", fontSize: 14, color: "#fff",
  outline: "none", transition: "all 0.2s",
};

const inpIcon = { ...inp, paddingLeft: 44 };

const label = {
  display: "block", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)",
  textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, paddingLeft: 2,
};

const sectionCard = {
  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 0, padding: "24px", marginBottom: 24,
};

const sectionHeader = (Icon, title, desc) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 24 }}>
    <div style={{
      width: 40, height: 40, borderRadius: 0, background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center",
      justifyContent: "center", flexShrink: 0,
    }}>
      <Icon size={16} style={{ color: "rgba(255,255,255,0.6)" }} />
    </div>
    <div>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: "0 0 4px", letterSpacing: "0.01em" }}>{title}</h2>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.4 }}>{desc}</p>
    </div>
  </div>
);


const SUB_TABS = {
  genel: [
    { id: "moduller", label: "Modüller" },
    { id: "domain", label: "Alan Adı" }
  ],
  tasarim: [
    { id: "tema", label: "Tema & Marka" },
    { id: "hero", label: "Hero & Karşılama" },
    { id: "duzen", label: "Sayfa Düzeni" },
    { id: "iletisim", label: "İletişim & Sosyal" }
  ],
  icerik: [
    { id: "icerik_blok", label: "İçerik Blokları" },
    { id: "banner", label: "Banner'lar" },
    { id: "reels", label: "Instagram Reels" },
    { id: "portfolio", label: "Portfolyo" },
    { id: "blog", label: "Blog & Yazılar" }
  ],
  sistem: [
    { id: "odeme", label: "Ödeme" },
    { id: "sozlesme", label: "Sözleşmeler" },
    { id: "indirim", label: "İndirimler" },
    { id: "bildirim", label: "Bildirimler" },
    { id: "ai", label: "Yapay Zeka" }
  ]
};

export default function SettingsPage() {
  const router = useRouter();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [activeTab, setActiveTab] = useState("genel");
  const [subTab, setSubTab] = useState("moduller");
  const { session: adminSession } = useAdminSession();
  const businessType = adminSession?.tenant?.businessType || null;
  const bt = getBusinessType(businessType);
  const { features, terms } = bt;
  const isPhotographer = businessType === "photographer";

  // Plan limitleri
  const tenantPlan = adminSession?.tenant?.plan || "trial";
  const planLimits = getPlanLimits(tenantPlan);
  const isPro = tenantPlan === "pro";

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

  // Portfolio
  const [portfolioCategories, setPortfolioCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [portfolioUploading, setPortfolioUploading] = useState(false);

  // Sub-Merchant
  const [smForm, setSmForm] = useState({ legalName: "", legalType: "personal", taxId: "", taxOffice: "", iban: "", legalAddress: "", taxPlateUrl: "", sellerAgreementAccepted: false });
  const [smSaving, setSmSaving] = useState(false);
  const [smMessage, setSmMessage] = useState("");
  const [smError, setSmError] = useState(false);
  const [smStatus, setSmStatus] = useState("NOT_STARTED");
  const [smCommission, setSmCommission] = useState(5);
  const [smLoaded, setSmLoaded] = useState(false);

  // Domain
  const [domainForm, setDomainForm] = useState({ customDomain: "", purchasedDomain: false, domainExpiresAt: null });
  const [domainSaving, setDomainSaving] = useState(false);
  const [domainMessage, setDomainMessage] = useState("");
  const [searchDomainName, setSearchDomainName] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedYears, setSelectedYears] = useState(1);
  const [renewYears, setRenewYears] = useState(1);
  const [renewLoading, setRenewLoading] = useState(false);

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
    Promise.all([
      getSiteConfig(),
    ]).then(([data]) => {
      if (data) setConfig(data);
      setLoading(false);
    });

    // URL parametrelerinden sekme kontrolü
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      const subTabParam = params.get("subTab");
      if (tabParam) setActiveTab(tabParam);
      if (subTabParam) setSubTab(subTabParam);
    }

    loadDiscountCodes();
    getBanners().then(setBanners);
    getContentBlocks().then(setContentBlocks);
    getPortfolioCategories().then(res => setPortfolioCategories(res?.categories || []));
    // Load sub-merchant info
    getSubMerchantInfo().then((info) => {
      if (info && !info.error) {
        setSmForm({
          legalName: info.legalName || "",
          legalType: info.legalType || "personal",
          taxId: info.taxId || "",
          taxOffice: info.taxOffice || "",
          iban: info.iban || "",
          legalAddress: info.legalAddress || "",
          taxPlateUrl: info.taxPlateUrl || "",
          sellerAgreementAccepted: info.sellerAgreementAccepted || false,
        });
        setSmStatus(info.subMerchantStatus || "NOT_STARTED");
        setSmCommission(info.commissionRate ?? 5);
      }
      setSmLoaded(true);
    });

    // Load custom domain info
    getTenantDomainInfo().then((info) => {
      if (info && !info.error) {
        setDomainForm({ customDomain: info.customDomain || "" });
      }
    });
  }, []);

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage("");
    setIsError(false);
    const { _reelInput, _tenant, ...saveData } = config;
    const res = await updateSiteConfig(saveData);
    if (res.success) {
      setMessage("Ayarlar başarıyla güncellendi.");
      router.refresh();
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
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em", margin: 0 }}>
          {activeTab === "tasarim" ? "Tasarım & Düzen" : activeTab === "icerik" ? "İçerik Yönetimi" : "Sistem & Ayarlar"}
        </h1>
      </div>

      {/* Layout Split */}
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Sidebar Navigation */}
        {activeTab !== "tasarim" && activeTab !== "icerik" && (
          <div className="w-full md:w-56 shrink-0 flex flex-row md:flex-col gap-1 overflow-x-auto border-b md:border-b-0 border-white/10 pb-4 md:pb-0 mb-4 md:mb-0" style={{ scrollbarWidth: "none" }}>
            {[
              { id: "genel", label: "Genel Ayarlar", icon: Globe },
              { id: "sistem", label: "Sistem, Ödeme vb.", icon: CreditCard },
              { id: "musteriler", label: terms.clients || "Müşteriler", icon: Users },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (SUB_TABS[tab.id]) setSubTab(SUB_TABS[tab.id][0].id); }} type="button" style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 16px", fontSize: 13, fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#fff" : "rgba(255,255,255,0.5)",
                  background: isActive ? "rgba(255,255,255,0.06)" : "transparent", 
                  border: "none", borderRadius: 0,
                  cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap", textAlign: "left"
                }} className="hover:bg-white/5">
                  <Icon size={16} /> {tab.label}
                </button>
              )
            })}
          </div>
        )}


        {/* Right Content Area */}
        <div className="flex-1 min-w-0">
          
          {SUB_TABS[activeTab] && (
            <div style={{ display: "flex", gap: 12, marginBottom: 24, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
              {SUB_TABS[activeTab].map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSubTab(st.id)}
                  style={{
                    background: subTab === st.id ? "#fff" : "rgba(255,255,255,0.06)",
                    color: subTab === st.id ? "#000" : "rgba(255,255,255,0.6)",
                    border: "none", borderRadius: 0, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap"
                  }}
                >{st.label}</button>
              ))}
            </div>
          )}

          
          {activeTab === "musteriler" && (
            <div style={sectionCard}>
              {sectionHeader(Users, terms.clients || "Müşteriler", "Platformunuza kayıtlı üyeleri ve rezervasyon geçmişlerini yönetin.")}
              <MembersList terms={terms} />
            </div>
          )}
          
          {activeTab !== "musteriler" && (
            <form onSubmit={handleSubmit}>

              {/* 0. Modüller */}
              {activeTab === "genel" && subTab === "moduller" && <div style={sectionCard}>
          {sectionHeader(Layers, "Aktif Modüller", "Platformunuzda kullanmak istediğiniz araçları seçin. Kapatılan modüller sol menüden ve websitenizden gizlenir.")}

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer", padding: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 0 }}>
              <input 
                type="checkbox" 
                checked={config.moduleReservations ?? true} 
                onChange={(e) => setConfig({ ...config, moduleReservations: e.target.checked })}
                style={{ marginTop: 2, width: 18, height: 18, accentColor: "#fff", cursor: "pointer" }}
              />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Hizmetler & Randevu Sistemi</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Hizmet/paket tanımlayarak müşterilerinizden rezervasyon almanızı sağlar.</div>
              </div>
            </label>



            <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer", padding: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 0 }}>
              <input 
                type="checkbox" 
                checked={config.moduleEvents ?? true} 
                onChange={(e) => setConfig({ ...config, moduleEvents: e.target.checked })}
                style={{ marginTop: 2, width: 18, height: 18, accentColor: "#fff", cursor: "pointer" }}
              />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Etkinlikler & Bilet Satışı</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Atölye, seminer veya grup dersleri tanımlayıp bilet satmanızı sağlar.</div>
              </div>
            </label>
          </div>
        </div>}

        {/* 1. Hero Başlıkları */}
        {activeTab === "tasarim" && subTab === "hero" && <div style={sectionCard}>
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
              placeholder={bt.heroSub || "Alt Başlık"}
              required
            />
          </div>
        </div>}

        {/* 2. Preview Card */}
        {activeTab === "tasarim" && subTab === "hero" && <div style={{ ...sectionCard, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
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
                {config.heroSubtitle || bt.heroSub || ""}
              </span>
              <h1 style={{ fontSize: 22, fontFamily: "Georgia, serif", color: "#fff", lineHeight: 1.4, margin: "0 0 14px", whiteSpace: "pre-line" }}>
                {config.heroTitle || bt.heroTitle || ""}
              </h1>
              <div style={{ width: 40, height: 1, background: "rgba(255,255,255,0.2)", margin: "0 auto" }} />
            </div>
          </div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 12, fontStyle: "italic", lineHeight: 1.5 }}>
            * Başlıktaki enter tuşu anasayfada tasarımın dengeli durmasını sağlar.
          </p>
        </div>}

        {/* Banner Carousel Management */}
        {activeTab === "icerik" && subTab === "banner" && <div style={sectionCard}>
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
              options={{ multiple: false, cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, resourceType: "auto", maxImageFileSize: 5242880, maxVideoFileSize: 125829120 }}
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

        {/* Blog Manager */}
        {activeTab === "icerik" && subTab === "blog" && (
          <div style={sectionCard}>
            <PostsManager />
          </div>
        )}

        {/* 2.5 Hero Arka Plan */}
        {activeTab === "tasarim" && subTab === "hero" && <div style={sectionCard}>
          {sectionHeader(Monitor, "Arka Plan Ayarı", "Anasayfadaki hero bölümünün arka planını değiştirin.")}

          {!isPro && (
            <div style={{ padding: "16px 20px", background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
              <Sparkles size={16} style={{ color: "#8b5cf6" }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#8b5cf6" }}>Pro Özelliği</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Arka plan özelleştirme Pro plana dahildir. <a href="/admin/subscription" style={{ color: "#8b5cf6", textDecoration: "underline" }}>Planı Yükselt</a></div>
              </div>
            </div>
          )}

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
                  onClick={() => isPro && setConfig({ ...config, heroBgType: opt.value })}
                  disabled={!isPro}
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
        {activeTab === "tasarim" && subTab === "iletisim" && <div style={sectionCard}>
          {sectionHeader(Home, `${terms.placeName || "İşletme"} & İletişim`, "Alt panelde yer alan adres ve iletişim detayları.")}

          <div style={{ marginBottom: 16 }}>
            <label style={label}>{terms.placeName || "İşletme"} Adresi</label>
            <input
              type="text"
              value={config.address}
              onChange={(e) => setConfig({ ...config, address: e.target.value })}
              style={inp}
              placeholder={`${terms.placeName || "İşletme"} adresi`}
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
                  placeholder="info@isletme.com"
                  required
                />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 24, padding: "16px 20px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Tüm İletişim Bölümünü Göster</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Anasayfanın en altındaki tüm iletişim ve bağlantılar kutusunu açar/kapatır.</div>
              </div>
              <div onClick={() => setConfig({ ...config, showContactOnHome: !config.showContactOnHome })} style={{ width: 44, height: 24, borderRadius: 12, background: config.showContactOnHome !== false ? "var(--accent)" : "rgba(255,255,255,0.1)", position: "relative", cursor: "pointer", transition: "all 0.3s", flexShrink: 0 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, transition: "all 0.3s", left: config.showContactOnHome !== false ? 23 : 3, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
              </div>
            </div>

            {config.showContactOnHome !== false && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingLeft: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Telefon Numarasını Göster</div>
                  <div onClick={() => setConfig({ ...config, showPhoneOnHome: !config.showPhoneOnHome })} style={{ width: 36, height: 20, borderRadius: 10, background: config.showPhoneOnHome !== false ? "var(--accent)" : "rgba(255,255,255,0.1)", position: "relative", cursor: "pointer", transition: "all 0.3s" }}>
                    <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, transition: "all 0.3s", left: config.showPhoneOnHome !== false ? 19 : 3 }} />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>E-Posta Adresini Göster</div>
                  <div onClick={() => setConfig({ ...config, showEmailOnHome: !config.showEmailOnHome })} style={{ width: 36, height: 20, borderRadius: 10, background: config.showEmailOnHome !== false ? "var(--accent)" : "rgba(255,255,255,0.1)", position: "relative", cursor: "pointer", transition: "all 0.3s" }}>
                    <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, transition: "all 0.3s", left: config.showEmailOnHome !== false ? 19 : 3 }} />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Fiziksel Adresi Göster</div>
                  <div onClick={() => setConfig({ ...config, showAddressOnHome: !config.showAddressOnHome })} style={{ width: 36, height: 20, borderRadius: 10, background: config.showAddressOnHome !== false ? "var(--accent)" : "rgba(255,255,255,0.1)", position: "relative", cursor: "pointer", transition: "all 0.3s" }}>
                    <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, transition: "all 0.3s", left: config.showAddressOnHome !== false ? 19 : 3 }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>}

        {/* 4. Sosyal Kanallar */}
        {activeTab === "tasarim" && subTab === "iletisim" && <div style={sectionCard}>
          {sectionHeader(Instagram, "Sosyal Kanallar", "Müşterilerinizin size ulaşabileceği linkler.")}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={label}>Instagram</label>
              <div style={{ display: "flex" }}>
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRight: "none", padding: "0 10px", display: "flex", alignItems: "center", fontSize: 12, color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>
                  <Instagram size={12} style={{ marginRight: 6, opacity: 0.5 }} />instagram.com/
                </div>
                <input
                  type="text"
                  value={config.instagram}
                  onChange={(e) => {
                    let val = e.target.value.replace(/^@/, "").replace(/\s/g, "");
                    if (val.includes("instagram.com/")) val = val.split("instagram.com/").pop();
                    setConfig({ ...config, instagram: val });
                  }}
                  style={{ ...inp, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                  placeholder="kullaniciadi"
                />
              </div>
            </div>
            <div>
              <label style={label}>WhatsApp</label>
              <div style={{ display: "flex" }}>
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRight: "none", padding: "0 10px", display: "flex", alignItems: "center", fontSize: 12, color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>
                  <MessageCircle size={12} style={{ marginRight: 6, opacity: 0.5 }} />+90
                </div>
                <input
                  type="tel"
                  value={config.whatsapp ? config.whatsapp.replace(/^90/, "") : ""}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, "");
                    if (val.startsWith("0")) val = val.slice(1);
                    setConfig({ ...config, whatsapp: val ? "90" + val : "" });
                  }}
                  style={{ ...inp, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                  placeholder="5XX XXX XX XX"
                  maxLength={10}
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
        {activeTab === "sistem" && subTab === "bildirim" && <div style={sectionCard}>
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
              borderRadius: 0, padding: "18px 16px", cursor: isPro ? "pointer" : "default", transition: "all 0.2s",
              opacity: isPro ? 1 : 0.5,
            }}
              onClick={() => isPro && setConfig({ ...config, smsEnabled: !config.smsEnabled })}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Phone size={16} style={{ color: config.smsEnabled ? "#fff" : "rgba(255,255,255,0.3)" }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: config.smsEnabled ? "#fff" : "rgba(255,255,255,0.5)" }}>SMS</span>
                  {!isPro && <span style={{ fontSize: 9, fontWeight: 800, color: "#8b5cf6", background: "rgba(139,92,246,0.15)", padding: "2px 6px" }}>PRO</span>}
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
                {isPro ? "Netgsm API ile SMS bildirimleri" : "SMS bildirimleri Pro plana dahildir."}
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
                    style={inp} placeholder="STUDYO ADI"
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
              { key: "notifyReservation", icon: "📅", text: "Randevu onayı", desc: "Randevu oluşturulduğunda" },
              { key: "notifyPayment", icon: "💰", text: "Ödeme alındı", desc: "Ödeme başarılı olduğunda" },
              { key: "notifyReminder", icon: "⏰", text: "Hatırlatma", desc: "Randevuya 1 hafta kala" },
              ...(businessType === "photographer" ? [{ key: "notifyPhotosReady", icon: "📸", text: "Fotoğraflar hazır", desc: "Fotoğraflar teslim edildiğinde" }] : []),
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
        {activeTab === "sistem" && subTab === "sozlesme" && <div style={sectionCard}>
          {sectionHeader(FileText, "Yasal Sözleşmeler", "Müşterinin ödeme öncesi onaylaması gereken sözleşme ve metinler.")}

          <div style={{ marginBottom: 24 }}>
            <label style={label}>Hizmet Sözleşmesi</label>
            <textarea
              value={config.contractText || getServiceAgreement(adminSession?.tenant)}
              onChange={(e) => setConfig({ ...config, contractText: e.target.value })}
              style={{
                ...inp,
                minHeight: 250,
                resize: "vertical",
                lineHeight: 1.7,
                fontFamily: "inherit",
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={label}>Mesafeli Satış Sözleşmesi</label>
            <textarea
              value={config.distanceSalesContractText || getDistanceSalesContract(adminSession?.tenant)}
              onChange={(e) => setConfig({ ...config, distanceSalesContractText: e.target.value })}
              style={{
                ...inp,
                minHeight: 250,
                resize: "vertical",
                lineHeight: 1.7,
                fontFamily: "inherit",
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={label}>Ön Bilgilendirme Formu</label>
            <textarea
              value={config.preliminaryInfoText || getPreliminaryInfoForm(adminSession?.tenant)}
              onChange={(e) => setConfig({ ...config, preliminaryInfoText: e.target.value })}
              style={{
                ...inp,
                minHeight: 250,
                resize: "vertical",
                lineHeight: 1.7,
                fontFamily: "inherit",
              }}
            />
          </div>

          <div>
            <label style={label}>KVKK Aydınlatma Metni</label>
            <textarea
              value={config.kvkkText || getKVKKText(adminSession?.tenant)}
              onChange={(e) => setConfig({ ...config, kvkkText: e.target.value })}
              style={{
                ...inp,
                minHeight: 250,
                resize: "vertical",
                lineHeight: 1.7,
                fontFamily: "inherit",
              }}
            />
          </div>
        </div>}

        {/* İndirim Kodları Section */}
        {activeTab === "sistem" && subTab === "indirim" && <div style={sectionCard}>
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
        {activeTab === "sistem" && subTab === "ai" && <div style={sectionCard}>
          {sectionHeader(Bot, "AI Chatbot Ayarları", "Yapay zeka asistanının davranışını ve talimatlarını düzenleyin.")}

          {!isPro && (
            <div style={{ padding: "16px 20px", background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
              <Sparkles size={16} style={{ color: "#8b5cf6" }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#8b5cf6" }}>Pro Özelliği</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>AI Chatbot Pro plana dahildir. <a href="/admin/subscription" style={{ color: "#8b5cf6", textDecoration: "underline" }}>Planı Yükselt</a></div>
              </div>
            </div>
          )}

          {/* Toggle */}
          <div
            style={{
              background: config.chatbotEnabled ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${config.chatbotEnabled ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 0, padding: "18px 16px", cursor: isPro ? "pointer" : "default", transition: "all 0.2s",
              marginBottom: 16, opacity: isPro ? 1 : 0.5,
            }}
            onClick={() => isPro && setConfig({ ...config, chatbotEnabled: !config.chatbotEnabled })}
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
                placeholder={isPhotographer
                  ? `Buraya AI'ın nasıl davranmasını istediğini yaz. Örnekler:

• Kendini "Emre" olarak tanıt, samimi ol
• Müşterilere önce dış çekim paketini öner
• Fiyat sorulduğunda nakit indirimi mutlaka belirt
• Düğün tarihi yakınsa acil rezervasyon yapmasını söyle
• Rakipleri kötüleme
• Kısa ve öz cevaplar ver, uzun yazma
• Müşteriye her zaman "siz" diye hitap et
• Şaka yap, emoji kullan
• Bütçesi düşükse taksit seçeneğini belirt`
                  : `Buraya AI'ın nasıl davranmasını istediğini yaz. Örnekler:

• Kendini "${terms?.provider || 'Asistan'}" olarak tanıt
• Hastaları/müşterileri kısa ve net bilgilendir
• ${terms?.appointment || 'Randevu'} saatleri ve ücretler hakkında bilgi ver
• Acil durumlar için 112'yi aramalarını söyle
• ${terms?.services || 'Hizmetler'} hakkında detaylı bilgi ver
• Rakipleri kötüleme
• Kısa ve öz cevaplar ver
• Her zaman "siz" diye hitap et
• Samimi ama profesyonel ol`}
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
                    <span key={i} style={{ fontSize: 10, fontWeight: 600, padding: "4px 10px", borderRadius: 0, background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.06)" }}>{item}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>}

      {/* ── Section Order / Sayfa Düzeni ── */}
      {activeTab === "tasarim" && subTab === "duzen" && (() => {
        const SECTION_META = {
          events: { icon: "📅", label: "Etkinlikler", desc: "Yaklaşan etkinlikler ve workshop'lar" },
          banners: { icon: "🖼️", label: "Banner Carousel", desc: "Kayan görsel ve video banner'lar" },
          content: { icon: "📝", label: "İçerik Blokları", desc: "Görsel + metin tanıtım bölümleri" },
          portfolio: { icon: "📸", label: "Portfolyo / Galeri", desc: "Fotoğraf kategorileri ve galeri" },
          blog: { icon: "📰", label: "Blog & Haberler", desc: "Güncel yazılar ve makaleler" },
          services: { icon: "💼", label: "Hizmetler / Paketler", desc: "Paket ve hizmet kartları" },
          shop: { icon: "🛍️", label: "Mağaza", desc: "E-ticaret ürünleri" },
        };
        const DEFAULT_ORDER = ["events", "banners", "content", "portfolio", "blog", "services", "shop"];
        const currentOrder = (() => {
          try {
            const saved = config?.sectionOrder;
            if (saved && Array.isArray(saved) && saved.length > 0) return [...saved];
          } catch (e) {}
          return [...DEFAULT_ORDER];
        })();
        // Ensure all sections present
        DEFAULT_ORDER.forEach(s => { if (!currentOrder.includes(s)) currentOrder.push(s); });

        const moveSection = async (idx, dir) => {
          const newOrder = [...currentOrder];
          const swapIdx = idx + dir;
          if (swapIdx < 0 || swapIdx >= newOrder.length) return;
          [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
          setConfig({ ...config, sectionOrder: newOrder });
          // Auto-save
          setSaving(true);
          await updateSiteConfig({ ...config, sectionOrder: newOrder });
          setSaving(false);
          setMessage("Bölüm sırası güncellendi.");
          setTimeout(() => setMessage(""), 2000);
        };

        const resetOrder = async () => {
          setConfig({ ...config, sectionOrder: DEFAULT_ORDER });
          setSaving(true);
          await updateSiteConfig({ ...config, sectionOrder: DEFAULT_ORDER });
          setSaving(false);
          setMessage("Varsayılan sıralama geri yüklendi.");
          setTimeout(() => setMessage(""), 2000);
        };

        return (
          <div style={sectionCard}>
            {sectionHeader(Layers, "Sayfa Bölüm Sıralaması", "Anasayfadaki bölümlerin görünüm sırasını değiştirin. Hero her zaman en üstte, Footer her zaman en altta kalır.")}

            {/* Fixed sections indicator */}
            <div style={{
              padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
              marginBottom: 8, display: "flex", alignItems: "center", gap: 10, opacity: 0.4,
            }}>
              <div style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🏠</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>Hero Bölümü</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Sabit · Her zaman en üstte</div>
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontWeight: 700 }}>SABİT</div>
            </div>

            {/* Orderable sections */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {currentOrder.map((sId, idx) => {
                const meta = SECTION_META[sId] || { icon: "❓", label: sId, desc: "" };
                return (
                  <div key={sId} style={{
                    padding: "12px 14px", background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex", alignItems: "center", gap: 10,
                    transition: "all 0.2s",
                  }}>
                    {/* Order number */}
                    <div style={{
                      width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                      background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                      fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.5)",
                    }}>
                      {idx + 1}
                    </div>

                    {/* Icon */}
                    <div style={{ fontSize: 18, width: 28, textAlign: "center" }}>{meta.icon}</div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{meta.label}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{meta.desc}</div>
                    </div>

                    {/* Move buttons */}
                    <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                      <button type="button" disabled={idx === 0} onClick={() => moveSection(idx, -1)} style={{
                        width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
                        background: idx === 0 ? "none" : "rgba(255,255,255,0.06)",
                        border: idx === 0 ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(255,255,255,0.1)",
                        cursor: idx === 0 ? "not-allowed" : "pointer",
                        color: idx === 0 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.6)",
                        transition: "all 0.15s",
                      }}>
                        <ArrowUp size={14} />
                      </button>
                      <button type="button" disabled={idx === currentOrder.length - 1} onClick={() => moveSection(idx, 1)} style={{
                        width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
                        background: idx === currentOrder.length - 1 ? "none" : "rgba(255,255,255,0.06)",
                        border: idx === currentOrder.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(255,255,255,0.1)",
                        cursor: idx === currentOrder.length - 1 ? "not-allowed" : "pointer",
                        color: idx === currentOrder.length - 1 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.6)",
                        transition: "all 0.15s",
                      }}>
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Fixed footer indicator */}
            <div style={{
              padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
              marginTop: 8, display: "flex", alignItems: "center", gap: 10, opacity: 0.4,
            }}>
              <div style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📍</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>Footer & İletişim</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Sabit · Her zaman en altta</div>
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontWeight: 700 }}>SABİT</div>
            </div>

            {/* Reset button */}
            <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: 0 }}>
                💡 Yukarı/aşağı oklarla bölüm sırasını değiştirin. Değişiklikler otomatik kaydedilir.
              </p>
              <button type="button" onClick={resetOrder} style={{
                padding: "8px 16px", background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700,
                cursor: "pointer", whiteSpace: "nowrap",
              }}>
                Sıfırla
              </button>
            </div>
          </div>
        );
      })()}

      {/* ── Content Blocks ── */}
      {activeTab === "icerik" && subTab === "icerik_blok" && <div style={sectionCard}>
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
              options={{ maxFiles: 10, resourceType: "image", maxImageFileSize: 5242880, maxVideoFileSize: 125829120 }}
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
            background: (cbForm.title || cbForm.imageUrls.length > 0) ? "#fff" : "rgba(255,255,255,0.06)",
            color: (cbForm.title || cbForm.imageUrls.length > 0) ? "#000" : "rgba(255,255,255,0.3)",
            fontWeight: 800, fontSize: 12, cursor: (cbForm.title || cbForm.imageUrls.length > 0) ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", gap: 8, width: "fit-content",
          }}>
            <Plus size={14} /> {cbUploading ? "Ekleniyor..." : "Blok Ekle"}
          </button>
        </div>
      </div>}

      {/* ── Instagram Reels ── */}
      {activeTab === "icerik" && subTab === "reels" && <div style={sectionCard}>
        {sectionHeader(Instagram, "Instagram Reels", "Reels URL'lerini ve kapak fotoğraflarını ekleyin.")}

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            type="text"
            value={config._reelInput || ""}
            onChange={(e) => setConfig({ ...config, _reelInput: e.target.value })}
            style={{ ...inp, flex: 1 }}
            placeholder="https://www.instagram.com/reel/XXXXX/"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const url = (config._reelInput || "").trim();
                if (!url) return;
                const reels = Array.isArray(config.instagramReels) ? [...config.instagramReels] : [];
                if (reels.length >= 6) return;
                const exists = reels.some(r => (typeof r === "string" ? r : r.url) === url);
                if (exists) return;
                setConfig({ ...config, instagramReels: [...reels, { url, coverUrl: "" }], _reelInput: "" });
              }
            }}
          />
          <button
            onClick={() => {
              const url = (config._reelInput || "").trim();
              if (!url) return;
              const reels = Array.isArray(config.instagramReels) ? [...config.instagramReels] : [];
              if (reels.length >= 6) return;
              const exists = reels.some(r => (typeof r === "string" ? r : r.url) === url);
              if (exists) return;
              setConfig({ ...config, instagramReels: [...reels, { url, coverUrl: "" }], _reelInput: "" });
            }}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "0 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            + Ekle
          </button>
        </div>

        {Array.isArray(config.instagramReels) && config.instagramReels.length > 0 ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
              {config.instagramReels.map((reel, i) => {
                // Eski format uyumluluğu: string → object
                const reelObj = typeof reel === "string" ? { url: reel, coverUrl: "", coverType: "image" } : reel;
                const isVideo = reelObj.coverType === "video" || (reelObj.coverUrl && /\.(mp4|mov|webm)/i.test(reelObj.coverUrl));
                return (
                  <div key={i} style={{ position: "relative", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, overflow: "hidden" }}>
                    {/* Kapak Görseli / Video */}
                    <div style={{ aspectRatio: "9/16", background: "#111", position: "relative", overflow: "hidden" }}>
                      {reelObj.coverUrl ? (
                        isVideo ? (
                          <video src={reelObj.coverUrl} autoPlay muted loop playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <img src={reelObj.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        )
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                          <div style={{ fontSize: 28, opacity: 0.2 }}>🎬</div>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>Fotoğraf veya video ekle</div>
                        </div>
                      )}
                      {/* Silme butonu */}
                      <button
                        onClick={() => {
                          const reels = [...config.instagramReels];
                          reels.splice(i, 1);
                          setConfig({ ...config, instagramReels: reels });
                        }}
                        style={{ position: "absolute", top: 6, right: 6, width: 22, height: 22, background: "rgba(0,0,0,0.7)", border: "none", color: "#fff", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, zIndex: 5 }}
                      >✕</button>
                    </div>
                    {/* Upload + URL bilgisi */}
                    <div style={{ padding: "8px 10px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <CldUploadWidget
                        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                        options={{ maxFiles: 1, sources: ["local", "camera"], resourceType: "auto", folder: "reels", maxImageFileSize: 5242880, maxVideoFileSize: 125829120 }}
                        onSuccess={(result) => {
                          const reels = [...config.instagramReels].map((r, idx) => {
                            if (idx !== i) return r;
                            const obj = typeof r === "string" ? { url: r, coverUrl: "" } : { ...r };
                            obj.coverUrl = result.info.secure_url;
                            obj.coverType = result.info.resource_type === "video" ? "video" : "image";
                            return obj;
                          });
                          setConfig({ ...config, instagramReels: reels });
                        }}
                      >
                        {({ open }) => (
                          <button onClick={() => open()} style={{ width: "100%", padding: "6px 0", fontSize: 11, fontWeight: 600, background: reelObj.coverUrl ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", borderRadius: 4, marginBottom: 6 }}>
                            {reelObj.coverUrl ? "🔄 Kapağı Değiştir" : "📷 Fotoğraf / Video Yükle"}
                          </button>
                        )}
                      </CldUploadWidget>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {reelObj.url}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 12 }}>{config.instagramReels.length}/6 reel eklendi</div>
          </>
        ) : (
          <div style={{ padding: "40px 20px", textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>📱</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>Henüz reel eklenmedi</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.15)" }}>Instagram reel URL'sini yukarıdaki alana yapıştırıp ekleyin</div>
          </div>
        )}
      </div>}

      {/* ── Portfolyo Yönetimi ── */}
      {activeTab === "icerik" && subTab === "portfolio" && <div style={sectionCard}>
        {sectionHeader(ImageIcon, "Portfolyo", "Anasayfada gösterilecek portfolyo fotoğraflarını yönetin.")}

        {/* Yeni Kategori Ekle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Yeni kategori adı"
            style={{ ...inp, flex: 1 }}
          />
          <button
            type="button"
            disabled={!newCategoryName.trim()}
            onClick={async () => {
              const res = await createPortfolioCategory(newCategoryName.trim());
              if (res.success) {
                setPortfolioCategories((await getPortfolioCategories())?.categories || []);
                setNewCategoryName("");
              }
            }}
            style={{
              padding: "10px 18px", borderRadius: 0, border: "none",
              background: newCategoryName.trim() ? "#fff" : "rgba(255,255,255,0.06)",
              color: newCategoryName.trim() ? "#000" : "rgba(255,255,255,0.3)",
              fontWeight: 800, fontSize: 12, cursor: newCategoryName.trim() ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
            }}
          >
            <Plus size={14} /> Ekle
          </button>
        </div>

        {/* Kategoriler ve Fotoğraflar */}
        {portfolioCategories.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {portfolioCategories.map((cat) => (
              <div key={cat.id} style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: 14,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{cat.name}</span>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <CldUploadWidget
                      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                      options={{ maxFiles: 5, resourceType: "image", folder: "portfolio", maxImageFileSize: 5242880, maxVideoFileSize: 125829120 }}
                      onSuccess={async (result) => {
                        if (result.event === "success") {
                          await addPhotoToPortfolio(cat.id, result.info.secure_url, result.info.public_id);
                          setPortfolioCategories((await getPortfolioCategories())?.categories || []);
                        }
                      }}
                    >
                      {({ open }) => (
                        <button type="button" onClick={() => open()} style={{
                          padding: "4px 10px", borderRadius: 0, border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)",
                          fontSize: 11, fontWeight: 700, cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 4,
                        }}>
                          <UploadCloud size={12} /> Yükle
                        </button>
                      )}
                    </CldUploadWidget>
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm(`"${cat.name}" kategorisini ve tüm fotoğraflarını silmek istediğinize emin misiniz?`)) {
                          await deletePortfolioCategory(cat.id);
                          setPortfolioCategories((await getPortfolioCategories())?.categories || []);
                        }
                      }}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "rgba(255,255,255,0.3)" }}
                    ><Trash2 size={14} /></button>
                  </div>
                </div>

                {/* Photos Grid */}
                {cat.photos && cat.photos.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 6 }}>
                    {cat.photos.map((photo) => (
                      <div key={photo.id} style={{ position: "relative", aspectRatio: "1", overflow: "hidden" }}>
                        <img src={photo.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button
                          type="button"
                          onClick={async () => {
                            await deletePortfolioPhoto(photo.id);
                            setPortfolioCategories((await getPortfolioCategories())?.categories || []);
                          }}
                          style={{
                            position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.7)",
                            border: "none", color: "#ff6b6b", cursor: "pointer", padding: 2, borderRadius: 0,
                          }}
                        ><Trash2 size={10} /></button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: 16, color: "rgba(255,255,255,0.25)", fontSize: 11 }}>
                    Henüz fotoğraf yok. Yüklemek için yukarıdaki butonu kullanın.
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "24px 0", color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
            Henüz portfolyo kategorisi eklenmemiş.
          </div>
        )}
      </div>}

        {/* ═══ MARKA SEKME ═══ */}
        {activeTab === "tasarim" && subTab === "tema" && <div style={sectionCard}>
          {sectionHeader(Palette, "Marka & Kimlik", "Tema, logo, işletme adı ve SEO ayarları.")}

          {/* Tema Seçimi Kaldırıldı */}

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
                options={{ maxFiles: 1, resourceType: "image", folder: "logos", maxImageFileSize: 5242880, maxVideoFileSize: 125829120 }}
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
            <input type="text" value={config.businessName || ""} onChange={e => setConfig({ ...config, businessName: e.target.value })} style={inp} placeholder={terms?.placeName || "İşletme Adınız"} />
          </div>

          {/* Footer Slogan */}
          <div style={{ marginBottom: 16 }}>
            <label style={label}>Footer Sloganı</label>
            <input type="text" value={config.footerTagline || ""} onChange={e => setConfig({ ...config, footerTagline: e.target.value })} style={inp} placeholder={(() => { try { const { getBusinessType: gbt } = require("@/lib/business-types"); return gbt(businessType).defaultSlogan; } catch { return "İşletmenizin sloganı"; } })()} />
          </div>


          {/* SEO */}
          <div style={{ marginBottom: 16 }}>
            <label style={label}>SEO Başlık</label>
            <input type="text" value={config.seoTitle || ""} onChange={e => setConfig({ ...config, seoTitle: e.target.value })} style={inp} placeholder={`İşletme Adı | ${bt.name} Hizmetleri`} />
          </div>
          <div>
            <label style={label}>SEO Açıklama</label>
            <textarea value={config.seoDescription || ""} onChange={e => setConfig({ ...config, seoDescription: e.target.value })} style={{ ...inp, minHeight: 70, resize: "vertical" }} placeholder={`Profesyonel ${terms.service.toLowerCase()} hizmetleri...`} />
          </div>
        </div>}

        {/* ═══ ÖDEME SEKME ═══ */}
        {activeTab === "sistem" && subTab === "odeme" && <div style={sectionCard}>
          {sectionHeader(Banknote, "Ödeme Ayarları", "Müşterilerinizden online ödeme almak için pazaryeri kaydınızı tamamlayın.")}

          <div style={{ padding: "20px", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
            Platformumuz, online ödemeler (Kredi Kartı) ve Nakit / Havale ödemelerini otomatik olarak yönetir.
            Kredi kartı ile ödeme alabilmek için lütfen aşağıdaki "Alt Üye İşyeri Kaydı" işlemini tamamlayın. Onaylandığında kredi kartı ödemeleri otomatik olarak aktifleşecektir.
          </div>

          <div style={{ marginTop: 24, padding: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <div style={{
                width: 40, height: 24, borderRadius: 12, background: config?.allowPaymentMethodChange ? "#4ade80" : "rgba(255,255,255,0.1)",
                position: "relative", transition: "all 0.2s"
              }}>
                <div style={{
                  position: "absolute", top: 2, left: config?.allowPaymentMethodChange ? 18 : 2, width: 20, height: 20,
                  borderRadius: "50%", background: "#fff", transition: "all 0.2s"
                }} />
              </div>
              <input 
                type="checkbox" 
                checked={config?.allowPaymentMethodChange || false}
                onChange={(e) => setConfig({ ...config, allowPaymentMethodChange: e.target.checked })}
                style={{ display: "none" }}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Müşterilerin Ödeme Yöntemi Değiştirmesine İzin Ver</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Aktif edilirse, "Nakit" olarak seçilmiş bir ödemeyi müşteri kendisi +%15 farkla "Kredi Kartı" seçeneğine çevirebilir.</div>
              </div>
            </label>
          </div>

        </div>}

        {/* Alt Üye İşyeri Kayıt Formu */}
        {activeTab === "sistem" && subTab === "odeme" && <div style={sectionCard}>
          {sectionHeader(Building2, "Alt Üye İşyeri Kaydı", `${PLATFORM.name} pazaryeri üzerinden kredi kartı ile ödeme alabilmeniz için yasal bilgilerinizi girin.`)}

          {/* Durum Göstergesi */}
          {smStatus !== "NOT_STARTED" && (
            <div style={{
              padding: "14px 18px", marginBottom: 20,
              background: smStatus === "APPROVED" ? "rgba(74,222,128,0.08)" : smStatus === "REJECTED" ? "rgba(239,68,68,0.08)" : "rgba(250,204,21,0.08)",
              border: `1px solid ${smStatus === "APPROVED" ? "rgba(74,222,128,0.2)" : smStatus === "REJECTED" ? "rgba(239,68,68,0.2)" : "rgba(250,204,21,0.2)"}`,
              display: "flex", alignItems: "center", gap: 12,
            }}>
              {smStatus === "APPROVED" ? <CheckCircle2 size={18} style={{ color: "#4ade80" }} /> :
               smStatus === "REJECTED" ? <AlertCircle size={18} style={{ color: "#ef4444" }} /> :
               <Shield size={18} style={{ color: "#facc15" }} /> }
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                  {smStatus === "APPROVED" ? "✅ Onaylandı" : smStatus === "REJECTED" ? "❌ Reddedildi" : "⏳ İnceleniyor"}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                  {smStatus === "APPROVED"
                    ? "Alt üye işyeri kaydınız onaylandı. Kredi kartı ödemesi alabilirsiniz."
                    : smStatus === "REJECTED"
                    ? "Başvurunuz reddedildi. Bilgilerinizi kontrol edip tekrar gönderin."
                    : "Başvurunuz inceleniyor. Onay sonuçları size e-posta ile bildirilecek."}
                </div>
              </div>
            </div>
          )}

          {/* Komisyon Bilgisi */}
          <div style={{
            padding: "14px 18px", marginBottom: 20,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <CreditCard size={18} style={{ color: "rgba(255,255,255,0.5)" }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                Platform Komisyonu: %{smCommission}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                Her başarılı kredi kartı ödemesinden platform %{smCommission} komisyon keser, kalan tutarı IBAN hesabınıza aktarır.
              </div>
            </div>
          </div>

          {/* İşletme Türü */}
          <div style={{ marginBottom: 16 }}>
            <label style={label}>İşletme Türü</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              {LEGAL_TYPES.map(lt => (
                <button key={lt.value} type="button"
                  onClick={() => setSmForm(p => ({ ...p, legalType: lt.value }))}
                  style={{
                    padding: "12px 14px", textAlign: "left", cursor: "pointer",
                    background: smForm.legalType === lt.value ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
                    border: smForm.legalType === lt.value ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 0,
                  }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: smForm.legalType === lt.value ? "#fff" : "rgba(255,255,255,0.5)" }}>{lt.label}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{lt.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Resmi Ad */}
          <div style={{ marginBottom: 16 }}>
            <label style={label}>{smForm.legalType === "personal" ? "Ad Soyad" : "Resmi Unvan"} *</label>
            <input type="text" value={smForm.legalName}
              onChange={e => setSmForm(p => ({ ...p, legalName: e.target.value }))}
              style={inp}
              placeholder={smForm.legalType === "personal" ? "Örn: Ahmet Yılmaz" : "Örn: XYZ Teknoloji Ltd. Şti."}
            />
          </div>

          {/* TCKN / VKN */}
          <div style={{ marginBottom: 16 }}>
            <label style={label}>{smForm.legalType === "personal" ? "T.C. Kimlik No (TCKN)" : "Vergi Kimlik No (VKN)"} *</label>
            <input type="text" value={smForm.taxId}
              onChange={e => setSmForm(p => ({ ...p, taxId: e.target.value.replace(/[^0-9]/g, "").slice(0, 11) }))}
              style={inp}
              placeholder={smForm.legalType === "personal" ? "11 haneli TCKN" : "10 haneli VKN"}
              maxLength={11}
            />
          </div>

          {/* Vergi Dairesi */}
          <div style={{ marginBottom: 16 }}>
            <label style={label}>Vergi Dairesi</label>
            <input type="text" value={smForm.taxOffice}
              onChange={e => setSmForm(p => ({ ...p, taxOffice: e.target.value }))}
              style={inp}
              placeholder="Örn: Kadıköy"
            />
          </div>

          {/* IBAN */}
          <div style={{ marginBottom: 16 }}>
            <label style={label}>IBAN *</label>
            <input type="text" value={smForm.iban}
              onChange={e => {
                let v = e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
                // Format: TR00 0000 0000 0000 0000 0000 00
                if (v.length > 26) v = v.slice(0, 26);
                const formatted = v.replace(/(.{4})/g, "$1 ").trim();
                setSmForm(p => ({ ...p, iban: formatted }));
              }}
              style={{ ...inp, fontFamily: "monospace", letterSpacing: "0.05em" }}
              placeholder="TR00 0000 0000 0000 0000 0000 00"
              maxLength={32}
            />
          </div>

          {/* Vergi Levhası Yükleme */}
          <div style={{ marginBottom: 16 }}>
            <label style={label}>Vergi Levhası / Kimlik Fotoğrafı *</label>
            <CldUploadWidget
              uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ""}
              onSuccess={(res) => {
                if (res.event === "success") {
                  setSmForm(p => ({ ...p, taxPlateUrl: res.info.secure_url }));
                }
              }}
              options={{ multiple: false, cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, resourceType: "image", maxImageFileSize: 5242880, maxVideoFileSize: 125829120 }}
            >
              {({ open }) => (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => open()}
                    style={{
                      padding: "10px 16px", borderRadius: 0, cursor: "pointer",
                      border: "1px dashed rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.03)",
                      color: "#fff", fontSize: 12, fontWeight: 700,
                      display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s"
                    }}
                  >
                    <UploadCloud size={14} /> Fotoğraf Yükle
                  </button>
                  {smForm.taxPlateUrl && (
                    <a href={smForm.taxPlateUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#4ade80", textDecoration: "underline", display: "flex", alignItems: "center", gap: 6 }}>
                      <CheckCircle2 size={14} /> Yüklendi
                    </a>
                  )}
                </div>
              )}
            </CldUploadWidget>
          </div>

          {/* Adres */}
          <div style={{ marginBottom: 20 }}>
            <label style={label}>Resmi Adres</label>
            <textarea value={smForm.legalAddress}
              onChange={e => setSmForm(p => ({ ...p, legalAddress: e.target.value }))}
              style={{ ...inp, minHeight: 70, resize: "vertical" }}
              placeholder="İşletmenizin resmi tebligat adresi"
            />
          </div>

          {/* Sözleşme Onayı */}
          <div
            onClick={() => setSmForm(p => ({ ...p, sellerAgreementAccepted: !p.sellerAgreementAccepted }))}
            style={{
              display: "flex", alignItems: "flex-start", gap: 12, padding: "16px",
              marginBottom: 20, cursor: "pointer",
              background: smForm.sellerAgreementAccepted ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${smForm.sellerAgreementAccepted ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)"}`,
              transition: "all 0.2s",
            }}>
            <div style={{
              width: 22, height: 22, borderRadius: 0, flexShrink: 0, marginTop: 1,
              border: `2px solid ${smForm.sellerAgreementAccepted ? "#fff" : "rgba(255,255,255,0.2)"}`,
              background: smForm.sellerAgreementAccepted ? "#fff" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}>
              {smForm.sellerAgreementAccepted && <CheckCircle2 size={14} style={{ color: "#000" }} />}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: smForm.sellerAgreementAccepted ? "#fff" : "rgba(255,255,255,0.5)", marginBottom: 4 }}>
                Satıcı Hizmet Sözleşmesini okudum ve kabul ediyorum *
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
                <a href="/sozlesme" target="_blank" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "underline" }}>Satıcı Hizmet Sözleşmesi</a>,{" "}
                <a href="/sozlesme" target="_blank" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "underline" }}>KVKK Aydınlatma Metni</a> ve{" "}
                <a href="/sozlesme" target="_blank" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "underline" }}>Mesafeli Satış Sözleşmesi</a> şartlarını kabul ediyorum.
              </div>
            </div>
          </div>

          {/* Durum Mesajı */}
          {smMessage && (
            <div style={{
              padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10,
              background: smError ? "rgba(255,68,68,0.06)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${smError ? "rgba(255,68,68,0.15)" : "rgba(255,255,255,0.1)"}`,
              color: smError ? "#ff8a8a" : "#fff",
            }}>
              {smError ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
              <span style={{ fontSize: 12, fontWeight: 700 }}>{smMessage}</span>
            </div>
          )}

          {/* Kaydet Butonu */}
          <button
            type="button"
            disabled={smSaving || !smForm.legalName || !smForm.taxId || !smForm.iban || !smForm.taxPlateUrl || !smForm.sellerAgreementAccepted}
            onClick={async () => {
              setSmSaving(true);
              setSmMessage("");
              setSmError(false);
              const res = await updateSubMerchantInfo(smForm);
              if (res.success) {
                setSmMessage("Başvurunuz alındı. İnceleme sonucu size bildirilecek.");
                setSmStatus("PENDING");
                setTimeout(() => setSmMessage(""), 5000);
              } else {
                setSmMessage(res.error || "Bir hata oluştu.");
                setSmError(true);
              }
              setSmSaving(false);
            }}
            style={{
              width: "100%", padding: 16, borderRadius: 0, border: "none",
              background: (smForm.legalName && smForm.taxId && smForm.iban && smForm.taxPlateUrl && smForm.sellerAgreementAccepted) ? "#fff" : "rgba(255,255,255,0.06)",
              color: (smForm.legalName && smForm.taxId && smForm.iban && smForm.taxPlateUrl && smForm.sellerAgreementAccepted) ? "#000" : "rgba(255,255,255,0.3)",
              fontWeight: 800, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em",
              cursor: (smForm.legalName && smForm.taxId && smForm.iban && smForm.taxPlateUrl && smForm.sellerAgreementAccepted) ? "pointer" : "not-allowed",
              opacity: smSaving ? 0.5 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              transition: "all 0.2s",
            }}>
            {smSaving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Shield size={16} />}
            {smSaving ? "Gönderiliyor..." : smStatus === "PENDING" ? "Bilgileri Güncelle" : "Başvuruyu Gönder"}
          </button>
        </div>}

        {/* 6. Domain Yönetimi */}
        {activeTab === "genel" && subTab === "domain" && <div style={sectionCard}>
          {sectionHeader(Globe, "Alan Adı (Domain) Ayarları", "Sitenize kendi alan adınızdan (www.siteniz.com) ulaşılmasını sağlayın.")}
          
          <div style={{ position: "relative" }}>
            {!planLimits.customDomain && (
              <div style={{ position: "absolute", inset: 0, zIndex: 10, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 8 }}>
                <div style={{ padding: "30px", textAlign: "center", background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, boxShadow: "0 10px 40px rgba(0,0,0,0.5)", maxWidth: 400 }}>
                  <div style={{ fontSize: 32, marginBottom: 16 }}>⭐</div>
                  <h3 style={{ fontSize: 18, margin: "0 0 8px 0", color: "#fff", fontWeight: 800 }}>Pro Plana Özel Özellik</h3>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 20, lineHeight: 1.5 }}>Özel alan adı (domain) satın almak veya mevcut alan adınızı bağlamak için planınızı yükseltmeniz gerekmektedir.</p>
                  <Link href="/admin/subscription" style={{ display: "inline-block", background: "var(--text)", color: "var(--bg)", padding: "12px 24px", fontSize: 13, fontWeight: 700, textDecoration: "none", borderRadius: 4 }}>Planı Yükselt</Link>
                </div>
              </div>
            )}
            
            <div style={{ opacity: !planLimits.customDomain ? 0.3 : 1, pointerEvents: !planLimits.customDomain ? "none" : "auto", userSelect: !planLimits.customDomain ? "none" : "auto" }}>
              <div style={{ marginBottom: 32, padding: "24px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <h3 style={{ fontSize: 16, margin: "0 0 8px 0", color: "var(--text)" }}>Yeni Domain Satın Al (Sıfır Ayar)</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: "0 0 16px 0", lineHeight: 1.5 }}>
              Sistemimiz üzerinden doğrudan domain satın alabilirsiniz. DNS, SSL veya yönlendirme ayarlarına gerek kalmadan saniyeler içinde domaininiz yayına girer.
            </p>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <input
                type="text"
                value={searchDomainName}
                onChange={(e) => setSearchDomainName(e.target.value)}
                style={{ ...inp, marginBottom: 0, flex: 1 }}
                placeholder="Örn: ahmetfotograf.com"
              />
              <button
                type="button"
                disabled={searchLoading || !searchDomainName}
                onClick={async () => {
                  setSearchLoading(true);
                  setSearchResult(null);
                  const res = await checkDomainAvailability(searchDomainName);
                  setSearchResult(res);
                  setSearchLoading(false);
                }}
                style={{ background: "var(--text)", color: "var(--bg)", border: "none", padding: "12px 24px", fontWeight: 700, cursor: "pointer", fontSize: 13, borderRadius: 0 }}
              >
                {searchLoading ? "Sorgulanıyor..." : "Sorgula"}
              </button>
            </div>
            
            {searchResult && (
              <div style={{ marginTop: 16 }}>
                {searchResult.error ? (
                  <div style={{ padding: "16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    <p style={{ margin: 0, color: "#ef4444", fontSize: 13 }}>{searchResult.error}</p>
                  </div>
                ) : searchResult.results ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {searchResult.results.map((item, index) => (
                      <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: item.error || !item.available ? "rgba(239,68,68,0.05)" : "rgba(34,197,94,0.05)", border: item.error || !item.available ? "1px solid rgba(239,68,68,0.1)" : "1px solid rgba(34,197,94,0.2)" }}>
                        <div>
                          <p style={{ margin: "0 0 4px 0", color: item.available ? "#22c55e" : "#ef4444", fontWeight: "bold", fontSize: 14 }}>
                            {item.available ? `✅ ${item.domain} Müsait!` : `❌ ${item.domain} Alınmış`}
                          </p>
                          {item.available && <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Yıllık Yenileme Ücreti Dahil Fiyat</p>}
                          {item.error && <p style={{ margin: 0, color: "#ef4444", fontSize: 12 }}>{item.error}</p>}
                        </div>
                        {item.available && (
                          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                            <select 
                              value={selectedYears} 
                              onChange={(e) => setSelectedYears(Number(e.target.value))}
                              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "8px", borderRadius: "4px" }}
                            >
                              <option value={1} style={{color: "#000"}}>1 Yıl</option>
                              <option value={2} style={{color: "#000"}}>2 Yıl</option>
                              <option value={3} style={{color: "#000"}}>3 Yıl</option>
                            </select>
                            <span style={{ fontSize: 18, fontWeight: "bold", color: "var(--text)" }}>{item.price * selectedYears} ₺</span>
                            <button 
                              type="button"
                              disabled={domainSaving}
                              onClick={async () => {
                                setDomainSaving(true);
                                setDomainMessage("");
                                try {
                                  const res = await fetch("/api/paytr/domain-checkout", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ domain: item.domain, amount: item.price * selectedYears, years: selectedYears })
                                  });
                                  const data = await res.json();
                                  if (data.iframeToken) {
                                    const iframeUrl = `https://www.paytr.com/odeme/guvenli/${data.iframeToken}`;
                                    window.location.href = iframeUrl;
                                  } else {
                                    setDomainMessage(`❌ ${item.domain} ödemesi başlatılamadı: ` + (data.error || "Bilinmeyen hata"));
                                  }
                                } catch (err) {
                                  setDomainMessage("❌ Hata: " + err.message);
                                }
                                setDomainSaving(false);
                              }}
                              style={{ background: "#22c55e", color: "#fff", border: "none", padding: "8px 16px", fontWeight: "bold", cursor: "pointer", borderRadius: "4px" }}
                            >
                              {domainSaving ? "Yükleniyor..." : "Satın Al"}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 16, margin: "0 0 8px 0", color: "var(--text)" }}>Zaten bir domainim var (Gelişmiş)</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: "0 0 16px 0", lineHeight: 1.5 }}>
              Daha önceden sahip olduğunuz bir domaininiz varsa buraya girebilirsiniz. DNS ayarlarını yapmanız gerekecektir.
            </p>
            <input
              type="text"
              value={domainForm.customDomain}
              onChange={(e) => setDomainForm({ ...domainForm, customDomain: e.target.value })}
              style={inp}
              placeholder="www.studyonuz.com (İptal etmek için boş bırakın)"
              disabled={domainForm.purchasedDomain}
            />
            {domainForm.purchasedDomain && (
              <div style={{ marginTop: 16, padding: "16px", background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "8px" }}>
                <p style={{ fontSize: 13, color: "#22c55e", margin: "0 0 16px 0", fontWeight: "bold" }}>
                  ✅ Bu domain platformumuz üzerinden satın alınmıştır. DNS ayarları otomatik yönetilir. Bitiş: {domainForm.domainExpiresAt ? new Date(domainForm.domainExpiresAt).toLocaleDateString("tr-TR") : "-"}
                </p>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <select 
                    value={renewYears} 
                    onChange={(e) => setRenewYears(Number(e.target.value))}
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "8px", borderRadius: "4px" }}
                  >
                    <option value={1} style={{color: "#000"}}>1 Yıl Uzat</option>
                    <option value={2} style={{color: "#000"}}>2 Yıl Uzat</option>
                    <option value={3} style={{color: "#000"}}>3 Yıl Uzat</option>
                  </select>
                  <button
                    type="button"
                    disabled={renewLoading}
                    onClick={async () => {
                      setRenewLoading(true);
                      try {
                        const { checkDomainAvailability } = await import("@/app/admin/core-actions");
                        const avail = await checkDomainAvailability(domainForm.customDomain);
                        if(avail && avail.results && avail.results.length > 0) {
                           const item = avail.results[0];
                           if(item.price) {
                             const res = await fetch("/api/paytr/domain-checkout", {
                               method: "POST",
                               headers: { "Content-Type": "application/json" },
                               body: JSON.stringify({ domain: domainForm.customDomain, amount: item.price * renewYears, years: renewYears, isRenewal: true })
                             });
                             const data = await res.json();
                             if(data.iframeToken) {
                               window.location.href = `https://www.paytr.com/odeme/guvenli/${data.iframeToken}`;
                             } else {
                               alert("Ödeme başlatılamadı: " + data.error);
                             }
                           } else {
                             alert("Fiyat alınamadı.");
                           }
                        } else {
                          alert("Domain fiyatı hesaplanamadı.");
                        }
                      } catch (err) {
                        alert("Hata: " + err.message);
                      }
                      setRenewLoading(false);
                    }}
                    style={{ background: "#3b82f6", color: "#fff", border: "none", padding: "8px 16px", fontWeight: "bold", cursor: "pointer", borderRadius: "4px" }}
                  >
                    {renewLoading ? "Bekleyiniz..." : "Süreyi Uzat"}
                  </button>
                </div>
              </div>
            )}
            {!domainForm.purchasedDomain && (
              <div style={{ padding: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", marginTop: 16 }}>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: "0 0 8px 0", lineHeight: 1.5 }}>
                  Lütfen alan adınızı kaydetmeden önce <strong>Domain (DNS) Panelinizden</strong> sistemimize yönlendirme yaptığınızdan emin olun:
                </p>
                <ul style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", margin: 0, paddingLeft: 16, lineHeight: 1.6 }}>
                  <li>A Kaydı (A Record): <strong>76.76.21.21</strong></li>
                  <li>veya CNAME (www için): <strong>cname.vercel-dns.com</strong></li>
                </ul>
              </div>
            )}
          </div>
          <button
            type="button"
            disabled={domainSaving}
            onClick={async () => {
              setDomainSaving(true);
              setDomainMessage("");
              const res = await updateTenantDomain(domainForm.customDomain);
              if (res.success) {
                setDomainMessage("✅ Domain başarıyla kaydedildi. SSL sertifikası birkaç dakika içinde otomatik aktifleşecektir.");
              } else {
                setDomainMessage("❌ Hata: " + res.error);
              }
              setDomainSaving(false);
            }}
            style={{ background: "var(--text)", color: "var(--bg)", border: "none", padding: "12px 24px", fontWeight: 700, cursor: "pointer", fontSize: 12, borderRadius: 0 }}
          >
            {domainSaving ? "Kaydediliyor..." : "Domain'i Kaydet"}
          </button>
          {domainMessage && <p style={{ fontSize: 12, marginTop: 12, color: domainMessage.includes("Hata") ? "#ef4444" : "#22c55e", fontWeight: 600 }}>{domainMessage}</p>}
            </div>
          </div>
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
      )}

        </div>
      </div>
    </div>
  );
}
