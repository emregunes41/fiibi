import { NextResponse } from "next/server";
import { verifyPaytrCallback } from "@/lib/paytr";
import { prisma } from "@/lib/prisma";


export async function POST(req) {
  try {
    const formData = await req.formData();
    const params = Object.fromEntries(formData.entries());

    const merchant_key = process.env.PAYTR_MERCHANT_KEY;
    const merchant_salt = process.env.PAYTR_MERCHANT_SALT;

    if (!merchant_key || !merchant_salt) {
      return NextResponse.json({ error: "Sistem PayTR ayarları eksik." }, { status: 500 });
    }

    const { merchant_oid, status, total_amount, hash } = params;

    const isValid = verifyPaytrCallback({
      merchant_oid,
      merchant_salt,
      status,
      total_amount,
      merchant_key
    }, hash);

    if (!isValid) {
      return NextResponse.json({ error: "PAYTR notification failed: bad hash" }, { status: 400 });
    }

    if (status === "success") {
      // merchant_oid formatı: DMN_tenantId_timestamp_domain.com
      if (merchant_oid.startsWith("DMN_")) {
        const parts = merchant_oid.split("_");
        if (parts.length >= 4) {
          const tenantId = parts[1];
          const purchasedDomain = parts.slice(3).join("_"); // in case domain has underscores

          // 1. Vercel üzerinden domaini satın al
          const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
          let vercelSuccess = false;
          
          if (VERCEL_TOKEN) {
            try {
              // Buy domain via Vercel Registrar API
              const buyRes = await fetch(`https://api.vercel.com/v1/registrar/domains/${purchasedDomain}/buy`, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${VERCEL_TOKEN}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({ renew: true })
              });
              
              if (buyRes.ok) {
                vercelSuccess = true;
              } else {
                const errorData = await buyRes.json();
                console.error("Vercel Domain Satın Alma Hatası:", errorData);
              }
            } catch (e) {
              console.error("Vercel Buy Fetch Hatası:", e);
            }
          }

          // 2. Veritabanını güncelle
          const nextYear = new Date();
          nextYear.setFullYear(nextYear.getFullYear() + 1);

          await prisma.tenant.update({
            where: { id: tenantId },
            data: {
              customDomain: purchasedDomain,
              purchasedDomain: true,
              domainExpiresAt: nextYear
            }
          });

          // 3. Vercel projeye domaini ekle (updateTenantDomain içindeki logic)
          const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
          if (VERCEL_TOKEN && VERCEL_PROJECT_ID) {
            try {
              await fetch(`https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains`, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${VERCEL_TOKEN}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({ name: purchasedDomain })
              });
            } catch (e) {
              console.error("Projeye domain ekleme hatası:", e);
            }
          }
        }
      }
    }

    return new NextResponse("OK", { status: 200 });
  } catch (err) {
    console.error("Domain PayTR Callback Hatası:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
