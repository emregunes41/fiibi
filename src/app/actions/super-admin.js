"use server";

import { prisma } from "@/lib/prisma";
import { cookies, headers } from "next/headers";
import bcrypt from "bcryptjs";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

const SUPER_ADMIN_SECRET = process.env.SUPER_ADMIN_SECRET;

/**
 * Super Admin giriş
 */
export async function superAdminLogin(password) {
  // Rate limiting — Super Admin daha sıkı (3 deneme, 30 dk engelleme)
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateLimitKey = `super_admin_login:${ip}`;

  const rateCheck = await checkRateLimit(rateLimitKey, {
    maxAttempts: 3,
    windowMs: 30 * 60 * 1000,
    blockDurationMs: 30 * 60 * 1000,
  });

  if (!rateCheck.allowed) {
    const minutes = Math.ceil(rateCheck.retryAfterSec / 60);
    return { error: `Çok fazla başarısız deneme. ${minutes} dakika sonra tekrar deneyin.` };
  }

  if (!SUPER_ADMIN_SECRET) {
    return { error: "Super Admin erişimi yapılandırılmamış." };
  }
  if (password !== SUPER_ADMIN_SECRET) {
    return { error: "Geçersiz şifre." };
  }

  // Başarılı — rate limit sıfırla
  await resetRateLimit(rateLimitKey);

  const cookieStore = await cookies();
  cookieStore.set("super_admin", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 1 gün
    path: "/"
  });
  return { success: true };
}

/**
 * Super Admin oturum kontrolü
 */
export async function isSuperAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get("super_admin")?.value === "true";
}

/**
 * Super Admin çıkış
 */
export async function superAdminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete("super_admin");
  return { success: true };
}

/**
 * Tüm tenant'ları listele
 */
export async function getAllTenants() {
  if (!(await isSuperAdmin())) return { error: "Yetkisiz" };

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          reservations: true,
          users: true,
          packages: true,
        }
      }
    }
  });

  return tenants.map(t => ({
    id: t.id,
    slug: t.slug,
    customDomain: t.customDomain,
    businessType: t.businessType,
    businessName: t.businessName,
    ownerName: t.ownerName,
    ownerEmail: t.ownerEmail,
    ownerPhone: t.ownerPhone,
    plan: t.plan,
    selectedPlan: t.selectedPlan,
    planExpiresAt: t.planExpiresAt,
    subscriptionStartedAt: t.subscriptionStartedAt,
    isActive: t.isActive,
    isFrozen: t.isFrozen,
    createdAt: t.createdAt,
    commissionRate: t.commissionRate,
    subMerchantStatus: t.subMerchantStatus,
    // Abonelik & Ödeme
    lastPaymentAt: t.lastPaymentAt,
    nextPaymentAt: t.nextPaymentAt,
    gracePeriodEndsAt: t.gracePeriodEndsAt,
    failedPayments: t.failedPayments,
    paytrCtoken: t.paytrCtoken ? true : false, // Kart kayıtlı mı (sadece boolean gönder, token'ı expose etme)
    iban: t.iban,
    legalName: t.legalName,
    legalType: t.legalType,
    taxId: t.taxId,
    taxOffice: t.taxOffice,
    legalAddress: t.legalAddress,
    taxPlateUrl: t.taxPlateUrl,
    sellerAgreementAccepted: t.sellerAgreementAccepted,
    sellerAgreementDate: t.sellerAgreementDate,
    // İstatistikler
    reservationCount: t._count.reservations,
    userCount: t._count.users,
    packageCount: t._count.packages,
  }));
}

/**
 * Platform istatistikleri
 */
export async function getPlatformStats() {
  if (!(await isSuperAdmin())) return { error: "Yetkisiz" };

  const [tenantCount, activeCount, frozenCount, trialCount, totalReservations, totalUsers, totalPackages, totalPhotos, totalPayments, totalBanners, totalAlbumModels, totalSettings, totalAdmins] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { isActive: true, isFrozen: false } }),
    prisma.tenant.count({ where: { isFrozen: true } }),
    prisma.tenant.count({ where: { plan: "trial" } }),
    prisma.reservation.count(),
    prisma.user.count(),
    prisma.photographyPackage.count(),
    prisma.portfolioPhoto.count(),
    prisma.payment.count(),
    prisma.banner.count(),
    prisma.albumModel.count(),
    prisma.globalSettings.count(),
    prisma.admin.count(),
  ]);

  // Toplam DB satır tahmini
  const totalRows = totalReservations + totalUsers + totalPackages + totalPhotos + totalPayments + totalBanners + totalAlbumModels + totalSettings + totalAdmins + tenantCount;

  return {
    tenantCount,
    activeCount,
    frozenCount,
    trialCount,
    totalReservations,
    totalUsers,
    totalPackages,
    totalPhotos,
    totalPayments,
    totalRows,
  };
}

