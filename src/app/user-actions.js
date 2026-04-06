"use server";

import { prisma } from "@/lib/prisma";
import { signToken, verifyAuth } from "@/lib/auth";
import { requireUser } from "@/lib/session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function registerUser(data) {
  try {
    const { name, email, password } = data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return { error: "Bu e-posta adresi zaten kullanımda." };

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: "MEMBER" }
    });

    // Create token
    const token = await signToken({ userId: user.id, email: user.email, role: user.role });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
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
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { error: "E-posta veya şifre hatalı." };

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return { error: "E-posta veya şifre hatalı." };

    const token = await signToken({ userId: user.id, email: user.email, role: user.role });

    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
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
