import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNotificationSettings, sendEmailWithResend } from "@/app/actions/notify";



/**
 * Cron endpoint — Vercel'de /api/cron/reminders -> her gün çalıştır
 * Kontrol eder:
 * 1. Teslim tarihine 2 gün kalan ama deliveryLink yüklenmemiş rezervasyonlar
 * 2. Teslim tarihi GEÇMİŞ ama hâlâ deliveryLink yüklenmemiş (her gün tekrar eder)
 */
export async function GET(req) {
  // Vercel cron secret check
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await getNotificationSettings();
    const adminEmail = settings.email || settings._tenant?.ownerEmail || "admin@studio.com";
    const businessName = settings.businessName || "Studio";
    const domain = process.env.PLATFORM_DOMAIN || "localhost:3000";
    const protocol = domain.includes("localhost") ? "http" : "https";
    const tenant = settings._tenant;
    const siteUrl = tenant?.customDomain ? `https://${tenant.customDomain}` : tenant?.slug ? `${protocol}://${tenant.slug}.${domain}` : `${protocol}://${domain}`;
    const now = new Date();
    const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    
    const results = [];

    // 1. Teslim tarihi yaklaşan ama link yüklenmemiş (2 gün kala)
    const upcomingDeliveries = await prisma.reservation.findMany({
      where: {
        deliveryDate: { lte: twoDaysLater, gte: now },
        deliveryLink: null,
        status: { not: "DELETED" },
        workflowStatus: { not: "COMPLETED" }
      },
      include: { packages: true }
    });

    for (const r of upcomingDeliveries) {
      const daysLeft = Math.ceil((new Date(r.deliveryDate) - now) / (1000*60*60*24));
      const packageNames = r.packages.map(p => p.name).join(", ") || "Çekim";
      
      await sendEmailWithResend(settings, adminEmail, `⏰ Teslim Hatırlatma: ${r.brideName} (${daysLeft} gün kaldı!)`, `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: #000; color: #fff; padding: 24px 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 18px; font-weight: 700;">${businessName.toUpperCase()} <span style="opacity:0.4;font-weight:400;">CRM</span></h1>
          </div>
          <div style="padding: 28px 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 10px 10px;">
            <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px 20px; border-radius: 6px; margin-bottom: 20px;">
              <div style="font-size: 16px; font-weight: 700; color: #991b1b;">⚠️ Teslim Tarihi Yaklaşıyor!</div>
              <div style="font-size: 13px; color: #b91c1c; margin-top: 4px;">Henüz fotoğraf/video linki yüklenmemiş.</div>
            </div>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:6px 0;color:#999;font-size:13px;width:130px;">👤 Müşteri</td><td style="padding:6px 0;color:#333;font-size:13px;font-weight:600;">${r.brideName}</td></tr>
              <tr><td style="padding:6px 0;color:#999;font-size:13px;">📦 Paket</td><td style="padding:6px 0;color:#333;font-size:13px;font-weight:600;">${packageNames}</td></tr>
              <tr><td style="padding:6px 0;color:#999;font-size:13px;">📅 Teslim</td><td style="padding:6px 0;color:#333;font-size:13px;font-weight:600;">${new Date(r.deliveryDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
              <tr><td style="padding:6px 0;color:#999;font-size:13px;">⏳ Kalan</td><td style="padding:6px 0;color:#ef4444;font-size:13px;font-weight:700;">${daysLeft} gün</td></tr>
            </table>
            <div style="margin-top:24px;text-align:center;">
              <a href="${siteUrl}/admin/reservations" style="background:#000;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;display:inline-block;font-size:13px;">Link Yükle</a>
            </div>
          </div>
        </div>
      `);
      results.push({ type: "delivery_reminder", brideName: r.brideName, daysLeft });
    }

    // 2. Teslim tarihi GEÇMİŞ ama hâlâ link yüklenmemiş — her gün mail atar
    const overdueDeliveries = await prisma.reservation.findMany({
      where: {
        deliveryDate: { lt: now },
        deliveryLink: null,
        status: { not: "DELETED" },
        workflowStatus: { not: "COMPLETED" }
      },
      include: { packages: true }
    });

    for (const r of overdueDeliveries) {
      const daysOverdue = Math.ceil((now - new Date(r.deliveryDate)) / (1000*60*60*24));
      const packageNames = r.packages.map(p => p.name).join(", ") || "Çekim";
      
      await sendEmailWithResend(settings, adminEmail, `🚨 Teslim Gecikti: ${r.brideName} (${daysOverdue} gün geçti!)`, `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: #7f1d1d; color: #fff; padding: 24px 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 18px; font-weight: 700;">${businessName.toUpperCase()} <span style="opacity:0.4;font-weight:400;">CRM</span></h1>
            <p style="margin: 6px 0 0; font-size: 12px; opacity: 0.7;">Gecikmiş Teslim Uyarısı</p>
          </div>
          <div style="padding: 28px 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 10px 10px;">
            <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px 20px; border-radius: 6px; margin-bottom: 20px;">
              <div style="font-size: 16px; font-weight: 700; color: #991b1b;">🚨 Teslim Tarihi Geçti!</div>
              <div style="font-size: 13px; color: #b91c1c; margin-top: 4px;">Teslim tarihinden <strong>${daysOverdue} gün</strong> geçti, henüz fotoğraf/video linki yüklenmemiş.</div>
            </div>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:6px 0;color:#999;font-size:13px;width:130px;">👤 Müşteri</td><td style="padding:6px 0;color:#333;font-size:13px;font-weight:600;">${r.brideName}</td></tr>
              <tr><td style="padding:6px 0;color:#999;font-size:13px;">📞 Telefon</td><td style="padding:6px 0;color:#333;font-size:13px;font-weight:600;">${r.bridePhone || '—'}</td></tr>
              <tr><td style="padding:6px 0;color:#999;font-size:13px;">📦 Paket</td><td style="padding:6px 0;color:#333;font-size:13px;font-weight:600;">${packageNames}</td></tr>
              <tr><td style="padding:6px 0;color:#999;font-size:13px;">📅 Teslim Tarihi</td><td style="padding:6px 0;color:#333;font-size:13px;font-weight:600;">${new Date(r.deliveryDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
              <tr><td style="padding:6px 0;color:#999;font-size:13px;">🔴 Gecikme</td><td style="padding:6px 0;color:#dc2626;font-size:14px;font-weight:800;">${daysOverdue} gün</td></tr>
            </table>
            <div style="margin-top:24px;text-align:center;">
              <a href="${siteUrl}/admin/reservations" style="background:#dc2626;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;display:inline-block;font-size:13px;">Hemen Link Yükle</a>
            </div>
            <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #eee; text-align: center;">
              <p style="color: #bbb; font-size: 11px; margin: 0;">Bu hatırlatma, teslim linki yüklenene kadar her gün gönderilir.</p>
            </div>
          </div>
        </div>
      `);
      results.push({ type: "overdue_delivery", brideName: r.brideName, daysOverdue });
    }

    return NextResponse.json({ success: true, reminders: results.length, details: results });
  } catch (error) {
    console.error("Cron Reminder Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
