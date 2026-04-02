"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Kategori (Konsept) oluştururken stringi slug formata çevirme yardımcı fonksiyonu
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')           // Boşlukları tireyle değiştir
    .replace(/[^\w\-]+/g, '')       // Alfanümerik olmayanları sil
    .replace(/\-\-+/g, '-')         // Çoklu tireleri teke indir
    .replace(/^-+/, '')             // Baştaki tireleri sil
    .replace(/-+$/, '');            // Sondaki tireleri sil
}

export async function getPortfolioCategories() {
  try {
    const categories = await prisma.portfolioCategory.findMany({
      include: {
        photos: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, categories };
  } catch (error) {
    return { error: error.message };
  }
}

export async function createPortfolioCategory(name) {
  try {
    const slug = slugify(name) || `kategori-${Date.now()}`;
    const category = await prisma.portfolioCategory.create({
      data: {
        name,
        slug
      }
    });
    
    revalidatePath("/admin/portfolio");
    revalidatePath("/gallery");
    return { success: true, category };
  } catch (error) {
    // Özel hata (Örn: P2002 Unique constraint failed = aynı slug var)
    if (error.code === 'P2002') {
      return { error: "Bu isimde bir kategori zaten mevcut." };
    }
    return { error: error.message };
  }
}

export async function deletePortfolioCategory(id) {
  try {
    await prisma.portfolioCategory.delete({
      where: { id }
    });
    
    revalidatePath("/admin/portfolio");
    revalidatePath("/gallery");
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

export async function addPhotoToPortfolio(categoryId, url, publicId) {
  try {
    const photo = await prisma.portfolioPhoto.create({
      data: {
        categoryId,
        url,
        publicId: publicId || null
      }
    });
    
    revalidatePath("/admin/portfolio");
    revalidatePath("/gallery");
    return { success: true, photo };
  } catch (error) {
    return { error: error.message };
  }
}

export async function deletePortfolioPhoto(id) {
  try {
    await prisma.portfolioPhoto.delete({
      where: { id }
    });
    
    revalidatePath("/admin/portfolio");
    revalidatePath("/gallery");
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}
