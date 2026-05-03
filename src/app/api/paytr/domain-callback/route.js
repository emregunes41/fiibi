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
      return new NextResponse("OK", { status: 200 });
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
      console.error("Domain callback: Hash doğrulanamadı");
      return new NextResponse("OK", { status: 200 });
    }

    if (status === "success") {
      // OID formatı: DMN_tenantId_timestamp
      if (merchant_oid.startsWith("DMN_")) {
        const parts = merchant_oid.split("_");
        if (parts.length >= 3) {
          const tenantId = parts[1];

          // ── TENANT KONTROLÜ ──
          const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
          if (!tenant) {
            console.error("Domain callback: Tenant bulunamadı:", tenantId);
            return new NextResponse("OK", { status: 200 });
          }

          // ── İDEMPOTENCY: Aynı OID ile daha önce işlem yapılmış mı? ──
          const pending = tenant.pendingDomainPurchase;
          if (!pending || pending.merchantOid !== merchant_oid) {
            console.log("Domain callback: Pending purchase bulunamadı veya OID eşleşmedi. Muhtemel tekrar çağrı.");
            return new NextResponse("OK", { status: 200 });
          }

          // Detayları veritabanından oku (OID kırpılma sorunu artık yok)
          const { domain: purchasedDomain, years, isRenewal } = pending;

          const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
          
          if (VERCEL_TOKEN) {
            try {
              if (!isRenewal) {
                // Yeni Domain Satın Alımı
                const buyRes = await fetch(`https://api.vercel.com/v1/registrar/domains/${purchasedDomain}/buy`, {
                  method: "POST",
                  headers: {
                    "Authorization": `Bearer ${VERCEL_TOKEN}`,
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({ renew: false })
                });
                
                if (!buyRes.ok) {
                  const errorData = await buyRes.json();
                  console.error("Vercel Domain Satın Alma Hatası:", errorData);
                }

                // Otomatik yenilemeyi kapat (Zarar etmemek için)
                try {
                  await fetch(`https://api.vercel.com/v1/registrar/domains/${purchasedDomain}/auto-renew`, {
                    method: "PATCH",
                    headers: {
                      "Authorization": `Bearer ${VERCEL_TOKEN}`,
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ autoRenew: false })
                  });
                } catch(e) {}
                
              } else {
                // Mevcut Domaini Yenile
                const renewRes = await fetch(`https://api.vercel.com/v1/registrar/domains/${purchasedDomain}/renew`, {
                  method: "POST",
                  headers: {
                    "Authorization": `Bearer ${VERCEL_TOKEN}`,
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({})
                });
                if (!renewRes.ok) {
                   console.error("Vercel Domain Yenileme Hatası", await renewRes.json());
                }
              }

              // Birden fazla yıl alındıysa ek yenilemeler yap
              const extraRenewals = isRenewal ? years - 1 : years - 1;
              for (let i = 0; i < extraRenewals; i++) {
                await fetch(`https://api.vercel.com/v1/registrar/domains/${purchasedDomain}/renew`, {
                  method: "POST",
                  headers: { "Authorization": `Bearer ${VERCEL_TOKEN}`, "Content-Type": "application/json" },
                  body: JSON.stringify({})
                });
              }

            } catch (e) {
              console.error("Vercel API Fetch Hatası:", e);
            }
          }

          // Veritabanını güncelle
          let newExpiresAt = new Date();
          if (isRenewal && tenant.domainExpiresAt && new Date(tenant.domainExpiresAt) > new Date()) {
            newExpiresAt = new Date(tenant.domainExpiresAt);
          }
          newExpiresAt.setFullYear(newExpiresAt.getFullYear() + years);

          await prisma.tenant.update({
            where: { id: tenantId },
            data: {
              customDomain: purchasedDomain,
              purchasedDomain: true,
              domainExpiresAt: newExpiresAt,
              pendingDomainPurchase: null // İşlem tamamlandı, temizle (idempotency)
            }
          });

          // Vercel projeye domaini ekle (sadece yeni alım ise)
          const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
          if (!isRenewal && VERCEL_TOKEN && VERCEL_PROJECT_ID) {
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
    return new NextResponse("OK", { status: 200 });
  }
}
