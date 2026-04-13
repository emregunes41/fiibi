"use server";

import { getNotificationSettings, sendEmailWithResend } from "./notify";

const ADMIN_EMAIL_FALLBACK = "noreply@studio.com";

async function getAdminEmail() {
  const settings = await getNotificationSettings();
  return settings.email || settings._tenant?.ownerEmail || ADMIN_EMAIL_FALLBACK;
}

async function getAdminContext() {
  const settings = await getNotificationSettings();
  const tenant = settings._tenant;
  const businessName = settings.businessName || tenant?.businessName || "Studio";
  const domain = process.env.PLATFORM_DOMAIN || "localhost:3000";
  const protocol = domain.includes("localhost") ? "http" : "https";
  const siteUrl = tenant?.customDomain
    ? `https://${tenant.customDomain}`
    : tenant?.slug
      ? `${protocol}://${tenant.slug}.${domain}`
      : `${protocol}://${domain}`;
  return { settings, businessName, siteUrl };
}

const emailWrapper = async (title, content) => {
  const { businessName, siteUrl } = await getAdminContext();
  return `
<div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="background: #000; color: #fff; padding: 24px 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="margin: 0; font-size: 18px; font-weight: 700; letter-spacing: 1px;">${businessName.toUpperCase()} <span style="opacity:0.4;font-weight:400;">CRM</span></h1>
    <p style="margin: 6px 0 0; font-size: 12px; opacity: 0.5;">Admin Bildirim Sistemi</p>
  </div>
  <div style="padding: 28px 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; font-size: 18px; margin: 0 0 16px;">${title}</h2>
    ${content}
    <div style="margin-top: 32px; text-align: center;">
      <a href="${siteUrl}/admin/reservations" style="background-color: #000; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; display: inline-block; font-size: 13px;">Admin Panele Git</a>
    </div>
    <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; text-align: center;">
      <p style="color: #bbb; font-size: 11px; margin: 0;">Bu bir otomatik bildirimdir · ${businessName}</p>
    </div>
  </div>
</div>`;
};

const infoRow = (label, value) => `
<tr>
  <td style="padding: 6px 0; color: #999; font-size: 13px; width: 130px;">${label}</td>
  <td style="padding: 6px 0; color: #333; font-size: 13px; font-weight: 600;">${value || '—'}</td>
</tr>`;

/**
 * 🔔 Yeni Rezervasyon Oluşturuldu (müşteri tarafından)
 */
export async function notifyAdminNewReservation(reservation) {
  try {
    const settings = await getNotificationSettings();
    if (!settings.notifyReservation) return;

    const content = `
      <p style="color: #555; font-size: 14px; line-height: 1.6;">Yeni bir rezervasyon talebi alındı!</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        ${infoRow("👰 Gelin", reservation.brideName)}
        ${infoRow("🤵 Damat", reservation.groomName)}
        ${infoRow("📞 Telefon", reservation.bridePhone)}
        ${infoRow("📧 E-posta", reservation.brideEmail)}
        ${infoRow("📅 Etkinlik", new Date(reservation.eventDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }))}
        ${infoRow("💰 Tutar", reservation.totalAmount + ' TL')}
        ${infoRow("📦 Paketler", reservation.packageNames || '—')}
      </table>
    `;

    await sendEmailWithResend(settings, await getAdminEmail(), "📋 Yeni Rezervasyon Talebi!", await emailWrapper("Yeni Rezervasyon Talebi", content));
  } catch (err) {
    console.error("Admin notification error (new reservation):", err);
  }
}

/**
 * 💵 Ödeme Alındı
 */
export async function notifyAdminPaymentReceived({ brideName, bridePhone, amount, method, totalAmount, totalPaid, remaining }) {
  try {
    const settings = await getNotificationSettings();
    if (!settings.notifyPayment) return;

    const methodLabels = { CASH: "Nakit", BANK_TRANSFER: "Havale/EFT", CREDIT_CARD: "Kredi Kartı", ONLINE: "Online (PayTR)" };
    const content = `
      <p style="color: #555; font-size: 14px; line-height: 1.6;">Yeni bir ödeme alındı.</p>
      <div style="background: #f0fdf4; border-left: 4px solid #4ade80; padding: 16px 20px; border-radius: 6px; margin: 16px 0;">
        <div style="font-size: 24px; font-weight: 800; color: #166534;">+${amount.toLocaleString('tr-TR')}₺</div>
        <div style="font-size: 12px; color: #15803d; margin-top: 4px;">${methodLabels[method] || method} ödemesi</div>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        ${infoRow("👤 Müşteri", brideName)}
        ${infoRow("📞 Telefon", bridePhone)}
        ${infoRow("💰 Toplam", totalAmount.toLocaleString('tr-TR') + '₺')}
        ${infoRow("✅ Ödenen", totalPaid.toLocaleString('tr-TR') + '₺')}
        ${infoRow("⏳ Kalan", remaining.toLocaleString('tr-TR') + '₺')}
      </table>
      ${remaining <= 0 ? '<div style="background:#f0fdf4;padding:12px;border-radius:8px;text-align:center;font-weight:700;color:#166534;font-size:14px;">🎉 Ödeme tam olarak tamamlandı!</div>' : ''}
    `;

    const emoji = remaining <= 0 ? "🎉" : "💵";
    await sendEmailWithResend(settings, await getAdminEmail(), `${emoji} Ödeme Alındı: ${brideName} (+${amount.toLocaleString('tr-TR')}₺)`, await emailWrapper("Ödeme Bilgisi", content));
  } catch (err) {
    console.error("Admin notification error (payment):", err);
  }
}

