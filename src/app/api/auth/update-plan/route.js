import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { cookies } from "next/headers";

/**
 * Update tenant's selected plan (monthly/yearly) before payment
 */
export async function POST(request) {
  try {
    // Authentication: require admin JWT token
    const cookieStore = await cookies();
    const adminToken = cookieStore.get("admin_token")?.value;
    if (!adminToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let payload;
    try {
      payload = await verifyAuth(adminToken);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tenantId, selectedPlan } = await request.json();

    if (!tenantId || !selectedPlan) {
      return NextResponse.json({ error: "tenantId ve selectedPlan gerekli" }, { status: 400 });
    }

    // Verify the admin belongs to the requested tenant
    if (payload.tenantId !== tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!["monthly", "yearly"].includes(selectedPlan)) {
      return NextResponse.json({ error: "Geçersiz plan" }, { status: 400 });
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { selectedPlan },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update plan error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
