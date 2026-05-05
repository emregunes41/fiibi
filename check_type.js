const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const t = await prisma.tenant.findUnique({
    where: { slug: "pinowed" },
    select: { slug: true, customDomain: true, businessType: true }
  });
  console.log(t);
}
check();
