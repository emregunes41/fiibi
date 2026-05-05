const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const domain = "www.pinowed.com";
  const cleanDomain = domain.replace(/^www\./, "");
  const wwwDomain = `www.${cleanDomain}`;

  const tenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { customDomain: cleanDomain },
        { customDomain: wwwDomain }
      ]
    }
  });
  console.log("Result:", tenant);
}
test();
