"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";

// E-Ticaret Ürünlerini Getir
export async function getProducts() {
  const tenant = await getCurrentTenant();
  if (!tenant) return [];
  try {
    return await prisma.product.findMany({
      where: { tenantId: tenant.id },
      include: { category: true },
      orderBy: { createdAt: 'desc' }
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    return [];
  }
}

// Kategorileri Getir
export async function getProductCategories() {
  const tenant = await getCurrentTenant();
  if (!tenant) return [];
  try {
    return await prisma.productCategory.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'desc' }
    });
  } catch (err) {
    return [];
  }
}

// Kategori Kaydet
export async function saveProductCategory(data) {
  const tenant = await getCurrentTenant();
  if (!tenant) return { success: false, error: "Yetkisiz erişim" };
  try {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const category = await prisma.productCategory.create({
      data: { name: data.name, slug, tenantId: tenant.id }
    });
    return { success: true, category };
  } catch (err) {
    return { success: false, error: "Aynı isimde kategori zaten olabilir." };
  }
}

export async function deleteProductCategory(id) {
  const tenant = await getCurrentTenant();
  if (!tenant) return { success: false };
  try {
    await prisma.productCategory.delete({ where: { id, tenantId: tenant.id } });
    return { success: true };
  } catch (err) {
    return { success: false, error: "Silinemedi." };
  }
}

// Ürün Ekle / Güncelle
export async function saveProduct(data) {
  const tenant = await getCurrentTenant();
  if (!tenant) return { success: false, error: "Yetkisiz erişim" };

  try {
    const productData = {
      name: data.name,
      description: data.description,
      detailedDescription: data.detailedDescription || null,
      price: data.price,
      hasStock: data.hasStock,
      stock: data.hasStock ? parseInt(data.stock) || 0 : 0,
      isDigital: data.isDigital,
      downloadUrl: data.downloadUrl || null,
      imageUrls: data.imageUrls || [],
      isActive: data.isActive !== undefined ? data.isActive : true,
      discountPercentage: parseInt(data.discountPercentage) || 0,
      categoryId: data.categoryId || null,
    };

    if (data.id) {
      const product = await prisma.product.update({
        where: { id: data.id, tenantId: tenant.id },
        data: productData,
        include: { category: true }
      });
      return { success: true, product };
    } else {
      const product = await prisma.product.create({
        data: { ...productData, tenantId: tenant.id },
        include: { category: true }
      });
      return { success: true, product };
    }
  } catch (err) {
    console.error("Error saving product:", err);
    return { success: false, error: err.message };
  }
}

// Ürün Sil
export async function deleteProduct(id) {
  const tenant = await getCurrentTenant();
  if (!tenant) return { success: false, error: "Yetkisiz erişim" };

  try {
    await prisma.product.delete({
      where: { id, tenantId: tenant.id }
    });
    return { success: true };
  } catch (err) {
    console.error("Error deleting product:", err);
    return { success: false, error: "Silinemedi. Bu ürüne bağlı geçmiş siparişler olabilir." };
  }
}
