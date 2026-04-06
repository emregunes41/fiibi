"use server";
import { Resend } from "resend";

/**
 * Rezervasyon alındı bildirimi — henüz onay DEĞİL, detaylı bilgi e-postası
 */
export async function sendReservationReceivedEmail(email, name, reservationDetails) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY bulunamadı, e-posta gönderilemiyor.");
      return { success: false, error: "API Key missing" };
    }

    const resend = new Resend(apiKey);
    const { date, totalAmount, packages, groomName, bridePhone, eventTime, paymentPreference, notes } = reservationDetails;
    const formattedDate = new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
    const paymentLabel = paymentPreference === "CARD" ? "Kredi Kartı" : "Nakit / Havale";

    const { data, error } = await resend.emails.send({
      from: "Pinowed <hello@pinowed.com>",
      to: [email],
      subject: "Rezervasyonunuz Alındı 📋 - Pinowed",
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <!-- Header -->
          <div style="background: #000; color: #fff; padding: 32px 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.03em;">PINOWED</h1>
            <p style="margin: 8px 0 0; font-size: 13px; opacity: 0.6;">Profesyonel Fotoğrafçılık</p>
          </div>

          <div style="padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; font-size: 20px; margin: 0 0 8px;">Merhaba ${name}!</h2>
            <p style="color: #666; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
              Rezervasyon talebiniz başarıyla alındı. Ekibimiz en kısa sürede sizinle iletişime geçecektir.
              <strong>Kapora ödemesi yapıldıktan sonra</strong> rezervasyonunuz onaylanacaktır.
            </p>
            
            <!-- Reservation Details -->
            <div style="background: #f8f9fb; border-radius: 10px; padding: 24px; margin-bottom: 24px;">
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #999; margin-bottom: 16px;">Rezervasyon Detayları</div>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #888; vertical-align: top;">Gelin</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #222; font-weight: 600; text-align: right;">${name}</td>
                </tr>
                ${groomName ? `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #888; border-top: 1px solid #eee;">Damat</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #222; font-weight: 600; text-align: right; border-top: 1px solid #eee;">${groomName}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #888; border-top: 1px solid #eee;">Telefon</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #222; font-weight: 600; text-align: right; border-top: 1px solid #eee;">${bridePhone}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #888; border-top: 1px solid #eee;">Çekim Tarihi</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #222; font-weight: 600; text-align: right; border-top: 1px solid #eee;">${formattedDate}</td>
                </tr>
                ${eventTime ? `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #888; border-top: 1px solid #eee;">Saat</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #222; font-weight: 600; text-align: right; border-top: 1px solid #eee;">${eventTime}</td>
                </tr>` : ''}
                ${packages ? `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #888; border-top: 1px solid #eee;">Paket(ler)</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #222; font-weight: 600; text-align: right; border-top: 1px solid #eee;">${packages}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #888; border-top: 1px solid #eee;">Ödeme Yöntemi</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #222; font-weight: 600; text-align: right; border-top: 1px solid #eee;">${paymentLabel}</td>
                </tr>
              </table>
              
              <!-- Total -->
              <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 14px; font-weight: 700; color: #666;">Toplam Tutar</span>
                <span style="font-size: 22px; font-weight: 800; color: #000;">${totalAmount} ₺</span>
              </div>
            </div>

            ${notes ? `
            <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 18px; border-radius: 6px; margin-bottom: 24px;">
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #b45309; margin-bottom: 6px;">Notlar</div>
              <p style="margin: 0; font-size: 13px; color: #78350f; line-height: 1.6; white-space: pre-wrap;">${notes}</p>
            </div>` : ''}
            
            <!-- Status Badge -->
            <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 10px; padding: 16px 20px; text-align: center; margin-bottom: 24px;">
              <div style="font-size: 13px; font-weight: 700; color: #92400e;">⏳ Durum: Kapora Bekleniyor</div>
              <div style="font-size: 12px; color: #a16207; margin-top: 6px;">Kapora ödemesi sonrası rezervasyonunuz onaylanacaktır.</div>
            </div>
            
            <div style="text-align: center; margin-top: 24px;">
              <a href="https://www.pinowed.com/profile" style="background-color: #000; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; display: inline-block; font-size: 14px;">Profilime Git</a>
            </div>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">Pinowed — Profesyonel Fotoğrafçılık Çözümleri</p>
              <p style="color: #bbb; font-size: 11px; margin: 6px 0 0;">pinowed.com</p>
            </div>
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

/**
 * Rezervasyon ONAYLANDI bildirimi — kapora ödendikten sonra
 */
export async function sendReservationConfirmedEmail(email, name, date, totalAmount) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return { success: false, error: "API Key missing" };

    const resend = new Resend(apiKey);
    const formattedDate = new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });

    const { data, error } = await resend.emails.send({
      from: "Pinowed <hello@pinowed.com>",
      to: [email],
      subject: "Rezervasyonunuz Onaylandı! ✅📸 - Pinowed",
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: #000; color: #fff; padding: 32px 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 700;">PINOWED</h1>
            <p style="margin: 8px 0 0; font-size: 13px; opacity: 0.6;">Profesyonel Fotoğrafçılık</p>
          </div>
          <div style="padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 10px 10px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="width: 64px; height: 64px; border-radius: 50%; background: #ecfdf5; border: 2px solid #a7f3d0; display: inline-flex; align-items: center; justify-content: center; font-size: 28px;">✅</div>
            </div>
            <h2 style="color: #333; font-size: 22px; margin: 0 0 12px; text-align: center;">Harika haber, ${name}!</h2>
            <p style="color: #555; font-size: 15px; line-height: 1.7; text-align: center; margin: 0 0 24px;">
              Kapora ödemeniz alındı ve rezervasyonunuz <strong style="color: #059669;">resmi olarak onaylandı!</strong>
              Çekim günü sizinle harika anılar biriktirmek için sabırsızlanıyoruz.
            </p>
            
            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
              <div style="font-size: 13px; color: #065f46; font-weight: 600;">📅 Çekim Tarihi</div>
              <div style="font-size: 18px; color: #000; font-weight: 800; margin-top: 6px;">${formattedDate}</div>
            </div>

            <div style="text-align: center; margin-top: 24px;">
              <a href="https://www.pinowed.com/profile" style="background-color: #000; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; display: inline-block; font-size: 14px;">Profilime Git</a>
            </div>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">Pinowed — Profesyonel Fotoğrafçılık Çözümleri</p>
            </div>
          </div>
        </div>
      `
    });

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
