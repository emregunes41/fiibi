"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CldUploadWidget } from "next-cloudinary";
import { UploadCloud, Image as ImageIcon, Trash2, ArrowLeft, Send, CheckCircle2, MessageSquare } from "lucide-react";
import { getReservationGallery, addPhotoToGallery, deletePhoto, toggleGalleryDelivery } from "../../../gallery-actions";
import Link from "next/link";
import Image from "next/image";

export default function GalleryManagementPage() {
  const params = useParams();
  const router = useRouter();
  const [gallery, setGallery] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadGallery = async () => {
    setIsLoading(true);
    const res = await getReservationGallery(params.id);
    if (res.success) {
      setGallery(res.gallery);
    }
    setIsLoading(false);
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
      loadGallery();
    }
  };

  const handleDelete = async (photoId) => {
    if (confirm("Bu fotoğrafı kalıcı olarak silmek istediğinize emin misiniz?")) {
      await deletePhoto(photoId);
      loadGallery();
    }
  };

  const handleDeliveryToggle = async () => {
    const isDelivered = !gallery.isDelivered;
    const confirmMsg = isDelivered 
      ? "Galeri müşteriye açılsın mı? Müşteri panelinden görebilecek." 
      : "Galeri müşteriden gizlensin mi?";
      
    if (confirm(confirmMsg)) {
      await toggleGalleryDelivery(gallery.id, isDelivered);
      loadGallery();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ImageIcon size={48} className="text-white/20 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Galeri Bulunamadı</h2>
          <p className="text-white/50">Bu rezervasyon için galeri oluşturulamadı.</p>
          <Link href="/admin/reservations" className="inline-block mt-6 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors">
            Geri Dön
          </Link>
        </div>
      </div>
    );
  }

  const selectedCount = gallery.photos.filter(p => p.isSelected).length;

  return (
    <div className="text-white min-h-screen bg-[#0a0a0a] pb-24">
      {/* Premium Header */}
      <div className="relative overflow-hidden mb-10 pb-8 pt-6 border-b border-white/5">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-6 flex items-start gap-6 relative z-10">
          <Link href="/admin/reservations" className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:scale-105 transition-all text-white/70 hover:text-white shadow-lg backdrop-blur-xl">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-white/50 tracking-widest uppercase mb-3 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
              Galeri Yönetimi
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white to-white/50">
              Fotoğraf Merkezi
            </h1>
            <p className="text-white/40 text-sm mt-3 flex items-center gap-2">
              Rezervasyon ID: <span className="font-mono text-xs bg-white/10 px-2 py-0.5 rounded-md text-white/70">{params.id.slice(0,12)}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sol Panel - Yükleme / Actions */}
        <div className="flex flex-col gap-6 lg:col-span-4 xl:col-span-3">
          
          {/* Upload Card */}
          <div className="bg-[#111] border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <h3 className="font-black text-lg mb-2 flex items-center gap-2 text-white">
              <UploadCloud size={20} className="text-blue-400" /> Yeni Fotoğraf
            </h3>
            <p className="text-white/40 text-xs mb-6 leading-relaxed">
              Müşterinize sunmak istediğiniz fotoğrafları sürükleyip bırakın. Sistem otomatik olarak kaliteyi bozmadan %80 sıkıştıracaktır.
            </p>
            
            <CldUploadWidget 
              uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ""} 
              signatureEndpoint="" 
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
              {({ open }) => {
                return (
                  <button 
                    onClick={() => open()} 
                    className="w-full py-10 px-4 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-white/5 hover:border-blue-400/50 transition-all cursor-pointer relative z-10 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]"
                  >
                    <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <UploadCloud size={26} className="text-blue-400" />
                    </div>
                    <span className="font-bold text-sm text-white/90">Yüklemek İçin Tıkla</span>
                    <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Maks. 1500 Dosya / 50 MB</span>
                  </button>
                );
              }}
            </CldUploadWidget>
          </div>

          {/* Delivery Card */}
          <div className="bg-[#111] border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
            <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-500 opacity-0 group-hover:opacity-100 ${gallery.isDelivered ? 'from-green-500/5 to-emerald-500/5' : 'from-purple-500/5 to-pink-500/5'}`}></div>
            
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-black text-lg flex items-center gap-2 text-white">
                <Send size={18} className={gallery.isDelivered ? "text-green-400" : "text-purple-400"} /> Yayına Al
              </h3>
              {gallery.isDelivered && (
                <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 rounded-md text-[10px] font-bold animate-pulse">YAYINDA</span>
              )}
            </div>
            
            <p className="text-white/40 text-xs mb-6 leading-relaxed">
              Fotoğraflar yüklendikten sonra "Müşteriye Aç" diyerek galeriyi erişilebilir yapın. Müşteriniz anında bir mail alacaktır.
            </p>
            
            <button 
              onClick={handleDeliveryToggle}
              className={`w-full py-4 rounded-2xl font-bold tracking-tight transition-all duration-300 flex items-center justify-center gap-2 relative z-10 shadow-xl overflow-hidden ${
                gallery.isDelivered 
                  ? "bg-white/10 text-white border border-white/20 hover:bg-white/20" 
                  : "bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:scale-[1.02]"
              }`}
            >
              {gallery.isDelivered ? (
                <>Erişimi Kapat <X size={18} /></>
              ) : (
                <>Müşteriye Aç <Send size={18} /></>
              )}
            </button>
            
            {gallery.isDelivered && selectedCount > 0 && (
               <div className="mt-5 p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                 <div>
                   <div className="text-[10px] text-white/40 font-bold uppercase mb-1">Seçim Durumu</div>
                   <div className="text-sm font-black text-white">{selectedCount} Fotoğraf Seçildi</div>
                 </div>
                 <CheckCircle2 size={24} className="text-green-400" />
               </div>
            )}
          </div>
          
        </div>

        {/* Sağ Panel - Gallery Grid */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col">
          <div className="flex items-center justify-between mb-6 px-2">
            <h3 className="text-xl font-black text-white flex items-center gap-3">
              Koleksiyon 
              <span className="bg-white/10 text-white/70 px-3 py-1 rounded-full text-sm">{gallery.photos.length} Görsel</span>
            </h3>
            {selectedCount > 0 && (
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-400 px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2">
                <CheckCircle2 size={14} /> Müşteri Seçimleri Tamam
              </div>
            )}
          </div>

          {gallery.photos.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-32 bg-[#111] border border-white/5 rounded-3xl relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 relative z-10 shadow-inner">
                <ImageIcon size={32} className="text-white/20" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 relative z-10">Burası Çok Issız</h3>
              <p className="text-white/40 max-w-sm relative z-10">Sol taraftaki yükleme alanını kullanarak bu rezervasyona ait fotoğrafları yüklemeye başlayabilirsiniz.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max">
              {gallery.photos.map((photo) => (
                <div key={photo.id} className="group relative aspect-square bg-[#0a0a0a] rounded-2xl overflow-hidden border border-white/10 shadow-lg hover:shadow-2xl hover:border-white/30 hover:scale-[1.02] transition-all duration-300">
                  <Image 
                    src={photo.url} 
                    alt={photo.originalName || "Fotoğraf"} 
                    fill 
                    className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Top Bar: Name & Delete */}
                  <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-[-10px] group-hover:translate-y-0">
                    <span className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-mono text-white/90 font-bold max-w-[70%] truncate shadow-sm border border-white/10">
                      {photo.originalName}
                    </span>
                    <button 
                      onClick={() => handleDelete(photo.id)}
                      className="bg-red-500/80 backdrop-blur-md text-white p-2 rounded-lg hover:bg-red-500 transition-colors shadow-lg"
                      title="Sil"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Bottom Bar: Selection & Notes */}
                  {photo.isSelected && (
                    <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col gap-2 transform transition-transform duration-300">
                      <div className="self-start bg-green-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-black shadow-[0_4px_15px_rgba(34,197,94,0.3)] flex items-center gap-1">
                        <CheckCircle2 size={12} /> SEÇİLDİ
                      </div>
                      
                      {photo.note && (
                        <div className="bg-black/80 backdrop-blur-xl text-white p-3 rounded-xl border border-white/20 shadow-2xl w-full">
                          <div className="flex items-center gap-1.5 text-blue-400 mb-1.5 opacity-90">
                            <MessageSquare size={12} className="fill-current" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Müşteri Notu</span>
                          </div>
                          <p className="text-xs leading-relaxed font-medium text-white/90 break-words line-clamp-3 group-hover:line-clamp-none transition-all">
                            {photo.note}
                          </p>
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
    </div>
  );
}
