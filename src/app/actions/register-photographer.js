"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getBusinessType } from "@/lib/business-types";
import { sendOnboardingEmail } from "./send-onboarding-email";
import { signToken } from "@/lib/auth";

/**
 * Yeni kayıt öncesi slug, email, telefon ve işletme adını kontrol eder.
 */
export async function preCheckRegistration({ slug, ownerEmail, ownerPhone, businessName }) {
  try {
    const cleanSlug = slug?.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/--+/g, '-').replace(/^-|-$/g, '');
    
    // Yasaklı slug
    const reserved = ["admin", "api", "www", "app", "dashboard", "login", "register", "settings", "billing", "pricing", "support", "help"];
    if (reserved.includes(cleanSlug)) return { error: "Bu adres kullanılamaz, lütfen başka bir adres seçiniz." };

    // Slug kontrolü
    if (cleanSlug) {
      const existingSlug = await prisma.tenant.findUnique({ where: { slug: cleanSlug } });
      if (existingSlug) return { error: "Bu adres zaten kullanılıyor." };
    }

    // İşletme adı kontrolü
    if (businessName) {
      const existingName = await prisma.tenant.findFirst({ 
        where: { businessName: { equals: businessName, mode: 'insensitive' } } 
      });
      if (existingName) return { error: "Bu mağaza adı zaten kullanılıyor." };
    }

    // Telefon kontrolü
    if (ownerPhone) {
      const existingPhone = await prisma.tenant.findFirst({ where: { ownerPhone } });
      if (existingPhone) return { error: "Bu telefon numarası zaten kayıtlı." };
    }

    // E-posta kontrolü
    if (ownerEmail) {
      const existingEmail = await prisma.tenant.findUnique({ where: { ownerEmail: ownerEmail.toLowerCase() } });
      if (existingEmail) return { error: "Bu e-posta adresi zaten kayıtlı." };
    }

    return { success: true };
  } catch (err) {
    return { error: "Doğrulama sırasında bir hata oluştu." };
  }
}

/**
 * Yeni işletme kaydı — tenant + admin + globalSettings oluşturur
 * Tüm sektörler için ortak kayıt fonksiyonu
 */
export async function registerBusiness(data) {
  try {
    const { 
      businessName, ownerName, ownerEmail, ownerPhone, password, slug, 
      selectedPlan, referralCode: inputReferral, businessType, verificationCode,
      kvkkAccepted, serviceAgreementAccepted, siteTemplate 
    } = data;

    // Validasyon
    if (!businessName || !ownerName || !ownerEmail || !password || !slug) {
      return { error: "Tüm alanları doldurunuz." };
    }

    if (!verificationCode) {
      return { error: "Doğrulama kodu gereklidir." };
    }

    // Validasyon
    if (!businessName || !ownerName || !ownerEmail || !password || !slug) {
      return { error: "Tüm alanları doldurunuz." };
    }

    if (!kvkkAccepted || !serviceAgreementAccepted) {
      return { error: "KVKK ve Hizmet Sözleşmesini kabul etmeniz gerekmektedir." };
    }

    if (!businessType) {
      return { error: "Lütfen sektörünüzü seçiniz." };
    }

    // Slug format kontrolü
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/--+/g, '-').replace(/^-|-$/g, '');
    if (cleanSlug.length < 3) {
      return { error: "Adres en az 3 karakter olmalıdır." };
    }

    // Ön kontrolleri tekrar yap (Race condition koruması)
    const preCheck = await preCheckRegistration({ slug, ownerEmail, ownerPhone, businessName });
    if (preCheck.error) {
      return { error: preCheck.error };
    }

    // Doğrulama kodunu kontrol et
    const codeRecord = await prisma.verificationCode.findUnique({
      where: { email: ownerEmail.toLowerCase() }
    });

    if (!codeRecord || codeRecord.code !== verificationCode) {
      return { error: "Hatalı veya geçersiz doğrulama kodu." };
    }

    if (new Date() > codeRecord.expiresAt) {
      return { error: "Doğrulama kodunun süresi dolmuş." };
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

    // Sektöre uygun varsayılan içerikler
    const bt = getBusinessType(businessType);

    // Transaction: Tenant + Admin + GlobalSettings
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          slug: cleanSlug,
          businessType: businessType || "photographer",
          businessName,
          ownerName,
          ownerEmail: ownerEmail.toLowerCase(),
          ownerPhone: ownerPhone || null,
          password: hashedPassword,
          plan: "trial",
          selectedPlan: selectedPlan || "monthly",
          planExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 gün trial
          referralCode: newReferralCode,
          referredBy: referringTenant?.id || null,
          kvkkAccepted: true,
          kvkkAcceptedAt: new Date(),
          serviceAgreementAccepted: true,
          serviceAgreementDate: new Date()
        }
      });

      // 2. Admin hesabı oluştur
      const adminUser = await tx.admin.create({
        data: {
          username: cleanSlug + "_admin",
          password: hashedPassword,
          tenantId: tenant.id,
        }
      });

      // 3. Sektöre uygun varsayılanlar ile GlobalSettings oluştur
      await tx.globalSettings.create({
        data: {
          id: `settings-${tenant.id}`,
          tenantId: tenant.id,
          businessName,
          heroTitle: bt.heroTitle,
          heroSubtitle: bt.heroSub,
          footerTagline: bt.defaultSlogan,
          email: ownerEmail.toLowerCase(),
          phone: ownerPhone || "",
          heroBgType: "color",
          heroBgColor: "#f5f0e8",
          emailEnabled: true,
          smsEnabled: false,
          notifyReservation: true,
          notifyPayment: true,
          notifyReminder: true,
          notifyPhotosReady: true,
          siteTemplate: siteTemplate || "classic",
        }
      });

      return { tenant, adminUser };
    });

    const { tenant, adminUser } = result;

    // Doğrulama kodunu sil
    await prisma.verificationCode.delete({
      where: { email: ownerEmail.toLowerCase() }
    }).catch(() => {});

    // Rehber e-postası gönder (fire-and-forget, hata olursa kayıt etkilenmesin)
    sendOnboardingEmail({
      ownerName,
      ownerEmail: ownerEmail.toLowerCase(),
      businessName,
      slug: cleanSlug,
    }).catch(err => console.error("[onboarding] Email error:", err));

    const adminToken = await signToken({
      id: adminUser.id,
      tenantId: tenant.id,
      role: "admin",
    });

    return {
      success: true,
      token: adminToken,
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        businessName: tenant.businessName,
        businessType: tenant.businessType,
      }
    };

  } catch (err) {
    console.error("Business registration error:", err);
    if (err.code === 'P2002') {
      return { error: "Bu bilgilerle zaten bir hesap kayıtlı." };
    }
    return { error: "Kayıt sırasında bir hata oluştu." };
  }
}

// Geriye uyumluluk için eski fonksiyon adını da export et
export const registerPhotographer = registerBusiness;
