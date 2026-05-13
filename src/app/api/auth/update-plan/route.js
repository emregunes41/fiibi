import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * Update tenant's selected plan (monthly/yearly) before payment
 */
export async function POST(request) {
  try {
    const { tenantId, selectedPlan } = await request.json();

    if (!tenantId || !selectedPlan) {
      return NextResponse.json({ error: "tenantId ve selectedPlan gerekli" }, { status: 400 });
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
