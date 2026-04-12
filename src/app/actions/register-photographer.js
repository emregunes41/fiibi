"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * Yeni fotoğrafçı kaydı — tenant + admin + globalSettings oluşturur
 */
export async function registerPhotographer(data) {
  try {
    const { businessName, ownerName, ownerEmail, ownerPhone, password, slug } = data;

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

    // Transaction: Tenant + Admin + GlobalSettings
    const result = await prisma.$transaction(async (tx) => {
      // 1. Tenant oluştur
      const tenant = await tx.tenant.create({
        data: {
          slug: cleanSlug,
          businessName,
          ownerName,
          ownerEmail: ownerEmail.toLowerCase(),
          ownerPhone: ownerPhone || null,
          password: hashedPassword,
          plan: "trial",
          planExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 gün trial
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
