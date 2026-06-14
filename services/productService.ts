import { prisma } from "@/lib/prisma";

export interface CreateProductData {
    name: string;
    description?: string;
    price: number;
}

export interface UpdateProductData {
    name?: string;
    description?: string;
    price?: number;
}

async function logAudit(
    userId: string,
    action: string,
    entity: string,
    parameters: object
) {
    await prisma.auditLog.create({
        data: { userId, action, entity, parameters },
    });
}

export const ProductService = {
    async createProduct(userId: string, data: CreateProductData) {
        const product = await prisma.product.create({ data });
        await logAudit(userId, "create_product", "Product", data);
        return product;
    },

    async getProducts() {
        return prisma.product.findMany({ orderBy: { createdAt: "desc" } });
    },

    async getProduct(id: string) {
        return prisma.product.findUnique({ where: { id } });
    },

    async updateProduct(userId: string, id: string, data: UpdateProductData) {
        const product = await prisma.product.update({ where: { id }, data });
        await logAudit(userId, "update_product", "Product", { id, ...data });
        return product;
    },

    async deleteProduct(userId: string, id: string) {
        const product = await prisma.product.delete({ where: { id } });
        await logAudit(userId, "delete_product", "Product", { id });
        return product;
    },
};
