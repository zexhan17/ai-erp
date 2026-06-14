import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getUserPermissions, checkPermission } from "@/lib/permissions";
import { interpretIntent, ToolCall, ChatMessage } from "@/lib/gemini";
import { validateToolCall } from "@/lib/validator";
import { ProductService } from "@/services/productService";
import { UserService } from "@/services/userService";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const TOOL_PERMISSION_MAP: Record<string, string> = {
    create_product: "product:create",
    get_products: "product:read",
    get_product: "product:read",
    update_product: "product:update",
    delete_product: "product:delete",
    create_user: "user:create",
    get_users: "user:create",
    get_roles: "user:assign-role",
    assign_role: "user:assign-role",
    remove_role: "user:assign-role",
    get_permissions: "user:assign-role",
    get_user_permissions: "user:assign-role",
    get_role_permissions: "user:assign-role",
    assign_permission_to_role: "user:assign-role",
    remove_permission_from_role: "user:assign-role",
};

async function executeToolCall(
    toolCall: ToolCall,
    args: Record<string, unknown>,
    userId: string
): Promise<string> {
    switch (toolCall.tool) {
        case "create_product": {
            const product = await ProductService.createProduct(userId, {
                name: args.name as string,
                description: args.description as string | undefined,
                price: args.price as number,
            });
            return `Product "${product.name}" created successfully with price $${product.price}.`;
        }

        case "get_products": {
            const products = await ProductService.getProducts();
            if (products.length === 0) {
                return "No products found.";
            }
            const list = products
                .map((p: { name: string; price: number }, i: number) => `${i + 1}. ${p.name} — $${p.price}`)
                .join("\n");
            return `Here are all products:\n${list}`;
        }

        case "get_product": {
            const product = await ProductService.getProduct(args.id as string);
            if (!product) {
                return `Product with ID "${args.id}" not found.`;
            }
            return `Product: ${product.name}\nPrice: $${product.price}${product.description ? `\nDescription: ${product.description}` : ""}`;
        }

        case "update_product": {
            const { id, ...data } = args;
            try {
                const product = await ProductService.updateProduct(
                    userId,
                    id as string,
                    data as { name?: string; description?: string; price?: number }
                );
                return `Product "${product.name}" updated successfully.`;
            } catch {
                return `Product with ID "${id}" not found.`;
            }
        }

        case "delete_product": {
            try {
                await ProductService.deleteProduct(userId, args.id as string);
                return `Product with ID "${args.id}" deleted successfully.`;
            } catch {
                return `Product with ID "${args.id}" not found.`;
            }
        }

        case "create_user": {
            const existing = await prisma.user.findUnique({ where: { email: args.email as string } });
            if (existing) {
                return `A user with email "${args.email}" already exists.`;
            }
            const user = await UserService.createUser(args.email as string, args.password as string);
            return `User "${user.email}" created successfully (ID: ${user.id}).`;
        }

        case "get_users": {
            const users = await UserService.getUsers();
            if (users.length === 0) return "No users found.";
            const list = users.map((u, i) => {
                const roles = u.userRoles.map((ur: { role: { name: string } }) => ur.role.name).join(", ") || "no roles";
                return `${i + 1}. ${u.email} (${roles}) — ID: ${u.id}`;
            }).join("\n");
            return `Here are all users:\n${list}`;
        }

        case "get_roles": {
            const roles = await UserService.getRoles();
            if (roles.length === 0) return "No roles found.";
            const list = roles.map((r, i) => `${i + 1}. ${r.name} — ID: ${r.id}`).join("\n");
            return `Available roles:\n${list}`;
        }

        case "assign_role": {
            const user = await prisma.user.findUnique({ where: { id: args.userId as string } });
            if (!user) return `User with ID "${args.userId}" not found.`;
            const role = await prisma.role.findUnique({ where: { id: args.roleId as string } });
            if (!role) return `Role with ID "${args.roleId}" not found.`;
            await UserService.assignRole(args.userId as string, args.roleId as string);
            return `Role "${role.name}" assigned to "${user.email}" successfully.`;
        }

        case "remove_role": {
            const user = await prisma.user.findUnique({ where: { id: args.userId as string } });
            if (!user) return `User with ID "${args.userId}" not found.`;
            const role = await prisma.role.findUnique({ where: { id: args.roleId as string } });
            if (!role) return `Role with ID "${args.roleId}" not found.`;
            try {
                await UserService.removeRoleFromUser(args.userId as string, args.roleId as string);
                return `Role "${role.name}" removed from "${user.email}" successfully.`;
            } catch {
                return `User "${user.email}" does not have role "${role.name}".`;
            }
        }

        case "get_permissions": {
            const permissions = await UserService.getPermissions();
            if (permissions.length === 0) return "No permissions found.";
            const list = permissions.map((p, i) => `${i + 1}. ${p.name} — ID: ${p.id}`).join("\n");
            return `Available permissions:\n${list}`;
        }

        case "get_user_permissions": {
            const user = await prisma.user.findUnique({ where: { id: args.userId as string } });
            if (!user) return `User with ID "${args.userId}" not found.`;
            const perms = await getUserPermissions(args.userId as string);
            if (perms.length === 0) return `User "${user.email}" has no permissions.`;
            const list = perms.map((p, i) => `${i + 1}. ${p}`).join("\n");
            return `Permissions for "${user.email}":\n${list}`;
        }

        case "get_role_permissions": {
            const role = await prisma.role.findUnique({
                where: { id: args.roleId as string },
                include: { rolePermissions: { include: { permission: true } } },
            });
            if (!role) return `Role with ID "${args.roleId}" not found.`;
            if (role.rolePermissions.length === 0) return `Role "${role.name}" has no permissions.`;
            const list = role.rolePermissions.map((rp: { permission: { name: string } }, i: number) => `${i + 1}. ${rp.permission.name}`).join("\n");
            return `Permissions for role "${role.name}":\n${list}`;
        }

        case "assign_permission_to_role": {
            const role = await prisma.role.findUnique({ where: { id: args.roleId as string } });
            if (!role) return `Role with ID "${args.roleId}" not found.`;
            const permission = await prisma.permission.findUnique({ where: { id: args.permissionId as string } });
            if (!permission) return `Permission with ID "${args.permissionId}" not found.`;
            await UserService.assignPermissionToRole(args.roleId as string, args.permissionId as string);
            return `Permission "${permission.name}" granted to role "${role.name}" successfully.`;
        }

        case "remove_permission_from_role": {
            const role = await prisma.role.findUnique({ where: { id: args.roleId as string } });
            if (!role) return `Role with ID "${args.roleId}" not found.`;
            const permission = await prisma.permission.findUnique({ where: { id: args.permissionId as string } });
            if (!permission) return `Permission with ID "${args.permissionId}" not found.`;
            try {
                await UserService.removePermissionFromRole(args.roleId as string, args.permissionId as string);
                return `Permission "${permission.name}" revoked from role "${role.name}" successfully.`;
            } catch {
                return `Role "${role.name}" does not have permission "${permission.name}".`;
            }
        }

        default:
            return "Unknown command.";
    }
}

