"use server";

import { prisma } from "@/lib/prisma";

export async function getBanners() {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: { order: "asc" },
    });
    return banners;
  } catch (e) {
    console.error("getBanners error:", e);
    return [];
  }
}

export async function getActiveBanners() {
  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });
    return banners;
  } catch (e) {
    console.error("getActiveBanners error:", e);
    return [];
  }
}

export async function createBanner({ imageUrl, mediaType, title, subtitle, link }) {
  try {
    // Get max order
    const maxOrder = await prisma.banner.aggregate({ _max: { order: true } });
    const newOrder = (maxOrder._max.order ?? -1) + 1;

    const banner = await prisma.banner.create({
      data: {
        imageUrl,
        mediaType: mediaType || "image",
        title: title || null,
        subtitle: subtitle || null,
        link: link || null,
        order: newOrder,
      },
    });
    return { success: true, banner };
  } catch (e) {
    console.error("createBanner error:", e);
    return { success: false, error: e.message };
  }
}

export async function updateBanner(id, data) {
  try {
    const banner = await prisma.banner.update({
      where: { id },
      data: {
        title: data.title ?? undefined,
        subtitle: data.subtitle ?? undefined,
        link: data.link ?? undefined,
        isActive: data.isActive ?? undefined,
        order: data.order ?? undefined,
      },
    });
    return { success: true, banner };
  } catch (e) {
    console.error("updateBanner error:", e);
    return { success: false, error: e.message };
  }
}

export async function deleteBanner(id) {
  try {
    await prisma.banner.delete({ where: { id } });
    return { success: true };
  } catch (e) {
    console.error("deleteBanner error:", e);
    return { success: false, error: e.message };
  }
}

export async function reorderBanners(orderedIds) {
  try {
    for (let i = 0; i < orderedIds.length; i++) {
      await prisma.banner.update({
        where: { id: orderedIds[i] },
        data: { order: i },
      });
    }
    return { success: true };
  } catch (e) {
    console.error("reorderBanners error:", e);
    return { success: false, error: e.message };
  }
}
