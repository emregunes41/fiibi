"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Package as PackageIcon } from "lucide-react";
import { getPackages, createPackage, updatePackage, deletePackage } from "../core-actions";

export default function PackagesPage() {
  const [packages, setPackages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    name: "", description: "", price: "", features: "", 
    category: "STANDARD", timeType: "FULL_DAY", maxCapacity: "1", addons: [] 
  });
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  async function loadPackages() {
    const data = await getPackages();
    setPackages(data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
        category: "STANDARD", timeType: "FULL_DAY", maxCapacity: "1", addons: [] 
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
      addons: pkg.addons || []
    });
    setIsModalOpen(true);
  };

  const openNewPackageModal = () => {
    setEditingId(null);
    setFormData({ 
      name: "", description: "", price: "", features: "", 
      category: "STANDARD", timeType: "FULL_DAY", maxCapacity: "1", addons: [] 
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Bu paketi silmek istediğine emin misin?")) {
      await deletePackage(id);
      loadPackages();
    }
  };

  return (
    <div style={{ color: "#fff" }}>
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "2rem" }}>
        {packages.map((pkg) => (
          <div key={pkg.id} style={{ 
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", 
            padding: "2.5rem", borderRadius: "2.5rem", position: "relative",
            backdropFilter: "blur(10px)", transition: "all 0.3s"
          }} className="hover:border-white/30 hover:bg-white/5">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <div style={{ 
                background: "rgba(255,255,255,0.1)", borderRadius: "1rem", 
                width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center" 
              }}>
                <PackageIcon size={24} color="#fff" />
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
                {pkg.category}
              </span>
              <span style={{ fontSize: "0.7rem", fontWeight: 900, background: "rgba(255,255,255,0.05)", padding: "0.4rem 0.8rem", borderRadius: "2rem", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>
                {pkg.timeType === "FULL_DAY" ? "TAM GÜN" : "SAATLİK"}
              </span>
              <span style={{ fontSize: "0.7rem", fontWeight: 900, background: "rgba(255,255,255,0.05)", padding: "0.4rem 0.8rem", borderRadius: "2rem", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>
                {pkg.maxCapacity} RANDEVU/GÜN
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modern Modal */}
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
            <h2 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "2rem", letterSpacing: "-0.04em" }}>{editingId ? "Paket Düzenle" : "Yeni Paket Oluştur"}</h2>
            
            <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "0.75rem", letterSpacing: "0.05em" }}>Paket Adı</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required 
                  style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1rem", padding: "1.25rem", color: "#fff", outline: "none" }}
                  placeholder="Örn: Elit Düğün Hikayesi"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "0.75rem" }}>Fiyat</label>
                <input 
                  type="text" 
                  value={formData.price} 
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  required 
                  style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1rem", padding: "1.25rem", color: "#fff" }}
                  placeholder="Örn: 15.000 TL"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "0.75rem" }}>Günlük Kapasite</label>
                <input 
                  type="number" 
                  value={formData.maxCapacity} 
                  onChange={(e) => setFormData({...formData, maxCapacity: e.target.value})}
                  required 
                  style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1rem", padding: "1.25rem", color: "#fff" }}
                />
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "0.75rem" }}>Açıklama</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required 
                  rows={3}
                  style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1rem", padding: "1.25rem", color: "#fff", resize: "none" }}
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
