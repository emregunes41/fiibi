"use client";

import { useState, useEffect } from "react";
import { useCart } from "./CartContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ShoppingBag, Trash2, ArrowRight, ArrowLeft,
  Camera, Heart, Gem, Calendar, Clock,
  FileText, User, Phone, Mail, CreditCard, Instagram, Banknote, Wallet, Lock, Eye, EyeOff, Plus, Sparkles, Tag, Check,
} from "lucide-react";
import { savePendingReservation, getPackages, validateDiscountCode, incrementDiscountCodeUsage } from "@/app/admin/core-actions";
import { getSiteConfig } from "@/app/admin/core-actions";

const CAT_META = {
  DIS_CEKIM: { label: "Dış Çekim", Icon: Camera, color: "#f59e0b", gradient: "linear-gradient(135deg, #f59e0b22 0%, transparent 60%)" },
  DUGUN: { label: "Düğün", Icon: Heart, color: "#fb7185", gradient: "linear-gradient(135deg, #fb718522 0%, transparent 60%)" },
  NISAN: { label: "Nişan", Icon: Gem, color: "#67e8f9", gradient: "linear-gradient(135deg, #67e8f922 0%, transparent 60%)" },
};

const MF = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const fmt = (n) => n.toLocaleString("tr-TR");

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 0,
  padding: "14px 16px",
  fontSize: "13px",
  color: "#fff",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle = {
  fontSize: "11px",
  color: "rgba(255,255,255,0.5)",
  fontWeight: 600,
  display: "block",
  marginBottom: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
};

