"use server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import bcrypt from "bcryptjs";

async function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
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

    const resend = await getResendClient();
    if (!resend) return { success: false, error: "RESEND_API_KEY eksik" };

    const packageNames = reservation.packages.map(p => p.name).join(", ") || "Çekim Paketi";
    const eventDate = new Date(reservation.eventDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

    const { error } = await resend.emails.send({
      from: "Pinowed <hello@pinowed.com>",
      to: [reservation.brideEmail],
      subject: "Pinowed - Sözleşme Onayı Hatırlatması",
      html: `
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
            <p style="margin: 0 0 10px 0; font-size: 15px;"><strong>Giriş Linki:</strong> <a href="https://www.pinowed.com/login" style="color: #000;">www.pinowed.com/login</a></p>
            <p style="margin: 0; font-size: 15px;"><strong>E-posta:</strong> ${reservation.brideEmail}</p>
          </div>
          <p style="color: #999; font-size: 13px; margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee;">
            Bu e-posta Pinowed yönetim panelinden gönderilmiştir.
          </p>
        </div>
      `
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
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

    // Yeni şifre oluştur
    const newPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if (!user) {
      // Kullanıcı yoksa otomatik oluştur
      user = await prisma.user.create({
        data: {
          name: reservation.brideName,
          email: reservation.brideEmail,
          phone: reservation.bridePhone,
          password: hashedPassword,
          role: "MEMBER"
        }
      });
      // Rezervasyonu bu kullanıcıya bağla
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

    const resend = await getResendClient();
    if (!resend) return { success: false, error: "RESEND_API_KEY eksik" };

    const { error } = await resend.emails.send({
      from: "Pinowed <hello@pinowed.com>",
      to: [reservation.brideEmail],
      subject: "Pinowed - Giriş Bilgileriniz",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #eee;">
          <h2 style="color: #333; font-size: 22px; margin-bottom: 20px;">Giriş Bilgileriniz</h2>
          <p style="color: #555; font-size: 15px; line-height: 1.7;">
            Merhaba <strong>${reservation.brideName}</strong>,
          </p>
          <p style="color: #555; font-size: 15px; line-height: 1.7;">
            Müşteri panelinize giriş yapabilmeniz için bilgileriniz aşağıdadır. Lütfen bu bilgileri kullanarak sisteme giriş yapın.
          </p>
          <div style="background-color: #f9f9fb; border-left: 4px solid #000; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 10px 0; font-size: 15px;"><strong>Giriş Linki:</strong> <a href="https://www.pinowed.com/login" style="color: #000;">www.pinowed.com/login</a></p>
            <p style="margin: 0 0 10px 0; font-size: 15px;"><strong>E-posta:</strong> ${reservation.brideEmail}</p>
            <p style="margin: 0; font-size: 15px;"><strong>Yeni Şifre:</strong> <span style="font-family: monospace; background: #e5e7eb; padding: 2px 8px;">${newPassword}</span></p>
          </div>
          <p style="color: #777; font-size: 14px;">
            Not: Güvenliğiniz için sisteme giriş yaptıktan sonra profil sayfanızdan şifrenizi güncellemenizi öneririz.
          </p>
          <p style="color: #999; font-size: 13px; margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee;">
            Bu e-posta Pinowed yönetim panelinden gönderilmiştir.
          </p>
        </div>
      `
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    console.error("Resend credentials error:", err);
    return { success: false, error: err.message };
  }
}
