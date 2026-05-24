"use client";

import { useState } from "react";
import { CheckCircle, Book, ArrowRight, Eye, X } from "lucide-react";
import { selectAlbumModel } from "../admin/core-actions";

export default function AlbumSelectionForm({ reservationId, initialSelectedId, models, isLocked }) {
  const [selectedId, setSelectedId] = useState(initialSelectedId || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const handleSubmit = async () => {
    if (!selectedId) {
      setMessage({ type: "error", text: "Lütfen bir albüm modeli seçin." });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const res = await selectAlbumModel(reservationId, selectedId);
    if (res.success) {
      setMessage({ type: "success", text: "Albüm seçiminiz başarıyla kaydedildi!" });
    } else {
      setMessage({ type: "error", text: res.error || "Bir hata oluştu." });
    }
    setIsSubmitting(false);
  };

  const selectedModelInfo = models.find(m => m.id === selectedId) || null;

  if (models.length === 0) return null; // If admin hasn't added any models, don't show the section.

  return (
    <div style={{ marginTop: 24, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.02)", borderRadius: 0, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <Book size={20} style={{ color: "rgba(0,0,0,0.45)" }} />
        <h4 style={{ fontSize: 18, fontWeight: 800, color: "var(--text, #1a1a1a)" }}>Albüm Modeli Seçimi</h4>
      </div>
      <p style={{ color: "rgba(0,0,0,0.45)", fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
        Fotoğraf seçiminiz tamamlandı! Şimdi baskı için istediğiniz albüm modelini aşağıdan seçebilirsiniz.
      </p>

      {/* Models Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        {models.map(model => (
          <div 
            key={model.id}
            onClick={() => !isLocked && setSelectedId(model.id)}
            style={{ 
              position: "relative", 
              borderRadius: 0, 
              overflow: "hidden", 
              cursor: isLocked ? "default" : "pointer",
              border: selectedId === model.id ? "2px solid rgba(0,0,0,0.45)" : "2px solid transparent",
              transition: "all 0.2s",
              background: "rgba(0,0,0,0.3)",
              opacity: isLocked && selectedId !== model.id ? 0.3 : 1
            }}
          >
            <div style={{ width: "100%", height: 160, position: "relative" }}>
              <img src={model.imageUrl} alt={model.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: selectedId === model.id ? "rgba(0,0,0,0.05)" : "rgba(0,0,0,0.2)", transition: "all 0.2s" }} />
              
              <button 
                onClick={(e) => { e.stopPropagation(); setPreviewImage(model.imageUrl); }}
                style={{ position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,0.5)", border: "1px solid rgba(0,0,0,0.15)", borderRadius: 0, padding: 6, color: "var(--text, #1a1a1a)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                title="Büyük Gör"
              >
                <Eye size={16} />
              </button>
              
              {selectedId === model.id && (
                <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.45)", color: "var(--text, #1a1a1a)", borderRadius: 0, padding: 4 }}>
                  <CheckCircle size={16} />
                </div>
              )}
            </div>
            <div style={{ padding: 12 }}>
              <h5 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "var(--text, #1a1a1a)" }}>{model.name}</h5>
              {model.description && (
                <p style={{ fontSize: 11, color: "rgba(0,0,0,0.45)", margin: 0, marginTop: 4, lineHeight: 1.4 }}>
                  {model.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {message && (
        <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 0, fontSize: 13, fontWeight: 600, background: message.type === "success" ? "rgba(0,0,0,0.05)" : "rgba(248,113,113,0.1)", color: message.type === "success" ? "#fff" : "rgba(0,0,0,0.55)" }}>
          {message.text}
        </div>
      )}

      {isLocked ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", background: "rgba(0,0,0,0.04)", borderRadius: 0 }}>
          <CheckCircle size={18} style={{ color: "rgba(0,0,0,0.35)" }} />
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(0,0,0,0.55)" }}>Albüm modeli seçiminiz kilitlendi.</span>
            <div style={{ fontSize: 11, color: "rgba(0,0,0,0.35)", marginTop: 2 }}>{selectedModelInfo?.name} modeli üretilecek. Değişiklik için lütfen bizimle iletişime geçin.</div>
          </div>
        </div>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={!selectedId || isSubmitting}
          style={{ width: "100%", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: selectedId ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.04)", color: selectedId ? "#fff" : "rgba(0,0,0,0.25)", border: "none", borderRadius: 0, fontSize: 14, fontWeight: 700, cursor: selectedId && !isSubmitting ? "pointer" : "default", transition: "all 0.2s" }}
        >
          <span>{isSubmitting ? "Kaydediliyor..." : selectedId === initialSelectedId && selectedId !== "" ? "Seçimi Güncelle" : "Seçimi Onayla ve Gönder"}</span>
          <ArrowRight size={18} />
        </button>
      )}

      {/* Full Screen Preview Modal */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <button 
            onClick={() => setPreviewImage(null)}
            style={{ position: "absolute", top: 20, right: 20, background: "rgba(0,0,0,0.08)", border: "none", color: "var(--text, #1a1a1a)", padding: 8, borderRadius: 0, cursor: "pointer" }}
          >
            <X size={24} />
          </button>
          <img 
            src={previewImage} 
            alt="Büyük Görünüm" 
            style={{ maxWidth: "100%", maxHeight: "90vh", objectFit: "contain", borderRadius: 0, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }} 
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  );
}
