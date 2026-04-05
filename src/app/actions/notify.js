"use server";

import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "./send-welcome";
import { sendReservationSuccessEmail } from "./send-reservation-success";
import { sendSMS } from "./send-sms";

/**
 * Bildirim ayarlarını yükle
 */
async function getNotificationSettings() {
  try {
    const settings = await prisma.globalSettings.findUnique({
      where: { id: "global-settings" },
    });
    return settings || { emailEnabled: true, smsEnabled: false };
  } catch {
    return { emailEnabled: true, smsEnabled: false };
  }
}

/**
 * 1. Hoş Geldin Bildirimi (Hesap oluşturuldu + şifre)
 */
export async function notifyWelcome(email, phone, name, password) {
  const settings = await getNotificationSettings();
  const results = { email: null, sms: null };

  // E-posta gönder
  if (settings.emailEnabled) {
    results.email = await sendWelcomeEmail(email, name, password);
  }

  // SMS gönder
  if (settings.smsEnabled && phone) {
    const message = `Pinowed'e hoş geldiniz ${name}! Giriş: pinowed.com/login | E-posta: ${email} | Şifre: ${password}`;
    results.sms = await sendSMS(phone, message, settings);
  }

  return results;
}

/**
 * 2. Rezervasyon Onay Bildirimi
 */
export async function notifyReservationSuccess(email, phone, name, date, totalAmount) {
  const settings = await getNotificationSettings();
  const results = { email: null, sms: null };
  const formattedDate = new Date(date).toLocaleDateString("tr-TR");

  // E-posta gönder
  if (settings.emailEnabled) {
    results.email = await sendReservationSuccessEmail(email, name, date, totalAmount);
  }

  // SMS gönder
  if (settings.smsEnabled && phone) {
    const message = `Merhaba ${name}, rezervasyonunuz onaylandı! Tarih: ${formattedDate} | Tutar: ${totalAmount} TL | Detay: pinowed.com/profile`;
    results.sms = await sendSMS(phone, message, settings);
  }

  return results;
}

/**
 * 3. Ödeme Alındı Bildirimi
 */
export async function notifyPaymentReceived(email, phone, name, amount, remaining) {
  const settings = await getNotificationSettings();
  const results = { email: null, sms: null };

  // E-posta gönder
  if (settings.emailEnabled && email) {
    // Basit ödeme e-postası
    const { Resend } = await import("resend");
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: "Pinowed <hello@pinowed.com>",
        to: [email],
        subject: "Ödemeniz Alındı ✓ - Pinowed",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #333;">Merhaba ${name},</h2>
            <p style="color: #555; font-size: 16px;">Ödemeniz başarıyla alındı.</p>
            <div style="background: #f9f9fb; border-left: 4px solid #4ade80; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 8px;"><strong>Ödenen:</strong> ${amount} ₺</p>
              <p style="margin: 0;"><strong>Kalan:</strong> ${remaining} ₺</p>
            </div>
            <a href="https://www.pinowed.com/profile" style="background: #000; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; display: inline-block; margin-top: 10px;">Profilime Git</a>
          </div>
        `,
      });
      results.email = { success: true };
    }
  }

  // SMS gönder
  if (settings.smsEnabled && phone) {
    const message = `Merhaba ${name}, ${amount} TL ödemeniz alındı. Kalan: ${remaining} TL | Detay: pinowed.com/profile`;
    results.sms = await sendSMS(phone, message, settings);
  }

  return results;
}

/**
 * 4. Etkinlik Hatırlatma (1 hafta kala)
 */
export async function notifyEventReminder(email, phone, name, date, packageName) {
  const settings = await getNotificationSettings();
  const results = { email: null, sms: null };
  const formattedDate = new Date(date).toLocaleDateString("tr-TR");

  // E-posta gönder
  if (settings.emailEnabled && email) {
    const { Resend } = await import("resend");
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: "Pinowed <hello@pinowed.com>",
        to: [email],
        subject: "Çekiminize 1 Hafta Kaldı! 📸",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #333;">Merhaba ${name}! 🎉</h2>
            <p style="color: #555; font-size: 16px;">Çekiminize sadece <strong>1 hafta</strong> kaldı!</p>
            <div style="background: #f9f9fb; border-left: 4px solid #facc15; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 8px;"><strong>Tarih:</strong> ${formattedDate}</p>
              <p style="margin: 0;"><strong>Paket:</strong> ${packageName || "Fotoğraf Çekimi"}</p>
            </div>
            <p style="color: #555;">Hazırlıklarınızı tamamladığınızdan emin olun. Sorularınız için bize ulaşabilirsiniz.</p>
          </div>
        `,
      });
      results.email = { success: true };
    }
  }

  // SMS gönder
  if (settings.smsEnabled && phone) {
    const message = `Merhaba ${name}, çekiminize 1 hafta kaldı! Tarih: ${formattedDate} | Hazırlıklarınızı tamamlayın. Pinowed`;
    results.sms = await sendSMS(phone, message, settings);
  }

  return results;
}

/**
 * 5. Fotoğraflar Hazır Bildirimi
 */
export async function notifyPhotosReady(email, phone, name) {
  const settings = await getNotificationSettings();
  const results = { email: null, sms: null };

  // E-posta gönder
  if (settings.emailEnabled && email) {
    const { Resend } = await import("resend");
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: "Pinowed <hello@pinowed.com>",
        to: [email],
        subject: "Fotoğraflarınız Hazır! 📷✨",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #333;">Merhaba ${name}! 🎉</h2>
            <p style="color: #555; font-size: 16px;">Fotoğraflarınız hazır ve panelinize yüklendi!</p>
            <p style="color: #555;">Hemen giriş yaparak fotoğraflarınızı görüntüleyebilir ve seçiminizi yapabilirsiniz.</p>
            <a href="https://www.pinowed.com/profile" style="background: #000; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 6px; display: inline-block; margin-top: 16px; font-weight: bold;">Fotoğraflarımı Gör</a>
          </div>
        `,
      });
      results.email = { success: true };
    }
  }

  // SMS gönder
  if (settings.smsEnabled && phone) {
    const message = `Merhaba ${name}, fotoğraflarınız hazır! Giriş yaparak görüntüleyin ve seçiminizi yapın: pinowed.com/profile | Pinowed`;
    results.sms = await sendSMS(phone, message, settings);
  }

  return results;
}
