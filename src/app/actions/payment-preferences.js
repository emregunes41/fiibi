"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/app/user-actions";
import { revalidatePath } from "next/cache";

export async function toggleCustomerPaymentPreference(reservationId, newPreference, newTotalStr) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Yetkisiz işlem." };

    const r = await prisma.reservation.findUnique({ where: { id: reservationId } });
    if (!r) return { error: "Rezervasyon bulunamadı." };
    if (r.userId !== user.id) return { error: "Size ait değil." };

    const oldPreference = r.paymentPreference;
    if (oldPreference === newPreference) return { success: true };

    const numericNewTotal = newTotalStr 
      ? parseFloat(newTotalStr.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '') || '0')
      : parseFloat(r.totalAmount?.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '') || '0');
      
    const existingPaidAmount = parseFloat(r.paidAmount || '0');

    let logEntry = null;

    if (newPreference === "CREDIT_CARD") {
       logEntry = { 
         id: Date.now().toString(), 
         date: new Date().toISOString(), 
         type: "CARD_CONVERSION", 
         amount: `+%15`, 
         description: `Kredi kartı tercih edildi (%15 eklendi). Yeni Tutar: ${newTotalStr}`, 
         totalSnapshot: numericNewTotal, 
         paidSnapshot: existingPaidAmount 
       };
    } else if (newPreference === "CASH") {
       // Reverting to cash
       const cashTotal = numericNewTotal; // Should be original cash amount passed in
       const cashTotalStr = cashTotal.toLocaleString('tr-TR');
       logEntry = { 
         id: Date.now().toString(), 
         date: new Date().toISOString(), 
         type: "CASH_REVERSION", 
         amount: `Kaldırıldı`, 
         description: `Nakit ödemeye dönüldü, komisyon iade edildi. Yeni Tutar: ${cashTotalStr}`, 
         totalSnapshot: cashTotal, 
         paidSnapshot: existingPaidAmount 
       };
    }

    const dataPayload = {
      paymentPreference: newPreference,
    };
    if (newPreference === "CREDIT_CARD" && newTotalStr) dataPayload.totalAmount = newTotalStr;
    if (newPreference === "CASH" && newTotalStr) dataPayload.totalAmount = newTotalStr;

    if (logEntry) {
      dataPayload.paymentLogs = r.paymentLogs ? [...r.paymentLogs, logEntry] : [logEntry];
    }

    await prisma.reservation.update({
      where: { id: reservationId },
      data: dataPayload
    });

    revalidatePath("/profile");
    return { success: true };
  } catch (err) {
    console.error("Payment Preference Toggle Error:", err);
    return { error: err.message };
  }
}
