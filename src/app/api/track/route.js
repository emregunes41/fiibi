import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";

export async function POST(req) {
  try {
    const { path } = await req.json();
    if (!path || typeof path !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const tenant = await getCurrentTenant();
    const today = new Date().toISOString().split("T")[0]; // "2026-04-13"
    const cleanPath = path.split("?")[0].split("#")[0]; // query/hash temizle

    await prisma.pageView.upsert({
      where: {
        path_date_tenantId: {
          path: cleanPath,
          date: today,
          tenantId: tenant?.id || "platform",
        },
      },
      update: {
        count: { increment: 1 },
      },
      create: {
        path: cleanPath,
        date: today,
        tenantId: tenant?.id || null,
        count: 1,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Sessizce başarısız ol — analytics asla siteyi bozmamalı
    return NextResponse.json({ ok: false });
  }
}
