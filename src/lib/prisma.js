import { PrismaClient } from '@prisma/client'
// Forced re-generation check 1775048500 - SALT: ee9p3x
// Cleared cache

const createPrismaClient = () => {
  console.log("Initializing refreshed Prisma Client...");
  return new PrismaClient()
}

const globalForPrisma = globalThis

if (globalForPrisma.prisma) {
  // Clear the cached instance so it forces a reload of the new schema
  delete globalForPrisma.prisma;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