/**
 * Tenant freeze/unfreeze
 */
export async function toggleTenantFreeze(tenantId) {
  if (!(await isSuperAdmin())) return { error: "Yetkisiz" };

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return { error: "Tenant bulunamadı" };

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      isFrozen: !tenant.isFrozen,
      frozenAt: !tenant.isFrozen ? new Date() : null,
    }
  });

  return { success: true, isFrozen: !tenant.isFrozen };
}

/**
 * Tenant planını değiştir
 */
export async function changeTenantPlan(tenantId, newPlan) {
  if (!(await isSuperAdmin())) return { error: "Yetkisiz" };

  const validPlans = ["trial", "basic", "pro"];
  if (!validPlans.includes(newPlan)) return { error: "Geçersiz plan" };

  // Plan süresini belirle
  let planExpiresAt = null;
  if (newPlan === "trial") {
    planExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  } else {
    planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { plan: newPlan, planExpiresAt }
  });

  return { success: true };
}

/**
 * Tenant sil (dikkatli!)
 */
export async function deleteTenant(tenantId) {
  if (!(await isSuperAdmin())) return { error: "Yetkisiz" };

  // Cascade delete: önce bağımlı verileri sil
  await prisma.$transaction(async (tx) => {
    await tx.adminNotification.deleteMany({ where: { tenantId } });
    await tx.monthlyPriceConfig.deleteMany({ where: { tenantId } });
    await tx.discountCode.deleteMany({ where: { tenantId } });
    await tx.albumModel.deleteMany({ where: { tenantId } });
    await tx.payment.deleteMany({ where: { reservation: { tenantId } } });
    await tx.reservation.deleteMany({ where: { tenantId } });
    await tx.photographyPackage.deleteMany({ where: { tenantId } });
    await tx.portfolioPhoto.deleteMany({ where: { category: { tenantId } } });
    await tx.portfolioCategory.deleteMany({ where: { tenantId } });
    await tx.banner.deleteMany({ where: { tenantId } });
    await tx.contentBlock.deleteMany({ where: { tenantId } });
    await tx.user.deleteMany({ where: { tenantId } });
    await tx.globalSettings.deleteMany({ where: { tenantId } });
    await tx.admin.deleteMany({ where: { tenantId } });
    await tx.tenant.delete({ where: { id: tenantId } });
  });

  return { success: true };
}

/**
 * Platform fiyatlandırma al
 */
export async function getPlatformPricing() {
  if (!(await isSuperAdmin())) return { error: "Yetkisiz" };

  const config = await prisma.platformConfig.findUnique({ where: { id: "main" } });
  
  // Varsayılan fiyatlar (Basic & Pro)
  const defaults = {
    basic_monthly: 1499, basic_yearly: 14999,
    pro_monthly: 2999, pro_yearly: 29999,
  };
  
  if (!config) return defaults;
  
  const pricing = typeof config.pricing === "string" ? JSON.parse(config.pricing) : config.pricing;
  return { ...defaults, ...pricing };
}

/**
 * Platform fiyatlandırma güncelle
 */
export async function updatePlatformPricing(pricing) {
  if (!(await isSuperAdmin())) return { error: "Yetkisiz" };

  const { basic_monthly, basic_yearly, pro_monthly, pro_yearly } = pricing;
  if (!basic_monthly || !basic_yearly || !pro_monthly || !pro_yearly) return { error: "Tüm fiyatlar gerekli" };

  const priceData = {
    basic_monthly: Number(basic_monthly), basic_yearly: Number(basic_yearly),
    pro_monthly: Number(pro_monthly), pro_yearly: Number(pro_yearly),
  };

  await prisma.platformConfig.upsert({
    where: { id: "main" },
    update: { pricing: priceData },
    create: { id: "main", pricing: priceData },
  });

  return { success: true };
}

/**
 * Tenant komisyon oranını güncelle
 */
