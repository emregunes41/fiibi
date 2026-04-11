"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CldUploadWidget } from "next-cloudinary";
import { UploadCloud, Image as ImageIcon, Trash2, ArrowLeft, Send } from "lucide-react";
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
    return <div className="text-white p-10">Yükleniyor...</div>;
  }

  if (!gallery) {
    return <div className="text-white p-10">Galeri bulunamadı.</div>;
  }

  return (
    <div className="text-white">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/reservations" className="p-3 bg-white/5 rounded-none hover:bg-white/10 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-black tracking-tighter">Galeri Yönetimi</h1>
          <p className="text-white/50 text-sm mt-1">
            Rezarvasyon ID: <span className="font-mono text-xs">{params.id}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sol Panel - Yükleme / Actions */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          <div className="glass-panel p-6 rounded-none">
            <h3 className="font-black text-lg mb-4 flex items-center gap-2">
              <UploadCloud size={18} /> Fotoğraf Ekle
            </h3>
            <p className="text-white/40 text-xs mb-6">
              Sadece dış çekimler veya seçime sunacağınız orijinal fotoğrafları yükleyin. Cloudinary fotoğrafları filigranla veya optimize ederek saklayacaktır. Orijinal isimler korunur.
            </p>
            
            <CldUploadWidget 
              uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ""} 
              signatureEndpoint="" // Not needed for unsigned
              onSuccess={handleUploadSuccess}
              options={{ 
                multiple: true, 
                maxFiles: 100,
                cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
              }}
            >
              {({ open }) => {
                return (
                  <button 
                    onClick={() => open()} 
                    className="w-full py-4 border-2 border-dashed border-white/20 rounded-none flex flex-col items-center justify-center gap-2 hover:bg-white/5 hover:border-white/40 transition-all cursor-pointer"
                  >
                    <UploadCloud size={24} className="text-white/50" />
                    <span className="font-bold text-sm">Buraya Tıkla veya Sürükle</span>
                  </button>
                );
              }}
            </CldUploadWidget>
          </div>

          <div className="glass-panel p-6 rounded-none">
            <h3 className="font-black text-lg mb-4 flex items-center gap-2">
              <Send size={18} /> Yayına Al
            </h3>
            <p className="text-white/40 text-xs mb-6">
              Fotoğrafları yükledikten sonra "Müşteriye Aç" dediğinizde çift profil sayfasından seçim yapabilecektir.
            </p>
            <button 
              onClick={handleDeliveryToggle}
              className={`w-full py-3 rounded-none font-bold tracking-tight transition-all flex items-center justify-center gap-2 ${
                gallery.isDelivered 
                  ? "bg-red-500 text-white hover:bg-red-600" 
                  : "bg-white text-black hover:bg-green-400"
              }`}
            >
              {gallery.isDelivered ? "Erişimi Kapat" : "Müşteriye Aç"}
            </button>
            {gallery.isDelivered && (
              <p className="text-xs text-center text-white/70 font-bold mt-4">
                Yayında (Seçime Açık)
              </p>
            )}
          </div>
        </div>

        {/* Sağ Panel - Gallery Grid */}
        <div className="lg:col-span-3 glass-panel p-8 rounded-none">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black">Yüklenen Fotoğraflar ({gallery.photos.length})</h3>
          </div>

          {gallery.photos.length === 0 ? (
            <div className="text-center py-20 border border-white/5 rounded-none bg-white/5">
              <ImageIcon size={48} className="text-white/10 mx-auto mb-4" />
              <p className="text-white/40">Henüz hiç fotoğraf yüklenmemiş.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.photos.map((photo) => (
                <div key={photo.id} className="relative group aspect-square bg-black rounded-none overflow-hidden border border-white/10">
                  <Image 
                    src={photo.url} 
                    alt={photo.originalName || "Fotoğraf"} 
                    fill 
                    className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  {/* Etiketler ve originalName */}
                  <div className="absolute top-2 left-2 right-2 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-black/80 backdrop-blur-md px-2 py-1 rounded-none text-[10px] font-mono outline-none text-white/70 font-bold max-w-[70%] truncate">
                      {photo.originalName}
                    </span>
                    <button 
                      onClick={() => handleDelete(photo.id)}
                      className="bg-red-500/80 text-white p-1.5 rounded-none hover:bg-red-500 transition-colors"
                      title="Sil"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {photo.isSelected && (
                    <div className="absolute bottom-2 left-2 bg-white text-black px-2 py-1 rounded-none text-[10px] font-bold">
                      Seçildi
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
