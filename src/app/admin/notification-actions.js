"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export async function markNotificationAsRead(id) {
  const auth = await requireAdmin();
  if (auth?.error) return auth;
  try {
    await prisma.adminNotification.update({
      where: { id },
      data: { isRead: true }
    });
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

export async function clearAllNotifications() {
  const auth = await requireAdmin();
  if (auth?.error) return auth;
  try {
    await prisma.adminNotification.updateMany({
      where: { isRead: false },
      data: { isRead: true }
    });
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}
