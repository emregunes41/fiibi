"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, X, ImagePlus, FileText, Calendar } from "lucide-react";
import { getPosts, createPost, updatePost, deletePost } from "./post-actions";
import Link from "next/link";

export default function PostsAdminPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "", slug: "", content: "", excerpt: "", imageUrl: "", isPublished: true
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => { loadPosts(); }, []);

  const loadPosts = async () => {
    setLoading(true);
    const data = await getPosts();
    setPosts(data || []);
    setLoading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      alert("Lütfen başlık ve içerik alanlarını doldurun.");
      return;
    }
    
    let res;
    if (editingId) {
      res = await updatePost(editingId, formData);
    } else {
      res = await createPost(formData);
    }
    
    if (res?.error) {
      alert("Hata: " + res.error);
      return;
    }
    
    setFormOpen(false);
    setEditingId(null);
    loadPosts();
  };

  const handleDelete = async (id) => {
    if (confirm("Bu yazıyı silmek istediğinize emin misiniz?")) {
      const res = await deletePost(id);
      if (res?.error) {
        alert("Hata: " + res.error);
      } else {
        loadPosts();
      }
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert("Dosya çok büyük (Maks 10MB)"); return; }
    setUploadingImage(true);
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', uploadPreset);
      fd.append('folder', 'blog');
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd });
      const result = await res.json();
      if (result.secure_url) {
        setFormData(prev => ({ ...prev, imageUrl: result.secure_url }));
      } else {
        alert("Yükleme hatası: " + (result.error?.message || "Bilinmeyen hata"));
      }
    } catch (err) {
      alert("Yükleme hatası: " + err.message);
    }
    setUploadingImage(false);
  };

  const openForm = (post = null) => {
    if (post) {
      setEditingId(post.id);
      setFormData({
        title: post.title, slug: post.slug, content: post.content || "", excerpt: post.excerpt || "", imageUrl: post.imageUrl || "", isPublished: post.isPublished
      });
    } else {
      setEditingId(null);
      setFormData({ title: "", slug: "", content: "", excerpt: "", imageUrl: "", isPublished: true });
    }
    setFormOpen(true);
  };

  if (loading) {
    return <div className="p-8 text-center" style={{ color: "var(--text, #fff)" }}>Yükleniyor...</div>;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px 0" }}>Blog & Yazılar</h1>
          <p style={{ color: "rgba(0,0,0,0.5)", margin: 0, fontSize: 13 }}>Sitenizde görünecek blog yazılarını ve haberleri yönetin.</p>
        </div>
        <button onClick={() => openForm()} style={{ display: "flex", alignItems: "center", gap: 8, background: "#1a1a1a", color: "#1a1a1a", border: "none", padding: "10px 16px", borderRadius: 0, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
          <Plus size={16} /> Yeni Yazı
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
        {posts.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", background: "rgba(0,0,0,0.02)", border: "1px dashed rgba(0,0,0,0.1)", borderRadius: 0, gridColumn: "1 / -1" }}>
            <FileText size={40} style={{ color: "rgba(0,0,0,0.2)", margin: "0 auto 16px" }} />
            <p style={{ color: "rgba(0,0,0,0.5)", marginBottom: 16 }}>Sisteminizde hiç blog yazısı bulunmuyor.</p>
            <button onClick={() => openForm()} style={{ background: "rgba(0,0,0,0.1)", color: "#1a1a1a", border: "none", padding: "10px 16px", borderRadius: 0, fontWeight: 600, cursor: "pointer" }}>
              İlk Yazını Oluştur
            </button>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 0, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column" }}>
              {!post.isPublished && <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,0,0,0.2)", color: "#ff4d4d", fontSize: 10, fontWeight: 800, padding: "4px 8px", borderRadius: 0, zIndex: 2 }}>TASLAK</div>}
              
              {/* Cover Image */}
              {post.imageUrl ? (
                <div style={{ width: "100%", height: 160, overflow: "hidden" }}>
                  <img src={post.imageUrl} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ) : (
                <div style={{ width: "100%", height: 160, background: "rgba(0,0,0,0.02)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                   <FileText size={32} style={{ color: "rgba(0,0,0,0.1)" }} />
                </div>
              )}

              <div style={{ padding: 20, flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(0,0,0,0.4)", marginBottom: 8, display: "flex", gap: 12 }} suppressHydrationWarning>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }} suppressHydrationWarning><Calendar size={12} /> {new Date(post.createdAt).toLocaleDateString("tr-TR")}</span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 8px 0" }}>{post.title}</h3>
                {post.excerpt && <p style={{ fontSize: 13, color: "rgba(0,0,0,0.5)", margin: 0, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{post.excerpt}</p>}
              </div>

              <div style={{ display: "flex", borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                <a href={`/blog/${post.slug}`} target="_blank" style={{ flex: 1, padding: 16, background: "none", border: "none", borderRight: "1px solid rgba(0,0,0,0.04)", color: "#1a1a1a", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                  Görüntüle
                </a>
                <button onClick={() => openForm(post)} style={{ padding: 16, background: "none", border: "none", borderRight: "1px solid rgba(0,0,0,0.04)", color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(post.id)} style={{ padding: 16, background: "none", border: "none", color: "#ff4d4d", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE/EDIT MODAL */}
      {formOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", justifyContent: "center", alignItems: "center", padding: 20 }}>
          <div className="admin-modal-content" style={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: 0, width: "100%", maxWidth: 800, maxHeight: "90vh", overflowY: "auto", background: "#ffffff" }}>
            <div style={{ padding: "24px", borderBottom: "1px solid rgba(0,0,0,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#ffffff", zIndex: 10 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{editingId ? "Yazıyı Düzenle" : "Yeni Yazı Oluştur"}</h2>
              <button onClick={() => setFormOpen(false)} style={{ background: "none", border: "none", color: "#1a1a1a", cursor: "pointer" }}><X size={24} /></button>
            </div>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
              
              {/* Image Upload */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>Kapak Fotoğrafı</label>
                {formData.imageUrl ? (
                  <div style={{ position: "relative" }}>
                    <img src={formData.imageUrl} alt="Kapak" style={{ width: "100%", height: 240, objectFit: "cover", borderRadius: 0, border: "1px solid rgba(0,0,0,0.1)" }} />
                    <button type="button" onClick={() => setFormData({...formData, imageUrl: ""})} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.8)", border: "none", color: "#ff4d4d", cursor: "pointer", padding: 6, borderRadius: 0 }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, background: "rgba(0,0,0,0.03)", border: "1px dashed rgba(0,0,0,0.15)", borderRadius: 0, cursor: "pointer", gap: 8 }}>
                    <ImagePlus size={28} style={{ color: "rgba(0,0,0,0.3)" }} />
                    <span style={{ fontSize: 13, color: "rgba(0,0,0,0.5)", fontWeight: 600 }}>{uploadingImage ? "Yükleniyor..." : "Fotoğraf Yükle"}</span>
                    <input type="file" accept="image/*" hidden onChange={e => handleImageUpload(e.target.files[0])} />
                  </label>
                )}
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>Başlık</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ width: "100%", background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.1)", color: "#1a1a1a", padding: "12px 16px", borderRadius: 0, fontSize: 14 }} placeholder="Örn: 2026 Düğün Fotoğrafçılığı Trendleri" />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>Özet (Opsiyonel)</label>
                <textarea value={formData.excerpt} onChange={e => setFormData({...formData, excerpt: e.target.value})} style={{ width: "100%", background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.1)", color: "#1a1a1a", padding: "12px 16px", borderRadius: 0, fontSize: 14, minHeight: 60 }} placeholder="Yazının kısa bir özeti..." />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>İçerik</label>
                <textarea required value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} style={{ width: "100%", background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.1)", color: "#1a1a1a", padding: "16px", borderRadius: 0, fontSize: 15, minHeight: 300, lineHeight: 1.6 }} placeholder="Yazı içeriğini buraya girin (HTML destekler)..." />
                <p style={{ fontSize: 11, color: "rgba(0,0,0,0.4)", marginTop: 6 }}>Basit HTML etiketleri (&lt;b&gt;, &lt;i&gt;, &lt;h2&gt;, vb.) kullanabilirsiniz.</p>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", background: "rgba(0,0,0,0.02)", padding: '12px 16px', borderRadius: 0, border: "1px solid rgba(0,0,0,0.05)" }}>
                <input type="checkbox" checked={formData.isPublished} onChange={e => setFormData({...formData, isPublished: e.target.checked})} style={{ width: 18, height: 18, accentcolor: "#1a1a1a" }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Yayında (Herkes Görebilir)</span>
              </label>

              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setFormOpen(false)} style={{ flex: 1, padding: "14px", background: "rgba(0,0,0,0.05)", border: "none", color: "#1a1a1a", fontWeight: 700, borderRadius: 0, cursor: "pointer" }}>İptal</button>
                <button type="button" onClick={handleSave} style={{ flex: 1, padding: "14px", background: "#fff", border: "none", color: "#000", fontWeight: 700, borderRadius: 0, cursor: "pointer" }}>Kaydet</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
