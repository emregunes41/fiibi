"use server";
import { getNotificationSettings, sendEmailWithResend } from "./notify";

export async function sendDriveLinkEmail(email, name, driveLink) {
  try {
    const settings = await getNotificationSettings();
    const businessName = settings.businessName || settings._tenant?.businessName || "Studio";

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333; font-size: 24px;">Merhaba ${name},</h2>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Gözünüz aydın! Fotoğraflarınızın/videolarınızın dijital teslimat klasörü hazırlandı ve Google Drive üzerinden erişime açıldı.
        </p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${driveLink}" style="background-color: #000; color: #fff; text-decoration: none; padding: 15px 30px; border-radius: 10px; font-weight: bold; font-size: 16px; display: inline-block;">Klasöre Git ve İndir</a>
        </div>
        
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Bu linke ayrıca dilediğiniz zaman kendi profilinizden "Teslimat Klasörü" butonuna tıklayarak da ulaşabilirsiniz.
        </p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px; margin: 0;">${businessName} — Profesyonel Fotoğrafçılık</p>
        </div>
      </div>
    `;

    return await sendEmailWithResend(settings, email, `Teslimat Klasörünüz Hazır! ☁️ - ${businessName}`, html);
  } catch (err) {
    console.error("Send drive link mail error:", err);
    return { success: false, error: err.message };
  }
}
