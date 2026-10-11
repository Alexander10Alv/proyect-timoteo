import { PrismaClient } from '@prisma/client';

/**
 * Singleton de PrismaClient.
 * Evita múltiples instancias durante el hot-reload de desarrollo
 * (cada instancia abre su propio pool de conexiones a MySQL).
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}