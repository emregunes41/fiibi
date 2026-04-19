"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { sendEmailWithResend, getNotificationSettings } from "./notify";

export async function registerForEvent(eventId, formData) {
  try {
    const tenant = await getCurrentTenant();
    
    // Check if event exists and is active
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: true
      }
    });

    if (!event || !event.isActive) {
      return { success: false, error: "Etkinlik bulunamadı veya pasif durumda." };
    }

    // Check capacity
    const currentRegs = event.registrations.length;
    if (currentRegs >= event.maxParticipants) {
      return { success: false, error: "Üzgünüz, kontenjan dolmuştur." };
    }

    // Check if user already registered (by email or phone to prevent double booking on same event)
    const existing = event.registrations.find(
      r => r.email.toLowerCase() === formData.email.toLowerCase() || r.phone === formData.phone
    );
    
    if (existing) {
      return { success: false, error: "Bu telefon numarası veya e-posta adresi ile bu etkinliğe zaten kayıtlısınız." };
    }

    // Register
    const isFree = event.price === "0";
    const paymentStatus = isFree ? "PAID" : "UNPAID";

    const registration = await prisma.eventRegistration.create({
      data: {
        eventId: event.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        socialMedia: formData.socialMedia || null,
        paymentStatus: paymentStatus,
        tenantId: tenant?.id || null,
      }
    });

    // Send Notification Email to Attendee
    try {
      const settings = await getNotificationSettings();
      const businessName = settings._tenant?.businessName || "Etkinlik";
      const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:3000";
      const formattedDate = new Date(event.date).toLocaleDateString("tr-TR", { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
      
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f9fc; padding: 40px 0; margin: 0;">
          <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
            <div style="padding: 32px 32px 24px;">
              <h2 style="color: #333; font-size: 22px; margin: 0 0 12px; text-align: center;">Kaydınız Alındı! 🎉</h2>
              <p style="color: #555; font-size: 15px; line-height: 1.7; text-align: center; margin: 0 0 24px;">
                Merhaba <strong>${formData.name}</strong>,<br/>
                "${event.title}" etkinliğine kaydınız başarıyla oluşturuldu.
              </p>
              
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
                <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0;">
                  <div style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">TARİH VE SAAT</div>
                  <div style="font-size: 14px; color: #0f172a; font-weight: 600; margin-top: 4px;">${formattedDate}</div>
                </div>
                ${event.location ? `
                <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0;">
                  <div style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">LOKASYON</div>
                  <div style="font-size: 14px; color: #0f172a; font-weight: 600; margin-top: 4px;">${event.location}</div>
                </div>
                ` : ''}
                <div style="margin-bottom: 0;">
                  <div style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">ÖDEME DURUMU</div>
                  <div style="font-size: 14px; color: #0f172a; font-weight: 600; margin-top: 4px;">
                    ${isFree ? '<span style="color: #10b981;">Ücretsiz Etkinlik</span>' : 'Nakit / Havale ile ödenecek.'}
                  </div>
                </div>
              </div>

              ${event.meetingLink ? `
              <div style="background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
                <div style="font-size: 13px; color: #6d28d9; font-weight: 700; margin-bottom: 12px;">📹 Bu Bir Online Etkinliktir</div>
                <a href="${event.meetingLink}" target="_blank" style="background-color: #8b5cf6; color: #fff; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 13px;">Etkinliğe Katıl</a>
                <div style="font-size: 11px; color: #8b5cf6; margin-top: 10px;">Etkinlik saatinde bu linke tıklayarak doğrudan katılabilirsiniz.</div>
              </div>
              ` : ''}

              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
                <p style="color: #999; font-size: 12px; margin: 0;">${businessName}</p>
              </div>
            </div>
          </div>
        </div>
      `;
      
      await sendEmailWithResend(settings, formData.email, "Etkinlik Kaydınız Onaylandı 🎉", emailHtml);
    } catch(err) {
      console.log("Etkinlik onay maili hatası:", err);
    }

    revalidatePath("/events");
    revalidatePath("/");
    revalidatePath("/admin/events");

    return { success: true };
  } catch (error) {
    console.error("Etkinlik kayıt hatası:", error);
    return { success: false, error: "Kayıt işlemi sırasında bir sorun oluştu." };
  }
}
