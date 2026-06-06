import { getPackages, getSiteConfig } from "../admin/core-actions";
import { getCurrentTenant } from "@/lib/tenant";
import { getBusinessType } from "@/lib/business-types";
import BookingFlow from "@/components/BookingFlow";
import SimpleBookingFlow from "@/components/SimpleBookingFlow";
import Link from "next/link";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function BookingPage() {
  const tenant = await getCurrentTenant();
  const activeTenantId = tenant?.id || "NONE";
  
  const packages = await prisma.photographyPackage.findMany({
    where: { tenantId: activeTenantId },
    orderBy: { createdAt: 'desc' }
  });
  
  const siteConfig = await prisma.globalSettings.findFirst({
    where: { tenantId: activeTenantId }
  });
  
  const blockedDays = siteConfig?.blockedDays || [];
  const bt = getBusinessType(tenant?.businessType || "photographer");
  const { terms, features } = bt;
  const isPhotographer = (tenant?.businessType || "photographer") === "photographer";




  // Booking paused kontrolü
  if (siteConfig?.bookingPaused) {
    const pauseMessage = siteConfig.bookingPausedMessage || "Şu anda rezervasyon/sipariş kabul etmiyoruz. Lütfen daha sonra tekrar deneyiniz.";
    return (
      <main style={{ minHeight: "100vh", background: "transparent", paddingTop: "160px", paddingBottom: "100px", paddingLeft: "24px", paddingRight: "24px" }}>
        <div style={{ maxWidth: "520px", margin: "0 auto", textAlign: "center" }}>
          <Link href="/" style={{ display: "inline-block", fontSize: "13px", color: "rgba(0,0,0,0.55)", textDecoration: "none", marginBottom: "40px", transition: "color 0.2s" }}>
            ← Ana Sayfa
          </Link>
          <div style={{ padding: "48px 32px", background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28 }}>
              ⏸️
            </div>
            <h1 style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.3, marginBottom: "16px", color: "#1a1a1a" }}>
              {terms.appointment} Şu An Kapalı
            </h1>
            <p style={{ fontSize: 14, color: "rgba(0,0,0,0.6)", lineHeight: 1.7, marginBottom: "32px" }}>
              {pauseMessage}
            </p>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", background: "#1a1a1a", color: "#ffffff", textDecoration: "none", fontWeight: 700, fontSize: 13, transition: "opacity 0.2s" }}>
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "transparent",
        paddingTop: "160px",
        paddingBottom: "100px",
        paddingLeft: "24px",
        paddingRight: "24px",
      }}
    >
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        {/* Page header */}
        <div style={{ marginBottom: "56px" }}>
          <Link
            href="/"
            style={{
              display: "inline-block",
              fontSize: "13px",
              color: "rgba(0,0,0,0.55)",
              textDecoration: "none",
              marginBottom: "40px",
              transition: "color 0.2s",
            }}
          >
            ← Ana Sayfa
          </Link>
          <h1
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              marginBottom: "12px",
              color: "var(--text, #1a1a1a)",
            }}
          >
            {terms.appointment}nuzu Oluşturun
          </h1>
          <p
            style={{
              fontSize: "15px",
              color: "rgba(0,0,0,0.6)",
              lineHeight: 1.7,
              maxWidth: "480px",
            }}
          >
            {isPhotographer
              ? `${terms.service} türünüzü, döneminizi ve tercihlerinizi seçerek birkaç dakikada ${terms.appointment.toLowerCase()}nuzu tamamlayabilirsiniz.`
              : `Uygun ${terms.service.toLowerCase()}nizi seçerek birkaç dakikada ${terms.appointment.toLowerCase()}nuzu oluşturabilirsiniz.`
            }
          </p>
        </div>

        {isPhotographer ? (
          <BookingFlow initialPackages={packages} blockedDays={blockedDays} />
        ) : (
          <SimpleBookingFlow initialPackages={packages} blockedDays={blockedDays} />
        )}
      </div>
    </main>
  );
}
