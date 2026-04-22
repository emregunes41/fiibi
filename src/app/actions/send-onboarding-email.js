"use server";

import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM || "Fiibi <noreply@fiibi.co>";
const DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "fiibi.co";

/**
 * Kayıt sonrası rehber e-postası gönder
 * Admin panelini nasıl kullanacağını adım adım anlatan hoş geldin maili
 */
export async function sendOnboardingEmail({ ownerName, ownerEmail, businessName, slug }) {
  if (!resend) {
    console.log("[onboarding] Resend API Key yok, e-posta gönderilemedi.");
    return { success: false, error: "Resend API Key yok" };
  }

  const panelUrl = `https://${slug}.${DOMAIN}/admin`;
  const siteUrl = `https://${slug}.${DOMAIN}`;

  const html = `
  <div style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%); padding: 48px 40px; text-align: center;">
      <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
        Hoş Geldiniz! 🎉
      </h1>
      <p style="margin: 0; font-size: 15px; color: rgba(255,255,255,0.6);">
        ${businessName} paneli kullanıma hazır
      </p>
    </div>

    <!-- Body -->
    <div style="padding: 40px 40px 20px;">
      <p style="font-size: 16px; color: #333; line-height: 1.7; margin: 0 0 24px;">
        Merhaba <strong>${ownerName}</strong>,
      </p>
      <p style="font-size: 15px; color: #555; line-height: 1.7; margin: 0 0 32px;">
        <strong>${businessName}</strong> hesabınız başarıyla oluşturuldu! 7 günlük ücretsiz deneme süreniz başladı. 
        Aşağıdaki adımları takip ederek paneli hızlıca kurabilirsiniz.
      </p>

      <!-- Step 1 -->
      <div style="display: flex; gap: 16px; margin-bottom: 28px; align-items: flex-start;">
        <div style="min-width: 36px; height: 36px; background: #f0f0ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #6366f1; font-size: 14px;">1</div>
        <div>
          <h3 style="margin: 0 0 4px; font-size: 15px; font-weight: 700; color: #111;">⚙️ Sistem Ayarları</h3>
          <p style="margin: 0; font-size: 13px; color: #666; line-height: 1.6;">
            <strong>Sistem</strong> menüsünden firma bilgilerinizi, logonuzu, iletişim bilgilerinizi ve çalışma saatlerinizi girin.
            Site renk temasını ve yazı tipini de buradan özelleştirebilirsiniz.
          </p>
        </div>
      </div>

      <!-- Step 2 -->
      <div style="display: flex; gap: 16px; margin-bottom: 28px; align-items: flex-start;">
        <div style="min-width: 36px; height: 36px; background: #fff7ed; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #f59e0b; font-size: 14px;">2</div>
        <div>
          <h3 style="margin: 0 0 4px; font-size: 15px; font-weight: 700; color: #111;">📦 Hizmet & Paket Ekle</h3>
          <p style="margin: 0; font-size: 13px; color: #666; line-height: 1.6;">
            <strong>Hizmet & Katalog</strong> menüsüne gidin. Müşterilerinize sunduğunuz hizmetleri ve fiyatlarını ekleyin.
            Her hizmet için süre, fiyat ve açıklama girebilirsiniz.
          </p>
        </div>
      </div>

      <!-- Step 3 -->
      <div style="display: flex; gap: 16px; margin-bottom: 28px; align-items: flex-start;">
        <div style="min-width: 36px; height: 36px; background: #f0fdf4; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #22c55e; font-size: 14px;">3</div>
        <div>
          <h3 style="margin: 0 0 4px; font-size: 15px; font-weight: 700; color: #111;">📅 Müsaitlik & Çalışma Saatleri</h3>
          <p style="margin: 0; font-size: 13px; color: #666; line-height: 1.6;">
            <strong>Sistem → Genel Ayarlar</strong> bölümünden haftalık çalışma saatlerinizi belirleyin. 
            Müşterileriniz sadece açık olduğunuz saatlerde randevu alabilecek.
          </p>
        </div>
      </div>

      <!-- Step 4 -->
      <div style="display: flex; gap: 16px; margin-bottom: 28px; align-items: flex-start;">
        <div style="min-width: 36px; height: 36px; background: #fdf2f8; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #ec4899; font-size: 14px;">4</div>
        <div>
          <h3 style="margin: 0 0 4px; font-size: 15px; font-weight: 700; color: #111;">📋 Sözleşmeleri Düzenle</h3>
          <p style="margin: 0; font-size: 13px; color: #666; line-height: 1.6;">
            <strong>Sistem → Sözleşmeler</strong> bölümünde mesafeli satış sözleşmesi, KVKK aydınlatma metni gibi 
            yasal belgelerin hazır taslakları sizi bekliyor. Firma bilgilerinize göre düzenleyin.
          </p>
        </div>
      </div>

      <!-- Step 5 -->
      <div style="display: flex; gap: 16px; margin-bottom: 28px; align-items: flex-start;">
        <div style="min-width: 36px; height: 36px; background: #eff6ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #3b82f6; font-size: 14px;">5</div>
        <div>
          <h3 style="margin: 0 0 4px; font-size: 15px; font-weight: 700; color: #111;">🌐 Sitenizi Paylaşın</h3>
          <p style="margin: 0; font-size: 13px; color: #666; line-height: 1.6;">
            Tebrikler! Artık her şey hazır. Müşterilerinize aşağıdaki linki paylaşarak 
            online randevu ve sipariş almaya başlayabilirsiniz.
          </p>
        </div>
      </div>

      <!-- Site Link Box -->
      <div style="background: #f8f9fa; border: 2px dashed #ddd; padding: 20px; text-align: center; margin: 8px 0 32px;">
        <p style="margin: 0 0 4px; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Sitenizin Adresi</p>
        <a href="${siteUrl}" style="font-size: 18px; font-weight: 700; color: #111; text-decoration: none;">
          ${slug}.${DOMAIN}
        </a>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0 16px;">
        <a href="${panelUrl}" 
           style="display: inline-block; background: #000; color: #fff; padding: 16px 40px; text-decoration: none; font-weight: 700; font-size: 15px; letter-spacing: -0.01em;">
          Panelime Git →
        </a>
      </div>

      <!-- Modules Info -->
      <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px 20px; margin: 24px 0;">
        <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.6;">
          <strong>💡 İpucu:</strong> Sistem → Modüller bölümünden Mağaza, Rezervasyon ve Etkinlik özelliklerini 
          ihtiyaçlarınıza göre açıp kapatabilirsiniz.
        </p>
      </div>

      <!-- Help -->
      <div style="text-align: center; padding: 24px 0 8px; border-top: 1px solid #eee; margin-top: 32px;">
        <p style="margin: 0 0 4px; font-size: 13px; color: #999;">Bir sorunuz mu var?</p>
        <p style="margin: 0; font-size: 13px; color: #666;">
          <a href="mailto:destek@fiibi.co" style="color: #6366f1; text-decoration: none; font-weight: 600;">destek@fiibi.co</a> adresinden bize yazabilirsiniz.
        </p>
      </div>

    </div>

    <!-- Footer -->
    <div style="padding: 20px 40px 32px; text-align: center;">
      <p style="margin: 0; font-size: 11px; color: #bbb;">
        Bu e-posta ${businessName} hesabınız oluşturulduğu için gönderilmiştir.<br>
        © ${new Date().getFullYear()} Fiibi — Profesyonel CRM Platformu
      </p>
    </div>

  </div>
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to: ownerEmail,
      subject: `${businessName} — Paneliniz Hazır! İlk Adımlar 🚀`,
      html,
    });
    console.log(`[onboarding] Rehber e-postası gönderildi → ${ownerEmail}`);
    return { success: true };
  } catch (err) {
    console.error("[onboarding] E-posta gönderilemedi:", err.message);
    return { success: false, error: err.message };
  }
}
