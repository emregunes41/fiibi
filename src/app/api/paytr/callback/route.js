import { NextResponse } from "next/server";
import { verifyPaytrCallback } from "@/lib/paytr";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.formData();
    const data = Object.fromEntries(body.entries());

    const {
      merchant_oid,
      status,
      total_amount,
      hash
    } = data;

    const merchant_key = process.env.PAYTR_MERCHANT_KEY;
    const merchant_salt = process.env.PAYTR_MERCHANT_SALT;

    const isVerified = verifyPaytrCallback({
      merchant_oid,
      merchant_salt,
      status,
      total_amount,
      merchant_key
    }, hash);

    if (!isVerified) {
      console.error("PAYTR CALLBACK HASH MISMATCH");
      return new Response("PAYTR CALLBACK HASH MISMATCH", { status: 400 });
    }

    if (status === "success") {
      const paidAmountTL = parseFloat(total_amount) / 100; // PayTR sends kuruş

      const reservationId = merchant_oid.split('X')[0];

      // IDEMPOTENCY CHECK: Race Condition and Replay Protection
      const existingPayment = await prisma.payment.findFirst({
        where: { note: { contains: merchant_oid } }
      });

      if (existingPayment) {
        console.log(`PAYMENT ALREADY PROCESSED for merchant_oid: ${merchant_oid}`);
        return new Response("OK"); // Respond OK to PayTR so it stops retrying
      }

      // Create payment record
      const newPayment = await prisma.payment.create({
        data: {
          reservationId: reservationId,
          amount: paidAmountTL,
          method: "ONLINE",
          note: `PayTR online ödeme: ${merchant_oid}`,
        }
      });

      // Recalculate total paid
      const payments = await prisma.payment.findMany({ where: { reservationId: reservationId } });
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

      const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } });
      const totalAmount = parseFloat(reservation.totalAmount?.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '') || '0');

      let paymentStatus = "UNPAID";
      if (totalPaid >= totalAmount && totalAmount > 0) {
        paymentStatus = "PAID";
      } else if (totalPaid > 0) {
        paymentStatus = "PARTIAL";
      }

      const logPayload = { id: Date.now().toString(), paymentId: newPayment.id, date: new Date().toISOString(), type: "ADD_PAYMENT", amount: `+ ${paidAmountTL.toLocaleString('tr-TR')}₺`, description: `Online ödeme alındı (PayTR).`, totalSnapshot: totalAmount, paidSnapshot: totalPaid };

      await prisma.reservation.update({
        where: { id: reservationId },
        data: {
          status: "CONFIRMED",
          paymentStatus,
          paidAmount: totalPaid.toString(),
          paymentLogs: reservation.paymentLogs 
            ? [...reservation.paymentLogs, logPayload]
            : [logPayload]
        }
      });
      
      console.log(`PAYMENT SUCCESS for Reservation: ${reservationId} - ${paidAmountTL} TL`);
    } else {
      console.log(`PAYMENT FAILED for Reservation: ${merchant_oid}`);
    }

    return new Response("OK");

  } catch (error) {
    console.error("PayTR Callback Error:", error);
    return new Response("ERROR", { status: 500 });
  }
}
