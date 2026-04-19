"use client";

import { useState } from "react";
import { ShoppingBag, X, Check, Box, Cloud } from "lucide-react";
import { useCart } from "./CartContext";

export default function ShopStorefront({ products, categories }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { addItem, items } = useCart();

  if (!products || products.length === 0) return null;

  const filteredProducts = activeCategory === "all" 
    ? products 
    : products.filter(p => p.categoryId === activeCategory);

  const formatPrice = (p) => {
    return parseInt(p).toLocaleString("tr-TR");
  };

  const handleAddToCart = (product) => {
    addItem({
      id: "prod_" + product.id,
      name: product.name,
      price: product.discountPercentage > 0 
        ? (parseInt(product.price) * (100 - product.discountPercentage)) / 100 
        : parseInt(product.price),
      type: "PRODUCT",
      productData: product
    });
    setSelectedProduct(null);
  };

  return (
    <div>
      {/* Category Filter */}
      {categories.length > 0 && (
        <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "16px", marginBottom: "24px", msOverflowStyle: "none", scrollbarWidth: "none" }}>
          <button
            onClick={() => setActiveCategory("all")}
            style={{
              padding: "8px 20px", borderRadius: "100px", fontSize: "13px", fontWeight: 700, whiteSpace: "nowrap", cursor: "pointer", transition: "all 0.2s",
              background: activeCategory === "all" ? "#fff" : "rgba(255,255,255,0.05)",
              color: activeCategory === "all" ? "#000" : "rgba(255,255,255,0.6)",
              border: activeCategory === "all" ? "1px solid #fff" : "1px solid rgba(255,255,255,0.1)",
            }}
          >
            Tümü
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: "8px 20px", borderRadius: "100px", fontSize: "13px", fontWeight: 700, whiteSpace: "nowrap", cursor: "pointer", transition: "all 0.2s",
                background: activeCategory === cat.id ? "#fff" : "rgba(255,255,255,0.05)",
                color: activeCategory === cat.id ? "#000" : "rgba(255,255,255,0.6)",
                border: activeCategory === cat.id ? "1px solid #fff" : "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "24px" }}>
        {filteredProducts.map(product => {
          const discountPrice = product.discountPercentage > 0 
            ? (parseInt(product.price) * (100 - product.discountPercentage)) / 100 
            : null;

          return (
            <div key={product.id} onClick={() => setSelectedProduct(product)} style={{ 
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer",
              transition: "transform 0.2s", display: "flex", flexDirection: "column" 
            }}>
              <div style={{ position: "relative", width: "100%", paddingTop: "100%", background: "rgba(0,0,0,0.5)" }}>
                {product.imageUrls?.[0] ? (
                  <img src={product.imageUrls[0]} alt={product.name} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.2)" }}>
                    <ShoppingBag size={32} />
                  </div>
                )}
                {product.discountPercentage > 0 && (
                  <div style={{ position: "absolute", top: 12, right: 12, background: "#fff", color: "#000", padding: "4px 8px", fontSize: 11, fontWeight: 800 }}>
                    %{product.discountPercentage} İndirim
                  </div>
                )}
              </div>
              <div style={{ padding: "20px", display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px", color: "#fff" }}>{product.name}</div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "16px" }}>{product.description || "\u00A0"}</div>
                
                <div style={{ marginTop: "auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                  <div>
                    {discountPrice ? (
                      <div>
                        <div style={{ fontSize: "12px", textDecoration: "line-through", color: "rgba(255,255,255,0.4)" }}>{formatPrice(product.price)} ₺</div>
                        <div style={{ fontSize: "20px", fontWeight: 800, color: "#fff" }}>{formatPrice(discountPrice)} ₺</div>
                      </div>
                    ) : (
                      <div style={{ fontSize: "20px", fontWeight: 800, color: "#fff" }}>{formatPrice(product.price)} ₺</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)",
          zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px"
        }} onClick={() => setSelectedProduct(null)}>
          <div style={{
            background: "#111", border: "1px solid rgba(255,255,255,0.1)",
            width: "100%", maxWidth: "800px", maxHeight: "90vh", overflowY: "auto",
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0"
          }} onClick={e => e.stopPropagation()} className="max-md:grid-cols-1">
            
            {/* Image Side */}
            <div style={{ position: "relative", minHeight: "300px", background: "rgba(0,0,0,0.5)" }}>
              {selectedProduct.imageUrls?.[0] ? (
                <img src={selectedProduct.imageUrls[0]} alt={selectedProduct.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                 <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.2)" }}>
                  <ShoppingBag size={48} />
                 </div>
              )}
            </div>

            {/* Content Side */}
            <div style={{ padding: "32px", display: "flex", flexDirection: "column" }}>
              <button onClick={() => setSelectedProduct(null)} style={{ alignSelf: "flex-end", background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", marginBottom: "16px" }}>
                <X size={24} />
              </button>
              
              {selectedProduct.category && (
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>
                  {selectedProduct.category.name}
                </div>
              )}
              <h2 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 16px 0", lineHeight: 1.2 }}>{selectedProduct.name}</h2>
              
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                {selectedProduct.isDigital ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Cloud size={14} /> Dijital Teslimat</span>
                ) : (
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Box size={14} /> Kargo ile Teslimat</span>
                )}
              </div>

              {selectedProduct.discountPercentage > 0 ? (
                <div style={{ marginBottom: "32px" }}>
                  <div style={{ fontSize: "16px", textDecoration: "line-through", color: "rgba(255,255,255,0.4)" }}>{formatPrice(selectedProduct.price)} ₺</div>
                  <div style={{ fontSize: "32px", fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: 12 }}>
                    {formatPrice((parseInt(selectedProduct.price) * (100 - selectedProduct.discountPercentage)) / 100)} ₺
                    <span style={{ background: "#fff", color: "#000", padding: "4px 8px", fontSize: 12, fontWeight: 800 }}>%{selectedProduct.discountPercentage} İndirim</span>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: "32px", fontWeight: 800, marginBottom: "32px" }}>{formatPrice(selectedProduct.price)} ₺</div>
              )}

              <div style={{ 
                fontSize: "14px", lineHeight: 1.8, color: "rgba(255,255,255,0.6)", marginBottom: "32px",
                whiteSpace: "pre-line", flex: 1
              }}>
                {selectedProduct.detailedDescription || selectedProduct.description || "Bu ürün için ekstra detay girilmemiştir."}
              </div>

              <div style={{ marginTop: "auto" }}>
                <button 
                  onClick={() => handleAddToCart(selectedProduct)}
                  style={{ 
                    width: "100%", padding: "16px", background: "#fff", color: "#000", 
                    border: "none", fontSize: "14px", fontWeight: 800, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                  }}>
                  <ShoppingBag size={18} /> Sepete Ekle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
