const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const admins = await prisma.admin.findMany({
    select: { username: true, tenantId: true }
  });
  console.log(admins);
}
check();
