import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * POST /api/paytr/test-checkout
 * 
 * PayTR bildirim URL testi için basit bir ödeme tokeni oluşturur.
 * fiibi.co anasayfasından erişilir. Sabit 10 TL (1000 kuruş).
 */
export async function POST(request) {
  try {
    const merchant_id = process.env.PAYTR_MERCHANT_ID;
    const merchant_key = process.env.PAYTR_MERCHANT_KEY;
    const merchant_salt = process.env.PAYTR_MERCHANT_SALT;

    if (!merchant_id || !merchant_key || !merchant_salt) {
      return NextResponse.json({ error: "PayTR yapılandırması eksik" }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const buyerEmail = body.email || "test@fiibi.co";
    const buyerName = body.name || "Test Kullanıcı";

    const merchant_oid = `TESTX${Date.now()}`;
    const payment_amount = "1000"; // 10.00 TL = 1000 kuruş
    const user_ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    const host = request.headers.get("host") || "fiibi.co";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const merchant_ok_url = `${baseUrl}/?payment=success`;
    const merchant_fail_url = `${baseUrl}/?payment=fail`;

    const user_basket = Buffer.from(JSON.stringify([["Fiibi Test Odeme", "10.00", 1]])).toString("base64");
    const currency = "TL";
    const test_mode = "1"; // Her zaman test modu
    const no_installment = "1";
    const max_installment = "0";
    const debug_on = "1";
    const timeout_limit = "30";
    const lang = "tr";

    // Hash oluştur
    const hash_str = `${merchant_id}${user_ip}${merchant_oid}${buyerEmail}${payment_amount}${user_basket}${no_installment}${max_installment}${currency}${test_mode}`;
    const paytr_token = crypto
      .createHmac("sha256", merchant_key)
      .update(hash_str + merchant_salt)
      .digest("base64");

    const params = new URLSearchParams({
      merchant_id,
      user_ip,
      merchant_oid,
      email: buyerEmail,
      payment_amount,
      paytr_token,
      user_basket,
      debug_on,
      no_installment,
      max_installment,
      currency,
      test_mode,
      merchant_ok_url,
      merchant_fail_url,
      user_name: buyerName,
      user_address: "Fiibi Test",
      user_phone: "05000000000",
      timeout_limit,
      lang,
    });

    const response = await fetch("https://www.paytr.com/odeme/api/get-token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const result = await response.json();

    if (result.status === "success") {
      return NextResponse.json({
        success: true,
        token: result.token,
        iframeUrl: `https://www.paytr.com/odeme/guvenli/${result.token}`,
        merchant_oid,
      });
    } else {
      console.error("PayTR test token error:", result);
      return NextResponse.json({ error: result.reason || "Token oluşturulamadı" }, { status: 400 });
    }
  } catch (error) {
    console.error("PayTR test checkout error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
