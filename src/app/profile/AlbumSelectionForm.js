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
    <div style={{ marginTop: 24, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 20, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <Book size={20} style={{ color: "#3b82f6" }} />
        <h4 style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>Albüm Modeli Seçimi</h4>
      </div>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
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
              borderRadius: 16, 
              overflow: "hidden", 
              cursor: isLocked ? "default" : "pointer",
              border: selectedId === model.id ? "2px solid #3b82f6" : "2px solid transparent",
              transition: "all 0.2s",
              background: "rgba(0,0,0,0.3)",
              opacity: isLocked && selectedId !== model.id ? 0.3 : 1
            }}
          >
            <div style={{ width: "100%", height: 160, position: "relative" }}>
              <img src={model.imageUrl} alt={model.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: selectedId === model.id ? "rgba(59,130,246,0.1)" : "rgba(0,0,0,0.2)", transition: "all 0.2s" }} />
              
              <button 
                onClick={(e) => { e.stopPropagation(); setPreviewImage(model.imageUrl); }}
                style={{ position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50%", padding: 6, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                title="Büyük Gör"
              >
                <Eye size={16} />
              </button>
              
              {selectedId === model.id && (
                <div style={{ position: "absolute", top: 12, right: 12, background: "#3b82f6", color: "#fff", borderRadius: "50%", padding: 4 }}>
                  <CheckCircle size={16} />
                </div>
              )}
            </div>
            <div style={{ padding: 12 }}>
              <h5 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "#fff" }}>{model.name}</h5>
              {model.description && (
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: 0, marginTop: 4, lineHeight: 1.4 }}>
                  {model.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {message && (
        <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600, background: message.type === "success" ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)", color: message.type === "success" ? "#4ade80" : "#f87171" }}>
          {message.text}
        </div>
      )}

      {isLocked ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", background: "rgba(255,255,255,0.05)", borderRadius: 12 }}>
          <CheckCircle size={18} style={{ color: "rgba(255,255,255,0.4)" }} />
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>Albüm modeli seçiminiz kilitlendi.</span>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{selectedModelInfo?.name} modeli üretilecek. Değişiklik için lütfen bizimle iletişime geçin.</div>
          </div>
        </div>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={!selectedId || isSubmitting}
          style={{ width: "100%", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: selectedId ? "#3b82f6" : "rgba(255,255,255,0.05)", color: selectedId ? "#fff" : "rgba(255,255,255,0.3)", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: selectedId && !isSubmitting ? "pointer" : "default", transition: "all 0.2s" }}
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
            style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", padding: 8, borderRadius: "50%", cursor: "pointer" }}
          >
            <X size={24} />
          </button>
          <img 
            src={previewImage} 
            alt="Büyük Görünüm" 
            style={{ maxWidth: "100%", maxHeight: "90vh", objectFit: "contain", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }} 
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  );
}
