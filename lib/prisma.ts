import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

function createPrismaClient() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("DATABASE_URL environment variable is not set");
    }
    const adapter = new PrismaNeonHttp(connectionString, {});
    return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
