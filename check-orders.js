const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const orders = await prisma.reservation.findMany({
    where: { OR: [{ orderType: "PRODUCT" }, { orderType: "MIXED" }] },
    select: { id: true, status: true, orderType: true, purchasedProducts: true }
  });
  console.log(JSON.stringify(orders, null, 2));
}
main().finally(() => prisma.$disconnect());
