"use server";

import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

export async function loginAdmin(username, password) {
  try {
    // 1. Find Admin
    let admin = await prisma.admin.findUnique({
      where: { username },
    });

    // Setup override for first time login if no admins exist
    if (!admin && username === 'pinowed_admin') {
      const allAdmins = await prisma.admin.count();
      if (allAdmins === 0) {
        // Create first admin
        const hashedPassword = await bcrypt.hash(password, 10);
        admin = await prisma.admin.create({
          data: { username, password: hashedPassword }
        });
      }
    }

    if (!admin) {
      return { error: "Kullanıcı adı veya şifre hatalı." };
    }

    // 2. Verify password
    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      return { error: "Kullanıcı adı veya şifre hatalı." };
    }

    // 3. Create Session JWT
    const token = await signToken({ adminId: admin.id, username: admin.username });
    
    // 4. Set HttpOnly Cookie
    const cookieStore = await cookies();
    cookieStore.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    // Do NOT return redirect inside try/catch if it causes issues, but Next.js expects it to throw
  } catch (error) {
    console.error("Login Error:", error);
    return { error: `Sistem hatası: ${error.message}` };
  }
  
  redirect("/admin/dashboard");
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_token");
  redirect("/admin/login");
}
