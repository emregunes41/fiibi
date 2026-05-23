"use client";

import { useState, useEffect } from "react";
import { Link2, Plus, Edit2, Trash2, GripVertical, Check, ExternalLink, X, Eye, EyeOff, ChevronRight } from "lucide-react";
import { createBioLink, updateBioLink, deleteBioLink, reorderBioLinks, getBioLinks } from "../biolinks-actions";
import { toast } from "sonner";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

// ─── Link Şablonları ───
const LINK_TEMPLATES = [
  // Sosyal Medya
  { category: "Sosyal Medya", items: [
    { icon: "instagram", title: "Instagram", placeholder: "https://instagram.com/kullaniciadi", color: "#E4405F", gradient: "linear-gradient(135deg, #f09433, #e6683c, #dc2743, #bc1888, #833ab4)", emoji: "📸" },
    { icon: "tiktok", title: "TikTok", placeholder: "https://tiktok.com/@kullaniciadi", color: "#00f2ea", gradient: "linear-gradient(135deg, #00f2ea, #ff0050)", emoji: "🎵" },
    { icon: "youtube", title: "YouTube", placeholder: "https://youtube.com/@kanaliniz", color: "#FF0000", gradient: "linear-gradient(135deg, #FF0000, #CC0000)", emoji: "▶️" },
    { icon: "link", title: "Facebook", placeholder: "https://facebook.com/sayfaniz", color: "#1877F2", gradient: "linear-gradient(135deg, #1877F2, #0D47A1)", emoji: "👤" },
    { icon: "link", title: "Twitter / X", placeholder: "https://x.com/kullaniciadi", color: "#1DA1F2", gradient: "linear-gradient(135deg, #1DA1F2, #0d8ecf)", emoji: "🐦" },
    { icon: "link", title: "LinkedIn", placeholder: "https://linkedin.com/in/isminiz", color: "#0A66C2", gradient: "linear-gradient(135deg, #0A66C2, #004182)", emoji: "💼" },
    { icon: "link", title: "Pinterest", placeholder: "https://pinterest.com/kullaniciadi", color: "#E60023", gradient: "linear-gradient(135deg, #E60023, #BD081C)", emoji: "📌" },
    { icon: "link", title: "Spotify", placeholder: "https://open.spotify.com/...", color: "#1DB954", gradient: "linear-gradient(135deg, #1DB954, #158a3e)", emoji: "🎧" },
    { icon: "link", title: "Threads", placeholder: "https://threads.net/@kullaniciadi", color: "#000", gradient: "linear-gradient(135deg, #333, #000)", emoji: "🧵" },
  ]},
  // İletişim
  { category: "İletişim", items: [
    { icon: "whatsapp", title: "WhatsApp", placeholder: "https://wa.me/905xxxxxxxxx", color: "#25D366", gradient: "linear-gradient(135deg, #25D366, #128C7E)", emoji: "💬" },
    { icon: "link", title: "Telegram", placeholder: "https://t.me/kullaniciadi", color: "#26A5E4", gradient: "linear-gradient(135deg, #26A5E4, #0088cc)", emoji: "✈️" },
    { icon: "link", title: "E-Posta", placeholder: "mailto:info@isletmeniz.com", color: "#EA4335", gradient: "linear-gradient(135deg, #EA4335, #c5221f)", emoji: "📧" },
    { icon: "link", title: "Telefon", placeholder: "tel:+905xxxxxxxxx", color: "#4CAF50", gradient: "linear-gradient(135deg, #4CAF50, #2E7D32)", emoji: "📞" },
  ]},
  // İş & Konum
  { category: "İş & Konum", items: [
    { icon: "map", title: "Google Maps", placeholder: "https://maps.google.com/?q=...", color: "#4285F4", gradient: "linear-gradient(135deg, #4285F4, #34A853)", emoji: "📍" },
    { icon: "link", title: "Web Sitesi", placeholder: "https://www.isletmeniz.com", color: "#fff", gradient: "linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))", emoji: "🌐" },
    { icon: "link", title: "Google Yorum", placeholder: "https://g.page/r/...", color: "#FBBC05", gradient: "linear-gradient(135deg, #FBBC05, #F9A825)", emoji: "⭐" },
    { icon: "link", title: "Sahibinden", placeholder: "https://sahibinden.com/...", color: "#FFD200", gradient: "linear-gradient(135deg, #FFD200, #e6bd00)", emoji: "🏷️" },
    { icon: "link", title: "Etsy", placeholder: "https://etsy.com/shop/...", color: "#F56400", gradient: "linear-gradient(135deg, #F56400, #c75000)", emoji: "🎨" },
    { icon: "link", title: "N11", placeholder: "https://n11.com/magaza/...", color: "#7B2D8E", gradient: "linear-gradient(135deg, #7B2D8E, #5B1F6A)", emoji: "🛒" },
  ]},
  // Sistem İçi
  { category: "Sistem İçi (Fiibi)", items: [
    { icon: "shopping-bag", title: "Hizmetler & Paketler", placeholder: "", color: "#a78bfa", gradient: "linear-gradient(135deg, #8b5cf6, #6d28d9)", emoji: "📦", type: "packages" },
    { icon: "calendar", title: "Randevu Al", placeholder: "", color: "#38bdf8", gradient: "linear-gradient(135deg, #38bdf8, #0ea5e9)", emoji: "📅", type: "booking" },
    { icon: "image", title: "Portfolyo Galeri", placeholder: "", color: "#f472b6", gradient: "linear-gradient(135deg, #f472b6, #ec4899)", emoji: "🖼️", type: "portfolio" },
  ]},
  // Diğer
  { category: "Diğer", items: [
    { icon: "link", title: "Özel Link", placeholder: "https://...", color: "rgba(255,255,255,0.4)", gradient: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03))", emoji: "🔗" },
  ]},
];

