"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CldUploadWidget } from "next-cloudinary";
import { UploadCloud, Image as ImageIcon, Trash2, ArrowLeft, Send, Check } from "lucide-react";
import { getReservationGallery, addPhotoToGallery, deletePhoto, toggleGalleryDelivery } from "../../../gallery-actions";
import Link from "next/link";
import Image from "next/image";

export default function GalleryManagementPage() {
  const params = useParams();
  const router = useRouter();
  const [gallery, setGallery] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadGallery = async (background = false) => {
    if (!background) setIsLoading(true);
    const res = await getReservationGallery(params.id);
    if (res.success) {
      setGallery(res.gallery);
    }
    if (!background) setIsLoading(false);
  };

  useEffect(() => {
    if (params.id) {
      loadGallery();
    }
  }, [params.id]);

  const handleUploadSuccess = async (result) => {
    if (result.event === "success" && gallery) {
      const url = result.info.secure_url;
      const originalName = result.info.original_filename;
      await addPhotoToGallery(gallery.id, url, originalName);
      loadGallery(true); // Arka planda yenile, widget'i kapatma
    }
  };

  const handleDelete = async (photoId) => {
    if (confirm("Bu fotoğrafı kalıcı olarak silmek istediğinize emin misiniz?")) {
      await deletePhoto(photoId);
      loadGallery(true);
    }
  };

  const handleDeliveryToggle = async () => {
    const isDelivered = !gallery.isDelivered;
    const confirmMsg = isDelivered 
      ? "Galeri müşteriye açılsın mı? Müşteri panelinden görebilecek." 
      : "Galeri müşteriden gizlensin mi?";
      
    if (confirm(confirmMsg)) {
      await toggleGalleryDelivery(gallery.id, isDelivered);
      loadGallery(true);
    }
  };

  if (isLoading) {
    return (
      <div style={{ color: "#1a1a1a", padding: "40px", fontSize: "0.8rem", fontWeight: 700 }}>Yükleniyor...</div>
    );
  }

  if (!gallery) {
    return (
      <div style={{ color: "rgba(0,0,0,0.65)", padding: "40px", fontSize: "0.8rem", fontWeight: 700 }}>
        Galeri bulunamadı.
      </div>
    );
  }

  const selectedCount = gallery.photos.filter(p => p.isSelected).length;

  return (
    <div style={{ color: "#1a1a1a", paddingBottom: "100px" }}>
      
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "30px" }}>
        <Link 
          href="/admin/reservations" 
          style={{ 
            padding: "8px", background: "rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.1)", 
            borderRadius: 4, color: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center" 
          }}
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 style={{ fontSize: "1.2rem", fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>Galeri Yönetimi</h1>
          <p style={{ fontSize: "0.65rem", color: "rgba(0,0,0,0.65)", margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 800 }}>
            REZERVASYON: {params.id.slice(0, 12)}...
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* Kontrol Paneli */}
        <div style={{ 
          display: "flex", flexWrap: "wrap", gap: "10px", 
          padding: "16px", background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 0 
        }}>
          
          <div style={{ flex: "1 1 300px" }}>
            <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(0,0,0,0.65)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Fotoğraf Yükle</div>
            <CldUploadWidget 
              uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ""} 
              onSuccess={handleUploadSuccess}
              options={{ 
                multiple: true, 
                maxFiles: 1500,
                cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
                maxFileSize: 52428800,
                maxImageFileSize: 52428800,
                maxVideoFileSize: 125829120,
                clientAllowedFormats: ["jpg", "jpeg", "png", "webp", "heic", "avif"],
                maxImageWidth: 1400,
                maxImageHeight: 1400
              }}
            >
              {({ open }) => (
                <button 
                  onClick={() => open()} 
                  style={{ 
                    width: "100%", padding: "12px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", 
                    color: "#60a5fa", borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    fontSize: "0.75rem", fontWeight: 800
                  }}
                >
                  <UploadCloud size={16} /> Buraya Tıkla Veya Sürükle (Max 1500)
                </button>
              )}
            </CldUploadWidget>
          </div>

          <div style={{ flex: "1 1 300px" }}>
            <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(0,0,0,0.65)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Müşteri Erişimi</div>
            <button 
              onClick={handleDeliveryToggle}
              style={{ 
                width: "100%", padding: "12px", borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                fontSize: "0.75rem", fontWeight: 800,
                background: gallery.isDelivered ? "rgba(74,222,128,0.15)" : "rgba(0,0,0,0.06)",
                border: gallery.isDelivered ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(0,0,0,0.12)",
                color: gallery.isDelivered ? "#4ade80" : "#fff"
              }}
            >
              <Send size={16} /> {gallery.isDelivered ? "Yayında (Erişimi Kapat)" : "Müşteriye Aç (Mail Gönderilir)"}
            </button>
          </div>

        </div>

        {/* Galeri İstatistikleri */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(0,0,0,0.06)", paddingBottom: "10px" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
            Koleksiyon ({gallery.photos.length})
          </div>
          {selectedCount > 0 && (
            <div style={{ fontSize: "0.65rem", fontWeight: 800, background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)", padding: "4px 8px", borderRadius: 4 }}>
              ✅ {selectedCount} Fotoğraf Seçildi
            </div>
          )}
        </div>

        {/* Fotoğraflar */}
        {gallery.photos.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: 0 }}>
            <ImageIcon size={32} style={{ color: "rgba(0,0,0,0.65)", margin: "0 auto 10px" }} />
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "rgba(0,0,0,0.65)" }}>Henüz hiç fotoğraf yüklenmedi.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
            {gallery.photos.map((photo) => (
              <div key={photo.id} style={{ 
                position: "relative", aspectRatio: "1/1", background: "#ffffff", 
                border: "1px solid rgba(0,0,0,0.1)", borderRadius: 0, overflow: "hidden" 
              }}>
                <Image 
                  src={photo.url} 
                  alt={photo.originalName || "Fotoğraf"} 
                  fill 
                  style={{ objectFit: "cover", opacity: 0.9 }}
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                
                {/* Üst Bar: İsim & Silme */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "6px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)" }}>
                  <span style={{ 
                    background: "rgba(0,0,0,0.6)", padding: "2px 6px", borderRadius: 2, 
                    fontSize: "0.55rem", fontWeight: 700, color: "rgba(0,0,0,0.8)", 
                    maxWidth: "70%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", border: "1px solid rgba(0,0,0,0.1)"
                  }}>
                    {photo.originalName}
                  </span>
                  <button 
                    onClick={() => handleDelete(photo.id)}
                    style={{ 
                      background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444", 
                      padding: "4px", borderRadius: 2, cursor: "pointer", display: "flex" 
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {/* Alt Bar: Seçim Durumu ve Notlar */}
                {(photo.isSelected || photo.note) && (
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "6px", display: "flex", flexDirection: "column", gap: "4px", background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)" }}>
                    {photo.isSelected && (
                      <span style={{ 
                        alignSelf: "flex-start", background: "rgba(74,222,128,0.2)", border: "1px solid rgba(74,222,128,0.4)", 
                        color: "#4ade80", fontSize: "0.55rem", fontWeight: 900, padding: "2px 6px", borderRadius: 2 
                      }}>
                        SEÇİLDİ
                      </span>
                    )}
                    {photo.note && (
                      <div style={{ 
                        background: "rgba(0,0,0,0.1)", backdropFilter: "blur(4px)", border: "1px solid rgba(0,0,0,0.15)", 
                        padding: "6px", borderRadius: 2, fontSize: "0.6rem", color: "#1a1a1a", fontWeight: 600, lineHeight: 1.4,
                        maxHeight: "60px", overflowY: "auto"
                      }}>
                        <span style={{ color: "rgba(0,0,0,0.65)", fontWeight: 800, display: "block", marginBottom: 2, fontSize: "0.55rem" }}>NOT:</span>
                        {photo.note}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
