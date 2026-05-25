"use client";

import { useState, useEffect } from "react";
import { getClientGalleries, togglePhotoSelection, completeSelection } from "../gallery-actions";
import { getSession } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Heart, Folder, MessageSquare, X } from "lucide-react";
import { savePhotoNote } from "../gallery-actions";

export default function ClientGalleryPage() {
  const [galleries, setGalleries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [noteModal, setNoteModal] = useState({ isOpen: false, photo: null, note: "" });

  const loadData = async () => {
    setIsLoading(true);
    const sessionResponse = await fetch('/api/auth/session');
    const session = await sessionResponse.json();
    
    if (session?.user) {
      setUser(session.user);
      const res = await getClientGalleries();
      if (res.success) {
        setGalleries(res.galleries);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggle = async (photo, gallery) => {
    // Limit check
    const selectedCount = gallery.photos.filter(p => p.isSelected).length;
    if (!photo.isSelected && selectedCount >= gallery.selectionLimit) {
      alert(`Maksimum seçim limitine (${gallery.selectionLimit}) ulaştınız.`);
      return;
    }

    // Optimizstic UI update
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
      alert("Seçimleriniz başarıyla iletildi!");
      window.location.href = "/profile";
    }
  };

  const handleSaveNote = async () => {
    if (!noteModal.photo) return;
    setIsLoading(true);
    await savePhotoNote(noteModal.photo.id, noteModal.note);
    
    // Update local state
    setGalleries(prev => prev.map(g => ({
      ...g,
      photos: g.photos.map(p => p.id === noteModal.photo.id ? { ...p, note: noteModal.note } : p)
    })));
    
    setNoteModal({ isOpen: false, photo: null, note: "" });
    setIsLoading(false);
  };

  if (isLoading) {
    return <div className="min-h-screen pt-32 pb-20 px-6 max-w-6xl mx-auto flex items-center justify-center text-white">Yükleniyor...</div>;
  }

  return (
    <main className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-6xl mx-auto text-white">
        
        <div className="flex items-center gap-4 mb-8">
          <Link href="/profile" className="p-3 bg-white/5 rounded-none hover:bg-white/10 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tighter">Fotoğraf Galerilerim</h1>
            <p className="text-white/50 text-sm mt-1">
              Seçime hazır olan albümlerinizi buradan görebilirsiniz.
            </p>
          </div>
        </div>

        {galleries.length === 0 ? (
          <div className="glass-panel p-16 rounded-none text-center border border-white/5 mt-8">
            <Folder size={48} className="text-white/10 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Henüz Hazır Bir Galeri Yok</h3>
            <p className="text-white/40">Fotoğraflarınız düzenlenip sisteme yüklendiğinde burada görünecektir.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-16">
            {galleries.map(gallery => {
              const selectedCount = gallery.photos.filter(p => p.isSelected).length;
              const remainingCount = gallery.selectionLimit - selectedCount;

              return (
                <div key={gallery.id} className="glass-panel rounded-none p-6 md:p-10 border border-white/5">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 border-b border-white/10 pb-8">
                    <div>
                      <h2 className="text-2xl font-black mb-2">{gallery.reservation.packages.map(p => p.name).join(", ")}</h2>
                      <p className="text-white/50 text-sm">Çekim Tarihi: {new Date(gallery.reservation.eventDate).toLocaleDateString("tr-TR")}</p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Seçim Limiti</p>
                        <p className="text-xl font-black">{selectedCount} <span className="text-white/30">/ {gallery.selectionLimit}</span></p>
                      </div>
                      
                      {!gallery.reservation.selectionLocked ? (
                        <button 
                          onClick={() => handleComplete(gallery)}
                          className="bg-white text-black px-6 py-3 rounded-none font-bold tracking-tight hover:bg-white/90 transition-all flex items-center gap-2"
                        >
                          {selectedCount > 0 ? "Seçimleri Güncelle" : "Seçimleri Gönder"} <CheckCircle size={18} />
                        </button>
                      ) : (
                        <div className="bg-white/10 text-white/70 border border-white/15 px-6 py-3 rounded-none font-bold flex items-center gap-2">
                          <CheckCircle size={18} /> Seçiminiz İşleme Alındı
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {gallery.photos.map(photo => {
                      const isLocked = gallery.reservation.selectionLocked;
                      return (
                        <div 
                          key={photo.id} 
                          onClick={() => !isLocked && handleToggle(photo, gallery)}
                          className={`relative aspect-square rounded-none overflow-hidden cursor-pointer border-2 transition-all ${
                            photo.isSelected ? "border-white/30 scale-[0.98] shadow-[0_0_20px_rgba(0,0,0,0.08)]" : "border-transparent hover:border-white/20"
                          } ${isLocked ? "cursor-default opacity-80" : ""}`}
                        >
                          <Image 
                            src={photo.url} 
                            alt={photo.originalName || "Foto"} 
                            fill 
                            className="object-cover"
                          />
                          <div className={`absolute inset-0 transition-opacity ${photo.isSelected ? "bg-white/5" : "bg-black/20 hover:bg-black/0"}`}></div>
                          
                          {/* Heart/Select Icon */}
                          <div className={`absolute bottom-3 right-3 w-8 h-8 rounded-none flex items-center justify-center backdrop-blur-md transition-all ${
                            photo.isSelected ? "bg-white text-black scale-110" : "bg-black/50 text-white/50"
                          }`}>
                            <Heart size={16} fill={photo.isSelected ? "currentColor" : "none"} />
                          </div>

                          {/* Note Icon for Selected Photos */}
                          {photo.isSelected && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setNoteModal({ isOpen: true, photo, note: photo.note || "" });
                              }}
                              className={`absolute top-3 right-3 w-8 h-8 rounded-none flex items-center justify-center backdrop-blur-md transition-all border border-white/20 hover:bg-white hover:text-black ${
                                photo.note ? "bg-white text-black" : "bg-black/50 text-white"
                              }`}
                              title={photo.note ? "Notu Düzenle" : "Not Ekle"}
                            >
                              <MessageSquare size={14} />
                            </button>
                          )}
                          
                          {/* Note Indicator */}
                          {photo.note && (
                            <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md px-2 py-1 rounded-none text-[10px] text-white/90 max-w-[70%] truncate border border-white/10">
                              💬 {photo.note}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Note Modal */}
      {noteModal.isOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 p-6 w-full max-w-md relative">
            <button 
              onClick={() => setNoteModal({ isOpen: false, photo: null, note: "" })}
              className="absolute top-4 right-4 text-white/50 hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <MessageSquare size={18} /> Fotoğraf Notu
            </h3>
            <p className="text-white/50 text-sm mb-6">
              Bu fotoğraf için fotoğrafçınıza iletmek istediğiniz özel bir not veya düzeltme isteği varsa buraya yazabilirsiniz.
            </p>
            <textarea
              value={noteModal.note}
              onChange={(e) => setNoteModal({ ...noteModal, note: e.target.value })}
              placeholder="Örn: Arka plandaki kişiyi silebilir misiniz?"
              className="w-full bg-white/5 border border-white/10 text-white p-4 h-32 focus:outline-none focus:border-white/30 mb-6 resize-none"
            />
            <button
              onClick={handleSaveNote}
              className="w-full bg-white text-black font-bold py-3 hover:bg-white/90 transition-colors"
            >
              Notu Kaydet
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
