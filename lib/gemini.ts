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
    | "delete_user"
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

// Lookup tools: return data, continue the loop so AI can act on results
const LOOKUP_TOOLS = new Set<ToolName>([
    "get_users",
    "get_products",
    "get_roles",
    "get_permissions",
    "get_product",
    "get_user_permissions",
    "get_role_permissions",
]);

const tools: Groq.Chat.Completions.ChatCompletionTool[] = [
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
            name: "delete_user",
            description: "Delete a user account permanently. Provide EITHER the user's UUID (id) OR their email address — not both. If you have the email, use it directly. If you only have a name/alias, call get_users first to find the UUID.",
            parameters: {
                type: "object",
                properties: {
                    id: { type: "string", description: "User UUID (use if you already have the UUID from get_users)" },
                    email: { type: "string", description: "User email address (use if the user provided an email directly)" },
                },
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

    "CRITICAL — multi-step execution: " +
    "You operate in an agentic loop. When you call a lookup tool (get_users, get_products, get_roles, get_permissions, get_product, get_user_permissions, get_role_permissions), " +
    "the result is automatically fed back to you in the next turn. " +
    "You must then immediately call the action tool using the real IDs from those results — do NOT call unknown_intent between steps. " +
    "Example: user says 'delete test user' → call get_users → receive list → call delete_user with the real UUID from the list. " +
    "Example: user says 'assign Admin role to test@test.com' → call get_users AND get_roles (sequentially) → then call assign_role with real IDs. " +

    "CRITICAL — act immediately, never announce: " +
    "Never use unknown_intent to say what you are about to do. Call the tool directly. " +
    "NEVER say 'let me list...', 'I will fetch...', 'please wait' — just call the tool. " +
    "If you want to say 'I will look up users first' — DO NOT. Instead: call get_users immediately. " +
    "unknown_intent is ONLY for greetings, out-of-scope requests, or genuine ambiguity — NOT for announcements or intermediate steps. " +

    "CRITICAL — data integrity rules: " +
    "NEVER invent, guess, or fabricate any IDs, emails, names, or other data values. " +
    "Only use IDs that appear in the tool results you have received in this conversation. " +
    "If the user refers to an item by name or alias (e.g. 'delete test user', 'remove sabzi'), call the list tool first to find the real UUID. " +
    "If the user provides an email address directly (e.g. 'delete test@test.com'), pass it as the email parameter — do NOT call get_users first. " +
    "Use context from conversation history to resolve references like 'that user', 'the role above', 'their permissions'. " +

    "When the user asks about permissions of a role, use get_role_permissions. " +
    "When the user asks about permissions of a user, use get_user_permissions. " +
    "For greetings or small talk, call unknown_intent with a warm welcome message explaining what you can do. " +
    "For ambiguous requests with no prior context, call unknown_intent and ask a specific clarifying question. " +
    "For requests outside your capabilities, call unknown_intent and politely redirect to what you can do.";

const MAX_HISTORY_MESSAGES = 10;

function trimHistory(history: ChatMessage[]): ChatMessage[] {
    if (history.length <= MAX_HISTORY_MESSAGES) return history;
    const trimmed = history.slice(-MAX_HISTORY_MESSAGES);
    if (trimmed[0]?.role === "assistant") return trimmed.slice(1);
    return trimmed;
}

function parseArgs(raw: string): Record<string, unknown> {
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
        return {};
    }
}

async function callGroq(messages: Groq.Chat.Completions.ChatCompletionMessageParam[]): Promise<Groq.Chat.Completions.ChatCompletion> {
    let response: Groq.Chat.Completions.ChatCompletion | undefined;
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
    return response;
}

export async function runAgentLoop(
    message: string,
    history: ChatMessage[],
    executor: (tool: ToolName, args: Record<string, unknown>) => Promise<string>,
    quotedMessage?: QuotedMessage,
    maxSteps = 8
): Promise<string> {
    const trimmedHistory = trimHistory(history);

    const contextualMessage = quotedMessage
        ? `[Replying to ${quotedMessage.role === "assistant" ? "assistant" : "user"} message: "${quotedMessage.content.slice(0, 200)}"]\n\n${message}`
        : message;

    const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: SYSTEM_PROMPT },
        ...trimmedHistory.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
        })),
        { role: "user", content: contextualMessage },
    ];

    for (let step = 0; step < maxSteps; step++) {
        const response = await callGroq(messages);
        const msg = response.choices[0].message;

        if (!msg.tool_calls || msg.tool_calls.length === 0) {
            return msg.content?.trim() ?? "I couldn't process your request.";
        }

        const toolCall = msg.tool_calls[0];
        const toolName = toolCall.function.name as ToolName;
        const args = parseArgs(toolCall.function.arguments);

        console.log(`[agent] step=${step + 1} tool=${toolName} args=${JSON.stringify(args)}`);

        if (toolName === "unknown_intent") {
            const announcement = (args.message as string) ?? "";
            const NARRATION = /\b(let me|i will|i'll|i need to|i'm going to|i am going to|looking up|going to|hang on|please wait|first[,\s]|finding|searching|checking|fetch)\b/i;
            if (NARRATION.test(announcement)) {
                // Model is narrating — inject a correction and retry
                messages.push({
                    role: "assistant",
                    content: msg.content ?? null,
                    tool_calls: msg.tool_calls,
                } as Groq.Chat.Completions.ChatCompletionMessageParam);
                messages.push({
                    role: "tool" as const,
                    tool_call_id: toolCall.id,
                    content: "WRONG: Do not use unknown_intent to announce what you will do. Call the correct tool right now — get_users, get_products, delete_user, etc.",
                } as Groq.Chat.Completions.ChatCompletionMessageParam);
                console.log(`[agent] step=${step + 1} narration_corrected message="${announcement.slice(0, 80)}"`);
                continue;
            }
            return announcement || "I can only help with products, users, roles, and permissions.";
        }

        const result = await executor(toolName, args);

        // Lookup tool — feed result back so AI can continue to the action step
        if (LOOKUP_TOOLS.has(toolName)) {
            messages.push({
                role: "assistant",
                content: msg.content ?? null,
                tool_calls: msg.tool_calls,
            } as Groq.Chat.Completions.ChatCompletionMessageParam);
            messages.push({
                role: "tool" as const,
                tool_call_id: toolCall.id,
                content: result,
            } as Groq.Chat.Completions.ChatCompletionMessageParam);
            continue;
        }

        // Action tool — done, return result directly
        return result;
    }

    return "I wasn't able to complete the request in time. Please try a more specific request.";
}
