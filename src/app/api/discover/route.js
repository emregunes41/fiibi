import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Keşfet API — tüm aktif tenantlardan showInDiscovery paketlerini getir
// Pro tenantlar üstte, sonra yeniden eskiye sıralama
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category"); // businessType filtresi

    // Aktif ve donmamış tenantları al
    const tenantWhere = {
      isActive: true,
      isFrozen: false,
    };
    if (category && category !== "all") {
      tenantWhere.businessType = category;
    }

    const packages = await prisma.photographyPackage.findMany({
      where: {
        showInDiscovery: true,
        isActive: true,
        tenant: tenantWhere,
      },
      include: {
        tenant: {
          select: {
            id: true,
            slug: true,
            businessName: true,
            businessType: true,
            plan: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Tenant logoları için settings tablosundan logoUrl çek
    const tenantIds = [...new Set(packages.map(p => p.tenantId).filter(Boolean))];
    const settings = await prisma.globalSettings.findMany({
      where: { tenantId: { in: tenantIds } },
      select: { tenantId: true, logoUrl: true },
    });
    const logoMap = {};
    settings.forEach(s => { logoMap[s.tenantId] = s.logoUrl; });

    // Pro tenantları üste al
    const result = packages.map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      price: pkg.price,
      category: pkg.category,
      features: pkg.features || [],
      tenant: {
        slug: pkg.tenant?.slug,
        businessName: pkg.tenant?.businessName,
        businessType: pkg.tenant?.businessType,
        plan: pkg.tenant?.plan,
        logoUrl: logoMap[pkg.tenantId] || null,
      },
    }));

    // Sıralama: Pro üstte, sonra yeniye göre (zaten createdAt desc)
    result.sort((a, b) => {
      const aPro = a.tenant.plan === "pro" ? 0 : 1;
      const bPro = b.tenant.plan === "pro" ? 0 : 1;
      return aPro - bPro;
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    console.error("Discover API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
