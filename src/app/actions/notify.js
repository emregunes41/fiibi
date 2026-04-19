"use server";

import { prisma } from "@/lib/prisma";
import { sendReservationReceivedEmail, sendReservationConfirmedEmail } from "./send-reservation-success";
import { sendSMS } from "./send-sms";
import { getCurrentTenant, getTenantUrl } from "@/lib/tenant";
import { PLATFORM } from "@/lib/constants";

/**
 * Bildirim ayarlarını yükle (tenant-aware)
 */
export async function getNotificationSettings() {
  try {
    const tenant = await getCurrentTenant();
    let settings;
    if (tenant) {
      settings = await prisma.globalSettings.findFirst({ where: { tenantId: tenant.id } });
    }
    if (!settings) {
      settings = await prisma.globalSettings.findUnique({ where: { id: "global-settings" } });
    }
    // Tenant bilgisini settings'e ekle
    if (tenant) {
      settings = { ...settings, _tenant: tenant };
    }
    return settings || { emailEnabled: true, smsEnabled: false, notifyReservation: true, notifyPayment: true, notifyReminder: true, notifyPhotosReady: true };
  } catch {
    return { emailEnabled: true, smsEnabled: false, notifyReservation: true, notifyPayment: true, notifyReminder: true, notifyPhotosReady: true };
  }
}

/**
 * E-posta gönderen adresi ve isim (tenant-aware)
 */
function getEmailFrom(settings) {
  const tenant = settings._tenant;
  const businessName = settings.businessName || tenant?.businessName || PLATFORM.name;
  const emailDomain = process.env.EMAIL_DOMAIN || process.env.PLATFORM_DOMAIN || "localhost";
  const slug = tenant?.slug || "noreply";
  return `${businessName} <${slug}@${emailDomain}>`;
}

/**
 * Site URL (tenant-aware)
 */
async function getSiteUrl(settings) {
  const tenant = settings._tenant;
  if (tenant) {
    return await getTenantUrl(tenant);
  }
  return process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:3000";
}

/**
 * Resend API Key — önce DB'den, yoksa .env'den
 */
function getResendApiKey(settings) {
  return settings.resendApiKey || process.env.RESEND_API_KEY || null;
}

/**
 * Genel e-posta gönderme (tenant-aware from adresi)
 */