export async function updateTenantCommission(tenantId, commissionRate) {
  if (!(await isSuperAdmin())) return { error: "Yetkisiz" };

  const rate = parseFloat(commissionRate);
  if (isNaN(rate) || rate < 0 || rate > 100) {
    return { error: "Komisyon oranı 0-100 arasında olmalıdır." };
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { commissionRate: rate }
  });

  return { success: true };
}

/**
 * Tenant sub-merchant durumunu güncelle (onay/red)
 */
export async function updateSubMerchantStatus(tenantId, status) {
  if (!(await isSuperAdmin())) return { error: "Yetkisiz" };

  const validStatuses = ["NOT_STARTED", "PENDING", "APPROVED", "REJECTED"];
  if (!validStatuses.includes(status)) return { error: "Geçersiz durum" };

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { subMerchantStatus: status }
  });

  // Otomatik ödeme modunu güncelle
  let newMode = "cash";
  if (status === "APPROVED") {
    newMode = "both";
  }
  
  await prisma.globalSettings.updateMany({
    where: { tenantId },
    data: { paymentMode: newMode }
  });

  return { success: true };
}

/**
 * Reset Tenant Admin Password
 */
export async function resetTenantAdminPassword(tenantId, newPassword) {
  if (!(await isSuperAdmin())) return { error: "Yetkisiz" };
  
  if (!newPassword || newPassword.length < 6) {
    return { error: "Şifre en az 6 karakter olmalıdır." };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  // Update all admins belonging to this tenant
  await prisma.admin.updateMany({
    where: { tenantId },
    data: { password: hashedPassword }
  });

  return { success: true };
}

/**
 * Generic tenant field update — God Mode
 */
const EDITABLE_FIELDS = [
  "businessName", "ownerName", "ownerEmail", "ownerPhone",
  "slug", "customDomain", "businessType", "plan",
  "isActive", "legalName", "legalType", "taxId", "taxOffice", "iban", "legalAddress",
];

export async function updateTenantField(tenantId, field, value) {
  if (!(await isSuperAdmin())) return { error: "Yetkisiz" };

  if (!EDITABLE_FIELDS.includes(field)) {
    return { error: `"${field}" düzenlenebilir bir alan değil.` };
  }

  // Slug özel validasyonu
  if (field === "slug") {
    const slug = value?.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30);
    if (!slug || slug.length < 2) return { error: "Slug en az 2 karakter olmalı." };
    const reserved = ["admin", "api", "www", "app", "super-admin", "login", "register", "support", "help", "billing", "fiibi", "fiybi"];
    if (reserved.includes(slug)) return { error: `"${slug}" rezerve edilmiş bir adrestir.` };
    const existing = await prisma.tenant.findUnique({ where: { slug } });
    if (existing && existing.id !== tenantId) return { error: `"${slug}" zaten kullanılıyor.` };
    value = slug;
  }

  // Plan validasyonu
  if (field === "plan") {
    const validPlans = ["trial", "basic", "pro"];
    if (!validPlans.includes(value)) return { error: "Geçersiz plan." };
  }

  // Email validasyonu
  if (field === "ownerEmail" && value) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return { error: "Geçersiz e-posta formatı." };
  }

  // Boolean alanlar
  if (field === "isActive") {
    value = value === true || value === "true";
  }

  // Genel min uzunluk
  if (typeof value === "string" && value.trim().length < 1) {
    return { error: "Bu alan boş bırakılamaz." };
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { [field]: typeof value === "string" ? value.trim() : value }
  });

  // businessName değiştiğinde GlobalSettings'i de senkronize et (navbar + SEO)
  if (field === "businessName") {
    await prisma.globalSettings.updateMany({
      where: { tenantId },
      data: { businessName: typeof value === "string" ? value.trim() : value }
    });
  }

  return { success: true, field, value };
}

// Backward compat wrappers
export async function updateTenantSlug(tenantId, newSlug) {
  return updateTenantField(tenantId, "slug", newSlug);
}
export async function updateTenantBusinessName(tenantId, newName) {
  return updateTenantField(tenantId, "businessName", newName);
}

/**
 * Super Admin → Tenant admin paneline giriş (Impersonate / God Mode)
 */