// Flatten for quick lookup
const ALL_TEMPLATES = LINK_TEMPLATES.flatMap(c => c.items);

export default function BioLinksManager({ initialLinks }) {
  const [links, setLinks] = useState(initialLinks || []);
  const [editingId, setEditingId] = useState(null);
  const [addingTemplate, setAddingTemplate] = useState(null); // selected template for adding
  const [formData, setFormData] = useState({ type: "external", title: "", url: "", icon: "link", isActive: true });
  const [loading, setLoading] = useState(false);

  // initialLinks prop değişirse güncelle
  useEffect(() => {
    if (initialLinks && initialLinks.length > 0) {
      setLinks(initialLinks);
    }
  }, [initialLinks]);

  // Sayfa yenilendiğinde initialLinks boş gelebiliyor — kendi başına DB'den yükle
  useEffect(() => {
    async function loadLinks() {
      try {
        const data = await getBioLinks();
        if (data && data.length > 0) {
          setLinks(data);
        }
      } catch (err) {
        console.error("BioLinks load error:", err);
      }
    }
    if (!initialLinks || initialLinks.length === 0) {
      loadLinks();
    }
  }, []);

  // ─── Drag & Drop ───
  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const items = Array.from(links);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setLinks(items);
    await reorderBioLinks(items);
  };

  // ─── Template Seçildi ───
  const selectTemplate = (tpl) => {
    setEditingId(null);
    setAddingTemplate(tpl);
    setFormData({
      type: tpl.type || "external",
      title: tpl.title,
      url: "",
      icon: tpl.icon,
      isActive: true,
    });
  };

  // ─── Düzenleme ───
  const startEdit = (link) => {
    setAddingTemplate(null);
    setEditingId(link.id);
    setFormData({ ...link });
  };

  // ─── İptal ───
  const resetForm = () => {
    setFormData({ type: "external", title: "", url: "", icon: "link", isActive: true });
    setAddingTemplate(null);
    setEditingId(null);
  };

  // ─── Kaydet ───
  const handleSave = async () => {
    const isExternal = formData.type === "external";
    if (!formData.title) return toast.error("Başlık zorunludur");
    if (isExternal && !formData.url) return toast.error("URL zorunludur");

    let finalUrl = formData.url?.trim() || "";
    if (isExternal && finalUrl && !finalUrl.startsWith("http") && !finalUrl.startsWith("/") && !finalUrl.startsWith("mailto:") && !finalUrl.startsWith("tel:")) {
      finalUrl = "https://" + finalUrl;
    }

    setLoading(true);
    const payload = { ...formData, url: finalUrl };

    if (editingId) {
      const res = await updateBioLink(editingId, payload);
      if (res.success) {
        setLinks(links.map(l => l.id === editingId ? res.link : l));
        toast.success("Link güncellendi");
        resetForm();
      } else toast.error(res.error);
    } else {
      const res = await createBioLink(payload);
      if (res.success) {
        setLinks([...links, res.link]);
        toast.success("Link eklendi");
        resetForm();
      } else toast.error(res.error);
    }
    setLoading(false);
  };

  // ─── Sil ───
  const handleDelete = async (id) => {
    if (!confirm("Bu linki silmek istediğinize emin misiniz?")) return;
    const res = await deleteBioLink(id);
    if (res.success) {
      setLinks(links.filter(l => l.id !== id));
      toast.success("Link silindi");
      if (editingId === id) resetForm();
    } else toast.error(res.error);
  };

  // ─── Aktif/Gizli ───
  const toggleActive = async (link) => {
    const res = await updateBioLink(link.id, { ...link, isActive: !link.isActive });
    if (res.success) {
      setLinks(links.map(l => l.id === link.id ? res.link : l));
      toast.success(link.isActive ? "Link gizlendi" : "Link aktif edildi");
    }
  };

  // ─── Template için renk bul ───
  const getTemplateForLink = (link) => {
    return ALL_TEMPLATES.find(t => t.title === link.title) || ALL_TEMPLATES.find(t => t.icon === link.icon) || null;
  };

  const isFormOpen = addingTemplate || editingId;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
            <Link2 size={18} style={{ color: "rgba(255,255,255,0.5)" }} />
            Bio Linkleri
          </h2>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>
            Instagram bio'nuza ekleyeceğiniz link sayfanızı yönetin.
          </p>
        </div>
        <a href="/links" target="_blank" rel="noopener noreferrer" style={{
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)",
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          padding: "8px 14px", textDecoration: "none",
          transition: "all 0.2s",
        }}>
          <ExternalLink size={13} /> Sayfayı Gör
        </a>
      </div>

      {/* ─── Mevcut Linkler (Sol) + Şablon Seçici (Sağ) ─── */}
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }} className="flex-col md:flex-row">

        {/* SOL: Mevcut Linkler Listesi */}
        <div style={{ flex: "1 1 0", minWidth: 0 }}>
          {/* Form (Ekleme/Düzenleme) */}
          {isFormOpen && (
            <div style={{
              background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.15)",
              padding: 20, marginBottom: 16,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {addingTemplate && (
                    <span style={{ fontSize: 20 }}>{addingTemplate.emoji}</span>
                  )}
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                    {editingId ? "Link Düzenle" : `${addingTemplate?.title || "Yeni"} Ekle`}
                  </span>
                </div>
                <button onClick={resetForm} style={{
                  background: "none", border: "none", color: "rgba(255,255,255,0.3)",
                  cursor: "pointer", padding: 4,
                }}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Başlık */}
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                    Buton Başlığı
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Örn: Instagram'ım"
                    style={{
                      width: "100%", boxSizing: "border-box",
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                      padding: "10px 14px", fontSize: 13, color: "#fff", outline: "none",
                    }}
                  />
                </div>

                {/* URL (sadece external) */}
                {formData.type === "external" && (
                  <div>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                      Link (URL)
                    </label>
                    <input
                      type="text"
                      value={formData.url || ""}
                      onChange={e => setFormData({ ...formData, url: e.target.value })}
                      placeholder={addingTemplate?.placeholder || "https://..."}
                      style={{
                        width: "100%", boxSizing: "border-box",
                        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                        padding: "10px 14px", fontSize: 13, color: "#fff", outline: "none",
                        fontFamily: "monospace",
                      }}
                    />
                  </div>
                )}

                {formData.type !== "external" && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 14px", background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.12)",
                    fontSize: 12, color: "rgba(255,255,255,0.5)",
                  }}>
                    <span style={{ fontSize: 14 }}>ℹ️</span>
                    Bu link sistem içinden otomatik açılacak, URL gerekmez.
                  </div>
                )}
              </div>

              {/* Aksiyon Butonları */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                <button onClick={resetForm} style={{
                  padding: "8px 16px", fontSize: 12, fontWeight: 600,
                  background: "none", border: "none", color: "rgba(255,255,255,0.4)",
                  cursor: "pointer",
                }}>İptal</button>
                <button onClick={handleSave} disabled={loading} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 20px", fontSize: 12, fontWeight: 700,
                  background: "#fff", color: "#000", border: "none",
                  cursor: "pointer", opacity: loading ? 0.5 : 1,
                  transition: "opacity 0.2s",
                }}>
                  <Check size={14} /> {loading ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </div>
          )}

          {/* Mevcut Linkler */}
          {links.length > 0 ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="bio-links">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {links.map((link, index) => {
                      const tpl = getTemplateForLink(link);
                      return (
                        <Draggable key={link.id} draggableId={link.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              style={{
                                ...provided.draggableProps.style,
                                display: "flex", alignItems: "center", gap: 12,
                                padding: "12px 14px",
                                background: snapshot.isDragging ? "rgba(139,92,246,0.08)" : editingId === link.id ? "rgba(139,92,246,0.06)" : "rgba(255,255,255,0.02)",
                                border: `1px solid ${snapshot.isDragging ? "rgba(139,92,246,0.3)" : editingId === link.id ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.06)"}`,
                                opacity: link.isActive ? 1 : 0.5,
                                transition: "all 0.15s",
                              }}
                            >
                              {/* Drag Handle */}
                              <div {...provided.dragHandleProps} style={{ color: "rgba(255,255,255,0.15)", cursor: "grab", padding: 2, flexShrink: 0 }}>
                                <GripVertical size={16} />
                              </div>

                              {/* Icon Badge */}
                              <div style={{
                                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                background: tpl?.gradient || "rgba(255,255,255,0.06)",
                                fontSize: 14,
                              }}>
                                {tpl?.emoji || "🔗"}
                              </div>

                              {/* Info */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link.title}</span>
                                  {link.type !== "external" && (
                                    <span style={{ fontSize: 9, fontWeight: 700, background: "rgba(139,92,246,0.15)", color: "#a78bfa", padding: "2px 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>MODÜL</span>
                                  )}
                                  {!link.isActive && (
                                    <span style={{ fontSize: 9, fontWeight: 700, background: "rgba(248,113,113,0.15)", color: "#f87171", padding: "2px 6px", textTransform: "uppercase" }}>GİZLİ</span>
                                  )}
                                </div>
                                {link.type === "external" && link.url && (
                                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>{link.url}</div>
                                )}
                              </div>

                              {/* Actions */}
                              <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                                <button onClick={() => toggleActive(link)} title={link.isActive ? "Gizle" : "Göster"} style={{
                                  background: "none", border: "none", cursor: "pointer", padding: 6,
                                  color: link.isActive ? "rgba(74,222,128,0.6)" : "rgba(255,255,255,0.2)",
                                  transition: "color 0.2s",
                                }}>
                                  {link.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                                </button>
                                <button onClick={() => startEdit(link)} title="Düzenle" style={{
                                  background: "none", border: "none", cursor: "pointer", padding: 6,
                                  color: "rgba(255,255,255,0.3)", transition: "color 0.2s",
                                }}>
                                  <Edit2 size={14} />
                                </button>
                                <button onClick={() => handleDelete(link.id)} title="Sil" style={{
                                  background: "none", border: "none", cursor: "pointer", padding: 6,
                                  color: "rgba(248,113,113,0.4)", transition: "color 0.2s",
                                }}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : !isFormOpen ? (
            <div style={{
              textAlign: "center", padding: "40px 20px",
              background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)",
            }}>
              <Link2 size={28} style={{ color: "rgba(255,255,255,0.12)", margin: "0 auto 10px", display: "block" }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Henüz link eklemediniz</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>Sağ taraftaki şablonlardan birini seçerek başlayın →</div>
            </div>
          ) : null}
        </div>

        {/* SAĞ: Şablon Seçici */}
        <div style={{ width: 240, flexShrink: 0 }} className="w-full md:w-60">
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, paddingLeft: 2 }}>
            + Link Ekle
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {LINK_TEMPLATES.map(cat => (
              <div key={cat.category}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, paddingLeft: 2 }}>
                  {cat.category}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {cat.items.map(tpl => {
                    const isSelected = addingTemplate?.title === tpl.title && !editingId;
                    return (
                      <button
                        key={tpl.title}
                        onClick={() => selectTemplate(tpl)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "8px 10px", width: "100%",
                          background: isSelected ? "rgba(139,92,246,0.1)" : "rgba(255,255,255,0.02)",
                          border: `1px solid ${isSelected ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.05)"}`,
                          cursor: "pointer", textAlign: "left",
                          transition: "all 0.15s",
                          color: "#fff",
                        }}
                      >
                        <span style={{ fontSize: 15, width: 22, textAlign: "center", flexShrink: 0 }}>{tpl.emoji}</span>
                        <span style={{
                          fontSize: 12, fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? "#a78bfa" : "rgba(255,255,255,0.55)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
                        }}>{tpl.title}</span>
                        <Plus size={12} style={{ color: "rgba(255,255,255,0.15)", flexShrink: 0 }} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
