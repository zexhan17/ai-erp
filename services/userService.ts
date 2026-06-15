import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export const UserService = {
    async createUser(email: string, password: string) {
        const passwordHash = await hashPassword(password);
        return prisma.user.create({
            data: { email, passwordHash },
            select: { id: true, email: true, createdAt: true },
        });
    },

    async getUsers() {
        return prisma.user.findMany({
            select: {
                id: true,
                email: true,
                createdAt: true,
                userRoles: { include: { role: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    },

    async assignRole(userId: string, roleId: string) {
        return prisma.userRole.upsert({
            where: { userId_roleId: { userId, roleId } },
            update: {},
            create: { userId, roleId },
        });
    },

    async getRoles() {
        return prisma.role.findMany();
    },

    async getPermissions() {
        return prisma.permission.findMany({ orderBy: { name: "asc" } });
    },

    async removeRoleFromUser(userId: string, roleId: string) {
        return prisma.userRole.delete({
            where: { userId_roleId: { userId, roleId } },
        });
    },

    async assignPermissionToRole(roleId: string, permissionId: string) {
        return prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId, permissionId } },
            update: {},
            create: { roleId, permissionId },
        });
    },

    async removePermissionFromRole(roleId: string, permissionId: string) {
        return prisma.rolePermission.delete({
            where: { roleId_permissionId: { roleId, permissionId } },
        });
    },

    async deleteUser(userId: string) {
        return prisma.user.delete({ where: { id: userId } });
    },
};
