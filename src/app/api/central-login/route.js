// Central Login API — fiibi.co merkezi giriş

import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json({ error: "Lütfen bilgilerinizi girin." }, { status: 400 });
    }

    // 1. Tenant'ı bul — e-posta, telefon veya username ile
    let admin = null;
    let tenant = null;

    // Önce ownerPhone veya ownerEmail ile tenant ara
    tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { ownerEmail: identifier },
          { ownerPhone: identifier }
        ]
      }
    });

    if (tenant) {
      // Tenant bulundu — admin'ini getir
      admin = await prisma.admin.findFirst({ where: { tenantId: tenant.id } });

      // Admin yoksa, tenant şifresiyle kontrol et ve admin oluştur
      if (!admin && tenant.password) {
        const isOwnerPassword = await bcrypt.compare(password, tenant.password);
        if (isOwnerPassword) {
          const hashedPassword = await bcrypt.hash(password, 10);
          admin = await prisma.admin.create({
            data: { 
              username: `${tenant.slug}_admin`, 
              password: hashedPassword, 
              tenantId: tenant.id 
            }
          });
        }
      }
    } else {
      // Username ile admin ara (global)
      admin = await prisma.admin.findFirst({
        where: { username: identifier },
        include: { tenant: true }
      });
      if (admin?.tenant) {
        tenant = admin.tenant;
      }
    }

    if (!admin || !tenant) {
      return NextResponse.json({ error: "Bilgiler hatalı." }, { status: 401 });
    }

    // Tenant kontrolleri
    if (tenant.isFrozen) {
      return NextResponse.json({ error: "Bu hesap askıya alınmıştır." }, { status: 403 });
    }
    if (!tenant.isActive) {
      return NextResponse.json({ error: "Bu hesap devre dışıdır." }, { status: 403 });
    }

    // Şifre kontrolü
    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      return NextResponse.json({ error: "Bilgiler hatalı." }, { status: 401 });
    }

    // Auto-login token oluştur (kısa ömürlü)
    const token = await signToken({
      adminId: admin.id,
      username: admin.username,
      tenantId: admin.tenantId,
    });

    // Tenant'ın subdomain URL'ini oluştur
    const subdomain = tenant.slug;
    const baseUrl = process.env.NODE_ENV === "production" 
      ? `https://${subdomain}.fiibi.co`
      : `http://${subdomain}.localhost:3000`;

    const redirectUrl = `${baseUrl}/admin/login?auto_login=${token}`;

    return NextResponse.json({ 
      success: true, 
      redirectUrl,
      tenantName: tenant.businessName || tenant.slug,
    });

  } catch (error) {
    console.error("Central login error:", error);
    return NextResponse.json({ error: "Bir hata oluştu." }, { status: 500 });
  }
}
