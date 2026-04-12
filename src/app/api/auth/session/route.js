import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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
      return NextResponse.json({ user: user || null });
    }

    // Admin auth — tenant bilgisi döndür
    const adminToken = cookieStore.get("admin_token")?.value;
    if (adminToken) {
      const payload = await verifyAuth(adminToken);
      let tenant = null;
      if (payload.tenantId) {
        tenant = await prisma.tenant.findUnique({
          where: { id: payload.tenantId },
          select: { id: true, slug: true, businessName: true, plan: true, planExpiresAt: true, isFrozen: true, createdAt: true }
        });
      }
      return NextResponse.json({ user: null, admin: { id: payload.adminId, username: payload.username }, tenant });
    }

    return NextResponse.json({ user: null });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}
