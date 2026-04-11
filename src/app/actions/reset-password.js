"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Resend } from "resend";

function generatePassword(length = 8) {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function resetPassword(email) {
  try {
    if (!email || !email.includes("@")) {
      return { error: "Geçerli bir e-posta adresi girin." };
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      // Don't reveal if email exists or not for security
      return { success: true };
    }

    const newPassword = generatePassword(10);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Send email with new password
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: "Pinowed <hello@pinowed.com>",
        to: [email],
        subject: "Pinowed - Yeni Şifreniz",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #eee;">
            <h2 style="color: #333; font-size: 22px;">Şifre Sıfırlama</h2>
            <p style="color: #555; font-size: 15px; line-height: 1.6;">
              Merhaba ${user.name || ""},<br><br>
              Şifre sıfırlama talebiniz alındı. Yeni şifreniz aşağıdadır:
            </p>
            <div style="background-color: #f5f5f5; border-left: 4px solid #000; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>E-posta:</strong> ${email}</p>
              <p style="margin: 0; font-size: 14px;"><strong>Yeni Şifre:</strong> <span style="font-family: monospace; background: #e5e7eb; padding: 2px 8px;">${newPassword}</span></p>
            </div>
            <p style="color: #888; font-size: 13px;">
              Giriş yaptıktan sonra şifrenizi Ayarlar sayfasından değiştirebilirsiniz.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #aaa; font-size: 11px; text-align: center;">Pinowed Photography</p>
          </div>
        `,
      });
    }

    return { success: true };
  } catch (err) {
    console.error("Password reset error:", err);
    return { error: "Bir hata oluştu. Lütfen tekrar deneyin." };
  }
}