export async function sendEmailWithResend(settings, to, subject, html) {
  const apiKey = getResendApiKey(settings);
  if (!apiKey) return { success: false, error: "Resend API Key yok" };

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const from = getEmailFrom(settings);
    const { data, error } = await resend.emails.send({
      from,
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
 * E-posta footer helper
 */
function emailFooter(settings, siteUrl) {
  const businessName = settings.businessName || settings._tenant?.businessName || "Studio";
  return `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
      <p style="color: #999; font-size: 12px; margin: 0;">${businessName}</p>
    </div>
  `;
}

/**
 * E-posta header helper
 */
function emailHeader(settings) {
  const businessName = settings.businessName || settings._tenant?.businessName || "Studio";
  return `
    <div style="background: #000; color: #fff; padding: 32px 30px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="margin: 0; font-size: 22px; font-weight: 700;">${businessName.toUpperCase()}</h1>
      <p style="margin: 8px 0 0; font-size: 13px; opacity: 0.6;">Profesyonel Hizmet</p>
    </div>
  `;
}

/**
 * 1a. Rezervasyon ALINDI Bildirimi
 */
export async function notifyReservationReceived(email, phone, name, reservationDetails) {
  const settings = await getNotificationSettings();
  if (!settings.notifyReservation) return { email: null, sms: null };

  const results = { email: null, sms: null };
  const siteUrl = await getSiteUrl(settings);

  if (settings.emailEnabled) {
    results.email = await sendReservationReceivedEmail(email, name, reservationDetails);
  }

  if (settings.smsEnabled && phone) {
    const formattedDate = new Date(reservationDetails.date).toLocaleDateString("tr-TR");
    const businessName = settings.businessName || "Studio";
    const message = `Merhaba ${name}, rezervasyon talebiniz alındı! Tarih: ${formattedDate} | Tutar: ${reservationDetails.totalAmount} TL | ${businessName}`;
    results.sms = await sendSMS(phone, message, settings);
  }

  return results;
}

/**
 * 1b. Rezervasyon ONAYLANDI Bildirimi
 */
export async function notifyReservationConfirmed(email, phone, name, date, totalAmount, meetingLinks = []) {
  const settings = await getNotificationSettings();
  if (!settings.notifyReservation) return { email: null, sms: null };

  const results = { email: null, sms: null };
  const formattedDate = new Date(date).toLocaleDateString("tr-TR");
  const siteUrl = await getSiteUrl(settings);

  if (settings.emailEnabled) {
    results.email = await sendReservationConfirmedEmail(email, name, date, totalAmount, meetingLinks);
  }

  if (settings.smsEnabled && phone) {
    const businessName = settings.businessName || "Studio";
    const message = `Merhaba ${name}, rezervasyonunuz onaylandı! Tarih: ${formattedDate} | ${businessName}`;
    results.sms = await sendSMS(phone, message, settings);
  }

  return results;
}

/**
 * 1c. MANUEL Rezervasyon Oluşturuldu (Sözleşme Onayı Bekliyor)
 */
export async function notifyManualReservationCreated(email, phone, name, date, totalAmount) {
  const settings = await getNotificationSettings();
  if (!settings.notifyReservation) return { email: null, sms: null };

  const results = { email: null, sms: null };
  const formattedDate = new Date(date).toLocaleDateString("tr-TR");
  const siteUrl = await getSiteUrl(settings);
  const businessName = settings.businessName || settings._tenant?.businessName || "Studio";

  if (settings.emailEnabled) {
    const html = `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        ${emailHeader(settings)}
        <div style="padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; font-size: 20px; margin: 0 0 8px;">Merhaba ${name}!</h2>
          <p style="color: #666; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
            Ekibimiz tarafından sizin adınıza yeni bir rezervasyon kaydı oluşturulmuştur.
          </p>

          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 6px; margin-bottom: 24px;">
            <div style="font-size: 13px; font-weight: 700; color: #b45309; margin-bottom: 6px;">⚠️ Sözleşme Onayınız Gerekiyor</div>
            <p style="margin: 0; font-size: 13px; color: #78350f; line-height: 1.6;">
              İşlemlerin resmi olarak başlayabilmesi için müşteri panelinize giriş yaparak <strong>Hizmet Sözleşmesini okumanız ve bu rezervasyonu onaylamanız</strong> gerekmektedir.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 32px;">
            <a href="${siteUrl}/profile" style="background-color: #000; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; display: inline-block; font-size: 14px;">Panele Git & Sözleşmeyi Onayla</a>
          </div>
          
          ${emailFooter(settings, siteUrl)}
        </div>
      </div>
    `;
    results.email = await sendEmailWithResend(settings, email, "Rezervasyonunuz Oluşturuldu - Sözleşme Onayı Gerekli ⚠️", html);
  }

  if (settings.smsEnabled && phone) {
    const message = `Merhaba ${name}, adiniza rezervasyon olusturuldu. Tarih: ${formattedDate}. Lutfen panelinizden Sozlesmenizi onaylayin. ${businessName}`;
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
  const siteUrl = await getSiteUrl(settings);
  const businessName = settings.businessName || "Studio";

  if (settings.emailEnabled && email) {
    results.email = await sendEmailWithResend(settings, email, `Ödemeniz Alındı ✓ - ${businessName}`, `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333;">Merhaba ${name},</h2>
        <p style="color: #555; font-size: 16px;">Ödemeniz başarıyla alındı.</p>
        <div style="background: #f9f9fb; border-left: 4px solid #4ade80; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 8px;"><strong>Ödenen:</strong> ${amount} ₺</p>
          <p style="margin: 0;"><strong>Kalan:</strong> ${remaining} ₺</p>
        </div>
        <a href="${siteUrl}/profile" style="background: #000; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; display: inline-block; margin-top: 10px;">Profilime Git</a>
      </div>
    `);
  }

  if (settings.smsEnabled && phone) {
    const message = `Merhaba ${name}, ${amount} TL ödemeniz alındı. Kalan: ${remaining} TL | ${businessName}`;
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
  const businessName = settings.businessName || "Studio";

  if (settings.emailEnabled && email) {
    results.email = await sendEmailWithResend(settings, email, "Randevunuza 1 Hafta Kaldı! 📅", `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333;">Merhaba ${name}! 🎉</h2>
        <p style="color: #555; font-size: 16px;">Randevunuza sadece <strong>1 hafta</strong> kaldı!</p>
        <div style="background: #f9f9fb; border-left: 4px solid #facc15; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 8px;"><strong>Tarih:</strong> ${formattedDate}</p>
          <p style="margin: 0;"><strong>Hizmet:</strong> ${packageName || "Randevu"}</p>
        </div>
        <p style="color: #555;">Hazırlıklarınızı tamamladığınızdan emin olun. Sorularınız için bize ulaşabilirsiniz.</p>
      </div>
    `);
  }

  if (settings.smsEnabled && phone) {
    const message = `Merhaba ${name}, randevunuza 1 hafta kaldi! Tarih: ${formattedDate} | Hazirliklarinizi tamamlayin. ${businessName}`;
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
  const siteUrl = await getSiteUrl(settings);

  if (settings.emailEnabled && email) {
    results.email = await sendEmailWithResend(settings, email, "Dosyalarınız Hazır! ✨", `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333;">Merhaba ${name}! 🎉</h2>
        <p style="color: #555; font-size: 16px;">Dosyalarınız hazır ve panelinize yüklendi!</p>
        <p style="color: #555;">Hemen giriş yaparak dosyalarınızı görüntüleyebilirsiniz.</p>
        <a href="${siteUrl}/profile" style="background: #000; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 6px; display: inline-block; margin-top: 16px; font-weight: bold;">Dosyalarımı Gör</a>
      </div>
    `);
  }

  if (settings.smsEnabled && phone) {
    const businessName = settings.businessName || "Studio";
    const message = `Merhaba ${name}, dosyalariniz hazir! Giris yaparak goruntuleyin. ${businessName}`;
    results.sms = await sendSMS(phone, message, settings);
  }

  return results;
}
