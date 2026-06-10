import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createPaytrToken, generateMerchantOid } from "@/lib/paytr";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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
    autoCharged: 0,
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

    // ─── 2. SÜRESİ DOLAN + TOLERANS YOK → KART VARSA ÇEK, YOKSA TOLERANS BAŞLAT ─
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
        // Kayıtlı kart var mı kontrol et
        if (tenant.paytrUtoken && tenant.paytrCtoken) {
          // Otomatik çekim dene (PayTR Direkt API Recurring Payment)
          const chargeResult = await attemptRecurringCharge(tenant);

          if (chargeResult.success) {
            // Başarılı — Callback'ten plan yenilenecek
            // (PayTR callback'e bildirim gönderecek, plan orada güncellenir)
            await sendEmail(tenant.ownerEmail, tenant.businessName, "payment_success");
            results.autoCharged++;
            continue; // Bu tenant'ı atla, tolerans başlatma
          }
        }

        // Kart yok veya çekim başarısız → 3 gün tolerans başlat
        const gracePeriodEndsAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

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
        results.errors.push(`Grace/charge error for ${tenant.slug}: ${err.message}`);
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
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

/**
 * PayTR Direkt API — Kayıtlı karttan tekrarlayan ödeme (Non3D + Recurring)
 * Kart saklama token'ları (utoken + ctoken) ile server-side ödeme çeker
 */
