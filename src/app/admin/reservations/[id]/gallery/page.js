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
    <div className="text-slate-900 min-h-screen bg-slate-50 pb-24 font-sans">
      {/* Premium Header - Light Theme */}
      <div className="bg-white border-b border-slate-200 mb-10 pb-8 pt-8 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex items-start gap-6 relative z-10">
          <Link href="/admin/reservations" className="p-3 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-slate-100 hover:scale-105 transition-all text-slate-500 hover:text-slate-900 shadow-sm">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 border border-purple-100 rounded-full text-[10px] font-bold text-purple-600 tracking-widest uppercase mb-3">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
              Galeri Yönetimi
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
              Fotoğraf Merkezi
            </h1>
            <p className="text-slate-500 text-sm mt-3 flex items-center gap-2 font-medium">
              Rezervasyon ID: <span className="font-mono text-xs bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-slate-600">{params.id.slice(0,12)}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sol Panel - Yükleme / Actions */}
        <div className="flex flex-col gap-6 lg:col-span-4 xl:col-span-3">
          
          {/* Upload Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            
            <h3 className="font-black text-lg mb-2 flex items-center gap-2 text-slate-900">
              <UploadCloud size={20} className="text-blue-500" /> Yeni Fotoğraf
            </h3>
            <p className="text-slate-500 text-xs mb-6 leading-relaxed font-medium">
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
                    className="w-full py-10 px-4 border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-blue-50 hover:border-blue-400 transition-all cursor-pointer relative z-10"
                  >
                    <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                      <UploadCloud size={26} className="text-blue-600" />
                    </div>
                    <span className="font-bold text-sm text-blue-900">Yüklemek İçin Tıkla</span>
                    <span className="text-[10px] text-blue-600/70 uppercase tracking-wider font-bold">Maks. 1500 Dosya / 50 MB</span>
                  </button>
                );
              }}
            </CldUploadWidget>
          </div>

          {/* Delivery Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-black text-lg flex items-center gap-2 text-slate-900">
                <Send size={18} className={gallery.isDelivered ? "text-green-500" : "text-purple-500"} /> Yayına Al
              </h3>
              {gallery.isDelivered && (
                <span className="bg-green-100 text-green-700 border border-green-200 px-2 py-1 rounded-md text-[10px] font-bold animate-pulse">YAYINDA</span>
              )}
            </div>
            
            <p className="text-slate-500 text-xs mb-6 leading-relaxed font-medium">
              Fotoğraflar yüklendikten sonra "Müşteriye Aç" diyerek galeriyi erişilebilir yapın. Müşteriniz anında bir mail alacaktır.
            </p>
            
            <button 
              onClick={handleDeliveryToggle}
              className={`w-full py-4 rounded-2xl font-bold tracking-tight transition-all duration-300 flex items-center justify-center gap-2 relative z-10 overflow-hidden ${
                gallery.isDelivered 
                  ? "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200" 
                  : "bg-purple-600 text-white shadow-md hover:shadow-lg hover:bg-purple-700 hover:-translate-y-0.5"
              }`}
            >
              {gallery.isDelivered ? (
                <>Erişimi Kapat <X size={18} /></>
              ) : (
                <>Müşteriye Aç <Send size={18} /></>
              )}
            </button>
            
            {gallery.isDelivered && selectedCount > 0 && (
               <div className="mt-5 p-4 rounded-xl bg-green-50 border border-green-100 flex items-center justify-between">
                 <div>
                   <div className="text-[10px] text-green-600 font-bold uppercase mb-1">Seçim Durumu</div>
                   <div className="text-sm font-black text-green-800">{selectedCount} Fotoğraf Seçildi</div>
                 </div>
                 <CheckCircle2 size={24} className="text-green-500" />
               </div>
            )}
          </div>
          
        </div>

        {/* Sağ Panel - Gallery Grid */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col">
          <div className="flex items-center justify-between mb-6 px-2">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
              Koleksiyon 
              <span className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-sm">{gallery.photos.length} Görsel</span>
            </h3>
            {selectedCount > 0 && (
              <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-2 rounded-full text-xs font-bold shadow-sm flex items-center gap-2">
                <CheckCircle2 size={14} /> Müşteri Seçimleri Tamam
              </div>
            )}
          </div>

          {gallery.photos.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-32 bg-white border border-slate-200 border-dashed rounded-3xl">
              <div className="w-20 h-20 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 shadow-sm">
                <ImageIcon size={32} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Burası Çok Issız</h3>
              <p className="text-slate-500 max-w-sm font-medium">Sol taraftaki yükleme alanını kullanarak bu rezervasyona ait fotoğrafları yüklemeye başlayabilirsiniz.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 auto-rows-max">
              {gallery.photos.map((photo) => (
                <div key={photo.id} className="group relative aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                  <Image 
                    src={photo.url} 
                    alt={photo.originalName || "Fotoğraf"} 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                  {/* Subtle light gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Top Bar: Name & Delete */}
                  <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-y-2 group-hover:translate-y-0 z-10">
                    <span className="bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-lg text-[10px] font-mono text-slate-700 font-bold max-w-[70%] truncate shadow-sm border border-slate-200/50">
                      {photo.originalName}
                    </span>
                    <button 
                      onClick={() => handleDelete(photo.id)}
                      className="bg-white/95 backdrop-blur-sm text-red-500 p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm border border-slate-200/50"
                      title="Sil"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Bottom Bar: Selection & Notes */}
                  {photo.isSelected && (
                    <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col gap-2 transform transition-transform duration-300 z-10">
                      <div className="self-start bg-green-500 text-white px-3 py-1.5 rounded-lg text-[11px] font-black shadow-md flex items-center gap-1 border border-green-400">
                        <CheckCircle2 size={12} /> SEÇİLDİ
                      </div>
                      
                      {photo.note && (
                        <div className="bg-white/95 backdrop-blur-md text-slate-800 p-3 rounded-xl border border-slate-200 shadow-xl w-full">
                          <div className="flex items-center gap-1.5 text-blue-600 mb-1.5">
                            <MessageSquare size={12} className="fill-current" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Müşteri Notu</span>
                          </div>
                          <p className="text-xs leading-relaxed font-semibold text-slate-700 break-words line-clamp-3 group-hover:line-clamp-none transition-all">
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
