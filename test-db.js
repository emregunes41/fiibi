const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 1,
    include: { reservations: { include: { packages: true, payments: true, albumModel: true } }, purchases: true }
  });
  console.log(JSON.stringify(users[0], null, 2));
}
run();
