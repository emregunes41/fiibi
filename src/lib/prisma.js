import { PrismaClient } from '@prisma/client'
// Forced re-generation check 1775048500 - SALT: tt4h2h
// If you still see 'Unknown argument selectedPhotos', please restart npm run dev

const createPrismaClient = () => {
  console.log("Initializing refreshed Prisma Client...");
  return new PrismaClient()
}

const globalForPrisma = globalThis

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
