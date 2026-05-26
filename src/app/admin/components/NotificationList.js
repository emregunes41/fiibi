"use client";

import { useState, useTransition } from "react";
import { Bell, CheckCircle, CreditCard, FileText, Camera, BookOpen, ShoppingBag, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { markNotificationAsRead, clearAllNotifications } from "../notification-actions";
import { useRouter } from "next/navigation";

const TYPE_CONFIG = {
  RESERVATION: { icon: BookOpen, color: "#3b82f6", bg: "rgba(59,130,246,0.08)", label: "Rezervasyon" },
  PAYMENT: { icon: CreditCard, color: "#22c55e", bg: "rgba(34,197,94,0.08)", label: "Ödeme" },
  CONTRACT: { icon: FileText, color: "#a855f7", bg: "rgba(168,85,247,0.08)", label: "Sözleşme" },
  PHOTO_SELECTION: { icon: Camera, color: "#f59e0b", bg: "rgba(245,158,11,0.08)", label: "Fotoğraf" },
  ALBUM: { icon: BookOpen, color: "#ec4899", bg: "rgba(236,72,153,0.08)", label: "Albüm" },
  PAYMENT_PREF: { icon: ShoppingBag, color: "#6366f1", bg: "rgba(99,102,241,0.08)", label: "Ödeme Tercihi" },
  INFO: { icon: Bell, color: "#64748b", bg: "rgba(100,116,139,0.08)", label: "Bilgi" },
};

function timeAgo(dateStr) {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now - d;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Az önce";
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Dün";
  if (days < 7) return `${days} gün önce`;
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export default function NotificationList({ notifications }) {
  const [loadingIds, setLoadingIds] = useState(new Set());
  const [isClearing, setIsClearing] = useState(false);
  const [showRead, setShowRead] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const unread = notifications.filter(n => !n.isRead);
  const read = notifications.filter(n => n.isRead);

  const handleMarkAsRead = async (id) => {
    setLoadingIds(prev => new Set([...prev, id]));
    await markNotificationAsRead(id);
    startTransition(() => router.refresh());
    setLoadingIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleClearAll = async () => {
    if (unread.length === 0) return;
    setIsClearing(true);
    await clearAllNotifications();
    startTransition(() => router.refresh());
    setIsClearing(false);
  };

  if (notifications.length === 0) {
    return (
      <div style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)", padding: "24px", marginBottom: "1.5rem", textAlign: "center" }}>
        <Bell size={24} style={{ color: "rgba(0,0,0,0.2)", margin: "0 auto 8px" }} />
        <div style={{ fontSize: 13, color: "rgba(0,0,0,0.4)", fontWeight: 600 }}>Henüz bildirim yok</div>
      </div>
    );
  }

  const NotifItem = ({ notif, isUnread }) => {
    const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.INFO;
    const Icon = cfg.icon;
    return (
      <div
        style={{
          display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px",
          background: isUnread ? cfg.bg : "transparent",
          border: isUnread ? `1px solid ${cfg.color}20` : "1px solid rgba(0,0,0,0.04)",
          transition: "all 0.2s",
          opacity: isUnread ? 1 : 0.6,
        }}
      >
        {/* Icon */}
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: isUnread ? `${cfg.color}18` : "rgba(0,0,0,0.06)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          marginTop: 2,
        }}>
          <Icon size={14} style={{ color: isUnread ? cfg.color : "rgba(0,0,0,0.4)" }} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <span style={{
              fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em",
              color: isUnread ? cfg.color : "rgba(0,0,0,0.4)",
            }}>
              {cfg.label}
            </span>
            <span style={{ fontSize: 10, color: "rgba(0,0,0,0.35)" }}>·</span>
            <span style={{ fontSize: 10, color: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", gap: 3 }}>
              <Clock size={9} /> {timeAgo(notif.createdAt)}
            </span>
          </div>
          <div style={{
            fontSize: 13, fontWeight: isUnread ? 600 : 500,
            color: isUnread ? "#1a1a1a" : "rgba(0,0,0,0.6)",
            lineHeight: 1.5, wordBreak: "break-word",
          }}>
            {notif.message}
          </div>
        </div>

        {/* Mark as read */}
        {isUnread && (
          <button
            onClick={() => handleMarkAsRead(notif.id)}
            disabled={loadingIds.has(notif.id)}
            style={{
              background: "none", border: "none",
              color: "rgba(0,0,0,0.3)", cursor: "pointer", padding: 4,
              flexShrink: 0, transition: "color 0.2s",
            }}
            title="Okundu İşaretle"
          >
            <CheckCircle size={16} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.08)", overflow: "hidden", marginBottom: "1.5rem" }}>
      {/* Header */}
      <div style={{
        padding: "14px 20px", borderBottom: "1px solid rgba(0,0,0,0.06)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Bell size={16} style={{ color: "#1a1a1a" }} />
          <span style={{ fontWeight: 800, fontSize: 14, color: "#1a1a1a" }}>Bildirimler</span>
          {unread.length > 0 && (
            <span style={{
              background: "#ef4444", color: "#fff",
              fontSize: 10, fontWeight: 800, padding: "2px 8px",
              borderRadius: 10, minWidth: 20, textAlign: "center",
            }}>
              {unread.length}
            </span>
          )}
        </div>

        {unread.length > 0 && (
          <button
            onClick={handleClearAll}
            disabled={isClearing}
            style={{
              background: "rgba(0,0,0,0.06)", border: "none",
              color: "rgba(0,0,0,0.6)", padding: "5px 12px",
              fontSize: 11, fontWeight: 700, cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {isClearing ? "İşleniyor..." : "Tümünü Okundu İşaretle"}
          </button>
        )}
      </div>

      {/* Unread */}
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {unread.length === 0 && (
          <div style={{ padding: "20px", textAlign: "center", color: "rgba(0,0,0,0.4)", fontSize: 13 }}>
            ✅ Tüm bildirimler okundu
          </div>
        )}
        {unread.map(n => <NotifItem key={n.id} notif={n} isUnread />)}
      </div>

      {/* Read toggle */}
      {read.length > 0 && (
        <>
          <button
            onClick={() => setShowRead(!showRead)}
            style={{
              width: "100%", padding: "10px 20px",
              background: "rgba(0,0,0,0.03)", border: "none", borderTop: "1px solid rgba(0,0,0,0.06)",
              color: "rgba(0,0,0,0.5)", fontSize: 11, fontWeight: 700,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            {showRead ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showRead ? "Okunanları Gizle" : `Okunanları Göster (${read.length})`}
          </button>
          {showRead && (
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {read.map(n => <NotifItem key={n.id} notif={n} isUnread={false} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
