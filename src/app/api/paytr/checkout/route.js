import { NextResponse } from "next/server";
import { generatePaytrToken } from "@/lib/paytr";
import { headers } from "next/headers";

export async function POST(req) {
  try {
    const { 
      merchant_oid,
      email, 
      payment_amount, // Amount in kurus (integer)
      user_name,
      user_phone,
      user_address,
      user_basket
    } = await req.json();

    const headersList = await headers();
    const forwarded = headersList.get("x-forwarded-for");
    const user_ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

    const merchant_id = process.env.PAYTR_MERCHANT_ID;
    const merchant_key = process.env.PAYTR_MERCHANT_KEY;
    const merchant_salt = process.env.PAYTR_MERCHANT_SALT;

    // Ensure all values are strings for PayTR
    const paymentAmountStr = String(Math.round(Number(payment_amount)));
    const merchantOidStr = String(merchant_oid).substring(0, 64); // PayTR max 64 chars

    const params = {
      merchant_id,
      merchant_key,
      merchant_salt,
      user_ip,
      merchant_oid: merchantOidStr,
      email: email || "test@test.com",
      payment_amount: paymentAmountStr,
      user_basket: user_basket,
      debug_on: "1",
      no_installment: "0",
      max_installment: "0",
      currency: "TL",
      test_mode: "1"
    };

    // PayTR Hash: merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + no_installment + max_installment + currency + test_mode + merchant_salt
    const hashStr = 
      params.merchant_id + params.user_ip + params.merchant_oid + params.email + 
      params.payment_amount + params.user_basket + params.no_installment + 
      params.max_installment + params.currency + params.test_mode + params.merchant_salt;

    const crypto = await import("crypto");
    const paytr_token = crypto
      .createHmac("sha256", merchant_key)
      .update(hashStr)
      .digest("base64");

    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://www.pinowed.com";

    const formData = new URLSearchParams();
    formData.append("merchant_id", merchant_id);
    formData.append("user_ip", params.user_ip);
    formData.append("merchant_oid", params.merchant_oid);
    formData.append("email", params.email);
    formData.append("payment_amount", params.payment_amount);
    formData.append("paytr_token", paytr_token);
    formData.append("user_basket", params.user_basket);
    formData.append("debug_on", params.debug_on);
    formData.append("no_installment", params.no_installment);
    formData.append("max_installment", params.max_installment);
    formData.append("user_name", user_name || "Müşteri");
    formData.append("user_address", user_address || "Türkiye");
    formData.append("user_phone", user_phone || "05000000000");
    formData.append("merchant_ok_url", `${baseUrl}/profile`);
    formData.append("merchant_fail_url", `${baseUrl}/profile`);
    formData.append("timeout_limit", "30");
    formData.append("currency", params.currency);
    formData.append("test_mode", params.test_mode);

    console.log("PayTR Request params:", {
      merchant_id, user_ip: params.user_ip, merchant_oid: params.merchant_oid,
      email: params.email, payment_amount: params.payment_amount,
      debug_on: params.debug_on, test_mode: params.test_mode,
    });

    const response = await fetch("https://www.paytr.com/odeme/api/get-token", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    console.log("PayTR Response:", result);

    if (result.status === "success") {
      return NextResponse.json({ token: result.token });
    } else {
      return NextResponse.json({ error: result.reason || "PayTR token alınamadı" }, { status: 400 });
    }

  } catch (error) {
    console.error("PayTR Checkout Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
