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
      // Find the reservation associated with this merchant_oid
      await prisma.reservation.update({
        where: { id: merchant_oid },
        data: {
          status: "CONFIRMED",
          paymentStatus: "PAID",
          // The paidAmount was set during pending save
        }
      });
      
      console.log(`PAYMENT SUCCESS for Reservation: ${merchant_oid}`);
    } else {
      console.log(`PAYMENT FAILED for Reservation: ${merchant_oid}`);
    }

    return new Response("OK");

  } catch (error) {
    console.error("PayTR Callback Error:", error);
    return new Response("ERROR", { status: 500 });
  }
}
