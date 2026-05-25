import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Keşfet API — tüm aktif tenantlardan showInDiscovery paket ve etkinlikleri getir
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

    // Paketler
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

    // Etkinlikler (sadece gelecekteki aktif olanlar)
    const events = await prisma.event.findMany({
      where: {
        showInDiscovery: true,
        isActive: true,
        date: { gte: new Date() },
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
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: { date: "asc" },
    });

    // Tenant logoları için settings tablosundan logoUrl çek
    const allTenantIds = [
      ...new Set([
        ...packages.map(p => p.tenantId),
        ...events.map(e => e.tenantId),
      ].filter(Boolean)),
    ];
    const settings = await prisma.globalSettings.findMany({
      where: { tenantId: { in: allTenantIds } },
      select: { tenantId: true, logoUrl: true },
    });
    const logoMap = {};
    settings.forEach(s => { logoMap[s.tenantId] = s.logoUrl; });

    // Paketleri dönüştür
    const packageItems = packages.map(pkg => ({
      id: pkg.id,
      type: "package",
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

    // Etkinlikleri dönüştür
    const eventItems = events.map(ev => ({
      id: ev.id,
      type: "event",
      name: ev.title,
      description: ev.description,
      price: ev.price,
      date: ev.date,
      durationMinutes: ev.durationMinutes,
      maxParticipants: ev.maxParticipants,
      registrationCount: ev._count?.registrations || 0,
      location: ev.location,
      imageUrl: ev.imageUrl,
      isOnline: !!ev.meetingLink,
      tenant: {
        slug: ev.tenant?.slug,
        businessName: ev.tenant?.businessName,
        businessType: ev.tenant?.businessType,
        plan: ev.tenant?.plan,
        logoUrl: logoMap[ev.tenantId] || null,
      },
    }));

    // Hepsini birleştir
    const result = [...packageItems, ...eventItems];

    // Sıralama: Pro üstte
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
