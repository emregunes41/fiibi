import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Vercel Cron Job: Abonelik kontrolü
 * Her gün çalışarak:
 * 1. Süresi dolan trial hesapları → 3 gün tolerans başlatır
 * 2. Süresi dolan pro hesapları → 3 gün tolerans başlatır (kart yoksa veya ödeme çekilemiyorsa)
 * 3. Tolerans süresi dolan hesapları → Dondurur (isFrozen)
 * 4. Süresi dolmak üzere olan hesaplara → Uyarı maili gönderir
 */
export async function GET(request) {
  // Güvenlik: Vercel Cron secret kontrolü
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results = {
    graceStarted: 0,
    frozen: 0,
    warningsSent: 0,
    errors: [],
  };

  try {
    // ─── 1. TOLERANS SÜRESİ BİTEN → DONDUR ─────────────────────
    const expiredGrace = await prisma.tenant.findMany({
      where: {
        isFrozen: false,
        isActive: true,
        gracePeriodEndsAt: { lte: now },
      },
    });

    for (const tenant of expiredGrace) {
      try {
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            isFrozen: true,
            frozenAt: now,
            isActive: false,
          },
        });

        // Donduruldu maili
        await sendEmail(tenant.ownerEmail, tenant.businessName, "frozen");
        results.frozen++;
      } catch (err) {
        results.errors.push(`Freeze error for ${tenant.slug}: ${err.message}`);
      }
    }

    // ─── 2. SÜRESİ DOLAN + TOLERANS YOK → TOLERANS BAŞLAT ─────
    const expired = await prisma.tenant.findMany({
      where: {
        isFrozen: false,
        isActive: true,
        gracePeriodEndsAt: null,
        planExpiresAt: { lte: now },
      },
    });

    for (const tenant of expired) {
      try {
        const gracePeriodEndsAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 gün

        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            gracePeriodEndsAt,
            failedPayments: { increment: 1 },
          },
        });

        // Tolerans başladı maili
        await sendEmail(tenant.ownerEmail, tenant.businessName, "grace_started");
        results.graceStarted++;
      } catch (err) {
        results.errors.push(`Grace error for ${tenant.slug}: ${err.message}`);
      }
    }

    // ─── 3. 2 GÜN KALA UYARI MAİLİ ────────────────────────────
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const soonExpiring = await prisma.tenant.findMany({
      where: {
        isFrozen: false,
        isActive: true,
        gracePeriodEndsAt: null,
        planExpiresAt: {
          gt: now,
          lte: twoDaysFromNow,
        },
      },
    });

    for (const tenant of soonExpiring) {
      try {
        await sendEmail(tenant.ownerEmail, tenant.businessName, "expiring_soon");
        results.warningsSent++;
      } catch (err) {
        results.errors.push(`Warning email error for ${tenant.slug}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      ...results,
    });
  } catch (error) {
    console.error("Subscription check cron error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Abonelik e-posta gönderimi
 */
async function sendEmail(to, businessName, type) {
  const templates = {
    expiring_soon: {
      subject: "⚠️ Aboneliğiniz sona ermek üzere — Fiibi",
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #0a0a0a; color: #fff; border-radius: 12px;">
          <h2 style="margin: 0 0 16px;">⚠️ Aboneliğiniz Sona Ermek Üzere</h2>
          <p style="color: #a0a0a0; line-height: 1.7;">Merhaba <strong>${businessName}</strong>,</p>
          <p style="color: #a0a0a0; line-height: 1.7;">Abonelik sürenizin dolmasına <strong>2 gün</strong> kaldı. Hizmet kesintisi yaşamamak için lütfen aboneliğinizi yenileyin.</p>
          <p style="color: #a0a0a0; line-height: 1.7;">Süreniz dolduktan sonra <strong>3 günlük tolerans süresi</strong> tanınacaktır. Bu süre içinde ödeme yapılmazsa hesabınız geçici olarak askıya alınacaktır.</p>
          <a href="https://fiibi.co" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #fff; color: #000; text-decoration: none; font-weight: 700; border-radius: 8px;">Aboneliğimi Yenile</a>
        </div>
      `,
    },
    grace_started: {
      subject: "🔴 Aboneliğiniz sona erdi — 3 gün tolerans süresi başladı",
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #0a0a0a; color: #fff; border-radius: 12px;">
          <h2 style="margin: 0 0 16px;">🔴 Abonelik Süreniz Doldu</h2>
          <p style="color: #a0a0a0; line-height: 1.7;">Merhaba <strong>${businessName}</strong>,</p>
          <p style="color: #a0a0a0; line-height: 1.7;">Abonelik süreniz sona ermiştir. <strong>3 günlük tolerans süresi</strong> başlamıştır.</p>
          <p style="color: #a0a0a0; line-height: 1.7;">Bu süre içinde ödeme yapılmazsa hesabınız <strong>askıya alınacak</strong> ve müşterileriniz sitenize erişemeyecektir.</p>
          <a href="https://fiibi.co" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #ef4444; color: #fff; text-decoration: none; font-weight: 700; border-radius: 8px;">Hemen Ödeme Yap</a>
        </div>
      `,
    },
    frozen: {
      subject: "❄️ Hesabınız askıya alındı — Fiibi",
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #0a0a0a; color: #fff; border-radius: 12px;">
          <h2 style="margin: 0 0 16px;">❄️ Hesabınız Askıya Alındı</h2>
          <p style="color: #a0a0a0; line-height: 1.7;">Merhaba <strong>${businessName}</strong>,</p>
          <p style="color: #a0a0a0; line-height: 1.7;">Tolerans süresi içinde ödeme yapılmadığı için hesabınız askıya alınmıştır.</p>
          <p style="color: #a0a0a0; line-height: 1.7;">Müşterileriniz sitenize erişememektedir. Hesabınızı tekrar aktifleştirmek için lütfen ödemenizi gerçekleştirin.</p>
          <p style="color: #a0a0a0; line-height: 1.7;">Verileriniz güvendedir ve ödeme yapıldığında hesabınız tekrar aktif olacaktır.</p>
          <a href="https://fiibi.co" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #fff; color: #000; text-decoration: none; font-weight: 700; border-radius: 8px;">Hesabımı Aktifleştir</a>
        </div>
      `,
    },
  };

  const template = templates[type];
  if (!template) return;

  try {
    await resend.emails.send({
      from: "Fiibi <noreply@fiibi.co>",
      to,
      subject: template.subject,
      html: template.html,
    });
  } catch (err) {
    console.error(`Email send error (${type}) to ${to}:`, err);
  }
}
