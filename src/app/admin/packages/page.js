"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Package as PackageIcon, PlusCircle, X } from "lucide-react";
import { getPackages, createPackage, updatePackage, deletePackage } from "../core-actions";

const CATEGORIES = [
  { value: "DIS_CEKIM", label: "Dış Çekimler", icon: "🌿" },
  { value: "DUGUN", label: "Düğün Çekimleri", icon: "💍" },
  { value: "NISAN", label: "Nişan Çekimleri", icon: "💎" },
];

const TIME_TYPES = [
  { value: "FULL_DAY", label: "Tüm Gün" },
  { value: "MORNING", label: "Gündüz" },
  { value: "EVENING", label: "Akşam" },
  { value: "SLOT", label: "2 Saatlik Periyot" },
];

const getCategoryLabel = (val) => CATEGORIES.find(c => c.value === val)?.label || val;
const getCategoryIcon = (val) => CATEGORIES.find(c => c.value === val)?.icon || "📷";
const getTimeLabel = (val) => TIME_TYPES.find(t => t.value === val)?.label || val;

export default function PackagesPage() {
  const [packages, setPackages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    name: "", description: "", price: "", features: "", 
    category: "DIS_CEKIM", timeType: "FULL_DAY", maxCapacity: "1", addons: [], deliveryTimeDays: "14"
  });
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState(null);

  async function loadPackages() {
    const data = await getPackages();
    setPackages(data);
  }

  useEffect(() => {
    loadPackages();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const res = editingId 
      ? await updatePackage(editingId, formData)
      : await createPackage(formData);

    if (res.success) {
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ 
        name: "", description: "", price: "", features: "", 
        category: "DIS_CEKIM", timeType: "FULL_DAY", maxCapacity: "1", addons: [], deliveryTimeDays: "14"
      });
      loadPackages();
    }
    setIsLoading(false);
  };

  const startEdit = (pkg) => {
    setEditingId(pkg.id);
    setFormData({
      name: pkg.name,
      description: pkg.description,
      price: pkg.price,
      features: pkg.features.join(", "),
      category: pkg.category,
      timeType: pkg.timeType,
      maxCapacity: pkg.maxCapacity.toString(),
      addons: pkg.addons || [],
      deliveryTimeDays: pkg.deliveryTimeDays?.toString() || "14"
    });
    setIsModalOpen(true);
  };

  const openNewPackageModal = () => {
    setEditingId(null);
    setFormData({ 
      name: "", description: "", price: "", features: "", 
      category: "DIS_CEKIM", timeType: "FULL_DAY", maxCapacity: "1", addons: [], deliveryTimeDays: "14"
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Bu paketi silmek istediğine emin misin?")) {
      const res = await deletePackage(id);
      if (res.error) {
        setDeleteMessage({ type: "error", text: "Silme hatası: " + res.error });
      } else {
        setDeleteMessage({ type: "success", text: "Paket başarıyla silindi!" });
        loadPackages();
      }
      setTimeout(() => setDeleteMessage(null), 4000);
    }
  };

  const addAddon = () => {
    setFormData({ ...formData, addons: [...formData.addons, { title: "", price: "" }] });
  };

  const removeAddon = (index) => {
    setFormData({ ...formData, addons: formData.addons.filter((_, i) => i !== index) });
  };

  const updateAddon = (index, field, value) => {
    const newAddons = [...formData.addons];
    newAddons[index] = { ...newAddons[index], [field]: value };
    setFormData({ ...formData, addons: newAddons });
  };

  const groupedPackages = CATEGORIES.map(cat => ({
    ...cat,
    items: packages.filter(p => p.category === cat.value)
  })).filter(g => g.items.length > 0);

  const ungrouped = packages.filter(p => !CATEGORIES.some(c => c.value === p.category));

  const selectStyle = {
    width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "1rem", padding: "1.25rem", color: "#fff", outline: "none", appearance: "none",
    WebkitAppearance: "none", cursor: "pointer", fontSize: "0.95rem",
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='white' viewBox='0 0 16 16'%3E%3Cpath d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat", backgroundPosition: "right 1.25rem center"
  };

  const labelStyle = { 
    display: "block", fontSize: "0.75rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", 
    textTransform: "uppercase", marginBottom: "0.75rem", letterSpacing: "0.05em" 
  };

  const inputStyle = { 
    width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", 
    borderRadius: "1rem", padding: "1.25rem", color: "#fff", outline: "none" 
  };

  return (
    <div style={{ color: "#fff" }}>
      {/* Delete feedback */}
      {deleteMessage && (
        <div style={{ 
          position: "fixed", top: 80, right: 24, zIndex: 2000, padding: "14px 24px", borderRadius: 14,
          background: deleteMessage.type === "error" ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
          border: `1px solid ${deleteMessage.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
          color: deleteMessage.type === "error" ? "#f87171" : "#4ade80",
          fontWeight: 600, fontSize: 14, backdropFilter: "blur(10px)"
        }}>
          {deleteMessage.text}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
        <div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 900, letterSpacing: "-0.04em", marginBottom: "0.5rem" }}>Paket Yönetimi</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1.1rem" }}>Sitede görünen fotoğrafçılık paketlerini buradan düzenleyebilirsin.</p>
        </div>
        <button 
          onClick={openNewPackageModal}
          style={{ 
            background: "#fff", color: "#000", padding: "1rem 1.75rem", 
            borderRadius: "1.25rem", border: "none", fontWeight: 800, cursor: "pointer",
            display: "flex", alignItems: "center", gap: "0.6rem", transition: "all 0.2s"
          }}
          className="hover:scale-105"
        >
          <Plus size={20} /> YENİ PAKET EKLE
        </button>
      </div>

      {groupedPackages.map((group) => (
        <div key={group.value} style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span>{group.icon}</span> {group.label}
            <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>({group.items.length} paket)</span>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "2rem" }}>
            {group.items.map((pkg) => (
              <div key={pkg.id} style={{ 
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", 
                padding: "2.5rem", borderRadius: "2.5rem", position: "relative",
                backdropFilter: "blur(10px)", transition: "all 0.3s"
              }} className="hover:border-white/30 hover:bg-white/5">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                  <div style={{ 
                    background: "rgba(255,255,255,0.1)", borderRadius: "1rem", 
                    width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem"
                  }}>
                    {getCategoryIcon(pkg.category)}
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button onClick={() => startEdit(pkg)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "0.6rem", borderRadius: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} className="hover:bg-white/10">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(pkg.id)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,77,77,0.2)", color: "#FF4D4D", padding: "0.6rem", borderRadius: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} className="hover:bg-red-500/10">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>{pkg.name}</h3>
                <div style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "1.25rem", color: "#fff" }}>{pkg.price} TL</div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "2rem", minHeight: "3em" }}>{pkg.description}</p>
                
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1.5rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 900, background: "rgba(255,255,255,0.05)", padding: "0.4rem 0.8rem", borderRadius: "2rem", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>
                    {getCategoryLabel(pkg.category)}
                  </span>
                  <span style={{ fontSize: "0.7rem", fontWeight: 900, background: "rgba(255,255,255,0.05)", padding: "0.4rem 0.8rem", borderRadius: "2rem", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>
                    {pkg.maxCapacity} RANDEVU/GÜN
                  </span>
                  <span style={{ fontSize: "0.7rem", fontWeight: 900, background: "rgba(255,255,255,0.05)", padding: "0.4rem 0.8rem", borderRadius: "2rem", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>
                    ⏳ {pkg.deliveryTimeDays} GÜN TESLİM
                  </span>
                </div>

                {/* Addons display */}
                {pkg.addons && Array.isArray(pkg.addons) && pkg.addons.length > 0 && (
                  <div style={{ marginTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1rem" }}>
                    <p style={{ fontSize: "0.7rem", fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: "0.5rem", letterSpacing: "0.05em" }}>Ek Hizmetler</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      {pkg.addons.map((addon, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" }}>
                          <span>+ {addon.title}</span>
                          <span style={{ fontWeight: 700 }}>{addon.price} TL</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {ungrouped.length > 0 && (
        <div style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "1.5rem" }}>📷 Diğer Paketler</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "2rem" }}>
            {ungrouped.map((pkg) => (
              <div key={pkg.id} style={{ 
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", 
                padding: "2.5rem", borderRadius: "2.5rem"
              }}>
                <h3 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "0.5rem" }}>{pkg.name}</h3>
                <div style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "1.25rem" }}>{pkg.price} TL</div>
                <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "1rem" }}>{pkg.description}</p>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button onClick={() => startEdit(pkg)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "0.6rem 1rem", borderRadius: "1rem", cursor: "pointer", fontSize: "0.8rem" }}>Düzenle</button>
                  <button onClick={() => handleDelete(pkg.id)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,77,77,0.2)", color: "#FF4D4D", padding: "0.6rem 1rem", borderRadius: "1rem", cursor: "pointer", fontSize: "0.8rem" }}>Sil</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {packages.length === 0 && (
        <div style={{ textAlign: "center", padding: "4rem", color: "rgba(255,255,255,0.3)" }}>
          <PackageIcon size={48} style={{ margin: "0 auto 1rem" }} />
          <p style={{ fontSize: "1.2rem" }}>Henüz paket eklenmemiş.</p>
        </div>
      )}

      {isModalOpen && (
        <div style={{ 
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(15px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "2rem"
        }}>
          <div style={{ 
            background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "3rem", 
            width: "100%", maxWidth: "700px", padding: "3rem", position: "relative",
            boxShadow: "0 50px 100px -20px rgba(0,0,0,0.5)", maxHeight: "90vh", overflowY: "auto"
          }}>
            <h2 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "2rem", letterSpacing: "-0.04em" }}>{editingId ? "Paket Düzenle" : "Yeni Paket Oluştur"}</h2>
            
            <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={labelStyle}>Paket Adı</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required 
                  style={inputStyle}
                  placeholder="Örn: Elit Düğün Hikayesi"
                />
              </div>

              <div>
                <label style={labelStyle}>Kategori</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  style={selectStyle}
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value} style={{ background: "#111", color: "#fff" }}>
                      {c.icon} {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Zaman Tipi</label>
                <select
                  value={formData.timeType}
                  onChange={(e) => setFormData({...formData, timeType: e.target.value})}
                  style={selectStyle}
                >
                  {TIME_TYPES.map(t => (
                    <option key={t.value} value={t.value} style={{ background: "#111", color: "#fff" }}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Fiyat</label>
                <input 
                  type="text" 
                  value={formData.price} 
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  required 
                  style={inputStyle}
                  placeholder="Örn: 15.000"
                />
              </div>

              <div>
                <label style={labelStyle}>Günlük Kapasite</label>
                <input 
                  type="number" 
                  value={formData.maxCapacity} 
                  onChange={(e) => setFormData({...formData, maxCapacity: e.target.value})}
                  required 
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Teslim Süresi (Gün)</label>
                <input 
                  type="number" 
                  value={formData.deliveryTimeDays} 
                  onChange={(e) => setFormData({...formData, deliveryTimeDays: e.target.value})}
                  required 
                  style={inputStyle}
                  placeholder="Örn: 14"
                />
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <label style={labelStyle}>Açıklama</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required 
                  rows={3}
                  style={{ ...inputStyle, resize: "none" }}
                />
              </div>

              {/* ADDON MANAGEMENT SECTION */}
              <div style={{ gridColumn: "span 2", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1.5rem", padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Ek Hizmetler (Addon)</label>
                  <button 
                    type="button" 
                    onClick={addAddon}
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", padding: "0.5rem 1rem", borderRadius: "0.75rem", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem" }}
                  >
                    <PlusCircle size={14} /> Ekle
                  </button>
                </div>
                {formData.addons.length === 0 ? (
                  <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.85rem", textAlign: "center", padding: "1rem 0" }}>Henüz ek hizmet eklenmedi. "Ekle" butonuna tıklayarak ekleyebilirsin.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {formData.addons.map((addon, index) => (
                      <div key={index} style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                        <input
                          type="text"
                          placeholder="Ek hizmet adı (örn: Drone çekimi)"
                          value={addon.title}
                          onChange={(e) => updateAddon(index, "title", e.target.value)}
                          style={{ ...inputStyle, flex: 2, padding: "0.85rem 1rem", borderRadius: "0.75rem" }}
                        />
                        <input
                          type="text"
                          placeholder="Fiyat"
                          value={addon.price}
                          onChange={(e) => updateAddon(index, "price", e.target.value)}
                          style={{ ...inputStyle, flex: 1, padding: "0.85rem 1rem", borderRadius: "0.75rem" }}
                        />
                        <button
                          type="button"
                          onClick={() => removeAddon(index)}
                          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", width: 36, height: 36, borderRadius: "0.6rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <label style={labelStyle}>Özellikler (virgülle ayır)</label>
                <input 
                  type="text" 
                  value={formData.features} 
                  onChange={(e) => setFormData({...formData, features: e.target.value})}
                  style={inputStyle}
                  placeholder="Örn: 200 fotoğraf, albüm, drone çekimi"
                />
              </div>

              <div style={{ gridColumn: "span 2", display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1, padding: "1.25rem", borderRadius: "1.5rem", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#fff", fontWeight: 700, cursor: "pointer" }}
                >
                  İPTAL
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  style={{ flex: 2, padding: "1.25rem", borderRadius: "1.5rem", border: "none", background: "#fff", color: "#000", fontWeight: 900, cursor: "pointer" }}
                >
                  {isLoading ? "KAYDEDİLİYOR..." : "KAYDET VE YAYINLA"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
