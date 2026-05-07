"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";

function generateSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')       // Replace spaces with -
    .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
    .replace(/\-\-+/g, '-');    // Replace multiple - with single -
}

export async function getPosts() {
  const tenant = await getCurrentTenant();
  if (!tenant) return [];
  
  return await prisma.post.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" }
  });
}

export async function getPostById(id) {
  const tenant = await getCurrentTenant();
  if (!tenant) return null;
  
  return await prisma.post.findFirst({
    where: { id, tenantId: tenant.id }
  });
}

export async function createPost(data) {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) return { success: false, error: "Unauthorized" };
    
    let slug = data.slug || generateSlug(data.title);
    
    let exists = await prisma.post.findFirst({ where: { slug, tenantId: tenant.id } });
    if (exists) {
      slug = `${slug}-${Math.random().toString(36).substr(2, 5)}`;
    }
    
    const post = await prisma.post.create({
      data: {
        title: data.title,
        slug,
        content: data.content,
        excerpt: data.excerpt || null,
        imageUrl: data.imageUrl || null,
        isPublished: data.isPublished,
        tenantId: tenant.id,
        publishedAt: data.isPublished ? new Date() : new Date()
      }
    });
    return { success: true, post };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function updatePost(id, data) {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) return { success: false, error: "Unauthorized" };
    
    const post = await prisma.post.findFirst({ where: { id, tenantId: tenant.id } });
    if (!post) return { success: false, error: "Post not found" };
    
    let slug = data.slug || post.slug;
    if (data.title && data.title !== post.title && !data.slug) {
      slug = generateSlug(data.title);
      let exists = await prisma.post.findFirst({ where: { slug, tenantId: tenant.id, id: { not: id } } });
      if (exists) {
        slug = `${slug}-${Math.random().toString(36).substr(2, 5)}`;
      }
    }

    const updated = await prisma.post.update({
      where: { id },
      data: {
        title: data.title,
        slug,
        content: data.content,
        excerpt: data.excerpt || null,
        imageUrl: data.imageUrl || null,
        isPublished: data.isPublished
      }
    });
    return { success: true, post: updated };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function deletePost(id) {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) return { success: false, error: "Unauthorized" };
    
    const post = await prisma.post.findFirst({ where: { id, tenantId: tenant.id } });
    if (!post) return { success: false, error: "Post not found" };
    
    await prisma.post.delete({
      where: { id }
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
