import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmailWithResend } from "@/app/actions/notify";

function emailHeader(businessName) {
  return `
    <div style="background: #000; color: #fff; padding: 32px 30px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="margin: 0; font-size: 22px; font-weight: 700;">${businessName.toUpperCase()}</h1>
    </div>
  `;
}

function emailFooter(businessName) {
  return `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
      <p style="color: #999; font-size: 12px; margin: 0;">${businessName}</p>
    </div>
  `;
}

export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    // Dün gerçekleşen etkinlikleri bul (son 24-48 saat arası)
    const yesterdayStart = new Date(now);
    yesterdayStart.setDate(yesterdayStart.getDate() - 2);
    
    const yesterdayEnd = new Date(now);
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);

    const reservations = await prisma.reservation.findMany({
      where: {
        eventDate: {
          gte: yesterdayStart,
          lte: yesterdayEnd,
        },
        status: { in: ["CONFIRMED", "COMPLETED"] },
      },
      include: {
        tenant: {
          include: { settings: true }
        }
      }
    });

    let sentCount = 0;

    for (const r of reservations) {
      if (!r.brideEmail || !r.tenant) continue;
      
      const settings = r.tenant.settings || {};
      const businessName = settings.businessName || r.tenant.businessName || "Studio";
      
      // Eğer işletmenin Google Maps linki varsa ona yönlendir, yoksa genel mesaja yönlendir
      const googleMapsUrl = settings.googleMapsUrl || "";
      const reviewLink = googleMapsUrl || `mailto:${settings.email || r.tenant.ownerEmail}`;
      const reviewButtonText = googleMapsUrl ? "Bizi Google'da Değerlendirin" : "Bize Puan Verin / Görüşlerinizi Yazın";

      const html = `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          ${emailHeader(businessName)}
          <div style="padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 10px 10px; text-align: center;">
            <div style="font-size: 40px; margin-bottom: 10px;">⭐</div>
            <h2 style="color: #333; margin-top: 0;">Nasıldık?</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              Merhaba ${r.brideName},<br>
              Dünkü etkinliğinizde sizinle olmak bizim için büyük bir zevkti!<br>
              Hizmetimizden memnun kaldıysanız bize bir değerlendirme bırakarak destek olabilirsiniz.
            </p>
            <div style="text-align: center; margin-top: 24px;">
              <a href="${reviewLink}" target="_blank" style="background: #fbbf24; color: #000; text-decoration: none; padding: 14px 28px; border-radius: 6px; display: inline-block; font-weight: bold;">${reviewButtonText}</a>
            </div>
            ${emailFooter(businessName)}
          </div>
        </div>
      `;

      // Settings object'ini sendEmailWithResend beklentilerine uydur
      const mockSettings = { ...settings, _tenant: r.tenant };
      
      await sendEmailWithResend(mockSettings, r.brideEmail, `Nasıl geçtik? ⭐ Bize puan verin! - ${businessName}`, html);
      sentCount++;
    }

    return NextResponse.json({ success: true, sent: sentCount });
  } catch (error) {
    console.error("Review Cron Error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
