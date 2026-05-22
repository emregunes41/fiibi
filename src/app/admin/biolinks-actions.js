"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";

async function getTenantId() {
  const tenant = await getCurrentTenant();
  return tenant?.id || null;
}

export async function getBioLinks() {
  const tenantId = await getTenantId();
  if (!tenantId) return [];
  try {
    return await prisma.bioLink.findMany({
      where: { tenantId },
      orderBy: { order: "asc" },
    });
  } catch (error) {
    console.error("BioLink fetch error:", error);
    return [];
  }
}

export async function createBioLink(data) {
  const tenantId = await getTenantId();
  if (!tenantId) throw new Error("Yetkisiz işlem");

  try {
    const count = await prisma.bioLink.count({ where: { tenantId } });
    const link = await prisma.bioLink.create({
      data: {
        title: data.title,
        url: data.url,
        icon: data.icon,
        isActive: data.isActive !== undefined ? data.isActive : true,
        order: count,
        tenantId,
      },
    });
    revalidatePath("/admin/settings");
    revalidatePath("/links");
    return { success: true, link };
  } catch (error) {
    console.error("BioLink create error:", error);
    return { success: false, error: "Eklenemedi." };
  }
}

export async function updateBioLink(id, data) {
  const tenantId = await getTenantId();
  if (!tenantId) throw new Error("Yetkisiz işlem");

  try {
    const link = await prisma.bioLink.update({
      where: { id, tenantId },
      data: {
        title: data.title,
        url: data.url,
        icon: data.icon,
        isActive: data.isActive,
      },
    });
    revalidatePath("/admin/settings");
    revalidatePath("/links");
    return { success: true, link };
  } catch (error) {
    console.error("BioLink update error:", error);
    return { success: false, error: "Güncellenemedi." };
  }
}

export async function deleteBioLink(id) {
  const tenantId = await getTenantId();
  if (!tenantId) throw new Error("Yetkisiz işlem");

  try {
    await prisma.bioLink.delete({
      where: { id, tenantId },
    });
    revalidatePath("/admin/settings");
    revalidatePath("/links");
    return { success: true };
  } catch (error) {
    console.error("BioLink delete error:", error);
    return { success: false, error: "Silinemedi." };
  }
}

export async function reorderBioLinks(links) {
  const tenantId = await getTenantId();
  if (!tenantId) throw new Error("Yetkisiz işlem");

  try {
    for (const [index, link] of links.entries()) {
      await prisma.bioLink.update({
        where: { id: link.id, tenantId },
        data: { order: index },
      });
    }
    revalidatePath("/admin/settings");
    revalidatePath("/links");
    return { success: true };
  } catch (error) {
    console.error("BioLink reorder error:", error);
    return { success: false, error: "Sıralama güncellenemedi." };
  }
}
