"use server";

import { Resend } from "resend";

export async function sendGalleryReadyEmail(email, name, galleryUrl) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY bulunamadı, e-posta gönderilemiyor.");
      return { success: false, error: "API Key missing" };
    }

    const resend = new Resend(apiKey);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #000; letter-spacing: -1px;">PINOWED</h1>
          <p style="color: #666; font-size: 14px;">Profesyonel Fotoğrafçılık Çözümleri</p>
        </div>
        
        <h2 style="color: #000;">Harika Haberler, ${name}! 🎉</h2>
        <p style="font-size: 16px; line-height: 1.6;">
          Çekimlerinize ait fotoğraflar sisteme yüklendi ve harika görünüyorlar!<br><br>
          Albüme gidecek fotoğraflara karar vermek için aşağıdaki butona tıklayarak galerinize giriş yapabilir ve seçiminizi bize doğrudan iletebilirsiniz.
        </p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${galleryUrl}" style="background-color: #000; color: #fff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
            Fotoğrafları İncele ve Seç
          </a>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin-top: 30px;">
          <p style="margin: 0; font-size: 14px; color: #666;">
            <strong>Bilgi:</strong> Seçimlerinizi tamamladıktan sonra sistem bize otomatik olarak bildirim gönderecektir.
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">
          Bu e-posta otomatik olarak oluşturulmuştur. Lütfen bu adrese doğrudan yanıt vermeyiniz.
        </p>
      </div>
    `;

    const data = await resend.emails.send({
      from: "Pinowed CRM <hello@pinowed.com>", 
      to: email, 
      subject: "Fotoğraflarınız Seçim İçin Hazır! 📸 - Pinowed",
      html: htmlContent,
    });

    return { success: true, data };
  } catch (error) {
    console.error("Gallery Ready Email Error:", error);
    return { success: false, error: error.message };
  }
}
