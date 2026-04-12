"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentTenant } from "@/lib/tenant";

async function getTenantId() {
  const tenant = await getCurrentTenant();
  return tenant?.id || null;
}

export async function getContentBlocks() {
  const tenantId = await getTenantId();
  return await prisma.contentBlock.findMany({
    where: tenantId ? { tenantId } : {},
    orderBy: { order: "asc" }
  });
}

export async function createContentBlock(data) {
  try {
    const tenantId = await getTenantId();
    const maxOrder = await prisma.contentBlock.aggregate({
      where: tenantId ? { tenantId } : {},
      _max: { order: true }
    });
    await prisma.contentBlock.create({
      data: {
        title: data.title || "",
        description: data.description || "",
        imageUrls: data.imageUrls || [],
        order: (maxOrder._max.order ?? -1) + 1,
        tenantId,
      },
    });
    revalidatePath("/");
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (e) {
    return { error: e.message };
  }
}

export async function updateContentBlock(id, data) {
  try {
    await prisma.contentBlock.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        imageUrls: data.imageUrls,
        isActive: data.isActive,
      },
    });
    revalidatePath("/");
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (e) {
    return { error: e.message };
  }
}

export async function deleteContentBlock(id) {
  try {
    await prisma.contentBlock.delete({ where: { id } });
    revalidatePath("/");
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (e) {
    return { error: e.message };
  }
}

export async function reorderContentBlocks(ids) {
  try {
    await Promise.all(ids.map((id, idx) => prisma.contentBlock.update({ where: { id }, data: { order: idx } })));
    revalidatePath("/");
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (e) {
    return { error: e.message };
  }
}
