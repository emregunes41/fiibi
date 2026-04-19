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
              color: "rgba(255,255,255,0.45)",
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
              color: "#fff",
            }}
          >
            {terms.appointment}nuzu Oluşturun
          </h1>
          <p
            style={{
              fontSize: "15px",
              color: "rgba(255,255,255,0.55)",
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
          <BookingFlow initialPackages={packages} blockedDays={blockedDays} paymentMode={siteConfig?.paymentMode || 'cash'} />
        ) : (
          <SimpleBookingFlow initialPackages={packages} blockedDays={blockedDays} paymentMode={siteConfig?.paymentMode || 'cash'} />
        )}
      </div>
    </main>
  );
}
