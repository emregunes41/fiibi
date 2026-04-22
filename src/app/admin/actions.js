"use server";

import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { getTenantSlug, getTenantBySlug } from "@/lib/tenant";

export async function loginAdmin(username, password) {
  try {
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
      // Tenant-scoped admin arama
      admin = await prisma.admin.findFirst({
        where: { username, tenantId }
      });
    } else {
      // Legacy: slug yoksa global arama
      admin = await prisma.admin.findUnique({
        where: { username }
      });
    }

    // İlk kurulum: tenant varsa ama admin yoksa, tenant sahibinin şifresini kontrol et
    if (!admin && tenantId) {
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      if (tenant && username === `${slug}_admin`) {
        const isOwnerPassword = await bcrypt.compare(password, tenant.password);
        if (isOwnerPassword) {
          // Admin henüz oluşturulmamışsa oluştur
          const hashedPassword = await bcrypt.hash(password, 10);
          admin = await prisma.admin.create({
            data: { username, password: hashedPassword, tenantId }
          });
        }
      }
    }

    if (!admin) {
      return { error: "Kullanıcı adı veya şifre hatalı." };
    }

    // Şifre kontrolü
    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      return { error: "Kullanıcı adı veya şifre hatalı." };
    }

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
