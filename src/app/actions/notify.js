"use server";

import { prisma } from "@/lib/prisma";
import { sendReservationReceivedEmail, sendReservationConfirmedEmail } from "./send-reservation-success";
import { sendSMS } from "./send-sms";

/**
 * Bildirim ayarlarını yükle
 */
export async function getNotificationSettings() {
  try {
    const settings = await prisma.globalSettings.findUnique({
      where: { id: "global-settings" },
    });
    return settings || { emailEnabled: true, smsEnabled: false, notifyReservation: true, notifyPayment: true, notifyReminder: true, notifyPhotosReady: true };
  } catch {
    return { emailEnabled: true, smsEnabled: false, notifyReservation: true, notifyPayment: true, notifyReminder: true, notifyPhotosReady: true };
  }
}

/**
 * Resend API Key — önce DB'den, yoksa .env'den
 */
function getResendApiKey(settings) {
  return settings.resendApiKey || process.env.RESEND_API_KEY || null;
}

/**
 * Genel e-posta gönderme (DB'deki veya .env'deki Resend key ile)
 */
export async function sendEmailWithResend(settings, to, subject, html) {
  const apiKey = getResendApiKey(settings);
  if (!apiKey) return { success: false, error: "Resend API Key yok" };

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: "Pinowed <hello@pinowed.com>",
      to: [to],
      subject,
      html,
    });
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    console.error("Email gönderme hatası:", err);
    return { success: false, error: err.message };
  }
}

/**
 * 1a. Rezervasyon ALINDI Bildirimi (henüz onay değil — detaylı bilgi maili)
 */
export async function notifyReservationReceived(email, phone, name, reservationDetails) {
  const settings = await getNotificationSettings();
  if (!settings.notifyReservation) return { email: null, sms: null };

  const results = { email: null, sms: null };

  if (settings.emailEnabled) {
    results.email = await sendReservationReceivedEmail(email, name, reservationDetails);
  }

  if (settings.smsEnabled && phone) {
    const formattedDate = new Date(reservationDetails.date).toLocaleDateString("tr-TR");
    const message = `Merhaba ${name}, rezervasyon talebiniz alındı! Tarih: ${formattedDate} | Tutar: ${reservationDetails.totalAmount} TL | Kapora sonrası onaylanacaktır. Detay: pinowed.com/profile`;
    results.sms = await sendSMS(phone, message, settings);
  }

  return results;
}

/**
 * 1b. Rezervasyon ONAYLANDI Bildirimi (kapora ödendi)
 */
export async function notifyReservationConfirmed(email, phone, name, date, totalAmount) {
  const settings = await getNotificationSettings();
  if (!settings.notifyReservation) return { email: null, sms: null };

  const results = { email: null, sms: null };
  const formattedDate = new Date(date).toLocaleDateString("tr-TR");

  if (settings.emailEnabled) {
    results.email = await sendReservationConfirmedEmail(email, name, date, totalAmount);
  }

  if (settings.smsEnabled && phone) {
    const message = `Merhaba ${name}, rezervasyonunuz onaylandı! Tarih: ${formattedDate} | Detay: pinowed.com/profile`;
    results.sms = await sendSMS(phone, message, settings);
  }

  return results;
}

/**
 * 2. Ödeme Alındı Bildirimi
 */
export async function notifyPaymentReceived(email, phone, name, amount, remaining) {
  const settings = await getNotificationSettings();
  if (!settings.notifyPayment) return { email: null, sms: null };

  const results = { email: null, sms: null };

  if (settings.emailEnabled && email) {
    results.email = await sendEmailWithResend(settings, email, "Ödemeniz Alındı ✓ - Pinowed", `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333;">Merhaba ${name},</h2>
        <p style="color: #555; font-size: 16px;">Ödemeniz başarıyla alındı.</p>
        <div style="background: #f9f9fb; border-left: 4px solid #4ade80; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 8px;"><strong>Ödenen:</strong> ${amount} ₺</p>
          <p style="margin: 0;"><strong>Kalan:</strong> ${remaining} ₺</p>
        </div>
        <a href="https://www.pinowed.com/profile" style="background: #000; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; display: inline-block; margin-top: 10px;">Profilime Git</a>
      </div>
    `);
  }

  if (settings.smsEnabled && phone) {
    const message = `Merhaba ${name}, ${amount} TL ödemeniz alındı. Kalan: ${remaining} TL | Detay: pinowed.com/profile`;
    results.sms = await sendSMS(phone, message, settings);
  }

  return results;
}

/**
 * 3. Etkinlik Hatırlatma (1 hafta kala)
 */
export async function notifyEventReminder(email, phone, name, date, packageName) {
  const settings = await getNotificationSettings();
  if (!settings.notifyReminder) return { email: null, sms: null };

  const results = { email: null, sms: null };
  const formattedDate = new Date(date).toLocaleDateString("tr-TR");

  if (settings.emailEnabled && email) {
    results.email = await sendEmailWithResend(settings, email, "Çekiminize 1 Hafta Kaldı! 📸", `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333;">Merhaba ${name}! 🎉</h2>
        <p style="color: #555; font-size: 16px;">Çekiminize sadece <strong>1 hafta</strong> kaldı!</p>
        <div style="background: #f9f9fb; border-left: 4px solid #facc15; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 8px;"><strong>Tarih:</strong> ${formattedDate}</p>
          <p style="margin: 0;"><strong>Paket:</strong> ${packageName || "Fotoğraf Çekimi"}</p>
        </div>
        <p style="color: #555;">Hazırlıklarınızı tamamladığınızdan emin olun. Sorularınız için bize ulaşabilirsiniz.</p>
      </div>
    `);
  }

  if (settings.smsEnabled && phone) {
    const message = `Merhaba ${name}, çekiminize 1 hafta kaldı! Tarih: ${formattedDate} | Hazırlıklarınızı tamamlayın. Pinowed`;
    results.sms = await sendSMS(phone, message, settings);
  }

  return results;
}

/**
 * 4. Fotoğraflar Hazır Bildirimi
 */
export async function notifyPhotosReady(email, phone, name) {
  const settings = await getNotificationSettings();
  if (!settings.notifyPhotosReady) return { email: null, sms: null };

  const results = { email: null, sms: null };

  if (settings.emailEnabled && email) {
    results.email = await sendEmailWithResend(settings, email, "Fotoğraflarınız Hazır! 📷✨", `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333;">Merhaba ${name}! 🎉</h2>
        <p style="color: #555; font-size: 16px;">Fotoğraflarınız hazır ve panelinize yüklendi!</p>
        <p style="color: #555;">Hemen giriş yaparak fotoğraflarınızı görüntüleyebilir ve seçiminizi yapabilirsiniz.</p>
        <a href="https://www.pinowed.com/profile" style="background: #000; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 6px; display: inline-block; margin-top: 16px; font-weight: bold;">Fotoğraflarımı Gör</a>
      </div>
    `);
  }

  if (settings.smsEnabled && phone) {
    const message = `Merhaba ${name}, fotoğraflarınız hazır! Giriş yaparak görüntüleyin ve seçiminizi yapın: pinowed.com/profile | Pinowed`;
    results.sms = await sendSMS(phone, message, settings);
  }

  return results;
}
