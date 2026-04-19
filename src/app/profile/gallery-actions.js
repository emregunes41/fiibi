"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";

export async function getClientGalleries() {
  const auth = await requireUser();
  if (auth?.error) return auth;
  const userId = auth.session.userId;

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
  const auth = await requireUser();
  if (auth?.error) return auth;

  try {
    // IDOR Check: Ensure the photo belongs to a gallery of a reservation owned by the user
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: { gallery: { include: { reservation: true } } }
    });

    if (!photo || photo.gallery.reservation.userId !== auth.session.userId) {
      return { error: "Yetkisiz islem!" };
    }

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
  const auth = await requireUser();
  if (auth?.error) return auth;

  try {
    // IDOR check
    const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } });
    if (!reservation || reservation.userId !== auth.session.userId) {
      return { error: "Yetkisiz islem." };
    }

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

    // 3. Admine email gönder
    try {
      const { notifyAdminPhotoSelectionSubmitted } = await import("@/app/actions/admin-notifications");
      await notifyAdminPhotoSelectionSubmitted({
        brideName: reservation.brideName,
        bridePhone: reservation.bridePhone,
        selectedCount: selectedPhotoNames.length,
        reservationId
      });
    } catch (e) { console.error("Admin notify error:", e); }

    revalidatePath('/profile/gallery');
    revalidatePath('/profile');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}
