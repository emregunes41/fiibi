"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Clock, Calendar, ChevronRight } from "lucide-react";
import ReservationHubModal from "./ReservationHubModal";

export default function DashboardInteractiveLists({ 
  upcomingDeliveries, 
  upcomingShoots, 
  recentReservations, 
  terms, 
  isPhotographer,
  paymentMode
}) {
  const [detailModal, setDetailModal] = useState({ isOpen: false, data: null });

  const router = useRouter();

  // Update reservations function? Dashboard is server rendered, so we can't easily refetch
  // all data. We use router.refresh() to soft-reload server components in background
  // without losing client states (like this modal staying open).
  const handleUpdate = () => {
    router.refresh();
  };

  const getDaysLeftInfo = (targetDate) => {
    const d = new Date(targetDate);
    d.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);
    const diffTime = d - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: `${Math.abs(diffDays)} gün gecikti`, color: "#ef4444" };
    if (diffDays === 0) return { text: "Bugün", color: "#facc15" };
    if (diffDays === 1) return { text: "Yarın", color: "#4ade80" };
    return { text: `${diffDays} gün kaldı`, color: "#fff" };
  };

  const statusMap = {
    PENDING: "Çekim Bekleniyor", EDITING: "Düzenleniyor",
    SELECTION_PENDING: "Seçim Bekleniyor", PREPARING: "Hazırlanıyor",
    COMPLETED: "Teslim Edildi"
  };

  return (
    <>
      {/* Yaklaşan Teslimatlar / İşler (sadece iş akışı takipçilere) */}
      {isPhotographer && (
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 0, padding: "14px", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
          <Package size={13} style={{ color: "rgba(255,255,255,0.6)" }} />
          <span style={{ fontWeight: 900, fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>Yaklaşan Teslimatlar</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {upcomingDeliveries.map((res) => {
            const info = getDaysLeftInfo(res.deliveryDate);
            const isLate = info.text.includes("gecikti") || info.text.includes("Bugün");
            return (
              <div 
                key={res.id} 
                onClick={() => setDetailModal({ isOpen: true, data: res })}
                style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 0, background: isLate ? "rgba(239,68,68,0.05)" : "rgba(255,255,255,0.04)", border: isLate ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(255,255,255,0.06)" }}
              >
                <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{res.brideName}{isPhotographer && res.groomName ? ` & ${res.groomName}` : ''}</div>
                  </div>
                  <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.5)" }}>
                    {new Date(res.eventDate).toLocaleDateString("tr-TR")} → {new Date(res.deliveryDate).toLocaleDateString("tr-TR")}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px", flexShrink: 0 }}>
                  <span style={{ fontSize: "0.6rem", fontWeight: 900, color: info.color }}>{info.text}</span>
                  <span style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.5)" }}>{statusMap[res.workflowStatus] || res.workflowStatus}</span>
                </div>
              </div>
            );
          })}
          {upcomingDeliveries.length === 0 && (
            <div style={{ padding: "1.5rem", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.7rem" }}>Yaklaşan teslimat yok 🎉</div>
          )}
        </div>
      </div>
      )}

      {/* Upcoming Shoots + Recent Reservations */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "10px", marginBottom: "1.25rem" }}>
        
        {/* Yaklaşan Çekimler */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 0, padding: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
            <Calendar size={13} style={{ color: "rgba(255,255,255,0.6)" }} />
            <span style={{ fontWeight: 900, fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>{terms.upcoming || "Yaklaşan Etkinlikler"}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {upcomingShoots.map((res) => {
              const info = getDaysLeftInfo(res.eventDate);
              return (
                <div 
                  key={res.id} 
                  onClick={() => setDetailModal({ isOpen: true, data: res })}
                  style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 0, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{res.brideName}{isPhotographer && res.groomName ? ` & ${res.groomName}` : ''}</div>
                    <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.5)" }}>
                      {new Date(res.eventDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "short" })}
                      {res.eventTime ? ` · ${res.eventTime}` : ''}
                    </div>
                  </div>
                  <span style={{ fontSize: "0.55rem", fontWeight: 900, color: info.color, flexShrink: 0 }}>{info.text}</span>
                </div>
              );
            })}
            {upcomingShoots.length === 0 && (
              <div style={{ padding: "1.5rem", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.7rem" }}>Yaklaşan {terms.appointment?.toLowerCase() || "randevu"} yok</div>
            )}
          </div>
        </div>

        {/* Son Rezervasyonlar */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 0, padding: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontWeight: 900, fontSize: "0.8rem" }}>Son {terms.appointments || "Kayıtlar"}</span>
            <a href="/admin/reservations" style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.6rem", fontWeight: 800, textDecoration: "none", display: "flex", alignItems: "center", gap: "2px" }}>
              TÜMÜ <ChevronRight size={10} />
            </a>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {recentReservations.map((res) => (
              <div 
                key={res.id} 
                onClick={() => setDetailModal({ isOpen: true, data: res })}
                style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", borderRadius: 0, background: "rgba(255,255,255,0.04)" }}
              >
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700 }}>{res.brideName}</div>
                  <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.5)" }}>{new Date(res.eventDate).toLocaleDateString("tr-TR")}</div>
                </div>
                <span style={{
                  padding: "2px 6px", borderRadius: 0, fontSize: "0.55rem", fontWeight: 800,
                  background: res.status === "CONFIRMED" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.05)",
                  color: res.status === "CONFIRMED" ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)",
                }}>{res.status === "CONFIRMED" ? "ONAYLI" : "BEKLEMEDE"}</span>
              </div>
            ))}
            {recentReservations.length === 0 && (
              <div style={{ padding: "1.5rem", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.7rem" }}>Kayıt yok</div>
            )}
          </div>
        </div>
      </div>

      <ReservationHubModal 
        isOpen={detailModal.isOpen} 
        reservation={detailModal.data} 
        onClose={() => setDetailModal({ isOpen: false, data: null })} 
        onUpdate={handleUpdate}
        isPhotographer={isPhotographer}
        terms={terms}
        paymentMode={paymentMode} // Not available directly in props, passed below or handled?
      />
    </>
  );
}
