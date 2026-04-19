import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM || "Fiibi <noreply@fiibi.co>";

export async function GET(req) {
  // Basit güvenlik (Vercel Cron veya manuel tetikleme)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const trials = await prisma.tenant.findMany({
      where: { plan: "trial", isFrozen: false },
      select: { id: true, businessName: true, ownerEmail: true, ownerName: true, planExpiresAt: true, slug: true },
    });

    let reminded = 0, warned = 0, frozen = 0;

    for (const t of trials) {
      if (!t.planExpiresAt) continue;
      const daysLeft = Math.ceil((t.planExpiresAt - now) / (1000 * 60 * 60 * 24));

      // 4 gün kaldı → hatırlatma
      if (daysLeft === 4) {
        await sendEmail(t, "reminder", daysLeft);
        reminded++;
      }

      // 1 gün kaldı → acil uyarı
      if (daysLeft === 1) {
        await sendEmail(t, "urgent", daysLeft);
        warned++;
      }

      // Süre doldu → dondur
      if (daysLeft <= 0) {
        await prisma.tenant.update({
          where: { id: t.id },
          data: { isFrozen: true, frozenAt: now },
        });
        await sendEmail(t, "expired", 0);
        frozen++;
      }
    }

    return NextResponse.json({
      ok: true,
      checked: trials.length,
      reminded,
      warned,
      frozen,
      timestamp: now.toISOString(),
    });
  } catch (err) {
    console.error("Trial check error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

async function sendEmail(tenant, type, daysLeft) {
  if (!resend) { console.log(`[trial-check] ${type} → ${tenant.ownerEmail} (Resend yok)`); return; }

  const subjects = {
    reminder: `${tenant.businessName} — Deneme süreniz bitiyor (${daysLeft} gün kaldı)`,
    urgent: `${tenant.businessName} — Son 1 gün! Denemeniz yarın bitiyor`,
    expired: `${tenant.businessName} — Deneme süreniz doldu`,
  };

  const bodies = {
    reminder: `
      <div style="font-family:system-ui;max-width:480px;margin:0 auto;padding:32px 0;">
        <h2 style="font-size:20px;font-weight:700;margin-bottom:8px;">Deneme süreniz bitiyor</h2>
        <p style="color:#666;font-size:14px;line-height:1.6;">
          Merhaba ${tenant.ownerName || ""},<br><br>
          <strong>${tenant.businessName}</strong> stüdyonuzun deneme süresi ${daysLeft} gün içinde sona erecek.
          Kesintisiz kullanmaya devam etmek için bir plan seçin.
        </p>
        <a href="http://${tenant.slug}.${process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "fiibi.co"}/admin/subscription"
           style="display:inline-block;background:#000;color:#fff;padding:12px 24px;text-decoration:none;font-weight:700;font-size:14px;margin-top:16px;">
          Plan Seç →
        </a>
        <p style="color:#999;font-size:12px;margin-top:24px;">Herhangi bir sorunuz varsa bize ulaşabilirsiniz.</p>
      </div>
    `,
    urgent: `
      <div style="font-family:system-ui;max-width:480px;margin:0 auto;padding:32px 0;">
        <h2 style="font-size:20px;font-weight:700;margin-bottom:8px;color:#dc2626;">Son gün!</h2>
        <p style="color:#666;font-size:14px;line-height:1.6;">
          Merhaba ${tenant.ownerName || ""},<br><br>
          <strong>${tenant.businessName}</strong> stüdyonuzun deneme süresi <strong>yarın</strong> sona erecek.
          Hesabınız dondurulmadan önce bir plan seçin — verileriniz kaybolmaz.
        </p>
        <a href="http://${tenant.slug}.${process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "fiibi.co"}/admin/subscription"
           style="display:inline-block;background:#dc2626;color:#fff;padding:12px 24px;text-decoration:none;font-weight:700;font-size:14px;margin-top:16px;">
          Hemen Plan Seç →
        </a>
      </div>
    `,
    expired: `
      <div style="font-family:system-ui;max-width:480px;margin:0 auto;padding:32px 0;">
        <h2 style="font-size:20px;font-weight:700;margin-bottom:8px;">Deneme süreniz doldu</h2>
        <p style="color:#666;font-size:14px;line-height:1.6;">
          Merhaba ${tenant.ownerName || ""},<br><br>
          <strong>${tenant.businessName}</strong> stüdyonuzun deneme süresi doldu ve hesabınız donduruldu.
          Verileriniz güvende — bir plan seçerek hemen aktifleştirebilirsiniz.
        </p>
        <a href="http://${tenant.slug}.${process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "fiibi.co"}/admin/subscription"
           style="display:inline-block;background:#000;color:#fff;padding:12px 24px;text-decoration:none;font-weight:700;font-size:14px;margin-top:16px;">
          Hesabımı Aktifleştir →
        </a>
      </div>
    `,
  };

  try {
    await resend.emails.send({
      from: FROM,
      to: tenant.ownerEmail,
      subject: subjects[type],
      html: bodies[type],
    });
  } catch (err) {
    console.error(`[trial-check] Email send error (${type}):`, err.message);
  }
}
