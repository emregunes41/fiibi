const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  await prisma.reservation.updateMany({
    where: { paymentPreference: null, contractApproved: false },
    data: { paymentPreference: 'CASH', status: 'CONFIRMED' }
  });
  console.log("DB Fixed!");
}
run();
