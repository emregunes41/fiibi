import { NextResponse } from "next/server";
import { generatePaytrToken } from "@/lib/paytr";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const { domain, years = 1, isRenewal = false } = await req.json();

    const auth = await requireAdmin();
    if (auth?.error) {
      return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
    }

    const { getTenantId } = await import("@/lib/tenant");
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant bulunamadı" }, { status: 400 });
    }

    // ── GÜVENLİK: Fiyatı sunucu tarafında yeniden hesapla ──
    // İstemciden gelen amount değerine ASLA güvenme
    const { checkDomainAvailability } = await import("@/app/admin/core-actions");
    const priceResult = await checkDomainAvailability(domain);
    const domainItem = priceResult?.results?.find(r => r.domain === domain);
    if (!domainItem?.price) {
      return NextResponse.json({ error: "Domain fiyatı hesaplanamadı." }, { status: 400 });
    }
    const amount = domainItem.price * years;

    const merchant_id = process.env.PAYTR_MERCHANT_ID;
    const merchant_key = process.env.PAYTR_MERCHANT_KEY;
    const merchant_salt = process.env.PAYTR_MERCHANT_SALT;

    if (!merchant_id || !merchant_key || !merchant_salt) {
      return NextResponse.json({ error: "Sistem ödeme ayarları eksik." }, { status: 500 });
    }

    const headersList = await headers();
    const forwarded = headersList.get("x-forwarded-for");
    const user_ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

    const paymentAmountStr = String(Math.round(Number(amount) * 100)); // Kuruş cinsinden
    // OID artık kısa — domain bilgisi veritabanında saklanıyor
    const merchantOidStr = `DMN_${tenantId}_${Date.now()}`;

    // ── Satın alma detaylarını veritabanına kaydet (OID kırpılma sorunu çözümü) ──
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        pendingDomainPurchase: {
          domain,
          years,
          isRenewal,
          merchantOid: merchantOidStr,
          createdAt: new Date().toISOString()
        }
      }
    });

    const actionText = isRenewal ? "Domain Yenileme" : "Domain Satın Alma";
    const user_basket = Buffer.from(JSON.stringify([
      [`${actionText}: ${domain} (${years} Yıl)`, amount, 1]
    ])).toString('base64');

    const test_mode = process.env.NODE_ENV === "production" ? "0" : "1";

    const params = {
      merchant_id,
      user_ip,
      merchant_oid: merchantOidStr,
      email: auth.session?.email || "admin@fiibi.co",
      payment_amount: paymentAmountStr,
      app_type: "NEXTJS",
      debug_on: "1",
      no_installment: "1",
      max_installment: "0",
      currency: "TL",
      test_mode,
      user_basket,
      merchant_key,
      merchant_salt
    };

    const token = generatePaytrToken(params);

    const host = headersList.get("host") || "fiibi.co";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;
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
    return NextResponse.json({ error: "Ödeme işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin." }, { status: 500 });
  }
}
