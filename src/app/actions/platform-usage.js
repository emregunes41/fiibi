"use server";

import { isSuperAdmin } from "./super-admin";

/**
 * Cloudinary kullanım verilerini çek
 * Gerekli env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */
export async function getCloudinaryUsage() {
  if (!(await isSuperAdmin())) return { error: "Yetkisiz" };

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return { error: "Cloudinary API bilgileri eksik", missing: true };
  }

  try {
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/usage`, {
      headers: { Authorization: `Basic ${auth}` },
      next: { revalidate: 300 } // 5 dk cache
    });

    if (!res.ok) {
      return { error: `Cloudinary API hatası: ${res.status}` };
    }

    const data = await res.json();

    // Free tier fallback limitleri (Cloudinary bazen limit=0 döner)
    const STORAGE_LIMIT_FREE = 25 * 1024 * 1024 * 1024;      // 25GB
    const BW_LIMIT_FREE = 25 * 1024 * 1024 * 1024;            // 25GB
    const TRANSFORM_LIMIT_FREE = 25000;

    const storageLimit = data.storage?.limit || STORAGE_LIMIT_FREE;
    const bwLimit = data.bandwidth?.limit || BW_LIMIT_FREE;
    const transformLimit = data.transformations?.limit || TRANSFORM_LIMIT_FREE;

    const storageUsed = data.storage?.usage || 0;
    const bwUsed = data.bandwidth?.usage || 0;

    return {
      storage: {
        used: storageUsed,
        limit: storageLimit,
        usedGB: (storageUsed / 1024 / 1024 / 1024).toFixed(2),
        limitGB: (storageLimit / 1024 / 1024 / 1024).toFixed(1),
        pct: data.storage?.used_percent || Math.round((storageUsed / storageLimit) * 100),
      },
      bandwidth: {
        used: bwUsed,
        limit: bwLimit,
        usedGB: (bwUsed / 1024 / 1024 / 1024).toFixed(2),
        limitGB: (bwLimit / 1024 / 1024 / 1024).toFixed(1),
        pct: data.bandwidth?.used_percent || Math.round((bwUsed / bwLimit) * 100),
      },
      transformations: {
        used: data.transformations?.usage || 0,
        limit: transformLimit,
        pct: data.transformations?.used_percent || Math.round(((data.transformations?.usage || 0) / transformLimit) * 100),
      },
      objects: {
        used: data.objects?.usage || 0,
      },
      plan: data.plan || "free",
      lastUpdated: data.last_updated || null,
    };
  } catch (err) {
    console.error("Cloudinary usage error:", err);
    return { error: err.message };
  }
}

/**
 * Resend kullanım verilerini çek
 * Gerekli env: RESEND_API_KEY
 */
export async function getResendUsage() {
  if (!(await isSuperAdmin())) return { error: "Yetkisiz" };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { error: "Resend API key eksik", missing: true };

  try {
    // Resend doesn't have a direct usage endpoint, so count emails from DB
    const { prisma } = await import("@/lib/prisma");
    
    // Count admin notifications as proxy for emails sent this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const emailsThisMonth = await prisma.adminNotification.count({
      where: {
        createdAt: { gte: startOfMonth },
        type: { in: ["reservation", "payment", "reminder", "photos_ready"] }
      }
    });

    return {
      emailsThisMonth,
      // Free tier: 100/day, 3000/month
      // Pro: 50,000/month
      dailyLimit: 100,
      monthlyLimit: 3000,
      pct: Math.round((emailsThisMonth / 3000) * 100),
      plan: "free",
    };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Veritabanı boyut tahmini
 */
export async function getDbUsage() {
  if (!(await isSuperAdmin())) return { error: "Yetkisiz" };

  try {
    const { prisma } = await import("@/lib/prisma");

    // Tablo bazlı satır sayıları
    const [
      tenants, admins, users, reservations, payments,
      packages, portfolioCategories, portfolioPhotos,
      banners, contentBlocks, albumModels, settings,
      notifications, monthlyPrices, discountCodes
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.admin.count(),
      prisma.user.count(),
      prisma.reservation.count(),
      prisma.payment.count(),
      prisma.photographyPackage.count(),
      prisma.portfolioCategory.count(),
      prisma.portfolioPhoto.count(),
      prisma.banner.count(),
      prisma.contentBlock.count(),
      prisma.albumModel.count(),
      prisma.globalSettings.count(),
      prisma.adminNotification.count(),
      prisma.monthlyPriceConfig.count(),
      prisma.discountCode.count(),
    ]);

    const totalRows = tenants + admins + users + reservations + payments +
      packages + portfolioCategories + portfolioPhotos + banners +
      contentBlocks + albumModels + settings + notifications +
      monthlyPrices + discountCodes;

    // Tahmini boyut (ortalama satır ~500 byte)
    const estimatedSizeMB = Math.round((totalRows * 500) / 1024 / 1024 * 100) / 100;
    const limitMB = 500; // Supabase free tier

    return {
      tables: {
        tenants, admins, users, reservations, payments,
        packages, portfolioCategories, portfolioPhotos,
        banners, contentBlocks, albumModels, settings,
        notifications, monthlyPrices, discountCodes
      },
      totalRows,
      estimatedSizeMB,
      limitMB,
      pct: Math.round((estimatedSizeMB / limitMB) * 100),
    };
  } catch (err) {
    return { error: err.message };
  }
}
