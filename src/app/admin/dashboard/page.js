import { Users, Package, Calendar, Clock, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import NotificationList from "../components/NotificationList";
import DashboardInteractiveLists from "../components/DashboardInteractiveLists";
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

      {/* Interactive Lists */}
      <DashboardInteractiveLists 
        upcomingDeliveries={upcomingDeliveries}
        upcomingShoots={upcomingShoots}
        recentReservations={recentReservations}
        terms={terms}
        isPhotographer={isPhotographer}
        paymentMode={bt?.paymentMode || "cash"}
      />
    </div>
  );
}
