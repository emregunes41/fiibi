const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("🏗️  Pinowed tenant oluşturuluyor...");

  // 1. Tenant oluştur
  const tenant = await prisma.tenant.upsert({
    where: { slug: "pinowed" },
    update: {},
    create: {
      slug: "pinowed",
      businessName: "Pinowed Photography",
      ownerName: "Emre",
      ownerEmail: "hello@pinowed.com",
      password: "managed-externally", // Admin tablosundan yönetiliyor
      plan: "pro",
    },
  });

  console.log(`✅ Tenant oluşturuldu: ${tenant.id} (${tenant.slug})`);

  // 2. Mevcut admin'leri tenant'a bağla
  const admins = await prisma.admin.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });
  console.log(`   Admin: ${admins.count} kayıt güncellendi`);

  // 3. Mevcut paketleri tenant'a bağla
  const packages = await prisma.photographyPackage.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });
  console.log(`   Paketler: ${packages.count} kayıt güncellendi`);

  // 4. Mevcut rezervasyonları tenant'a bağla
  const reservations = await prisma.reservation.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });
  console.log(`   Rezervasyonlar: ${reservations.count} kayıt güncellendi`);

  // 5. Mevcut kullanıcıları tenant'a bağla
  const users = await prisma.user.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });
  console.log(`   Kullanıcılar: ${users.count} kayıt güncellendi`);

  // 6. Portfolyo kategorileri
  const categories = await prisma.portfolioCategory.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });
  console.log(`   Portfolyo Kategorileri: ${categories.count} kayıt güncellendi`);

  // 7. Banner
  const banners = await prisma.banner.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });
  console.log(`   Bannerlar: ${banners.count} kayıt güncellendi`);

  // 8. Content Blocks
  const contentBlocks = await prisma.contentBlock.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });
  console.log(`   İçerik Blokları: ${contentBlocks.count} kayıt güncellendi`);

  // 9. Album Models
  const albumModels = await prisma.albumModel.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });
  console.log(`   Albüm Modelleri: ${albumModels.count} kayıt güncellendi`);

  // 10. Discount Codes
  const discountCodes = await prisma.discountCode.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });
  console.log(`   İndirim Kodları: ${discountCodes.count} kayıt güncellendi`);

  // 11. Monthly Price Config
  const monthlyPrices = await prisma.monthlyPriceConfig.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });
  console.log(`   Aylık Fiyatlar: ${monthlyPrices.count} kayıt güncellendi`);

  // 12. Admin Notifications
  const notifications = await prisma.adminNotification.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });
  console.log(`   Bildirimler: ${notifications.count} kayıt güncellendi`);

  // 13. GlobalSettings — tenantId bağla
  const existingSettings = await prisma.globalSettings.findUnique({
    where: { id: "global-settings" },
  });
  if (existingSettings) {
    await prisma.globalSettings.update({
      where: { id: "global-settings" },
      data: {
        tenantId: tenant.id,
        businessName: "Pinowed Photography",
      },
    });
    console.log(`   Ayarlar: güncellendi`);
  }

  console.log("\n🎉 Tüm veriler 'pinowed' tenant'ına bağlandı!");
}

main()
  .catch((e) => {
    console.error("❌ Hata:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
