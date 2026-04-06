import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNotificationSettings, sendEmailWithResend } from "@/app/actions/notify";

const ADMIN_EMAIL = "hello@pinowed.com";

/**
 * Cron endpoint — Vercel'de /api/cron/reminders -> her gün çalıştır
 * Kontrol eder:
 * 1. Teslim tarihine 2 gün kalan ama deliveryLink yüklenmemiş rezervasyonlar
 * 2. Etkinlik tarihine 3 gün kalan ama kapora ödenmemiş
 */
export async function GET(req) {
  // Vercel cron secret check
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await getNotificationSettings();
    const now = new Date();
    const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    const results = [];

    // 1. Teslim tarihi yaklaşan ama link yüklenmemiş
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
      
      await sendEmailWithResend(settings, ADMIN_EMAIL, `⏰ Teslim Hatırlatma: ${r.brideName} (${daysLeft} gün kaldı!)`, `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: #000; color: #fff; padding: 24px 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 18px; font-weight: 700;">PINOWED <span style="opacity:0.4;font-weight:400;">CRM</span></h1>
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
              <a href="https://www.pinowed.com/admin/reservations" style="background:#000;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;display:inline-block;font-size:13px;">Link Yükle</a>
            </div>
          </div>
        </div>
      `);
      results.push({ type: "delivery_reminder", brideName: r.brideName, daysLeft });
    }

    // 2. Etkinlik tarihine 3 gün kalan ama kalan ödeme var
    const upcomingEvents = await prisma.reservation.findMany({
      where: {
        eventDate: { lte: threeDaysLater, gte: now },
        status: { not: "DELETED" },
        paymentStatus: { in: ["UNPAID", "PARTIAL"] }
      },
      include: { payments: true }
    });

    for (const r of upcomingEvents) {
      const totalAmount = parseFloat(r.totalAmount?.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '') || '0');
      const totalPaid = r.payments.reduce((s, p) => s + p.amount, 0);
      const remaining = Math.max(0, totalAmount - totalPaid);
      const daysLeft = Math.ceil((new Date(r.eventDate) - now) / (1000*60*60*24));

      if (remaining > 0) {
        await sendEmailWithResend(settings, ADMIN_EMAIL, `💰 Ödeme Hatırlatma: ${r.brideName} (${remaining.toLocaleString('tr-TR')}₺ kalan)`, `
          <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: #000; color: #fff; padding: 24px 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 18px; font-weight: 700;">PINOWED <span style="opacity:0.4;font-weight:400;">CRM</span></h1>
            </div>
            <div style="padding: 28px 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 10px 10px;">
              <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 6px; margin-bottom: 20px;">
                <div style="font-size: 16px; font-weight: 700; color: #92400e;">💰 Kalan Ödeme Var!</div>
                <div style="font-size: 13px; color: #a16207; margin-top: 4px;">Etkinlik ${daysLeft} gün sonra ve henüz ${remaining.toLocaleString('tr-TR')}₺ kalan ödeme var.</div>
              </div>
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:6px 0;color:#999;font-size:13px;width:130px;">👤 Müşteri</td><td style="padding:6px 0;color:#333;font-size:13px;font-weight:600;">${r.brideName}</td></tr>
                <tr><td style="padding:6px 0;color:#999;font-size:13px;">📞 Telefon</td><td style="padding:6px 0;color:#333;font-size:13px;font-weight:600;">${r.bridePhone}</td></tr>
                <tr><td style="padding:6px 0;color:#999;font-size:13px;">📅 Etkinlik</td><td style="padding:6px 0;color:#333;font-size:13px;font-weight:600;">${new Date(r.eventDate).toLocaleDateString('tr-TR')}</td></tr>
                <tr><td style="padding:6px 0;color:#999;font-size:13px;">💰 Toplam</td><td style="padding:6px 0;color:#333;font-size:13px;font-weight:600;">${totalAmount.toLocaleString('tr-TR')}₺</td></tr>
                <tr><td style="padding:6px 0;color:#999;font-size:13px;">✅ Ödenen</td><td style="padding:6px 0;color:#166534;font-size:13px;font-weight:600;">${totalPaid.toLocaleString('tr-TR')}₺</td></tr>
                <tr><td style="padding:6px 0;color:#999;font-size:13px;">⏳ Kalan</td><td style="padding:6px 0;color:#ef4444;font-size:13px;font-weight:700;">${remaining.toLocaleString('tr-TR')}₺</td></tr>
              </table>
              <div style="margin-top:24px;text-align:center;">
                <a href="https://www.pinowed.com/admin/reservations" style="background:#000;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;display:inline-block;font-size:13px;">Admin Panele Git</a>
              </div>
            </div>
          </div>
        `);
        results.push({ type: "payment_reminder", brideName: r.brideName, remaining, daysLeft });
      }
    }

    return NextResponse.json({ success: true, reminders: results.length, details: results });
  } catch (error) {
    console.error("Cron Reminder Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
