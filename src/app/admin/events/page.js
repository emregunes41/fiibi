"use client";

import { useState, useEffect } from "react";
import { Plus, Users, Calendar, Clock, MapPin, Video, Trash2, Edit2, Download, CheckCircle, Ticket, Banknote, Users2, X, ImagePlus } from "lucide-react";
import { getEvents, createEvent, updateEvent, deleteEvent, removeRegistration } from "./actions";

export default function EventsAdminPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formOpen, setFormOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "", description: "", date: "", durationMinutes: 60, price: "0", maxParticipants: 10, location: "", meetingLink: "", imageUrl: "", isActive: true
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => { loadEvents(); }, []);

  const loadEvents = async () => {
    setLoading(true);
    const data = await getEvents();
    setEvents(data || []);
    setLoading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editingId) {
      await updateEvent(editingId, formData);
    } else {
      await createEvent(formData);
    }
    setFormOpen(false);
    setEditingId(null);
    loadEvents();
  };

  const handleDelete = async (id) => {
    if (confirm("Bu etkinliği silmek istediğinize emin misiniz?")) {
      await deleteEvent(id);
      loadEvents();
    }
  };

  const handleRemoveRegistration = async (regId) => {
    if (confirm("Bu katılımcıyı etkinlikten çıkarmak istediğinize emin misiniz?")) {
      await removeRegistration(regId);
      // Refresh events and update selected event
      const freshEvents = await getEvents();
      setEvents(freshEvents || []);
      if (selectedEvent) {
        const updated = freshEvents.find(e => e.id === selectedEvent.id);
        if (updated) setSelectedEvent(updated);
      }
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert("Dosya çok büyük (Maks 10MB)"); return; }
    setUploadingImage(true);
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', uploadPreset);
      fd.append('folder', 'events');
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd });
      const result = await res.json();
      if (result.secure_url) {
        setFormData(prev => ({ ...prev, imageUrl: result.secure_url }));
      } else {
        alert("Yükleme hatası: " + (result.error?.message || "Bilinmeyen hata"));
      }
    } catch (err) {
      alert("Yükleme hatası: " + err.message);
    }
    setUploadingImage(false);
  };

  const openForm = (event = null) => {
    if (event) {
      setEditingId(event.id);
      const d = new Date(event.date);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      const localDateIso = d.toISOString().slice(0, 16);
      setFormData({
        title: event.title, description: event.description || "", date: localDateIso,
        durationMinutes: event.durationMinutes, price: event.price, maxParticipants: event.maxParticipants,
        location: event.location || "", meetingLink: event.meetingLink || "", imageUrl: event.imageUrl || "", isActive: event.isActive,
      });
    } else {
      setEditingId(null);
      setFormData({ title: "", description: "", date: "", durationMinutes: 60, price: "0", maxParticipants: 10, location: "", meetingLink: "", imageUrl: "", isActive: true });
    }
    setFormOpen(true);
  };

  if (loading) {
    return <div className="p-8 text-center" style={{ color: "var(--text, #fff)" }}>Yükleniyor...</div>;
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px 0" }}>Grup Dersleri & Etkinlikler</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", margin: 0, fontSize: 14 }}>Online veya yüz yüze toplu etkinlikler ekleyin, kayıt alın.</p>
        </div>
        <button onClick={() => openForm()} style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", color: "#000", border: "none", padding: "12px 20px", borderRadius: 0, fontWeight: 700, cursor: "pointer" }}>
          <Plus size={18} /> Yeni Etkinlik
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
        {events.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 0, gridColumn: "1 / -1" }}>
            <Ticket size={40} style={{ color: "rgba(255,255,255,0.2)", margin: "0 auto 16px" }} />
            <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>Sisteminizde hiç etkinlik bulunmuyor.</p>
            <button onClick={() => openForm()} style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 0, fontWeight: 600, cursor: "pointer" }}>
              İlk Etkinliğini Oluştur
            </button>
          </div>
        ) : (
          events.map(ev => {
            const registrationsCount = ev.registrations?.length || 0;
            const utilization = Math.round((registrationsCount / ev.maxParticipants) * 100);
            
            return (
              <div key={ev.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 0, overflow: "hidden", position: "relative" }}>
                {!ev.isActive && <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,0,0,0.2)", color: "#ff4d4d", fontSize: 10, fontWeight: 800, padding: "4px 8px", borderRadius: 0, zIndex: 2 }}>PASİF</div>}
                
                {/* Cover Image */}
                {ev.imageUrl && (
                  <div style={{ width: "100%", height: 160, overflow: "hidden" }}>
                    <img src={ev.imageUrl} alt={ev.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}

                <div style={{ padding: 20, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", marginBottom: 8, display: "flex", gap: 12 }} suppressHydrationWarning>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }} suppressHydrationWarning><Calendar size={12} /> {new Date(ev.date).toLocaleDateString("tr-TR")}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }} suppressHydrationWarning><Clock size={12} /> {new Date(ev.date).toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 8px 0" }}>{ev.title}</h3>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: 0 }}><Banknote size={12} /> {ev.price === "0" ? "Ücretsiz" : `${ev.price}₺`}</span>
                    {ev.location && <span style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: 0 }}><MapPin size={12} /> {ev.location}</span>}
                    {ev.meetingLink && <span style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: 0 }}><Video size={12} /> Online</span>}
                  </div>
                </div>
                
                <div style={{ padding: 20, background: "rgba(0,0,0,0.15)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, marginBottom: 4 }}>Kontenjan Durumu</div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}><span style={{ color: "#fff" }}>{registrationsCount}</span> <span style={{ color: "rgba(255,255,255,0.3)" }}>/ {ev.maxParticipants} Kişi</span></div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: utilization >= 100 ? "#ff4d4d" : "rgba(255,255,255,0.5)" }}>%{utilization}</div>
                  </div>
                  <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 0, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, utilization)}%`, background: utilization >= 100 ? "#ff4d4d" : "#4ade80", borderRadius: 0 }}></div>
                  </div>
                </div>

                <div style={{ display: "flex", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <button onClick={() => { setSelectedEvent(ev); setParticipantsOpen(true); }} style={{ flex: 1, padding: 16, background: "none", border: "none", borderRight: "1px solid rgba(255,255,255,0.04)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Users2 size={16} /> Katılımcılar
                  </button>
                  <button onClick={() => openForm(ev)} style={{ padding: 16, background: "none", border: "none", borderRight: "1px solid rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(ev.id)} style={{ padding: 16, background: "none", border: "none", color: "#ff4d4d", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE/EDIT MODAL */}
      {formOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", justifyContent: "center", alignItems: "center", padding: 20 }}>
          <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 0, width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ padding: "24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{editingId ? "Etkinliği Düzenle" : "Yeni Etkinlik Aç"}</h2>
              <button onClick={() => setFormOpen(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
              
              {/* Image Upload */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>Kapak Fotoğrafı</label>
                {formData.imageUrl ? (
                  <div style={{ position: "relative" }}>
                    <img src={formData.imageUrl} alt="Kapak" style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 0, border: "1px solid rgba(255,255,255,0.1)" }} />
                    <button type="button" onClick={() => setFormData({...formData, imageUrl: ""})} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.8)", border: "none", color: "#ff4d4d", cursor: "pointer", padding: 6, borderRadius: 0 }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: 0, cursor: "pointer", gap: 8 }}>
                    <ImagePlus size={28} style={{ color: "rgba(255,255,255,0.3)" }} />
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{uploadingImage ? "Yükleniyor..." : "Fotoğraf Yükle"}</span>
                    <input type="file" accept="image/*" hidden onChange={e => handleImageUpload(e.target.files[0])} />
                  </label>
                )}
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>Etkinlik Başlığı</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px 16px", borderRadius: 0, fontSize: 14 }} placeholder="Örn: Cumartesi Sabahı Canlı Pilates Grubu" />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>Kısa Açıklama</label>
                <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px 16px", borderRadius: 0, fontSize: 14, minHeight: 80 }} placeholder="Katılımcılara etkinliğin ne hakkında olduğunu anlatın..." />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>Tarih ve Saat</label>
                  <input required type="datetime-local" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px 16px", borderRadius: 0, fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>Süre (Dakika)</label>
                  <input required type="number" min="15" value={formData.durationMinutes} onChange={e => setFormData({...formData, durationMinutes: e.target.value})} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px 16px", borderRadius: 0, fontSize: 14 }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>Kişi Başı Ücret (₺)</label>
                  <input required type="number" min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px 16px", borderRadius: 0, fontSize: 14 }} placeholder="Ücretsiz ise 0 yazın" />
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>Ücretsiz yapmak için 0 yazın.</p>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>Maksimum Kontenjan</label>
                  <input required type="number" min="1" value={formData.maxParticipants} onChange={e => setFormData({...formData, maxParticipants: e.target.value})} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px 16px", borderRadius: 0, fontSize: 14 }} />
                </div>
              </div>

              <div style={{ padding: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 0 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 12px 0" }}>Lokasyon & Bağlantı (İsteğe Bağlı)</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px 16px", borderRadius: 0, fontSize: 14 }} placeholder="Fiziksel Adres / Salon İsmi" />
                  <input type="url" value={formData.meetingLink} onChange={e => setFormData({...formData, meetingLink: e.target.value})} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px 16px", borderRadius: 0, fontSize: 14 }} placeholder="Zoom / Meet Görüşme Linki (varsa)" />
                </div>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", background: "rgba(255,255,255,0.02)", padding: '12px 16px', borderRadius: 0, border: "1px solid rgba(255,255,255,0.05)" }}>
                <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} style={{ width: 18, height: 18, accentColor: "#fff" }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Etkinliği Satışa/Kayıda Aç</span>
              </label>

              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setFormOpen(false)} style={{ flex: 1, padding: "14px", background: "rgba(255,255,255,0.05)", border: "none", color: "#fff", fontWeight: 700, borderRadius: 0, cursor: "pointer" }}>İptal</button>
                <button type="submit" style={{ flex: 1, padding: "14px", background: "#fff", border: "none", color: "#000", fontWeight: 700, borderRadius: 0, cursor: "pointer" }}>Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PARTICIPANTS MODAL */}
      {participantsOpen && selectedEvent && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", justifyContent: "center", alignItems: "center", padding: 20 }}>
          <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 0, width: "100%", maxWidth: 800, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: "0 0 4px 0", fontSize: 20, fontWeight: 800 }}>{selectedEvent.title}</h2>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Katılımcı Listesi ({selectedEvent.registrations?.length || 0} / {selectedEvent.maxParticipants})</p>
              </div>
              <button onClick={() => setParticipantsOpen(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><X size={24} /></button>
            </div>
            
            <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
              {selectedEvent.registrations?.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.5)", textAlign: "center", padding: 40 }}>Henüz kayıtlı katılımcı yok.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "rgba(255,255,255,0.05)" }}>
                        <th style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>İsim Soyisim</th>
                        <th style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Telefon</th>
                        <th style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>E-Posta</th>
                        <th style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Sosyal Medya</th>
                        <th style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Kayıt Tarihi</th>
                        <th style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Ödeme</th>
                        <th style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontWeight: 600, width: 50 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEvent.registrations.map(reg => (
                        <tr key={reg.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <td style={{ padding: 12, fontWeight: 700 }}>{reg.name}</td>
                          <td style={{ padding: 12, color: "rgba(255,255,255,0.7)" }}>{reg.phone}</td>
                          <td style={{ padding: 12, color: "rgba(255,255,255,0.7)" }}>{reg.email}</td>
                          <td style={{ padding: 12, color: "rgba(255,255,255,0.7)" }}>{reg.socialMedia || "—"}</td>
                          <td style={{ padding: 12, color: "rgba(255,255,255,0.5)" }} suppressHydrationWarning>{new Date(reg.createdAt).toLocaleDateString("tr-TR")}</td>
                          <td style={{ padding: 12 }}>
                            {reg.paymentStatus === "PAID" || selectedEvent.price === "0" ? (
                              <span style={{ fontSize: 10, fontWeight: 800, background: "rgba(74, 222, 128, 0.15)", color: "#4ade80", padding: "4px 8px", borderRadius: 0 }}>ÖDENDİ</span>
                            ) : (
                               <span style={{ fontSize: 10, fontWeight: 800, background: "rgba(255, 255, 255, 0.1)", color: "rgba(255,255,255,0.7)", padding: "4px 8px", borderRadius: 0 }}>NAKİT / BEKLİYOR</span>
                            )}
                          </td>
                          <td style={{ padding: 12 }}>
                            <button onClick={() => handleRemoveRegistration(reg.id)} title="Katılımcıyı Çıkar" style={{ background: "none", border: "none", color: "#ff4d4d", cursor: "pointer", padding: 4 }}>
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
