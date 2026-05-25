import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createPaytrToken, generateMerchantOid } from "@/lib/paytr";

// Bu endpoint bir Cron Job (Örn: Vercel Cron, AWS EventBridge) tarafından günde 1 kez tetiklenmelidir
export async function GET(req) {
  try {
    // Güvenlik Kontrolü (Cron'u sadece yetkili servis tetikleyebilir)
    // const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return new Response('Unauthorized', { status: 401 });
    // }

    console.log("CRON: Abonelik tahsilat süreci başlatıldı.");

    const now = new Date();
    
    // 1. Ödemesi GELMİŞ, dondurulmamış ve KARTI SAKLANMIŞ (utoken & ctoken olan) tenantları bul
    const expiringTenants = await prisma.tenant.findMany({
      where: {
        isActive: true,
        isFrozen: false,
        paytrUtoken: { not: null },
        paytrCtoken: { not: null },
        nextPaymentAt: { lte: now }, // Ödeme tarihi bugün veya geçmişte
      },
    });

    console.log(`CRON: Tahsilat yapılacak ${expiringTenants.length} işletme bulundu.`);

    const merchant_id = process.env.PAYTR_MERCHANT_ID;
    
    let successCount = 0;
    let failCount = 0;

    for (const tenant of expiringTenants) {
      try {
        // Fiyatlandırma
        let config;
        try { config = await prisma.platformConfig.findUnique({ where: { id: "main" } }); } catch { /* ignore */ }
        const pricing = config?.pricing || { basic_monthly: 1499, basic_yearly: 14999, pro_monthly: 2999, pro_yearly: 29999 };
        
        let selectedPlanId = tenant.selectedPlan;
        if (selectedPlanId === "monthly") selectedPlanId = "pro_monthly";
        if (selectedPlanId === "yearly") selectedPlanId = "pro_yearly";
        
        const planPrice = pricing[selectedPlanId] || pricing.pro_monthly || 2999;
        const planPriceKurus = Math.round(planPrice * 100);

        // PayTR Non-3D Parametreleri
        const merchant_oid = generateMerchantOid("CRON", tenant.id);
        const email = tenant.ownerEmail;
        const payment_amount = planPriceKurus.toString();
        const user_ip = "127.0.0.1"; // Sunucu üzerinden atıldığı için statik IP veya sunucu IP'si
        const currency = "TL";
        const test_mode = process.env.NODE_ENV === "production" ? "0" : "1";
        const non_3d = "1"; // 🔥 CRON için kritik parametre: 3D DOĞRULAMASI İSTEME
        const payment_type = "card";
        const installment_count = "0";

        // PayTR Hash Token
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

        // PayTR'ye POST edilecek form verileri
        const formData = new URLSearchParams();
        formData.append("merchant_id", merchant_id);
        formData.append("user_ip", user_ip);
        formData.append("merchant_oid", merchant_oid);
        formData.append("email", email);
        formData.append("payment_type", payment_type);
        formData.append("payment_amount", payment_amount);
        formData.append("currency", currency);
        formData.append("test_mode", test_mode);
        formData.append("non_3d", non_3d);
        formData.append("paytr_token", paytr_token);
        formData.append("installment_count", installment_count);
        
        // Kart Saklama Bilgileri
        formData.append("require_utoken", "1"); // Sadece bu kullanıcının token'ı
        formData.append("utoken", tenant.paytrUtoken);
        formData.append("ctoken", tenant.paytrCtoken); // Hangi kartından çekilecek

        console.log(`CRON: [${tenant.slug}] için ödeme isteği atılıyor (Tutar: ${payment_amount} kuruş)`);

        // PayTR Sunucusuna İsteği At
        const response = await fetch("https://www.paytr.com/odeme", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData.toString(),
        });

        const result = await response.json();

        if (result.status === "success") {
          // ÖDEME BAŞARILI
          console.log(`CRON: [${tenant.slug}] ödeme BAŞARILI!`);
          
          // Sonraki ödeme tarihini hesapla
          const nextDate = new Date();
          if (selectedPlanId.includes("yearly")) {
            nextDate.setFullYear(nextDate.getFullYear() + 1);
          } else {
            nextDate.setMonth(nextDate.getMonth() + 1);
          }

          await prisma.tenant.update({
            where: { id: tenant.id },
            data: {
              nextPaymentAt: nextDate,
              failedPayments: 0, // Hata sayacını sıfırla
              lastPaymentOid: merchant_oid,
            }
          });
          
          successCount++;
        } else {
          // ÖDEME BAŞARISIZ (Bakiye yetersiz, kart iptal vs.)
          console.error(`CRON: [${tenant.slug}] ödeme BAŞARISIZ: ${result.err_msg || result.reason}`);
          
          const failedCount = (tenant.failedPayments || 0) + 1;
          
          const updateData = {
            failedPayments: failedCount,
          };

          // 3 günden (3 denemeden) fazla başarısız olduysa hesabı dondur
          if (failedCount >= 3) {
            updateData.isFrozen = true;
            updateData.frozenAt = new Date();
            console.log(`CRON: [${tenant.slug}] 3 başarısız deneme. Hesap DONDURULDU.`);
            // TODO: İşletme sahibine "Hesabınız Donduruldu" e-postası at.
          } else {
            // TODO: İşletme sahibine "Ödeme alınamadı, kartınızı güncelleyin" e-postası at.
          }

          await prisma.tenant.update({
            where: { id: tenant.id },
            data: updateData
          });

          failCount++;
        }
      } catch (err) {
        console.error(`CRON: [${tenant.slug}] işlenirken sunucu hatası:`, err);
        failCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Cron job tamamlandı.",
      processed: expiringTenants.length,
      successful: successCount,
      failed: failCount,
    });

  } catch (error) {
    console.error("CRON Genel Hata:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
