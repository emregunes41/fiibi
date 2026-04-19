"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Calendar, Clock, User, Phone, Mail, Banknote, AlertCircle, Instagram } from "lucide-react";
import { createManualReservation } from "@/app/admin/core-actions";
import { checkAvailability } from "@/app/admin/core-actions";
import { getBusinessType } from "@/lib/business-types";
import { useAdminSession } from "../AdminSessionContext";

/* ─── styles ─── */
const inp = {
  width: "100%", boxSizing: "border-box",
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
  padding: "14px 16px", fontSize: "14px", color: "#fff", outline: "none",
};
const lbl = {
  fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.45)",
  textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px", display: "block",
};
const btnStyle = (active) => ({
  width: "100%", padding: "16px", border: "none",
  background: active ? "#fff" : "rgba(255,255,255,0.04)",
  color: active ? "#000" : "rgba(255,255,255,0.15)",
  fontSize: "14px", fontWeight: 700, cursor: active ? "pointer" : "not-allowed",
  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
});
const card = (on) => ({
  padding: "20px",
  border: `1px solid ${on ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)"}`,
  background: on ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
  cursor: "pointer", transition: "all 0.2s",
});
const anim = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 }, transition: { duration: 0.25 } };
const fmt = (n) => Number(n).toLocaleString("tr-TR");
const MF = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

