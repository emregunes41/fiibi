"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * Yeni fotoğrafçı kaydı — tenant + admin + globalSettings oluşturur
 */
export async function registerPhotographer(data) {
  try {
    const { businessName, ownerName, ownerEmail, ownerPhone, password, slug, selectedPlan, referralCode: inputReferral } = data;

    // Validasyon
    if (!businessName || !ownerName || !ownerEmail || !password || !slug) {
      return { error: "Tüm alanları doldurunuz." };
    }

    // Slug format kontrolü
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/--+/g, '-').replace(/^-|-$/g, '');
    if (cleanSlug.length < 3) {
      return { error: "Adres en az 3 karakter olmalıdır." };
    }

    // Yasaklı slug'lar
    const reserved = ["admin", "api", "www", "app", "dashboard", "login", "register", "settings", "billing", "pricing", "support", "help"];
    if (reserved.includes(cleanSlug)) {
      return { error: "Bu adres kullanılamaz, lütfen başka bir adres seçiniz." };
    }

    // Slug kontrolü
    const existingSlug = await prisma.tenant.findUnique({ where: { slug: cleanSlug } });
    if (existingSlug) {
      return { error: "Bu adres zaten kullanılıyor." };
    }

    // E-posta kontrolü
    const existingEmail = await prisma.tenant.findUnique({ where: { ownerEmail: ownerEmail.toLowerCase() } });
    if (existingEmail) {
      return { error: "Bu e-posta adresi zaten kayıtlı." };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Referans kodu kontrolü
    let referringTenant = null;
    if (inputReferral) {
      referringTenant = await prisma.tenant.findUnique({ where: { referralCode: inputReferral.toUpperCase() } });
    }

    // Benzersiz referans kodu oluştur
    function genCode() {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let code = "";
      for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
      return code;
    }
    let newReferralCode = genCode();
    while (await prisma.tenant.findUnique({ where: { referralCode: newReferralCode } })) {
      newReferralCode = genCode();
    }

    const trialDays = referringTenant ? 37 : 7; // 30 gün bonus + 7 gün normal

    // Transaction: Tenant + Admin + GlobalSettings
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          slug: cleanSlug,
          businessName,
          ownerName,
          ownerEmail: ownerEmail.toLowerCase(),
          ownerPhone: ownerPhone || null,
          password: hashedPassword,
          plan: "trial",
          selectedPlan: selectedPlan || "monthly",
          planExpiresAt: new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000),
          referralCode: newReferralCode,
          referredBy: referringTenant?.id || null,
        }
      });

      // 2. Admin hesabı oluştur
      await tx.admin.create({
        data: {
          username: cleanSlug + "_admin",
          password: hashedPassword,
          tenantId: tenant.id,
        }
      });

      // 3. GlobalSettings oluştur (varsayılan)
      await tx.globalSettings.create({
        data: {
          id: `settings-${tenant.id}`,
          tenantId: tenant.id,
          businessName,
          email: ownerEmail.toLowerCase(),
          phone: ownerPhone || "",
          heroBgType: "color",
          heroBgColor: "#000000",
          emailEnabled: true,
          smsEnabled: false,
          notifyReservation: true,
          notifyPayment: true,
          notifyReminder: true,
          notifyPhotosReady: true,
        }
      });

      // Referans veren kişiye de 30 gün bonus ekle
      if (referringTenant) {
        const currentExpiry = referringTenant.planExpiresAt || new Date();
        const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
        await tx.tenant.update({
          where: { id: referringTenant.id },
          data: {
            planExpiresAt: new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000),
            referralCount: { increment: 1 },
          }
        });
      }

      return tenant;
    });

    return {
      success: true,
      tenant: {
        id: result.id,
        slug: result.slug,
        businessName: result.businessName,
      }
    };

  } catch (err) {
    console.error("Photographer registration error:", err);
    if (err.code === 'P2002') {
      return { error: "Bu bilgilerle zaten bir hesap kayıtlı." };
    }
    return { error: "Kayıt sırasında bir hata oluştu." };
  }
}
