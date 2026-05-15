const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    const res = await prisma.reservation.findMany({
      where: { 
        orderType: { not: "PRODUCT" },
        status: { not: "DRAFT" }
      }
    })
    console.log("Success! Total records:", res.length)
  } catch (e) {
    console.error("Error:", e)
  } finally {
    await prisma.$disconnect()
  }
}
main()
