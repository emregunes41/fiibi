import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTransferCallbackHash } from "@/lib/paytr-transfer";

/**
 * POST /api/paytr/transfer-callback
 *
 * PayTR Platform Transfer Callback — Transferler tamamlandığında PayTR bu endpoint'i çağırır.
 * Bildirimi doğrular ve ilgili rezervasyonların transfer durumunu günceller.
 *
 * PayTR'dan gelen POST body:
 * - trans_ids: JSON formatında tamamlanan transfer ID'leri
 * - hash: HMAC-SHA256 doğrulama hash'i
 */
export async function POST(req) {
  try {
    const formData = await req.formData();
    const transIdsRaw = formData.get("trans_ids");
    const hash = formData.get("hash");

    if (!transIdsRaw || !hash) {
      console.error("[TRANSFER CALLBACK] Missing trans_ids or hash");
      return new Response("OK"); // PayTR'a OK dön ki tekrar denemesin
    }

    // Escape karakterlerini temizle
    const transIdsClean = transIdsRaw.replace(/\\\\/g, "");

    // Hash doğrulama
    const isValid = verifyTransferCallbackHash({
      transIds: transIdsClean,
      hash,
    });

    if (!isValid) {
      console.error("[TRANSFER CALLBACK] HASH MISMATCH!", { transIdsClean, hash });
      return new Response("OK"); // Yine OK dön, hata logla
    }

    // trans_ids JSON parse
    let completedTransIds;
    try {
      completedTransIds = JSON.parse(transIdsClean);
    } catch (e) {
      console.error("[TRANSFER CALLBACK] JSON parse error:", transIdsClean);
      return new Response("OK");
    }

    console.log(`[TRANSFER CALLBACK] Tamamlanan transferler:`, completedTransIds);

    // Her bir trans_id için: TRF_{tenantId}_{reservationId}_{timestamp}
    for (const transId of completedTransIds) {
      try {
        const parts = transId.split("_");
        if (parts.length >= 3 && parts[0] === "TRF") {
          const reservationId = parts[2];

          const reservation = await prisma.reservation.findUnique({
            where: { id: reservationId },
          });

          if (reservation) {
            // paymentLogs'taki ilgili transfer kaydını güncelle
            const updatedLogs = (reservation.paymentLogs || []).map((log) => {
              if (log.transId === transId) {
                return { ...log, transferCompleted: true, completedAt: new Date().toISOString() };
              }
              return log;
            });

            await prisma.reservation.update({
              where: { id: reservationId },
              data: { paymentLogs: updatedLogs },
            });

            console.log(`[TRANSFER CALLBACK] ✅ Transfer tamamlandı: ${transId} → Reservation: ${reservationId}`);
          }
        }
      } catch (innerError) {
        console.error(`[TRANSFER CALLBACK] Error processing transId ${transId}:`, innerError);
      }
    }

    // PayTR'a bildirimin alındığını bildir
    return new Response("OK");

  } catch (error) {
    console.error("[TRANSFER CALLBACK ERROR]", error);
    return new Response("OK"); // Her durumda OK dön
  }
}
