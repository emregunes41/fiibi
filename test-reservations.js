const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    const res = await prisma.reservation.findMany({
      where: { 
        tenantId: "NONE",
        orderType: { not: "PRODUCT" },
        status: { not: "DRAFT" }
      }
    })
    console.log("Success:", res.length)
  } catch (e) {
    console.error("Error:", e)
  } finally {
    await prisma.$disconnect()
  }
}
main()
