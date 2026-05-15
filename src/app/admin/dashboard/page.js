import { Users, Package, Calendar, Clock, ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react";
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
import { getPlanLimits } from "@/lib/plan-limits";

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

  const planLimits = getPlanLimits(tenant?.plan || "trial");

  const tenantFilter = { tenantId };

  const now = new Date();
  const thirtyDaysLater = new Date(now);
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

  const [
    totalPackages,
    totalReservations,
    pendingReservations,
    totalMembers,
    recentReservations,
    notifications,
    upcomingDeliveries,
    upcomingShoots
  ] = await Promise.all([
    prisma.photographyPackage.count({ where: tenantFilter }),
    prisma.reservation.count({ where: { ...tenantFilter, status: { not: "DELETED" } } }),
    prisma.reservation.count({ where: { ...tenantFilter, status: "PENDING" } }),
    prisma.user.count({ where: tenantFilter }),
    prisma.reservation.findMany({
      where: { ...tenantFilter, status: { not: "DELETED" } },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { packages: true, payments: true }
    }),
    prisma.adminNotification.findMany({
      where: tenantFilter,
      orderBy: { createdAt: "desc" },
      take: 10
    }),
    prisma.reservation.findMany({
      where: { 
        ...tenantFilter,
        status: "CONFIRMED", 
        workflowStatus: { notIn: ["COMPLETED", "DELIVERED", "SELECTION_PENDING"] },
        deliveryDate: { not: null },
        OR: [
          { deliveryLink: null },
          { deliveryLink: "" },
          {
            AND: [
              { selectedPhotos: { not: null } },
              { selectedPhotos: { not: "" } }
            ]
          }
        ]
      },
      orderBy: { deliveryDate: "asc" },
      take: 5,
      include: { packages: true, payments: true }
    }),
    prisma.reservation.findMany({
      where: {
        ...tenantFilter,
        status: "CONFIRMED",
        eventDate: { gte: now, lte: thirtyDaysLater }
      },
      orderBy: { eventDate: "asc" },
      take: 5,
      include: { packages: true, payments: true }
    })
  ]);

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

      {/* Sub-Merchant Warning */}
      {tenant && tenant.subMerchantStatus === "NOT_STARTED" ? (
        <div style={{ padding: 16, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.3)", marginBottom: 24, display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 2 }}>ALT ÜYE İŞYERİ KAYDINIZI TAMAMLAYIN</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Online ödeme (kredi kartı) alabilmeniz için vergi levhanızı yükleyip başvurunuzu tamamlamanız gerekmektedir.</div>
            </div>
          </div>
          <Link href="/admin/settings?tab=sistem&subTab=odeme" style={{ padding: "8px 16px", background: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 800, textDecoration: "none", whiteSpace: "nowrap" }}>Başvuru Yap</Link>
        </div>
      ) : tenant?.subMerchantStatus === "REJECTED" ? (
        <div style={{ padding: 16, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.3)", marginBottom: 24, display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 2 }}>SANAL POS BAŞVURUNUZ REDDEDİLDİ</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Bilgilerinizi güncelleyerek tekrar başvuru yapabilirsiniz.</div>
            </div>
          </div>
          <Link href="/admin/settings?tab=sistem&subTab=odeme" style={{ padding: "8px 16px", background: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 800, textDecoration: "none", whiteSpace: "nowrap" }}>Tekrar Başvur</Link>
        </div>
      ) : tenant?.subMerchantStatus === "PENDING" ? (
        <div style={{ padding: 16, background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.3)", marginBottom: 24, display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
          <Clock size={20} color="#38bdf8" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 2 }}>SANAL POS BAŞVURUNUZ İNCELENİYOR</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Sanal POS (Alt Üye İşyeri) başvurunuz onaylandıktan sonra kredi kartı ile online ödeme almaya başlayabileceksiniz.</div>
          </div>
        </div>
      ) : null}

      {/* Domain Warning */}
      {!tenant?.customDomain && (
        <div style={{ padding: 16, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.3)", marginBottom: 24, display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <AlertCircle size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 2 }}>ALAN ADINIZI (DOMAIN) BAĞLAYIN</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Müşterilerinize daha profesyonel görünmek için kendi alan adınızı sisteme entegre edin.</div>
            </div>
          </div>
          <Link href="/admin/settings?tab=genel&subTab=domain" style={{ padding: "8px 16px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 11, fontWeight: 800, textDecoration: "none", whiteSpace: "nowrap" }}>Domain Bağla</Link>
        </div>
      )}

      {/* Missing WhatsApp Warning */}
      {!siteConfig?.whatsapp && (
        <div style={{ padding: 16, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.3)", marginBottom: 24, display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <AlertCircle size={20} color="#22c55e" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 2 }}>WHATSAPP NUMARANIZI EKLEYİN</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Sitenizdeki ziyaretçilerin size anında ulaşabilmesi için WhatsApp iletişim numaranızı eklemelisiniz.</div>
            </div>
          </div>
          <Link href="/admin/settings?tab=tasarim&subTab=iletisim" style={{ padding: "8px 16px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 11, fontWeight: 800, textDecoration: "none", whiteSpace: "nowrap" }}>Numara Ekle</Link>
        </div>
      )}

      {/* Missing Packages/Services Warning */}
      {totalPackages === 0 && (
        <div style={{ padding: 16, background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.3)", marginBottom: 24, display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Package size={20} color="#a855f7" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 2 }}>İLK İÇERİĞİNİZİ OLUŞTURUN</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Sitenizde henüz hiç {terms.service} bulunmuyor. Satışa başlamak için hemen ekleyin.</div>
            </div>
          </div>
          <Link href="/admin/packages" style={{ padding: "8px 16px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 11, fontWeight: 800, textDecoration: "none", whiteSpace: "nowrap" }}>{terms.service} Ekle</Link>
        </div>
      )}

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

      {/* Onboarding Checklist */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", padding: "20px", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "16px", display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={18} color="#f97316" /> Başlangıç Rehberi
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          <Link href="/admin/settings?tab=tasarim" style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: siteConfig?.logoUrl ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)", border: siteConfig?.logoUrl ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(255,255,255,0.08)", textDecoration: "none", color: "#fff" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: siteConfig?.logoUrl ? "#22c55e" : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {siteConfig?.logoUrl ? <CheckCircle2 size={14} color="#000" /> : <span style={{ fontSize: 12, fontWeight: 800 }}>1</span>}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Logonuzu Ekleyin</div>
          </Link>
          <Link href="/admin/packages" style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: totalPackages > 0 ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)", border: totalPackages > 0 ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(255,255,255,0.08)", textDecoration: "none", color: "#fff" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: totalPackages > 0 ? "#22c55e" : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {totalPackages > 0 ? <CheckCircle2 size={14} color="#000" /> : <span style={{ fontSize: 12, fontWeight: 800 }}>2</span>}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>İlk Paketinizi Oluşturun</div>
          </Link>
          <Link href="/admin/settings?tab=sistem&subTab=odeme" style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: tenant?.subMerchantStatus === "APPROVED" ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)", border: tenant?.subMerchantStatus === "APPROVED" ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(255,255,255,0.08)", textDecoration: "none", color: "#fff" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: tenant?.subMerchantStatus === "APPROVED" ? "#22c55e" : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {tenant?.subMerchantStatus === "APPROVED" ? <CheckCircle2 size={14} color="#000" /> : <span style={{ fontSize: 12, fontWeight: 800 }}>3</span>}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Online Ödeme Başvurusu</div>
          </Link>
          <Link href="/admin/settings?tab=genel&subTab=domain" style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: tenant?.customDomain ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)", border: tenant?.customDomain ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(255,255,255,0.08)", textDecoration: "none", color: "#fff" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: tenant?.customDomain ? "#22c55e" : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {tenant?.customDomain ? <CheckCircle2 size={14} color="#000" /> : <span style={{ fontSize: 12, fontWeight: 800 }}>4</span>}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Alan Adınızı Bağlayın</div>
          </Link>
        </div>
      </div>

      {/* Interactive Lists */}
      <DashboardInteractiveLists 
        upcomingDeliveries={JSON.parse(JSON.stringify(upcomingDeliveries))}
        upcomingShoots={JSON.parse(JSON.stringify(upcomingShoots))}
        recentReservations={JSON.parse(JSON.stringify(recentReservations))}
        terms={terms}
        isPhotographer={isPhotographer}
        paymentMode={bt?.paymentMode || "cash"}
      />
    </div>
  );
}
