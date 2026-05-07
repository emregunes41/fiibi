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
  const tenant = await getCurrentTenant();
  if (!tenant) throw new Error("Unauthorized");
  
  let slug = data.slug || generateSlug(data.title);
  
  let exists = await prisma.post.findFirst({ where: { slug, tenantId: tenant.id } });
  if (exists) {
    slug = `${slug}-${Math.random().toString(36).substr(2, 5)}`;
  }
  
  return await prisma.post.create({
    data: {
      ...data,
      slug,
      tenantId: tenant.id,
      publishedAt: data.isPublished ? new Date() : new Date()
    }
  });
}

export async function updatePost(id, data) {
  const tenant = await getCurrentTenant();
  if (!tenant) throw new Error("Unauthorized");
  
  const post = await prisma.post.findFirst({ where: { id, tenantId: tenant.id } });
  if (!post) throw new Error("Post not found");
  
  let slug = data.slug || post.slug;
  if (data.title && data.title !== post.title && !data.slug) {
    slug = generateSlug(data.title);
    let exists = await prisma.post.findFirst({ where: { slug, tenantId: tenant.id, id: { not: id } } });
    if (exists) {
      slug = `${slug}-${Math.random().toString(36).substr(2, 5)}`;
    }
  }

  return await prisma.post.update({
    where: { id },
    data: {
      ...data,
      slug
    }
  });
}

export async function deletePost(id) {
  const tenant = await getCurrentTenant();
  if (!tenant) throw new Error("Unauthorized");
  
  const post = await prisma.post.findFirst({ where: { id, tenantId: tenant.id } });
  if (!post) throw new Error("Post not found");
  
  return await prisma.post.delete({
    where: { id }
  });
}
