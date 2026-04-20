"use server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getNotificationSettings, sendEmailWithResend } from "../actions/notify";

async function getEmailContext() {
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

// Sözleşme Onay Hatırlatması
export async function sendContractReminder(reservationId) {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { packages: true }
    });
    if (!reservation) return { success: false, error: "Rezervasyon bulunamadı" };
    if (!reservation.brideEmail) return { success: false, error: "E-posta adresi yok" };
    if (reservation.contractApproved) return { success: false, error: "Sözleşme zaten onaylanmış" };

    const { settings, businessName, siteUrl } = await getEmailContext();

    const packageNames = reservation.packages.map(p => p.name).join(", ") || "Çekim Paketi";
    const eventDate = new Date(reservation.eventDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #eee;">
        <h2 style="color: #333; font-size: 22px; margin-bottom: 20px;">Sözleşme Onayı Bekleniyor</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7;">
          Merhaba <strong>${reservation.brideName}</strong>,
        </p>
        <p style="color: #555; font-size: 15px; line-height: 1.7;">
          <strong>${eventDate}</strong> tarihli <strong>${packageNames}</strong> rezervasyonunuz için sözleşme onayınızı henüz almadık.
        </p>
        <p style="color: #555; font-size: 15px; line-height: 1.7;">
          Çekim sürecinin başlayabilmesi için lütfen müşteri panelinize giriş yaparak sözleşmenizi onaylayın.
        </p>
        <div style="background-color: #f9f9fb; border-left: 4px solid #000; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 10px 0; font-size: 15px;"><strong>Giriş Linki:</strong> <a href="${siteUrl}/login" style="color: #000;">${siteUrl}/login</a></p>
          <p style="margin: 0; font-size: 15px;"><strong>E-posta:</strong> ${reservation.brideEmail}</p>
        </div>
        <p style="color: #999; font-size: 13px; margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee;">
          Bu e-posta ${businessName} tarafından gönderilmiştir.
        </p>
      </div>
    `;

    return await sendEmailWithResend(settings, reservation.brideEmail, `${businessName} - Sözleşme Onayı Hatırlatması`, html);
  } catch (err) {
    console.error("Contract reminder error:", err);
    return { success: false, error: err.message };
  }
}

// Giriş Bilgileri Yeniden Gönderme (yeni şifre oluşturur)
export async function resendCredentials(reservationId) {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId }
    });
    if (!reservation) return { success: false, error: "Rezervasyon bulunamadı" };
    if (!reservation.brideEmail) return { success: false, error: "E-posta adresi yok" };

    let user = await prisma.user.findUnique({
      where: { email: reservation.brideEmail }
    });

    const newPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: reservation.brideName,
          email: reservation.brideEmail,
          phone: reservation.bridePhone,
          password: hashedPassword,
          role: "MEMBER",
          tenantId: reservation.tenantId,
        }
      });
      await prisma.reservation.update({
        where: { id: reservationId },
        data: { userId: user.id }
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });
    }

    const { settings, businessName, siteUrl } = await getEmailContext();

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #eee;">
        <h2 style="color: #333; font-size: 22px; margin-bottom: 20px;">Giriş Bilgileriniz</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7;">
          Merhaba <strong>${reservation.brideName}</strong>,
        </p>
        <p style="color: #555; font-size: 15px; line-height: 1.7;">
          Müşteri panelinize giriş yapabilmeniz için bilgileriniz aşağıdadır.
        </p>
        <div style="background-color: #f9f9fb; border-left: 4px solid #000; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 10px 0; font-size: 15px;"><strong>Giriş Linki:</strong> <a href="${siteUrl}/login" style="color: #000;">${siteUrl}/login</a></p>
          <p style="margin: 0 0 10px 0; font-size: 15px;"><strong>E-posta:</strong> ${reservation.brideEmail}</p>
          <p style="margin: 0; font-size: 15px;"><strong>Yeni Şifre:</strong> <span style="font-family: monospace; background: #e5e7eb; padding: 2px 8px;">${newPassword}</span></p>
        </div>
        <p style="color: #777; font-size: 14px;">
          Not: Güvenliğiniz için sisteme giriş yaptıktan sonra profil sayfanızdan şifrenizi güncellemenizi öneririz.
        </p>
        <p style="color: #999; font-size: 13px; margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee;">
          Bu e-posta ${businessName} tarafından gönderilmiştir.
        </p>
      </div>
    `;

    return await sendEmailWithResend(settings, reservation.brideEmail, `${businessName} - Giriş Bilgileriniz`, html);
  } catch (err) {
    console.error("Resend credentials error:", err);
    return { success: false, error: err.message };
  }
}
