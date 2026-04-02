"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Package as PackageIcon, PlusCircle, X } from "lucide-react";
import { getPackages, createPackage, updatePackage, deletePackage } from "../core-actions";
import MonthlyPriceManager from "./MonthlyPriceManager";

const CATEGORIES = [
  { value: "DIS_CEKIM", label: "Dış Çekim", icon: "🌿" },
  { value: "DUGUN", label: "Düğün", icon: "💍" },
  { value: "NISAN", label: "Nişan", icon: "💎" },
];

const TIME_TYPES = [
  { value: "SLOT_2H", label: "2 Saatlik" },
  { value: "SLOT_4H", label: "4 Saatlik" },
  { value: "WEDDING", label: "Düğün Boyunca" },
  { value: "FULL_DAY", label: "Tüm Gün" },
];

const ALL_SLOTS_2H = [
  { value: "08:00", label: "08:00 – 10:00" },
  { value: "10:00", label: "10:00 – 12:00" },
  { value: "12:00", label: "12:00 – 14:00" },
  { value: "14:00", label: "14:00 – 16:00" },
  { value: "16:00", label: "16:00 – 18:00" },
  { value: "18:00", label: "18:00 – 20:00" },
  { value: "20:00", label: "20:00 – 22:00" },
];

const ALL_SLOTS_4H = [
  { value: "08:00-12:00", label: "08:00 – 12:00" },
  { value: "10:00-14:00", label: "10:00 – 14:00" },
  { value: "12:00-16:00", label: "12:00 – 16:00" },
  { value: "14:00-18:00", label: "14:00 – 18:00" },
  { value: "16:00-20:00", label: "16:00 – 20:00" },
  { value: "18:00-22:00", label: "18:00 – 22:00" },
];

const getCategoryLabel = (val) => CATEGORIES.find(c => c.value === val)?.label || val;
const getCategoryIcon = (val) => CATEGORIES.find(c => c.value === val)?.icon || "📷";
const getTimeTypeLabel = (val) => TIME_TYPES.find(t => t.value === val)?.label || val;

const inp = {
  width: "100%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: "0.6rem", padding: "0.7rem 0.8rem", color: "#fff", outline: "none",
  fontSize: "0.8rem", boxSizing: "border-box",
};

const sel = {
  ...inp, appearance: "none", WebkitAppearance: "none", cursor: "pointer",
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' fill='white' viewBox='0 0 16 16'%3E%3Cpath d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat", backgroundPosition: "right 0.8rem center",
};

const lbl = { display: "block", fontSize: "0.65rem", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "5px", letterSpacing: "0.04em" };

const emptyForm = { 
  name: "", description: "", price: "", features: "", 
  category: "DIS_CEKIM", timeType: "SLOT_2H", maxCapacity: "1", 
  addons: [], customFields: [], deliveryTimeDays: "14", availableSlots: []
};

