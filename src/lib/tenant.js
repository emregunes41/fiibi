"use server";

import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

/**
 * Request header'larından tenant slug'ını al
 * Middleware tarafından x-tenant-slug header'ına set edilir
 */
export async function getTenantSlug() {
  const headersList = await headers();
  return headersList.get("x-tenant-slug") || null;
}

/**
 * Slug ile tenant'ı DB'den çek
 */
export async function getTenantBySlug(slug) {
  if (!slug) return null;
  return prisma.tenant.findUnique({
    where: { slug },
  });
}

/**
 * Custom domain ile tenant'ı bul
 */
export async function getTenantByDomain(domain) {
  if (!domain) return null;
  return prisma.tenant.findUnique({
    where: { customDomain: domain },
  });
}

/**
 * Mevcut request'ten tenant'ı otomatik algıla
 * Önce header'dan slug → sonra DB lookup
 * Bulamazsa null döner
 */
export async function getCurrentTenant() {
  const slug = await getTenantSlug();
  if (!slug) return null;
  return getTenantBySlug(slug);
}

/**
 * Tenant zorunlu — yoksa hata fırlat
 */
export async function requireTenant() {
  const tenant = await getCurrentTenant();
  if (!tenant) {
    throw new Error("Tenant bulunamadı");
  }
  if (!tenant.isActive) {
    throw new Error("Bu hesap devre dışı");
  }
  return tenant;
}

/**
 * Tenant admin auth — hem admin girişi hem tenant scope kontrol eder
 */
export async function requireTenantAdmin() {
  const tenant = await requireTenant();
  
  // Dondurulmuş hesap kontrolü
  if (tenant.isFrozen) {
    return { error: "Hesabınız dondurulmuştur. Abonelik ödemenizi güncelleyin.", frozen: true };
  }
  
  return tenant;
}

/**
 * Tenant-scoped site config çek
 */
export async function getTenantSiteConfig(tenantId) {
  if (!tenantId) return null;
  return prisma.globalSettings.findFirst({
    where: { tenantId },
  });
}

/**
 * Mevcut tenant'ın site config'ini çek (kısayol)
 */
export async function getCurrentSiteConfig() {
  const tenant = await getCurrentTenant();
  if (!tenant) return null;
  return getTenantSiteConfig(tenant.id);
}

/**
 * Platform domain'ini env'den al
 */
export async function getPlatformDomain() {
  return process.env.PLATFORM_DOMAIN || "localhost:3000";
}

/**
 * Tenant'ın tam URL'ini oluştur
 */
export async function getTenantUrl(tenant) {
  if (tenant.customDomain) {
    return `https://${tenant.customDomain}`;
  }
  const domain = await getPlatformDomain();
  const protocol = domain.includes("localhost") ? "http" : "https";
  return `${protocol}://${tenant.slug}.${domain}`;
}