export default function CartDrawer() {
  const {
    items, isOpen, setIsOpen, removeItem, cartTotal,
    clearCart, itemCount, checkoutMode, setCheckoutMode,
  } = useCart();

  const [contactForm, setContactForm] = useState({
    brideName: "", bridePhone: "", brideEmail: "",
    groomName: "", groomPhone: "", socialMedia: "",
    password: "", passwordConfirm: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState("contact"); // "contact" | "payment_method"
  const [iframeToken, setIframeToken] = useState(null);
  const [contractText, setContractText] = useState("");
  const [contractAccepted, setContractAccepted] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);
  const [allPackages, setAllPackages] = useState([]);

  // Discount code state
  const [discountCode, setDiscountCode] = useState("");
  const [discountResult, setDiscountResult] = useState(null); // { discountPercent, description } or null
  const [discountError, setDiscountError] = useState("");
  const [discountLoading, setDiscountLoading] = useState(false);

  // Verileri yükle
  useEffect(() => {
    getSiteConfig().then(cfg => {
      if (cfg?.contractText) setContractText(cfg.contractText);
    });
    getPackages().then(pkgs => setAllPackages(pkgs || []));
  }, []);

  const passwordsMatch = contactForm.password && contactForm.password.length >= 6 && contactForm.password === contactForm.passwordConfirm;

  // Telefon numarası formatlayıcı: 0(5XX) XXX XX XX
  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 11); // max 11 haneli
    if (digits.length === 0) return "";
    if (digits.length <= 1) return digits;
    if (digits.length <= 4) return `${digits[0]}(${digits.slice(1)}`;
    if (digits.length <= 7) return `${digits[0]}(${digits.slice(1, 4)}) ${digits.slice(4)}`;
    if (digits.length <= 9) return `${digits[0]}(${digits.slice(1, 4)}) ${digits.slice(4, 7)} ${digits.slice(7)}`;
    return `${digits[0]}(${digits.slice(1, 4)}) ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`;
  };

  const handlePhoneChange = (field) => (e) => {
    const formatted = formatPhone(e.target.value);
    setContactForm(p => ({ ...p, [field]: formatted }));
  };

  // Validasyonlar
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone) => phone.replace(/\D/g, "").length === 11;
  const isValidName = (name) => name.trim().length >= 2;

  const emailValid = isValidEmail(contactForm.brideEmail);
  const bridePhoneValid = isValidPhone(contactForm.bridePhone);
  const groomPhoneValid = isValidPhone(contactForm.groomPhone);
  const brideNameValid = isValidName(contactForm.brideName);
  const groomNameValid = isValidName(contactForm.groomName);

  const isContactValid = brideNameValid && bridePhoneValid && emailValid && groomNameValid && groomPhoneValid && passwordsMatch;

  // Calculate totals with discount applied
  const rawTotal = cartTotal();
  const discountAmount = discountResult ? Math.round(rawTotal * discountResult.discountPercent / 100) : 0;
  const effectiveTotal = rawTotal - discountAmount;
  const cardTotal = Math.round(effectiveTotal * 1.15);

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    setDiscountLoading(true);
    setDiscountError("");
    const res = await validateDiscountCode(discountCode.trim());
    if (res.success) {
      setDiscountResult({ discountPercent: res.discountPercent, description: res.description });
      setDiscountError("");
    } else {
      setDiscountResult(null);
      setDiscountError(res.error);
    }
    setDiscountLoading(false);
  };

  // Akıllı upsell önerileri - spesifik paket bulur
  const cartCategories = items.map(i => i.category);
  const UPSELL_MAP = {
    // Düğün alan kişiye → Dış Çekim öner
    DUGUN: ["DIS_CEKIM"],
    // Nişan alan kişiye → Dış Çekim öner
    NISAN: ["DIS_CEKIM"],
    // Dış Çekim alan kişiye → Düğün öner
    DIS_CEKIM: ["DUGUN"],
  };

  const upsellSuggestions = [];
  const addedKeys = new Set();
  
  // Sadece sepete eklenen ILK (ana) pakete göre öneri yap, zincirleme önermeyi engelle
  const primaryCat = cartCategories[0];
  if (primaryCat) {
    const suggestedCats = UPSELL_MAP[primaryCat] || [];
    suggestedCats.forEach(sCat => {
      if (!cartCategories.includes(sCat) && !addedKeys.has(sCat)) {
        // En uygun fiyatlı paketi bul
        const catPkgs = allPackages.filter(p => p.category === sCat);
        if (catPkgs.length > 0) {
          catPkgs.sort((a,b) => (parseInt(a.price.replace(/\D/g,""))||0) - (parseInt(b.price.replace(/\D/g,""))||0));
          const bestPkg = catPkgs[0];
          
          let title = "Bunu da Ekleyin!";
          if (primaryCat === "DUGUN" && sCat === "DIS_CEKIM") title = "Dış Çekim İster misiniz?";
          if (primaryCat === "NISAN" && sCat === "DIS_CEKIM") title = "Özel Dış Çekim İster misiniz?";
          if (primaryCat === "DIS_CEKIM" && sCat === "DUGUN") title = "Düğün Çekimi de İster misiniz?";

          upsellSuggestions.push({
            pkg: bestPkg,
            key: sCat,
            title,
            desc: bestPkg.name,
            color: CAT_META[sCat].color,
            Icon: CAT_META[sCat].Icon,
          });
          addedKeys.add(sCat);
        }
      }
    });
  }

  const buildReservationData = (amount) => {
    const firstItem = items[0];
    const allAddons = items.flatMap(i => i.addons.map(a => ({ ...a, packageName: i.pkg.name })));
    const allCustomFieldAnswers = items.flatMap(i => {
      const answers = (i.details?.customFieldAnswers || []).map(a => ({ ...a, packageName: i.pkg.name }));
      // Auto-inject date and time info for each package
      if (i.details?.date) {
        const dateStr = new Date(i.details.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" });
        answers.unshift({ label: "Etkinlik Tarihi", value: dateStr, type: "text", packageName: i.pkg.name });
        // Hidden ISO date for calendar multi-date support
        answers.push({ label: "_eventDateISO", value: i.details.date, type: "_hidden", packageName: i.pkg.name });
      }
      if (i.details?.timeLabel) {
        answers.splice(i.details?.date ? 1 : 0, 0, { label: "Saat Dilimi", value: i.details.timeLabel, type: "text", packageName: i.pkg.name });
      }
      return answers;
    });
    const allNotes = items.map(i => {
      const n = i.details?.notes;
      return n ? `[${i.pkg.name}] ${n}` : null;
    }).filter(Boolean).join("\n");

    return {
      brideName: contactForm.brideName,
      bridePhone: contactForm.bridePhone,
      brideEmail: contactForm.brideEmail,
      groomName: contactForm.groomName,
      groomPhone: contactForm.groomPhone,
      groomEmail: "",
      password: contactForm.password,
      date: firstItem?.details?.date || new Date().toISOString().split("T")[0],
      time: firstItem?.details?.time || "",
      packageIds: items.map(i => i.pkg.id),
      notes: allNotes,
      totalAmount: fmt(amount),
      paidAmount: "0",
      selectedAddons: allAddons,
      customFieldAnswers: allCustomFieldAnswers,
    };
  };

  const handleCashCheckout = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const data = buildReservationData(effectiveTotal);
    data.paymentPreference = "CASH";
    if (discountResult) {
      data.notes = (data.notes ? data.notes + "\n" : "") + `[İNDİRİM] Kod: ${discountCode.toUpperCase()} (%${discountResult.discountPercent} - ${discountAmount.toLocaleString('tr-TR')}₺ indirim)`;
    }
    const result = await savePendingReservation(data);
    if (result.success && discountResult) {
      await incrementDiscountCodeUsage(discountCode);
    }
    setIsSubmitting(false);
    if (result.success) {
      setSubmitResult({ success: true, type: "cash", message: "Rezervasyonunuz başarıyla oluşturuldu!" });
      clearCart();
    } else {
      setSubmitResult({ success: false, message: "Bir hata oluştu: " + (result.error || "Bilinmeyen hata") });
    }
  };

  const handleCardCheckout = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const data = buildReservationData(cardTotal);
    data.paymentPreference = "CARD";
    if (discountResult) {
      data.notes = (data.notes ? data.notes + "\n" : "") + `[İNDİRİM] Kod: ${discountCode.toUpperCase()} (%${discountResult.discountPercent} - ${discountAmount.toLocaleString('tr-TR')}₺ indirim)`;
    }
    const result = await savePendingReservation(data);
    if (result.success && discountResult) {
      await incrementDiscountCodeUsage(discountCode);
    }
    setIsSubmitting(false);
    if (!result.success) {
      setSubmitResult({ success: false, message: "Bir hata oluştu: " + (result.error || "Bilinmeyen hata") });
      return;
    }
    
    // Get PayTR token
    try {
      const packageNames = items.map(i => i.pkg.name).join(", ");
      const baseBasketStr = JSON.stringify([[packageNames, String(cardTotal), "1"]]);
      const basket = btoa(encodeURIComponent(baseBasketStr).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1)));
      
      const res = await fetch("/api/paytr/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_oid: result.id,
          email: contactForm.brideEmail,
          payment_amount: Math.round(cardTotal * 100), // kuruş
          user_name: contactForm.brideName,
          user_phone: contactForm.bridePhone,
          user_address: "Türkiye",
          user_basket: basket,
        }),
      });

      const data = await res.json();
      if (data.token) {
        setIframeToken(data.token);
        clearCart();
      } else {
        setSubmitResult({ success: false, message: "Ödeme başlatılamadı: " + (data.error || "Bilinmeyen hata") });
      }
    } catch (err) {
      setSubmitResult({ success: false, message: "Ödeme hatası: " + err.message });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setIsOpen(false); setCheckoutMode(false); }}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
              zIndex: 5000,
            }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            style={{
              position: "fixed", top: 0, right: 0, bottom: 0,
              width: "min(420px, 95vw)",
              background: "#0a0a0f",
              borderLeft: "1px solid rgba(255,255,255,0.1)",
              zIndex: 5001,
              display: "flex", flexDirection: "column",
              boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
            }}
          >
            {/* Header */}
            <div style={{
              padding: "24px", borderBottom: "1px solid rgba(255,255,255,0.08)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {checkoutMode && !submitResult && (
                  <button onClick={() => {
                    if (checkoutStep === "payment_method") {
                      setCheckoutStep("contact");
                    } else {
                      setCheckoutMode(false);
                      setCheckoutStep("contact");
                    }
                  }} style={{
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 0, padding: "6px", cursor: "pointer", color: "rgba(255,255,255,0.4)",
                  }}>
                    <ArrowLeft size={14} />
                  </button>
                )}
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>
                    {submitResult ? (submitResult.success ? "Tamamlandı" : "Hata") : iframeToken ? "Kart ile Ödeme" : !checkoutMode ? "Sepetim" : checkoutStep === "contact" ? "Rezervasyon Bilgileri" : "Ödeme Yöntemi"}
                  </div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>
                    {submitResult ? "" : iframeToken ? "Güvenli ödeme" : !checkoutMode ? `${itemCount} paket` : checkoutStep === "contact" ? "Adım 1/2 — İletişim bilgileri" : "Adım 2/2 — Ödeme seçin"}
                  </div>
                </div>
              </div>
              <button onClick={() => { setIsOpen(false); setCheckoutMode(false); }} style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 0, padding: "8px", cursor: "pointer", color: "rgba(255,255,255,0.6)",
              }}>
                <X size={16} />
              </button>
            </div>

            {/* Scrollable content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
              <AnimatePresence mode="wait">

                {/* ── CART VIEW ── */}
                {!checkoutMode && (
                  <motion.div key="cart-view" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    {items.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.3)" }}>
                        <ShoppingBag size={40} style={{ margin: "0 auto 16px", opacity: 0.5 }} />
                        <p style={{ fontSize: "14px" }}>Sepetiniz boş</p>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {items.map((item) => {
                          const meta = CAT_META[item.category] || { label: item.category, color: "#aaa", gradient: "none" };
                          const Icon = meta.Icon || ShoppingBag;
                          const pkgPrice = item.price ?? (parseInt(item.pkg.price?.replace(/\D/g, "")) || 0);
                          const addonPrice = item.addons.reduce((s, a) => s + (parseInt(a.price) || 0), 0);

                          return (
                            <div key={item.pkg.id} style={{
                              padding: "16px", borderRadius: 0,
                              border: "1px solid rgba(255,255,255,0.1)",
                              background: meta.gradient,
                              position: "relative",
                            }}>
                              {/* Category tag */}
                              <div style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                marginBottom: "10px",
                              }}>
                                <div style={{
                                  fontSize: "9px", fontWeight: 800, textTransform: "uppercase",
                                  letterSpacing: "0.08em", color: meta.color, opacity: 0.9,
                                  display: "flex", alignItems: "center", gap: "4px",
                                }}>
                                  <Icon size={10} /> {meta.label}
                                </div>
                                <button onClick={() => removeItem(item.pkg.id)} style={{
                                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                                  borderRadius: 0, padding: "6px", cursor: "pointer", color: "rgba(255,255,255,0.4)",
                                }}>
                                  <Trash2 size={12} />
                                </button>
                              </div>

                              {/* Package name + month */}
                              <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff", marginBottom: "4px" }}>
                                {item.pkg.name}
                              </div>
                              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginBottom: "12px" }}>
                                {MF[item.month - 1]} {item.year}
                              </div>

                              {/* Details */}
                              {item.details && (
                                <div style={{
                                  padding: "10px", borderRadius: 0, marginBottom: "12px",
                                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                                }}>
                                  {item.details.date && (
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
                                      <Calendar size={11} style={{ opacity: 0.7 }} />
                                      {new Date(item.details.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                                    </div>
                                  )}
                                  {item.details.timeLabel && (
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
                                      <Clock size={11} style={{ opacity: 0.7 }} />
                                      {item.details.timeLabel}
                                    </div>
                                  )}
                                  {item.details.notes && (
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", fontSize: "11px", color: "rgba(255,255,255,0.6)" }}>
                                      <FileText size={11} style={{ opacity: 0.7, marginTop: "2px" }} />
                                      <span>{item.details.notes}</span>
                                    </div>
                                  )}
                                  {item.details.customFieldAnswers && item.details.customFieldAnswers.length > 0 && (
                                    <div style={{ marginTop: "6px", paddingTop: "6px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                                      {item.details.customFieldAnswers.map((a, i) => (
                                        <div key={i} style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "2px" }}>
                                          <span style={{ fontWeight: 600 }}>{a.label}:</span> {a.type === "checkbox" ? "✓" : a.value}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Addons */}
                              {item.addons.length > 0 && (
                                <div style={{ marginBottom: "8px" }}>
                                  {item.addons.map((a, i) => (
                                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "3px" }}>
                                      <span>+ {a.title}</span>
                                      <span>{a.price}₺</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Price */}
                              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "baseline", gap: "4px" }}>
                                <span style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>
                                  {fmt(pkgPrice + addonPrice)}
                                </span>
                                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>₺</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── UPSELL STEP ── */}
                {showUpsell && !checkoutMode && (
                  <motion.div key="upsell-view" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                    <div style={{
                      textAlign: "center", padding: "10px 0 20px",
                    }}>
                      <div style={{
                        width: 56, height: 56, borderRadius: 0, margin: "0 auto 16px",
                        background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(251,113,133,0.15))",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Sparkles size={24} style={{ color: "#f59e0b" }} />
                      </div>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>Bir Şey Eksik Olmasın!</h3>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.5 }}>
                        Bu hizmetleri de eklemek ister misiniz?
                      </p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {upsellSuggestions.map((suggestion) => {
                        const SugIcon = suggestion.Icon;
                        return (
                          <button
                            key={suggestion.key}
                            onClick={() => {
                              setShowUpsell(false);
                              setIsOpen(false);
                              const m = items[0]?.month || new Date().getMonth() + 1;
                              const y = items[0]?.year || new Date().getFullYear();
                              window.location.href = `/booking?upsellPkg=${suggestion.pkg.id}&m=${m}&y=${y}`;
                            }}
                            style={{
                              width: "100%", padding: "18px 16px", borderRadius: 0,
                              background: `linear-gradient(135deg, ${suggestion.color}11 0%, transparent 60%)`,
                              border: `1px solid ${suggestion.color}33`,
                              cursor: "pointer", textAlign: "left",
                              transition: "all 0.2s", color: "#fff",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                              <div style={{
                                width: 44, height: 44, borderRadius: 0,
                                background: `${suggestion.color}18`,
                                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                              }}>
                                <SugIcon size={20} style={{ color: suggestion.color }} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{suggestion.title}</div>
                                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 600, marginBottom: 2 }}>{suggestion.desc}</div>
                                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{suggestion.pkg.price}</div>
                              </div>
                              <div style={{
                                width: 32, height: 32, borderRadius: 0,
                                background: `${suggestion.color}20`, border: `1px solid ${suggestion.color}40`,
                                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                              }}>
                                <Plus size={16} style={{ color: suggestion.color }} />
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => {
                        setShowUpsell(false);
                        setCheckoutMode(true);
                        setCheckoutStep("contact");
                      }}
                      style={{
                        width: "100%", marginTop: 20, padding: "14px",
                        borderRadius: 0, border: "none",
                        background: "#fff", color: "#000",
                        fontSize: 13, fontWeight: 700, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      }}
                    >
                      <ArrowRight size={14} /> Hayır, Devam Et
                    </button>
                  </motion.div>
                )}

                {/* ── CHECKOUT STEP 1: CONTACT FORM ── */}
                {checkoutMode && !submitResult && checkoutStep === "contact" && (
                  <motion.div key="checkout-contact" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                    {/* Order summary */}
                    <div style={{
                      padding: "16px", borderRadius: 0, marginBottom: "24px",
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                    }}>
                      <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", marginBottom: "10px" }}>
                        Sipariş Özeti
                      </div>
                      {items.map((item) => {
                        const p = item.price ?? (parseInt(item.pkg.price?.replace(/\D/g, "")) || 0);
                        const ad = item.addons.reduce((s, a) => s + (parseInt(a.price) || 0), 0);
                        return (
                          <div key={item.pkg.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                            <span style={{ color: "rgba(255,255,255,0.6)" }}>{item.pkg.name}</span>
                            <span style={{ color: "#fff", fontWeight: 600 }}>{fmt(p + ad)}₺</span>
                          </div>
                        );
                      })}
                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", marginTop: "10px", paddingTop: "10px", display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)" }}>Toplam</span>
                        <span style={{ fontSize: "18px", fontWeight: 700, color: "#fff" }}>{fmt(cartTotal())}₺</span>
                      </div>
                    </div>

                    {/* Discount Code Input */}
                    <div style={{
                      padding: "14px 16px", borderRadius: 0, marginBottom: "24px",
                      background: discountResult ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${discountResult ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.08)"}`,
                      transition: "all 0.3s",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <Tag size={12} style={{ color: discountResult ? "#fff" : "rgba(255,255,255,0.4)" }} />
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: discountResult ? "#fff" : "rgba(255,255,255,0.4)" }}>
                          {discountResult ? "İndirim Uygulandı!" : "İndirim Kodunuz Var Mı?"}
                        </span>
                      </div>
                      {!discountResult ? (
                        <div style={{ display: "flex", gap: 8 }}>
                          <input
                            value={discountCode}
                            onChange={(e) => setDiscountCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                            placeholder="Kodu giriniz"
                            maxLength={20}
                            style={{
                              ...inputStyle, flex: 1, fontSize: 13, fontFamily: "monospace",
                              letterSpacing: "0.1em", textTransform: "uppercase",
                              borderColor: discountError ? "rgba(248,113,113,0.3)" : undefined,
                            }}
                            onKeyDown={(e) => e.key === "Enter" && handleApplyDiscount()}
                          />
                          <button
                            onClick={handleApplyDiscount}
                            disabled={discountLoading || !discountCode.trim()}
                            style={{
                              padding: "0 18px", borderRadius: 0, border: "none",
                              background: discountCode.trim() ? "#fff" : "rgba(255,255,255,0.06)",
                              color: discountCode.trim() ? "#000" : "rgba(255,255,255,0.2)",
                              fontWeight: 700, fontSize: 12, cursor: discountCode.trim() ? "pointer" : "not-allowed",
                              flexShrink: 0, transition: "all 0.2s",
                            }}
                          >
                            {discountLoading ? "..." : "Uygula"}
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <Check size={14} style={{ color: "#fff" }} />
                              <span style={{ fontSize: 14, fontWeight: 800, color: "#fff", fontFamily: "monospace" }}>{discountCode.toUpperCase()}</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>%{discountResult.discountPercent}</span>
                            </div>
                            {discountResult.description && (
                              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4, marginLeft: 22 }}>{discountResult.description}</div>
                            )}
                          </div>
                          <button onClick={() => { setDiscountResult(null); setDiscountCode(""); setDiscountError(""); }} style={{
                            background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 4, fontSize: 11,
                          }}>Kaldır</button>
                        </div>
                      )}
                      {discountError && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 8, fontWeight: 600 }}>{discountError}</div>}
                    </div>

                    {/* Contact Form */}
                    <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", marginBottom: "16px" }}>
                      İletişim Bilgileri
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                      <div>
                        <label style={labelStyle}>
                          <User size={10} style={{ display: "inline", marginRight: "4px" }} /> Gelin Adı *
                        </label>
                        <input type="text" value={contactForm.brideName}
                          onChange={(e) => setContactForm(p => ({ ...p, brideName: e.target.value }))}
                          placeholder="Ad Soyad" style={{
                            ...inputStyle,
                            borderColor: contactForm.brideName && !brideNameValid ? "rgba(248,113,113,0.4)" : undefined,
                          }}
                        />
                        {contactForm.brideName && !brideNameValid && (
                          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", margin: "4px 0 0" }}>En az 2 karakter olmalı</p>
                        )}
                      </div>

                      <div>
                        <label style={labelStyle}>
                          <User size={10} style={{ display: "inline", marginRight: "4px" }} /> Damat Adı *
                        </label>
                        <input type="text" value={contactForm.groomName}
                          onChange={(e) => setContactForm(p => ({ ...p, groomName: e.target.value }))}
                          placeholder="Ad Soyad" style={{
                            ...inputStyle,
                            borderColor: contactForm.groomName && !groomNameValid ? "rgba(248,113,113,0.4)" : undefined,
                          }}
                        />
                        {contactForm.groomName && !groomNameValid && (
                          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", margin: "4px 0 0" }}>En az 2 karakter olmalı</p>
                        )}
                      </div>
                      
                      <div style={{ height: "1px", background: "rgba(255,255,255,0.04)", margin: "4px 0" }} />

                      <div>
                        <label style={labelStyle}>
                          <Phone size={10} style={{ display: "inline", marginRight: "4px" }} /> 1. Telefon Numarası *
                        </label>
                        <input type="tel" value={contactForm.bridePhone}
                          onChange={handlePhoneChange("bridePhone")}
                          placeholder="0(5XX) XXX XX XX" style={{
                            ...inputStyle,
                            borderColor: contactForm.bridePhone && !bridePhoneValid ? "rgba(248,113,113,0.4)" : undefined,
                          }}
                          maxLength={16}
                        />
                        {contactForm.bridePhone && !bridePhoneValid && (
                          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", margin: "4px 0 0" }}>Geçerli bir telefon numarası girin</p>
                        )}
                      </div>

                      <div>
                        <label style={labelStyle}>
                          <Phone size={10} style={{ display: "inline", marginRight: "4px" }} /> 2. Telefon Numarası *
                        </label>
                        <input type="tel" value={contactForm.groomPhone}
                          onChange={handlePhoneChange("groomPhone")}
                          placeholder="0(5XX) XXX XX XX" style={{
                            ...inputStyle,
                            borderColor: contactForm.groomPhone && !groomPhoneValid ? "rgba(248,113,113,0.4)" : undefined,
                          }}
                          maxLength={16}
                        />
                        {contactForm.groomPhone && !groomPhoneValid && (
                          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", margin: "4px 0 0" }}>Geçerli bir telefon numarası girin</p>
                        )}
                      </div>

                      <div style={{ height: "1px", background: "rgba(255,255,255,0.04)", margin: "4px 0" }} />

                      <div>
                        <label style={labelStyle}>
                          <Mail size={10} style={{ display: "inline", marginRight: "4px" }} /> E-posta *
                        </label>
                        <input type="email" value={contactForm.brideEmail}
                          onChange={(e) => setContactForm(p => ({ ...p, brideEmail: e.target.value }))}
                          placeholder="ornek@email.com" style={{
                            ...inputStyle,
                            borderColor: contactForm.brideEmail && !emailValid ? "rgba(248,113,113,0.4)" : undefined,
                          }}
                        />
                        {contactForm.brideEmail && !emailValid && (
                          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", margin: "4px 0 0" }}>Geçerli bir e-posta adresi girin (ör: ornek@email.com)</p>
                        )}
                      </div>

                      <div>
                        <label style={labelStyle}>
                          <Instagram size={10} style={{ display: "inline", marginRight: "4px" }} /> Instagram Kullanıcı Adı
                        </label>
                        <input type="text" value={contactForm.socialMedia}
                          onChange={(e) => setContactForm(p => ({ ...p, socialMedia: e.target.value }))}
                          placeholder="@instagram_kullanici_adi" style={inputStyle}
                        />
                      </div>

                      <div style={{ height: "1px", background: "rgba(255,255,255,0.04)", margin: "4px 0" }} />

                      {/* Şifre Belirleme */}
                      <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>
                        🔐 Hesap Şifresi Belirleyin
                      </div>
                      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", margin: "0 0 8px", lineHeight: 1.5 }}>
                        Rezervasyon durumunuzu ve fotoğraflarınızı takip edebilmeniz için bir şifre belirleyin.
                      </p>

                      <div>
                        <label style={labelStyle}>
                          <Lock size={10} style={{ display: "inline", marginRight: "4px" }} /> Şifre *
                        </label>
                        <div style={{ position: "relative" }}>
                          <input type={showPassword ? "text" : "password"} value={contactForm.password}
                            onChange={(e) => setContactForm(p => ({ ...p, password: e.target.value }))}
                            placeholder="En az 6 karakter" style={inputStyle}
                          />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                            background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 4,
                          }}>
                            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                        {contactForm.password && contactForm.password.length < 6 && (
                          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", margin: "4px 0 0" }}>En az 6 karakter olmalı</p>
                        )}
                      </div>

                      <div>
                        <label style={labelStyle}>
                          <Lock size={10} style={{ display: "inline", marginRight: "4px" }} /> Şifre Tekrar *
                        </label>
                        <input type={showPassword ? "text" : "password"} value={contactForm.passwordConfirm}
                          onChange={(e) => setContactForm(p => ({ ...p, passwordConfirm: e.target.value }))}
                          placeholder="Şifrenizi tekrar girin" style={inputStyle}
                        />
                        {contactForm.passwordConfirm && contactForm.password !== contactForm.passwordConfirm && (
                          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", margin: "4px 0 0" }}>Şifreler eşleşmiyor</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── CHECKOUT STEP 2: PAYMENT METHOD ── */}
                {checkoutMode && !submitResult && checkoutStep === "payment_method" && (
                  <motion.div key="checkout-payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                    <div style={{ marginBottom: 24 }}>
                      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>
                        Ödeme yönteminizi seçin. Nakit ödemelerde fiyat aynı kalır, kart ile ödemelerde %15 hizmet bedeli eklenir.
                      </p>
                    </div>

                    {/* Sözleşme */}
                    {contractText && (
                      <div style={{ marginBottom: 20 }}>
                        <div style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 0, padding: 16,
                          maxHeight: 180, overflowY: "auto",
                          marginBottom: 12,
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                            <FileText size={14} style={{ color: "rgba(255,255,255,0.5)" }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Hizmet Sözleşmesi</span>
                          </div>
                          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.8, margin: 0, whiteSpace: "pre-wrap" }}>
                            {contractText}
                          </p>
                        </div>
                        <div
                          onClick={() => setContractAccepted(!contractAccepted)}
                          style={{
                            display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer",
                            padding: "12px 14px", borderRadius: 0,
                            background: contractAccepted ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                            border: `1px solid ${contractAccepted ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.08)"}`,
                            transition: "all 0.2s",
                          }}
                        >
                          <div style={{
                            width: 20, height: 20, borderRadius: 0, flexShrink: 0, marginTop: 1,
                            border: `2px solid ${contractAccepted ? "#fff" : "rgba(255,255,255,0.25)"}`,
                            background: contractAccepted ? "#fff" : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.2s",
                          }}>
                            {contractAccepted && (
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            )}
                          </div>
                          <span style={{ fontSize: 12, color: contractAccepted ? "#fff" : "rgba(255,255,255,0.5)", lineHeight: 1.5, transition: "all 0.2s" }}>
                            Hizmet sözleşmesini okudum ve kabul ediyorum. *
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Cash Option */}
                    <button
                      onClick={handleCashCheckout}
                      disabled={isSubmitting || (contractText && !contractAccepted)}
                      style={{
                        width: "100%", padding: "20px", borderRadius: 0, marginBottom: 12,
                        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)",
                        cursor: (isSubmitting || (contractText && !contractAccepted)) ? "not-allowed" : "pointer", textAlign: "left",
                        transition: "all 0.2s", color: "#fff",
                        opacity: (contractText && !contractAccepted) ? 0.4 : 1,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 0, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Banknote size={22} style={{ color: "#fff" }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Nakit / Havale</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>Sizinle telefonla iletişime geçeceğiz</div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{fmt(effectiveTotal)}₺</div>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 600, textTransform: "uppercase" }}>{discountResult ? `%${discountResult.discountPercent} indirimli` : "Aynı fiyat"}</div>
                        </div>
                      </div>
                    </button>

                    {/* Card Option */}
                    <button
                      onClick={handleCardCheckout}
                      disabled={isSubmitting || (contractText && !contractAccepted)}
                      style={{
                        width: "100%", padding: "20px", borderRadius: 0, marginBottom: 12,
                        background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.2)",
                        cursor: (isSubmitting || (contractText && !contractAccepted)) ? "not-allowed" : "pointer", textAlign: "left",
                        transition: "all 0.2s", color: "#fff",
                        opacity: (contractText && !contractAccepted) ? 0.4 : 1,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 0, background: "rgba(96,165,250,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <CreditCard size={22} style={{ color: "rgba(255,255,255,0.5)" }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Kredi Kartı</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>Online güvenli ödeme</div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: "rgba(255,255,255,0.5)" }}>{fmt(cardTotal)}₺</div>
                          <div style={{ fontSize: 10, color: "rgba(96,165,250,0.6)", fontWeight: 600, textTransform: "uppercase" }}>+%15 hizmet bedeli</div>
                        </div>
                      </div>
                    </button>

                    {/* Info note */}
                    <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 0, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
                        💡 Nakit/havale tercih ederseniz, rezervasyonunuz oluşturulur ve ödeme detayları için sizinle iletişime geçilir.
                      </div>
                    </div>

                    {isSubmitting && (
                      <div style={{ textAlign: "center", marginTop: 20, color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600 }}>
                        İşleniyor...
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── PAYTR IFRAME VIEW ── */}
                {iframeToken && !submitResult && (
                  <motion.div key="paytr-view" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <CreditCard size={18} style={{ color: "rgba(255,255,255,0.5)" }} />
                        <span style={{ fontSize: 16, fontWeight: 700 }}>Kart ile Ödeme</span>
                      </div>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                        Aşağıdaki formu doldurarak güvenli ödemenizi tamamlayın.
                      </p>
                    </div>
                    <div style={{ borderRadius: 0, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <iframe
                        src={`https://www.paytr.com/odeme/guvenli/${iframeToken}`}
                        style={{ width: "100%", height: 460, border: "none" }}
                        frameBorder="0"
                      />
                    </div>
                    <button
                      onClick={() => { setIframeToken(null); setCheckoutStep("payment_method"); }}
                      style={{
                        marginTop: 16, width: "100%", padding: 12, borderRadius: 0,
                        background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: 12, cursor: "pointer",
                      }}
                    >
                      ← Vazgeç
                    </button>
                  </motion.div>
                )}

                {/* ── SUCCESS VIEW ── */}
                {submitResult && (
                  <motion.div key="success-view" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                    <div style={{ textAlign: "center", padding: "40px 20px 20px" }}>
                      <div style={{
                        width: "80px", height: "80px", margin: "0 auto 24px",
                        borderRadius: 0,
                        background: submitResult.success ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.04)",
                        border: `2px solid ${submitResult.success ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.1)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "36px",
                      }}>
                        {submitResult.success ? "🎉" : "❌"}
                      </div>
                      <div style={{
                        fontSize: "22px", fontWeight: 800,
                        color: submitResult.success ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.5)",
                        marginBottom: "12px",
                      }}>
                        {submitResult.success ? "Rezervasyonunuz Oluşturuldu!" : "Hata"}
                      </div>
                      <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", lineHeight: 1.7, maxWidth: 320, margin: "0 auto 24px" }}>
                        {submitResult.message}
                      </p>
                    </div>

                    {submitResult.success && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 4px" }}>

                        <div style={{ padding: "14px 16px", borderRadius: 0, background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.12)", display: "flex", alignItems: "flex-start", gap: 12 }}>
                          <Mail size={18} style={{ color: "rgba(255,255,255,0.5)", flexShrink: 0, marginTop: 2 }} />
                          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
                            Belirlediğiniz <strong style={{ color: "#fff" }}>giriş şifresi</strong> ile hesabınıza giriş yapabilir ve rezervasyon durumunuzu takip edebilirsiniz.
                          </span>
                        </div>

                        <div style={{ padding: "14px 16px", borderRadius: 0, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "flex-start", gap: 12 }}>
                          <User size={18} style={{ color: "rgba(255,255,255,0.7)", flexShrink: 0, marginTop: 2 }} />
                          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
                            <strong style={{ color: "#fff" }}>Profilinizden</strong> rezervasyon durumunuzu takip edebilir, ödeme geçmişinizi görebilir ve tüm süreci yönetebilirsiniz.
                          </span>
                        </div>

                        {submitResult.type === "cash" && (
                          <div style={{ padding: "14px 16px", borderRadius: 0, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "flex-start", gap: 12 }}>
                            <Phone size={18} style={{ color: "#fff", flexShrink: 0, marginTop: 2 }} />
                            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
                              Ekibimiz en kısa sürede sizinle <strong style={{ color: "#fff" }}>telefonla</strong> iletişime geçecek ve ödeme detaylarını paylaşacak.
                            </span>
                          </div>
                        )}

                        <button
                          onClick={() => {
                            window.location.href = "/";
                          }}
                          style={{
                            marginTop: 16, width: "100%", padding: "14px", borderRadius: 0,
                            background: "#fff", color: "#000", border: "none",
                            fontWeight: 700, fontSize: 14, cursor: "pointer",
                          }}
                        >
                          Tamam, Anlaşıldı
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Footer */}
            {items.length > 0 && !submitResult && (
              <div style={{
                padding: "20px",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(0,0,0,0.3)",
              }}>
                {/* Total */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)" }}>
                    TOPLAM
                  </div>
                  <div>
                    <span style={{ fontSize: "24px", fontWeight: 700, color: "#fff" }}>{fmt(discountResult ? effectiveTotal : rawTotal)}</span>
                    <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", fontWeight: 400, marginLeft: "2px" }}>₺</span>
                  </div>
                </div>
                {discountResult && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, padding: "8px 10px", borderRadius: 0, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Tag size={11} style={{ color: "#fff" }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", fontFamily: "monospace" }}>{discountCode.toUpperCase()}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>-{fmt(discountAmount)}₺</span>
                  </div>
                )}

                {!checkoutMode ? (
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={clearCart} style={{
                      flex: 1, padding: "14px", borderRadius: 0,
                      border: "1px solid rgba(255,255,255,0.06)", background: "transparent",
                      color: "rgba(255,255,255,0.45)", fontSize: "12px", fontWeight: 600,
                      cursor: "pointer", transition: "all 0.2s",
                    }}>
                      Temizle
                    </button>
                    <button onClick={() => {
                      if (upsellSuggestions.length > 0) {
                        setShowUpsell(true);
                      } else {
                        setCheckoutMode(true);
                        setCheckoutStep("contact");
                      }
                    }} style={{
                      flex: 2, padding: "14px", borderRadius: 0,
                      border: "none", background: "#fff", color: "#000",
                      fontSize: "13px", fontWeight: 700, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                      transition: "all 0.2s",
                    }}>
                      <ArrowRight size={14} /> Rezervasyona Devam Et
                    </button>
                  </div>
                ) : checkoutStep === "contact" ? (
                  <button
                    onClick={() => setCheckoutStep("payment_method")}
                    disabled={!isContactValid}
                    style={{
                      width: "100%", padding: "16px", borderRadius: 0,
                      border: "none",
                      background: isContactValid ? "#fff" : "rgba(255,255,255,0.04)",
                      color: isContactValid ? "#000" : "rgba(255,255,255,0.15)",
                      fontSize: "14px", fontWeight: 700,
                      cursor: isContactValid ? "pointer" : "not-allowed",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                      transition: "all 0.2s",
                    }}
                  >
                    <ArrowRight size={14} /> Devam Et — Ödeme Yöntemi
                  </button>
                ) : null}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
