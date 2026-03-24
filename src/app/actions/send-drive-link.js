"use server";
import { Resend } from "resend";

export async function sendDriveLinkEmail(email, name, driveLink) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY bulunamadı, e-posta gönderilemiyor.");
      return { success: false, error: "API Key missing" };
    }

    const resend = new Resend(apiKey);
    
    const { data, error } = await resend.emails.send({
      from: "Pinowed <hello@pinowed.com>",
      to: [email],
      subject: "Teslimat Klasörünüz Hazır! ☁️ - Pinowed",
      html: `
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
            <p style="color: #999; font-size: 12px; margin: 0;">Pinowed - Unutulmaz Anlar İçin</p>
          </div>
        </div>
      `
    });

    if (error) {
      console.error("Resend API error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Send drive link mail error:", err);
    return { success: false, error: err.message };
  }
}
