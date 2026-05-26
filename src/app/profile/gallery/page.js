"use client";

import { useState, useEffect } from "react";
import { getClientGalleries, togglePhotoSelection, completeSelection } from "../gallery-actions";
import { getSession } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Heart, MessageSquare, X, Maximize2, FolderOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { savePhotoNote } from "../gallery-actions";
import { getAlbumModels } from "@/app/admin/core-actions";
import AlbumSelectionForm from "../AlbumSelectionForm";

export default function ClientGalleryPage() {
  const [galleries, setGalleries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [noteModal, setNoteModal] = useState({ isOpen: false, photo: null, note: "" });
  const [albumModels, setAlbumModels] = useState([]);
  const [showAlbumSelection, setShowAlbumSelection] = useState(null);
  
  // Lightbox State
  const [lightbox, setLightbox] = useState({ isOpen: false, galleryIndex: 0, photoIndex: 0 });

  const loadData = async () => {
    setIsLoading(true);
    const sessionResponse = await fetch('/api/auth/session');
    const session = await sessionResponse.json();
    
    if (session?.user) {
      setUser(session.user);
      const [res, modelsRes] = await Promise.all([getClientGalleries(), getAlbumModels()]);
      if (res.success) {
        setGalleries(res.galleries);
      }
      if (modelsRes) setAlbumModels(modelsRes);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightbox.isOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightbox]);

  const handleToggle = async (photo, gallery) => {
    if (gallery.reservation?.selectionLocked) {
      alert("Seçimler kilitlenmiştir. Değişiklik yapılamaz.");
      return;
    }

    const selectedCount = gallery.photos.filter(p => p.isSelected).length;
    if (!photo.isSelected && selectedCount >= gallery.selectionLimit) {
      alert(`Maksimum seçim limitine (${gallery.selectionLimit}) ulaştınız.`);
      return;
    }

    setGalleries(prev => prev.map(g => {
      if (g.id === gallery.id) {
        return {
          ...g,
          photos: g.photos.map(p => p.id === photo.id ? { ...p, isSelected: !p.isSelected } : p)
        };
      }
      return g;
    }));

    await togglePhotoSelection(photo.id, !photo.isSelected);
  };

  const handleComplete = async (gallery) => {
    const selectedPhotos = gallery.photos.filter(p => p.isSelected);
    if (selectedPhotos.length === 0) {
      alert("Lütfen en az 1 fotoğraf seçin.");
      return;
    }

    if (confirm(`Toplam ${selectedPhotos.length} fotoğraf seçtiniz. Seçimlerinizi fotoğrafçıya göndermek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
      setIsLoading(true);
      const names = selectedPhotos.map(p => p.originalName || `IMG_${p.photoNumber}`);
      await completeSelection(gallery.id, gallery.reservationId, user.name, names);
      alert("Seçimleriniz başarıyla iletildi! Şimdi albüm modelinizi seçebilirsiniz.");
      setIsLoading(false);
      setShowAlbumSelection(gallery.reservationId);
    }
  };

  const handleSaveNote = async () => {
    if (!noteModal.photo) return;
    const previousState = galleries;
    
    setGalleries(prev => prev.map(g => ({
      ...g,
      photos: g.photos.map(p => p.id === noteModal.photo.id ? { ...p, note: noteModal.note } : p)
    })));
    
    setNoteModal({ isOpen: false, photo: null, note: "" });
    
    const res = await savePhotoNote(noteModal.photo.id, noteModal.note);
    if (!res?.success) {
       alert("Not kaydedilemedi.");
       setGalleries(previousState);
    }
  };

  const openLightbox = (gIndex, pIndex) => {
    setLightbox({ isOpen: true, galleryIndex: gIndex, photoIndex: pIndex });
  };
  const closeLightbox = () => setLightbox({ ...lightbox, isOpen: false });
  
  const nextPhoto = () => {
    setLightbox(prev => {
      const gallery = galleries[prev.galleryIndex];
      const nextIdx = (prev.photoIndex + 1) % gallery.photos.length;
      return { ...prev, photoIndex: nextIdx };
    });
  };
  
  const prevPhoto = () => {
    setLightbox(prev => {
      const gallery = galleries[prev.galleryIndex];
      const prevIdx = (prev.photoIndex - 1 + gallery.photos.length) % gallery.photos.length;
      return { ...prev, photoIndex: prevIdx };
    });
  };

  if (isLoading) {
    return <div style={{ padding: "40px", color: "#000", fontWeight: 700, fontSize: "0.8rem", textAlign: "center" }}>Yükleniyor...</div>;
  }

  return (
    <div>
      {/* KESİNLİKLE BEYAZ TEMALI GALERİ KONTEYNERİ */}
      <div style={{ background: "#ffffff", color: "#000", padding: "30px", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 4, minHeight: "80vh" }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "30px", borderBottom: "1px solid rgba(0,0,0,0.06)", paddingBottom: "20px" }}>
          <Link 
            href="/profile" 
            style={{ 
              padding: "8px", background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)", 
              borderRadius: 4, color: "#000", display: "flex", alignItems: "center", justifyContent: "center" 
            }}
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 style={{ fontSize: "1.2rem", fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>Fotoğraf Galerilerim</h1>
            <p style={{ fontSize: "0.65rem", color: "rgba(0,0,0,0.4)", margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 800 }}>
              SEÇİME HAZIR ALBÜMLER
            </p>
          </div>
        </div>

        {galleries.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: 4 }}>
            <FolderOpen size={32} style={{ color: "rgba(0,0,0,0.2)", margin: "0 auto 10px" }} />
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "rgba(0,0,0,0.6)", marginBottom: 4 }}>Henüz Hazır Bir Galeri Yok</div>
            <div style={{ fontSize: "0.65rem", color: "rgba(0,0,0,0.4)" }}>Fotoğraflarınız yüklenip müşteriye açıldığında burada görünecektir.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
            {galleries.map((gallery, gIndex) => {
              const selectedCount = gallery.photos.filter(p => p.isSelected).length;
              const isLocked = gallery.reservation.selectionLocked;

              return (
                <div key={gallery.id} style={{ background: "rgba(0,0,0,0.01)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 4, padding: "20px" }}>
                  
                  {/* Galeri Kontrol Paneli */}
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "20px", borderBottom: "1px solid rgba(0,0,0,0.06)", paddingBottom: "20px", marginBottom: "20px" }}>
                    <div>
                      <h2 style={{ fontSize: "1rem", fontWeight: 800, margin: "0 0 4px", color: "#000" }}>{gallery.reservation.packages.map(p => p.name).join(", ")}</h2>
                      <div style={{ fontSize: "0.65rem", color: "rgba(0,0,0,0.5)", fontWeight: 700 }}>
                        {new Date(gallery.reservation.eventDate).toLocaleDateString("tr-TR")} Çekimi
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(0,0,0,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
                          Seçim Limiti
                        </div>
                        <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#000" }}>
                          {selectedCount} <span style={{ color: "rgba(0,0,0,0.3)", fontSize: "0.9rem" }}>/ {gallery.selectionLimit}</span>
                        </div>
                      </div>
                      
                      {!isLocked ? (
                        <button 
                          onClick={() => handleComplete(gallery)}
                          style={{ 
                            padding: "10px 16px", borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                            fontSize: "0.75rem", fontWeight: 800, border: "none",
                            background: selectedCount > 0 ? "#2563eb" : "rgba(0,0,0,0.06)",
                            color: selectedCount > 0 ? "#ffffff" : "rgba(0,0,0,0.4)"
                          }}
                        >
                          <span style={{ color: selectedCount > 0 ? "#ffffff" : "inherit" }}>
                            {selectedCount > 0 ? "Seçimleri Gönder" : "Seçim Yapılmadı"}
                          </span> 
                          <CheckCircle size={14} style={{ color: selectedCount > 0 ? "#ffffff" : "inherit" }} />
                        </button>
                      ) : (
                        <div style={{ 
                          padding: "10px 16px", borderRadius: 4, display: "flex", alignItems: "center", gap: 8,
                          fontSize: "0.75rem", fontWeight: 800, background: "rgba(74,222,128,0.1)", color: "#16a34a", border: "1px solid rgba(74,222,128,0.3)" 
                        }}>
                          <CheckCircle size={14} /> Seçiminiz İşleme Alındı
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fotoğraf Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "10px" }}>
                    {gallery.photos.map((photo, pIndex) => (
                      <div 
                        key={photo.id}
                        style={{ 
                          position: "relative", aspectRatio: "1/1", background: "#f8f9fa", 
                          border: photo.isSelected ? "2px solid #000" : "1px solid rgba(0,0,0,0.1)", 
                          borderRadius: 4, overflow: "hidden", cursor: isLocked ? "default" : "pointer",
                          opacity: isLocked ? 0.7 : 1
                        }}
                      >
                        <Image 
                          src={photo.url} 
                          alt={photo.originalName || "Fotoğraf"} 
                          fill 
                          style={{ objectFit: "cover", opacity: photo.isSelected ? 0.9 : 1, transition: "opacity 0.2s" }}
                          sizes="(max-width: 768px) 50vw, 25vw"
                          onClick={() => !isLocked && handleToggle(photo, gallery)}
                        />
                        
                        {/* Seçim İkonu */}
                        <div 
                          onClick={() => !isLocked && handleToggle(photo, gallery)}
                          style={{ 
                            position: "absolute", top: 6, left: 6, width: 24, height: 24, borderRadius: 2, 
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: photo.isSelected ? "#000" : "rgba(255,255,255,0.7)",
                            color: photo.isSelected ? "#fff" : "rgba(0,0,0,0.5)",
                            border: photo.isSelected ? "none" : "1px solid rgba(0,0,0,0.15)",
                            zIndex: 10
                          }}
                        >
                          <Heart size={12} fill={photo.isSelected ? "currentColor" : "none"} />
                        </div>

                        {/* Büyütme Butonu */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); openLightbox(gIndex, pIndex); }}
                          style={{ 
                            position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: 2, 
                            background: "rgba(255,255,255,0.7)", border: "1px solid rgba(0,0,0,0.15)", color: "#000",
                            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10
                          }}
                          title="Büyük Göster"
                        >
                          <Maximize2 size={12} />
                        </button>

                        {/* Not Ekleme (Sadece Seçiliyse) */}
                        {photo.isSelected && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setNoteModal({ isOpen: true, photo, note: photo.note || "" }); }}
                            style={{ 
                              position: "absolute", bottom: 6, right: 6, width: 24, height: 24, borderRadius: 2, 
                              background: photo.note ? "#000" : "rgba(255,255,255,0.7)", border: photo.note ? "none" : "1px solid rgba(0,0,0,0.15)", 
                              color: photo.note ? "#fff" : "#000", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10
                            }}
                            title="Not Ekle/Düzenle"
                          >
                            <MessageSquare size={12} fill={photo.note ? "currentColor" : "none"} />
                          </button>
                        )}
                        
                        {/* Not Görüntüleyici */}
                        {photo.note && (
                          <div style={{ 
                            position: "absolute", bottom: 6, left: 6, right: 36, background: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)",
                            padding: "4px 6px", borderRadius: 2, fontSize: "0.55rem", color: "#000", border: "1px solid rgba(0,0,0,0.1)",
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", pointerEvents: "none"
                          }}>
                            <span style={{ color: "rgba(0,0,0,0.5)" }}>NOT:</span> {photo.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* LIGHTBOX (Tam Ekran Gösterici) */}
      {lightbox.isOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.95)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          
          <button 
            onClick={closeLightbox}
            style={{ position: "absolute", top: 90, right: 20, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: 10, borderRadius: 4, cursor: "pointer", zIndex: 10001 }}
          >
            <X size={20} />
          </button>

          <button 
            onClick={prevPhoto}
            style={{ position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: 14, borderRadius: 4, cursor: "pointer", zIndex: 10001 }}
          >
            <ChevronLeft size={24} />
          </button>

          <button 
            onClick={nextPhoto}
            style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: 14, borderRadius: 4, cursor: "pointer", zIndex: 10001 }}
          >
            <ChevronRight size={24} />
          </button>

          {/* Current Photo */}
          <div style={{ position: "relative", width: "90vw", height: "90vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
             <Image 
               src={galleries[lightbox.galleryIndex].photos[lightbox.photoIndex].url}
               alt="Büyük Görünüm"
               fill
               style={{ objectFit: "contain" }}
               quality={90}
             />
             
             <style>{`
               button.lightbox-selected-btn, button.lightbox-selected-btn span, button.lightbox-selected-btn svg {
                 color: #ffffff !important;
               }
               button.lightbox-unselected-btn, button.lightbox-unselected-btn span, button.lightbox-unselected-btn svg {
                 color: #000000 !important;
               }
             `}</style>
             <button 
               className={galleries[lightbox.galleryIndex].photos[lightbox.photoIndex].isSelected ? "lightbox-selected-btn" : "lightbox-unselected-btn"}
               onClick={(e) => {
                 e.stopPropagation();
                 if (!galleries[lightbox.galleryIndex].reservation.selectionLocked) {
                   handleToggle(galleries[lightbox.galleryIndex].photos[lightbox.photoIndex], galleries[lightbox.galleryIndex]);
                 }
               }}
               style={{
                 position: "absolute", bottom: 40, 
                 background: galleries[lightbox.galleryIndex].photos[lightbox.photoIndex].isSelected ? "#000000" : "rgba(255,255,255,0.9)",
                 border: "none", padding: "12px 24px", borderRadius: 4, 
                 display: "flex", alignItems: "center", gap: 8, fontSize: "0.9rem", fontWeight: 800, 
                 cursor: galleries[lightbox.galleryIndex].reservation.selectionLocked ? "default" : "pointer",
                 boxShadow: "0 4px 12px rgba(0,0,0,0.2)", zIndex: 10002
               }}
             >
               <Heart size={18} fill={galleries[lightbox.galleryIndex].photos[lightbox.photoIndex].isSelected ? "currentColor" : "none"} /> 
               <span>
                 {galleries[lightbox.galleryIndex].photos[lightbox.photoIndex].isSelected ? "Seçildi" : "Bu Fotoğrafı Seç"}
               </span>
             </button>
          </div>

          <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.6)", padding: "6px 14px", borderRadius: 4, color: "#fff", fontSize: "0.75rem", fontWeight: 700 }}>
             {lightbox.photoIndex + 1} / {galleries[lightbox.galleryIndex].photos.length}
          </div>
        </div>
      )}

      {/* NOT EKLEME MODALI */}
      {noteModal.isOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 4, width: "100%", maxWidth: 400, padding: 24, position: "relative", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <button 
              onClick={() => setNoteModal({ isOpen: false, photo: null, note: "" })}
              style={{ position: "absolute", top: 16, right: 16, background: "transparent", border: "none", color: "rgba(0,0,0,0.4)", cursor: "pointer" }}
            >
              <X size={16} />
            </button>
            <div style={{ fontSize: "1rem", fontWeight: 800, color: "#000", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <MessageSquare size={16} /> Fotoğraf Notu
            </div>
            <p style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.5)", marginBottom: 20 }}>
              Bu fotoğraf için fotoğrafçınıza özel bir not veya revizyon isteği bırakabilirsiniz.
            </p>
            <textarea
              value={noteModal.note}
              onChange={(e) => setNoteModal({ ...noteModal, note: e.target.value })}
              placeholder="Örn: Arka plandaki lekeyi silebilir misiniz?"
              style={{ 
                width: "100%", background: "#f8f9fa", border: "1px solid rgba(0,0,0,0.1)", 
                color: "#000", padding: 14, minHeight: 120, borderRadius: 4, outline: "none", fontSize: "0.8rem", marginBottom: 20, resize: "none"
              }}
            />
            <button
              onClick={handleSaveNote}
              style={{ 
                width: "100%", background: "#000", color: "#fff", border: "none", padding: "12px", 
                borderRadius: 4, fontWeight: 800, fontSize: "0.75rem", cursor: "pointer" 
              }}
            >
              Kaydet
            </button>
          </div>
        </div>
      )}

      {/* ALBÜM SEÇİM MODALI */}
      {showAlbumSelection && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, overflowY: "auto" }}>
          <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 4, width: "100%", maxWidth: 800, position: "relative", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <button 
              onClick={() => window.location.href = "/profile"}
              style={{ position: "absolute", top: 16, right: 16, background: "rgba(0,0,0,0.05)", border: "none", color: "#000", padding: 8, borderRadius: 4, cursor: "pointer", zIndex: 10 }}
            >
              <X size={16} />
            </button>
            <div style={{ padding: "10px 20px 20px 20px" }}>
              <AlbumSelectionForm 
                reservationId={showAlbumSelection}
                initialSelectedId=""
                models={albumModels}
                isLocked={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
