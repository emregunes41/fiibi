"use client";

import { useState } from "react";
import { Bell, CheckCircle, Trash2 } from "lucide-react";
import { markNotificationAsRead, clearAllNotifications } from "../notification-actions";

export default function NotificationList({ notifications }) {
  const [loadingIds, setLoadingIds] = useState(new Set());
  const [isClearing, setIsClearing] = useState(false);

  // Separate unread and read
  const unread = notifications.filter(n => !n.isRead);
  const read = notifications.filter(n => n.isRead);

  const handleMarkAsRead = async (id) => {
    setLoadingIds(prev => new Set([...prev, id]));
    await markNotificationAsRead(id);
    setLoadingIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleClearAll = async () => {
    if (unread.length === 0) return;
    if (confirm("Tüm okunmamış bildirimleri okundu olarak işaretlemek istiyor musunuz?")) {
      setIsClearing(true);
      await clearAllNotifications();
      setIsClearing(false);
    }
  };

  if (notifications.length === 0) {
    return null; // Don't show the widget if there are absolutely no notifications
  }

  return (
    <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "2rem", overflow: "hidden", marginBottom: "3rem" }}>
      <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontWeight: 900, fontSize: "1.2rem", letterSpacing: "-0.02em", color: "#60A5FA", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Bell size={18} /> Bildirimler
          {unread.length > 0 && (
            <span style={{ background: "rgba(255,255,255,0.6)", color: "#fff", fontSize: "0.7rem", padding: "0.2rem 0.5rem", borderRadius: 0, fontWeight: 900 }}>
              {unread.length} YENİ
            </span>
          )}
        </h3>
        
        {unread.length > 0 && (
          <button 
            onClick={handleClearAll}
            disabled={isClearing}
            style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)", padding: "0.4rem 1rem", borderRadius: "2rem", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer", transition: "all 0.2s" }}
            className="hover:bg-white/10 hover:text-white"
          >
            {isClearing ? "İşleniyor..." : "TÜMÜNÜ OKUNDU İŞARETLE"}
          </button>
        )}
      </div>

      <div style={{ padding: "1rem" }}>
        {unread.length === 0 && read.length > 0 && (
          <div style={{ padding: "1rem", textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", fontWeight: 500 }}>
            Tüm bildirimler okundu.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {unread.map(notif => (
            <div key={notif.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "1rem 1.5rem", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "1rem", gap: "1rem" }}>
              <div>
                <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#93C5FD", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {new Date(notif.createdAt).toLocaleString("tr-TR")}
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#fff", lineHeight: "1.4" }}>
                  {notif.message}
                </div>
              </div>
              <button 
                onClick={() => handleMarkAsRead(notif.id)}
                disabled={loadingIds.has(notif.id)}
                style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: "0.5rem" }}
                className="hover:text-white"
                title="Okundu İşaretle"
              >
                <CheckCircle size={20} />
              </button>
            </div>
          ))}

          {read.map(notif => (
            <div key={notif.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "1rem 1.5rem", background: "transparent", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "1rem", gap: "1rem", opacity: 0.6 }}>
              <div>
                <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "rgba(255,255,255,0.5)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {new Date(notif.createdAt).toLocaleString("tr-TR")}
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "rgba(255,255,255,0.6)", lineHeight: "1.4" }}>
                  {notif.message}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
