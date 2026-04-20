"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { getCurrentTenant } from "@/lib/tenant";

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
    const tenant = await getCurrentTenant();
    const tenantId = tenant?.id || "NONE";
    await prisma.adminNotification.updateMany({
      where: { isRead: false, tenantId },
      data: { isRead: true }
    });
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}