const chatSchema = z.object({
    message: z.string().min(1),
    history: z.array(
        z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
        })
    ).optional().default([]),
});

export async function POST(req: NextRequest) {
    const session = await getSessionUser(req);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = chatSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Validation failed", details: parsed.error.flatten() },
            { status: 400 }
        );
    }

    const { message, history } = parsed.data;

    console.log(`[chat] user=${session.sub} message="${message}"`);

    // Step 1: AI interprets intent
    let toolCall: ToolCall | string | null;
    try {
        toolCall = await interpretIntent(message, history as ChatMessage[]);
    } catch (err: unknown) {
        console.error("Gemini error:", err);
        // Surface rate-limit retry info to the user
        const msg = err instanceof Error ? err.message : "";
        const retryMatch = msg.match(/Please retry in (\d+)/);
        if (retryMatch || msg.includes("429") || msg.includes("Too Many Requests") || msg.includes("quota")) {
            const seconds = retryMatch ? retryMatch[1] : "60";
            return NextResponse.json(
                { reply: `AI rate limit reached. Please retry in ${seconds} seconds.` }
            );
        }
        return NextResponse.json(
            { reply: "AI service unavailable. Please try again." }
        );
    }

    if (!toolCall) {
        return NextResponse.json({
            reply: "I couldn't understand your request. Try asking me to list products, show users, show roles, check permissions, or create/update/delete a product.",
        });
    }

    // Gemini responded with plain text (no tool call)
    if (typeof toolCall === "string") {
        console.log(`[chat] user=${session.sub} gemini_text reply="${toolCall.slice(0, 120)}"`);
        return NextResponse.json({ reply: toolCall });
    }

    // Step 2: Validate tool call arguments
    const validation = validateToolCall(toolCall);
    if (!validation.success) {
        return NextResponse.json({ reply: validation.error });
    }

    // Step 3: Check permissions
    const requiredPermission = TOOL_PERMISSION_MAP[toolCall.tool];
    if (requiredPermission) {
        const permissions = await getUserPermissions(session.sub);
        if (!checkPermission(permissions, requiredPermission)) {
            return NextResponse.json({
                reply: "You do not have permission to perform this action.",
            });
        }
    }

    // Step 4: Execute action via domain service
    const reply = await executeToolCall(toolCall, validation.data, session.sub);

    console.log(`[chat] user=${session.sub} tool=${toolCall.tool} reply="${reply.slice(0, 120)}"`);
    return NextResponse.json({ reply });
}
