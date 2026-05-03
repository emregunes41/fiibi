import { NextResponse } from "next/server";
import { generatePaytrToken } from "@/lib/paytr";
import { headers } from "next/headers";
import { requireAdmin } from "@/app/admin/core-actions";

export async function POST(req) {
  try {
    const { domain, amount } = await req.json();

    const auth = await requireAdmin();
    if (auth?.error) {
      return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
    }

    const { getTenantId } = await import("@/lib/tenant");
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant bulunamadı" }, { status: 400 });
    }

    const merchant_id = process.env.PAYTR_MERCHANT_ID;
    const merchant_key = process.env.PAYTR_MERCHANT_KEY;
    const merchant_salt = process.env.PAYTR_MERCHANT_SALT;

    if (!merchant_id || !merchant_key || !merchant_salt) {
      return NextResponse.json({ error: "Sistem PayTR ayarları eksik." }, { status: 500 });
    }

    const headersList = await headers();
    const forwarded = headersList.get("x-forwarded-for");
    const user_ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

    const paymentAmountStr = String(Math.round(Number(amount) * 100)); // Kuruş cinsinden
    const safeDomain = domain.replace(/[^a-zA-Z0-9.-]/g, ""); // PayTR için güvenli karakterler
    const merchantOidStr = `DMN_${tenantId}_${Date.now()}_${safeDomain}`.substring(0, 64);

    const user_basket = Buffer.from(JSON.stringify([
      ["Domain Satın Alma: " + domain, amount, 1]
    ])).toString('base64');

    const params = {
      merchant_id,
      user_ip,
      merchant_oid: merchantOidStr,
      email: auth.user?.email || "admin@fiibi.co",
      payment_amount: paymentAmountStr,
      app_type: "NEXTJS",
      debug_on: "1",
      no_installment: "1", // Taksit kapalı
      max_installment: "0",
      currency: "TL",
      test_mode: "1", // Canlıda 0 yapılması gerekir
      user_basket,
      merchant_key,
      merchant_salt
    };

    const token = generatePaytrToken(params);

    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://www.fiibi.co";
    const okUrl = `${baseUrl}/admin/settings?tab=domain&status=success`;
    const failUrl = `${baseUrl}/admin/settings?tab=domain&status=fail`;

    const formData = new URLSearchParams({
      merchant_id: params.merchant_id,
      user_ip: params.user_ip,
      merchant_oid: params.merchant_oid,
      email: params.email,
      payment_amount: params.payment_amount,
      paytr_token: token,
      user_basket: params.user_basket,
      debug_on: params.debug_on,
      no_installment: params.no_installment,
      max_installment: params.max_installment,
      user_name: "Fiibi Tenant",
      user_address: "Türkiye",
      user_phone: "05555555555",
      merchant_ok_url: okUrl,
      merchant_fail_url: failUrl,
      timeout_limit: "30",
      currency: params.currency,
      test_mode: params.test_mode
    });

    const tokenRes = await fetch("https://www.paytr.com/odeme/api/get-token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString()
    });

    const tokenData = await tokenRes.json();
    if (tokenData.status === "success") {
      return NextResponse.json({ iframeToken: tokenData.token, merchant_oid: merchantOidStr });
    } else {
      console.error("PayTR Domain Token Error:", tokenData);
      return NextResponse.json({ error: tokenData.reason || "Ödeme başlatılamadı" }, { status: 400 });
    }
  } catch (err) {
    console.error("Domain Checkout Hatası:", err);
    return NextResponse.json({ error: "Sunucu hatası: " + err.message }, { status: 500 });
  }
}
