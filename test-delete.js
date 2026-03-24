const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const pkgs = await prisma.photographyPackage.findMany();
  console.log("Packages:", pkgs);
  if (pkgs.length > 0) {
    try {
      await prisma.photographyPackage.delete({ where: { id: pkgs[0].id } });
      console.log("Deleted successfully");
    } catch (e) {
      console.error("Delete Error:", e);
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
