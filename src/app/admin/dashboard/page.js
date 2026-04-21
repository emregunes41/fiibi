import { Users, Package, Calendar, Clock, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import NotificationList from "../components/NotificationList";
import { getCurrentTenant } from "@/lib/tenant";
import { getBusinessType } from "@/lib/business-types";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import { getSiteConfig } from "../core-actions";
import DashboardClient from "./DashboardClient";

async function getDashboardTenantId() {
  const tenant = await getCurrentTenant();
  if (tenant?.id) return tenant.id;
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get("admin_token")?.value;
    if (adminToken) {
      const payload = await verifyAuth(adminToken);
      if (payload?.tenantId) return payload.tenantId;
    }
  } catch (e) {}
  return "NONE";
}

export default async function AdminDashboard() {
  const tenantId = await getDashboardTenantId();
  const tenant = await getCurrentTenant();
  const bt = getBusinessType(tenant?.businessType || "photographer");
  const { features, terms } = bt;
  const isPhotographer = (tenant?.businessType || "photographer") === "photographer";

  // Setup wizard kontrolü
  const siteConfig = await getSiteConfig();
  if (siteConfig && !siteConfig.setupCompleted) {
    return <DashboardClient config={siteConfig} />;
  }

  const tenantFilter = { tenantId };

  const totalPackages = await prisma.photographyPackage.count({ where: tenantFilter });
  const totalReservations = await prisma.reservation.count({ where: { ...tenantFilter, status: { not: "DELETED" } } });
  const pendingReservations = await prisma.reservation.count({ where: { ...tenantFilter, status: "PENDING" } });
  const totalMembers = await prisma.user.count({ where: tenantFilter });

  const recentReservations = await prisma.reservation.findMany({
    where: { ...tenantFilter, status: { not: "DELETED" } },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { packages: true }
  });

  const notifications = await prisma.adminNotification.findMany({
    where: tenantFilter,
    orderBy: { createdAt: "desc" },
    take: 10
  });

  const upcomingDeliveries = await prisma.reservation.findMany({
    where: { 
      ...tenantFilter,
      status: "CONFIRMED", 
      workflowStatus: { notIn: ["COMPLETED", "DELIVERED"] },
      deliveryDate: { not: null }
    },
    orderBy: { deliveryDate: "asc" },
    take: 5,
    include: { packages: true }
  });

  const now = new Date();
  const thirtyDaysLater = new Date(now);
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
  const upcomingShoots = await prisma.reservation.findMany({
    where: {
      ...tenantFilter,
      status: "CONFIRMED",
      eventDate: { gte: now, lte: thirtyDaysLater }
    },
    orderBy: { eventDate: "asc" },
    take: 5,
    include: { packages: true }
  });

  const getDaysLeftInfo = (date) => {
    if (!date) return { text: "-", color: "gray" };
    const diffTime = new Date(date).getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: `${Math.abs(diffDays)} GÜN GECİKTİ`, color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" };
    if (diffDays === 0) return { text: "BUGÜN", color: "rgba(255,255,255,0.5)" };
    if (diffDays <= 3) return { text: `${diffDays} GÜN KALDI`, color: "rgba(255,255,255,0.5)" };
    return { text: `${diffDays} GÜN KALDI`, color: "rgba(255,255,255,0.6)" };
  };

  const monthNames = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

  return (
    <div style={{ color: "#fff", maxWidth: "100%", overflowX: "hidden" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "clamp(1.2rem, 4vw, 1.8rem)", fontWeight: 900, letterSpacing: "-0.04em", marginBottom: "4px" }}>Genel Bakış</h1>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.75rem" }}>Yönetim Paneli · {monthNames[now.getMonth()]} {now.getFullYear()}</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "8px", marginBottom: "1.5rem" }}>
        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: "12px", borderRadius: 0 }}>
          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.6rem", fontWeight: 800, marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px", textTransform: "uppercase" }}>
            <Package size={11} /> {terms.service}
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900 }}>{totalPackages}</div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: "12px", borderRadius: 0 }}>
          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.6rem", fontWeight: 800, marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px", textTransform: "uppercase" }}>
            <Calendar size={11} /> {terms.appointment}
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900 }}>{totalReservations}</div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: "12px", borderRadius: 0 }}>
          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.6rem", fontWeight: 800, marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px", textTransform: "uppercase" }}>
            <Users size={11} /> {terms.client}
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900 }}>{totalMembers}</div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.2)", padding: "12px", borderRadius: 0 }}>
          <div style={{ color: "#fff", fontSize: "0.6rem", fontWeight: 900, marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px", textTransform: "uppercase" }}>
            <Clock size={11} /> Bekleyen
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900 }}>{pendingReservations}</div>
        </div>
      </div>

      {/* Yaklaşan Teslimatlar — only for photographers */}
      {features.galleryDelivery && (
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 0, padding: "14px", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
          <Calendar size={13} style={{ color: "rgba(255,255,255,0.6)" }} />
          <span style={{ fontWeight: 900, fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>Yaklaşan Teslimatlar</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {upcomingDeliveries.map((res) => {
            const info = getDaysLeftInfo(res.deliveryDate);
            const statusMap = { "PENDING": "Çekim Bekleniyor", "SHOT_DONE": "Düzenlemede", "EDITING": "Düzenlemede", "SELECTION_PENDING": "Seçim Bekleniyor", "DELIVERED": "Teslim Edildi", "PREPARING": "Hazırlanıyor" };
            return (
              <Link href={`/admin/reservations?open_modal=${res.id}`} key={res.id} style={{ textDecoration: "none", color: "inherit", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 0, background: info.bg || "rgba(255,255,255,0.04)", border: info.border || "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{res.brideName}{isPhotographer && res.groomName ? ` & ${res.groomName}` : ''}</div>
                  <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.5)" }}>
                    {new Date(res.eventDate).toLocaleDateString("tr-TR")} → {new Date(res.deliveryDate).toLocaleDateString("tr-TR")}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px", flexShrink: 0 }}>
                  <span style={{ fontSize: "0.6rem", fontWeight: 900, color: info.color }}>{info.text}</span>
                  <span style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.5)" }}>{statusMap[res.workflowStatus] || res.workflowStatus}</span>
                </div>
              </Link>
            );
          })}
          {upcomingDeliveries.length === 0 && (
            <div style={{ padding: "1.5rem", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.7rem" }}>Yaklaşan teslimat yok 🎉</div>
          )}
        </div>
      </div>
      )}

      {/* Notifications */}
      <NotificationList notifications={notifications} />

      {/* Upcoming Shoots + Recent Reservations */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "10px", marginBottom: "1.25rem" }}>
        
        {/* Yaklaşan Çekimler */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 0, padding: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
            <Calendar size={13} style={{ color: "rgba(255,255,255,0.6)" }} />
            <span style={{ fontWeight: 900, fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>{terms.upcoming}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {upcomingShoots.map((res) => {
              const info = getDaysLeftInfo(res.eventDate);
              return (
                <Link href={`/admin/reservations?open_modal=${res.id}`} key={res.id} style={{ textDecoration: "none", color: "inherit", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 0, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{res.brideName}{isPhotographer && res.groomName ? ` & ${res.groomName}` : ''}</div>
                    <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.5)" }}>
                      {new Date(res.eventDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "short" })}
                      {res.eventTime ? ` · ${res.eventTime}` : ''}
                    </div>
                  </div>
                  <span style={{ fontSize: "0.55rem", fontWeight: 900, color: info.color, flexShrink: 0 }}>{info.text}</span>
                </Link>
              );
            })}
            {upcomingShoots.length === 0 && (
              <div style={{ padding: "1.5rem", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.7rem" }}>Yaklaşan {terms.appointment.toLowerCase()} yok</div>
            )}
          </div>
        </div>

        {/* Son Rezervasyonlar */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 0, padding: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontWeight: 900, fontSize: "0.8rem" }}>Son {terms.appointments}</span>
            <Link href="/admin/reservations" style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.6rem", fontWeight: 800, textDecoration: "none", display: "flex", alignItems: "center", gap: "2px" }}>
              TÜMÜ <ChevronRight size={10} />
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {recentReservations.map((res) => (
              <Link href={`/admin/reservations?open_modal=${res.id}`} key={res.id} style={{ textDecoration: "none", color: "inherit", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", borderRadius: 0, background: "rgba(255,255,255,0.04)" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700 }}>{res.brideName}</div>
                  <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.5)" }}>{new Date(res.eventDate).toLocaleDateString("tr-TR")}</div>
                </div>
                <span style={{
                  padding: "2px 6px", borderRadius: 0, fontSize: "0.55rem", fontWeight: 800,
                  background: res.status === "CONFIRMED" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.05)",
                  color: res.status === "CONFIRMED" ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)",
                }}>{res.status === "CONFIRMED" ? "ONAYLI" : "BEKLEMEDE"}</span>
              </Link>
            ))}
            {recentReservations.length === 0 && (
              <div style={{ padding: "1.5rem", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.7rem" }}>Kayıt yok</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
