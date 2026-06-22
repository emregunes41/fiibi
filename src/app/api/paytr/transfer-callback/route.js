import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTransferCallbackHash } from "@/lib/paytr-transfer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return new Response("OK", { status: 200, headers: { "Content-Type": "text/plain" } });
}

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
    let formData;
    try {
      formData = await req.formData();
    } catch (e) {
      console.log("[TRANSFER CALLBACK] PayTR Test Ping: FormData parse error. Returning OK.");
      return new Response("OK");
    }
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

    // Her bir trans_id için: paymentLogs'ta eşleşen rezervasyonu bul
    for (const transId of completedTransIds) {
      try {
        // paymentLogs JSON içinde transId'yi ara
        const reservation = await prisma.reservation.findFirst({
          where: {
            paymentLogs: { path: "$[*].transId", string_contains: transId }
          }
        }).catch(() => null);

        // Fallback: Eski format (TRF_tenant_reservation_ts) desteği
        let fallbackReservation = reservation;
        if (!fallbackReservation && transId.includes("_")) {
          const parts = transId.split("_");
          if (parts.length >= 3) {
            fallbackReservation = await prisma.reservation.findUnique({ where: { id: parts[2] } });
          }
        }

        const targetReservation = reservation || fallbackReservation;
        if (targetReservation) {
            // paymentLogs'taki ilgili transfer kaydını güncelle
            const updatedLogs = (targetReservation.paymentLogs || []).map((log) => {
              if (log.transId === transId) {
                return { ...log, transferCompleted: true, completedAt: new Date().toISOString() };
              }
              return log;
            });

            await prisma.reservation.update({
              where: { id: targetReservation.id },
              data: { paymentLogs: updatedLogs },
            });

            console.log(`[TRANSFER CALLBACK] ✅ Transfer tamamlandı: ${transId} → Reservation: ${targetReservation.id}`);
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
