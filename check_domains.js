const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const tenants = await prisma.tenant.findMany({
    select: { slug: true, customDomain: true }
  });
  console.log(tenants);
}
check();
