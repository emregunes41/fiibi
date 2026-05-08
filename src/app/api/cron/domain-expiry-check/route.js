import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Vercel Cron Job: Domain süresi kontrolü
 * Her gün çalışarak:
 * 1. Süresi 30 gün içinde dolacak domainlere → Uyarı maili gönderir
 * 2. Süresi 7 gün içinde dolacak domainlere → Acil uyarı maili gönderir
 * 3. Süresi dolmuş domainleri → Deaktif eder
 */
export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results = { warned30: 0, warned7: 0, expired: 0, errors: [] };

  try {
    // ─── 1. 30 GÜN KALA UYARI ─────────────────────────────────
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const twentyNineDaysFromNow = new Date(now.getTime() + 29 * 24 * 60 * 60 * 1000);

    const soonExpiring30 = await prisma.tenant.findMany({
      where: {
        purchasedDomain: true,
        domainExpiresAt: {
          gt: twentyNineDaysFromNow,
          lte: thirtyDaysFromNow,
        },
      },
    });

    for (const tenant of soonExpiring30) {
      try {
        await sendDomainEmail(tenant.ownerEmail, tenant.businessName, tenant.customDomain, tenant.domainExpiresAt, "warning_30");
        results.warned30++;
      } catch (err) {
        results.errors.push(`30-day warning error for ${tenant.slug}: ${err.message}`);
      }
    }

    // ─── 2. 7 GÜN KALA ACİL UYARI ────────────────────────────
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const sixDaysFromNow = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);

    const soonExpiring7 = await prisma.tenant.findMany({
      where: {
        purchasedDomain: true,
        domainExpiresAt: {
          gt: sixDaysFromNow,
          lte: sevenDaysFromNow,
        },
      },
    });

    for (const tenant of soonExpiring7) {
      try {
        await sendDomainEmail(tenant.ownerEmail, tenant.businessName, tenant.customDomain, tenant.domainExpiresAt, "warning_7");
        results.warned7++;
      } catch (err) {
        results.errors.push(`7-day warning error for ${tenant.slug}: ${err.message}`);
      }
    }

    // ─── 3. SÜRESİ DOLMUŞ DOMAİNLER ──────────────────────────
    const expiredDomains = await prisma.tenant.findMany({
      where: {
        purchasedDomain: true,
        domainExpiresAt: { lte: now },
      },
    });

    for (const tenant of expiredDomains) {
      try {
        await sendDomainEmail(tenant.ownerEmail, tenant.businessName, tenant.customDomain, tenant.domainExpiresAt, "expired");
        results.expired++;
      } catch (err) {
        results.errors.push(`Expired domain error for ${tenant.slug}: ${err.message}`);
      }
    }

    return NextResponse.json({ success: true, timestamp: now.toISOString(), ...results });
  } catch (error) {
    console.error("Domain expiry check cron error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function sendDomainEmail(to, businessName, domain, expiresAt, type) {
  const expiryDate = new Date(expiresAt).toLocaleDateString("tr-TR");
  
  const templates = {
    warning_30: {
      subject: `⚠️ Domain süreniz dolmak üzere — ${domain}`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #0a0a0a; color: #fff; border-radius: 12px;">
          <h2 style="margin: 0 0 16px;">⚠️ Domain Süreniz Dolmak Üzere</h2>
          <p style="color: #a0a0a0; line-height: 1.7;">Merhaba <strong>${businessName}</strong>,</p>
          <p style="color: #a0a0a0; line-height: 1.7;"><strong>${domain}</strong> alan adınızın süresi <strong>${expiryDate}</strong> tarihinde dolacak.</p>
          <p style="color: #a0a0a0; line-height: 1.7;">Sitenizin kesintisiz çalışmaya devam etmesi için lütfen yönetim panelinizden domain sürenizi uzatın.</p>
          <a href="https://fiibi.co" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #fff; color: #000; text-decoration: none; font-weight: 700; border-radius: 8px;">Süreyi Uzat</a>
        </div>
      `,
    },
    warning_7: {
      subject: `🔴 Domain süreniz 7 gün içinde doluyor! — ${domain}`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #0a0a0a; color: #fff; border-radius: 12px;">
          <h2 style="margin: 0 0 16px;">🔴 ACİL: Domain Süreniz Doluyor!</h2>
          <p style="color: #a0a0a0; line-height: 1.7;">Merhaba <strong>${businessName}</strong>,</p>
          <p style="color: #a0a0a0; line-height: 1.7;"><strong>${domain}</strong> alan adınızın süresinin dolmasına <strong>7 gün</strong> kaldı (${expiryDate}).</p>
          <p style="color: #a0a0a0; line-height: 1.7;">Süreyi uzatmazsanız sitenize bu domain üzerinden <strong>erişilemeyecektir</strong>.</p>
          <a href="https://fiibi.co" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #ef4444; color: #fff; text-decoration: none; font-weight: 700; border-radius: 8px;">Hemen Uzat</a>
        </div>
      `,
    },
    expired: {
      subject: `❄️ Domain süreniz doldu — ${domain}`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #0a0a0a; color: #fff; border-radius: 12px;">
          <h2 style="margin: 0 0 16px;">❄️ Domain Süreniz Doldu</h2>
          <p style="color: #a0a0a0; line-height: 1.7;">Merhaba <strong>${businessName}</strong>,</p>
          <p style="color: #a0a0a0; line-height: 1.7;"><strong>${domain}</strong> alan adınızın süresi ${expiryDate} tarihinde dolmuştur.</p>
          <p style="color: #a0a0a0; line-height: 1.7;">Müşterileriniz artık bu domain üzerinden sitenize erişememektedir. Yenileme yaparak tekrar aktifleştirebilirsiniz.</p>
          <a href="https://fiibi.co" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #fff; color: #000; text-decoration: none; font-weight: 700; border-radius: 8px;">Domain Yenile</a>
        </div>
      `,
    },
  };

  const template = templates[type];
  if (!template || !to) return;

  try {
    await resend.emails.send({
      from: "Fiibi <noreply@fiibi.co>",
      to,
      subject: template.subject,
      html: template.html,
    });
  } catch (err) {
    console.error(`Domain email send error (${type}) to ${to}:`, err);
  }
}
