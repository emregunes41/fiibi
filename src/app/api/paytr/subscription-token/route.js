import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";

/**
 * PayTR iFrame token oluşturma — Kart saklama ile birlikte
 * Tenant ilk kez kart kaydettiğinde veya abonelik yenilerken kullanılır
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId gerekli" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return NextResponse.json({ error: "Tenant bulunamadı" }, { status: 404 });
    }

    // PayTR API bilgileri (Fiibi'nin kendi hesabı — abonelik tahsilatı için)
    const merchant_id = process.env.PAYTR_MERCHANT_ID;
    const merchant_key = process.env.PAYTR_MERCHANT_KEY;
    const merchant_salt = process.env.PAYTR_MERCHANT_SALT;

    if (!merchant_id || !merchant_key || !merchant_salt) {
      return NextResponse.json({ error: "PayTR yapılandırması eksik" }, { status: 500 });
    }

    // Fiyatlandırma bilgisini al
    const config = await prisma.platformConfig.findUnique({ where: { id: "main" } });
    const pricing = config?.pricing || { monthly: 2499, yearly: 24999 };
    const planPrice = tenant.selectedPlan === "yearly" ? pricing.yearly : pricing.monthly;

    // PayTR token parametreleri
    const merchant_oid = `SUB_${tenant.id}_${Date.now()}`;
    const email = tenant.ownerEmail;
    const payment_amount = (planPrice / 100).toFixed(2); // kuruş → TL formatı (PayTR kuruş istiyor ama iFrame TL istiyor)
    const user_ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const merchant_ok_url = `${process.env.NEXT_PUBLIC_APP_URL || "https://fiibi.co"}/api/paytr/subscription-callback`;
    const merchant_fail_url = `${process.env.NEXT_PUBLIC_APP_URL || "https://fiibi.co"}/api/paytr/subscription-callback`;
    const user_basket = JSON.stringify([["Fiibi Pro Abonelik", planPrice.toString(), 1]]);
    const currency = "TL";
    const test_mode = process.env.NODE_ENV === "production" ? "0" : "1";
    const no_installment = "1"; // Taksit yok
    const max_installment = "0";
    const user_name = tenant.ownerName;
    const user_address = "Fiibi Platform";
    const user_phone = tenant.ownerPhone || "05000000000";
    const debug_on = process.env.NODE_ENV === "production" ? "0" : "1";
    const timeout_limit = "30";
    const lang = "tr";

    // Kart saklama parametreleri
    const store_card = "1"; // Kartı sakla
    const utoken = tenant.paytrUtoken || ""; // Mevcut token varsa gönder (yeni kart ekleme için)

    // Hash oluştur
    const hash_str = `${merchant_id}${user_ip}${merchant_oid}${email}${payment_amount}${user_basket}${no_installment}${max_installment}${currency}${test_mode}`;
    const paytr_token = crypto
      .createHmac("sha256", merchant_key)
      .update(hash_str + merchant_salt)
      .digest("base64");

    // PayTR'ye token isteği gönder
    const params = new URLSearchParams({
      merchant_id,
      user_ip,
      merchant_oid,
      email,
      payment_amount: planPrice.toString(), // PayTR kuruş cinsinden istiyor
      paytr_token,
      user_basket,
      debug_on,
      no_installment,
      max_installment,
      currency,
      test_mode,
      merchant_ok_url,
      merchant_fail_url,
      user_name,
      user_address,
      user_phone,
      timeout_limit,
      lang,
      store_card,
    });

    // utoken varsa ekle
    if (utoken) {
      params.append("utoken", utoken);
    }

    const response = await fetch("https://www.paytr.com/odeme/api/get-token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const result = await response.json();

    if (result.status === "success") {
      // merchant_oid'i DB'ye kaydet (callback'te eşleştirmek için)
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          // merchant_oid'i geçici olarak sakla
        },
      });

      return NextResponse.json({
        success: true,
        token: result.token,
        iframeUrl: `https://www.paytr.com/odeme/guvenli/${result.token}`,
      });
    } else {
      console.error("PayTR token error:", result);
      return NextResponse.json({ error: result.reason || "Token oluşturulamadı" }, { status: 400 });
    }
  } catch (error) {
    console.error("PayTR subscription token error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
