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
    const tenantId = tenant?.id || null;
    const today = new Date().toISOString().split("T")[0];
    const cleanPath = path.split("?")[0].split("#")[0];

    // Nullable tenantId ile @@unique çalışmadığı için raw query kullan
    if (tenantId) {
      await prisma.$executeRaw`
        INSERT INTO "PageView" (id, path, date, "tenantId", count)
        VALUES (gen_random_uuid()::text, ${cleanPath}, ${today}, ${tenantId}, 1)
        ON CONFLICT (path, date, "tenantId") DO UPDATE SET count = "PageView".count + 1
      `;
    } else {
      // tenantId null ise ayrı query (NULL unique davranışı)
      const existing = await prisma.pageView.findFirst({
        where: { path: cleanPath, date: today, tenantId: null }
      });
      if (existing) {
        await prisma.pageView.update({
          where: { id: existing.id },
          data: { count: { increment: 1 } }
        });
      } else {
        await prisma.pageView.create({
          data: { path: cleanPath, date: today, tenantId: null, count: 1 }
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Sessizce başarısız ol — analytics asla siteyi bozmamalı
    return NextResponse.json({ ok: false });
  }
}
