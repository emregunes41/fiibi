"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "../actions/send-welcome";
import { sendReservationSuccessEmail } from "../actions/send-reservation-success";
import { notifyReservationSuccess } from "../actions/notify";
import { sendDriveLinkEmail } from "../actions/send-drive-link";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function uploadAlbumImage(formData) {
  try {
    const file = formData.get('file');
    if (!file) return { error: "Dosya bulunamadı." };

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'albums');
    await fs.mkdir(uploadDir, { recursive: true });

    const ext = path.extname(file.name) || '.jpg';
    const filename = `${crypto.randomBytes(16).toString('hex')}${ext}`;
    const filepath = path.join(uploadDir, filename);

    await fs.writeFile(filepath, buffer);
    
    return { success: true, url: `/uploads/albums/${filename}` };
  } catch (err) {
    return { error: err.message };
  }
}

export async function uploadHeroBg(formData) {
  try {
    const file = formData.get('file');
    if (!file) return { error: "Dosya bulunamadı." };

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'hero');
    await fs.mkdir(uploadDir, { recursive: true });

    const ext = path.extname(file.name) || '.mp4';
    const filename = `hero_bg${ext}`;
    const filepath = path.join(uploadDir, filename);

    await fs.writeFile(filepath, buffer);
    
    return { success: true, url: `/uploads/hero/${filename}` };
  } catch (err) {
    return { error: err.message };
  }
}

// --- ALBUM MODEL ACTIONS ---

