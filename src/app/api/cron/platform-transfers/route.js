import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendTransferRequest, generateTransferId, calculateTransferAmounts } from "@/lib/paytr-transfer";

/**
 * Vercel Cron Job: Otomatik Platform Transfer
 * Her gün sabah 07:00 (UTC) = 10:00 (TR) çalışır.
 *
 * PayTR kuralları:
 * - Transfer talebi en geç saat 10:00'a kadar gönderilmeli
 * - Ödeme günü ile aynı gün transfer yapılamaz (en erken ertesi gün)
 *
 * Bu cron:
 * 1. Tüm PAID durumundaki rezervasyonları bulur
 * 2. Online ödeme yapılmış olanları filtreler
 * 3. Daha önce transfer yapılmamış olanları seçer
 * 4. Tenant'ın subMerchantStatus=APPROVED ve IBAN bilgisi var mı kontrol eder
 * 5. PayTR Platform Transfer API'sine transfer talebi gönderir
 */
export async function GET(request) {
  // Güvenlik: Vercel Cron secret kontrolü
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results = {
    transferred: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // Dünden önceki tüm PAID rezervasyonları bul (aynı gün transferi engellemek için)
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    const paidReservations = await prisma.reservation.findMany({
      where: {
        paymentStatus: "PAID",
        tenantId: { not: null },
      },
      include: {
        tenant: true,
        payments: {
          where: { method: "ONLINE" },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    for (const reservation of paidReservations) {
      try {
        const tenant = reservation.tenant;

        // Skip: Tenant yok veya onaylanmamış
        if (!tenant || tenant.subMerchantStatus !== "APPROVED") {
          results.skipped++;
          continue;
        }

        // Skip: IBAN veya unvan eksik
        if (!tenant.iban || !tenant.legalName) {
          results.skipped++;
          continue;
        }

        // Skip: Online ödeme yok
        const onlinePayment = reservation.payments[0];
        if (!onlinePayment || !onlinePayment.note) {
          results.skipped++;
          continue;
        }

        // Skip: Ödeme bugün yapılmış (aynı gün transfer yasak)
        const paymentDate = new Date(onlinePayment.createdAt);
        if (paymentDate.toDateString() === now.toDateString()) {
          results.skipped++;
          continue;
        }

        // Skip: Zaten transfer yapılmış
        const existingTransfer = (reservation.paymentLogs || []).find(
          (log) => log.type === "PLATFORM_TRANSFER"
        );
        if (existingTransfer) {
          results.skipped++;
          continue;
        }

        // merchant_oid'i bul
        const merchantOidMatch = onlinePayment.note.match(/PayTR online ödeme: (.+)/);
        const merchantOid = merchantOidMatch ? merchantOidMatch[1] : null;
        if (!merchantOid) {
          results.skipped++;
          continue;
        }

        // Tutarları hesapla
        const totalAmountTL = parseFloat(
          reservation.totalAmount?.replace(/\./g, "").replace(",", ".").replace(/[^0-9.-]/g, "") || "0"
        );
        const totalAmountKurus = Math.round(totalAmountTL * 100);

        if (totalAmountKurus <= 0) {
          results.skipped++;
          continue;
        }

        const commissionRate = tenant.commissionRate || 6;
        const { submerchantAmount } = calculateTransferAmounts(totalAmountKurus, commissionRate);

        // Transfer ID oluştur
        const transId = generateTransferId(tenant.id, reservation.id);

        // PayTR'a transfer talebi gönder
        const result = await sendTransferRequest({
          merchantOid,
          transId,
          submerchantAmount: submerchantAmount,
          totalAmount: totalAmountKurus,
          transferName: tenant.legalName,
          transferIban: tenant.iban,
        });

        if (result.status === "success") {
          // Transfer logunu kaydet
          const transferLog = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            type: "PLATFORM_TRANSFER",
            transId,
            merchantOid,
            submerchantAmount: submerchantAmount / 100,
            merchantAmount: result.merchant_amount ? parseFloat(result.merchant_amount) / 100 : null,
            reference: result.reference,
            description: `Otomatik transfer: ${(submerchantAmount / 100).toLocaleString("tr-TR")}₺ → ${tenant.legalName}`,
            automated: true,
          };

          await prisma.reservation.update({
            where: { id: reservation.id },
            data: {
              paymentLogs: reservation.paymentLogs
                ? [...reservation.paymentLogs, transferLog]
                : [transferLog],
            },
          });

          console.log(`✅ [AUTO TRANSFER] ${reservation.id} → ${tenant.slug}: ${submerchantAmount / 100}₺ (ref: ${result.reference})`);
          results.transferred++;
        } else {
          console.log(`❌ [AUTO TRANSFER FAIL] ${reservation.id}: ${result.err_no} - ${result.err_msg}`);
          results.errors.push(`${reservation.id}: ${result.err_msg}`);
        }

      } catch (innerError) {
        console.error(`[AUTO TRANSFER ERROR] Reservation ${reservation.id}:`, innerError);
        results.errors.push(`${reservation.id}: ${innerError.message}`);
      }
    }

    console.log(`[AUTO TRANSFER CRON] Completed: ${results.transferred} transferred, ${results.skipped} skipped, ${results.errors.length} errors`);

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      ...results,
    });

  } catch (error) {
    console.error("[AUTO TRANSFER CRON ERROR]", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
