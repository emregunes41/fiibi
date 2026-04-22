"use server";

import { prisma } from "@/lib/prisma";
import { signToken, verifyAuth } from "@/lib/auth";
import { requireUser } from "@/lib/session";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { getCurrentTenant } from "@/lib/tenant";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

export async function registerUser(data) {
  try {
    const { name, email, password } = data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return { error: "Bu e-posta adresi zaten kullanımda." };

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get tenant
    const tenant = await getCurrentTenant();

    // Create user
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: "MEMBER", tenantId: tenant?.id || null }
    });

    // Create token
    const token = await signToken({ userId: user.id, email: user.email, role: user.role });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

export async function loginUser(email, password) {
  try {
    // Rate limiting
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateLimitKey = `user_login:${ip}:${email}`;

    const rateCheck = checkRateLimit(rateLimitKey, {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000,
      blockDurationMs: 15 * 60 * 1000,
    });

    if (!rateCheck.allowed) {
      const minutes = Math.ceil(rateCheck.retryAfterSec / 60);
      return { error: `Çok fazla başarısız deneme. ${minutes} dakika sonra tekrar deneyin.` };
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { error: "E-posta veya şifre hatalı." };

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return { error: "E-posta veya şifre hatalı." };

    // Başarılı — rate limit sıfırla
    resetRateLimit(rateLimitKey);

    const token = await signToken({ userId: user.id, email: user.email, role: user.role });

    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  redirect("/login");
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;

  try {
    const payload = await verifyAuth(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { 
        reservations: { where: { status: { not: "DELETED" } }, include: { packages: true, payments: { orderBy: { createdAt: 'desc' } }, albumModel: true }, orderBy: { createdAt: 'desc' } },
        purchases: { orderBy: { purchaseDate: 'desc' } }
      }
    });
    return user;
  } catch (err) {
    console.error("getCurrentUser Crash:", err);
    return null;
  }
}

export async function updateUser(id, data) {
  const auth = await requireUser();
  if (auth?.error) return auth;
  if (auth.session.userId !== id) return { error: "Yetkisiz islem!" };

  try {
    await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        gender: data.gender,
        age: data.age ? parseInt(data.age) : undefined
      }
    });
    revalidatePath('/profile');
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

export async function updatePassword(id, oldPassword, newPassword) {
  const auth = await requireUser();
  if (auth?.error) return auth;
  if (auth.session.userId !== id) return { error: "Yetkisiz islem!" };

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return { error: "Kullanıcı bulunamadı." };

    if (!user.password) return { error: "Hesabınıza şifre atanmamış (Google ile giriş yapılmış olabilir)." };

    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) return { error: "Mevcut şifreniz hatalı." };

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });

    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

export async function submitPhotoSelection(reservationId, selectionText) {
  const auth = await requireUser();
  if (auth?.error) return auth;

  try {
    const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } });
    if (!reservation || reservation.userId !== auth.session.userId) {
      return { error: "Yetkisiz islem." };
    }

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 14);

    await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        selectedPhotos: selectionText
      }
    });

    revalidatePath('/profile');
    revalidatePath('/admin/reservations');
    return { success: true };
  } catch (err) {
    console.error("Selection Submit Error:", err);
    return { error: err.message };
  }
}

export async function approveContract(reservationId) {
  const auth = await requireUser();
  if (auth?.error) return auth;

  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      select: { userId: true }
    });

    if (!reservation || reservation.userId !== auth.session.userId) {
      return { error: "Yetkisiz islem." };
    }

    await prisma.reservation.update({
      where: { id: reservationId },
      data: { contractApproved: true }
    });

    // Notify admin
    try {
      const fullRes = await prisma.reservation.findUnique({ where: { id: reservationId } });
      const { notifyAdminContractApproved } = await import("./actions/admin-notifications");
      await notifyAdminContractApproved({
        brideName: fullRes.brideName,
        bridePhone: fullRes.bridePhone,
        brideEmail: fullRes.brideEmail,
        eventDate: fullRes.eventDate
      });
    } catch (e) { console.error("Admin notify error:", e); }

    revalidatePath('/profile');
    revalidatePath('/admin/reservations');
    return { success: true };
  } catch (err) {
    console.error("Approve Contract Error:", err);
    return { error: err.message };
  }
}