export default function AdminSimpleBookingClient({ initialPackages, blockedDays = [] }) {
  const { session: adminSession } = useAdminSession();
  const businessType = adminSession?.tenant?.businessType || "other";
  const bt = getBusinessType(businessType);
  const { terms } = bt;

  const [step, setStep] = useState(1); // 1=paket, 2=tarih/saat, 3=bilgiler+onay, 4=sonuç
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [contact, setContact] = useState({ name: "", phone: "", email: "", socialMedia: "", notes: "" });
  const [manualDiscount, setManualDiscount] = useState("");
  const [initialPaymentAmount, setInitialPaymentAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const today = new Date().toISOString().split("T")[0];

  const getTimeSlots = () => {
    if (!selectedPkg) return [];
    const slots = selectedPkg.availableSlots || [];
    if (slots.length > 0) return slots;
    const fallback = [];
    for (let h = 9; h < 18; h++) fallback.push(`${String(h).padStart(2, "0")}:00`);
    return fallback;
  };

  useEffect(() => {
    if (!selectedDate || !selectedPkg) return;
    setLoadingSlots(true);
    setSelectedTime("");
    checkAvailability(selectedDate, selectedPkg.id)
      .then(res => setBookedSlots(res?.bookedSlots || []))
      .catch(() => setBookedSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, selectedPkg]);

  const isContactValid = contact.name.trim().length >= 2 && contact.phone.trim().length >= 10 && contact.email.includes("@");

  const handleSubmit = async () => {
    setSubmitting(true);
    const price = parseInt(selectedPkg.price?.replace(/\D/g, "") || "0");
    const discountVal = Number(manualDiscount) || 0;
    const finalTotal = Math.max(0, price - discountVal);

    let notes = contact.notes || "";
    if (discountVal > 0) {
      notes += `\n\n[ADMIN NOTU] Sisteme ${fmt(discountVal)} TL özel manuel indirim uygulanmıştır.`;
    }

    const res = await createManualReservation({
      brideName: contact.name,
      bridePhone: contact.phone,
      brideEmail: contact.email,
      groomName: contact.socialMedia || "-",
      groomPhone: "-",
      groomEmail: "",
      eventDate: selectedDate,
      eventTime: selectedTime,
      packageIds: [selectedPkg.id],
      notes: notes,
      totalAmount: String(finalTotal),
      initialPaymentAmount: initialPaymentAmount,
      selectedAddons: [],
      customFieldAnswers: [
        { label: `${terms.appointment} Tarihi`, value: new Date(selectedDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" }), type: "text", packageName: selectedPkg.name },
        { label: "Saat", value: selectedTime, type: "text", packageName: selectedPkg.name },
      ],
    });
    setSubmitting(false);
    setResult(res);
    if (res?.success) setStep(4);
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 20px" }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: "clamp(24px, 3.5vw, 32px)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8, color: "#fff" }}>
          Manuel {terms.appointment} Oluştur
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>
          Müşteriyle aynı akışı kullanarak müşteri adına {terms.appointment.toLowerCase()} oluşturun.
        </p>
      </div>

      {/* Progress Steps */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "40px" }}>
        {[1,2,3].map(s => (
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
                        {duration && (
                          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", gap: "4px" }}>
                            <Clock size={10} /> {duration}
                          </span>
                        )}
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
              <button onClick={() => setStep(2)} disabled={!selectedPkg} style={btnStyle(!!selectedPkg)}>
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

            {/* Date */}
            <div style={{ marginBottom: "24px" }}>
              <div style={lbl}><Calendar size={11} style={{ display: "inline", marginRight: 4 }} /> Tarih Seçin</div>
              <input
                type="date" value={selectedDate} min={today}
                onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(""); }}
                style={{ ...inp, colorScheme: "dark" }}
              />
              {selectedDate && selectedPkg && (() => {
                const wd = selectedPkg.workingDays || [1, 2, 3, 4, 5];
                const dayOfWeek = new Date(selectedDate).getDay();
                const dayNames = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
                if (blockedDays.includes(selectedDate)) {
                  return <div style={{ background: "rgba(255,100,100,0.08)", border: "1px solid rgba(255,100,100,0.15)", padding: "10px 14px", marginTop: 8, fontSize: 12, color: "rgba(255,100,100,0.8)" }}>⚠ Bu tarih randevuya kapalıdır.</div>;
                }
                if (!wd.includes(dayOfWeek)) {
                  return <div style={{ background: "rgba(255,100,100,0.08)", border: "1px solid rgba(255,100,100,0.15)", padding: "10px 14px", marginTop: 8, fontSize: 12, color: "rgba(255,100,100,0.8)" }}>⚠ {dayNames[dayOfWeek]} günü hizmet verilmemektedir.</div>;
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
                        <button key={slot} disabled={isBooked} onClick={() => setSelectedTime(slot)} style={{
                          padding: "12px 8px", fontSize: "13px", fontWeight: 600,
                          cursor: isBooked ? "not-allowed" : "pointer", transition: "all 0.15s",
                          background: isSelected ? "rgba(255,255,255,0.15)" : isBooked ? "rgba(255,0,0,0.05)" : "rgba(255,255,255,0.03)",
                          color: isSelected ? "#fff" : isBooked ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.5)",
                          border: isSelected ? "1px solid rgba(255,255,255,0.4)" : "1px solid rgba(255,255,255,0.06)",
                          textDecoration: isBooked ? "line-through" : "none",
                        }}>
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: "24px" }}>
              <button onClick={() => setStep(3)} disabled={!selectedDate || !selectedTime} style={btnStyle(selectedDate && selectedTime)}>
                Devam <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ═══ STEP 3: Müşteri Bilgileri & Onay ═══ */}
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

            {/* Contact Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
              <div>
                <label style={lbl}><User size={10} style={{ display: "inline", marginRight: 4 }} /> {terms.client} Adı *</label>
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
                <label style={lbl}><Instagram size={10} style={{ display: "inline", marginRight: 4 }} /> Sosyal Medya</label>
                <input type="text" value={contact.socialMedia} onChange={e => setContact(p => ({...p, socialMedia: e.target.value}))} placeholder="@instagram" style={inp} />
              </div>
              <div>
                <label style={lbl}>Not (İsteğe bağlı)</label>
                <textarea value={contact.notes} onChange={e => setContact(p => ({...p, notes: e.target.value}))} placeholder="Eklemek istediğiniz not..." rows={3} style={{ ...inp, resize: "vertical" }} />
              </div>
            </div>

            {/* Admin-specific: Discount & Initial Payment */}
            <div style={{ padding: "20px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: "24px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: "16px" }}>Admin Ayarları</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={lbl}><Banknote size={10} style={{ display: "inline", marginRight: 4 }} /> Manuel İndirim (TL) - İsteğe Bağlı</label>
                  <input type="number" min="0" value={manualDiscount} onChange={e => setManualDiscount(e.target.value)} placeholder="Örn: 500" style={inp} />
                </div>
                <div>
                  <label style={lbl}><Banknote size={10} style={{ display: "inline", marginRight: 4 }} /> Alınan Ön Ödeme (Kapora) - İsteğe Bağlı</label>
                  <input type="number" min="0" value={initialPaymentAmount} onChange={e => setInitialPaymentAmount(e.target.value)} placeholder="Örn: 2000" style={inp} />
                </div>
              </div>
            </div>

            {/* Price Summary */}
            {(() => {
              const price = parseInt(selectedPkg?.price?.replace(/\D/g, "") || "0");
              const discountVal = Number(manualDiscount) || 0;
              const finalTotal = Math.max(0, price - discountVal);
              return (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "24px", padding: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Toplam</span>
                  <div style={{ textAlign: "right" }}>
                    {discountVal > 0 && <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)", textDecoration: "line-through" }}>{fmt(price)}₺</div>}
                    <span style={{ fontSize: "22px", fontWeight: 700, color: "#fff" }}>{fmt(finalTotal)}<span style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", fontWeight: 400, marginLeft: "2px" }}>₺</span></span>
                  </div>
                </div>
              );
            })()}

            {result?.error && (
              <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: "16px", fontSize: "13px", color: "#fca5a5", display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                {result.error}
              </div>
            )}

            <button onClick={handleSubmit} disabled={!isContactValid || submitting} style={btnStyle(isContactValid && !submitting)}>
              {submitting ? "Oluşturuluyor..." : <><Check size={16} /> {terms.appointment} Oluştur</>}
            </button>
          </motion.div>
        )}

        {/* ═══ STEP 4: Başarılı ═══ */}
        {step === 4 && (
          <motion.div key="s4" {...anim}>
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{
                width: 80, height: 80, margin: "0 auto 24px",
                background: "rgba(34,197,94,0.1)", border: "2px solid rgba(34,197,94,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px",
              }}>✅</div>
              <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "12px" }}>
                {terms.appointment} Oluşturuldu!
              </h2>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", lineHeight: 1.7, maxWidth: "400px", margin: "0 auto 24px" }}>
                Manuel {terms.appointment.toLowerCase()} başarıyla oluşturuldu. Müşteriye e-posta bildirimi gönderildi.
              </p>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: "16px", maxWidth: "340px", margin: "0 auto 24px", textAlign: "left" }}>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "6px" }}>{selectedPkg?.name}</div>
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>
                  {new Date(selectedDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })} — {selectedTime}
                </div>
              </div>
              <a href="/admin/reservations" style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "14px 32px", background: "#fff", color: "#000",
                textDecoration: "none", fontSize: "14px", fontWeight: 700,
              }}>
                Rezervasyonlara Git
              </a>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
