import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { verifyAuth } from "@/lib/auth";
import { cookies } from "next/headers";

/**
 * PayTR iFrame token oluşturma — Kart saklama ile birlikte
 * Tenant ilk kez kart kaydettiğinde veya abonelik yenilerken kullanılır
 */
export async function POST(request) {
  try {
    // Admin authentication
    const cookieStore = await cookies();
    const adminToken = cookieStore.get("admin_token")?.value;
    if (!adminToken) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }
    let session;
    try {
      session = await verifyAuth(adminToken);
    } catch {
      return NextResponse.json({ error: "Geçersiz oturum" }, { status: 401 });
    }
    if (!session?.adminId) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId gerekli" }, { status: 400 });
    }

    // Verify admin belongs to this tenant
    if (session.tenantId !== tenantId) {
      return NextResponse.json({ error: "Bu tenant için yetkiniz yok" }, { status: 403 });
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

    // Fiyatlandırma — DB'deki değerler kuruş cinsinden (2499 = 24.99₺)
    const config = await prisma.platformConfig.findUnique({ where: { id: "main" } });
    const pricing = config?.pricing || { basic_monthly: 1499, basic_yearly: 14999, pro_monthly: 2999, pro_yearly: 29999 };
    
    let selectedPlanId = tenant.selectedPlan;
    if (selectedPlanId === "monthly") selectedPlanId = "pro_monthly";
    if (selectedPlanId === "yearly") selectedPlanId = "pro_yearly";
    
    const planPrice = pricing[selectedPlanId] || pricing.pro_monthly || 2999;
    const planPriceKurus = Math.round(planPrice * 100);

    const cleanTenantId = tenant.id.replace(/[^a-zA-Z0-9]/g, "");
    const merchant_oid = `SUBX${cleanTenantId}X${Date.now()}`;
    const email = tenant.ownerEmail;
    const payment_amount = planPriceKurus.toString(); // PayTR kuruş bekliyor
    const user_ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const host = request.headers.get("host") || "fiibi.co";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const platformDomain = process.env.PLATFORM_DOMAIN || "fiibi.co";
    const platformProtocol = platformDomain.includes("localhost") ? "http" : "https";
    const platformBaseUrl = `${platformProtocol}://${platformDomain}`;

    const merchant_ok_url = `${platformBaseUrl}/api/paytr/redirect?status=success&returnTo=${encodeURIComponent(`${baseUrl}/admin/subscription?payment=success`)}`;
    const merchant_fail_url = `${platformBaseUrl}/api/paytr/redirect?status=fail&returnTo=${encodeURIComponent(`${baseUrl}/admin/subscription?payment=fail`)}`;
    const user_basket = Buffer.from(JSON.stringify([[`Fiibi ${selectedPlanId.replace('_', ' ').toUpperCase()} Abonelik`, (planPriceKurus / 100).toFixed(2), 1]])).toString("base64");
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
      payment_amount, // Kuruş cinsinden
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
        iframeUrl: `${platformBaseUrl}/api/paytr/iframe/${result.token}`,
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
