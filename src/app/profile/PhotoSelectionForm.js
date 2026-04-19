"use client";

import { useState } from "react";
import { submitPhotoSelection } from "../user-actions";
import { Check, Edit3, Send } from "lucide-react";

export default function PhotoSelectionForm({ reservationId, initialSelection }) {
  const [selection, setSelection] = useState(initialSelection || "");
  const [isEditing, setIsEditing] = useState(!initialSelection);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selection.trim()) return;

    setLoading(true);
    setMessage("");

    try {
      const res = await submitPhotoSelection(reservationId, selection);
      if (res.success) {
        setMessage("Seçim başarıyla gönderildi!");
        setIsEditing(false);
      } else {
        setMessage("Hata: " + res.error);
      }
    } catch (err) {
      setMessage("Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  if (!isEditing && initialSelection) {
    return (
      <div style={{ marginTop: 24, padding: 20, background: "rgba(255,255,255,0.05)", borderRadius: 0, border: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
          <div>
            <h5 style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Yaptığınız Seçim</h5>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Bu numaralar düzenleme için iletildi.</p>
          </div>
          <button 
            onClick={() => setIsEditing(true)}
            style={{ padding: "6px 12px", borderRadius: 0, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Edit3 size={12} /> Düzenle
          </button>
        </div>
        <div style={{ padding: 16, background: "rgba(255,255,255,0.05)", borderRadius: 0, border: "1px dashed rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", fontSize: 14, lineHeight: 1.6, wordBreak: "break-word" }}>
          {initialSelection}
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 24, padding: 24, background: "rgba(255,255,255,0.05)", borderRadius: 0, border: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ marginBottom: 16 }}>
        <h5 style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Fotoğraf Seçimi Yapın</h5>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
          Lütfen Drive üzerinden seçtiğiniz fotoğrafların dosya numaralarını araya virgül koyarak yazınız.
          <span style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 6, fontWeight: 700 }}>⚠️ Toplam 30 adet fotoğraf seçmeniz gerekmektedir.</span>
          <span style={{ display: "block", color: "rgba(255,255,255,0.45)", fontSize: 11, marginTop: 4 }}>Örn: DSC_0124, DSC_0245, DSC_0567...</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <textarea
          value={selection}
          onChange={(e) => setSelection(e.target.value)}
          placeholder="Fotoğraf numaralarını buraya girin..."
          required
          style={{ width: "100%", minHeight: 120, padding: 16, background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 0, color: "#fff", fontSize: 14, outline: "none", transition: "all 0.2s", resize: "none" }}
          onFocus={(e) => e.target.style.borderColor = "rgba(255,255,255,0.3)"}
          onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
        />
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {message && <span style={{ fontSize: 12, color: message.includes("Hata") ? "rgba(255,255,255,0.6)" : "#fff", fontWeight: 600 }}>{message}</span>}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {initialSelection && (
              <button 
                type="button"
                onClick={() => setIsEditing(false)}
                style={{ background: "transparent", color: "rgba(255,255,255,0.4)", padding: "10px 16px", borderRadius: 0, fontSize: 13, border: "none", cursor: "pointer" }}
              >
                Vazgeç
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !selection.trim()}
              style={{ background: "#fff", color: "#000", padding: "10px 24px", borderRadius: 0, fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s", opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Kaydediliyor..." : <><Send size={14} /> Seçimi Kaydet</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
