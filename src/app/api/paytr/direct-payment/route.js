import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createPaytrToken, generateMerchantOid } from "@/lib/paytr";
import { verifyAuth } from "@/lib/auth";
import { cookies } from "next/headers";

/**
 * PayTR Direkt API — 1. Adım
 * İlk ödeme formu için token + hidden field değerlerini oluşturur
 * Frontend bu değerlerle formu https://www.paytr.com/odeme adresine POST eder
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

    const merchant_id = process.env.PAYTR_MERCHANT_ID;
    if (!merchant_id) {
      return NextResponse.json({ error: "PayTR yapılandırması eksik" }, { status: 500 });
    }

    // Fiyatlandırma
    let config;
    try {
      config = await prisma.platformConfig.findUnique({ where: { id: "main" } });
    } catch { /* ignore */ }
    const pricing = config?.pricing || { basic_monthly: 1499, basic_yearly: 14999, pro_monthly: 2999, pro_yearly: 29999 };
    
    // Geriye dönük uyumluluk (eski 'monthly' veya 'yearly' planları 'pro' olarak kabul et)
    let selectedPlanId = tenant.selectedPlan;
    if (selectedPlanId === "monthly") selectedPlanId = "pro_monthly";
    if (selectedPlanId === "yearly") selectedPlanId = "pro_yearly";
    
    const planPrice = pricing[selectedPlanId] || pricing.pro_monthly || 2999;
    const planPriceKurus = Math.round(planPrice * 100);

    // Direkt API parametreleri
    const merchant_oid = generateMerchantOid("SUB", tenant.id);
    const email = tenant.ownerEmail;
    const payment_amount = planPriceKurus.toString();
    const user_ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const currency = "TL";
    const test_mode = process.env.NODE_ENV === "production" ? "0" : "1";
    const non_3d = "0"; // İlk ödeme 3D güvenli
    const payment_type = "card";
    const installment_count = "0"; // Taksit yok
    const client_lang = "tr";
    const non3d_test_failed = "0";
    const card_type = ""; // BIN sorgusu yapmadığımız için boş
    const debug_on = process.env.NODE_ENV === "production" ? "0" : "1";

    const host = request.headers.get("host") || "fiibi.co";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const platformDomain = process.env.PLATFORM_DOMAIN || "fiibi.co";
    const platformProtocol = platformDomain.includes("localhost") ? "http" : "https";
    const platformBaseUrl = `${platformProtocol}://${platformDomain}`;

    const merchant_ok_url = `${platformBaseUrl}/api/paytr/redirect?status=success&returnTo=${encodeURIComponent(`${baseUrl}/admin/subscription?payment=success`)}`;
    const merchant_fail_url = `${platformBaseUrl}/api/paytr/redirect?status=fail&returnTo=${encodeURIComponent(`${baseUrl}/admin/subscription?payment=failed`)}`;

    const user_basket = Buffer.from(JSON.stringify([
      [`Fiibi ${selectedPlanId.replace('_', ' ').toUpperCase()} Abonelik`, (planPriceKurus / 100).toFixed(2), 1],
    ])).toString("base64");

    // Token oluştur
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

    // Frontend'e form verilerini dön — form bu değerlerle paytr.com/odeme'ye POST edilecek
    const formData = {
        merchant_id,
        user_ip,
        merchant_oid,
        email,
        payment_type,
        payment_amount,
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
        installment_count,
        card_type,
    };

    // Kart saklama: store_card=1 gönder, mevcut utoken varsa ekle
    // (utoken yoksa PayTR yeni bir tane oluşturur ve callback'te döner)
    formData.store_card = "1";
    if (tenant.paytrUtoken) {
      formData.utoken = tenant.paytrUtoken;
    }

    return NextResponse.json({
      success: true,
      formAction: "https://www.paytr.com/odeme",
      formData,
    });
  } catch (error) {
    console.error("PayTR direct payment error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
