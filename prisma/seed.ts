import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
const prisma = new PrismaClient({ adapter });

const PERMISSIONS = [
    "product:create",
    "product:read",
    "product:update",
    "product:delete",
    "user:create",
    "user:assign-role",
];

async function main() {
    // Create permissions
    for (const name of PERMISSIONS) {
        await prisma.permission.upsert({
            where: { name },
            update: {},
            create: { name },
        });
    }

    // Create superadmin role
    const superadminRole = await prisma.role.upsert({
        where: { name: "superadmin" },
        update: {},
        create: { name: "superadmin" },
    });

    // Create employee role
    await prisma.role.upsert({
        where: { name: "employee" },
        update: {},
        create: { name: "employee" },
    });

    // Give superadmin all permissions
    const allPermissions = await prisma.permission.findMany();
    for (const permission of allPermissions) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: superadminRole.id,
                    permissionId: permission.id,
                },
            },
            update: {},
            create: {
                roleId: superadminRole.id,
                permissionId: permission.id,
            },
        });
    }

    // Create superadmin user
    const passwordHash = await bcrypt.hash("admin123", 12);
    const adminUser = await prisma.user.upsert({
        where: { email: "admin@example.com" },
        update: {},
        create: {
            email: "admin@example.com",
            passwordHash,
        },
    });

    // Assign superadmin role to user
    await prisma.userRole.upsert({
        where: {
            userId_roleId: {
                userId: adminUser.id,
                roleId: superadminRole.id,
            },
        },
        update: {},
        create: {
            userId: adminUser.id,
            roleId: superadminRole.id,
        },
    });

    console.log("Seed complete. Superadmin: admin@example.com / admin123");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
