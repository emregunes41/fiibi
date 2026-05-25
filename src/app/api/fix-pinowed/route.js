import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Tek seferlik düzeltme: pinowed tenant'ının businessType'ını photographer olarak ayarla
// Kullanımdan sonra silinecek
export async function GET() {
  try {
    const tenant = await prisma.tenant.findFirst({
      where: { slug: "pinowed" },
      select: { id: true, slug: true, businessType: true }
    });

    if (!tenant) {
      return NextResponse.json({ error: "pinowed tenant bulunamadı" }, { status: 404 });
    }

    // Mevcut durumu göster
    if (tenant.businessType === "photographer") {
      return NextResponse.json({ message: "Zaten photographer olarak ayarlı", tenant });
    }

    // businessType'ı güncelle
    const updated = await prisma.tenant.update({
      where: { id: tenant.id },
      data: { businessType: "photographer" },
      select: { id: true, slug: true, businessType: true }
    });

    return NextResponse.json({ 
      message: "businessType başarıyla 'photographer' olarak güncellendi",
      before: tenant.businessType,
      after: updated.businessType,
      tenant: updated
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
