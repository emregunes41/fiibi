import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTransferRequest, generateTransferId, calculateTransferAmounts } from "@/lib/paytr-transfer";

/**
 * POST /api/paytr/platform-transfer
 *
 * PayTR Platform Transfer API — Ödeme sonrası satıcıya hak ediş aktarımı.
 *
 * Bu endpoint admin panelinden veya cron job ile çağrılır.
 * Ödeme yapılmış siparişlerin tutarını, komisyon düşüldükten sonra
 * satıcının IBAN'ına transfer eder.
 *
 * Body: { reservationId: string }
 *   veya
 * Body: { reservationId: string, customSubmerchantAmount?: number }
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { reservationId, customSubmerchantAmount } = body;

    if (!reservationId) {
      return NextResponse.json({ error: "reservationId gerekli" }, { status: 400 });
    }

    // 1. Rezervasyonu ve tenant bilgilerini çek
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { tenant: true },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Rezervasyon bulunamadı" }, { status: 404 });
    }

    if (reservation.paymentStatus !== "PAID") {
      return NextResponse.json({ error: "Ödeme henüz tamamlanmamış. Transfer yapılamaz." }, { status: 400 });
    }

    const tenant = reservation.tenant;
    if (!tenant) {
      return NextResponse.json({ error: "Tenant bulunamadı" }, { status: 404 });
    }

    // 2. Satıcı IBAN ve unvan kontrolü
    if (!tenant.iban || !tenant.legalName) {
      return NextResponse.json({
        error: "Satıcının IBAN veya resmi unvan bilgileri eksik. Lütfen önce bu bilgileri tamamlayın.",
        missingFields: {
          iban: !tenant.iban,
          legalName: !tenant.legalName,
        }
      }, { status: 400 });
    }

    // 3. merchant_oid'i bul (ödeme kaydından)
    const payment = await prisma.payment.findFirst({
      where: {
        reservationId: reservationId,
        method: "ONLINE",
      },
      orderBy: { createdAt: "desc" },
    });

    if (!payment || !payment.note) {
      return NextResponse.json({ error: "Bu rezervasyon için online ödeme kaydı bulunamadı" }, { status: 400 });
    }

    // merchant_oid'i not'tan çıkar: "PayTR online ödeme: {merchant_oid}"
    const merchantOidMatch = payment.note.match(/PayTR online ödeme: (.+)/);
    const merchantOid = merchantOidMatch ? merchantOidMatch[1] : null;

    if (!merchantOid) {
      return NextResponse.json({ error: "merchant_oid bulunamadı" }, { status: 400 });
    }

    // 4. Aynı gün kontrolü — ödeme günü transfer yapılamaz
    const paymentDate = new Date(payment.createdAt).toDateString();
    const today = new Date().toDateString();
    if (paymentDate === today) {
      return NextResponse.json({
        error: "Ödeme ile aynı gün transfer talebi oluşturulamaz. En erken yarın gönderilebilir."
      }, { status: 400 });
    }

    // 5. Tutarları hesapla (kuruş cinsinden)
    const totalAmountTL = parseFloat(
      reservation.totalAmount?.replace(/\./g, "").replace(",", ".").replace(/[^0-9.-]/g, "") || "0"
    );
    const totalAmountKurus = Math.round(totalAmountTL * 100);

    let submerchantAmountKurus;
    if (customSubmerchantAmount !== undefined) {
      // Admin özel bir tutar belirlediyse
      submerchantAmountKurus = Math.round(customSubmerchantAmount * 100);
    } else {
      // Otomatik komisyon hesaplama
      const commissionRate = tenant.commissionRate || 6;
      const { submerchantAmount } = calculateTransferAmounts(totalAmountKurus, commissionRate);
      submerchantAmountKurus = submerchantAmount;
    }

    // 6. Benzersiz transfer ID oluştur
    const transId = generateTransferId(tenant.id, reservationId);

    // 7. PayTR'a transfer talebi gönder
    const result = await sendTransferRequest({
      merchantOid,
      transId,
      submerchantAmount: submerchantAmountKurus,
      totalAmount: totalAmountKurus,
      transferName: tenant.legalName,
      transferIban: tenant.iban,
    });

    // 8. Sonucu logla
    console.log(`[PLATFORM TRANSFER] Reservation: ${reservationId}, TransID: ${transId}, Result:`, result);

    if (result.status === "success") {
      // Transfer kaydını reservation'a ekle
      const transferLog = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        type: "PLATFORM_TRANSFER",
        transId,
        merchantOid,
        submerchantAmount: submerchantAmountKurus / 100,
        merchantAmount: result.merchant_amount ? parseFloat(result.merchant_amount) / 100 : null,
        reference: result.reference,
        description: `PayTR platform transfer: ${(submerchantAmountKurus / 100).toLocaleString("tr-TR")}₺ → ${tenant.legalName}`,
      };

      await prisma.reservation.update({
        where: { id: reservationId },
        data: {
          paymentLogs: reservation.paymentLogs
            ? [...reservation.paymentLogs, transferLog]
            : [transferLog],
        },
      });

      return NextResponse.json({
        status: "success",
        transId,
        reference: result.reference,
        submerchantAmount: submerchantAmountKurus / 100,
        merchantAmount: result.merchant_amount ? parseFloat(result.merchant_amount) / 100 : null,
      });
    } else {
      return NextResponse.json({
        status: "error",
        errorCode: result.err_no,
        errorMessage: result.err_msg,
        transId,
      }, { status: 400 });
    }

  } catch (error) {
    console.error("[PLATFORM TRANSFER ERROR]", error);
    return NextResponse.json({ error: error.message || "Sunucu hatası" }, { status: 500 });
  }
}
