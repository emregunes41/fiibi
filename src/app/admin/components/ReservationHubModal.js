"use client";

import { useState, useEffect } from "react";
import { X, Edit2, User, Phone, Mail, Calendar, Clock, CreditCard, FileText, ExternalLink, Trash2 } from "lucide-react";
import { updateReservationStatus, updateReservationWorkflow, addPayment, updateReservation } from "../core-actions";
import { sendContractReminder, resendCredentials } from "../reminder-actions";

const inp = {
  padding: "0.7rem 0.8rem", borderRadius: 0, fontSize: "0.8rem",
  border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.08)",
  color: "#fff", outline: "none", width: "100%", boxSizing: "border-box",
};

export default function ReservationHubModal({
  isOpen,
  reservation,
  onClose,
  onUpdate,
  isPhotographer,
  terms,
  paymentMode,
  onDelete
}) {
  const [data, setData] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [paymentForm, setPaymentForm] = useState({ amount: "", method: "CASH", note: "" });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [reminderLoading, setReminderLoading] = useState("");
  const [reminderResult, setReminderResult] = useState(null);

  useEffect(() => {
    if (reservation) {
      setData(reservation);
      setFormData({
        brideName: reservation.brideName || "",
        groomName: reservation.groomName || "",
        bridePhone: reservation.bridePhone || "",
        groomPhone: reservation.groomPhone || "",
        brideEmail: reservation.brideEmail || "",
        groomEmail: reservation.groomEmail || "",
        eventDate: reservation.eventDate ? reservation.eventDate.split('T')[0] : "",
        eventTime: reservation.eventTime || "",
        notes: reservation.notes || "",
        venueName: reservation.venueName || "",
        meetingLink: reservation.meetingLink || "",
      });
      setIsEditMode(false);
      setReminderResult(null);
    }
  }, [reservation]);

  if (!isOpen || !data) return null;

  const r = data;

  const statusColor = (status) => {
    switch (status) {
      case "PENDING": return { bg: "rgba(234,179,8,0.1)", c: "#facc15", b: "1px solid rgba(234,179,8,0.2)" };
      case "CONFIRMED": return { bg: "rgba(74,222,128,0.1)", c: "#4ade80", b: "1px solid rgba(74,222,128,0.2)" };
      case "COMPLETED": return { bg: "rgba(96,165,250,0.1)", c: "#60a5fa", b: "1px solid rgba(96,165,250,0.2)" };
      case "CANCELLED": return { bg: "rgba(248,113,113,0.1)", c: "#f87171", b: "1px solid rgba(248,113,113,0.2)" };
      default: return { bg: "rgba(255,255,255,0.05)", c: "#ccc", b: "1px solid rgba(255,255,255,0.1)" };
    }
  };
  const sc = statusColor(r.status);

  const handleStatusChange = async (newStatus) => {
    setIsLoading(true);
    await updateReservationStatus(r.id, newStatus);
    setData(prev => ({ ...prev, status: newStatus }));
    if (onUpdate) onUpdate();
    setIsLoading(false);
  };

  const handleSaveEdit = async () => {
    setIsLoading(true);
    const res = await updateReservation(r.id, formData);
    if (res.success) {
      setData(res.reservation);
      setIsEditMode(false);
      if (onUpdate) onUpdate();
    } else {
      alert("Hata: " + res.error);
    }
    setIsLoading(false);
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    setPaymentLoading(true);
    const res = await addPayment(r.id, {
      amount: parseFloat(paymentForm.amount),
      method: paymentForm.method,
      note: paymentForm.note
    });
    if (res.success) {
      setPaymentForm({ amount: "", method: "CASH", note: "" });
      // Reload is required. Ideally API returns the updated reservation payments.
      // But for robust approach we trigger onUpdate and we can expect a new reservation prop.
      // However to immediately reflect, let's just trigger onUpdate.
      if (onUpdate) onUpdate();
    } else {
      alert("Ödeme eklenemedi: " + res.error);
    }
    setPaymentLoading(false);
  };

  const DetailRow = ({ icon: Icon, label, value, color }) => (
    value ? (
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <Icon size={12} style={{ color: color || "rgba(255,255,255,0.35)", flexShrink: 0 }} />
        <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", minWidth: 70, flexShrink: 0 }}>{label}</span>
        <span style={{ fontSize: "0.75rem", color: "#fff", fontWeight: 600, wordBreak: "break-word" }}>{value}</span>
      </div>
    ) : null
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 1000, padding: "0", overflowY: "auto" }}>
      <style>{`
        .detail-modal-body { display: flex; flex-direction: column; gap: 0; }
        @media (min-width: 700px) { .detail-modal-body { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; } .detail-modal-body > .detail-full { grid-column: 1 / -1; } }
        .detail-modal-container { width: 100%; max-width: 780px; background: #111; border: 1px solid rgba(255,255,255,0.15); border-radius: 0; overflow: hidden; max-height: 100vh; overflow-y: auto; margin: 0; }
        @media (min-width: 700px) { .detail-modal-container { margin: 2rem auto; max-height: 90vh; } }
        .detail-header-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
      `}</style>
      <div className="detail-modal-container">
        
        {/* Header */}
        <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 900, margin: 0 }}>Rezervasyon Detayı</h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.65rem", margin: "3px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>ID: {r.id.slice(0, 12)}...</p>
          </div>
          <div className="detail-header-actions">
            {!isEditMode && (
<>
              <select
                value={r.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                style={{
                  padding: "4px 10px", borderRadius: 0, fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase",
                  background: sc.bg, color: sc.c, border: sc.b, outline: "none", cursor: "pointer",
                  WebkitAppearance: "none", appearance: "none"
                }}
              >
                <option value="PENDING" style={{ color: "#000" }}>Bekleyen</option>
                <option value="CONFIRMED" style={{ color: "#000" }}>Onaylı</option>
                <option value="COMPLETED" style={{ color: "#000" }}>Tamamlandı</option>
                <option value="CANCELLED" style={{ color: "#000" }}>İptal</option>
              </select>
              <button onClick={() => setIsEditMode(true)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "6px 10px", borderRadius: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.6rem", fontWeight: 700 }}>
                <Edit2 size={11} /> Düzenle
              </button>
              {onDelete && (
                <button onClick={() => onDelete(r.id, r.brideName)} style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", padding: "6px 10px", borderRadius: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.6rem", fontWeight: 700 }}>
                  <Trash2 size={11} /> Sil
                </button>
              )}
</>
            )}
            {isEditMode && (
               <button disabled={isLoading} onClick={handleSaveEdit} style={{ background: "#4ade80", border: "1px solid #22c55e", color: "#000", padding: "6px 12px", borderRadius: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.65rem", fontWeight: 800 }}>
                 {isLoading ? "Kaydediliyor..." : "Kaydet"}
               </button>
            )}
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", padding: "6px", borderRadius: 0, cursor: "pointer", display: "flex" }}>
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="detail-modal-body" style={{ padding: "12px 16px 16px" }}>
          
          {/* ── SOL KOLON: İletişim / Form ── */}
          <div style={{ paddingBottom: isEditMode ? 20 : 0 }}>
            {isEditMode ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "8px 0 2px" }}>Bilgileri Düzenle</div>
                
                <div>
                  <div style={{ fontSize: "0.55rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 4 }}>{isPhotographer ? "Gelin Adı" : `${terms?.client || "Müşteri"} Adı`}</div>
                  <input style={inp} value={formData.brideName} onChange={(e) => setFormData({...formData, brideName: e.target.value})} />
                </div>
                {isPhotographer && (
                  <div>
                    <div style={{ fontSize: "0.55rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 4 }}>Damat Adı</div>
                    <input style={inp} value={formData.groomName} onChange={(e) => setFormData({...formData, groomName: e.target.value})} />
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <div>
                    <div style={{ fontSize: "0.55rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 4 }}>Telefon 1</div>
                    <input style={inp} value={formData.bridePhone} onChange={(e) => setFormData({...formData, bridePhone: e.target.value})} />
                  </div>
                  {isPhotographer && (
                    <div>
                      <div style={{ fontSize: "0.55rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 4 }}>Telefon 2</div>
                      <input style={inp} value={formData.groomPhone} onChange={(e) => setFormData({...formData, groomPhone: e.target.value})} />
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: "0.55rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 4 }}>E-posta</div>
                  <input style={inp} value={formData.brideEmail} onChange={(e) => setFormData({...formData, brideEmail: e.target.value})} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 4 }}>
                  <div>
                    <div style={{ fontSize: "0.55rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 4 }}>Tarih</div>
                    <input type="date" style={{...inp, colorScheme: "dark"}} value={formData.eventDate} onChange={(e) => setFormData({...formData, eventDate: e.target.value})} />
                  </div>
                  <div>
                    <div style={{ fontSize: "0.55rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 4 }}>Saat</div>
                    <input type="time" style={{...inp, colorScheme: "dark"}} value={formData.eventTime} onChange={(e) => setFormData({...formData, eventTime: e.target.value})} />
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.55rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 4 }}>Mekan Adı / Konum</div>
                  <input style={inp} value={formData.venueName} onChange={(e) => setFormData({...formData, venueName: e.target.value})} />
                </div>

                <div>
                  <div style={{ fontSize: "0.55rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 4 }}>Online Görüşme Linki</div>
                  <input style={inp} placeholder="https://..." value={formData.meetingLink || ""} onChange={(e) => setFormData({...formData, meetingLink: e.target.value})} />
                </div>

                <div>
                  <div style={{ fontSize: "0.55rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 4 }}>Notlar</div>
                  <textarea style={{...inp, minHeight: 60, resize: "vertical"}} value={formData.notes || ""} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
                </div>

                <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                   <button onClick={() => setIsEditMode(false)} style={{ flex: 1, padding: "8px", background: "rgba(255,255,255,0.05)", border: "none", color: "#fff", cursor: "pointer", fontWeight: 600 }}>İptal</button>
                   <button disabled={isLoading} onClick={handleSaveEdit} style={{ flex: 2, padding: "8px", background: "#fff", color: "#000", border: "none", cursor: "pointer", fontWeight: 800 }}>{isLoading ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}</button>
                </div>
              </div>
            ) : (
              // ── GÖRÜNTÜLEME MODU ──
              <>
                {/* İletişim */}
                <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "8px 0 2px" }}>İletişim</div>
                <DetailRow icon={User} label={isPhotographer ? "Gelin" : (terms?.client || "Müşteri")} value={r.brideName} color="#4ade80" />
                <DetailRow icon={Phone} label={isPhotographer ? "Gelin Telefon" : "Telefon"} value={r.bridePhone} color="#4ade80" />
                <DetailRow icon={Mail} label={isPhotographer ? "Gelin E-posta" : "E-posta"} value={r.brideEmail} color="#4ade80" />
                {isPhotographer && <DetailRow icon={User} label="Damat" value={r.groomName} color="rgba(255,255,255,0.5)" />}
                {isPhotographer && <DetailRow icon={Phone} label="Damat Telefon" value={r.groomPhone} color="rgba(255,255,255,0.5)" />}

                {/* Etkinlik / Randevu */}
                <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "12px 0 2px" }}>{isPhotographer ? "Etkinlik" : (terms?.appointment || "Randevu")}</div>
                <DetailRow icon={Calendar} label="Tarih" value={r.eventDate ? new Date(r.eventDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }) : "-"} />
                <DetailRow icon={Clock} label="Saat" value={r.eventTime} />
                <DetailRow icon={CreditCard} label="Toplam Tutar" value={r.totalAmount ? `${r.totalAmount} TL` : null} />
                <DetailRow icon={CreditCard} label="Ödenen Tutar" value={r.paidAmount && r.paidAmount !== "0" ? `${r.paidAmount} TL` : null} />
                {r.venueName && <DetailRow icon={ExternalLink} label="Mekan / Konum" value={r.venueName} />}
                {r.meetingLink && (
                   <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                     <ExternalLink size={12} style={{ color: "rgba(255,255,255,0.35)", flexShrink: 0 }} />
                     <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", minWidth: 70, flexShrink: 0 }}>Online Görüşme</span>
                     <a href={r.meetingLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.75rem", color: "#60a5fa", fontWeight: 600, wordBreak: "break-word", textDecoration: "none" }}>Bağlantıya Git ↗</a>
                   </div>
                )}
                {isPhotographer && (
                <div style={{ display: "flex", alignItems: "center", padding: "8px 0", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <FileText size={13} style={{ color: r.contractApproved ? "#fff" : "rgba(255,255,255,0.5)", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", minWidth: 110 }}>Sözleşme</span>
                  {r.contractApproved ? (
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#fff" }}>✅ Onaylandı</span>
                  ) : (
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>⚠️ Henüz Onaylanmadı</span>
                  )}
                </div>
                )}
                <DetailRow icon={FileText} label="Notlar" value={r.notes} />
              </>
            )}
          </div>

          {/* ── SAĞ KOLON: Paketler + Ödeme + İş Akışı ── */}
          <div style={{ paddingLeft: "10px" }}>
             {/* ── Paketler ── */}
             <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "8px 0 4px" }}>Paketler ({r.packages?.length || 0})</div>
             {r.packages && r.packages.length > 0 ? (
               <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                 {r.packages.map((pkg, pkgIdx) => {
                     const pkgFields = (r.customFieldAnswers || []).filter(a => a.packageName === pkg.name && a.type !== "_hidden");
                     const pkgAddons = (r.selectedAddons || []).filter(a => a.packageName === pkg.name);
                     return (
                     <div key={pkg.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 0, padding: "14px 16px" }}>
                       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                         <div>
                           <div style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: 2 }}>{pkgIdx + 1}. {pkg.name}</div>
                           <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>{pkg.description}</div>
                         </div>
                         <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#fff", flexShrink: 0, marginLeft: 12 }}>{pkg.price}₺</div>
                       </div>
                       
                       {pkgFields.length > 0 && (
                         <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                           {pkgFields.map((answer, i) => (
                             <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                               <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>{answer.label}</span>
                               <span style={{ fontSize: "0.78rem", color: "#fff", fontWeight: 700 }}>
                                 {answer.type === "checkbox" ? (answer.value ? "✅ Evet" : "❌ Hayır") : (answer.value || "—")}
                               </span>
                             </div>
                           ))}
                         </div>
                       )}
                       {pkgAddons.length > 0 && (
                         <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                           <div style={{ fontSize: "0.55rem", fontWeight: 800, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 4 }}>Ek Hizmetler</div>
                           {pkgAddons.map((addon, i) => (
                             <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                               <span style={{ fontSize: "0.72rem", color: "#fff", fontWeight: 600 }}>+ {addon.title}</span>
                               <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>{addon.price}₺</span>
                             </div>
                           ))}
                         </div>
                       )}
                     </div>
                   );
                 })}
               </div>
             ) : (
               <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>Paket seçilmemiş</p>
             )}

             {/* ── Ödeme Takibi ── */}
             {(() => {
                const totalAmount = parseFloat(r.totalAmount?.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '') || '0');
                const payments = r.payments || [];
                const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
                const remaining = Math.max(0, totalAmount - totalPaid);
                const isPaid = totalPaid >= totalAmount && totalAmount > 0;
                const methodLabels = { CASH: "Nakit", BANK_TRANSFER: "Havale/EFT", CREDIT_CARD: "Kredi Kartı", ONLINE: "Online" };
                const methodColors = { CASH: "#fff", BANK_TRANSFER: "rgba(255,255,255,0.5)", CREDIT_CARD: "#f59e0b", ONLINE: "rgba(255,255,255,0.6)" };

                return (
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", marginTop: "20px" }}>
                    <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>ÖZET ({isPaid ? "Tahsil Edildi" : "Açık"})</div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 2 }}>
                          <span style={{ fontSize: "1.2rem", fontWeight: 900, color: remaining > 0 ? "#fff" : "#4ade80" }}>{remaining > 0 ? remaining : 0} ₺ <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>kaldı</span></span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)" }}>Toplam: {totalAmount > 0 ? totalAmount : "Belirtilmedi"}</div>
                        <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)" }}>Ödenen: {totalPaid}</div>
                      </div>
                    </div>

                    <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Ödemeler ({payments.length})</div>
                      {payments.length === 0 && <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)" }}>Henüz ödeme yok.</div>}
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {payments.map(p => (
                          <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", background: "rgba(255,255,255,0.03)", borderRadius: 0 }}>
                            <div>
                              <div style={{ fontSize: "0.75rem", fontWeight: 700 }}>{p.amount} ₺</div>
                              <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)" }}>{new Date(p.createdAt).toLocaleDateString('tr-TR')} · {p.note || "-"}</div>
                            </div>
                            <span style={{ fontSize: "0.6rem", fontWeight: 800, padding: "2px 6px", background: "rgba(255,255,255,0.08)", color: methodColors[p.paymentMethod] }}>{methodLabels[p.paymentMethod]}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <form onSubmit={handleAddPayment} style={{ padding: "12px 14px", background: "rgba(0,0,0,0.2)" }}>
                      <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>+ Yeni Ödeme Ekle</div>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "6px" }}>
                        <input required type="number" placeholder="Tutar ₺" style={{...inp, flex: 1, padding: "6px", fontSize: "0.75rem", minWidth: 80}} value={paymentForm.amount} onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})} />
                        <select style={{...inp, flex: 1, padding: "6px", fontSize: "0.75rem", minWidth: 80}} value={paymentForm.method} onChange={(e) => setPaymentForm({...paymentForm, method: e.target.value})}>
                          <option value="CASH">Nakit</option>
                          <option value="BANK_TRANSFER">Havale/EFT</option>
                          {paymentMode !== "cash" && <option value="CREDIT_CARD">Kart</option>}
                        </select>
                      </div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <input placeholder="Not (Opsiyonel)" style={{...inp, flex: 1, padding: "6px", fontSize: "0.75rem"}} value={paymentForm.note} onChange={(e) => setPaymentForm({...paymentForm, note: e.target.value})} />
                        <button disabled={paymentLoading} type="submit" style={{ padding: "0 14px", border: "none", background: "rgba(255,255,255,0.9)", color: "#000", fontWeight: 800, cursor: "pointer", fontSize: "0.75rem" }}>
                          {paymentLoading ? "..." : "Ekle"}
                        </button>
                      </div>
                    </form>
                  </div>
                );
             })()}

             {/* İş Akışı Güncelleme & Teslimat Bilgisi */}
             <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14, marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
               <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
                 <div style={{ flex: 1, minWidth: 120 }}>
                   <label style={{ fontSize: "0.55rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", display: "block", marginBottom: 3 }}>Aşama Değiştir</label>
                   <select
                     value={r.workflowStatus || "PENDING"}
                     onChange={async (e) => {
                       const newWfStatus = e.target.value;
                       await updateReservationWorkflow(r.id, { workflowStatus: newWfStatus, deliveryLink: r.deliveryLink });
                       setData(prev => ({ ...prev, workflowStatus: newWfStatus }));
                       if(onUpdate) onUpdate();
                     }}
                     style={{ ...inp, fontSize: "0.72rem", padding: "6px" }}
                   >
                     <option value="PENDING" style={{color:"#000"}}>Çekim Bekleniyor</option>
                     <option value="EDITING" style={{color:"#000"}}>Düzenleniyor (İşleniyor)</option>
                     <option value="SELECTION_PENDING" style={{color:"#000"}}>Müşteri Seçimi Bekleniyor</option>
                     <option value="PREPARING" style={{color:"#000"}}>Proje Hazırlanıyor</option>
                     <option value="COMPLETED" style={{color:"#000"}}>İşlem Tamamlandı</option>
                   </select>
                 </div>
                 <div style={{ flex: 2, minWidth: 200, display: "flex", gap: "6px" }}>
                   <div style={{ flex: 1 }}>
                     <label style={{ fontSize: "0.55rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", display: "block", marginBottom: 3 }}>Teslimat Linki (Drive, vs.)</label>
                     <input 
                       type="url" 
                       placeholder="https://" 
                       defaultValue={r.deliveryLink || ""} 
                       onBlur={async (e) => {
                         const newLink = e.target.value;
                         if (newLink !== (r.deliveryLink || "")) {
                           await updateReservationWorkflow(r.id, { workflowStatus: r.workflowStatus, deliveryLink: newLink });
                           setData(prev => ({ ...prev, deliveryLink: newLink }));
                           if(onUpdate) onUpdate();
                         }
                       }}
                       style={{ ...inp, fontSize: "0.72rem", padding: "6px" }} 
                     />
                   </div>
                   {r.deliveryLink && (
                     <a href={r.deliveryLink} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 0, padding: "0 10px", color: "rgba(255,255,255,0.7)", textDecoration: "none", alignSelf: "flex-end", height: "30px", marginBottom: "1px" }} title="Linki Aç">
                       <ExternalLink size={12} />
                     </a>
                   )}
                 </div>
               </div>
               
               {r.deliveryDate && (
                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                   <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)" }}>Teslim Tarihi</span>
                   <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#fff" }}>{new Date(r.deliveryDate).toLocaleDateString('tr-TR')}</span>
                 </div>
               )}
             </div>
             
             {/* Hatırlatmalar */}
             <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "12px 0 4px", marginTop: 10 }}>Hatırlatma & İşlemler</div>
             <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {isPhotographer && !r.contractApproved && (
                  <button
                    disabled={reminderLoading === "contract"}
                    onClick={async () => {
                      setReminderLoading("contract");
                      setReminderResult(null);
                      const res = await sendContractReminder(r.id);
                      setReminderResult(res.success ? { type: "success", msg: "Hatırlatma gönderildi" } : { type: "error", msg: res.error });
                      setReminderLoading("");
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "0.72rem", fontWeight: 700, cursor: reminderLoading === "contract" ? "not-allowed" : "pointer", textAlign: "left",
                    }}
                  >
                    <Mail size={12} style={{ flexShrink: 0 }} />
                    <div style={{flex: 1}}>Sözleşme Onayı Hatırlat</div>
                  </button>
                )}
                {isPhotographer && (
                  <button
                    disabled={reminderLoading === "credentials"}
                    onClick={async () => {
                      if (!confirm("Müşteriye yeni şifre oluşturulup gönderilecek. Devam edilsin mi?")) return;
                      setReminderLoading("credentials");
                      setReminderResult(null);
                      const res = await resendCredentials(r.id);
                      setReminderResult(res.success ? { type: "success", msg: "Şifre gönderildi" } : { type: "error", msg: res.error });
                      setReminderLoading("");
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "0.72rem", fontWeight: 700, cursor: reminderLoading === "credentials" ? "not-allowed" : "pointer", textAlign: "left",
                    }}
                  >
                    <Mail size={12} style={{ flexShrink: 0 }} />
                    <div style={{flex: 1}}>Giriş Bilgilerini Tekrar Gönder</div>
                  </button>
                )}
             </div>

          </div>{/* SAĞ KOLON SONU */}

          {/* ── FULL WIDTH: Meta ── */}
          <div className="detail-full" style={{ paddingTop: 10, marginTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", fontSize: "0.6rem", color: "rgba(255,255,255,0.25)" }}>
             <span>Oluşturulma: {new Date(r.createdAt).toLocaleDateString('tr-TR')}</span>
             <span>Güncelleme: {new Date(r.updatedAt).toLocaleDateString('tr-TR')}</span>
          </div>

        </div>
      </div>
    </div>
  );
}