export async function getAlbumModels() {
  return await prisma.albumModel.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function createAlbumModel(data) {
  try {
    const { name, imageUrl, description } = data;
    await prisma.albumModel.create({
      data: { name, imageUrl, description }
    });
    revalidatePath('/admin/album-models');
    revalidatePath('/profile');
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

export async function deleteAlbumModel(id) {
  try {
    await prisma.albumModel.delete({
      where: { id }
    });
    revalidatePath('/admin/album-models');
    revalidatePath('/profile');
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

export async function selectAlbumModel(reservationId, albumModelId) {
  try {
    await prisma.reservation.update({
      where: { id: reservationId },
      data: { albumModelId }
    });
    revalidatePath('/profile');
    revalidatePath('/admin/reservations');
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

// --- PACKAGE ACTIONS ---

export async function getPackages() {
  return await prisma.photographyPackage.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function createPackage(data) {
  try {
    const { name, description, price, features, category, timeType, maxCapacity, addons, deliveryTimeDays, postSelectionDays, customFields, availableSlots } = data;
    await prisma.photographyPackage.create({
      data: {
        name,
        description,
        price,
        category: category || "STANDARD",
        timeType: timeType || "FULL_DAY",
        maxCapacity: parseInt(maxCapacity) || 1,
        deliveryTimeDays: parseInt(deliveryTimeDays) || 14,
        postSelectionDays: parseInt(postSelectionDays) || 0,
        features: Array.isArray(features) ? features : features.split(',').map(f => f.trim()).filter(f => f !== ""),
        addons: addons || [],
        customFields: customFields || [],
        availableSlots: availableSlots || [],
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
    const { name, description, price, features, category, timeType, maxCapacity, addons, deliveryTimeDays, postSelectionDays, customFields, availableSlots } = data;
    await prisma.photographyPackage.update({
      where: { id },
      data: {
        name,
        description,
        price,
        category,
        timeType,
        maxCapacity: parseInt(maxCapacity),
        deliveryTimeDays: parseInt(deliveryTimeDays) || 14,
        postSelectionDays: parseInt(postSelectionDays) || 0,
        features: Array.isArray(features) ? features : features.split(',').map(f => f.trim()).filter(f => f !== ""),
        addons,
        customFields: customFields || [],
        availableSlots: availableSlots || [],
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

export async function softDeleteReservation(id) {
  try {
    await prisma.reservation.update({
      where: { id },
      data: { status: "DELETED" }
    });
    revalidatePath('/admin/reservations');
    return { success: true };
  } catch (error) {
    console.error("Soft Delete Reservation Error:", error);
    return { error: error.message };
  }
}

export async function hardDeleteReservation(id) {
  try {
    // Payments are cascade deleted via schema, but let's be explicit
    await prisma.payment.deleteMany({ where: { reservationId: id } });
    await prisma.reservation.delete({ where: { id } });
    revalidatePath('/admin/reservations');
    return { success: true };
  } catch (error) {
    console.error("Delete Reservation Error:", error);
    return { error: error.message };
  }
}

export async function getReservations() {
  return await prisma.reservation.findMany({
    include: { packages: true, payments: { orderBy: { createdAt: 'desc' } }, albumModel: true },
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
        // Müşterinin checkout sırasında belirlediği şifreyi kullan
        const password = data.password || Math.random().toString(36).slice(-8);
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
        // Hoş geldin e-postası gönderilmiyor — şifreyi müşteri kendisi belirledi
      }
      userId = user.id;
    }

    const reservation = await prisma.reservation.create({
      data: {
        ...(userId ? { user: { connect: { id: userId } } } : {}),
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
        selectedAddons: data.selectedAddons || [],
        customFieldAnswers: data.customFieldAnswers || [],
        paymentPreference: data.paymentPreference || null,
        status: "PENDING",
        paymentStatus: "UNPAID",
        workflowStatus: "PENDING",
        deliveryDate: deliveryDateObj
      }
    });

    // Send confirmation email
    await notifyReservationSuccess(data.brideEmail, data.bridePhone, data.brideName, data.date, data.totalAmount);

    return { success: true, id: reservation.id };
  } catch (error) {
    console.error("Save Reservation Error:", error);
    return { error: error.message };
  }
}

export async function createManualReservation(data) {
  try {
    const { brideName, bridePhone, brideEmail, groomName, groomPhone, groomEmail, eventDate, eventTime, packageIds, notes, selectedAddons = [], customFieldAnswers = [], totalAmount = "" } = data;
    
    const packagesData = await prisma.photographyPackage.findMany({
      where: { id: { in: packageIds } }
    });
    const maxDays = packagesData.reduce((max, pkg) => Math.max(max, pkg.deliveryTimeDays || 14), 0);
    const eventDateObj = new Date(eventDate);
    const deliveryDateObj = new Date(eventDateObj);
    deliveryDateObj.setDate(deliveryDateObj.getDate() + maxDays);

    // Auto-inject date/time info into customFieldAnswers for calendar & detail display
    const TIME_LABELS = { SLOT_2H: "2 Saatlik Çekim", SLOT_4H: "4 Saatlik Çekim", WEDDING: "Düğün Boyunca", FULL_DAY: "Tam Gün", GUNDUZ: "Gündüz", AKSAM: "Akşam" };
    const ALL_SLOTS = [
      { v: "08:00", l: "08:00 – 10:00" }, { v: "10:00", l: "10:00 – 12:00" }, { v: "12:00", l: "12:00 – 14:00" },
      { v: "14:00", l: "14:00 – 16:00" }, { v: "16:00", l: "16:00 – 18:00" }, { v: "18:00", l: "18:00 – 20:00" }, { v: "20:00", l: "20:00 – 22:00" },
      { v: "08:00-12:00", l: "08:00 – 12:00" }, { v: "10:00-14:00", l: "10:00 – 14:00" }, { v: "12:00-16:00", l: "12:00 – 16:00" },
      { v: "14:00-18:00", l: "14:00 – 18:00" }, { v: "16:00-20:00", l: "16:00 – 20:00" }, { v: "18:00-22:00", l: "18:00 – 22:00" },
    ];
    const enrichedCFA = [...customFieldAnswers];
    // Add date/time for ALL selected packages 
    packagesData.forEach(pkg => {
      const dateStr = eventDateObj.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" });
      enrichedCFA.push({ label: "Etkinlik Tarihi", value: dateStr, type: "text", packageName: pkg.name });
      enrichedCFA.push({ label: "_eventDateISO", value: eventDate, type: "_hidden", packageName: pkg.name });
      if (eventTime) {
        const slotLabel = ALL_SLOTS.find(s => s.v === eventTime)?.l || TIME_LABELS[eventTime] || eventTime;
        enrichedCFA.push({ label: "Saat Dilimi", value: slotLabel, type: "text", packageName: pkg.name });
      }
    });

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
        await notifyWelcome(brideEmail, bridePhone, brideName, password);
      }
      userId = user.id;
    }

    await prisma.reservation.create({
      data: {
        ...(userId ? { user: { connect: { id: userId } } } : {}),
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
        customFieldAnswers: enrichedCFA,
        status: "CONFIRMED", 
        paymentStatus: "UNPAID",
        workflowStatus: "PENDING",
        deliveryDate: deliveryDateObj
      }
    });
    
    // Send confirmation email
    await notifyReservationSuccess(brideEmail, bridePhone, brideName, eventDate, totalAmount);

    revalidatePath('/admin/reservations');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

export async function updateReservation(id, data) {
  try {
    const { brideName, bridePhone, brideEmail, groomName, groomPhone, groomEmail, eventDate, eventTime, packageIds, notes, selectedAddons = [], totalAmount = "" } = data;
    
    const packagesData = await prisma.photographyPackage.findMany({
      where: { id: { in: packageIds } }
    });
    const maxDays = packagesData.reduce((max, pkg) => Math.max(max, pkg.deliveryTimeDays || 14), 0);
    const eventDateObj = new Date(eventDate);
    const deliveryDateObj = new Date(eventDateObj);
    deliveryDateObj.setDate(deliveryDateObj.getDate() + maxDays);

    await prisma.reservation.update({
      where: { id },
      data: {
        brideName, bridePhone, brideEmail,
        groomName, groomPhone, groomEmail,
        eventDate: eventDateObj,
        eventTime,
        packages: {
          set: packageIds.map(id => ({ id }))
        },
        notes,
        totalAmount,
        selectedAddons,
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
    const reservation = await prisma.reservation.update({
      where: { id },
      data: { 
        workflowStatus,
        deliveryLink 
      }
    });

    // If a delivery link was added or updated, send email
    if (deliveryLink && deliveryLink.trim() !== "") {
      await sendDriveLinkEmail(reservation.brideEmail, reservation.brideName, deliveryLink);
    }

    revalidatePath('/admin/reservations');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

export async function lockSelection(reservationId) {
  try {
    await prisma.reservation.update({
      where: { id: reservationId },
      data: { 
        selectionLocked: true,
        workflowStatus: "PREPARING"
      }
    });
    revalidatePath('/admin/reservations');
    revalidatePath('/profile');
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

// --- MONTHLY PRICE ACTIONS ---

export async function getMonthlyPrices(category, year) {
  try {
    return await prisma.monthlyPriceConfig.findMany({
      where: { 
        category: category,
        year: parseInt(year)
      }
    });
  } catch (error) {
    console.error("Get Monthly Prices Error:", error);
    return [];
  }
}

export async function updateMonthlyPrice(data) {
  try {
    const { category, month, year, minPrice, discountPercentage } = data;
    const m = parseInt(month);
    const y = parseInt(year);
    const dp = parseInt(discountPercentage) || 0;
    
    // Prisma upsert with specific fields
    await prisma.monthlyPriceConfig.upsert({
      where: {
        category_month_year: {
          category,
          month: m,
          year: y
        }
      },
      update: { 
        discountPercentage: dp,
        ...(minPrice !== undefined && minPrice !== null ? { minPrice: parseInt(minPrice) } : {})
      },
      create: {
        category,
        month: m,
        year: y,
        discountPercentage: dp,
        minPrice: minPrice ? parseInt(minPrice) : null
      }
    });
    revalidatePath('/admin/packages');
    return { success: true };
  } catch (error) {
    console.error("Update Monthly Price Error:", error);
    return { error: error.message };
  }
}

// --- SLOT AVAILABILITY ---

export async function getSlotAvailability(date, categoryValue) {
  try {
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(selectedDate);
    nextDate.setDate(selectedDate.getDate() + 1);

    const reservations = await prisma.reservation.findMany({
      where: {
        eventDate: { gte: selectedDate, lt: nextDate },
        status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
        packages: { some: { category: categoryValue } }
      },
      include: { packages: true }
    });

    const packages = await prisma.photographyPackage.findMany({
      where: { category: categoryValue, isActive: true }
    });

    const slotCounts = {};
    for (const res of reservations) {
      const t = res.eventTime || "FULL_DAY";
      slotCounts[t] = (slotCounts[t] || 0) + 1;
    }

    const maxCap = packages.reduce((max, p) => Math.max(max, p.maxCapacity || 1), 1);

    return { slotCounts, maxCapacity: maxCap, totalReservations: reservations.length };
  } catch (error) {
    console.error("Slot Availability Error:", error);
    return { slotCounts: {}, maxCapacity: 1, totalReservations: 0 };
  }
}

// --- SITE CONFIG ACTIONS ---

export async function getSiteConfig() {
  try {
    let config = await prisma.globalSettings.findUnique({
      where: { id: "global-settings" }
    });
    
    if (!config) {
      config = await prisma.globalSettings.create({
        data: { id: "global-settings" }
      });
    }
    
    return config;
  } catch (error) {
    console.error("Get Site Config Error:", error);
    // Return a default object if DB fails to prevent UI crash
    return {
      heroTitle: "Anları Sanata \n Dönüştürüyoruz",
      heroSubtitle: "Premium Photography Service",
      address: "Moda, Kadıköy / İstanbul",
      phone: "+90 555 000 00 00",
      email: "hello@pinowed.com",
      instagram: "",
      whatsapp: "",
      cashPromoText: "",
      heroBgType: "video",
      heroBgUrl: "/assets/hero.mp4",
      heroBgColor: "#000000"
    };
  }
}

export async function updateSiteConfig(data) {
  try {
    const { heroTitle, heroSubtitle, address, phone, email, instagram, whatsapp, cashPromoText, heroBgType, heroBgUrl, heroBgColor, contractText, emailEnabled, smsEnabled, resendApiKey, netgsmUsercode, netgsmPassword, netgsmMsgHeader, notifyReservation, notifyPayment, notifyReminder, notifyPhotosReady } = data;
    await prisma.globalSettings.update({
      where: { id: "global-settings" },
      data: {
        heroTitle,
        heroSubtitle,
        address,
        phone,
        email,
        instagram,
        whatsapp,
        cashPromoText: cashPromoText || "",
        heroBgType: heroBgType || "video",
        heroBgUrl: heroBgUrl || "/assets/hero.mp4",
        heroBgColor: heroBgColor || "#000000",
        contractText: contractText || "",
        emailEnabled: emailEnabled ?? true,
        smsEnabled: smsEnabled ?? false,
        resendApiKey: resendApiKey || "",
        netgsmUsercode: netgsmUsercode || "",
        netgsmPassword: netgsmPassword || "",
        netgsmMsgHeader: netgsmMsgHeader || "",
        notifyReservation: notifyReservation ?? true,
        notifyPayment: notifyPayment ?? true,
        notifyReminder: notifyReminder ?? true,
        notifyPhotosReady: notifyPhotosReady ?? true,
      }
    });
    revalidatePath('/');
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    console.error("Update Site Config Error:", error);
    return { error: error.message };
  }
}
export async function resetUserPassword(userId, newPassword) {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });
    revalidatePath('/admin/members');
    return { success: true };
  } catch (error) {
    console.error("Reset Password Error:", error);
    return { error: error.message };
  }
}

// --- PAYMENT ACTIONS ---

export async function addPayment(reservationId, data) {
  try {
    const { amount, method, note } = data;
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return { error: "Geçerli bir tutar girin." };
    }

    await prisma.payment.create({
      data: {
        reservationId,
        amount: parsedAmount,
        method: method || "CASH",
        note: note || null,
      }
    });

    // Recalculate paidAmount
    const payments = await prisma.payment.findMany({ where: { reservationId } });
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    // Get reservation to check totalAmount
    const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } });
    const totalAmount = parseFloat(reservation.totalAmount?.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '') || '0');

    // Determine payment status
    let paymentStatus = "UNPAID";
    if (totalPaid >= totalAmount && totalAmount > 0) {
      paymentStatus = "PAID";
    } else if (totalPaid > 0) {
      paymentStatus = "PARTIAL";
    }

    await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        paidAmount: totalPaid.toString(),
        paymentStatus,
      }
    });

    revalidatePath('/admin/reservations');
    return { success: true };
  } catch (error) {
    console.error("Add Payment Error:", error);
    return { error: error.message };
  }
}

export async function deletePayment(paymentId) {
  try {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return { error: "Ödeme bulunamadı." };

    await prisma.payment.delete({ where: { id: paymentId } });

    // Recalculate
    const payments = await prisma.payment.findMany({ where: { reservationId: payment.reservationId } });
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    const reservation = await prisma.reservation.findUnique({ where: { id: payment.reservationId } });
    const totalAmount = parseFloat(reservation.totalAmount?.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '') || '0');

    let paymentStatus = "UNPAID";
    if (totalPaid >= totalAmount && totalAmount > 0) {
      paymentStatus = "PAID";
    } else if (totalPaid > 0) {
      paymentStatus = "PARTIAL";
    }

    await prisma.reservation.update({
      where: { id: payment.reservationId },
      data: {
        paidAmount: totalPaid.toString(),
        paymentStatus,
      }
    });

    revalidatePath('/admin/reservations');
    return { success: true };
  } catch (error) {
    console.error("Delete Payment Error:", error);
    return { error: error.message };
  }
}

export async function convertToCreditCardPermanent(reservationId, newTotalStr) {
  try {
    await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        paymentPreference: "CREDIT_CARD",
        totalAmount: newTotalStr
      }
    });
    revalidatePath('/profile');
    revalidatePath('/admin/reservations');
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

export async function addReservationExtraFee(reservationId, amount, note) {
  try {
    const r = await prisma.reservation.findUnique({ where: { id: reservationId } });
    if (!r) throw new Error("Reservation not found");

    const currentTotal = parseFloat(r.totalAmount?.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '') || '0');
    let addAmount = parseFloat(amount || "0");
    
    // Auto-apply %15 if the client is permanently on CREDIT_CARD mode, since the input is strictly cash based
    if (r.paymentPreference === "CREDIT_CARD") {
        addAmount = Math.round(addAmount * 1.15);
    }
    
    const newTotalStr = (currentTotal + addAmount).toLocaleString('tr-TR') + '₺';
    
    // Combine existing notes with new note
    const timeStr = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    const newNotes = r.notes 
      ? `${r.notes}\n\n[${timeStr} Ekstra] ${note} (+${addAmount.toLocaleString('tr-TR')}₺)`
      : `[${timeStr} Ekstra] ${note} (+${addAmount.toLocaleString('tr-TR')}₺)`;

    // Push to selectedAddons so the price goes into line items
    const currentAddons = r.selectedAddons && Array.isArray(r.selectedAddons) ? r.selectedAddons : [];
    currentAddons.push({
      title: note,
      price: addAmount.toString(),
      isExtraFee: true
    });

    await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        totalAmount: newTotalStr,
        notes: newNotes,
        selectedAddons: currentAddons
      }
    });

    revalidatePath('/profile');
    revalidatePath('/admin/reservations');
    return { success: true };
  } catch (error) {
    console.error("Add Extra Fee Error:", error);
    return { error: error.message };
  }
}
