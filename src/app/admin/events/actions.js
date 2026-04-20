"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";

export async function getEvents() {
  const tenant = await getCurrentTenant();
  return await prisma.event.findMany({
    where: { tenantId: tenant?.id || "NONE" },
    orderBy: { date: "desc" },
    include: {
      registrations: true
    }
  });
}

export async function createEvent(data) {
  const tenant = await getCurrentTenant();
  await prisma.event.create({
    data: {
      ...data,
      date: new Date(data.date),
      maxParticipants: parseInt(data.maxParticipants),
      durationMinutes: parseInt(data.durationMinutes),
      price: data.price.toString(),
      tenantId: tenant?.id || "NONE",
    }
  });
  revalidatePath("/admin/events");
  revalidatePath("/");
}

export async function updateEvent(id, data) {
  const tenant = await getCurrentTenant();
  await prisma.event.update({
    where: { id, tenantId: tenant?.id || "NONE" },
    data: {
      ...data,
      date: new Date(data.date),
      maxParticipants: parseInt(data.maxParticipants),
      durationMinutes: parseInt(data.durationMinutes),
      price: data.price.toString(),
    }
  });
  revalidatePath("/admin/events");
  revalidatePath("/");
}

export async function deleteEvent(id) {
  const tenant = await getCurrentTenant();
  await prisma.event.delete({
    where: { id, tenantId: tenant?.id || "NONE" }
  });
  revalidatePath("/admin/events");
  revalidatePath("/");
}

export async function removeRegistration(registrationId) {
  const tenant = await getCurrentTenant();
  await prisma.eventRegistration.delete({
    where: { id: registrationId, tenantId: tenant?.id || "NONE" }
  });
  revalidatePath("/admin/events");
  revalidatePath("/");
}
