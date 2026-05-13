import { prisma } from "@/lib/prisma";
import { verifyCallbackHash, parseMerchantOid } from "@/lib/paytr";

/**
 * PayTR Direkt API — 2. Adım (Bildirim URL / Callback)
 * 
 * ÖNEMLİ KURALLAR:
 * 1) Erişim kısıtlaması OLMAMALI
 * 2) Sadece "OK" döndürülmeli (HTML veya başka içerik OLMAMALI)
 * 3) SESSION kullanılamaz — merchant_oid ile sipariş bulunmalı
 * 4) Aynı sipariş için birden fazla bildirim gelebilir (idempotent olmalı)
 */
export async function POST(request) {
  try {
    const formData = await request.formData();

    const merchant_oid = formData.get("merchant_oid");
    const status = formData.get("status"); // "success" veya "failed"
    const total_amount = formData.get("total_amount");
    const hash = formData.get("hash");
    const failed_reason_code = formData.get("failed_reason_code");
    const failed_reason_msg = formData.get("failed_reason_msg");

    // PayTR kart saklama token'ları (store_card aktifse döner)
    const utoken = formData.get("utoken");
    const ctoken = formData.get("ctoken");

    // Hash doğrulama — İSTEĞİN PAYTR'DEN GELDİĞİNDEN EMİN OL
    const isValid = verifyCallbackHash({
      merchantOid: merchant_oid,
      status,
      totalAmount: total_amount,
      hash,
    });

    if (!isValid) {
      console.error("❌ PayTR callback HASH MISMATCH!", { merchant_oid, status });
      // Hash geçersiz ama yine de "OK" dönmüyoruz — güvenlik riski
      return new Response("PAYTR notification failed: bad hash", { status: 400 });
    }

    // merchant_oid'den bilgileri çıkar
    const parsed = parseMerchantOid(merchant_oid);
    if (!parsed) {
      console.error("❌ Invalid merchant_oid:", merchant_oid);
      return new Response("OK");
    }

    const { type, tenantId } = parsed;

    // Tenant bul
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      console.error("❌ Tenant not found:", tenantId);
      return new Response("OK");
    }

    // Mükerrer bildirim kontrolü (idempotent)
    // lastPaymentOid ile kontrol et
    if (tenant.lastPaymentOid === merchant_oid) {
      console.log(`⚠️ Duplicate callback for ${merchant_oid}, returning OK`);
      return new Response("OK");
    }

    if (status === "success") {
      // ✅ ÖDEME BAŞARILI
      const now = new Date();
      const planDuration =
        tenant.selectedPlan === "yearly"
          ? 365 * 24 * 60 * 60 * 1000
          : 30 * 24 * 60 * 60 * 1000;

      const updateData = {
        plan: "pro",
        isActive: true,
        isFrozen: false,
        frozenAt: null,
        failedPayments: 0,
        gracePeriodEndsAt: null,
        lastPaymentAt: now,
        lastPaymentOid: merchant_oid,
        subscriptionStartedAt: tenant.subscriptionStartedAt || now,
        planExpiresAt: new Date(now.getTime() + planDuration),
        nextPaymentAt: new Date(now.getTime() + planDuration),
      };

      // Kart tokenlerini sakla (gelecekteki recurring ödemeler için)
      if (utoken) updateData.paytrUtoken = utoken;
      if (ctoken) updateData.paytrCtoken = ctoken;

      await prisma.tenant.update({
        where: { id: tenantId },
        data: updateData,
      });

      console.log(
        `✅ ${type === "REC" ? "Recurring" : "Subscription"} payment SUCCESS for ${tenant.slug} — ${total_amount} kuruş`
      );
    } else {
      // ❌ ÖDEME BAŞARISIZ
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          failedPayments: { increment: 1 },
          lastPaymentOid: merchant_oid,
        },
      });

      console.log(
        `❌ Payment FAILED for ${tenant.slug} — Code: ${failed_reason_code}, Msg: ${failed_reason_msg}`
      );
    }

    // PayTR'ye MUTLAKA "OK" dönmemiz gerekiyor
    return new Response("OK");
  } catch (error) {
    console.error("❌ PayTR callback critical error:", error);
    // Hata olsa bile "OK" dön — aksi halde PayTR tekrar dener
    return new Response("OK");
  }
}
