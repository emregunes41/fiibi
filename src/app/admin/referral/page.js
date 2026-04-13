import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import ReferralClient from "./ReferralClient";

async function getTenantId() {
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
  return null;
}

export default async function ReferralPage() {
  const tenantId = await getTenantId();
  if (!tenantId) return <p>Yetkisiz erişim</p>;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { referralCode: true, referralCount: true, slug: true },
  });

  // Bu tenant'ı referans koduyle kaydolan kişiler
  const referrals = await prisma.tenant.findMany({
    where: { referredBy: tenantId },
    select: { businessName: true, slug: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return <ReferralClient tenant={tenant} referrals={referrals} />;
}
