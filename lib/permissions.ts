import { prisma } from "./prisma";

export async function getUserPermissions(userId: string): Promise<string[]> {
    const userRoles = await prisma.userRole.findMany({
        where: { userId },
        include: {
            role: {
                include: {
                    rolePermissions: {
                        include: { permission: true },
                    },
                },
            },
        },
    });

    const permissions = new Set<string>();
    for (const userRole of userRoles) {
        for (const rp of userRole.role.rolePermissions) {
            permissions.add(rp.permission.name);
        }
    }
    return Array.from(permissions);
}

export function checkPermission(
    permissions: string[],
    required: string
): boolean {
    return permissions.includes(required);
}
