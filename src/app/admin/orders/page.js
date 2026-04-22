"use client";

import { useState, useEffect } from "react";
import { Package, MapPin, Truck, Search, Check, Mail, User, Phone, CheckCircle, Clock, Ban, Eye, CreditCard, Box, X } from "lucide-react";
import { getOrders, updateReservationStatus, updateOrderShipping, getPackages, getSiteConfig } from "../core-actions";
import { useAdminSession } from "../AdminSessionContext";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import AdminPageTabs from "../components/AdminPageTabs";

const inp = {
  padding: "0.7rem 0.8rem", borderRadius: 0, fontSize: "0.8rem",
  border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.08)",
  color: "#fff", outline: "none", width: "100%", boxSizing: "border-box",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [detailModal, setDetailModal] = useState({ isOpen: false, data: null });
  const [shippingModal, setShippingModal] = useState({ isOpen: false, orderId: null, trackingUrl: "" });
  const { session: adminSession } = useAdminSession();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getOrders();
      setOrders(data || []);
    } catch(e) {}
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (id, status) => {
    setIsLoading(true);
    try {
      const res = await updateReservationStatus(id, status);
      if (res?.error) {
        alert("Hata: " + res.error);
      }
      await loadData();
    } finally {
      setIsLoading(false);
    }
  };

  const handleShippingSubmit = async () => {
    if (!shippingModal.orderId) return;
    setIsLoading(true);
    try {
      const res = await updateOrderShipping(shippingModal.orderId, "SHIPPED", shippingModal.trackingUrl);
      if (res?.error) {
        alert("Hata: " + res.error);
      }
      setShippingModal({ isOpen: false, orderId: null, trackingUrl: "" });
      await loadData();
    } finally {
      setIsLoading(false);
    }
  };

  const fmt = (num) => Number(num||0).toLocaleString('tr-TR');

  const filteredOrders = orders.filter(o => {
    if (filterStatus !== "ALL" && o.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nameMatch = (o.brideName || "").toLowerCase().includes(q);
      const emailMatch = (o.brideEmail || "").toLowerCase().includes(q);
      const phoneMatch = (o.bridePhone || "").toLowerCase().includes(q);
      return nameMatch || emailMatch || phoneMatch;
    }
    return true;
  });

  return (
    <div style={{ padding: "0 1rem", maxWidth: "1200px", margin: "0 auto", animation: "fadeIn 0.4s" }}>
      <div style={{ marginBottom: "16px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em", margin: 0 }}>Mağaza</h1>
      </div>

      <AdminPageTabs tabs={[
        { label: "Ürünler", href: "/admin/products" },
        { label: "Siparişler", href: "/admin/orders" }
      ]} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <p style={{ color: "rgba(255,255,255,0.5)", margin: 0, fontSize: "0.95rem" }}>Mağazanızdan verilen fiziki ve dijital ürün siparişleri.</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "250px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)" }} />
          <input 
            type="text" 
            placeholder="Müşteri Ara (isim, e-posta, telefon)..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ ...inp, paddingLeft: "36px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px" }}
          />
        </div>
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
          {["ALL", "PENDING", "CONFIRMED", "SHIPPED", "COMPLETED", "CANCELED"].map(st => (
            <button key={st} onClick={() => setFilterStatus(st)}
              style={{
                padding: "8px 16px", borderRadius: "40px", fontSize: "12px", fontWeight: 700,
                border: "1px solid", whiteSpace: "nowrap", cursor: "pointer", transition: "all 0.2s",
                background: filterStatus === st ? "#fff" : "transparent",
                color: filterStatus === st ? "#000" : "rgba(255,255,255,0.5)",
                borderColor: filterStatus === st ? "#fff" : "rgba(255,255,255,0.1)",
              }}
            >
              {st === "ALL" ? "Tümü" : 
               st === "PENDING" ? "Bekleyen" : 
               st === "CONFIRMED" ? "Hazırlanıyor" : 
               st === "SHIPPED" ? "Kargoda" : 
               st === "COMPLETED" ? "Teslim Edildi" : "İptal"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: "64px", color: "rgba(255,255,255,0.5)" }}>Yükleniyor...</div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)" }}>
          <Package size={48} style={{ color: "rgba(255,255,255,0.1)", margin: "0 auto 16px" }} />
          <h3 style={{ margin: "0 0 8px" }}>Sipariş Bulunamadı</h3>
          <p style={{ color: "rgba(255,255,255,0.4)", margin: 0, fontSize: "14px" }}>Şu anda herhangi bir sipariş kaydı yok.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filteredOrders.map(order => {
            const dateStr = new Date(order.createdAt).toLocaleDateString("tr-TR", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' });
            let hasPhysical = false;
            let productList = [];
            
            try {
              if (order.purchasedProducts) {
                productList = Array.isArray(order.purchasedProducts) ? order.purchasedProducts : JSON.parse(order.purchasedProducts);
                hasPhysical = productList.some(p => p && !p.isDigital);
              }
            } catch(e) {}

            return (
              <div key={order.id} style={{ 
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", 
                borderRadius: "8px", overflow: "hidden" 
              }}>
                <div style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ 
                      width: 40, height: 40, borderRadius: "8px", 
                      background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" 
                    }}>
                      <Box size={20} color="rgba(255,255,255,0.7)" />
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: 700 }}>{order.brideName}</div>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Clock size={12} /> {dateStr}
                        <span style={{ padding: "2px 6px", background: "rgba(255,255,255,0.05)", borderRadius: "20px", fontSize: "10px" }}>
                          {order.paymentStatus === "PAID" ? "ÖDENDİ" : "BEKLİYOR"}
                        </span>
                        <span style={{ 
                          padding: "2px 6px", borderRadius: "20px", fontSize: "10px", fontWeight: 700,
                          background: order.status === "PENDING" ? "rgba(245, 158, 11, 0.2)" : 
                                      order.status === "CONFIRMED" ? "rgba(59, 130, 246, 0.2)" : 
                                      order.status === "SHIPPED" ? "rgba(16, 185, 129, 0.2)" : "rgba(255,255,255,0.1)",
                          color: order.status === "PENDING" ? "#f59e0b" : 
                                 order.status === "CONFIRMED" ? "#3b82f6" : 
                                 order.status === "SHIPPED" ? "#10b981" : "rgba(255,255,255,0.7)"
                        }}>
                          {order.status === "PENDING" ? "ONAY BEKLİYOR" : 
                           order.status === "CONFIRMED" ? "HAZIRLANIYOR" : 
                           order.status === "SHIPPED" ? "KARGODA" : 
                           order.status === "COMPLETED" ? "TESLİM EDİLDİ" : 
                           order.status === "CANCELED" ? "İPTAL EDİLDİ" : 
                           order.status === "DELETED" ? "SİLİNDİ" : order.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ fontSize: "18px", fontWeight: 800 }}>{fmt(order.totalAmount)}₺</div>
                    <button onClick={() => setDetailModal({ isOpen: true, data: { ...order, productList, hasPhysical } })} style={{
                      padding: "8px 16px", background: "rgba(255,255,255,0.05)", border: "none", color: "#fff",
                      fontSize: "13px", fontWeight: 600, borderRadius: "6px", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: "6px"
                    }}>
                      <Eye size={14} /> Detaylar
                    </button>
                  </div>
                </div>
                
                <div style={{ padding: "12px 24px", background: "rgba(0,0,0,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                   <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", display: "flex", gap: "16px" }}>
                     <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><Phone size={14} /> {order.bridePhone}</div>
                     {hasPhysical && <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#60a5fa" }}><Truck size={14} /> Kargo Gönderimi</div>}
                   </div>
                   
                   <div style={{ display: "flex", gap: "6px" }}>
                      {order.status === "PENDING" && (
                        <button onClick={() => handleStatusChange(order.id, "CONFIRMED")} style={{ padding: "6px 12px", background: "#f59e0b", border: "none", color: "#000", fontSize: "12px", fontWeight: 700, borderRadius: "4px", cursor: "pointer" }}>
                          Hazırlanıyor İşaretle
                        </button>
                      )}
                      {order.status === "CONFIRMED" && hasPhysical && (
                        <button onClick={() => setShippingModal({ isOpen: true, orderId: order.id, trackingUrl: "" })} style={{ padding: "6px 12px", background: "#3b82f6", border: "none", color: "#fff", fontSize: "12px", fontWeight: 700, borderRadius: "4px", cursor: "pointer" }}>
                          Kargoya Ver
                        </button>
                      )}
                      {order.status === "CONFIRMED" && !hasPhysical && (
                        <button onClick={() => handleStatusChange(order.id, "COMPLETED")} style={{ padding: "6px 12px", background: "#10b981", border: "none", color: "#fff", fontSize: "12px", fontWeight: 700, borderRadius: "4px", cursor: "pointer" }}>
                          Tamamlandı İşaretle
                        </button>
                      )}
                      {order.status === "SHIPPED" && (
                        <button onClick={() => handleStatusChange(order.id, "COMPLETED")} style={{ padding: "6px 12px", background: "#10b981", border: "none", color: "#fff", fontSize: "12px", fontWeight: 700, borderRadius: "4px", cursor: "pointer" }}>
                          Teslim Edildi
                        </button>
                      )}
                      {(order.status === "PENDING" || order.status === "CONFIRMED") && (
                        <button onClick={() => handleStatusChange(order.id, "CANCELED")} style={{ padding: "6px 12px", background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontSize: "12px", fontWeight: 700, borderRadius: "4px", cursor: "pointer" }}>
                          İptal Et
                        </button>
                      )}
                      {order.status === "SHIPPED" && <div style={{ fontSize: "12px", color: "#3b82f6", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}><Truck size={14} /> Kargoda</div>}
                      {order.status === "COMPLETED" && <div style={{ fontSize: "12px", color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}><CheckCircle size={14} /> Teslim Edildi</div>}
                      {order.status === "CANCELED" && <div style={{ fontSize: "12px", color: "#ef4444", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}><Ban size={14} /> İptal Edildi</div>}
                   </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detay Modalı */}
      <AnimatePresence>
        {detailModal.isOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyItems: "center" }}>
            <div onClick={() => setDetailModal({ isOpen: false, data: null })} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }} />
            <div style={{
              background: "#0a0a0f", width: "90%", maxWidth: "600px", zIndex: 1, margin: "auto", position: "relative",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", overflow: "hidden",
            }}>
              <div style={{ padding: "20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0, fontSize: "18px", display: "flex", alignItems: "center", gap: "10px" }}><Box size={20} /> Sipariş Detayları</h2>
                <button onClick={() => setDetailModal({ isOpen: false, data: null })} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><X size={20} /></button>
              </div>

              <div style={{ padding: "24px", maxHeight: "70vh", overflowY: "auto" }}>
                
                <div style={{ marginBottom: "24px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "rgba(255,255,255,0.4)", marginBottom: "12px" }}>MÜŞTERİ BİLGİLERİ</div>
                  <div style={{ background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}><User size={16} color="rgba(255,255,255,0.4)" /> {detailModal.data.brideName}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}><Phone size={16} color="rgba(255,255,255,0.4)" /> {detailModal.data.bridePhone}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}><Mail size={16} color="rgba(255,255,255,0.4)" /> {detailModal.data.brideEmail}</div>
                  </div>
                </div>

                {detailModal.data.hasPhysical && (
                  <div style={{ marginBottom: "24px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "rgba(255,255,255,0.4)", marginBottom: "12px" }}>KARGO ADRESİ</div>
                    <div style={{ background: "rgba(96,165,250,0.05)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(96,165,250,0.1)", display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <MapPin size={18} color="#60a5fa" style={{ flexShrink: 0, marginTop: "2px" }} />
                      <div style={{ fontSize: "14px", lineHeight: 1.6 }}>{detailModal.data.shippingAddress || "Adres belirtilmemiş."}</div>
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: "24px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "rgba(255,255,255,0.4)", marginBottom: "12px" }}>SİPARİŞ EDİLEN ÜRÜNLER</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {detailModal.data.productList.map((item, idx) => (
                      <div key={idx} style={{ 
                        display: "flex", justifyContent: "space-between", alignItems: "center", 
                        padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: 40, height: 40, borderRadius: "6px", background: "rgba(0,0,0,0.4)", overflow: "hidden" }}>
                            {item.imageUrls?.[0] ? <img src={item.imageUrls[0]} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Package size={20} style={{ margin: "10px", color: "rgba(255,255,255,0.2)" }} />}
                          </div>
                          <div>
                            <div style={{ fontSize: "14px", fontWeight: 600 }}>{item.name}</div>
                            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>
                              {item.isDigital ? "Dijital Ürün" : "Fiziksel Ürün"} • #{item.id?.substring(0,8) || "000"}
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: "14px", fontWeight: 700 }}>
                          {item.purchasedPrice ?? item.price} ₺
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {detailModal.data.notes && (
                  <div style={{ marginBottom: "24px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "rgba(255,255,255,0.4)", marginBottom: "12px" }}>SİPARİŞ NOTU</div>
                    <div style={{ background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "8px", border: "1px dashed rgba(255,255,255,0.1)", fontSize: "14px", lineHeight: 1.6, fontStyle: "italic", color: "rgba(255,255,255,0.7)" }}>
                      "{detailModal.data.notes}"
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Kargo Takip Modal */}
      <AnimatePresence>
        {shippingModal.isOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyItems: "center" }}>
            <div onClick={() => setShippingModal({ isOpen: false, orderId: null, trackingUrl: "" })} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }} />
            <div style={{
              background: "#0a0a0f", width: "90%", maxWidth: "450px", zIndex: 1, margin: "auto", position: "relative",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", overflow: "hidden",
            }}>
              <div style={{ padding: "20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0, fontSize: "18px", display: "flex", alignItems: "center", gap: "10px" }}><Truck size={20} /> Kargo Bilgisi Gir</h2>
                <button onClick={() => setShippingModal({ isOpen: false, orderId: null, trackingUrl: "" })} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><X size={20} /></button>
              </div>

              <div style={{ padding: "24px" }}>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "8px" }}>Kargo Takip Linki (Opsiyonel)</label>
                  <input
                    type="text"
                    value={shippingModal.trackingUrl}
                    onChange={(e) => setShippingModal(p => ({ ...p, trackingUrl: e.target.value }))}
                    placeholder="https://kargotakip.com/..."
                    style={inp}
                  />
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "8px" }}>Müşteriniz profil sayfasında bu bağlantıya tıklayarak kargo durumunu öğrenebilecektir.</p>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                  <button onClick={() => setShippingModal({ isOpen: false, orderId: null, trackingUrl: "" })} style={{ padding: "10px 16px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}>
                    İptal
                  </button>
                  <button onClick={handleShippingSubmit} style={{ padding: "10px 16px", background: "#3b82f6", border: "none", color: "#fff", borderRadius: "6px", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                    <Truck size={16} /> Kargoya Verildi İşaretle
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
