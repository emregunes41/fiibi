"use client";

import { useState, useEffect } from "react";
import { Plus, Calendar, User, Phone, Mail, FileText, CheckCircle, Clock, Settings2, Image as ImageIcon } from "lucide-react";
import { getReservations, getPackages, createManualReservation, updateReservationStatus, updateReservationWorkflow } from "../core-actions";
import Link from "next/link";

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [packages, setPackages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    brideName: "", bridePhone: "", brideEmail: "",
    groomName: "", groomPhone: "", groomEmail: "",
    eventDate: "", eventTime: "10:00", packageIds: [], notes: "",
    selectedAddons: [], totalAmount: ""
  });
  const [workflowModal, setWorkflowModal] = useState({ isOpen: false, data: null });
  const [workflowData, setWorkflowData] = useState({ workflowStatus: "PENDING", deliveryLink: "" });

  async function loadData() {
    const [resData, pkgData] = await Promise.all([getReservations(), getPackages()]);
    setReservations(resData);
    setPackages(pkgData);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await createManualReservation(formData);
    if (res.success) {
      setIsModalOpen(false);
      setFormData({ 
        brideName: "", bridePhone: "", brideEmail: "",
        groomName: "", groomPhone: "", groomEmail: "",
        eventDate: "", eventTime: "10:00", packageIds: [], notes: "",
        selectedAddons: [], totalAmount: "" 
      });
      loadData();
    } else {
      alert("Hata: " + res.error);
    }
    setIsLoading(false);
  };

  const handleStatusChange = async (id, status) => {
    await updateReservationStatus(id, status);
    loadData();
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case "CONFIRMED": return { background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" };
      case "PENDING": return { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid transparent" };
      default: return { background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.3)", border: "1px solid transparent" };
    }
  };

  const openWorkflowModal = (res) => {
    setWorkflowData({ 
      workflowStatus: res.workflowStatus || "PENDING", 
      deliveryLink: res.deliveryLink || "" 
    });
    setWorkflowModal({ isOpen: true, data: res });
  };

  const handleWorkflowSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await updateReservationWorkflow(workflowModal.data.id, workflowData);
    setWorkflowModal({ isOpen: false, data: null });
    loadData();
    setIsLoading(false);
  };

  return (
    <div style={{ color: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
        <div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 900, letterSpacing: "-0.04em", marginBottom: "0.5rem" }}>Rezervasyonlar</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1.1rem" }}>Gelen tüm randevuları ve manuel girişleri buradan yönetebilirsin.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ 
            background: "#fff", color: "#000", padding: "1rem 1.75rem", 
            borderRadius: "1.25rem", border: "none", fontWeight: 800, cursor: "pointer",
            display: "flex", alignItems: "center", gap: "0.6rem", transition: "transform 0.2s"
          }}
          className="hover:scale-105"
        >
          <Plus size={20} /> REZERVASYON GİR
        </button>
      </div>

      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "2rem", border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <tr>
              <th style={{ padding: "1.5rem 2rem", color: "rgba(255,255,255,0.4)", fontWeight: 800, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Müşteri</th>
              <th style={{ padding: "1.5rem 2rem", color: "rgba(255,255,255,0.4)", fontWeight: 800, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tarih / Paket</th>
              <th style={{ padding: "1.5rem 2rem", color: "rgba(255,255,255,0.4)", fontWeight: 800, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Durum</th>
              <th style={{ padding: "1.5rem 2rem", color: "rgba(255,255,255,0.4)", fontWeight: 800, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((res) => (
              <tr key={res.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", transition: "background 0.2s" }} className="hover:bg-white/5">
                <td style={{ padding: "1.5rem 2rem" }}>
                  <div style={{ fontWeight: 700, fontSize: "1rem" }}>{res.brideName} & {res.groomName}</div>
                  <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.35rem" }}>
                    <Phone size={14} color="rgba(255,255,255,0.3)" /> {res.bridePhone}
                  </div>
                </td>
                <td style={{ padding: "1.5rem 2rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700 }}>
                    <Calendar size={16} color="#fff" />
                    {new Date(res.eventDate).toLocaleDateString('tr-TR')} {res.eventTime && `| ${res.eventTime}`}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", marginTop: "0.35rem" }}>
                    {res.packages.map(p => p.name).join(", ")}
                    <div style={{ fontWeight: 900, color: "#fff", marginTop: "0.25rem" }}>
                      {res.totalAmount || "0"} TL 
                      {res.selectedAddons?.length > 0 && <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", marginLeft: "0.5rem" }}>(+{res.selectedAddons.length} Ekstra)</span>}
                    </div>
                  </div>
                </td>
                <td style={{ padding: "1.5rem 2rem" }}>
                  <span style={{ 
                    padding: "0.4rem 0.8rem", borderRadius: "2rem", fontSize: "0.7rem", fontWeight: 900,
                    textTransform: "uppercase", letterSpacing: "0.02em",
                    ...getStatusStyle(res.status)
                  }}>
                    {res.status === "CONFIRMED" ? "Onaylandı" : "Bekliyor"}
                  </span>
                </td>
                <td style={{ padding: "1.5rem 2rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <select 
                      value={res.status}
                      onChange={(e) => handleStatusChange(res.id, e.target.value)}
                      style={{ padding: "0.6rem 1rem", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "0.85rem", outline: "none" }}
                    >
                      <option value="PENDING">Bekleyen</option>
                      <option value="CONFIRMED">Onayla</option>
                      <option value="COMPLETED">Tamamlandı</option>
                      <option value="CANCELLED">İptal Et</option>
                    </select>
                    {res.status === "CONFIRMED" && (
                      <button 
                        onClick={() => openWorkflowModal(res)}
                        style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", padding: "0.6rem", borderRadius: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        title="İş Akışı ve Teslimat"
                      >
                        <Settings2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {reservations.length === 0 && (
              <tr>
                <td colSpan="4" style={{ padding: "4rem", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "0.9rem" }}>Henüz bir kayıt bulunmuyor.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Entry Modal */}
      {isModalOpen && (
        <div style={{ 
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(15px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "2rem"
        }}>
          <div style={{ 
            background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "3rem", 
            width: "100%", maxWidth: "700px", padding: "3rem", position: "relative",
            boxShadow: "0 50px 100px -20px rgba(0,0,0,0.5)"
          }}>
            <h2 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "2rem", letterSpacing: "-0.04em" }}>Yeni Rezervasyon Gir</h2>
            <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <input 
                placeholder="Gelin Adı Soyadı" required 
                style={{ gridColumn: "span 2", padding: "1.25rem", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", outline: "none" }}
                value={formData.brideName}
                onChange={(e) => setFormData({...formData, brideName: e.target.value})}
              />
              <input 
                placeholder="Damat Adı Soyadı" required 
                style={{ gridColumn: "span 2", padding: "1.25rem", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", outline: "none" }}
                value={formData.groomName}
                onChange={(e) => setFormData({...formData, groomName: e.target.value})}
              />
              <input 
                placeholder="Gelin Telefon" required 
                style={{ padding: "1.25rem", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", outline: "none" }}
                value={formData.bridePhone}
                onChange={(e) => setFormData({...formData, bridePhone: e.target.value})}
              />
              <input 
                placeholder="Gelin E-posta" type="email" required 
                style={{ padding: "1.25rem", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", outline: "none" }}
                value={formData.brideEmail}
                onChange={(e) => setFormData({...formData, brideEmail: e.target.value})}
              />
              <input 
                type="date" required 
                style={{ padding: "1.25rem", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", outline: "none" }}
                value={formData.eventDate}
                onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
              />
              <input 
                type="time" required 
                style={{ padding: "1.25rem", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", outline: "none" }}
                value={formData.eventTime}
                onChange={(e) => setFormData({...formData, eventTime: e.target.value})}
              />
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "0.75rem", display: "block", letterSpacing: "0.05em" }}>Paketler (Birden fazla seçebilirsin)</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", background: "rgba(255,255,255,0.02)", padding: "1.5rem", borderRadius: "1.5rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                  {packages.map(pkg => (
                    <div key={pkg.id}>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.9rem", cursor: "pointer", padding: "0.5rem", borderRadius: "0.5rem" }} className="hover:bg-white/5">
                        <input 
                          type="checkbox" 
                          checked={formData.packageIds.includes(pkg.id)}
                          onChange={(e) => {
                            const ids = e.target.checked 
                              ? [...formData.packageIds, pkg.id]
                              : formData.packageIds.filter(id => id !== pkg.id);
                            
                            let newAddons = [...formData.selectedAddons];
                            if (!e.target.checked && pkg.addons) {
                              const titlesToRemove = pkg.addons.map(a => a.title);
                              newAddons = newAddons.filter(a => !titlesToRemove.includes(a.title));
                            }
                            setFormData({...formData, packageIds: ids, selectedAddons: newAddons});
                          }}
                        />
                        {pkg.name}
                      </label>
                      {formData.packageIds.includes(pkg.id) && pkg.addons && pkg.addons.length > 0 && (
                        <div style={{ marginLeft: "2rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                          {pkg.addons.map((addon, idx) => {
                            const isSelected = formData.selectedAddons.some(a => a.title === addon.title);
                            return (
                              <label key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>
                                <input 
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    let currentAddons = [...formData.selectedAddons];
                                    if (e.target.checked) {
                                      currentAddons.push(addon);
                                    } else {
                                      currentAddons = currentAddons.filter(a => a.title !== addon.title);
                                    }
                                    setFormData({...formData, selectedAddons: currentAddons});
                                  }}
                                />
                                + {addon.title} ({addon.price} TL)
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <input 
                placeholder="Toplam Fiyat (TL)" 
                style={{ gridColumn: "span 2", padding: "1.25rem", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", outline: "none" }}
                value={formData.totalAmount}
                onChange={(e) => setFormData({...formData, totalAmount: e.target.value})}
              />
              <textarea 
                placeholder="Notlar (Opsiyonel)" 
                style={{ gridColumn: "span 2", padding: "1.25rem", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", minHeight: "80px", outline: "none", resize: "none" }}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
              <div style={{ gridColumn: "span 2", display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: "1.25rem", borderRadius: "1.5rem", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#fff", fontWeight: 700, cursor: "pointer" }}>İPTAL</button>
                <button type="submit" disabled={isLoading} style={{ flex: 2, padding: "1.25rem", borderRadius: "1.5rem", border: "none", background: "#fff", color: "#000", fontWeight: 900, cursor: "pointer" }}>{isLoading ? "KAYDEDİLİYOR..." : "KAYDET VE ONAYLA"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Workflow & Delivery Link Modal */}
      {workflowModal.isOpen && (
        <div style={{ 
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(15px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "2rem"
        }}>
          <div style={{ 
            background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "3rem", 
            width: "100%", maxWidth: "500px", padding: "3rem", position: "relative",
            boxShadow: "0 50px 100px -20px rgba(0,0,0,0.5)"
          }}>
            <h2 style={{ fontSize: "1.8rem", fontWeight: 900, marginBottom: "0.5rem", letterSpacing: "-0.04em" }}>İş Akışı & Teslimat</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem", marginBottom: "2rem" }}>{workflowModal.data.brideName} & {workflowModal.data.groomName}</p>
            
            <form onSubmit={handleWorkflowSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "0.75rem", display: "block", letterSpacing: "0.05em" }}>CRM Aşama Durumu</label>
                <select 
                  value={workflowData.workflowStatus}
                  onChange={(e) => setWorkflowData({...workflowData, workflowStatus: e.target.value})}
                  style={{ width: "100%", padding: "1.25rem", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", outline: "none", fontSize: "1rem" }}
                >
                  <option value="PENDING">Çekim Bekleniyor</option>
                  <option value="SHOT_DONE">Çekim Tamamlandı</option>
                  <option value="EDITING">Düzenleniyor</option>
                  <option value="SELECTION_PENDING">Seçim Bekleniyor</option>
                  <option value="DELIVERED">Teslim Edildi / Tamamlandı</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "0.75rem", display: "block", letterSpacing: "0.05em" }}>Google Drive / Teslimat Linki</label>
                <input 
                  type="url" 
                  placeholder="https://drive.google.com/..." 
                  style={{ width: "100%", padding: "1.25rem", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", outline: "none" }}
                  value={workflowData.deliveryLink}
                  onChange={(e) => setWorkflowData({...workflowData, deliveryLink: e.target.value})}
                />
                <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", marginTop: "0.75rem" }}>
                  Bu linki girdiğinizde müşteri panelinde doğrudan "Teslimat Klasörü" butonu görünür.
                </p>
              </div>
              
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setWorkflowModal({isOpen: false, data: null})} style={{ flex: 1, padding: "1.25rem", borderRadius: "1.5rem", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#fff", fontWeight: 700, cursor: "pointer" }}>İPTAL</button>
                <button type="submit" disabled={isLoading} style={{ flex: 2, padding: "1.25rem", borderRadius: "1.5rem", border: "none", background: "#fff", color: "#000", fontWeight: 900, cursor: "pointer" }}>{isLoading ? "KAYDEDİLİYOR..." : "GÜNCELLE"}</button>
              </div>

              <div style={{ padding: "1.5rem", borderRadius: "1.5rem", border: "1px dashed rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.02)", marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>
                  <ImageIcon size={16} className="text-white/50" /> Sadece Dış Çekim & Seçim Uygulanacak İşler İçin
                </div>
                <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginBottom: "0.5rem" }}>Orijinal fotoğrafları sisteme (Cloudinary) yükleyip müşterinin profiline göndermek için galeri yönetimine gidin.</p>
                <Link 
                  href={`/admin/reservations/${workflowModal.data.id}/gallery`}
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "1rem", borderRadius: "1rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, textDecoration: "none" }}
                  className="hover:bg-white/10 transition-colors"
                >
                  GALERİ YÖNETİMİNE GİT
                </Link>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