/**
 * 📝 Sözleşme Onaylandı
 */
export async function notifyAdminContractApproved({ brideName, bridePhone, brideEmail, eventDate }) {
  try {
    const settings = await getNotificationSettings();
    const content = `
      <p style="color: #555; font-size: 14px; line-height: 1.6;">Müşteri hizmet sözleşmesini onayladı! ✅</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        ${infoRow("👤 Müşteri", brideName)}
        ${infoRow("📞 Telefon", bridePhone)}
        ${infoRow("📧 E-posta", brideEmail)}
        ${infoRow("📅 Etkinlik", eventDate ? new Date(eventDate).toLocaleDateString('tr-TR') : '—')}
        ${infoRow("📋 Durum", "Sözleşme Onaylandı ✅")}
      </table>
    `;
    await sendEmailWithResend(settings, await getAdminEmail(), `📝 Sözleşme Onaylandı: ${brideName}`, await emailWrapper("Sözleşme Onayı", content));
  } catch (err) {
    console.error("Admin notification error (contract):", err);
  }
}

/**
 * 📷 Fotoğraf Seçimi Yapıldı
 */
export async function notifyAdminPhotoSelectionSubmitted({ brideName, bridePhone, selectedCount, reservationId }) {
  try {
    const settings = await getNotificationSettings();
    const content = `
      <p style="color: #555; font-size: 14px; line-height: 1.6;">Müşteri fotoğraf seçimini tamamladı!</p>
      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px 20px; border-radius: 6px; margin: 16px 0;">
        <div style="font-size: 20px; font-weight: 800; color: #1e40af;">${selectedCount} fotoğraf seçildi</div>
        <div style="font-size: 12px; color: #1d4ed8; margin-top: 4px;">Seçimleri inceleyip kilitlemeyi unutmayın</div>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        ${infoRow("👤 Müşteri", brideName)}
        ${infoRow("📞 Telefon", bridePhone)}
      </table>
    `;
    await sendEmailWithResend(settings, await getAdminEmail(), `📷 Fotoğraf Seçimi: ${brideName} (${selectedCount} fotoğraf)`, await emailWrapper("Fotoğraf Seçimi Tamamlandı", content));
  } catch (err) {
    console.error("Admin notification error (photo selection):", err);
  }
}

/**
 * 📒 Albüm Modeli Seçildi
 */
export async function notifyAdminAlbumSelected({ brideName, bridePhone, modelName }) {
  try {
    const settings = await getNotificationSettings();
    const content = `
      <p style="color: #555; font-size: 14px; line-height: 1.6;">Müşteri albüm modelini seçti.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        ${infoRow("👤 Müşteri", brideName)}
        ${infoRow("📞 Telefon", bridePhone)}
        ${infoRow("📒 Albüm", modelName)}
      </table>
    `;
    await sendEmailWithResend(settings, await getAdminEmail(), `📒 Albüm Seçimi: ${brideName} → ${modelName}`, await emailWrapper("Albüm Modeli Seçildi", content));
  } catch (err) {
    console.error("Admin notification error (album):", err);
  }
}

/**
 * 💳 Ödeme Tercihi Değiştirildi (kart/nakit geçişi)
 */
export async function notifyAdminPaymentPreferenceChanged({ brideName, bridePhone, newPreference, totalAmount }) {
  try {
    const settings = await getNotificationSettings();
    const isCard = newPreference === "CREDIT_CARD";
    const content = `
      <p style="color: #555; font-size: 14px; line-height: 1.6;">Müşteri ödeme tercihini değiştirdi.</p>
      <div style="background: ${isCard ? '#fef3c7' : '#f0fdf4'}; border-left: 4px solid ${isCard ? '#f59e0b' : '#4ade80'}; padding: 16px 20px; border-radius: 6px; margin: 16px 0;">
        <div style="font-size: 16px; font-weight: 700; color: ${isCard ? '#92400e' : '#166534'};">
          ${isCard ? '💳 Kredi Kartına Geçildi (+%15)' : '💵 Nakit Ödemeye Dönüldü'}
        </div>
        <div style="font-size: 13px; color: ${isCard ? '#a16207' : '#15803d'}; margin-top: 4px;">Yeni Tutar: ${totalAmount}</div>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        ${infoRow("👤 Müşteri", brideName)}
        ${infoRow("📞 Telefon", bridePhone)}
      </table>
      ${!isCard ? '<p style="color:#666;font-size:13px;">Müşteriye IBAN bilgilerinizi iletmek için WhatsApp üzerinden iletişime geçebilirsiniz.</p>' : ''}
    `;
    await sendEmailWithResend(settings, await getAdminEmail(), `${isCard ? '💳' : '💵'} ${brideName}: ${isCard ? 'Karta Geçiş' : 'Nakite Dönüş'}`, await emailWrapper("Ödeme Tercihi Değişikliği", content));
  } catch (err) {
    console.error("Admin notification error (preference change):", err);
  }
}
