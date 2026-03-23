"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- PACKAGE ACTIONS ---

export async function getPackages() {
  return await prisma.photographyPackage.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function createPackage(data) {
  try {
    const { name, description, price, features, category, timeType, maxCapacity, addons } = data;
    await prisma.photographyPackage.create({
      data: {
        name,
        description,
        price,
        category: category || "STANDARD",
        timeType: timeType || "FULL_DAY",
        maxCapacity: parseInt(maxCapacity) || 1,
        features: Array.isArray(features) ? features : features.split(',').map(f => f.trim()).filter(f => f !== ""),
        addons: addons || [],
      }
    });
    revalidatePath('/admin/packages');
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

export async function updatePackage(id, data) {
  try {
    const { name, description, price, features, category, timeType, maxCapacity, addons } = data;
    await prisma.photographyPackage.update({
      where: { id },
      data: {
        name,
        description,
        price,
        category,
        timeType,
        maxCapacity: parseInt(maxCapacity),
        features: Array.isArray(features) ? features : features.split(',').map(f => f.trim()).filter(f => f !== ""),
        addons
      }
    });
    revalidatePath('/admin/packages');
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

export async function deletePackage(id) {
  try {
    await prisma.photographyPackage.delete({ where: { id } });
    revalidatePath('/admin/packages');
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

// --- RESERVATION ACTIONS ---

export async function getReservations() {
  return await prisma.reservation.findMany({
    include: { packages: true },
    orderBy: { createdAt: 'desc' }
  });
}

export async function checkAvailability(date, packageId, time = null) {
  try {
    const pkg = await prisma.photographyPackage.findUnique({ where: { id: packageId } });
    if (!pkg) return { error: "Paket bulunamadı." };

    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    const nextDate = new Date(selectedDate);
    nextDate.setDate(selectedDate.getDate() + 1);

    // Find confirmed reservations for the same category on that day
    const existingReservations = await prisma.reservation.findMany({
      where: {
        eventDate: {
          gte: selectedDate,
          lt: nextDate
        },
        status: { in: ["CONFIRMED", "COMPLETED"] },
        package: { category: pkg.category }
      }
    });

    if (pkg.timeType === "FULL_DAY" || pkg.timeType === "MORNING" || pkg.timeType === "EVENING") {
      // For these types, we usually count the whole day or the specific period
      // If the user wants specific evening capacity, we'd check eventTime too for "EVENING"
      const count = existingReservations.length;
      return { available: count < pkg.maxCapacity, count, max: pkg.maxCapacity };
    }

    if (pkg.timeType === "SLOT") {
      // For slots, we check the specific time
      const count = existingReservations.filter(r => r.eventTime === time).length;
      return { available: count < pkg.maxCapacity, count, max: pkg.maxCapacity };
    }

    return { available: true };
  } catch (error) {
    return { error: error.message };
  }
}

export async function savePendingReservation(data) {
  try {
    const reservation = await prisma.reservation.create({
      data: {
        brideName: data.brideName,
        bridePhone: data.bridePhone,
        brideEmail: data.brideEmail,
        groomName: data.groomName,
        groomPhone: data.groomPhone,
        groomEmail: data.groomEmail,
        eventDate: new Date(data.date),
        eventTime: data.time,
        packages: {
          connect: data.packageIds.map(id => ({ id }))
        },
        notes: data.notes,
        totalAmount: data.totalAmount,
        paidAmount: data.paidAmount,
        selectedAddons: data.selectedAddons || [], // Save the array of {title, price}
        status: "PENDING",
        paymentStatus: "UNPAID"
      }
    });
    return { success: true, id: reservation.id };
  } catch (error) {
    console.error("Save Reservation Error:", error);
    return { error: error.message };
  }
}

export async function createManualReservation(data) {
  try {
    const { brideName, bridePhone, brideEmail, groomName, groomPhone, groomEmail, eventDate, eventTime, packageIds, notes } = data;
    await prisma.reservation.create({
      data: {
        brideName, bridePhone, brideEmail,
        groomName, groomPhone, groomEmail,
        eventDate: new Date(eventDate),
        eventTime,
        packages: {
          connect: packageIds.map(id => ({ id }))
        },
        notes,
        status: "CONFIRMED", 
        paymentStatus: "UNPAID"
      }
    });
    revalidatePath('/admin/reservations');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

export async function updateReservationStatus(id, status) {
  try {
    await prisma.reservation.update({
      where: { id },
      data: { status }
    });
    revalidatePath('/admin/reservations');
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}