export async function impersonateTenant(tenantId) {
  if (!(await isSuperAdmin())) return { error: "Yetkisiz" };

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return { error: "Tenant bulunamadı." };

  // Tenant'ın admin'ini bul
  const admin = await prisma.admin.findFirst({ where: { tenantId } });
  if (!admin) return { error: "Bu tenant'ın admin hesabı bulunamadı." };

  // JWT oluştur
  const { signToken } = await import("@/lib/auth");
  const token = await signToken({
    adminId: admin.id,
    username: admin.username,
    tenantId: admin.tenantId,
  });

  // Subdomain URL oluştur
  const domain = process.env.PLATFORM_DOMAIN || process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "fiibi.co";
  const protocol = domain.includes("localhost") ? "http" : "https";
  const url = `${protocol}://${tenant.slug}.${domain}/admin/login?auto_login=${token}`;

  return { success: true, url, slug: tenant.slug };
}

/**
 * Muhasebe verilerini getir — Super Admin Finans Paneli
 * SADECE PayTR kredi kartı (ONLINE) ödemeleri — Nakit/Manuel dahil değil
 */
export async function getAccountingData() {
  if (!(await isSuperAdmin())) return { error: "Yetkisiz" };

  const PAYTR_FEE_RATE = 3.99; // PayTR komisyonu %3.99

  // 1. Tüm tenant'lar + online ödemeli rezervasyonlar
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      businessName: true,
      ownerName: true,
      ownerEmail: true,
      plan: true,
      selectedPlan: true,
      planExpiresAt: true,
      lastPaymentAt: true,
      nextPaymentAt: true,
      commissionRate: true,
      subMerchantStatus: true,
      iban: true,
      legalName: true,
      isFrozen: true,
      isActive: true,
      createdAt: true,
      failedPayments: true,
      paytrCtoken: true,
      reservations: {
        select: {
          id: true,
          brideName: true,
          totalAmount: true,
          paidAmount: true,
          paymentStatus: true,
          status: true,
          createdAt: true,
          paymentLogs: true,
          payments: {
            where: { method: "ONLINE" }, // SADECE PayTR ödemeleri
            select: { id: true, amount: true, method: true, note: true, createdAt: true }
          }
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const now = new Date();
  const VALOR_DAYS = 15;

  let platformTotals = {
    totalOnlinePayments: 0,      // PayTR'dan geçen toplam
    totalPaytrFee: 0,            // PayTR'nin aldığı %3.99
    totalPlatformCommission: 0,  // Brüt platform komisyonu
    totalNetPlatformEarning: 0,  // Net platform kazancı (komisyon - paytr fee)
    totalTransferred: 0,         // Tenant'a aktarılan
    totalPendingTransfer: 0,     // Henüz aktarılmamış (valör bekleyen)
    totalInValor: 0,             // 15 gün valör içinde olan
    totalPendingCollection: 0,   // Henüz ödenmemiş (online ödeme beklenen) tutarlar
  };

  const tenantFinance = [];

  for (const t of tenants) {
    // Sadece online ödeme olan rezervasyonları filtrele
    const reservationsWithOnline = t.reservations.filter(r => r.payments.length > 0);
    
    if (reservationsWithOnline.length === 0 && t.reservations.length === 0) {
      // Hiç rezervasyonu yok, atlayabiliriz ama listeye dahil edelim
    }

    let tenantOnlineTotal = 0;
    let tenantPaytrFee = 0;
    let tenantGrossCommission = 0;
    let tenantNetCommission = 0;
    let tenantTransferred = 0;
    let tenantInValor = 0;
    let tenantPendingTransfer = 0;
    
    const commissionRate = t.commissionRate || 6;
    const netPlatformRate = Math.max(0, commissionRate - PAYTR_FEE_RATE);

    // Her bir online ödeme detayı
    const paymentDetails = [];

    for (const r of t.reservations) {
      // Toplam tutar
      const totalAmount = parseFloat(
        String(r.totalAmount || "0").replace(/\./g, "").replace(",", ".").replace(/[^0-9.-]/g, "") || "0"
      );

      for (const p of r.payments) {
        const amount = p.amount || 0;
        const paytrFee = Math.round(amount * PAYTR_FEE_RATE) / 100;
        const grossComm = Math.round(amount * commissionRate) / 100;
        const netComm = Math.round(amount * netPlatformRate) / 100;
        const tenantShare = amount - grossComm;
        const paymentDate = new Date(p.createdAt);

        // Transfer durumu kontrol
        const transferLog = (r.paymentLogs || []).find(
          log => log.type === "PLATFORM_TRANSFER"
        );
        const isTransferred = !!transferLog;
        const transferCompleted = transferLog?.transferCompleted === true;

        // Valör hesapla
        const valorEndDate = new Date(paymentDate);
        valorEndDate.setDate(valorEndDate.getDate() + VALOR_DAYS);
        const isInValor = now < valorEndDate && !isTransferred;
        const valorDaysLeft = isInValor ? Math.ceil((valorEndDate - now) / (1000*60*60*24)) : 0;
        const isPendingTransfer = !isInValor && !isTransferred;

        tenantOnlineTotal += amount;
        tenantPaytrFee += paytrFee;
        tenantGrossCommission += grossComm;
        tenantNetCommission += netComm;

        if (isTransferred) tenantTransferred += tenantShare;
        else if (isInValor) tenantInValor += tenantShare;
        else tenantPendingTransfer += tenantShare;

        paymentDetails.push({
          paymentId: p.id,
          reservationId: r.id,
          customerName: r.brideName,
          amount,
          paytrFee: Math.round(paytrFee * 100) / 100,
          grossCommission: Math.round(grossComm * 100) / 100,
          netCommission: Math.round(netComm * 100) / 100,
          tenantShare: Math.round(tenantShare * 100) / 100,
          date: p.createdAt,
          isTransferred,
          transferCompleted,
          isInValor,
          valorDaysLeft,
          isPendingTransfer,
          transId: transferLog?.transId || null,
          merchantOid: p.note?.match(/PayTR online ödeme: (.+)/)?.[1] || null,
        });
      }

      // Ödenmemiş tutar (online ödeme beklenen)
      if (r.payments.length === 0 && totalAmount > 0 && r.paymentStatus !== "PAID") {
        // Henüz online ödeme alınmamış
      }
    }

    // Tenant'ın toplam alacağı (online ödenmemiş)
    let tenantPendingCollection = 0;
    for (const r of t.reservations) {
      const totalAmount = parseFloat(
        String(r.totalAmount || "0").replace(/\./g, "").replace(",", ".").replace(/[^0-9.-]/g, "") || "0"
      );
      const onlinePaid = r.payments.reduce((s, p) => s + (p.amount || 0), 0);
      if (totalAmount > onlinePaid && r.paymentStatus !== "PAID") {
        tenantPendingCollection += (totalAmount - onlinePaid);
      }
    }

    // Platform toplamlarına ekle
    platformTotals.totalOnlinePayments += tenantOnlineTotal;
    platformTotals.totalPaytrFee += tenantPaytrFee;
    platformTotals.totalPlatformCommission += tenantGrossCommission;
    platformTotals.totalNetPlatformEarning += tenantNetCommission;
    platformTotals.totalTransferred += tenantTransferred;
    platformTotals.totalInValor += tenantInValor;
    platformTotals.totalPendingTransfer += tenantPendingTransfer;
    platformTotals.totalPendingCollection += tenantPendingCollection;

    tenantFinance.push({
      id: t.id,
      slug: t.slug,
      businessName: t.businessName,
      ownerName: t.ownerName,
      ownerEmail: t.ownerEmail,
      plan: t.plan,
      selectedPlan: t.selectedPlan,
      commissionRate,
      netPlatformRate: Math.round(netPlatformRate * 100) / 100,
      subMerchantStatus: t.subMerchantStatus,
      iban: t.iban,
      legalName: t.legalName,
      isFrozen: t.isFrozen,
      isActive: t.isActive,
      hasCard: !!t.paytrCtoken,
      failedPayments: t.failedPayments,
      lastPaymentAt: t.lastPaymentAt,
      nextPaymentAt: t.nextPaymentAt,
      // Finansal
      onlineTotal: Math.round(tenantOnlineTotal * 100) / 100,
      paytrFee: Math.round(tenantPaytrFee * 100) / 100,
      grossCommission: Math.round(tenantGrossCommission * 100) / 100,
      netCommission: Math.round(tenantNetCommission * 100) / 100,
      transferred: Math.round(tenantTransferred * 100) / 100,
      inValor: Math.round(tenantInValor * 100) / 100,
      pendingTransfer: Math.round(tenantPendingTransfer * 100) / 100,
      pendingCollection: Math.round(tenantPendingCollection * 100) / 100,
      onlinePaymentCount: paymentDetails.length,
      reservationCount: t.reservations.length,
      // Detaylı ödemeler
      payments: paymentDetails,
    });
  }

  // Yuvarlama
  for (const k of Object.keys(platformTotals)) {
    platformTotals[k] = Math.round(platformTotals[k] * 100) / 100;
  }

  return {
    paytrFeeRate: PAYTR_FEE_RATE,
    summary: platformTotals,
    tenants: tenantFinance,
  };
}

