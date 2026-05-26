"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CldUploadWidget } from "next-cloudinary";
import { UploadCloud, Image as ImageIcon, Trash2, ArrowLeft, Send, Check, MessageSquare } from "lucide-react";
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <ImageIcon size={32} className="text-gray-300 mb-4" />
        <h2 className="text-lg font-medium text-gray-900 mb-1">Koleksiyon Bulunamadı</h2>
        <Link href="/admin/reservations" className="mt-4 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          &larr; Geri Dön
        </Link>
      </div>
    );
  }

  const selectedCount = gallery.photos.filter(p => p.isSelected).length;

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-gray-100 pb-24">
      
      {/* MINIMAL TOP NAVIGATION */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-6">
            <Link href="/admin/reservations" className="text-gray-400 hover:text-gray-900 transition-colors">
              <ArrowLeft size={20} strokeWidth={1.5} />
            </Link>
            <div className="h-6 w-[1px] bg-gray-200"></div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-gray-900">Müşteri Galerisi</h1>
              <p className="text-xs text-gray-500 mt-0.5">ID: {params.id.slice(0, 8)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
              {({ open }) => (
                <button 
                  onClick={() => open()} 
                  className="px-5 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 text-gray-700"
                >
                  <UploadCloud size={16} strokeWidth={2} />
                  Fotoğraf Yükle
                </button>
              )}
            </CldUploadWidget>

            <button 
              onClick={handleDeliveryToggle}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                gallery.isDelivered 
                  ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100" 
                  : "bg-gray-900 text-white hover:bg-black"
              }`}
            >
              {gallery.isDelivered ? (
                <>Yayında <Check size={16} strokeWidth={2} /></>
              ) : (
                <>Müşteriye Gönder <Send size={16} strokeWidth={2} /></>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="max-w-[1600px] mx-auto px-6 pt-10">
        
        {/* Gallery Stats Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2 text-gray-900">
              Koleksiyon <span className="text-gray-400 font-normal ml-2">{gallery.photos.length} görsel</span>
            </h2>
            <p className="text-sm text-gray-500">
              Müşteriniz bu sayfadaki görseller arasından seçim yapacaktır.
            </p>
          </div>
          
          {selectedCount > 0 && (
            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-semibold text-gray-700">
                <Check size={12} className="text-green-600" strokeWidth={3} />
                Müşteri {selectedCount} adet fotoğraf seçti
              </div>
            </div>
          )}
        </div>

        {/* PHOTO GRID */}
        {gallery.photos.length === 0 ? (
          <div className="mt-10 py-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
            <ImageIcon size={40} strokeWidth={1} className="text-gray-300 mb-4" />
            <h3 className="text-gray-900 font-medium mb-1">Galeri Boş</h3>
            <p className="text-gray-500 text-sm">Yukarıdaki butonu kullanarak fotoğraf yüklemeye başlayın.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {gallery.photos.map((photo) => (
              <div key={photo.id} className="group relative aspect-[4/5] bg-gray-50 overflow-hidden">
                <Image 
                  src={photo.url} 
                  alt={photo.originalName || "Fotoğraf"} 
                  fill 
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                />
                
                {/* Minimal Dark Overlay on Hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                
                {/* Delete Button (Top Right) */}
                <button 
                  onClick={() => handleDelete(photo.id)}
                  className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-red-500/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
                  title="Kalıcı Olarak Sil"
                >
                  <Trash2 size={14} strokeWidth={2} />
                </button>

                {/* File Name (Bottom Left) */}
                <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="text-[10px] text-white/80 font-mono tracking-wider truncate block">
                    {photo.originalName}
                  </span>
                </div>

                {/* Selection & Note Indicators */}
                {photo.isSelected && (
                  <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                    {/* Checkmark */}
                    <div className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center">
                      <Check size={14} className="text-gray-900" strokeWidth={3} />
                    </div>
                  </div>
                )}

                {/* Müşteri Notu Görüntüleme */}
                {photo.note && (
                  <div className="absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex items-center gap-1.5 mb-1 text-gray-400">
                      <MessageSquare size={10} className="fill-current" />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Müşteri Notu</span>
                    </div>
                    <p className="text-xs text-gray-900 font-medium leading-snug truncate group-hover:whitespace-normal group-hover:overflow-visible group-hover:max-h-32 overflow-y-auto">
                      {photo.note}
                    </p>
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