export default function PackagesPage() {
  const [packages, setPackages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState(null);

  async function loadPackages() { setPackages(await getPackages()); }
  useEffect(() => { loadPackages(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const res = editingId ? await updatePackage(editingId, formData) : await createPackage(formData);
    if (res.success) {
      setIsModalOpen(false); setEditingId(null);
      setFormData({ ...emptyForm });
      loadPackages();
    }
    setIsLoading(false);
  };

  const startEdit = (pkg) => {
    setEditingId(pkg.id);
    setFormData({ 
      name: pkg.name, description: pkg.description, price: pkg.price, 
      features: pkg.features.join(", "), category: pkg.category, 
      timeType: pkg.timeType, maxCapacity: pkg.maxCapacity.toString(), 
      addons: pkg.addons || [], customFields: pkg.customFields || [], 
      deliveryTimeDays: pkg.deliveryTimeDays?.toString() || "14",
      availableSlots: pkg.availableSlots || []
    });
    setIsModalOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    setFormData({ ...emptyForm });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Bu paketi silmek istediğine emin misin?")) {
      const res = await deletePackage(id);
      if (res.error) setDeleteMessage({ type: "error", text: "Hata: " + res.error });
      else { setDeleteMessage({ type: "success", text: "Silindi!" }); loadPackages(); }
      setTimeout(() => setDeleteMessage(null), 3000);
    }
  };

  const addAddon = () => setFormData({ ...formData, addons: [...formData.addons, { title: "", price: "" }] });
  const removeAddon = (i) => setFormData({ ...formData, addons: formData.addons.filter((_, idx) => idx !== i) });
  const updateAddon = (i, f, v) => { const a = [...formData.addons]; a[i] = { ...a[i], [f]: v }; setFormData({ ...formData, addons: a }); };

  const toggleSlot = (slotValue) => {
    const current = formData.availableSlots || [];
    const has = current.includes(slotValue);
    setFormData({ 
      ...formData, 
      availableSlots: has ? current.filter(s => s !== slotValue) : [...current, slotValue] 
    });
  };

  const getSlotsForTimeType = (tt) => {
    if (tt === "SLOT_2H") return ALL_SLOTS_2H;
    if (tt === "SLOT_4H") return ALL_SLOTS_4H;
    return [];
  };

  const groupedPackages = CATEGORIES.map(cat => ({ ...cat, items: packages.filter(p => p.category === cat.value) })).filter(g => g.items.length > 0);
  const ungrouped = packages.filter(p => !CATEGORIES.some(c => c.value === p.category));

  return (
    <div style={{ color: "#fff" }}>
      {/* Toast */}
      {deleteMessage && (
        <div style={{ position: "fixed", top: 70, right: 16, zIndex: 2000, padding: "10px 16px", borderRadius: 8,
          background: deleteMessage.type === "error" ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
          border: `1px solid ${deleteMessage.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
          color: deleteMessage.type === "error" ? "#f87171" : "#4ade80", fontWeight: 600, fontSize: 12,
        }}>{deleteMessage.text}</div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", gap: "0.75rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.2rem, 4vw, 1.8rem)", fontWeight: 900, letterSpacing: "-0.03em", margin: 0 }}>Paket Yönetimi</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", margin: "4px 0 0" }}>{packages.length} paket</p>
        </div>
        <button onClick={openNew} style={{
          background: "#fff", color: "#000", padding: "0.5rem 1rem", borderRadius: "0.6rem",
          border: "none", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.7rem",
        }}><Plus size={14} /> YENİ</button>
      </div>

      <MonthlyPriceManager />

      {/* Package Groups */}
      {groupedPackages.map((group) => (
        <div key={group.value} style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "0.9rem", fontWeight: 900, marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
            {group.icon} {group.label}
            <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.25)", fontWeight: 500 }}>({group.items.length})</span>
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {group.items.map((pkg) => (
              <div key={pkg.id} style={{
                padding: "12px 14px", borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)",
              }}>
                {/* Row 1: Name + Price + Actions */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                    <span style={{ fontSize: "1.1rem" }}>{getCategoryIcon(pkg.category)}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pkg.name}</div>
                      <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.55)" }}>{pkg.description?.substring(0, 60)}{pkg.description?.length > 60 ? "..." : ""}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                    <span style={{ fontWeight: 900, fontSize: "0.9rem" }}>{pkg.price}₺</span>
                    <button onClick={() => startEdit(pkg)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", padding: "5px", borderRadius: "6px", cursor: "pointer", display: "flex" }}>
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => handleDelete(pkg.id)} style={{ background: "rgba(255,68,68,0.05)", border: "1px solid rgba(255,68,68,0.15)", color: "#ff6b6b", padding: "5px", borderRadius: "6px", cursor: "pointer", display: "flex" }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Row 2: Tags */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 800, background: "rgba(255,255,255,0.08)", padding: "3px 8px", borderRadius: "5px", color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>
                    {getCategoryLabel(pkg.category)}
                  </span>
                  <span style={{ fontSize: "0.62rem", fontWeight: 800, background: "rgba(255,255,255,0.08)", padding: "3px 8px", borderRadius: "5px", color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>
                    {getTimeTypeLabel(pkg.timeType)}
                  </span>
                  <span style={{ fontSize: "0.62rem", fontWeight: 800, background: "rgba(255,255,255,0.08)", padding: "3px 8px", borderRadius: "5px", color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>
                    {pkg.maxCapacity}/periyot
                  </span>
                  <span style={{ fontSize: "0.62rem", fontWeight: 800, background: "rgba(255,255,255,0.08)", padding: "3px 8px", borderRadius: "5px", color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>
                    ⏳{pkg.deliveryTimeDays}gün
                  </span>
                  {pkg.availableSlots && pkg.availableSlots.length > 0 && (
                    <span style={{ fontSize: "0.55rem", fontWeight: 800, background: "rgba(168,85,247,0.08)", padding: "2px 6px", borderRadius: "4px", color: "#a855f7" }}>
                      🕐{pkg.availableSlots.length} slot
                    </span>
                  )}
                  {pkg.addons && pkg.addons.length > 0 && (
                    <span style={{ fontSize: "0.55rem", fontWeight: 800, background: "rgba(255,255,255,0.04)", padding: "2px 6px", borderRadius: "4px", color: "rgba(255,255,255,0.4)" }}>
                      +{pkg.addons.length} ek hizmet
                    </span>
                  )}
                  {pkg.customFields && pkg.customFields.length > 0 && (
                    <span style={{ fontSize: "0.55rem", fontWeight: 800, background: "rgba(255,255,255,0.04)", padding: "2px 6px", borderRadius: "4px", color: "rgba(255,255,255,0.4)" }}>
                      📝{pkg.customFields.length} alan
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {ungrouped.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "0.9rem", fontWeight: 900, marginBottom: "10px" }}>📷 Diğer</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {ungrouped.map((pkg) => (
              <div key={pkg.id} style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{pkg.name}</div>
                  <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)" }}>{pkg.price}₺</div>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button onClick={() => startEdit(pkg)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", padding: "5px", borderRadius: "6px", cursor: "pointer", display: "flex" }}><Edit2 size={12} /></button>
                  <button onClick={() => handleDelete(pkg.id)} style={{ background: "rgba(255,68,68,0.05)", border: "1px solid rgba(255,68,68,0.15)", color: "#ff6b6b", padding: "5px", borderRadius: "6px", cursor: "pointer", display: "flex" }}><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {packages.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.2)" }}>
          <PackageIcon size={32} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
          <p style={{ fontSize: "0.8rem" }}>Henüz paket yok</p>
        </div>
      )}

      {/* ── Modal ── */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 1000, padding: "1rem", overflowY: "auto" }}>
          <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1rem", width: "100%", maxWidth: "440px", padding: "1.25rem", position: "relative", margin: "2rem 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 900, margin: 0 }}>{editingId ? "Düzenle" : "Yeni Paket"}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <div>
                <div style={lbl}>Paket Adı</div>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required style={inp} placeholder="Elit Düğün Hikayesi" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                <div>
                  <div style={lbl}>Kategori</div>
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} style={sel}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value} style={{ background: "#111" }}>{c.icon} {c.label}</option>)}
                  </select>
                </div>
                <div>
                  <div style={lbl}>Zaman Tipi</div>
                  <select value={formData.timeType} onChange={(e) => setFormData({...formData, timeType: e.target.value, availableSlots: []})} style={sel}>
                    {TIME_TYPES.map(t => <option key={t.value} value={t.value} style={{ background: "#111" }}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Slot Configuration for SLOT_2H / SLOT_4H */}
              {(formData.timeType === "SLOT_2H" || formData.timeType === "SLOT_4H") && (
                <div style={{ background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.12)", borderRadius: "0.6rem", padding: "10px" }}>
                  <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "#a855f7", textTransform: "uppercase", marginBottom: "8px" }}>
                    🕐 Aktif Saat Dilimleri
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                    {getSlotsForTimeType(formData.timeType).map(slot => {
                      const active = (formData.availableSlots || []).includes(slot.value);
                      return (
                        <button
                          key={slot.value}
                          type="button"
                          onClick={() => toggleSlot(slot.value)}
                          style={{
                            padding: "6px 10px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 700,
                            cursor: "pointer", transition: "all 0.15s",
                            border: active ? "1px solid #a855f7" : "1px solid rgba(255,255,255,0.08)",
                            background: active ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.03)",
                            color: active ? "#c084fc" : "rgba(255,255,255,0.35)",
                          }}
                        >
                          {active ? "✓ " : ""}{slot.label}
                        </button>
                      );
                    })}
                  </div>
                  {(formData.availableSlots || []).length === 0 && (
                    <p style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.2)", marginTop: "6px", textAlign: "center" }}>
                      En az bir saat dilimi seçmelisiniz
                    </p>
                  )}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem" }}>
                <div><div style={lbl}>Fiyat</div><input type="text" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} required style={inp} placeholder="15.000" /></div>
                <div><div style={lbl}>Kapasite/Periyot</div><input type="number" value={formData.maxCapacity} onChange={(e) => setFormData({...formData, maxCapacity: e.target.value})} required style={inp} /></div>
                <div><div style={lbl}>Teslim (Gün)</div><input type="number" value={formData.deliveryTimeDays} onChange={(e) => setFormData({...formData, deliveryTimeDays: e.target.value})} required style={inp} /></div>
              </div>

              <div>
                <div style={lbl}>Açıklama</div>
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required rows={2} style={{ ...inp, resize: "none" }} />
              </div>

              <div>
                <div style={lbl}>Özellikler (virgülle)</div>
                <input type="text" value={formData.features} onChange={(e) => setFormData({...formData, features: e.target.value})} style={inp} placeholder="200 fotoğraf, albüm, drone" />
              </div>

              {/* Addons */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.6rem", padding: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Ek Hizmetler</span>
                  <button type="button" onClick={addAddon} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "3px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "0.65rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "3px" }}>
                    <PlusCircle size={10} /> Ekle
                  </button>
                </div>
                {formData.addons.length === 0 ? (
                  <p style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.7rem", textAlign: "center", padding: "6px 0" }}>Ek hizmet yok</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {formData.addons.map((addon, i) => (
                      <div key={i} style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                        <input type="text" placeholder="Hizmet adı" value={addon.title} onChange={(e) => updateAddon(i, "title", e.target.value)} style={{ ...inp, flex: 2, padding: "6px 8px", fontSize: "0.75rem" }} />
                        <input type="text" placeholder="₺" value={addon.price} onChange={(e) => updateAddon(i, "price", e.target.value)} style={{ ...inp, flex: 0.7, padding: "6px 8px", fontSize: "0.75rem" }} />
                        <button type="button" onClick={() => removeAddon(i)} style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171", width: 26, height: 26, borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><X size={11} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Fields */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.6rem", padding: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Özel Alanlar</span>
                  <button type="button" onClick={() => setFormData({ ...formData, customFields: [...formData.customFields, { label: "", type: "text", placeholder: "", options: "", required: false }] })}
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "3px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "0.65rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "3px" }}>
                    <PlusCircle size={10} /> Ekle
                  </button>
                </div>
                {formData.customFields.length === 0 ? (
                  <p style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.7rem", textAlign: "center", padding: "6px 0" }}>Özel alan yok</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {formData.customFields.map((field, i) => (
                      <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "6px", padding: "8px" }}>
                        <div style={{ display: "flex", gap: "4px", alignItems: "center", marginBottom: "4px" }}>
                          <input type="text" placeholder="Alan adı" value={field.label} onChange={(e) => { const cf = [...formData.customFields]; cf[i] = { ...cf[i], label: e.target.value }; setFormData({ ...formData, customFields: cf }); }}
                            style={{ ...inp, flex: 2, padding: "6px 8px", fontSize: "0.75rem" }} />
                          <select value={field.type} onChange={(e) => { const cf = [...formData.customFields]; cf[i] = { ...cf[i], type: e.target.value }; setFormData({ ...formData, customFields: cf }); }}
                            style={{ ...sel, flex: 1, padding: "6px 8px", fontSize: "0.7rem" }}>
                            <option value="text" style={{ background: "#111" }}>📝 Metin</option>
                            <option value="dropdown" style={{ background: "#111" }}>📋 Dropdown</option>
                            <option value="checkbox" style={{ background: "#111" }}>☑️ Onay</option>
                          </select>
                          <label style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap", cursor: "pointer" }}>
                            <input type="checkbox" checked={field.required || false} onChange={(e) => { const cf = [...formData.customFields]; cf[i] = { ...cf[i], required: e.target.checked }; setFormData({ ...formData, customFields: cf }); }}
                              style={{ width: "12px", height: "12px" }} /> Zorunlu
                          </label>
                          <button type="button" onClick={() => setFormData({ ...formData, customFields: formData.customFields.filter((_, idx) => idx !== i) })}
                            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171", width: 24, height: 24, borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><X size={10} /></button>
                        </div>
                        {field.type === "text" && <input type="text" placeholder="Placeholder metin..." value={field.placeholder || ""} onChange={(e) => { const cf = [...formData.customFields]; cf[i] = { ...cf[i], placeholder: e.target.value }; setFormData({ ...formData, customFields: cf }); }} style={{ ...inp, padding: "5px 8px", fontSize: "0.7rem" }} />}
                        {field.type === "dropdown" && <input type="text" placeholder="Seçenekler (virgülle)" value={field.options || ""} onChange={(e) => { const cf = [...formData.customFields]; cf[i] = { ...cf[i], options: e.target.value }; setFormData({ ...formData, customFields: cf }); }} style={{ ...inp, padding: "5px 8px", fontSize: "0.7rem" }} />}
                        {field.type === "checkbox" && <p style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.2)", margin: "2px 0 0" }}>Onay kutusu olarak gösterilir</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "4px" }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: "0.7rem", borderRadius: "0.6rem", border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.5)", fontWeight: 700, cursor: "pointer", fontSize: "0.75rem" }}>İPTAL</button>
                <button type="submit" disabled={isLoading} style={{ flex: 2, padding: "0.7rem", borderRadius: "0.6rem", border: "none", background: "#fff", color: "#000", fontWeight: 900, cursor: "pointer", fontSize: "0.75rem" }}>{isLoading ? "..." : "KAYDET"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
