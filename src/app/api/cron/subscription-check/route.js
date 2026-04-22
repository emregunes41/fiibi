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
          // Otomatik çekim dene (PayTR Recurring Payment)
          const chargeResult = await attemptRecurringCharge(tenant);

          if (chargeResult.success) {
            // Başarılı — plan yenile
            const planDuration = tenant.selectedPlan === "yearly"
              ? 365 * 24 * 60 * 60 * 1000
              : 30 * 24 * 60 * 60 * 1000;

            await prisma.tenant.update({
              where: { id: tenant.id },
              data: {
                plan: "pro",
                lastPaymentAt: now,
                planExpiresAt: new Date(now.getTime() + planDuration),
                nextPaymentAt: new Date(now.getTime() + planDuration),
                failedPayments: 0,
              },
            });

            await sendEmail(tenant.ownerEmail, tenant.businessName, "payment_success");
            results.autoCharged = (results.autoCharged || 0) + 1;
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Kayıtlı karttan otomatik çekim (PayTR Recurring Payment)
 * PayTR Direkt API + Non3D + Kart Saklama yetkisi gerektirir
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
    const config = await prisma.platformConfig.findUnique({ where: { id: "main" } });
    const pricing = config?.pricing || { monthly: 2499, yearly: 24999 };
    const planPrice = tenant.selectedPlan === "yearly" ? pricing.yearly : pricing.monthly;

    const merchant_oid = `REC_${tenant.id}_${Date.now()}`;
    const email = tenant.ownerEmail;
    const payment_amount = planPrice.toString(); // Kuruş cinsinden
    const user_ip = "1.1.1.1"; // Recurring için sabit IP kullanılabilir
    const currency = "TL";
    const test_mode = process.env.NODE_ENV === "production" ? "0" : "1";
    const non_3d = "1"; // Non3D — 3D onay yok
    const payment_type = "card";
    const installment_count = "0";
    const recurring_payment = "1";
    const user_basket = JSON.stringify([["Fiibi Pro Abonelik Yenileme", (planPrice / 100).toFixed(2), 1]]);

    const merchant_ok_url = `${process.env.NEXT_PUBLIC_APP_URL || "https://fiibi.co"}/api/paytr/subscription-callback`;
    const merchant_fail_url = merchant_ok_url;

    // Hash
    const crypto = await import("crypto");
    const hash_str = `${merchant_id}${user_ip}${merchant_oid}${email}${payment_amount}${payment_type}${installment_count}${currency}${test_mode}${non_3d}`;
    const token = crypto.default
      .createHmac("sha256", merchant_key)
      .update(hash_str + merchant_salt)
      .digest("base64");

    // PayTR'ye recurring ödeme isteği
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
      debug_on: "0",
      paytr_token: token,
      non3d_test_failed: "0",
      card_type: "",
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
        console.log(`✅ Recurring charge success for ${tenant.slug}: ${payment_amount} kuruş`);
        return { success: true };
      } else {
        console.log(`❌ Recurring charge failed for ${tenant.slug}: ${result.err_msg || "unknown"}`);
        return { success: false, error: result.err_msg };
      }
    } catch {
      console.log(`❌ Recurring charge response parse error for ${tenant.slug}`);
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

