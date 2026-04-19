"use server";
import { Resend } from "resend";
import { getNotificationSettings, sendEmailWithResend } from "./notify";

export async function sendWelcomeEmail(email, name, password) {
  try {
    const settings = await getNotificationSettings();
    const businessName = settings.businessName || settings._tenant?.businessName || "Studio";
    const tenant = settings._tenant;
    const domain = process.env.PLATFORM_DOMAIN || "localhost:3000";
    const protocol = domain.includes("localhost") ? "http" : "https";
    const siteUrl = tenant?.customDomain
      ? `https://${tenant.customDomain}`
      : tenant?.slug
        ? `${protocol}://${tenant.slug}.${domain}`
        : `${protocol}://${domain}`;

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333; font-size: 24px;">Merhaba ${name},</h2>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Rezervasyonunuz başarıyla alındı ve sürecinizi takip edebilmeniz için size özel bir müşteri paneli oluşturuldu.
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Sisteme giriş yaparak randevunuzun hangi aşamada olduğunu görebilirsiniz.
        </p>
        
        <div style="background-color: #f9f9fb; border-left: 4px solid #000; padding: 20px; margin: 30px 0;">
          <p style="margin: 0 0 10px 0; font-size: 15px;"><strong>Giriş Linki:</strong> <a href="${siteUrl}/login" style="color: #000;">${siteUrl}/login</a></p>
          <p style="margin: 0 0 10px 0; font-size: 15px;"><strong>E-posta:</strong> ${email}</p>
          <p style="margin: 0; font-size: 15px;"><strong>Geçici Şifre:</strong> <span style="font-family: monospace; background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${password}</span></p>
        </div>
        
        <p style="color: #777; font-size: 14px;">
          Not: Güvenliğiniz için sisteme giriş yaptıktan sonra profil sayfanızdan şifrenizi güncellemenizi öneririz.
        </p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px; margin: 0;">Bu e-posta ${businessName} tarafından otomatik olarak gönderilmiştir.</p>
        </div>
      </div>
    `;

    return await sendEmailWithResend(settings, email, `${businessName} - Müşteri Hesabınız Oluşturuldu`, html);
  } catch (err) {
    console.error("Send mail catch error:", err);
    return { success: false, error: err.message };
  }
}