async function attemptRecurringCharge(tenant) {
  try {
    const merchant_id = process.env.PAYTR_MERCHANT_ID;
    const merchant_key = process.env.PAYTR_MERCHANT_KEY;
    const merchant_salt = process.env.PAYTR_MERCHANT_SALT;

    if (!merchant_id || !merchant_key || !merchant_salt) {
      return { success: false, error: "PayTR config missing" };
    }

    // Fiyatlandırma
    let config;
    try {
      config = await prisma.platformConfig.findUnique({ where: { id: "main" } });
    } catch { /* ignore */ }
    const pricing = config?.pricing || { monthly: 249900, yearly: 2499900 };
    const planPriceKurus = tenant.selectedPlan === "yearly" ? pricing.yearly : pricing.monthly;

    const merchant_oid = generateMerchantOid("REC", tenant.id);
    const email = tenant.ownerEmail;
    const payment_amount = planPriceKurus.toString();
    const user_ip = "1.1.1.1"; // Recurring için server IP
    const currency = "TL";
    const test_mode = process.env.NODE_ENV === "production" ? "0" : "1";
    const non_3d = "1"; // Non3D — 3D doğrulama yok (recurring)
    const payment_type = "card";
    const installment_count = "0";
    const recurring_payment = "1";
    const non3d_test_failed = "0";
    const card_type = "";
    const debug_on = "0";
    const client_lang = "tr";

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fiibi.co";
    const merchant_ok_url = `${baseUrl}/api/paytr/subscription-callback`;
    const merchant_fail_url = merchant_ok_url;

    const user_basket = Buffer.from(JSON.stringify([
      ["Fiibi Pro Abonelik Yenileme", (planPriceKurus / 100).toFixed(2), 1],
    ])).toString("base64");

    // Token oluştur (Direkt API formülü)
    const paytr_token = createPaytrToken({
      merchantId: merchant_id,
      userIp: user_ip,
      merchantOid: merchant_oid,
      email,
      paymentAmount: payment_amount,
      paymentType: payment_type,
      installmentCount: installment_count,
      currency,
      testMode: test_mode,
      non3d: non_3d,
    });

    // PayTR'ye recurring ödeme isteği (server-side POST)
    const params = new URLSearchParams({
      merchant_id,
      user_ip,
      merchant_oid,
      email,
      payment_type,
      payment_amount,
      installment_count,
      currency,
      test_mode,
      non_3d,
      merchant_ok_url,
      merchant_fail_url,
      user_name: tenant.ownerName,
      user_address: "Fiibi Platform",
      user_phone: tenant.ownerPhone || "05000000000",
      user_basket,
      debug_on,
      client_lang,
      paytr_token,
      non3d_test_failed,
      card_type,
      // Kart saklama token'ları
      utoken: tenant.paytrUtoken,
      ctoken: tenant.paytrCtoken,
      recurring_payment,
    });

    const response = await fetch("https://www.paytr.com/odeme", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const resultText = await response.text();

    // PayTR recurring yanıtı kontrol
    try {
      const result = JSON.parse(resultText);
      if (result.status === "success") {
        console.log(`✅ Recurring charge submitted for ${tenant.slug}: ${payment_amount} kuruş`);
        return { success: true };
      } else {
        console.log(`❌ Recurring charge failed for ${tenant.slug}: ${result.err_msg || "unknown"}`);
        return { success: false, error: result.err_msg };
      }
    } catch {
      console.log(`❌ Recurring charge response parse error for ${tenant.slug}: ${resultText.substring(0, 200)}`);
      return { success: false, error: "Response parse error" };
    }
  } catch (error) {
    console.error(`Recurring charge error for ${tenant.slug}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Abonelik e-posta gönderimi
 */
async function sendEmail(to, businessName, type) {
  const templates = {
    payment_success: {
      subject: "✅ Aboneliğiniz yenilendi — Fiibi",
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #0a0a0a; color: #fff; border-radius: 12px;">
          <h2 style="margin: 0 0 16px;">✅ Ödemeniz Alındı</h2>
          <p style="color: #a0a0a0; line-height: 1.7;">Merhaba <strong>${businessName}</strong>,</p>
          <p style="color: #a0a0a0; line-height: 1.7;">Abonelik ödemeniz başarıyla alınmıştır. Hesabınız kesintisiz devam etmektedir.</p>
          <p style="color: #a0a0a0; line-height: 1.7;">Fiibi'yi tercih ettiğiniz için teşekkür ederiz!</p>
        </div>
      `,
    },
    expiring_soon: {
      subject: "⚠️ Aboneliğiniz sona ermek üzere — Fiibi",
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #0a0a0a; color: #fff; border-radius: 12px;">
          <h2 style="margin: 0 0 16px;">⚠️ Aboneliğiniz Sona Ermek Üzere</h2>
          <p style="color: #a0a0a0; line-height: 1.7;">Merhaba <strong>${businessName}</strong>,</p>
          <p style="color: #a0a0a0; line-height: 1.7;">Abonelik sürenizin dolmasına <strong>2 gün</strong> kaldı. Kayıtlı kartınız varsa otomatik yenileme yapılacaktır.</p>
          <p style="color: #a0a0a0; line-height: 1.7;">Kartınız kayıtlı değilse, hizmet kesintisi yaşamamak için lütfen ödeme bilgilerinizi güncelleyin.</p>
          <a href="https://fiibi.co" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #fff; color: #000; text-decoration: none; font-weight: 700; border-radius: 8px;">Aboneliğimi Yönet</a>
        </div>
      `,
    },
    grace_started: {
      subject: "🔴 Ödeme alınamadı — 3 gün tolerans süresi başladı",
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #0a0a0a; color: #fff; border-radius: 12px;">
          <h2 style="margin: 0 0 16px;">🔴 Ödeme Alınamadı</h2>
          <p style="color: #a0a0a0; line-height: 1.7;">Merhaba <strong>${businessName}</strong>,</p>
          <p style="color: #a0a0a0; line-height: 1.7;">Abonelik ödemeniz alınamamıştır. <strong>3 günlük tolerans süresi</strong> başlamıştır.</p>
          <p style="color: #a0a0a0; line-height: 1.7;">Bu süre içinde ödeme yapılmazsa hesabınız <strong>askıya alınacak</strong> ve müşterileriniz sitenize erişemeyecektir.</p>
          <a href="https://fiibi.co" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #ef4444; color: #fff; text-decoration: none; font-weight: 700; border-radius: 8px;">Ödeme Bilgilerimi Güncelle</a>
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
  if (!template || !resend) return;

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
