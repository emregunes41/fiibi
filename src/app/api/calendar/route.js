import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * iCal Calendar Feed
 *
 * Google/Apple Takvim bu URL'yi periyodik olarak çeker.
 * Auth: URL'deki ?token= parametresi ile (cookie kullanılamaz çünkü
 * Google'ın sunucuları bizim siteye giriş yapamaz).
 *
 * URL formatı: /api/calendar?token=XXXXX
 */

// iCal format helper
function generateICS(reservations, businessName) {
  let ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Fiibi//SaaS Platform//TR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${businessName} Rezervasyonları`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT10M",
    "X-PUBLISHED-TTL:PT10M",
    "X-WR-TIMEZONE:Europe/Istanbul",
    // Timezone definition for correct display
    "BEGIN:VTIMEZONE",
    "TZID:Europe/Istanbul",
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:+0300",
    "TZOFFSETTO:+0300",
    "TZNAME:TRT",
    "END:STANDARD",
    "END:VTIMEZONE",
  ];

  reservations.forEach((res) => {
    if (!res.eventDate) return;

    const date = new Date(res.eventDate);
    const startYear = date.getFullYear();
    const startMonth = String(date.getMonth() + 1).padStart(2, "0");
    const startDay = String(date.getDate()).padStart(2, "0");

    // Saat bilgisi parse
    let startHours = "10";
    let startMinutes = "00";

    if (res.eventTime && res.eventTime.includes(":")) {
      [startHours, startMinutes] = res.eventTime.split(":");
    }

    const startDateString = `${startYear}${startMonth}${startDay}T${startHours.padStart(2, "0")}${startMinutes.padStart(2, "0")}00`;

    // Bitiş saati (varsayılan 2 saat sonra)
    let endH = parseInt(startHours) + 2;
    if (endH > 23) endH = 23;
    const endDateString = `${startYear}${startMonth}${startDay}T${String(endH).padStart(2, "0")}${startMinutes.padStart(2, "0")}00`;

    const now = new Date();
    const stamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}T${String(now.getUTCHours()).padStart(2, "0")}${String(now.getUTCMinutes()).padStart(2, "0")}${String(now.getUTCSeconds()).padStart(2, "0")}Z`;

    // Etkinlik başlığı
    const summary = `${res.brideName}${res.groomName ? ` & ${res.groomName}` : ""}`;
    const packageNames = res.packages?.length > 0 ? res.packages.map((p) => p.name).join(", ") : "";

    // Finansal hesaplama
    const tNum = parseTotalAmount(res.totalAmount);
    let pNum = 0;
    if (res.payments?.length > 0) {
      pNum = res.payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    } else {
      pNum = parseTotalAmount(res.paidAmount);
    }
    const remaining = Math.max(0, tNum - pNum);

    // Durum etiketi
    const statusLabel = {
      PENDING: "⏳ Bekliyor", CONFIRMED: "✅ Onaylı",
      COMPLETED: "✔️ Tamamlandı", CANCELLED: "❌ İptal",
    }[res.status] || res.status;

    // Temiz açıklama oluştur
    let descLines = [];

    if (packageNames) descLines.push(`📦 ${packageNames}`);

    // Mekan / özel alan bilgileri
    if (res.customFieldAnswers && Array.isArray(res.customFieldAnswers)) {
      const relevantAnswers = res.customFieldAnswers.filter(
        (ans) => ans.type !== "_hidden" && ans.label && ans.value && !ans.label.startsWith("_")
      );
      if (relevantAnswers.length > 0) {
        relevantAnswers.forEach((ans) => {
          descLines.push(`${ans.label}: ${ans.value}`);
        });
      }
    } else if (res.venueName) {
      descLines.push(`📍 ${res.venueName}`);
    }

    descLines.push(""); // Boş satır

    // İletişim
    if (res.bridePhone) descLines.push(`📞 ${res.bridePhone}`);
    if (res.groomPhone) descLines.push(`📞 ${res.groomPhone}`);
    if (res.brideEmail) descLines.push(`✉️ ${res.brideEmail}`);

    descLines.push(""); // Boş satır

    // Finans — kısa ve net
    descLines.push(`💰 ${tNum.toLocaleString("tr-TR")} TL`);
    if (pNum > 0) {
      descLines.push(`✅ Ödenen: ${pNum.toLocaleString("tr-TR")} TL`);
      if (remaining > 0) {
        descLines.push(`⚠️ Kalan: ${remaining.toLocaleString("tr-TR")} TL`);
      }
    }

    descLines.push(`${statusLabel}`);

    // Notlar
    if (res.notes) {
      descLines.push("");
      descLines.push(`📝 ${res.notes.replace(/\r?\n/g, " ").trim()}`);
    }

    // Açıklama metnini oluştur — \n iCal'de satır sonu demek
    const description = "DESCRIPTION:" + descLines.join("\\n");

    // UID'ye versiyon ekle — Google Cache'i kırmak için
    const uid = `res-${res.id}-v3@fiibi.co`;

    const event = [
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=Europe/Istanbul:${startDateString}`,
      `DTEND;TZID=Europe/Istanbul:${endDateString}`,
      `SUMMARY:${summary}`,
      description,
      `STATUS:${res.status === "CONFIRMED" ? "CONFIRMED" : res.status === "CANCELLED" ? "CANCELLED" : "TENTATIVE"}`,
      "END:VEVENT",
    ];

    // Her satırı 75 byte'a göre katla (RFC 5545)
    event.forEach((line) => {
      ics.push(...foldLine(line));
    });
  });

  ics.push("END:VCALENDAR");
  return ics.join("\r\n");
}

/**
 * RFC 5545 line folding — satırları 75 byte sınırına göre katlar
 * Devam satırları CRLF + boşluk ile başlar
 */
function foldLine(line) {
  if (line.length <= 75) return [line];
  const result = [];
  result.push(line.substring(0, 75));
  let remaining = line.substring(75);
  while (remaining.length > 0) {
    // Devam satırı: boşluk + max 74 karakter
    result.push(" " + remaining.substring(0, 74));
    remaining = remaining.substring(74);
  }
  return result;
}

function parseTotalAmount(val) {
  if (typeof val === "number") return val;
  if (!val) return 0;
  let str = String(val).trim().replace(/[₺\s]/g, "");
  str = str.replace(/\./g, "").replace(",", ".");
  return parseFloat(str) || 0;
}

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token || token.length < 16) {
      return new NextResponse("Geçersiz veya eksik token.", { status: 401 });
    }

    // Token ile tenant'ı bul
    const tenant = await prisma.tenant.findUnique({
      where: { calendarToken: token },
    });

    if (!tenant) {
      return new NextResponse("Geçersiz token.", { status: 401 });
    }

    // Tüm aktif rezervasyonları çek
    const reservations = await prisma.reservation.findMany({
      where: {
        tenantId: tenant.id,
        status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
      },
      include: {
        packages: true,
        payments: true,
      },
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
