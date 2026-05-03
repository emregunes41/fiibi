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
      // merchant_oid formatı: DMN_tenantId_timestamp_domain.com_years_isRenewFlag
      if (merchant_oid.startsWith("DMN_")) {
        const parts = merchant_oid.split("_");
        if (parts.length >= 6) {
          const isRenewFlag = parts.pop();
          const isRenewal = isRenewFlag === "1";
          const yearsStr = parts.pop();
          const years = parseInt(yearsStr, 10) || 1;
          const purchasedDomain = parts.slice(3).join("_");
          const tenantId = parts[1];

          const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
          
          if (VERCEL_TOKEN) {
            try {
              if (!isRenewal) {
                // 1. Yeni Domain Satın Alımı
                const buyRes = await fetch(`https://api.vercel.com/v1/registrar/domains/${purchasedDomain}/buy`, {
                  method: "POST",
                  headers: {
                    "Authorization": `Bearer ${VERCEL_TOKEN}`,
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({ renew: false }) // Varsayılan autoRenew'u Vercel açsa da aşağıda kapatacağız
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
                // 1. Mevcut Domaini Yenile
                const renewRes = await fetch(`https://api.vercel.com/v1/registrar/domains/${purchasedDomain}/renew`, {
                  method: "POST",
                  headers: {
                    "Authorization": `Bearer ${VERCEL_TOKEN}`,
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({}) // Vercel renew parametreleri (gerekirse expectedPrice eklenebilir)
                });
                if (!renewRes.ok) {
                   console.error("Vercel Domain Yenileme Hatası", await renewRes.json());
                }
              }

              // Birden fazla yıl alındıysa ek yenilemeler yap (eğer satın alma da 1 yıl veriyorsa, kalan yılları yenile)
              // Vercel API genelde tek seferde 1 yıl yeniler, bu sebeple döngüye sokuyoruz.
              if (years > 1 && !isRenewal) {
                for(let i = 1; i < years; i++) {
                   await fetch(`https://api.vercel.com/v1/registrar/domains/${purchasedDomain}/renew`, {
                     method: "POST",
                     headers: { "Authorization": `Bearer ${VERCEL_TOKEN}`, "Content-Type": "application/json" },
                     body: JSON.stringify({})
                   });
                }
              } else if (years > 1 && isRenewal) {
                // isRenewal = true iken zaten yukarıda 1 kez renew yaptık.
                for(let i = 1; i < years; i++) {
                   await fetch(`https://api.vercel.com/v1/registrar/domains/${purchasedDomain}/renew`, {
                     method: "POST",
                     headers: { "Authorization": `Bearer ${VERCEL_TOKEN}`, "Content-Type": "application/json" },
                     body: JSON.stringify({})
                   });
                }
              }

            } catch (e) {
              console.error("Vercel API Fetch Hatası:", e);
            }
          }

          // 2. Veritabanını güncelle
          const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
          
          let newExpiresAt = new Date();
          // Eğer yenilemeyse ve mevcut bir bitiş tarihi varsa, mevcut bitişin üzerine ekle
          if (isRenewal && tenant?.domainExpiresAt && new Date(tenant.domainExpiresAt) > new Date()) {
            newExpiresAt = new Date(tenant.domainExpiresAt);
          }
          
          newExpiresAt.setFullYear(newExpiresAt.getFullYear() + years);

          await prisma.tenant.update({
            where: { id: tenantId },
            data: {
              customDomain: purchasedDomain,
              purchasedDomain: true,
              domainExpiresAt: newExpiresAt
            }
          });

          // 3. Vercel projeye domaini ekle (sadece yeni alım ise)
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
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
