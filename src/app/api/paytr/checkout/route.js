import { NextResponse } from "next/server";
import { generatePaytrToken } from "@/lib/paytr";
import { headers } from "next/headers";

export async function POST(req) {
  try {
    const { 
      merchant_oid, // Unique order ID (reservation id)
      email, 
      payment_amount, // Amount in kurus (decimal * 100)
      user_name,
      user_phone,
      user_address,
      user_basket // Array or pre-encoded string
    } = await req.json();

    const headersList = await headers();
    const user_ip = headersList.get("x-forwarded-for") || "127.0.0.1";

    const merchant_id = process.env.PAYTR_MERCHANT_ID;
    const merchant_key = process.env.PAYTR_MERCHANT_KEY;
    const merchant_salt = process.env.PAYTR_MERCHANT_SALT;

    const params = {
      merchant_id,
      merchant_key,
      merchant_salt,
      user_ip,
      merchant_oid,
      email,
      payment_amount,
      user_basket,
      debug_on: "1", // Set to 0 in strictly production
      app_type: "iframe",
      no_installment: "0",
      max_installment: "0",
      currency: "TL",
      test_mode: "1" // Set to 0 in strictly production
    };

    const paytr_token = generatePaytrToken(params);

    const baseUrl = process.env.NEXT_PUBLIC_URL || `http://${req.headers.get("host")}`;

    const formData = new URLSearchParams();
    formData.append("merchant_id", merchant_id);
    formData.append("user_ip", user_ip);
    formData.append("merchant_oid", merchant_oid);
    formData.append("email", email);
    formData.append("payment_amount", payment_amount);
    formData.append("paytr_token", paytr_token);
    formData.append("user_basket", user_basket);
    formData.append("debug_on", params.debug_on);
    formData.append("no_installment", params.no_installment);
    formData.append("max_installment", params.max_installment);
    formData.append("user_name", user_name);
    formData.append("user_address", user_address);
    formData.append("user_phone", user_phone);
    formData.append("merchant_ok_url", `${baseUrl}/checkout-success`);
    formData.append("merchant_fail_url", `${baseUrl}/checkout-fail`);
    formData.append("timeout_limit", "30");
    formData.append("currency", params.currency);
    formData.append("test_mode", params.test_mode);

    const response = await fetch("https://www.paytr.com/odeme/api/get-token", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (result.status === "success") {
      return NextResponse.json({ token: result.token });
    } else {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }

  } catch (error) {
    console.error("PayTR Checkout Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
