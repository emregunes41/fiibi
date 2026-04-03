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

      // Create payment record
      await prisma.payment.create({
        data: {
          reservationId: merchant_oid,
          amount: paidAmountTL,
          method: "ONLINE",
          note: "PayTR online ödeme",
        }
      });

      // Recalculate total paid
      const payments = await prisma.payment.findMany({ where: { reservationId: merchant_oid } });
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

      const reservation = await prisma.reservation.findUnique({ where: { id: merchant_oid } });
      const totalAmount = parseFloat(reservation.totalAmount?.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '') || '0');

      let paymentStatus = "UNPAID";
      if (totalPaid >= totalAmount && totalAmount > 0) {
        paymentStatus = "PAID";
      } else if (totalPaid > 0) {
        paymentStatus = "PARTIAL";
      }

      await prisma.reservation.update({
        where: { id: merchant_oid },
        data: {
          status: "CONFIRMED",
          paymentStatus,
          paidAmount: totalPaid.toString(),
        }
      });
      
      console.log(`PAYMENT SUCCESS for Reservation: ${merchant_oid} - ${paidAmountTL} TL`);
    } else {
      console.log(`PAYMENT FAILED for Reservation: ${merchant_oid}`);
    }

    return new Response("OK");

  } catch (error) {
    console.error("PayTR Callback Error:", error);
    return new Response("ERROR", { status: 500 });
  }
}
