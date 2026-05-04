"use server";

import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM || "Fiibi <noreply@fiibi.co>";

/**
 * 6 haneli rastgele OTP kodu üretir
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * E-posta adresine doğrulama kodu gönderir
 */
export async function sendVerificationCode(email, name) {
  try {
    if (!email) return { error: "E-posta adresi gereklidir." };

    // Var olan kodu sil veya güncellemek yerine yenisini oluşturacağız
    // Prisma upsert kullanabiliriz
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 dakika geçerli

    await prisma.verificationCode.upsert({
      where: { email: email.toLowerCase() },
      update: { code, expiresAt },
      create: { email: email.toLowerCase(), code, expiresAt }
    });

    if (!resend) {
      console.log(`[verification] Resend API Key yok. Kod: ${code}`);
      return { success: true, message: "Geliştirme modu: Kod konsola yazdırıldı." };
    }

    const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Hesap Doğrulama</h2>
      <p>Merhaba ${name || ''},</p>
      <p>Fiibi'ye kayıt olmak için doğrulama kodunuz:</p>
      <div style="background: #f4f4f5; padding: 16px; font-size: 24px; font-weight: bold; letter-spacing: 5px; text-align: center; border-radius: 8px; margin: 24px 0;">
        ${code}
      </div>
      <p style="color: #666; font-size: 14px;">Bu kod 10 dakika boyunca geçerlidir.</p>
    </div>
    `;

    await resend.emails.send({
      from: FROM,
      to: email.toLowerCase(),
      subject: "Fiibi Doğrulama Kodunuz",
      html,
    });

    return { success: true };
  } catch (err) {
    console.error("Doğrulama kodu gönderme hatası:", err);
    return { error: "Kod gönderilirken bir hata oluştu." };
  }
}

/**
 * Gönderilen OTP kodunu doğrular
 */
export async function verifyCode(email, code) {
  try {
    const record = await prisma.verificationCode.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!record) {
      return { error: "Doğrulama kodu bulunamadı." };
    }

    if (record.code !== code) {
      return { error: "Hatalı veya geçersiz doğrulama kodu." };
    }

    if (new Date() > record.expiresAt) {
      return { error: "Doğrulama kodunun süresi dolmuş." };
    }

    // Doğrulama başarılı olduysa kodu sil
    await prisma.verificationCode.delete({
      where: { email: email.toLowerCase() }
    });

    return { success: true };
  } catch (err) {
    console.error("Doğrulama hatası:", err);
    return { error: "Doğrulama işlemi sırasında bir hata oluştu." };
  }
}
