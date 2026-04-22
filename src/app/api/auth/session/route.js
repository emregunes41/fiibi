import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";

export async function GET() {
  try {
    const cookieStore = await cookies();
    
    // User auth
    const token = cookieStore.get("auth_token")?.value;
    if (token) {
      const payload = await verifyAuth(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, name: true, email: true, role: true }
      });
      // Also include tenant info for navbar
      const tenant = await getCurrentTenant();
      return NextResponse.json({ user: user || null, tenant: tenant ? { businessType: tenant.businessType } : null });
    }

    // Admin auth — tenant bilgisi döndür
    const adminToken = cookieStore.get("admin_token")?.value;
    if (adminToken) {
      const payload = await verifyAuth(adminToken);
      let tenant = null;
      if (payload.tenantId) {
        tenant = await prisma.tenant.findUnique({
          where: { id: payload.tenantId },
          select: { 
            id: true, slug: true, businessName: true, businessType: true, 
            plan: true, planExpiresAt: true, isFrozen: true, createdAt: true, 
            referralCode: true, referralCount: true,
            settings: {
              select: { moduleReservations: true, moduleStore: true, moduleEvents: true }
            }
          }
        });
      }
      return NextResponse.json({ user: null, admin: { id: payload.adminId, username: payload.username }, tenant });
    }

    // No auth — still return tenant businessType for navbar
    const tenant = await getCurrentTenant();
    return NextResponse.json({ user: null, tenant: tenant ? { businessType: tenant.businessType } : null });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}
