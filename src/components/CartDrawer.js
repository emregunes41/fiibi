"use client";

import { useState } from "react";
import { useCart } from "./CartContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ShoppingBag, Trash2, ArrowRight, ArrowLeft,
  Camera, Heart, Gem, Calendar, Clock,
  FileText, User, Phone, Mail, CreditCard, Instagram, Banknote, Wallet,
} from "lucide-react";
import { savePendingReservation } from "@/app/admin/core-actions";

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
  borderRadius: "12px",
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
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState("contact"); // "contact" | "payment_method"
  const [iframeToken, setIframeToken] = useState(null);

  const isContactValid = contactForm.brideName && contactForm.bridePhone && contactForm.brideEmail && contactForm.groomName && contactForm.groomPhone;
  const cardTotal = Math.round(cartTotal() * 1.15); // %15 artı

  const buildReservationData = (amount) => {
    const firstItem = items[0];
    const allAddons = items.flatMap(i => i.addons.map(a => ({ ...a, packageName: i.pkg.name })));
    const allCustomFieldAnswers = items.flatMap(i => (i.details?.customFieldAnswers || []).map(a => ({ ...a, packageName: i.pkg.name })));
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
    const result = await savePendingReservation(buildReservationData(cartTotal()));
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
    const result = await savePendingReservation(buildReservationData(cardTotal));
    setIsSubmitting(false);
    if (!result.success) {
      setSubmitResult({ success: false, message: "Bir hata oluştu: " + (result.error || "Bilinmeyen hata") });
      return;
    }
    
    // Get PayTR token
    try {
      const packageNames = items.map(i => i.pkg.name).join(", ");
      const basket = btoa(JSON.stringify([[packageNames, String(cardTotal), "1"]]));
      
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
                    borderRadius: "8px", padding: "6px", cursor: "pointer", color: "rgba(255,255,255,0.4)",
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
                borderRadius: "10px", padding: "8px", cursor: "pointer", color: "rgba(255,255,255,0.6)",
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
                              padding: "16px", borderRadius: "14px",
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
                                  borderRadius: "8px", padding: "6px", cursor: "pointer", color: "rgba(255,60,60,0.7)",
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
                                  padding: "10px", borderRadius: "10px", marginBottom: "12px",
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

                {/* ── CHECKOUT STEP 1: CONTACT FORM ── */}
                {checkoutMode && !submitResult && checkoutStep === "contact" && (
                  <motion.div key="checkout-contact" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                    {/* Order summary */}
                    <div style={{
                      padding: "16px", borderRadius: "14px", marginBottom: "24px",
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
                          placeholder="Ad Soyad" style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>
                          <Phone size={10} style={{ display: "inline", marginRight: "4px" }} /> Telefon *
                        </label>
                        <input type="tel" value={contactForm.bridePhone}
                          onChange={(e) => setContactForm(p => ({ ...p, bridePhone: e.target.value }))}
                          placeholder="05XX XXX XX XX" style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>
                          <Mail size={10} style={{ display: "inline", marginRight: "4px" }} /> E-posta *
                        </label>
                        <input type="email" value={contactForm.brideEmail}
                          onChange={(e) => setContactForm(p => ({ ...p, brideEmail: e.target.value }))}
                          placeholder="ornek@email.com" style={inputStyle}
                        />
                      </div>

                      <div style={{ height: "1px", background: "rgba(255,255,255,0.04)", margin: "4px 0" }} />

                      <div>
                        <label style={labelStyle}>
                          <User size={10} style={{ display: "inline", marginRight: "4px" }} /> Damat Adı *
                        </label>
                        <input type="text" value={contactForm.groomName}
                          onChange={(e) => setContactForm(p => ({ ...p, groomName: e.target.value }))}
                          placeholder="Ad Soyad" style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>
                          <Phone size={10} style={{ display: "inline", marginRight: "4px" }} /> Damat Telefon *
                        </label>
                        <input type="tel" value={contactForm.groomPhone}
                          onChange={(e) => setContactForm(p => ({ ...p, groomPhone: e.target.value }))}
                          placeholder="05XX XXX XX XX" style={inputStyle}
                        />
                      </div>

                      <div style={{ height: "1px", background: "rgba(255,255,255,0.04)", margin: "4px 0" }} />

                      <div>
                        <label style={labelStyle}>
                          <Instagram size={10} style={{ display: "inline", marginRight: "4px" }} /> Sosyal Medya Hesabı
                        </label>
                        <input type="text" value={contactForm.socialMedia}
                          onChange={(e) => setContactForm(p => ({ ...p, socialMedia: e.target.value }))}
                          placeholder="@instagram_kullanici_adi" style={inputStyle}
                        />
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

                    {/* Cash Option */}
                    <button
                      onClick={handleCashCheckout}
                      disabled={isSubmitting}
                      style={{
                        width: "100%", padding: "20px", borderRadius: 16, marginBottom: 12,
                        background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)",
                        cursor: isSubmitting ? "not-allowed" : "pointer", textAlign: "left",
                        transition: "all 0.2s", color: "#fff",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(74,222,128,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Banknote size={22} style={{ color: "#4ade80" }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Nakit / Havale</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>Sizinle telefonla iletişime geçeceğiz</div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: "#4ade80" }}>{fmt(cartTotal())}₺</div>
                          <div style={{ fontSize: 10, color: "rgba(74,222,128,0.6)", fontWeight: 600, textTransform: "uppercase" }}>Aynı fiyat</div>
                        </div>
                      </div>
                    </button>

                    {/* Card Option */}
                    <button
                      onClick={handleCardCheckout}
                      disabled={isSubmitting}
                      style={{
                        width: "100%", padding: "20px", borderRadius: 16, marginBottom: 12,
                        background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.2)",
                        cursor: isSubmitting ? "not-allowed" : "pointer", textAlign: "left",
                        transition: "all 0.2s", color: "#fff",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(96,165,250,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <CreditCard size={22} style={{ color: "#60a5fa" }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Kredi Kartı</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>Online güvenli ödeme</div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: "#60a5fa" }}>{fmt(cardTotal)}₺</div>
                          <div style={{ fontSize: 10, color: "rgba(96,165,250,0.6)", fontWeight: 600, textTransform: "uppercase" }}>+%15 hizmet bedeli</div>
                        </div>
                      </div>
                    </button>

                    {/* Info note */}
                    <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
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
                        <CreditCard size={18} style={{ color: "#60a5fa" }} />
                        <span style={{ fontSize: 16, fontWeight: 700 }}>Kart ile Ödeme</span>
                      </div>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                        Aşağıdaki formu doldurarak güvenli ödemenizi tamamlayın.
                      </p>
                    </div>
                    <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <iframe
                        src={`https://www.paytr.com/odeme/guvenli/${iframeToken}`}
                        style={{ width: "100%", height: 460, border: "none" }}
                        frameBorder="0"
                      />
                    </div>
                    <button
                      onClick={() => { setIframeToken(null); setCheckoutStep("payment_method"); }}
                      style={{
                        marginTop: 16, width: "100%", padding: 12, borderRadius: 10,
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
                        borderRadius: "50%",
                        background: submitResult.success ? "rgba(52,211,153,0.1)" : "rgba(255,60,60,0.1)",
                        border: `2px solid ${submitResult.success ? "rgba(52,211,153,0.25)" : "rgba(255,60,60,0.25)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "36px",
                      }}>
                        {submitResult.success ? "🎉" : "❌"}
                      </div>
                      <div style={{
                        fontSize: "22px", fontWeight: 800,
                        color: submitResult.success ? "#34d399" : "#ef4444",
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

                        <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.12)", display: "flex", alignItems: "flex-start", gap: 12 }}>
                          <Mail size={18} style={{ color: "#60a5fa", flexShrink: 0, marginTop: 2 }} />
                          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
                            E-posta adresinize bir <strong style={{ color: "#fff" }}>giriş şifresi</strong> gönderildi. Bu şifre ile hesabınıza giriş yapabilirsiniz.
                          </span>
                        </div>

                        <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(250,204,21,0.06)", border: "1px solid rgba(250,204,21,0.12)", display: "flex", alignItems: "flex-start", gap: 12 }}>
                          <User size={18} style={{ color: "#facc15", flexShrink: 0, marginTop: 2 }} />
                          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
                            <strong style={{ color: "#fff" }}>Profilinizden</strong> rezervasyon durumunuzu takip edebilir, ödeme geçmişinizi görebilir ve tüm süreci yönetebilirsiniz.
                          </span>
                        </div>

                        {submitResult.type === "cash" && (
                          <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.12)", display: "flex", alignItems: "flex-start", gap: 12 }}>
                            <Phone size={18} style={{ color: "#4ade80", flexShrink: 0, marginTop: 2 }} />
                            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
                              Ekibimiz en kısa sürede sizinle <strong style={{ color: "#fff" }}>telefonla</strong> iletişime geçecek ve ödeme detaylarını paylaşacak.
                            </span>
                          </div>
                        )}

                        <button
                          onClick={() => {
                            setCheckoutMode(false);
                            setCheckoutStep("contact");
                            setSubmitResult(null);
                            setIsOpen(false);
                          }}
                          style={{
                            marginTop: 16, width: "100%", padding: "14px", borderRadius: 12,
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
                    <span style={{ fontSize: "24px", fontWeight: 700, color: "#fff" }}>{fmt(cartTotal())}</span>
                    <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", fontWeight: 400, marginLeft: "2px" }}>₺</span>
                  </div>
                </div>

                {!checkoutMode ? (
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={clearCart} style={{
                      flex: 1, padding: "14px", borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.06)", background: "transparent",
                      color: "rgba(255,255,255,0.45)", fontSize: "12px", fontWeight: 600,
                      cursor: "pointer", transition: "all 0.2s",
                    }}>
                      Temizle
                    </button>
                    <button onClick={() => { setCheckoutMode(true); setCheckoutStep("contact"); }} style={{
                      flex: 2, padding: "14px", borderRadius: "12px",
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
                      width: "100%", padding: "16px", borderRadius: "12px",
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
