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

  const rateCheck = checkRateLimit(rateLimitKey, {
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
  resetRateLimit(rateLimitKey);

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
    businessName: t.businessName,
    ownerName: t.ownerName,
    ownerEmail: t.ownerEmail,
    plan: t.plan,
    selectedPlan: t.selectedPlan,
    planExpiresAt: t.planExpiresAt,
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

  const validPlans = ["trial", "pro"];
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
  
  // Varsayılan fiyatlar
  const defaults = { monthly: 2499, yearly: 24999 };
  
  if (!config) return defaults;
  
  const pricing = typeof config.pricing === "string" ? JSON.parse(config.pricing) : config.pricing;
  return { ...defaults, ...pricing };
}

/**
 * Platform fiyatlandırma güncelle
 */
export async function updatePlatformPricing(pricing) {
  if (!(await isSuperAdmin())) return { error: "Yetkisiz" };

  const { monthly, yearly } = pricing;
  if (!monthly || !yearly) return { error: "Tüm fiyatlar gerekli" };

  await prisma.platformConfig.upsert({
    where: { id: "main" },
    update: { pricing: { monthly: Number(monthly), yearly: Number(yearly) } },
    create: { id: "main", pricing: { monthly: Number(monthly), yearly: Number(yearly) } },
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

  return { success: true };
}
