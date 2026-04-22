import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";

/**
 * PayTR Callback — Abonelik ödemesi sonucu
 * PayTR başarılı/başarısız ödeme sonrasında bu endpoint'e POST yapar
 */
export async function POST(request) {
  try {
    const body = await request.formData();
    const merchant_oid = body.get("merchant_oid");
    const status = body.get("status"); // "success" veya "failed"
    const total_amount = body.get("total_amount");
    const hash = body.get("hash");
    const utoken = body.get("utoken"); // Kart saklama - kullanıcı tokeni
    const ctoken = body.get("ctoken"); // Kart saklama - kart tokeni

    const merchant_key = process.env.PAYTR_MERCHANT_KEY;
    const merchant_salt = process.env.PAYTR_MERCHANT_SALT;

    // Hash doğrulama (isteğin PayTR'den geldiğinden emin ol)
    const hash_str = `${merchant_oid}${merchant_salt}${status}${total_amount}`;
    const expected_hash = crypto
      .createHmac("sha256", merchant_key)
      .update(hash_str)
      .digest("base64");

    if (hash !== expected_hash) {
      console.error("PayTR callback hash mismatch!");
      return new Response("HASH_MISMATCH", { status: 400 });
    }

    // merchant_oid'den tenant ID'yi çıkar: "SUB_cuid123_timestamp"
    const parts = merchant_oid.split("_");
    if (parts[0] !== "SUB" || parts.length < 3) {
      console.error("Invalid merchant_oid format:", merchant_oid);
      return new Response("OK"); // PayTR'ye OK dönmemiz lazım
    }
    const tenantId = parts[1];

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      console.error("Tenant not found for callback:", tenantId);
      return new Response("OK");
    }

    if (status === "success") {
      // Başarılı ödeme — Plan aktifleştir ve kart tokenlerini sakla
      const now = new Date();
      const planDuration = tenant.selectedPlan === "yearly"
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
        subscriptionStartedAt: tenant.subscriptionStartedAt || now,
        planExpiresAt: new Date(now.getTime() + planDuration),
        nextPaymentAt: new Date(now.getTime() + planDuration),
      };

      // Kart tokenlerini sakla (PayTR kart saklama özelliği aktifse)
      if (utoken) updateData.paytrUtoken = utoken;
      if (ctoken) updateData.paytrCtoken = ctoken;

      await prisma.tenant.update({
        where: { id: tenantId },
        data: updateData,
      });

      console.log(`✅ Subscription activated for ${tenant.slug} (${tenant.selectedPlan})`);
    } else {
      // Başarısız ödeme
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          failedPayments: { increment: 1 },
        },
      });

      console.log(`❌ Subscription payment failed for ${tenant.slug}`);
    }

    // PayTR'ye mutlaka "OK" dönmeliyiz
    return new Response("OK");
  } catch (error) {
    console.error("PayTR subscription callback error:", error);
    return new Response("OK"); // Hata olsa bile OK dön (PayTR tekrar denemez)
  }
}

// GET — Kullanıcı yönlendirmesi (başarılı/başarısız)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  // Kullanıcıyı admin paneline yönlendir
  return NextResponse.redirect(
    new URL(`/admin/subscription?payment=${status || "unknown"}`, request.url)
  );
}
