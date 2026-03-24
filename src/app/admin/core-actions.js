"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "../actions/send-welcome";

// --- PACKAGE ACTIONS ---

export async function getPackages() {
  return await prisma.photographyPackage.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function createPackage(data) {
  try {
    const { name, description, price, features, category, timeType, maxCapacity, addons, deliveryTimeDays } = data;
    await prisma.photographyPackage.create({
      data: {
        name,
        description,
        price,
        category: category || "STANDARD",
        timeType: timeType || "FULL_DAY",
        maxCapacity: parseInt(maxCapacity) || 1,
        deliveryTimeDays: parseInt(deliveryTimeDays) || 14,
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
    const { name, description, price, features, category, timeType, maxCapacity, addons, deliveryTimeDays } = data;
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
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Delete Package Error:", error);
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

    if (pkg.timeType === "FULL_DAY" || pkg.timeType === "MORNING" || pkg.timeType === "EVENING" || pkg.timeType === "FIVE_HOURS") {
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
    const packagesData = await prisma.photographyPackage.findMany({
      where: { id: { in: data.packageIds } }
    });
    const maxDays = packagesData.reduce((max, pkg) => Math.max(max, pkg.deliveryTimeDays || 14), 0);
    const eventDateObj = new Date(data.date);
    const deliveryDateObj = new Date(eventDateObj);
    deliveryDateObj.setDate(deliveryDateObj.getDate() + maxDays);

    // Hesap kontrolü ve otomatik oluşturma
    let userId = null;
    if (data.brideEmail) {
      let user = await prisma.user.findUnique({ where: { email: data.brideEmail } });
      if (!user) {
        const password = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(password, 10);
        user = await prisma.user.create({
          data: {
            name: data.brideName,
            email: data.brideEmail,
            phone: data.bridePhone,
            password: hashedPassword,
            role: "MEMBER"
          }
        });
        await sendWelcomeEmail(data.brideEmail, data.brideName, password);
      }
      userId = user.id;
    }

    const reservation = await prisma.reservation.create({
      data: {
        userId: userId,
        brideName: data.brideName,
        bridePhone: data.bridePhone,
        brideEmail: data.brideEmail,
        groomName: data.groomName,
        groomPhone: data.groomPhone,
        groomEmail: data.groomEmail,
        eventDate: eventDateObj,
        eventTime: data.time,
        packages: {
          connect: data.packageIds.map(id => ({ id }))
        },
        notes: data.notes,
        totalAmount: data.totalAmount,
        paidAmount: data.paidAmount,
        selectedAddons: data.selectedAddons || [], // Save the array of {title, price}
        status: "PENDING",
        paymentStatus: "UNPAID",
        workflowStatus: "PENDING",
        deliveryDate: deliveryDateObj
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
    const { brideName, bridePhone, brideEmail, groomName, groomPhone, groomEmail, eventDate, eventTime, packageIds, notes, selectedAddons = [], totalAmount = "" } = data;
    
    const packagesData = await prisma.photographyPackage.findMany({
      where: { id: { in: packageIds } }
    });
    const maxDays = packagesData.reduce((max, pkg) => Math.max(max, pkg.deliveryTimeDays || 14), 0);
    const eventDateObj = new Date(eventDate);
    const deliveryDateObj = new Date(eventDateObj);
    deliveryDateObj.setDate(deliveryDateObj.getDate() + maxDays);

    // Hesap kontrolü ve otomatik oluşturma
    let userId = null;
    if (brideEmail) {
      let user = await prisma.user.findUnique({ where: { email: brideEmail } });
      if (!user) {
        const password = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(password, 10);
        user = await prisma.user.create({
          data: {
            name: brideName,
            email: brideEmail,
            phone: bridePhone,
            password: hashedPassword,
            role: "MEMBER"
          }
        });
        await sendWelcomeEmail(brideEmail, brideName, password);
      }
      userId = user.id;
    }

    await prisma.reservation.create({
      data: {
        userId: userId,
        brideName, bridePhone, brideEmail,
        groomName, groomPhone, groomEmail,
        eventDate: eventDateObj,
        eventTime,
        packages: {
          connect: packageIds.map(id => ({ id }))
        },
        notes,
        totalAmount,
        selectedAddons,
        status: "CONFIRMED", 
        paymentStatus: "UNPAID",
        workflowStatus: "PENDING",
        deliveryDate: deliveryDateObj
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
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

export async function updateReservationWorkflow(id, data) {
  try {
    const { workflowStatus, deliveryLink } = data;
    await prisma.reservation.update({
      where: { id },
      data: { 
        workflowStatus,
        deliveryLink 
      }
    });
    revalidatePath('/admin/reservations');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}
