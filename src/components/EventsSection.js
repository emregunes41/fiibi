"use client";

import { useState } from "react";
import { Calendar, Clock, MapPin, Video, Ticket, X, CheckCircle } from "lucide-react";
import { registerForEvent } from "@/app/actions/event-registration";

export default function EventsSection({ events }) {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", socialMedia: "" });
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (!events || events.length === 0) return null;

  const handleRegister = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    const res = await registerForEvent(selectedEvent.id, formData);
    if (res.success) {
      setStatus("success");
    } else {
      setStatus("error");
      setErrorMsg(res.error || "Kayıt olurken bir hata oluştu.");
    }
  };

  const closeDialog = () => {
    setSelectedEvent(null);
    setFormData({ name: "", phone: "", email: "", socialMedia: "" });
    setStatus("idle");
  };

  return (
    <div className="w-full">
      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h2 style={{ fontSize: "clamp(1.5rem, 4vw, 2.2rem)", fontWeight: 800, letterSpacing: "-0.04em", margin: "0 0 8px 0" }}>
            Yaklaşan Etkinlikler
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem", margin: 0 }}>Grup dersleri, seminerler ve kamplar</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
        {events.map((ev) => {
          const registered = ev.registrations?.length || 0;
          const remaining = ev.maxParticipants - registered;
          
          return (
            <div key={ev.id} style={{ 
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", 
              borderRadius: 0, overflow: "hidden", transition: "transform 0.3s, border-color 0.3s",
              display: "flex", flexDirection: "column" 
            }}>
              {/* Cover Image */}
              {ev.imageUrl && (
                <div style={{ width: "100%", height: 180, overflow: "hidden" }}>
                  <img src={ev.imageUrl} alt={ev.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}

              <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div suppressHydrationWarning style={{ background: "rgba(255,255,255,0.05)", padding: "8px 12px", borderRadius: 0 }}>
                    <div suppressHydrationWarning style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>{new Date(ev.date).toLocaleString('tr-TR', { month: 'short' })}</div>
                    <div suppressHydrationWarning style={{ fontSize: 20, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{new Date(ev.date).getDate()}</div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", background: "rgba(255,255,255,0.1)", padding: "4px 10px", borderRadius: 0 }}>
                    {ev.price === "0" ? "Ücretsiz" : `${ev.price}₺`}
                  </div>
                </div>

                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, lineHeight: 1.3 }}>{ev.title}</h3>
                {ev.description && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 16, lineHeight: 1.5, flex: 1 }}>{ev.description}</p>}

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: "auto" }}>
                  <div suppressHydrationWarning style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                    <Clock size={14} style={{ color: "rgba(255,255,255,0.4)" }} /> <span suppressHydrationWarning>{new Date(ev.date).toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })}</span> ({ev.durationMinutes}Dk)
                  </div>
                  {ev.location && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                      <MapPin size={14} style={{ color: "rgba(255,255,255,0.4)" }} /> {ev.location}
                    </div>
                  )}
                  {ev.meetingLink && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                      <Video size={14} style={{ color: "rgba(255,255,255,0.4)" }} /> Online Etkinlik
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ padding: "16px 24px", background: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>Kontenjan Durumu</span>
                  {remaining > 0 ? (
                     <span style={{ fontSize: 11, fontWeight: 800, color: remaining <= 3 ? "#ef4444" : "#4ade80" }}>Son {remaining} Kişi</span>
                  ) : (
                     <span style={{ fontSize: 11, fontWeight: 800, color: "#ef4444" }}>Doldu</span>
                  )}
                </div>
                
                <button 
                  disabled={remaining <= 0}
                  onClick={() => setSelectedEvent(ev)}
                  style={{ width: "100%", padding: 14, background: remaining > 0 ? "#fff" : "rgba(255,255,255,0.05)", color: remaining > 0 ? "#000" : "rgba(255,255,255,0.3)", border: "none", borderRadius: 0, fontWeight: 800, fontSize: 13, cursor: remaining > 0 ? "pointer" : "not-allowed", display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}
                >
                  <Ticket size={16} />
                  {remaining > 0 ? "Kayıt Ol" : "Kontenjan Doldu"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Registration Modal */}
      {selectedEvent && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(5px)" }}>
          <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 0, width: "100%", maxWidth: 450, overflow: "hidden", position: "relative", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}>
            
            {status === "success" ? (
              <div style={{ padding: 40, textAlign: "center" }}>
                <CheckCircle size={48} style={{ color: "#4ade80", margin: "0 auto 16px" }} />
                <h3 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Kaydınız Alındı!</h3>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginBottom: 24 }}>
                  {selectedEvent.price === "0" ? "Etkinlik detayları e-posta adresinize gönderildi." : "Kayıt bilgileriniz alındı. Ödeme detayları için sizinle iletişime geçilecektir."}
                </p>
                <button onClick={closeDialog} style={{ width: "100%", padding: 14, background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: 0, fontWeight: 700, cursor: "pointer" }}>Kapat</button>
              </div>
            ) : (
              <>
                {/* Modal cover image */}
                {selectedEvent.imageUrl && (
                  <div style={{ width: "100%", height: 140, overflow: "hidden" }}>
                    <img src={selectedEvent.imageUrl} alt={selectedEvent.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}
                <div style={{ padding: "24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{selectedEvent.title}</h3>
                    <p suppressHydrationWarning style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0 }}>
                      {new Date(selectedEvent.date).toLocaleDateString("tr-TR", { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button onClick={closeDialog} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}><X size={20} /></button>
                </div>
                
                <form onSubmit={handleRegister} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                  {errorMsg && <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "12px 16px", borderRadius: 0, fontSize: 12, fontWeight: 600 }}>{errorMsg}</div>}
                  
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", marginBottom: 6 }}>Ad Soyad</label>
                    <input required autoFocus type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "14px 16px", borderRadius: 0, fontSize: 14 }} placeholder="Örn: Ayşe Yılmaz" />
                  </div>
                  
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", marginBottom: 6 }}>Telefon Numarası</label>
                    <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "14px 16px", borderRadius: 0, fontSize: 14 }} placeholder="Örn: 05xx xxx xx xx" />
                  </div>
                  
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", marginBottom: 6 }}>E-Posta</label>
                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "14px 16px", borderRadius: 0, fontSize: 14 }} placeholder="Örn: ayse@domain.com" />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", marginBottom: 6 }}>Sosyal Medya (Instagram / TikTok)</label>
                    <input type="text" value={formData.socialMedia} onChange={e => setFormData({...formData, socialMedia: e.target.value})} style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "14px 16px", borderRadius: 0, fontSize: 14 }} placeholder="Örn: @kullaniciadi" />
                  </div>

                  <div style={{ marginTop: 8, padding: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>Ödenecek Tutar</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>{selectedEvent.price === "0" ? "Ücretsiz" : `${selectedEvent.price}₺`}</span>
                  </div>
                  
                  <button type="submit" disabled={status === "loading"} style={{ marginTop: 8, padding: "16px", background: "#fff", color: "#000", border: "none", borderRadius: 0, fontWeight: 800, fontSize: 14, cursor: status === "loading" ? "not-allowed" : "pointer", opacity: status === "loading" ? 0.7 : 1 }}>
                    {status === "loading" ? "İşleniyor..." : selectedEvent.price === "0" ? "Kayıt Ol" : "Kaydı Tamamla (Nakit/Havale)"}
                  </button>
                </form>
              </>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
}
