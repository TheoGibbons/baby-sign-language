import { PrismaClient } from '@prisma/client';

// Reuse one pool per Vercel function instance. Creating and disconnecting a
// client on every request causes unnecessary direct PostgreSQL connections.
const globalForPrisma = globalThis;

const prisma = globalForPrisma.babySignLanguagePrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.babySignLanguagePrisma = prisma;
}

export default prisma;
