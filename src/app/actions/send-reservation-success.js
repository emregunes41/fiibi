"use server";
import { Resend } from "resend";

export async function sendReservationSuccessEmail(email, name, date, totalAmount) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY bulunamadı, e-posta gönderilemiyor.");
      return { success: false, error: "API Key missing" };
    }

    const resend = new Resend(apiKey);
    const formattedDate = new Date(date).toLocaleDateString('tr-TR');
    
    const { data, error } = await resend.emails.send({
      from: "Pinowed <hello@pinowed.com>",
      to: [email],
      subject: "Rezervasyonunuz Onaylandı! 📸 - Pinowed",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333; font-size: 24px;">Harika haber, ${name}!</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Rezervasyonunuz başarıyla oluşturuldu ve onaylandı. Çekim günü sizinle harika anılar biriktirmek için heyecanlıyız!
          </p>
          
          <div style="background-color: #f9f9fb; border-left: 4px solid #000; padding: 20px; margin: 30px 0;">
            <p style="margin: 0 0 10px 0; font-size: 15px;"><strong>Çekim Tarihi:</strong> ${formattedDate}</p>
            <p style="margin: 0; font-size: 15px;"><strong>Toplam Tutar:</strong> ${totalAmount} TL</p>
          </div>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Dosyalarınızı ve süreci takip etmek için dilediğiniz zaman müşteri panelinize giriş yapabilirsiniz.
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://www.pinowed.com/profile" style="background-color: #000; color: #fff; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-weight: bold; display: inline-block;">Profilime Git</a>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; margin: 0;">Pinowed - Profesyonel Fotoğrafçılık Çözümleri</p>
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
    console.error("Send reservation mail error:", err);
    return { success: false, error: err.message };
  }
}
