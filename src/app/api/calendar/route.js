import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// iCal format helper function
function generateICS(reservations, businessName) {
  let ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Fiibi//SaaS Platform//TR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${businessName} Rezervasyonları`,
    "X-WR-TIMEZONE:Europe/Istanbul",
  ];

  reservations.forEach(res => {
    // Basic date parsing assuming eventDate is stored at midnight UTC or local time
    if (!res.eventDate) return;
    
    const date = new Date(res.eventDate);
    const startYear = date.getFullYear();
    const startMonth = String(date.getMonth() + 1).padStart(2, "0");
    const startDay = String(date.getDate()).padStart(2, "0");
    
    // Default to 10:00 AM if no time, else parse time (e.g. "14:00")
    let startHours = "10";
    let startMinutes = "00";
    
    if (res.eventTime && res.eventTime.includes(":")) {
      [startHours, startMinutes] = res.eventTime.split(":");
    }
    
    const startDateString = `${startYear}${startMonth}${startDay}T${startHours}${startMinutes}00`;
    
    // End time (assume 2 hours later for simplicity, or 23:59 if full day)
    let endHours = String(parseInt(startHours) + 2).padStart(2, "0");
    const endDateString = `${startYear}${startMonth}${startDay}T${endHours}${startMinutes}00`;

    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}T${String(now.getHours()).padStart(2,"0")}${String(now.getMinutes()).padStart(2,"0")}00Z`;

    // Construct event details
    const summary = `${res.brideName} & ${res.groomName || "Rezervasyon"}`;
    const description = `Paket: ${res.package?.name || "Bilinmiyor"}\\nTelefon: ${res.bridePhone}\\nDurum: ${res.status}`;
    
    ics.push(
      "BEGIN:VEVENT",
      `UID:res-${res.id}@fiibi.co`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=Europe/Istanbul:${startDateString}`,
      `DTEND;TZID=Europe/Istanbul:${endDateString}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      "END:VEVENT"
    );
  });

  ics.push("END:VCALENDAR");
  return ics.join("\r\n");
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("t");

    if (!tenantId) {
      return new NextResponse("Missing tenant ID", { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      return new NextResponse("Tenant not found", { status: 404 });
    }

    // Get all approved/pending reservations (ignore rejected/cancelled)
    const reservations = await prisma.reservation.findMany({
      where: {
        tenantId,
        status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] }
      },
      include: {
        package: true
      }
    });

    const icsContent = generateICS(reservations, tenant.businessName);

    return new NextResponse(icsContent, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="reservations.ics"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });

  } catch (error) {
    console.error("Calendar export error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
