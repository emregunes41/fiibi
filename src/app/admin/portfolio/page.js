"use client";

import { useState, useEffect } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, Image as ImageIcon, Trash2, Plus, RefreshCw, Folder, ArrowLeft } from "lucide-react";
import { 
  getPortfolioCategories, 
  createPortfolioCategory, 
  deletePortfolioCategory,
  addPhotoToPortfolio,
  deletePortfolioPhoto
} from "../portfolio-actions";
import Image from "next/image";

export default function PortfolioAdminPage() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCatName, setNewCatName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false); // Header'daki input için
  const [errorMsg, setErrorMsg] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState(null);

  const totalPhotos = categories.reduce((acc, cat) => acc + (cat.photos?.length || 0), 0);
  const activeCategory = categories.find(c => c.id === activeCategoryId);

  const loadCategories = async () => {
    const res = await getPortfolioCategories();
    if (res.success) {
      setCategories(res.categories);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    
    setIsCreating(true);
    setErrorMsg("");
    const res = await createPortfolioCategory(newCatName);
    
    if (res.success) {
      setNewCatName("");
      loadCategories();
    } else {
      setErrorMsg(res.error);
    }
    setIsCreating(false);
  };

  const handleDeleteCategory = async (id, name) => {
    if (confirm(`'${name}' konseptini ve içindeki tüm fotoğrafları silmek istediğinize emin misiniz?`)) {
      await deletePortfolioCategory(id);
      loadCategories();
    }
  };

  const handleUploadSuccess = async (result, categoryId) => {
    if (result.event === "success") {
      const url = result.info.secure_url;
      const publicId = result.info.public_id;
      await addPhotoToPortfolio(categoryId, url, publicId);
      loadCategories();
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (confirm("Bu fotoğrafı portfolyodan kaldırmak istediğinize emin misiniz?")) {
      await deletePortfolioPhoto(photoId);
      loadCategories();
    }
  };

  if (isLoading) {
    return (
      <div className="text-white flex items-center justify-center p-20 gap-3">
        <RefreshCw className="animate-spin text-white/50" /> Yükleniyor...
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto min-h-[80vh] flex flex-col gap-6">
      {/* 
          ### PRO STUDIO HEADER (Breadcrumb Style)
      */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-6 mb-2">
        <div className="flex items-center gap-3 text-sm font-medium tracking-tight">
          <span className="text-white/40">Portfolio Admin</span>
          <span className="text-white/20">/</span>
          <span className="text-white font-bold">{activeCategory ? activeCategory.name : "Koleksiyonlar"}</span>
          <span className="text-white/10 ml-2 px-2 py-0.5 bg-white/5 rounded-md text-[10px] font-black tracking-widest uppercase">
            {activeCategory ? `${activeCategory.photos?.length || 0} GÖRSEL` : `${categories.length} KONSEPT`}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <AnimatePresence mode="wait">
            {!activeCategoryId ? (
              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-2"
              >
                {isAddingNew ? (
                  <form onSubmit={handleCreateCategory} className="flex items-center gap-2">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Yeni Konsept İsmi..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      onBlur={() => !newCatName && setIsAddingNew(false)}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-white/20 transition-all w-48 font-medium"
                    />
                    <button type="submit" disabled={isCreating} className="bg-white text-black px-3 py-1.5 rounded-lg text-xs font-black hover:bg-white/90 disabled:opacity-50">
                      {isCreating ? <RefreshCw className="animate-spin" size={12} /> : "EKLE"}
                    </button>
                    <button type="button" onClick={() => setIsAddingNew(false)} className="p-1.5 text-white/40 hover:text-white"><Plus className="rotate-45" size={16} /></button>
                  </form>
                ) : (
                  <button 
                    onClick={() => setIsAddingNew(true)}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
                  >
                    <Plus size={14} /> YENİ KONSEPT
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-2"
              >
                <button 
                  onClick={() => setActiveCategoryId(null)}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
                >
                  <ArrowLeft size={14} /> KOLEKSİYONLARA DÖN
                </button>

                <div className="h-4 w-[1px] bg-white/10 mx-1"></div>

                <CldUploadWidget 
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ""} 
                  onSuccess={(res) => handleUploadSuccess(res, activeCategory.id)}
                  options={{ multiple: true, cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME }}
                >
                  {({ open }) => (
                    <button onClick={() => open()} className="flex items-center gap-2 bg-white text-black hover:bg-white/90 px-4 py-1.5 rounded-lg text-xs font-bold transition-all">
                      <UploadCloud size={14} /> GÖRSEL YÜKLE
                    </button>
                  )}
                </CldUploadWidget>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button onClick={() => loadCategories()} className="p-2 text-white/30 hover:text-white transition-colors" title="Yenile">
            <RefreshCw size={14} className={isLoading ? "animate-spin text-white" : ""} />
          </button>
        </div>
      </div>

      {errorMsg && <p className="text-red-500 text-[10px] font-bold text-center bg-red-500/5 py-2 rounded-lg border border-red-500/10 mb-4 uppercase tracking-widest">{errorMsg}</p>}

      {/* 
          ### MAIN CONTENT AREA
      */}
      <AnimatePresence mode="wait">
        {!activeCategory ? (
          /* COLLECTIONS GRID (Minimalist Squares) */
          <motion.div 
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
          >
            {categories.map((category) => (
              <motion.div 
                key={category.id}
                whileHover={{ y: -4 }}
                className="group relative cursor-pointer"
                onClick={() => setActiveCategoryId(category.id)}
              >
                {/* Square Container */}
                <div className="aspect-square bg-white/[0.03] border border-white/5 rounded-xl overflow-hidden mb-3 transition-colors group-hover:border-white/20">
                  {category.photos?.[0] ? (
                    <Image 
                      src={category.photos[0].url} 
                      alt={category.name} 
                      fill 
                      className="object-cover opacity-60 group-hover:opacity-100 transition-all duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/5">
                      <ImageIcon size={40} strokeWidth={1} />
                      <span className="text-[10px] mt-2 font-bold tracking-widest">BOŞ</span>
                    </div>
                  )}
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform flex items-center justify-between">
                    <span className="text-[10px] font-black text-white/70">{category.photos?.length || 0} PT</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category.id, category.name); }}
                      className="p-1.5 hover:bg-red-500 rounded-md transition-colors text-white/40 hover:text-white"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Subtitle */}
                <div className="px-1 text-left">
                  <h3 className="text-xs font-bold leading-tight truncate tracking-tight">{category.name}</h3>
                  <p className="text-[9px] text-white/20 font-mono mt-1 tracking-widest uppercase">/ {category.slug}</p>
                </div>
              </motion.div>
            ))}

            {/* Quick Add Placeholder */}
            <motion.button 
              onClick={() => setIsAddingNew(true)}
              whileHover={{ scale: 0.98 }}
              className="aspect-square bg-white/[0.01] border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-white/20 hover:text-white/40 hover:border-white/20 transition-all"
            >
              <Plus size={24} strokeWidth={1} />
              <span className="text-[10px] font-bold mt-2 tracking-widest uppercase">Yeni Ekle</span>
            </motion.button>
          </motion.div>
        ) : (
          /* PHOTOS DETAIL AREA */
          <motion.div 
            key="detail"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="flex flex-col"
          >
            {activeCategory.photos?.length === 0 ? (
              <div className="py-32 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                <UploadCloud size={48} className="text-white/5 mb-6" strokeWidth={1} />
                <h3 className="text-base font-bold mb-2">Bu albümde hiç görsel yok.</h3>
                <p className="text-xs text-white/30 mb-8 max-w-xs text-center leading-relaxed">
                  İşlerinizi sergilemek için hemen fotoğraf yüklemeye başlayın.
                </p>
                <CldUploadWidget 
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ""} 
                  onSuccess={(res) => handleUploadSuccess(res, activeCategory.id)}
                  options={{ multiple: true, cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME }}
                >
                  {({ open }) => (
                    <button onClick={() => open()} className="bg-white text-black px-10 py-3 rounded-lg text-sm font-bold active:scale-95 transition-all">
                      FOTOĞRAF YÜKLE
                    </button>
                  )}
                </CldUploadWidget>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-4">
                <AnimatePresence mode="popLayout">
                  {activeCategory.photos.map((photo, i) => (
                    <motion.div 
                      key={photo.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      whileHover={{ scale: 1.05, zIndex: 10 }}
                      className="group relative aspect-square bg-white/[0.03] border border-white/5 rounded-lg overflow-hidden shadow-2xl"
                    >
                      <Image 
                        src={photo.url} 
                        alt="Portfolio photo" 
                        fill 
                        className="object-cover opacity-90 transition-opacity group-hover:opacity-100"
                      />
                      
                      {/* Discrete Trash Button */}
                      <button 
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="absolute top-2 right-2 bg-black/60 backdrop-blur-md p-1.5 rounded-md text-white/40 hover:text-red-500 hover:bg-black transition-all opacity-0 group-hover:opacity-100 shadow-xl"
                        title="Sil"
                      >
                        <Trash2 size={12} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
