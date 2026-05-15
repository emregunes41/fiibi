const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    const res1 = await prisma.reservation.findMany()
    const res2 = await prisma.reservation.findMany({
      where: { 
        NOT: { orderType: "PRODUCT" }
      }
    })
    const res3 = await prisma.reservation.findMany({
      where: { 
        NOT: [
          { orderType: "PRODUCT" },
          { status: "DRAFT" }
        ]
      }
    })
    const res4 = await prisma.reservation.findMany({
      where: { 
        orderType: { not: "PRODUCT" },
        status: { not: "DRAFT" }
      }
    })
    console.log("Total:", res1.length)
    console.log("NOT PRODUCT:", res2.length)
    console.log("NOT ARRAY:", res3.length)
    console.log("not STRING:", res4.length)
  } catch (e) {
    console.error("Error:", e)
  } finally {
    await prisma.$disconnect()
  }
}
main()
