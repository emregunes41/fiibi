"use server";

import { sendSMS } from "@/app/actions/send-sms";
import { prisma } from "@/lib/prisma";

export async function sendTestSMS(phone) {
  try {
    const settings = await prisma.globalSettings.findUnique({
      where: { id: "global-settings" },
    });

    if (!settings) {
      return { success: false, error: "Site ayarları bulunamadı" };
    }

    if (!settings.smsEnabled) {
      return { success: false, error: "SMS bildirimleri kapalı" };
    }

    const result = await sendSMS(
      phone,
      "SMS test mesajı ✅ Entegrasyonunuz başarıyla çalışıyor!",
      settings
    );

    return result;
  } catch (err) {
    console.error("Test SMS hatası:", err);
    return { success: false, error: err.message };
  }
}
