import { GoogleGenerativeAI, Tool, FunctionDeclaration, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

export type ToolName =
    | "create_product"
    | "get_products"
    | "update_product"
    | "delete_product"
    | "get_product"
    | "create_user"
    | "get_users"
    | "assign_role"
    | "remove_role"
    | "get_roles"
    | "get_permissions"
    | "get_user_permissions"
    | "get_role_permissions"
    | "assign_permission_to_role"
    | "remove_permission_from_role";

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

export interface ToolCall {
    tool: ToolName;
    arguments: Record<string, unknown>;
}

const toolDefinitions: FunctionDeclaration[] = [
    {
        name: "create_product",
        description: "Create a new product in the system",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                name: { type: SchemaType.STRING, description: "Product name" },
                description: {
                    type: SchemaType.STRING,
                    description: "Optional product description",
                },
                price: { type: SchemaType.NUMBER, description: "Product price (must be positive)" },
            },
            required: ["name", "price"],
        },
    },
    {
        name: "get_products",
        description: "List all products",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {},
        },
    },
    {
        name: "get_product",
        description: "Get a single product by its ID",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                id: { type: SchemaType.STRING, description: "Product UUID" },
            },
            required: ["id"],
        },
    },
    {
        name: "update_product",
        description: "Update an existing product by ID",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                id: { type: SchemaType.STRING, description: "Product UUID" },
                name: { type: SchemaType.STRING, description: "New product name" },
                description: { type: SchemaType.STRING, description: "New description" },
                price: { type: SchemaType.NUMBER, description: "New price" },
            },
            required: ["id"],
        },
    },
    {
        name: "delete_product",
        description: "Delete a product by ID",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                id: { type: SchemaType.STRING, description: "Product UUID" },
            },
            required: ["id"],
        },
    },
    {
        name: "create_user",
        description: "Create a new user account (superadmin only)",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                email: { type: SchemaType.STRING, description: "User email address" },
                password: { type: SchemaType.STRING, description: "Initial password (min 8 chars)" },
            },
            required: ["email", "password"],
        },
    },
    {
        name: "get_users",
        description: "List all users and their roles",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {},
        },
    },
    {
        name: "get_roles",
        description: "List all available roles",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {},
        },
    },
    {
        name: "assign_role",
        description: "Assign a role to a user by their IDs (superadmin only)",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                userId: { type: SchemaType.STRING, description: "User UUID" },
                roleId: { type: SchemaType.STRING, description: "Role UUID" },
            },
            required: ["userId", "roleId"],
        },
    },
    {
        name: "remove_role",
        description: "Remove a role from a user (superadmin only)",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                userId: { type: SchemaType.STRING, description: "User UUID" },
                roleId: { type: SchemaType.STRING, description: "Role UUID" },
            },
            required: ["userId", "roleId"],
        },
    },
    {
        name: "get_permissions",
        description: "List all available permissions in the system",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {},
        },
    },
    {
        name: "get_user_permissions",
        description: "Get the effective permissions of a specific user by their user ID",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                userId: { type: SchemaType.STRING, description: "User UUID" },
            },
            required: ["userId"],
        },
    },
    {
        name: "get_role_permissions",
        description: "Get all permissions assigned to a specific role by its role ID",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                roleId: { type: SchemaType.STRING, description: "Role UUID" },
            },
            required: ["roleId"],
        },
    },
    {
        name: "assign_permission_to_role",
        description: "Grant a permission to a role (superadmin only)",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                roleId: { type: SchemaType.STRING, description: "Role UUID" },
                permissionId: { type: SchemaType.STRING, description: "Permission UUID" },
            },
            required: ["roleId", "permissionId"],
        },
    },
    {
        name: "remove_permission_from_role",
        description: "Revoke a permission from a role (superadmin only)",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                roleId: { type: SchemaType.STRING, description: "Role UUID" },
                permissionId: { type: SchemaType.STRING, description: "Permission UUID" },
            },
            required: ["roleId", "permissionId"],
        },
    },
];

const tools: Tool[] = [{ functionDeclarations: toolDefinitions }];

export async function interpretIntent(
    message: string,
    history: ChatMessage[] = []
): Promise<ToolCall | string | null> {
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
        tools,
        systemInstruction:
            "You are an ERP assistant. ALWAYS respond by calling a tool — never reply with plain text. " +
            "Available capabilities: manage products (create/list/update/delete), manage users (create/list), " +
            "manage roles (list/assign/remove), manage permissions (list all, get by user, get by role, assign/remove from role). " +
            "Use context from the conversation history to resolve references like 'that user', 'his ID', 'the role above', 'their permissions', etc. " +
            "When the user asks about permissions of a role, use get_role_permissions. " +
            "When the user asks about permissions of a user, use get_user_permissions.",
    });

    // Build multi-turn conversation contents from history
    const historyContents = history.map((m) => ({
        role: m.role === "assistant" ? ("model" as const) : ("user" as const),
        parts: [{ text: m.content }],
    }));

    const result = await model.generateContent({
        contents: [
            ...historyContents,
            {
                role: "user" as const,
                parts: [{ text: message }],
            },
        ],
    });

    const response = result.response;
    const candidate = response.candidates?.[0];
    if (!candidate) return null;

    for (const part of candidate.content.parts) {
        if (part.functionCall) {
            return {
                tool: part.functionCall.name as ToolName,
                arguments: part.functionCall.args as Record<string, unknown>,
            };
        }
        // Gemini responded with text instead of a tool call — surface it directly
        if (part.text && part.text.trim()) {
            return part.text.trim();
        }
    }

    return null;
}
