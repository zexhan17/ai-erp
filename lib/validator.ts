import { z } from "zod";
import type { ToolName, ToolCall } from "./agent";

const createProductSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    price: z.number().positive("Price must be positive"),
});

const getProductsSchema = z.object({});

const getProductSchema = z.object({
    id: z.string().uuid("Invalid product ID"),
});

const updateProductSchema = z.object({
    id: z.string().uuid("Invalid product ID"),
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
});

const deleteProductSchema = z.object({
    id: z.string().uuid("Invalid product ID"),
});

const createUserSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

const getUsersSchema = z.object({});

const deleteUserSchema = z.object({
    id: z.string().uuid("Invalid user ID").optional(),
    email: z.string().email("Invalid email address").optional(),
});

const getRolesSchema = z.object({});

const assignRoleSchema = z.object({
    userId: z.string().uuid("Invalid user ID"),
    roleId: z.string().uuid("Invalid role ID"),
});

const removeRoleSchema = z.object({
    userId: z.string().uuid("Invalid user ID"),
    roleId: z.string().uuid("Invalid role ID"),
});

const getPermissionsSchema = z.object({});

const getUserPermissionsSchema = z.object({
    userId: z.string().uuid("Invalid user ID"),
});

const getRolePermissionsSchema = z.object({
    roleId: z.string().uuid("Invalid role ID"),
});

const assignPermissionToRoleSchema = z.object({
    roleId: z.string().uuid("Invalid role ID"),
    permissionId: z.string().uuid("Invalid permission ID"),
});

const removePermissionFromRoleSchema = z.object({
    roleId: z.string().uuid("Invalid role ID"),
    permissionId: z.string().uuid("Invalid permission ID"),
});

const schemas: Record<ToolName, z.ZodTypeAny> = {
    create_product: createProductSchema,
    get_products: getProductsSchema,
    get_product: getProductSchema,
    update_product: updateProductSchema,
    delete_product: deleteProductSchema,
    create_user: createUserSchema,
    get_users: getUsersSchema,
    delete_user: deleteUserSchema,
    get_roles: getRolesSchema,
    assign_role: assignRoleSchema,
    remove_role: removeRoleSchema,
    get_permissions: getPermissionsSchema,
    get_user_permissions: getUserPermissionsSchema,
    get_role_permissions: getRolePermissionsSchema,
    assign_permission_to_role: assignPermissionToRoleSchema,
    remove_permission_from_role: removePermissionFromRoleSchema,
    unknown_intent: z.object({ message: z.string().optional() }),
};

export interface ValidationResult {
    success: true;
    data: Record<string, unknown>;
}

export interface ValidationError {
    success: false;
    error: string;
}

export function validateToolCall(
    toolCall: ToolCall
): ValidationResult | ValidationError {
    const schema = schemas[toolCall.tool];
    if (!schema) {
        return { success: false, error: `Unknown tool: ${toolCall.tool}` };
    }

    const result = schema.safeParse(toolCall.arguments);
    if (!result.success) {
        const messages = result.error.issues.map((e) => e.message).join(", ");
        return { success: false, error: `Validation failed: ${messages}` };
    }

    return { success: true, data: result.data as Record<string, unknown> };
}
