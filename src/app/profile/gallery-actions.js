"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getClientGalleries(userId) {
  try {
    const galleries = await prisma.photoGallery.findMany({
      where: {
        isDelivered: true,
        reservation: { userId }
      },
      include: {
        reservation: {
          include: { packages: true }
        },
        photos: {
          orderBy: { photoNumber: 'asc' }
        }
      }
    });

    return { success: true, galleries };
  } catch (error) {
    return { error: error.message };
  }
}

export async function togglePhotoSelection(photoId, isSelected) {
  try {
    await prisma.photo.update({
      where: { id: photoId },
      data: { isSelected }
    });
    revalidatePath('/profile/gallery');
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

export async function completeSelection(galleryId, reservationId, coupleName, selectedPhotoNames) {
  try {
    // 1. Seçim metnini rezervasyona kaydet (workflowStatus değişmeden bekler)
    await prisma.reservation.update({
      where: { id: reservationId },
      data: { selectedPhotos: selectedPhotoNames.join(', ') }
    });

    // 2. Admine sistem içi bildirim gönder
    const message = `${coupleName} fotoğraf seçimini tamamladı. Seçilenler: ${selectedPhotoNames.join(', ')}`;
    await prisma.adminNotification.create({
      data: {
        type: "SELECTION_DONE",
        message: message
      }
    });

    revalidatePath('/profile/gallery');
    revalidatePath('/profile');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}
