"use client";

import { useState } from "react";
import { CartProvider, useCart } from "@/components/CartContext";
import BookingFlow from "@/components/BookingFlow";
import { savePendingReservation } from "@/app/admin/core-actions";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ShoppingBag, Trash2, ArrowRight,
  Camera, Heart, Gem, Calendar, Clock,
  FileText, User, Phone, Mail, Instagram, Check, Banknote
} from "lucide-react";

const CAT_META = {
  DIS_CEKIM: { label: "Dış Çekim", Icon: Camera, color: "#f59e0b" },
  DUGUN: { label: "Düğün", Icon: Heart, color: "#fb7185" },
  NISAN: { label: "Nişan", Icon: Gem, color: "#67e8f9" },
};
const MF = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const fmt = (n) => n.toLocaleString("tr-TR");

const inputStyle = {
  width: "100%", background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.15)", borderRadius: "12px",
  padding: "14px 16px", fontSize: "13px", color: "#fff",
  outline: "none", boxSizing: "border-box",
};
const labelStyle = {
  fontSize: "11px", color: "rgba(255,255,255,0.5)", fontWeight: 600,
  display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.1em",
};

function AdminCartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, cartTotal, clearCart, itemCount } = useCart();
  const [contactForm, setContactForm] = useState({
    brideName: "", bridePhone: "", brideEmail: "",
    groomName: "", groomPhone: "", socialMedia: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [showContact, setShowContact] = useState(false);
  const [manualDiscount, setManualDiscount] = useState("");
  const [initialPaymentAmount, setInitialPaymentAmount] = useState("");

  const isContactValid = contactForm.brideName && contactForm.bridePhone && contactForm.brideEmail && contactForm.groomName && contactForm.groomPhone;

  const handleSave = async () => {
    if (isSubmitting || !isContactValid) return;
    setIsSubmitting(true);

    const allAddons = items.flatMap(i => i.addons.map(a => ({ ...a, packageName: i.pkg.name })));
    const allCustomFieldAnswers = items.flatMap(i => {
      const answers = (i.details?.customFieldAnswers || []).map(a => ({ ...a, packageName: i.pkg.name }));
      if (i.details?.date) {
        const dateStr = new Date(i.details.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" });
        answers.unshift({ label: "Etkinlik Tarihi", value: dateStr, type: "text", packageName: i.pkg.name });
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

    const discountVal = Number(manualDiscount) || 0;
    const finalTotal = Math.max(0, cartTotal() - discountVal);

    let updatedNotes = allNotes;
    if (discountVal > 0) {
      updatedNotes += `\n\n[ADMIN NOTU] Sisteme ${fmt(discountVal)} TL özel manuel indirim uygulanmıştır.`;
    }

    const firstItem = items[0];
    const data = {
      brideName: contactForm.brideName,
      bridePhone: contactForm.bridePhone,
      brideEmail: contactForm.brideEmail,
      groomName: contactForm.groomName,
      groomPhone: contactForm.groomPhone,
      groomEmail: "",
      date: firstItem?.details?.date || new Date().toISOString().split("T")[0],
      time: firstItem?.details?.time || "",
      packageIds: items.map(i => i.pkg.id),
      notes: updatedNotes,
      totalAmount: fmt(finalTotal),
      paidAmount: "0",
      initialPaymentAmount: initialPaymentAmount,
      selectedAddons: allAddons,
      customFieldAnswers: allCustomFieldAnswers,
    };

    const result = await savePendingReservation(data);
    setIsSubmitting(false);
    if (result.success) {
      setSubmitResult({ success: true, message: "Rezervasyon başarıyla oluşturuldu!" });
      clearCart();
    } else {
      setSubmitResult({ success: false, message: "Hata: " + (result.error || "Bilinmeyen hata") });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { setIsOpen(false); setShowContact(false); }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", zIndex: 5000 }}
          />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            style={{
              position: "fixed", top: 0, right: 0, bottom: 0, width: "min(440px, 95vw)",
              background: "#0a0a0f", borderLeft: "1px solid rgba(255,255,255,0.1)",
              zIndex: 5001, display: "flex", flexDirection: "column",
              boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
            }}
          >
            {/* Header */}
            <div style={{ padding: "24px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>
                  {submitResult ? (submitResult.success ? "✅ Tamamlandı" : "❌ Hata") : showContact ? "Müşteri Bilgileri" : "Admin Sepeti"}
                </div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>
                  {submitResult ? "" : showContact ? "Bilgileri doldurun ve kaydedin" : `${itemCount} paket`}
                </div>
              </div>
              <button onClick={() => { setIsOpen(false); setShowContact(false); }} style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "10px", padding: "8px", cursor: "pointer", color: "rgba(255,255,255,0.6)",
              }}><X size={16} /></button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
              {submitResult ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div style={{ width: 80, height: 80, margin: "0 auto 24px", borderRadius: "50%", background: submitResult.success ? "rgba(52,211,153,0.1)" : "rgba(255,60,60,0.1)", border: `2px solid ${submitResult.success ? "rgba(52,211,153,0.25)" : "rgba(255,60,60,0.25)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>
                    {submitResult.success ? "🎉" : "❌"}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: submitResult.success ? "#34d399" : "#ef4444", marginBottom: 12 }}>
                    {submitResult.success ? "Rezervasyon Oluşturuldu!" : "Hata"}
                  </div>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>{submitResult.message}</p>
                  <button onClick={() => { setSubmitResult(null); setShowContact(false); setIsOpen(false); }} style={{
                    marginTop: 24, width: "100%", padding: 14, borderRadius: 12,
                    background: "#fff", color: "#000", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer",
                  }}>Tamam</button>
                </div>
              ) : showContact ? (
                /* Contact Form */
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div><label style={labelStyle}><User size={10} style={{ display: "inline", marginRight: 4 }} /> Gelin Adı *</label>
                    <input type="text" value={contactForm.brideName} onChange={(e) => setContactForm(p => ({ ...p, brideName: e.target.value }))} placeholder="Ad Soyad" style={inputStyle} /></div>
                  <div><label style={labelStyle}><Phone size={10} style={{ display: "inline", marginRight: 4 }} /> Gelin Telefon *</label>
                    <input type="tel" value={contactForm.bridePhone} onChange={(e) => setContactForm(p => ({ ...p, bridePhone: e.target.value }))} placeholder="05XX XXX XX XX" style={inputStyle} /></div>
                  <div><label style={labelStyle}><Mail size={10} style={{ display: "inline", marginRight: 4 }} /> Gelin E-posta *</label>
                    <input type="email" value={contactForm.brideEmail} onChange={(e) => setContactForm(p => ({ ...p, brideEmail: e.target.value }))} placeholder="ornek@email.com" style={inputStyle} /></div>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.04)", margin: "4px 0" }} />
                  <div><label style={labelStyle}><User size={10} style={{ display: "inline", marginRight: 4 }} /> Damat Adı *</label>
                    <input type="text" value={contactForm.groomName} onChange={(e) => setContactForm(p => ({ ...p, groomName: e.target.value }))} placeholder="Ad Soyad" style={inputStyle} /></div>
                  <div><label style={labelStyle}><Phone size={10} style={{ display: "inline", marginRight: 4 }} /> Damat Telefon *</label>
                    <input type="tel" value={contactForm.groomPhone} onChange={(e) => setContactForm(p => ({ ...p, groomPhone: e.target.value }))} placeholder="05XX XXX XX XX" style={inputStyle} /></div>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.04)", margin: "4px 0" }} />
                  <div><label style={labelStyle}><Instagram size={10} style={{ display: "inline", marginRight: 4 }} /> Sosyal Medya</label>
                    <input type="text" value={contactForm.socialMedia} onChange={(e) => setContactForm(p => ({ ...p, socialMedia: e.target.value }))} placeholder="@instagram" style={inputStyle} /></div>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.04)", margin: "4px 0" }} />
                  <div>
                    <label style={{...labelStyle, color: "#34d399"}}><Banknote size={10} style={{ display: "inline", marginRight: 4 }} /> Alınan Ön Ödeme (Kapora) Tutarı - Opsiyonel</label>
                    <input 
                      type="number" 
                      min="0"
                      value={initialPaymentAmount} 
                      onChange={(e) => setInitialPaymentAmount(e.target.value)} 
                      placeholder="Örn: 4000" 
                      style={{ ...inputStyle, border: "1px solid rgba(52,211,153,0.3)", background: "rgba(52,211,153,0.05)" }} 
                    />
                  </div>
                </div>
              ) : (
                /* Cart Items */
                items.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.3)" }}>
                    <ShoppingBag size={40} style={{ margin: "0 auto 16px", opacity: 0.5 }} />
                    <p style={{ fontSize: 14 }}>Sepet boş — sol taraftan paket ekleyin</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {items.map((item) => {
                      const meta = CAT_META[item.category] || { label: item.category, color: "#aaa" };
                      const Icon = meta.Icon || ShoppingBag;
                      const pkgPrice = item.price ?? (parseInt(item.pkg.price?.replace(/\D/g, "")) || 0);
                      const addonPrice = item.addons.reduce((s, a) => s + (parseInt(a.price) || 0), 0);
                      return (
                        <div key={item.pkg.id} style={{ padding: 16, borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: `linear-gradient(135deg, ${meta.color}15 0%, transparent 60%)`, position: "relative" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                            <div style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: meta.color, display: "flex", alignItems: "center", gap: 4 }}>
                              <Icon size={10} /> {meta.label}
                            </div>
                            <button onClick={() => removeItem(item.pkg.id)} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: 6, cursor: "pointer", color: "rgba(255,60,60,0.7)" }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 4 }}>{item.pkg.name}</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>{MF[item.month - 1]} {item.year}</div>
                          {item.details && (
                            <div style={{ padding: 10, borderRadius: 10, marginBottom: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                              {item.details.date && (
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                                  <Calendar size={11} style={{ opacity: 0.7 }} />
                                  {new Date(item.details.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                                </div>
                              )}
                              {item.details.timeLabel && (
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                                  <Clock size={11} style={{ opacity: 0.7 }} />
                                  {item.details.timeLabel}
                                </div>
                              )}
                              {item.details.customFieldAnswers?.filter(a => a.value !== "" && a.value !== false).length > 0 && (
                                <div style={{ marginTop: 4, paddingTop: 4, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                                  {item.details.customFieldAnswers.filter(a => a.value !== "" && a.value !== false).map((a, i) => (
                                    <div key={i} style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>
                                      <span style={{ fontWeight: 600 }}>{a.label}:</span> {a.type === "checkbox" ? "✓" : a.value}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          {item.addons.length > 0 && (
                            <div style={{ marginBottom: 8 }}>
                              {item.addons.map((a, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>
                                  <span>+ {a.title}</span><span>{a.price}₺</span>
                                </div>
                              ))}
                            </div>
                          )}
                          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "baseline", gap: 4 }}>
                            <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{fmt(pkgPrice + addonPrice)}</span>
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>₺</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && !submitResult && (
              <div style={{ padding: 20, borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.3)" }}>
                {showContact && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{...labelStyle, color: "#facc15"}}>Manuel İndirim Tutarı (TL) - İsteğe Bağlı</label>
                    <input 
                      type="number" 
                      min="0"
                      value={manualDiscount} 
                      onChange={(e) => setManualDiscount(e.target.value)} 
                      placeholder="Örn: 2000" 
                      style={{ ...inputStyle, border: "1px solid rgba(250,204,21,0.3)", background: "rgba(250,204,21,0.05)" }} 
                    />
                  </div>
                )}
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)" }}>TOPLAM</div>
                  <div style={{ textAlign: "right" }}>
                    {showContact && Number(manualDiscount) > 0 && (
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", textDecoration: "line-through", marginBottom: 2 }}>{fmt(cartTotal())} ₺</div>
                    )}
                    <span style={{ fontSize: 24, fontWeight: 700, color: "#fff" }}>{fmt(Math.max(0, cartTotal() - (Number(manualDiscount) || 0)))}</span>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontWeight: 400, marginLeft: 2 }}>₺</span>
                  </div>
                </div>
                {!showContact ? (
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={clearCart} style={{ flex: 1, padding: 14, borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", background: "transparent", color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Temizle</button>
                    <button onClick={() => setShowContact(true)} style={{
                      flex: 2, padding: 14, borderRadius: 12, border: "none",
                      background: "#fff", color: "#000", fontSize: 13, fontWeight: 700,
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}>
                      <ArrowRight size={14} /> Müşteri Bilgileri
                    </button>
                  </div>
                ) : (
                  <button onClick={handleSave} disabled={!isContactValid || isSubmitting} style={{
                    width: "100%", padding: 16, borderRadius: 12, border: "none",
                    background: isContactValid ? "#34d399" : "rgba(255,255,255,0.04)",
                    color: isContactValid ? "#000" : "rgba(255,255,255,0.15)",
                    fontSize: 14, fontWeight: 700, cursor: isContactValid ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                    <Check size={16} /> {isSubmitting ? "Kaydediliyor..." : "Rezervasyonu Oluştur"}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function AdminBookingClient({ initialPackages }) {
  return (
    <CartProvider>
      <div style={{ maxWidth: 720 }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: "clamp(24px, 3.5vw, 32px)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8, color: "#fff" }}>
            Manuel Rezervasyon Oluştur
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>
            Online rezervasyon akışının aynısını kullanarak müşteri adına rezervasyon oluşturun. Müşteri bilgilerini girerken isteğe bağlı özel indirim tanımlayabilirsiniz.
          </p>
        </div>
        <BookingFlow initialPackages={initialPackages} isAdmin={true} />
      </div>
      <AdminCartDrawer />
    </CartProvider>
  );
}
