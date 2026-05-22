"use client";

import { useState } from "react";
import { Link2, Plus, Edit2, Trash2, GripVertical, Check, ExternalLink } from "lucide-react";
import { createBioLink, updateBioLink, deleteBioLink, reorderBioLinks } from "../biolinks-actions";
import { toast } from "sonner";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const iconOptions = [
  { value: "link", label: "Bağlantı (Varsayılan)" },
  { value: "instagram", label: "Instagram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "calendar", label: "Takvim / Randevu" },
  { value: "map", label: "Harita / Konum" },
  { value: "image", label: "Portfolyo / Galeri" },
  { value: "shopping-bag", label: "Mağaza / Ürün" },
];

export default function BioLinksManager({ initialLinks }) {
  const [links, setLinks] = useState(initialLinks || []);
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ type: "external", title: "", url: "", icon: "link", isActive: true });
  const [loading, setLoading] = useState(false);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const items = Array.from(links);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setLinks(items);
    await reorderBioLinks(items);
  };

  const resetForm = () => {
    setFormData({ type: "external", title: "", url: "", icon: "link", isActive: true });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    const isExternal = formData.type === "external";
    if (!formData.title) return toast.error("Başlık zorunludur");
    if (isExternal && !formData.url) return toast.error("Dış linkler için URL zorunludur");
    
    // Ensure URL has http/https if it's not a relative path or mailto/tel
    let finalUrl = formData.url?.trim() || "";
    if (isExternal && finalUrl && !finalUrl.startsWith('http') && !finalUrl.startsWith('/') && !finalUrl.startsWith('mailto:') && !finalUrl.startsWith('tel:')) {
      finalUrl = 'https://' + finalUrl;
    }

    const payload = { ...formData, url: finalUrl };

    if (editingId) {
      const res = await updateBioLink(editingId, payload);
      if (res.success) {
        setLinks(links.map(l => l.id === editingId ? res.link : l));
        toast.success("Link güncellendi");
        resetForm();
      } else {
        toast.error(res.error);
      }
    } else {
      const res = await createBioLink(payload);
      if (res.success) {
        setLinks([...links, res.link]);
        toast.success("Link eklendi");
        resetForm();
      } else {
        toast.error(res.error);
      }
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Bu linki silmek istediğinize emin misiniz?")) return;
    const res = await deleteBioLink(id);
    if (res.success) {
      setLinks(links.filter(l => l.id !== id));
      toast.success("Link silindi");
    } else {
      toast.error(res.error);
    }
  };

  const toggleActive = async (link) => {
    const res = await updateBioLink(link.id, { ...link, isActive: !link.isActive });
    if (res.success) {
      setLinks(links.map(l => l.id === link.id ? res.link : l));
      toast.success(link.isActive ? "Link gizlendi" : "Link aktif edildi");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Link2 size={20} className="text-primary" />
            Bio Linkleri (Linktree)
          </h2>
          <p className="text-sm text-white/50 mt-1">
            Instagram profilinize ekleyebileceğiniz dinamik link sayfanızı yönetin.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/links" target="_blank" className="flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition-colors bg-white/5 border border-white/10 px-3 py-2 rounded-lg">
            <ExternalLink size={14} />
            Sayfayı Gör
          </a>
          {!isAdding && !editingId && (
            <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold hover:brightness-110 transition-all">
              <Plus size={16} /> Yeni Ekle
            </button>
          )}
        </div>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-white/5 border border-white/10 p-5 rounded-xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Bağlantı Tipi</label>
              <select value={formData.type || "external"} onChange={e => {
                const type = e.target.value;
                let autoIcon = "link";
                let autoTitle = "";
                if (type === "packages") { autoIcon = "shopping-bag"; autoTitle = "Paketler ve Fiyatlar"; }
                if (type === "booking") { autoIcon = "calendar"; autoTitle = "Randevu Al"; }
                if (type === "portfolio") { autoIcon = "image"; autoTitle = "Portfolyom"; }
                setFormData({...formData, type, icon: autoIcon, title: autoTitle || formData.title, url: ""});
              }} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-primary outline-none appearance-none">
                <option value="external">Dış Link (Instagram, WhatsApp vs.)</option>
                <option value="packages">Hizmetler & Paketler (Sistem İçi)</option>
                <option value="booking">Randevu / Takvim (Sistem İçi)</option>
                <option value="portfolio">Portfolyo Galeri (Sistem İçi)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Başlık</label>
              <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Örn: WhatsApp'tan Yazın" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-primary outline-none" />
            </div>
            
            {formData.type === "external" && (
              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Link (URL)</label>
                <input type="text" value={formData.url || ""} onChange={e => setFormData({...formData, url: e.target.value})} placeholder="Örn: https://wa.me/90532..." className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-primary outline-none" />
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">İkon / Simge</label>
              <select value={formData.icon || "link"} onChange={e => setFormData({...formData, icon: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-primary outline-none appearance-none">
                {iconOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center pt-8 md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-5 h-5 accent-primary cursor-pointer" />
                <span className="text-sm font-semibold text-white/80">Aktif (Sayfada Göster)</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-4">
            <button onClick={resetForm} className="px-4 py-2 text-sm font-semibold text-white/50 hover:text-white transition-colors">İptal</button>
            <button onClick={handleSave} disabled={loading} className="flex items-center gap-2 bg-white text-black px-6 py-2 rounded-lg text-sm font-bold hover:bg-white/90 transition-all disabled:opacity-50">
              {loading ? "Kaydediliyor..." : <><Check size={16} /> Kaydet</>}
            </button>
          </div>
        </div>
      )}

      {links.length > 0 ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="bio-links">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                {links.map((link, index) => (
                  <Draggable key={link.id} draggableId={link.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex items-center gap-4 bg-white/5 border ${snapshot.isDragging ? "border-primary" : "border-white/10"} p-4 rounded-xl transition-colors`}
                        style={provided.draggableProps.style}
                      >
                        <div {...provided.dragHandleProps} className="text-white/20 hover:text-white cursor-grab active:cursor-grabbing p-1">
                          <GripVertical size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            {link.type !== "external" && <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded font-bold tracking-wider">MODÜL</span>}
                            <span className="text-white font-bold text-sm truncate">{link.title}</span>
                            {!link.isActive && <span className="bg-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">Gizli</span>}
                          </div>
                          {link.type === "external" ? (
                            <div className="text-white/40 text-xs truncate max-w-[80%]">{link.url}</div>
                          ) : (
                            <div className="text-white/40 text-xs truncate max-w-[80%] italic">Sayfa içi açılır pencere (Popup)</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => toggleActive(link)} className={`p-2 rounded-lg transition-colors ${link.isActive ? "text-green-400 hover:bg-green-400/10" : "text-white/30 hover:bg-white/10"}`} title={link.isActive ? "Gizle" : "Göster"}>
                            <Check size={16} />
                          </button>
                          <button onClick={() => { setFormData(link); setEditingId(link.id); setIsAdding(false); }} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Düzenle">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(link.id)} className="p-2 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Sil">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl border-dashed">
          <Link2 size={32} className="mx-auto text-white/20 mb-3" />
          <h3 className="text-white/70 font-semibold mb-1">Henüz link eklemediniz</h3>
          <p className="text-white/40 text-sm mb-4">Instagram bio'nuz için dinamik linkler oluşturun.</p>
          <button onClick={() => setIsAdding(true)} className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-white/20 transition-all">
            <Plus size={16} /> İlk Linki Ekle
          </button>
        </div>
      )}
    </div>
  );
}
