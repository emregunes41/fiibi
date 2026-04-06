"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendGalleryReadyEmail } from "../actions/send-gallery-ready";
import { requireAdmin } from "@/lib/auth";

export async function getReservationGallery(reservationId) {
  const auth = await requireAdmin();
  if (auth?.error) return auth;
  try {
    let gallery = await prisma.photoGallery.findUnique({
      where: { reservationId },
      include: { photos: { orderBy: { createdAt: 'desc' } } }
    });

    if (!gallery) {
      gallery = await prisma.photoGallery.create({
        data: { reservationId },
        include: { photos: true }
      });
    }
    return { success: true, gallery };
  } catch (error) {
    return { error: error.message };
  }
}

export async function addPhotoToGallery(galleryId, url, originalName) {
  const auth = await requireAdmin();
  if (auth?.error) return auth;
  try {
    // Fotoğraf numarasını belirle
    const maxPhoto = await prisma.photo.findFirst({
      where: { galleryId },
      orderBy: { photoNumber: 'desc' }
    });
    const photoNumber = maxPhoto ? maxPhoto.photoNumber + 1 : 1;

    const photo = await prisma.photo.create({
      data: {
        galleryId,
        url,
        originalName: originalName || `IMG_${photoNumber}`,
        photoNumber
      }
    });

    revalidatePath('/admin/reservations/[id]/gallery', 'page');
    return { success: true, photo };
  } catch (error) {
    return { error: error.message };
  }
}

export async function deletePhoto(photoId) {
  const auth = await requireAdmin();
  if (auth?.error) return auth;
  try {
    await prisma.photo.delete({ where: { id: photoId } });
    revalidatePath('/admin/reservations/[id]/gallery', 'page');
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

export async function toggleGalleryDelivery(galleryId, isDelivered) {
  const auth = await requireAdmin();
  if (auth?.error) return auth;
  try {
    const gallery = await prisma.photoGallery.update({
      where: { id: galleryId },
      data: { 
        isDelivered, 
        deliveredAt: isDelivered ? new Date() : null 
      },
      include: {
        reservation: true
      }
    });

    if (isDelivered && gallery.reservation.brideEmail) {
      // Çifte galerinin hazır olduğuna dair mail gönder
      const domain = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
      await sendGalleryReadyEmail(
        gallery.reservation.brideEmail, 
        gallery.reservation.brideName, 
        `${domain}/profile/gallery`
      );
    }

    revalidatePath('/admin/reservations/[id]/gallery', 'page');
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}
