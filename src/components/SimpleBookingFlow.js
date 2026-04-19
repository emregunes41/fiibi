"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Calendar, Clock, User, Phone, Mail, CreditCard, Banknote, AlertCircle } from "lucide-react";
import { savePendingReservation, checkAvailability } from "@/app/admin/core-actions";
import { getBusinessType } from "@/lib/business-types";

/* ─── Styles ─── */
const card = (on) => ({
  padding: "20px",
  border: `1px solid ${on ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)"}`,
  background: on ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
  cursor: "pointer",
  transition: "all 0.2s",
});
const inp = {
  width: "100%", boxSizing: "border-box",
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
  padding: "14px 16px", fontSize: "14px", color: "#fff", outline: "none",
};
const lbl = {
  fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.45)",
  textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px", display: "block",
};
const btn = (active) => ({
  width: "100%", padding: "16px", border: "none",
  background: active ? "#fff" : "rgba(255,255,255,0.04)",
  color: active ? "#000" : "rgba(255,255,255,0.15)",
  fontSize: "14px", fontWeight: 700, cursor: active ? "pointer" : "not-allowed",
  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
});
const anim = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 }, transition: { duration: 0.25 } };

const fmt = (n) => Number(n).toLocaleString("tr-TR");
const MF = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

export default function SimpleBookingFlow({ initialPackages, blockedDays = [], paymentMode = "cash" }) {
  const [step, setStep] = useState(0); // 0=loading, 1=paket, 2=tarih/saat, 3=bilgiler, 4=ödeme, 5=sonuç
  const [businessType, setBusinessType] = useState(null);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [contact, setContact] = useState({ name: "", phone: "", email: "", notes: "" });
  const [paymentMethod, setPaymentMethod] = useState("cash"); // cash or card
  const [submitting, setSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [result, setResult] = useState(null);

  // Load business type
  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then(data => {
      setBusinessType(data?.tenant?.businessType || "other");
      setStep(1);
    }).catch(() => { setBusinessType("other"); setStep(1); });
  }, []);

  const bt = getBusinessType(businessType || "other");
  const { terms } = bt;

  // Get available time slots for selected package
  const getTimeSlots = () => {
    if (!selectedPkg) return [];
    const slots = selectedPkg.availableSlots || [];
    if (slots.length > 0) return slots;
    // Fallback: generate hourly slots 09:00-18:00
    const fallback = [];
    for (let h = 9; h < 18; h++) {
      fallback.push(`${String(h).padStart(2, "0")}:00`);
    }
    return fallback;
  };

  // Check availability when date changes
  useEffect(() => {
    if (!selectedDate || !selectedPkg) return;
    setLoadingSlots(true);
    setSelectedTime("");
    checkAvailability(selectedDate, selectedPkg.id)
      .then(res => {
        setBookedSlots(res?.bookedSlots || []);
      })
      .catch(() => setBookedSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, selectedPkg]);

  // Today's date for min
  const today = new Date().toISOString().split("T")[0];

  // Submit
  const handleSubmit = async () => {
    setSubmitting(true);
    const price = parseInt(selectedPkg.price?.replace(/\D/g, "") || "0");
    const res = await savePendingReservation({
      brideName: contact.name,
      bridePhone: contact.phone,
      brideEmail: contact.email,
      groomName: "-",
      groomPhone: "-",
      groomEmail: "",
      date: selectedDate,
      time: selectedTime,
      packageIds: [selectedPkg.id],
      notes: contact.notes || "",
      totalAmount: String(price),
      paidAmount: "0",
      selectedAddons: [],
      customFieldAnswers: [
        { label: `${terms.appointment} Tarihi`, value: new Date(selectedDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" }), type: "text", packageName: selectedPkg.name },
        { label: "Saat", value: selectedTime, type: "text", packageName: selectedPkg.name },
      ],
      password: undefined,
      paymentPreference: paymentMethod,
    });
    setSubmitting(false);
    setResult(res);
    if (res?.success) setStep(5);
  };

  const isContactValid = contact.name.trim().length >= 2 && contact.phone.trim().length >= 10 && contact.email.includes("@");

  if (step === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <div style={{ width: 24, height: 24, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "rgba(255,255,255,0.5)", borderRadius: "50%", margin: "0 auto", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ width: "100%" }}>
      {/* Progress Steps */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "40px" }}>
        {[1,2,3,4].map(s => (
          <div key={s} style={{
            flex: 1, height: "3px",
            background: step >= s ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.08)",
            transition: "all 0.3s",
          }} />
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ═══ STEP 1: Paket Seçimi ═══ */}
        {step === 1 && (
          <motion.div key="s1" {...anim}>
            <div style={{ marginBottom: "16px" }}>
              <div style={lbl}>{terms.service} Seçin</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {initialPackages.map(pkg => {
                const on = selectedPkg?.id === pkg.id;
                const price = parseInt(pkg.price?.replace(/\D/g, "") || "0");
                const duration = pkg.sessionDuration ? `${pkg.sessionDuration} dk` : null;
                return (
                  <div key={pkg.id} onClick={() => setSelectedPkg(pkg)} style={card(on)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: "15px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>
                          {on && <Check size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />}
                          {pkg.name}
                        </div>
                        {pkg.description && (
                          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "6px", lineHeight: 1.5 }}>
                            {pkg.description}
                          </div>
                        )}
                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                          {duration && (
                            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", gap: "4px" }}>
                              <Clock size={10} /> {duration}
                            </span>
                          )}
                          {pkg.features && (
                            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
                              {pkg.features}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: "18px", fontWeight: 700, color: "#fff" }}>{fmt(price)}₺</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {initialPackages.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.3)", border: "1px dashed rgba(255,255,255,0.1)" }}>
                Henüz {terms.service.toLowerCase()} oluşturulmamış.
              </div>
            )}
            <div style={{ marginTop: "24px" }}>
              <button onClick={() => setStep(2)} disabled={!selectedPkg} style={btn(!!selectedPkg)}>
                Devam <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ═══ STEP 2: Tarih & Saat ═══ */}
        {step === 2 && (
          <motion.div key="s2" {...anim}>
            <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "13px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "6px" }}>
              <ArrowLeft size={14} /> Geri
            </button>

            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: "16px", marginBottom: "24px" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>{selectedPkg?.name}</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>
                {fmt(parseInt(selectedPkg?.price?.replace(/\D/g, "") || "0"))}₺
                {selectedPkg?.sessionDuration && ` • ${selectedPkg.sessionDuration} dk`}
              </div>
            </div>

            {/* Date Picker */}
            <div style={{ marginBottom: "24px" }}>
              <div style={lbl}><Calendar size={11} style={{ display: "inline", marginRight: 4 }} /> Tarih Seçin</div>
              <input
                type="date"
                value={selectedDate}
                min={today}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedDate(val);
                  setSelectedTime("");
                }}
                style={{ ...inp, colorScheme: "dark" }}
              />
              {selectedDate && selectedPkg && (() => {
                const wd = selectedPkg.workingDays || [1, 2, 3, 4, 5];
                const dayOfWeek = new Date(selectedDate).getDay();
                const dayNames = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
                if (blockedDays.includes(selectedDate)) {
                  return (
                    <div style={{ background: "rgba(255,100,100,0.08)", border: "1px solid rgba(255,100,100,0.15)", padding: "10px 14px", marginTop: 8, fontSize: 12, color: "rgba(255,100,100,0.8)" }}>
                      ⚠ Bu tarih randevuya kapalıdır. Lütfen başka bir gün seçin.
                    </div>
                  );
                }
                if (!wd.includes(dayOfWeek)) {
                  return (
                    <div style={{ background: "rgba(255,100,100,0.08)", border: "1px solid rgba(255,100,100,0.15)", padding: "10px 14px", marginTop: 8, fontSize: 12, color: "rgba(255,100,100,0.8)" }}>
                      ⚠ {dayNames[dayOfWeek]} günü hizmet verilmemektedir. Lütfen başka bir gün seçin.
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Time Slots */}
            {selectedDate && (() => {
              const wd = selectedPkg?.workingDays || [1, 2, 3, 4, 5];
              const dayOfWeek = new Date(selectedDate).getDay();
              return wd.includes(dayOfWeek) && !blockedDays.includes(selectedDate);
            })() && (
              <div>
                <div style={lbl}><Clock size={11} style={{ display: "inline", marginRight: 4 }} /> Saat Seçin</div>
                {loadingSlots ? (
                  <div style={{ textAlign: "center", padding: "20px", color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>Müsaitlik kontrol ediliyor...</div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "6px" }}>
                    {getTimeSlots().map(slot => {
                      const isBooked = bookedSlots.includes(slot);
                      const isSelected = selectedTime === slot;
                      return (
                        <button
                          key={slot}
                          disabled={isBooked}
                          onClick={() => setSelectedTime(slot)}
                          style={{
                            padding: "12px 8px", border: "none", fontSize: "13px", fontWeight: 600,
                            cursor: isBooked ? "not-allowed" : "pointer",
                            transition: "all 0.15s",
                            background: isSelected ? "rgba(255,255,255,0.15)" : isBooked ? "rgba(255,0,0,0.05)" : "rgba(255,255,255,0.03)",
                            color: isSelected ? "#fff" : isBooked ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.5)",
                            border: isSelected ? "1px solid rgba(255,255,255,0.4)" : "1px solid rgba(255,255,255,0.06)",
                            textDecoration: isBooked ? "line-through" : "none",
                          }}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: "24px" }}>
              <button onClick={() => setStep(3)} disabled={!selectedDate || !selectedTime} style={btn(selectedDate && selectedTime)}>
                Devam <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ═══ STEP 3: Kişisel Bilgiler ═══ */}
        {step === 3 && (
          <motion.div key="s3" {...anim}>
            <button onClick={() => setStep(2)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "13px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "6px" }}>
              <ArrowLeft size={14} /> Geri
            </button>

            {/* Summary */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: "16px", marginBottom: "24px" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>{selectedPkg?.name}</div>
              <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
                <span><Calendar size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />
                  {new Date(selectedDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                </span>
                <span><Clock size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />{selectedTime}</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={lbl}><User size={10} style={{ display: "inline", marginRight: 4 }} /> Ad Soyad *</label>
                <input type="text" value={contact.name} onChange={e => setContact(p => ({...p, name: e.target.value}))} placeholder="Ad Soyad" style={inp} />
              </div>
              <div>
                <label style={lbl}><Phone size={10} style={{ display: "inline", marginRight: 4 }} /> Telefon *</label>
                <input type="tel" value={contact.phone} onChange={e => setContact(p => ({...p, phone: e.target.value}))} placeholder="05XX XXX XX XX" style={inp} />
              </div>
              <div>
                <label style={lbl}><Mail size={10} style={{ display: "inline", marginRight: 4 }} /> E-posta *</label>
                <input type="email" value={contact.email} onChange={e => setContact(p => ({...p, email: e.target.value}))} placeholder="ornek@email.com" style={inp} />
              </div>
              <div>
                <label style={lbl}>Not (İsteğe bağlı)</label>
                <textarea value={contact.notes} onChange={e => setContact(p => ({...p, notes: e.target.value}))} placeholder="Eklemek istediğiniz not..." rows={3} style={{ ...inp, resize: "vertical" }} />
              </div>
            </div>

            <div style={{ marginTop: "24px" }}>
              <button onClick={() => setStep(4)} disabled={!isContactValid} style={btn(isContactValid)}>
                Devam <ArrowRight size={16} />
              </button>
              {!isContactValid && contact.name && (
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", textAlign: "center", marginTop: "8px" }}>
                  Tüm zorunlu alanları doldurun
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ═══ STEP 4: Ödeme Yöntemi & Onay ═══ */}
        {step === 4 && (
          <motion.div key="s4" {...anim}>
            <button onClick={() => setStep(3)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "13px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "6px" }}>
              <ArrowLeft size={14} /> Geri
            </button>

            {/* Full Summary */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: "20px", marginBottom: "24px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
                {terms.appointment} Özeti
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  { l: terms.service, v: selectedPkg?.name },
                  { l: "Tarih", v: new Date(selectedDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" }) },
                  { l: "Saat", v: selectedTime },
                  { l: "Ad Soyad", v: contact.name },
                  { l: "Telefon", v: contact.phone },
                  { l: "E-posta", v: contact.email },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ color: "rgba(255,255,255,0.4)" }}>{r.l}</span>
                    <span style={{ color: "#fff", fontWeight: 600, textAlign: "right" }}>{r.v}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>TOPLAM</span>
                <span style={{ fontSize: "20px", fontWeight: 700, color: "#fff" }}>
                  {fmt(parseInt(selectedPkg?.price?.replace(/\D/g, "") || "0"))}₺
                </span>
              </div>
            </div>

            {/* Payment Method */}
            <div style={{ marginBottom: "24px" }}>
              <div style={lbl}>Ödeme Yöntemi</div>
              <div style={{ display: "flex", gap: "8px" }}>
                {[
                  { value: "cash", label: "Nakit / Havale", icon: <Banknote size={16} /> },
                  ...(paymentMode !== "cash" ? [{ value: "card", label: "Kredi Kartı", icon: <CreditCard size={16} /> }] : []),
                ].map(m => (
                  <button
                    key={m.value}
                    onClick={() => setPaymentMethod(m.value)}
                    style={{
                      flex: 1, padding: "16px", cursor: "pointer",
                      border: paymentMethod === m.value ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.08)",
                      background: paymentMethod === m.value ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                      color: paymentMethod === m.value ? "#fff" : "rgba(255,255,255,0.4)",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                      fontSize: "13px", fontWeight: 600, transition: "all 0.2s",
                    }}
                  >
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
            </div>

            {result?.error && (
              <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: "16px", fontSize: "13px", color: "#fca5a5", display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                {result.error}
              </div>
            )}

            <div style={{ marginBottom: 24, padding: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer", marginBottom: 0 }}>
                <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} style={{ width: 18, height: 18, accentColor: "#000", marginTop: 2, cursor: "pointer" }} />
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                  <a href="/sozlesme?tab=hizmet" target="_blank" style={{ color: "#fff", textDecoration: "underline" }}>Hizmet Sözleşmesi</a>'ni ve <a href="/sozlesme?tab=mesafeli" target="_blank" style={{ color: "#fff", textDecoration: "underline" }}>Ön Bilgilendirme ile Mesafeli Satış Sözleşmesi</a>'ni okudum, onaylıyorum.
                </span>
              </label>
            </div>

            <button onClick={handleSubmit} disabled={submitting || !agreedToTerms} style={{ ...btn(!submitting && agreedToTerms), opacity: (!submitting && agreedToTerms) ? 1 : 0.5 }}>
              {submitting ? (
                <>Oluşturuluyor...</>
              ) : (
                <><Check size={16} /> {terms.appointment} Oluştur</>
              )}
            </button>
          </motion.div>
        )}

        {/* ═══ STEP 5: Başarılı ═══ */}
        {step === 5 && (
          <motion.div key="s5" {...anim}>
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{
                width: 80, height: 80, margin: "0 auto 24px",
                background: "rgba(34,197,94,0.1)", border: "2px solid rgba(34,197,94,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px",
              }}>
                ✅
              </div>
              <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "12px" }}>
                {terms.appointment}nuz Alındı!
              </h2>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", lineHeight: 1.7, maxWidth: "400px", margin: "0 auto 24px" }}>
                {terms.appointment}nuz başarıyla oluşturuldu. E-posta adresinize detaylar gönderildi.
              </p>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: "16px", maxWidth: "340px", margin: "0 auto 24px", textAlign: "left" }}>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "6px" }}>{selectedPkg?.name}</div>
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>
                  {new Date(selectedDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })} — {selectedTime}
                </div>
              </div>
              <a href="/" style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "14px 32px", background: "#fff", color: "#000",
                textDecoration: "none", fontSize: "14px", fontWeight: 700,
              }}>
                Ana Sayfaya Dön
              </a>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
