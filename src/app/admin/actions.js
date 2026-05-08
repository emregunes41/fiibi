"use server";

import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { getTenantSlug, getTenantBySlug } from "@/lib/tenant";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

export async function loginAdmin(identifier, password) {
  try {
    // Rate limiting — IP + identifier bazlı
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateLimitKey = `admin_login:${ip}:${identifier}`;
    
    const rateCheck = await checkRateLimit(rateLimitKey, {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000,      // 15 dakika
      blockDurationMs: 15 * 60 * 1000, // 15 dakika engelleme
    });

    if (!rateCheck.allowed) {
      const minutes = Math.ceil(rateCheck.retryAfterSec / 60);
      return { error: `Çok fazla başarısız deneme. ${minutes} dakika sonra tekrar deneyin.` };
    }

    const slug = await getTenantSlug();
    let tenantId = null;

    // Tenant varsa, o tenant'ın admin'ini kontrol et
    if (slug) {
      const tenant = await getTenantBySlug(slug);
      if (!tenant) return { error: "Stüdyo bulunamadı." };
      if (tenant.isFrozen) return { error: "Bu hesap askıya alınmıştır." };
      if (!tenant.isActive) return { error: "Bu hesap devre dışıdır." };
      tenantId = tenant.id;
    }

    // Admin'i bul
    let admin;
    if (tenantId) {
      // 1. Önce username ile tenant-scoped ara
      admin = await prisma.admin.findFirst({
        where: { username: identifier, tenantId }
      });

      // 2. Bulunamazsa email veya telefon ile tenant'ı bul, oradan admin'i çek
      if (!admin) {
        const t = await prisma.tenant.findFirst({
          where: {
            id: tenantId,
            OR: [
              { ownerEmail: identifier },
              { ownerPhone: identifier }
            ]
          }
        });
        if (t) {
          admin = await prisma.admin.findFirst({ where: { tenantId: t.id } });
        }
      }
    } else {
      // Legacy: slug yoksa global arama
      admin = await prisma.admin.findUnique({
        where: { username: identifier }
      });
      if (!admin) {
        const t = await prisma.tenant.findFirst({
          where: {
            OR: [
              { ownerEmail: identifier },
              { ownerPhone: identifier }
            ]
          }
        });
        if (t) {
          admin = await prisma.admin.findFirst({ where: { tenantId: t.id } });
        }
      }
    }

    // İlk kurulum: tenant varsa ama admin yoksa, tenant sahibinin şifresini kontrol et
    if (!admin && tenantId) {
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      if (tenant && (identifier === `${slug}_admin` || identifier === tenant.ownerEmail || identifier === tenant.ownerPhone)) {
        const isOwnerPassword = await bcrypt.compare(password, tenant.password);
        if (isOwnerPassword) {
          // Admin henüz oluşturulmamışsa oluştur
          const hashedPassword = await bcrypt.hash(password, 10);
          admin = await prisma.admin.create({
            data: { username: `${slug}_admin`, password: hashedPassword, tenantId }
          });
        }
      }
    }

    if (!admin) {
      return { error: "Bilgiler hatalı." };
    }

    // Şifre kontrolü
    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      return { error: "Bilgiler hatalı." };
    }

    // Başarılı giriş — rate limit sıfırla
    await resetRateLimit(rateLimitKey);

    // Session JWT
    const token = await signToken({
      adminId: admin.id,
      username: admin.username,
      tenantId: admin.tenantId || null,
    });
    
    const cookieStore = await cookies();
    cookieStore.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

  } catch (error) {
    console.error("Login Error:", error);
    return { error: "Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin." };
  }
  
  redirect("/admin/dashboard");
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_token");
  redirect("/admin/login");
}


export async function autoLoginWithToken(token) {
  try {
    const { verifyAuth, signToken } = await import("@/lib/auth");
    const payload = await verifyAuth(token);
    
    // loginAdmin creates tokens with { adminId, username, tenantId }
    // Also support legacy tokens with { id, role: "admin" }
    const isValid = (payload?.adminId) || (payload?.id && payload?.role === "admin");
    if (!payload || !isValid) {
      return { error: "Geçersiz veya süresi dolmuş token." };
    }

    // Auto-login token'ı doğrudan session olarak kullanma
    // Yeni bir uzun ömürlü session token oluştur
    const sessionToken = await signToken({
      adminId: payload.adminId || payload.id,
      username: payload.username,
      tenantId: payload.tenantId || null,
    });

    const cookieStore = await cookies();
    cookieStore.set({
      name: "admin_token",
      value: sessionToken, // Kısa ömürlü auto-login token değil, yeni session token
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      sameSite: "lax",
    });

    return { success: true };
  } catch (err) {
    return { error: "Geçersiz veya süresi dolmuş token." };
  }
}
