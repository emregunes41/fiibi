"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Book, X, Image as ImageIcon, Upload } from "lucide-react";
import { getAlbumModels, createAlbumModel, deleteAlbumModel, uploadAlbumImage } from "../core-actions";

const inp = {
  width: "100%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: 0, padding: "0.7rem 0.8rem", color: "#fff", outline: "none",
  fontSize: "0.8rem", boxSizing: "border-box",
};

const lbl = { display: "block", fontSize: "0.65rem", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "5px", letterSpacing: "0.04em" };

const emptyForm = { name: "", imageUrl: "", description: "" };

export default function AlbumModelsPage() {
  const [models, setModels] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState(null);

  async function loadModels() { setModels(await getAlbumModels()); }
  useEffect(() => { loadModels(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Lütfen bir görsel seçin.");
      return;
    }

    setIsLoading(true);

    // Upload first
    const fileData = new FormData();
    fileData.append('file', selectedFile);
    const uploadRes = await uploadAlbumImage(fileData);

    if (uploadRes.error) {
      alert("Görsel yüklenirken hata oluştu: " + uploadRes.error);
      setIsLoading(false);
      return;
    }

    const payload = { ...formData, imageUrl: uploadRes.url };

    const res = await createAlbumModel(payload);
    if (res.success) {
      setIsModalOpen(false);
      setFormData({ ...emptyForm });
      setSelectedFile(null);
      loadModels();
    } else {
      alert("Albüm modeli eklenemedi: " + res.error);
    }
    setIsLoading(false);
  };

  const openNew = () => {
    setFormData({ ...emptyForm });
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Silmek istediğinize emin misiniz? (Geçmişte bu modeli seçen kullanıcıların seçimleri etkilenebilir)")) return;
    
    // Check if album model has active reservations mapped?
    // Delete constraint is cascaded or nullified depending on schema, we have it optional
    const res = await deleteAlbumModel(id);
    if (res.error) {
      setDeleteMessage({ id, text: "Hata oluştu. Bu model kullanımda olabilir." });
      setTimeout(() => setDeleteMessage(null), 3000);
    } else {
      loadModels();
    }
  };

  return (
    <div style={{ padding: "0.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 900, m: 0 }}>Albüm Modelleri</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", marginTop: 4 }}>
            Müşterilerin seçebileceği albüm tasarımlarını yönetin
          </p>
        </div>
        <button 
          onClick={openNew}
          style={{ background: "#fff", color: "#000", border: "none", padding: "0.7rem 1.2rem", borderRadius: 0, fontWeight: 800, fontSize: "0.75rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <Plus size={16} /> Yeni Model Ekle
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
        {models.map(model => (
          <div key={model.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ width: "100%", height: "200px", position: "relative", backgroundColor: "rgba(0,0,0,0.5)" }}>
              {/* Using img tag to avoid next/image domain config issues for external urls */}
              <img src={model.imageUrl} alt={model.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: "0.4rem" }}>
                <button
                  onClick={() => handleDelete(model.id)}
                  style={{ background: "rgba(239,68,68,0.9)", color: "#fff", border: "none", padding: "6px", borderRadius: 0, cursor: "pointer" }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            
            <div style={{ padding: "1.2rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Albüm Tasarımı</div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "#fff" }}>{model.name}</h3>
              {model.description && (
                <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", margin: 0, marginTop: "0.3rem", lineHeight: 1.5 }}>
                  {model.description}
                </p>
              )}
              {deleteMessage?.id === model.id && (
                <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.6)", marginTop: "0.5rem", fontWeight: 600 }}>{deleteMessage.text}</div>
              )}
            </div>
          </div>
        ))}
        {models.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "4rem 0", color: "rgba(255,255,255,0.4)" }}>
            <Book size={48} style={{ opacity: 0.2, margin: "0 auto 1rem" }} />
            <p>Henüz albüm modeli eklenmemiş.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(5px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", padding: "2rem", borderRadius: 0, width: "100%", maxWidth: "450px", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
              <X size={20} />
            </button>
            
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "1.5rem" }}>Yeni Albüm Modeli Ekle</h2>
            
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={lbl}>Model Adı</label>
                <input placeholder="Örn: Klasik Ahşap Kapak" style={inp} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>

              <div>
                <label style={lbl}>Görsel Yükle</label>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <ImageIcon size={18} color="rgba(255,255,255,0.4)" />
                  <div style={{ flex: 1, position: "relative" }}>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => setSelectedFile(e.target.files[0])} 
                      style={{ ...inp, cursor: "pointer" }} 
                      required 
                    />
                    {selectedFile && (
                      <div style={{ fontSize: "0.7rem", color: "#fff", marginTop: "4px" }}>
                        Seçildi: {selectedFile.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label style={lbl}>Kısa Açıklama (Opsiyonel)</label>
                <textarea rows={3} placeholder="Müşterinin görmesi için not..." style={{...inp, resize: "vertical"}} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: "transparent", color: "rgba(255,255,255,0.6)", border: "none", fontWeight: 700, cursor: "pointer", fontSize: "0.8rem", padding: "0.5rem 1rem" }}>İptal</button>
                <button type="submit" disabled={isLoading} style={{ background: "#fff", color: "#000", border: "none", padding: "0.8rem 1.5rem", borderRadius: 0, fontWeight: 800, fontSize: "0.8rem", cursor: "pointer", opacity: isLoading ? 0.7 : 1 }}>
                  {isLoading ? "Ekleniyor..." : "Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
