import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });

const MODEL = "llama-3.3-70b-versatile";

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
    | "remove_permission_from_role"
    | "unknown_intent";

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

export interface ToolCall {
    tool: ToolName;
    arguments: Record<string, unknown>;
}

export interface QuotedMessage {
    role: "user" | "assistant";
    content: string;
}

const tools: Groq.Chat.CompletionCreateParams.Tool[] = [
    {
        type: "function",
        function: {
            name: "create_product",
            description: "Create a new product in the system",
            parameters: {
                type: "object",
                properties: {
                    name: { type: "string", description: "Product name" },
                    description: { type: "string", description: "Optional product description" },
                    price: { type: "number", description: "Product price (must be positive)" },
                },
                required: ["name", "price"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "get_products",
            description: "List all products with their IDs, names, descriptions, and prices",
            parameters: { type: "object", properties: {} },
        },
    },
    {
        type: "function",
        function: {
            name: "get_product",
            description: "Get a single product by its ID",
            parameters: {
                type: "object",
                properties: {
                    id: { type: "string", description: "Product UUID" },
                },
                required: ["id"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "update_product",
            description: "Update an existing product by ID",
            parameters: {
                type: "object",
                properties: {
                    id: { type: "string", description: "Product UUID" },
                    name: { type: "string", description: "New product name" },
                    description: { type: "string", description: "New description" },
                    price: { type: "number", description: "New price" },
                },
                required: ["id"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "delete_product",
            description: "Delete a product by ID",
            parameters: {
                type: "object",
                properties: {
                    id: { type: "string", description: "Product UUID" },
                },
                required: ["id"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "create_user",
            description: "Create a new user account",
            parameters: {
                type: "object",
                properties: {
                    email: { type: "string", description: "User email address" },
                    password: { type: "string", description: "Initial password (min 8 chars)" },
                },
                required: ["email", "password"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "get_users",
            description: "List all users and their roles",
            parameters: { type: "object", properties: {} },
        },
    },
    {
        type: "function",
        function: {
            name: "get_roles",
            description: "List all available roles",
            parameters: { type: "object", properties: {} },
        },
    },
    {
        type: "function",
        function: {
            name: "assign_role",
            description: "Assign a role to a user by their IDs",
            parameters: {
                type: "object",
                properties: {
                    userId: { type: "string", description: "User UUID" },
                    roleId: { type: "string", description: "Role UUID" },
                },
                required: ["userId", "roleId"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "remove_role",
            description: "Remove a role from a user",
            parameters: {
                type: "object",
                properties: {
                    userId: { type: "string", description: "User UUID" },
                    roleId: { type: "string", description: "Role UUID" },
                },
                required: ["userId", "roleId"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "get_permissions",
            description: "List all available permissions in the system",
            parameters: { type: "object", properties: {} },
        },
    },
    {
        type: "function",
        function: {
            name: "get_user_permissions",
            description: "Get the effective permissions of a specific user by their user ID",
            parameters: {
                type: "object",
                properties: {
                    userId: { type: "string", description: "User UUID" },
                },
                required: ["userId"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "get_role_permissions",
            description: "Get all permissions assigned to a specific role by its role ID",
            parameters: {
                type: "object",
                properties: {
                    roleId: { type: "string", description: "Role UUID" },
                },
                required: ["roleId"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "assign_permission_to_role",
            description: "Grant a permission to a role",
            parameters: {
                type: "object",
                properties: {
                    roleId: { type: "string", description: "Role UUID" },
                    permissionId: { type: "string", description: "Permission UUID" },
                },
                required: ["roleId", "permissionId"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "remove_permission_from_role",
            description: "Revoke a permission from a role",
            parameters: {
                type: "object",
                properties: {
                    roleId: { type: "string", description: "Role UUID" },
                    permissionId: { type: "string", description: "Permission UUID" },
                },
                required: ["roleId", "permissionId"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "unknown_intent",
            description: "Use this for greetings, out-of-scope requests, ambiguous input, or anything that does not map to a specific ERP action",
            parameters: {
                type: "object",
                properties: {
                    message: {
                        type: "string",
                        description: "A friendly, helpful reply to send directly to the user. For greetings, welcome them and explain what you can help with. For ambiguous requests, ask a clarifying question. For out-of-scope requests, politely explain what you cannot do and suggest what you can do instead.",
                    },
                },
                required: ["message"],
            },
        },
    },
];

const SYSTEM_PROMPT =
    "You are a friendly and helpful ERP assistant. ALWAYS respond by calling a tool — never reply with plain text. " +
    "You can help with: managing products (create, list, update, delete), managing users (create, list), " +
    "managing roles (list, assign to users, remove from users), and managing permissions (list all, view by user or role, assign/remove from roles). " +
    "CRITICAL — data integrity rules: " +
    "NEVER invent, guess, or fabricate any IDs, emails, names, or other data values. " +
    "If you need an ID to perform an action (delete, update, assign) and the user has not provided a valid UUID, call the appropriate list tool first (get_products, get_users, get_roles) to fetch real IDs, then perform the action. " +
    "If the user refers to an item by number (e.g. 'delete product 1') or by name (e.g. 'delete sabzi'), call the list tool first to find the correct UUID, then call the action tool. " +
    "Use context from the conversation history to resolve references like 'that user', 'his ID', 'the role above', 'their permissions'. " +
    "Only reuse an ID from conversation history if it was returned by a tool call in this conversation — never generate one from memory. " +
    "When the user asks about permissions of a role, use get_role_permissions. " +
    "When the user asks about permissions of a user, use get_user_permissions. " +
    "For greetings or small talk, call unknown_intent and write a warm, helpful welcome message explaining what you can do. " +
    "For ambiguous requests (e.g. 'delete it' with no prior context), call unknown_intent and ask a specific clarifying question. " +
    "For requests outside your capabilities (e.g. weather, emails, writing code), call unknown_intent, politely say you can't help with that, and remind the user what you can do.";

const MAX_HISTORY_MESSAGES = 10;

function trimHistory(history: ChatMessage[]): ChatMessage[] {
    if (history.length <= MAX_HISTORY_MESSAGES) return history;
    const trimmed = history.slice(-MAX_HISTORY_MESSAGES);
    if (trimmed[0]?.role === "assistant") return trimmed.slice(1);
    return trimmed;
}

export async function interpretIntent(
    message: string,
    history: ChatMessage[] = [],
    quotedMessage?: QuotedMessage
): Promise<ToolCall | string | null> {
    const trimmedHistory = trimHistory(history);

    const contextualMessage = quotedMessage
        ? `[Replying to ${quotedMessage.role === "assistant" ? "assistant" : "user"} message: "${quotedMessage.content.slice(0, 200)}"]\n\n${message}`
        : message;

    const messages: Groq.Chat.MessageParam[] = [
        { role: "system", content: SYSTEM_PROMPT },
        ...trimmedHistory.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
        })),
        { role: "user", content: contextualMessage },
    ];

    // Retry up to 2 times on transient 5xx errors
    let response: Groq.Chat.ChatCompletion | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            response = await groq.chat.completions.create({
                model: MODEL,
                messages,
                tools,
                tool_choice: "required",
            });
            break;
        } catch (err: unknown) {
            const status = (err as { status?: number })?.status;
            const isTransient = status === 503 || status === 502 || status === 500;
            if (isTransient && attempt < 2) {
                await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
                continue;
            }
            throw err;
        }
    }
    if (!response) throw new Error("No response after retries");

    const choice = response.choices[0];
    const msg = choice.message;

    if (msg.tool_calls && msg.tool_calls.length > 0) {
        const toolCall = msg.tool_calls[0];
        let args: Record<string, unknown> = {};
        try {
            args = JSON.parse(toolCall.function.arguments);
        } catch {
            args = {};
        }
        return {
            tool: toolCall.function.name as ToolName,
            arguments: args,
        };
    }

    if (msg.content && msg.content.trim()) {
        return msg.content.trim();
    }

    return null;
}
