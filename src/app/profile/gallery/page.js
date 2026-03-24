"use client";

import { useState, useEffect } from "react";
import { getClientGalleries, togglePhotoSelection, completeSelection } from "../gallery-actions";
import { getSession } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Heart, Folder } from "lucide-react";

export default function ClientGalleryPage() {
  const [galleries, setGalleries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    const sessionResponse = await fetch('/api/auth/session');
    const session = await sessionResponse.json();
    
    if (session?.user) {
      setUser(session.user);
      const res = await getClientGalleries(session.user.id);
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

  if (isLoading) {
    return <div className="min-h-screen pt-32 pb-20 px-6 max-w-6xl mx-auto flex items-center justify-center text-white">Yükleniyor...</div>;
  }

  return (
    <main className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-6xl mx-auto text-white">
        
        <div className="flex items-center gap-4 mb-8">
          <Link href="/profile" className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
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
          <div className="glass-panel p-16 rounded-3xl text-center border border-white/5 mt-8">
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
                <div key={gallery.id} className="glass-panel rounded-3xl p-6 md:p-10 border border-white/5">
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
                      
                      {gallery.reservation.workflowStatus === "SELECTION_PENDING" ? (
                        <button 
                          onClick={() => handleComplete(gallery)}
                          className="bg-white text-black px-6 py-3 rounded-xl font-bold tracking-tight hover:bg-white/90 transition-all flex items-center gap-2"
                        >
                          Seçimleri Gönder <CheckCircle size={18} />
                        </button>
                      ) : (
                        <div className="bg-green-500/20 text-green-400 border border-green-500/30 px-6 py-3 rounded-xl font-bold flex items-center gap-2">
                          <CheckCircle size={18} /> Seçimler İletildi
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {gallery.photos.map(photo => {
                      const isLocked = gallery.reservation.workflowStatus !== "SELECTION_PENDING";
                      return (
                        <div 
                          key={photo.id} 
                          onClick={() => !isLocked && handleToggle(photo, gallery)}
                          className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${
                            photo.isSelected ? "border-green-500 scale-[0.98] shadow-[0_0_20px_rgba(34,197,94,0.2)]" : "border-transparent hover:border-white/20"
                          } ${isLocked ? "cursor-default opacity-80" : ""}`}
                        >
                          <Image 
                            src={photo.url} 
                            alt={photo.originalName || "Foto"} 
                            fill 
                            className="object-cover"
                          />
                          <div className={`absolute inset-0 transition-opacity ${photo.isSelected ? "bg-green-500/10" : "bg-black/20 hover:bg-black/0"}`}></div>
                          
                          {/* Heart/Select Icon */}
                          <div className={`absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
                            photo.isSelected ? "bg-green-500 text-black scale-110" : "bg-black/50 text-white/50"
                          }`}>
                            <Heart size={16} fill={photo.isSelected ? "currentColor" : "none"} />
                          </div>
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
    </main>
  );
}
