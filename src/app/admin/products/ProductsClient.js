"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, X, Save, Image as ImageIcon, Box, Cloud, FolderPlus, Folder, UploadCloud } from "lucide-react";
import { saveProduct, deleteProduct, saveProductCategory, deleteProductCategory } from "../ecommerce-actions";
import { CldUploadWidget } from "next-cloudinary";

export default function ProductsClient({ initialProducts, initialCategories, config }) {
  const [products, setProducts] = useState(initialProducts || []);
  const [categories, setCategories] = useState(initialCategories || []);
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: "", description: "", detailedDescription: "", price: "", 
    hasStock: false, stock: "", 
    isDigital: false, downloadUrl: "", 
    imageUrls: [], isActive: true, discountPercentage: "0", categoryId: ""
  });
  
  const [catName, setCatName] = useState("");

  const openAddProduct = () => {
    setEditingItem(null);
    setForm({
      name: "", description: "", detailedDescription: "", price: "", 
      hasStock: false, stock: "", 
      isDigital: false, downloadUrl: "", 
      imageUrls: [], isActive: true, discountPercentage: "0", categoryId: ""
    });
    setIsProductModalOpen(true);
  };

  const openEditProduct = (p) => {
    setEditingItem(p);
    setForm({
      name: p.name || "",
      description: p.description || "",
      detailedDescription: p.detailedDescription || "",
      price: p.price || "",
      hasStock: p.hasStock || false,
      stock: p.stock?.toString() || "",
      isDigital: p.isDigital || false,
      downloadUrl: p.downloadUrl || "",
      imageUrls: p.imageUrls || [],
      isActive: p.isActive,
      discountPercentage: p.discountPercentage?.toString() || "0",
      categoryId: p.categoryId || ""
    });
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
    const res = await deleteProduct(id);
    if (res.success) {
      setProducts(products.filter(p => p.id !== id));
    } else {
      alert(res.error);
    }
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const dataToSave = {
      ...form,
      id: editingItem?.id,
    };

    const res = await saveProduct(dataToSave);
    if (res.success) {
      if (editingItem) {
        setProducts(products.map(p => p.id === res.product.id ? res.product : p));
      } else {
        setProducts([res.product, ...products]);
      }
      setIsProductModalOpen(false);
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim() || loading) return;
    setLoading(true);
    const res = await saveProductCategory({ name: catName });
    if (res.success) {
      setCategories([res.category, ...categories]);
      setCatName("");
      setIsCategoryModalOpen(false);
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm("Bu kategoriyi silmek istediğinize emin misiniz? (İçindeki ürünler kategorisiz kalır)")) return;
    const res = await deleteProductCategory(id);
    if (res.success) {
      setCategories(categories.filter(c => c.id !== id));
    } else {
      alert(res.error);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Ekli Ürünler ({products.length})</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => setIsCategoryModalOpen(true)} style={{
            background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)",
            padding: "8px 16px", borderRadius: 0, fontSize: "13px", fontWeight: 700,
            display: "flex", alignItems: "center", gap: "8px", cursor: "pointer"
          }}>
            <FolderPlus size={16} /> Kategoriler
          </button>
          <button onClick={openAddProduct} style={{
            background: "#fff", color: "#000", border: "none",
            padding: "8px 16px", borderRadius: 0, fontSize: "13px", fontWeight: 700,
            display: "flex", alignItems: "center", gap: "8px", cursor: "pointer"
          }}>
            <Plus size={16} /> Yeni Ürün
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
        {products.map(p => (
          <div key={p.id} style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            padding: "16px", position: "relative"
          }}>
            <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
              {p.imageUrls?.[0] ? (
                <div style={{ width: 60, height: 60, background: "rgba(0,0,0,0.5)", flexShrink: 0, backgroundImage: `url(${p.imageUrls[0]})`, backgroundSize: "cover", backgroundPosition: "center" }} />
              ) : (
                <div style={{ width: 60, height: 60, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <ImageIcon size={20} style={{ color: "rgba(255,255,255,0.2)" }} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>
                  {p.isDigital ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Cloud size={10} /> Dijital</span>
                  ) : (
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Box size={10} /> Fiziki • {p.hasStock ? `${p.stock} adet` : "Sınırsız"}</span>
                  )}
                </div>
                {p.category && (
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "4px", backgroundColor: "rgba(255,255,255,0.05)", display: "inline-block", padding: "2px 6px" }}>{p.category.name}</div>
                )}
                {p.discountPercentage > 0 && (
                  <div style={{ fontSize: "10px", color: "#f87171", marginTop: "4px", fontWeight: 600 }}>%{p.discountPercentage} İndirimli</div>
                )}
              </div>
            </div>

            <div style={{ fontSize: "18px", fontWeight: 800, marginBottom: "12px" }}>{p.price} ₺</div>

            <div style={{ display: "flex", gap: "8px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px" }}>
              <button onClick={() => openEditProduct(p)} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "none", color: "#fff", padding: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <Edit2 size={12} /> Düzenle
              </button>
              <button onClick={() => handleDeleteProduct(p.id)} style={{ padding: "8px", background: "none", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", cursor: "pointer" }}>
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
      {products.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", border: "1px dashed rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
          <Box size={32} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
          <div style={{ fontSize: "14px", fontWeight: 600 }}>Henüz ürün eklenmemiş.</div>
        </div>
      )}

      {/* KATEGORI MODAL */}
      {isCategoryModalOpen && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)",
          zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
        }}>
          <div style={{
            background: "#111", border: "1px solid rgba(255,255,255,0.1)",
            width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column"
          }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Kategoriler</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}><X size={20} /></button>
            </div>
            <div style={{ padding: "20px" }}>
              <form onSubmit={handleSaveCategory} style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                <input required value={catName} onChange={e => setCatName(e.target.value)} placeholder="Yeni Kategori Adı" style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "10px", color: "#fff", outline: "none", boxSizing: "border-box" }} />
                <button type="submit" disabled={loading} style={{ background: "#fff", color: "#000", border: "none", padding: "0 16px", fontWeight: 700, cursor: "pointer" }}>Ekle</button>
              </form>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto" }}>
                {categories.map(c => (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.03)", padding: "10px 14px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600 }}><Folder size={12} style={{ display: "inline", marginRight: 6, color: "rgba(255,255,255,0.5)" }} />{c.name}</span>
                    <button onClick={() => handleDeleteCategory(c.id)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}><Trash2 size={14} /></button>
                  </div>
                ))}
                {categories.length === 0 && <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Henüz kategori yok.</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ÜRÜN MODAL */}
      {isProductModalOpen && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)",
          zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
        }}>
          <div style={{
            background: "#111", border: "1px solid rgba(255,255,255,0.1)",
            width: "100%", maxWidth: "700px", maxHeight: "90vh", overflow: "hidden",
            display: "flex", flexDirection: "column"
          }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>{editingItem ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}</h3>
              <button onClick={() => setIsProductModalOpen(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmitProduct} style={{ padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: "6px" }}>Ürün Adı *</label>
                    <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "12px", color: "#fff", outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: "6px" }}>Kategori</label>
                    <select value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "12px", color: "#fff", outline: "none", boxSizing: "border-box" }}>
                      <option value="">Kategorisiz</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: "6px" }}>Kısa Açıklama</label>
                  <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Vitrin listelemesi için (opsiyonel)" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "10px", color: "#fff", outline: "none", boxSizing: "border-box" }} />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: "6px" }}>Detaylı Ürün Açıklaması</label>
                  <textarea value={form.detailedDescription} onChange={e => setForm({...form, detailedDescription: e.target.value})} placeholder="Ürün özelliklerini detaylı anlatın. Alt satıra geçilebilir." style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "12px", color: "#fff", outline: "none", minHeight: "120px", boxSizing: "border-box" }} />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: "6px" }}>Fiyat (₺) *</label>
                  <input required type="text" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="Örn: 500" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "12px", color: "#fff", outline: "none", boxSizing: "border-box" }} />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: "6px" }}>İndirim (%)</label>
                  <input type="number" min="0" max="100" value={form.discountPercentage} onChange={e => setForm({...form, discountPercentage: e.target.value})} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "12px", color: "#fff", outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>

              <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", margin: "8px 0" }} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", padding: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                    <input type="checkbox" checked={form.isDigital} onChange={e => setForm({...form, isDigital: e.target.checked})} style={{ width: 16, height: 16, accentColor: "#fff" }} />
                    Dijital Ürün mü?
                  </label>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "4px 0 0 24px" }}>Evet ise, kargo adresi sorulmaz.</p>
                </div>
                
                {form.isDigital && (
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: "6px" }}>İndirme Linki (URL)</label>
                    <input type="url" placeholder="https://" value={form.downloadUrl} onChange={e => setForm({...form, downloadUrl: e.target.value})} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "10px", color: "#fff", outline: "none", boxSizing: "border-box" }} />
                  </div>
                )}
              </div>

              {!form.isDigital && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", padding: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                      <input type="checkbox" checked={form.hasStock} onChange={e => setForm({...form, hasStock: e.target.checked})} style={{ width: 16, height: 16, accentColor: "#fff" }} />
                      Stok Takibi Yapılsın
                    </label>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "4px 0 0 24px" }}>Kapatılırsa sınırsız satılabilir.</p>
                  </div>
                  {form.hasStock && (
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: "6px" }}>Mevcut Stok *</label>
                      <input type="number" required min="0" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "10px", color: "#fff", outline: "none", boxSizing: "border-box" }} />
                    </div>
                  )}
                </div>
              )}

              <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", margin: "8px 0" }} />

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: "6px" }}>Ürün Görselleri</label>
                
                <CldUploadWidget 
                  uploadPreset="pinowed_files"
                  options={{ maxFiles: 10, multiple: true, folder: "products" }}
                  onUpload={(result) => {
                    if (result.event === "success") {
                      setForm(prev => ({ ...prev, imageUrls: [...prev.imageUrls, result.info.secure_url] }));
                    }
                  }}
                >
                  {({ open }) => (
                    <button type="button" onClick={() => open()} style={{
                      width: "100%", background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.2)",
                      padding: "24px", color: "#fff", outline: "none", cursor: "pointer", display: "flex", flexDirection: "column",
                      alignItems: "center", gap: 8, borderRadius: 4, transition: "background 0.2s"
                    }} className="hover:bg-white/10">
                      <UploadCloud size={24} style={{ opacity: 0.5 }} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Fotoğraf Yüklemek İçin Tıkla</span>
                    </button>
                  )}
                </CldUploadWidget>

                {form.imageUrls.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 12, marginTop: 16 }}>
                    {form.imageUrls.map((url, i) => (
                      <div key={i} style={{ position: "relative", width: "100%", paddingTop: "100%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <img src={url} alt="Eklenen Slayt" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                        <button type="button" onClick={() => setForm(p => ({ ...p, imageUrls: p.imageUrls.filter((_, idx) => idx !== i) }))} style={{
                          position: "absolute", top: -6, right: -6, background: "#ef4444", color: "#fff", border: "none",
                          width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
                        }}><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifySelf: "flex-end", gap: "12px", marginTop: "16px" }}>
                <button type="button" onClick={() => setIsProductModalOpen(false)} style={{ padding: "12px 24px", background: "rgba(255,255,255,0.05)", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer", marginLeft: "auto" }}>İptal</button>
                <button type="submit" disabled={loading} style={{ padding: "12px 24px", background: "#fff", color: "#000", border: "none", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Save size={16} /> {loading ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
