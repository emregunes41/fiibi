import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Yasaklı/Spam kelime listesi
const SPAM_WORDS = [
  "test", "deneme", "asdf", "qweqwe", "bahis", "kripto", 
  "kumar", "ilaç", "silah", "tütün", "escort", "porno",
  "bet", "casino", "denemelik", "fake", "sahte"
];

// Fiyat limitleri
const MIN_PRICE = 50;
const MAX_PRICE = 250000;

function containsSpam(text) {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return SPAM_WORDS.some(word => lowerText.includes(word));
}

export const dynamic = 'force-dynamic';

export async function GET(request) {
  // 1. Güvenlik Kontrolü: Vercel Cron Secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    // 15 dakika öncesini hesapla
    const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000);

    let approvedTenantsCount = 0;
    let approvedPackagesCount = 0;

    // --- 1. SUB-MERCHANT (SATICI) OTOMATİK ONAYI ---
    const pendingTenants = await prisma.tenant.findMany({
      where: {
        subMerchantStatus: "PENDING",
        // En az 15 dk geçmiş olsun (NOT: sellerAgreementDate veya updatedAt kullanılabilir, 
        // ancak createdAt veya updatedAt'in 15 dk eski olmasını istiyoruz)
        updatedAt: { lte: fifteenMinsAgo }
      }
    });

    for (const tenant of pendingTenants) {
      // Spam kontrolü
      if (containsSpam(tenant.legalName) || containsSpam(tenant.businessName)) {
        continue; // Manuel onaya bırak
      }

      // Veriler tam mı?
      if (!tenant.taxId || !tenant.iban || !tenant.legalName) {
        continue;
      }

      // VKN/TCKN ve IBAN kabaca uygun mu?
      if (tenant.taxId.length < 10 || tenant.iban.length < 24) {
        continue;
      }

      // Onayla
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { subMerchantStatus: "APPROVED" }
      });
      approvedTenantsCount++;
    }

    // --- 2. PAKET/HİZMET OTOMATİK ONAYI ---
    const pendingPackages = await prisma.photographyPackage.findMany({
      where: {
        approvalStatus: "PENDING",
        createdAt: { lte: fifteenMinsAgo },
        // SADECE ödemesi onaylanmış satıcıların paketleri otomatik onaylanabilir
        tenant: { subMerchantStatus: "APPROVED" }
      }
    });

    for (const pkg of pendingPackages) {
      // Spam kontrolü
      if (containsSpam(pkg.name) || containsSpam(pkg.description)) {
        continue; // Manuel onaya bırak
      }

      // Fiyat kontrolü
      const priceVal = parseFloat(pkg.price) || 0;
      if (priceVal < MIN_PRICE || priceVal > MAX_PRICE) {
        continue; // Manuel onaya bırak (Örn: 1 TL'lik deneme paketleri)
      }

      // Onayla
      await prisma.photographyPackage.update({
        where: { id: pkg.id },
        data: { approvalStatus: "APPROVED" }
      });
      approvedPackagesCount++;
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Auto-approve cron executed successfully.',
      approvedTenants: approvedTenantsCount,
      approvedPackages: approvedPackagesCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Auto-Approve Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
