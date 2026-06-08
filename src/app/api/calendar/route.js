import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { cookies } from "next/headers";

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
    const packageNames = res.packages && res.packages.length > 0 ? res.packages.map(p => p.name).join(", ") : "Bilinmiyor";
    
    // Finansal hesaplamalar
    const totalAmountStr = res.totalAmount || "0";
    const tNum = parseFloat(totalAmountStr.replace(/\./g, "").replace(",", ".").replace(/[^0-9.-]/g, "")) || 0;
    
    let pNum = 0;
    if (res.payments && res.payments.length > 0) {
      pNum = res.payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    } else {
      const paidAmountStr = res.paidAmount || "0";
      pNum = parseFloat(paidAmountStr.replace(/\./g, "").replace(",", ".").replace(/[^0-9.-]/g, "")) || 0;
    }
    
    const remaining = Math.max(0, tNum - pNum);

    // Açıklama satırları
    let descLines = [
      `Paket: ${packageNames}`,
    ];

    if (res.customFieldAnswers && Array.isArray(res.customFieldAnswers)) {
      res.customFieldAnswers.forEach(ans => {
        if (ans.type !== "_hidden" && ans.label && ans.value) {
          descLines.push(`${ans.label}: ${ans.value}`);
        }
      });
    } else if (res.venueName) {
      descLines.push(`Mekan: ${res.venueName}`);
    }

    descLines.push(
      `-- İLETİŞİM --`,
      `Tel 1: ${res.bridePhone || "-"}`,
    );
    if (res.groomPhone) descLines.push(`Tel 2: ${res.groomPhone}`);
    if (res.brideEmail) descLines.push(`E-posta: ${res.brideEmail}`);

    descLines.push(
      `-- FİNANS --`,
      `Toplam: ${totalAmountStr} TL`,
      `Ödenen: ${pNum.toLocaleString('tr-TR')} TL`,
      `Kalan: ${remaining.toLocaleString('tr-TR')} TL`,
      `Durum: ${res.status}`
    );

    if (res.notes) {
      descLines.push(`-- NOTLAR --`);
      // Gerçek satır sonlarını ve \\n stringlerini iCal satır sonuna çevir, boşlukları temizle
      const safeNotes = res.notes.replace(/(?:\\\\n)+/g, '\\n').replace(/(?:\r\n|\n|\r)+/gm, '\\n').trim();
      descLines.push(safeNotes);
    }

    const description = descLines.join('\\n').replace(/(?:\r\n|\n|\r)+/gm, '\\n');
    
    ics.push(
      "BEGIN:VEVENT",
      `UID:res-${res.id}@fiibi.co`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${startDateString}`,
      `DTEND:${endDateString}`,
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

    // Authentication: require admin JWT token
    const cookieStore = await cookies();
    const adminToken = cookieStore.get("admin_token")?.value;
    if (!adminToken) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let payload;
    try {
      payload = await verifyAuth(adminToken);
    } catch {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify the admin belongs to the requested tenant
    if (payload.tenantId !== tenantId) {
      return new NextResponse("Forbidden", { status: 403 });
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
        packages: true,
        payments: true
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
