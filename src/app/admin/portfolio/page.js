"use client";

import { useState, useEffect } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { UploadCloud, Image as ImageIcon, Trash2, Plus, X, ArrowLeft, Folder, RefreshCw } from "lucide-react";
import { 
  getPortfolioCategories, 
  createPortfolioCategory, 
  deletePortfolioCategory,
  addPhotoToPortfolio,
  deletePortfolioPhoto
} from "../portfolio-actions";

const inp = {
  width: "100%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: 0, padding: "0.7rem 0.8rem", color: "#fff", outline: "none",
  fontSize: "0.8rem", boxSizing: "border-box",
};

const lbl = { display: "block", fontSize: "0.65rem", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "5px", letterSpacing: "0.04em" };

export default function PortfolioAdminPage() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCatName, setNewCatName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState(null);

  const activeCategory = categories.find(c => c.id === activeCategoryId);

  const loadCategories = async () => {
    const res = await getPortfolioCategories();
    if (res.success) {
      setCategories(res.categories);
    }
    setIsLoading(false);
  };

  useEffect(() => { loadCategories(); }, []);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setIsCreating(true);
    setErrorMsg("");
    const res = await createPortfolioCategory(newCatName);
    if (res.success) {
      setNewCatName("");
      setIsModalOpen(false);
      loadCategories();
    } else {
      setErrorMsg(res.error);
    }
    setIsCreating(false);
  };

  const handleDeleteCategory = async (id, name) => {
    if (confirm(`'${name}' konseptini ve içindeki tüm fotoğrafları silmek istediğinize emin misiniz?`)) {
      await deletePortfolioCategory(id);
      if (activeCategoryId === id) setActiveCategoryId(null);
      loadCategories();
    }
  };

  const handleUploadSuccess = async (result, categoryId) => {
    if (result.event === "success") {
      const url = result.info.secure_url;
      const publicId = result.info.public_id;
      await addPhotoToPortfolio(categoryId, url, publicId);
      loadCategories();
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (confirm("Bu fotoğrafı portfolyodan kaldırmak istediğinize emin misiniz?")) {
      await deletePortfolioPhoto(photoId);
      loadCategories();
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "rgba(255,255,255,0.4)" }}>
        <RefreshCw size={20} style={{ marginRight: 8, animation: "spin 1s linear infinite" }} /> Yükleniyor...
      </div>
    );
  }

  // ── PHOTO DETAIL VIEW ──
  if (activeCategory) {
    return (
      <div style={{ padding: "0.5rem" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button 
              onClick={() => setActiveCategoryId(null)}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "0.5rem 0.8rem", borderRadius: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.7rem", fontWeight: 700 }}
            >
              <ArrowLeft size={14} /> Geri
            </button>
            <div>
              <h1 style={{ fontSize: "1.8rem", fontWeight: 900, margin: 0 }}>{activeCategory.name}</h1>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", marginTop: 4 }}>
                {activeCategory.photos?.length || 0} görsel
              </p>
            </div>
          </div>
          
          <CldUploadWidget
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ""}
            onSuccess={(res) => handleUploadSuccess(res, activeCategory.id)}
            options={{ multiple: true, cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME }}
          >
            {({ open }) => (
              <button
                onClick={() => open()}
                style={{ background: "#fff", color: "#000", border: "none", padding: "0.7rem 1.2rem", borderRadius: 0, fontWeight: 800, fontSize: "0.75rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <UploadCloud size={16} /> Görsel Yükle
              </button>
            )}
          </CldUploadWidget>
        </div>

        {/* Photos Grid */}
        {activeCategory.photos?.length === 0 ? (
          <div style={{ textAlign: "center", padding: "5rem 0", color: "rgba(255,255,255,0.4)" }}>
            <UploadCloud size={48} style={{ opacity: 0.2, margin: "0 auto 1rem" }} />
            <p style={{ marginBottom: 8, fontWeight: 600 }}>Bu konseptte henüz görsel yok.</p>
            <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>Yukarıdaki butona tıklayarak fotoğraf yükleyebilirsiniz.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.8rem" }}>
            {activeCategory.photos.map((photo) => (
              <div key={photo.id} style={{ position: "relative", aspectRatio: "1", borderRadius: 0, overflow: "hidden", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <img src={photo.url} alt="Portfolio" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button
                  onClick={() => handleDeletePhoto(photo.id)}
                  style={{ position: "absolute", top: 8, right: 8, background: "rgba(239,68,68,0.9)", color: "#fff", border: "none", padding: "5px", borderRadius: 0, cursor: "pointer", opacity: 0.7, transition: "opacity 0.2s" }}
                  onMouseEnter={(e) => e.target.style.opacity = 1}
                  onMouseLeave={(e) => e.target.style.opacity = 0.7}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── CATEGORIES LIST VIEW ──
  return (
    <div style={{ padding: "0.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 900, margin: 0 }}>Portfolyo</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", marginTop: 4 }}>
            Anasayfadaki galeri fotoğraflarınızı konseptlere göre yönetin
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ background: "#fff", color: "#000", border: "none", padding: "0.7rem 1.2rem", borderRadius: 0, fontWeight: 800, fontSize: "0.75rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <Plus size={16} /> Yeni Konsept
        </button>
      </div>

      {errorMsg && (
        <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 0, color: "rgba(255,255,255,0.6)", fontSize: "0.75rem", fontWeight: 700, marginBottom: "1rem" }}>
          {errorMsg}
        </div>
      )}

      {/* Categories Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
        {categories.map(category => (
          <div 
            key={category.id} 
            onClick={() => setActiveCategoryId(category.id)}
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 0, overflow: "hidden", cursor: "pointer", transition: "all 0.2s", display: "flex", flexDirection: "column" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            {/* Cover Image */}
            <div style={{ width: "100%", height: "180px", position: "relative", backgroundColor: "rgba(0,0,0,0.3)" }}>
              {category.photos?.[0] ? (
                <img src={category.photos[0].url} alt={category.name} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.75 }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.1)" }}>
                  <ImageIcon size={40} />
                  <span style={{ fontSize: "0.6rem", fontWeight: 800, marginTop: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>Boş</span>
                </div>
              )}
              <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: "0.4rem" }}>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category.id, category.name); }}
                  style={{ background: "rgba(239,68,68,0.9)", color: "#fff", border: "none", padding: "6px", borderRadius: 0, cursor: "pointer" }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Info */}
            <div style={{ padding: "1.2rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Konsept</div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "#fff" }}>{category.name}</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.3rem" }}>
                <ImageIcon size={12} style={{ color: "rgba(255,255,255,0.3)" }} />
                <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
                  {category.photos?.length || 0} görsel
                </span>
              </div>
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "4rem 0", color: "rgba(255,255,255,0.4)" }}>
            <Folder size={48} style={{ opacity: 0.2, margin: "0 auto 1rem" }} />
            <p>Henüz portfolyo konsepti eklenmemiş.</p>
          </div>
        )}
      </div>

      {/* New Category Modal */}
      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(5px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", padding: "2rem", borderRadius: 0, width: "100%", maxWidth: "400px", position: "relative" }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
              <X size={20} />
            </button>

            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "1.5rem" }}>Yeni Konsept Ekle</h2>
            
            <form onSubmit={handleCreateCategory} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={lbl}>Konsept Adı</label>
                <input 
                  autoFocus
                  placeholder="Örn: Düğün, Dış Çekim, Nişan..."
                  style={inp} 
                  value={newCatName} 
                  onChange={(e) => setNewCatName(e.target.value)} 
                  required 
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: "transparent", color: "rgba(255,255,255,0.6)", border: "none", fontWeight: 700, cursor: "pointer", fontSize: "0.8rem", padding: "0.5rem 1rem" }}>İptal</button>
                <button type="submit" disabled={isCreating} style={{ background: "#fff", color: "#000", border: "none", padding: "0.8rem 1.5rem", borderRadius: 0, fontWeight: 800, fontSize: "0.8rem", cursor: "pointer", opacity: isCreating ? 0.7 : 1 }}>
                  {isCreating ? "Oluşturuluyor..." : "Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
