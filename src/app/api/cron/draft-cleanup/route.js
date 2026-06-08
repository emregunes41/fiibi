import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic"; // Vercel cron için gerekli

export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization");
    // Vercel Cron yetkilendirmesi — deny if CRON_SECRET is not set or doesn't match
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error("Unauthorized cron request");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 30 dakikadan daha eski olan süreyi hesapla
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);

    // Draft statüsündeki ve 30 dakikadan eski rezervasyonları/siparişleri bul
    const draftsToDelete = await prisma.reservation.findMany({
      where: {
        status: "DRAFT",
        createdAt: {
          lt: thirtyMinsAgo
        }
      },
      select: { id: true }
    });

    if (draftsToDelete.length === 0) {
      return NextResponse.json({ success: true, message: "Temizlenecek DRAFT kaydı bulunamadı.", deletedCount: 0 });
    }

    const draftIds = draftsToDelete.map(d => d.id);

    // Kayıtları tamamen sil
    const deleteResult = await prisma.reservation.deleteMany({
      where: {
        id: { in: draftIds }
      }
    });

    console.log(`🧹 DRAFT Cleanup: ${deleteResult.count} adet ödenmemiş rezervasyon/sipariş silindi.`);

    return NextResponse.json({
      success: true,
      message: `${deleteResult.count} adet taslak başarıyla silindi.`,
      deletedCount: deleteResult.count
    });

  } catch (error) {
    console.error("Cron Draft Cleanup Hatası:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
