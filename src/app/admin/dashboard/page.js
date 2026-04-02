import { LayoutDashboard, Users, Package, Calendar, Clock, ChevronRight, Bell, CheckCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { markNotificationAsRead, clearAllNotifications } from "../notification-actions";
import NotificationList from "../components/NotificationList";

export default async function AdminDashboard() {
  // Fetch quick stats
  const totalPackages = await prisma.photographyPackage.count();
  const totalReservations = await prisma.reservation.count();
  const pendingReservations = await prisma.reservation.count({ where: { status: "PENDING" } });
  const totalMembers = await prisma.user.count();

  // Fetch recent reservations
  const recentReservations = await prisma.reservation.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { packages: true }
  });

  // Fetch recent notifications
  const notifications = await prisma.adminNotification.findMany({
    orderBy: { createdAt: "desc" },
    take: 10
  });

  // Fetch upcoming deliveries
  const upcomingDeliveries = await prisma.reservation.findMany({
    where: { 
      status: "CONFIRMED", 
      workflowStatus: { not: "COMPLETED" },
      deliveryDate: { not: null }
    },
    orderBy: { deliveryDate: "asc" },
    take: 5,
    include: { packages: true }
  });

  const getDaysLeftInfo = (date) => {
    if (!date) return { text: "-", color: "gray" };
    const diffTime = new Date(date).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: `${Math.abs(diffDays)} GÜN GECİKTİ`, color: "#EF4444" };
    if (diffDays === 0) return { text: "BUGÜN TESLİM", color: "#F59E0B" };
    if (diffDays <= 3) return { text: `${diffDays} GÜN KALDI`, color: "#F59E0B" };
    return { text: `${diffDays} GÜN KALDI`, color: "#10B981" };
  };

  // Calculate total revenue from confirmed reservations
  const confirmedReservations = await prisma.reservation.findMany({
    where: { status: "CONFIRMED" },
    select: { paidAmount: true }
  });
  
  const totalRevenue = confirmedReservations.reduce((acc, res) => {
    const amount = parseFloat(res.paidAmount?.replace(/[^0-9.]/g, '') || "0");
    return acc + amount;
  }, 0);

  return (
    <div style={{ color: "#fff" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "clamp(1.2rem, 4vw, 1.8rem)", fontWeight: 900, letterSpacing: "-0.04em", marginBottom: "4px" }}>Genel Bakış</h1>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.75rem" }}>Pinowed yönetim paneli</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "1.5rem" }}>
        
        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: "12px", borderRadius: "10px" }}>
          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.6rem", fontWeight: 800, marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px", textTransform: "uppercase" }}>
            <Package size={11} /> Paket
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900 }}>{totalPackages}</div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: "12px", borderRadius: "10px" }}>
          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.6rem", fontWeight: 800, marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px", textTransform: "uppercase" }}>
            <Calendar size={11} /> Randevu
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900 }}>{totalReservations}</div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: "12px", borderRadius: "10px" }}>
          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.6rem", fontWeight: 800, marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px", textTransform: "uppercase" }}>
            <Users size={11} /> Üye
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900 }}>{totalMembers}</div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.2)", padding: "12px", borderRadius: "10px" }}>
          <div style={{ color: "#fff", fontSize: "0.6rem", fontWeight: 900, marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px", textTransform: "uppercase" }}>
            <Clock size={11} /> Bekleyen
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900 }}>{pendingReservations}</div>
        </div>
      </div>

      {/* Notifications Widget */}
      <NotificationList notifications={notifications} />

      {/* Revenue & Recent */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "10px", marginBottom: "1.25rem" }}>
        
        {/* Revenue Card */}
        <div style={{ background: "linear-gradient(145deg, #111 0%, #000 100%)", border: "1px solid rgba(255,255,255,0.08)", padding: "16px", borderRadius: "12px" }}>
          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.6rem", fontWeight: 800, marginBottom: "8px", textTransform: "uppercase" }}>Kazanç İlerlemesi</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "4px" }}>{totalRevenue.toLocaleString("tr-TR")} TL</div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.65rem", marginBottom: "12px" }}>Onaylı rezervasyonlardan</p>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6rem", fontWeight: 800, marginBottom: "4px" }}>
            <span>HEDEF: 50.000 TL</span>
            <span>%{Math.min(100, Math.round((totalRevenue / 50000) * 100))}</span>
          </div>
          <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "6px", overflow: "hidden" }}>
            <div style={{ height: "100%", background: "#fff", width: `${Math.min(100, (totalRevenue / 50000) * 100)}%`, boxShadow: "0 0 8px #fff" }} />
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontWeight: 900, fontSize: "0.8rem" }}>Son Rezervasyonlar</span>
            <Link href="/admin/reservations" style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.6rem", fontWeight: 800, textDecoration: "none", display: "flex", alignItems: "center", gap: "2px" }}>
              TÜMÜ <ChevronRight size={10} />
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {recentReservations.map((res) => (
              <div key={res.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", borderRadius: "6px", background: "rgba(255,255,255,0.08)" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700 }}>{res.brideName}</div>
                  <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.5)" }}>{new Date(res.eventDate).toLocaleDateString("tr-TR")}</div>
                </div>
                <span style={{
                  padding: "2px 6px", borderRadius: "4px", fontSize: "0.55rem", fontWeight: 800,
                  background: res.status === "CONFIRMED" ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.05)",
                  color: res.status === "CONFIRMED" ? "#34d399" : "rgba(255,255,255,0.4)",
                }}>{res.status === "CONFIRMED" ? "ONAYLI" : "BEKLEMEDE"}</span>
              </div>
            ))}
            {recentReservations.length === 0 && (
              <div style={{ padding: "1.5rem", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.7rem" }}>Kayıt yok</div>
            )}
          </div>
        </div>
      </div>

      {/* Yaklaşan Teslimatlar */}
      <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,191,36,0.2)", borderRadius: "12px", padding: "14px", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
          <Calendar size={13} style={{ color: "#FBBF24" }} />
          <span style={{ fontWeight: 900, fontSize: "0.8rem", color: "#FBBF24" }}>Yaklaşan Teslimatlar</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {upcomingDeliveries.map((res) => {
            const info = getDaysLeftInfo(res.deliveryDate);
            const statusMap = { "PENDING": "Çekim Bekleniyor", "SHOT_DONE": "Düzenlemede", "EDITING": "Düzenlemede", "SELECTION_PENDING": "Seçim Bekleniyor", "DELIVERED": "Teslim Edildi" };
            return (
              <div key={res.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: "8px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{res.brideName} {res.groomName ? `& ${res.groomName}` : ''}</div>
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
    </div>
  );
}

