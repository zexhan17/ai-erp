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
            description: "Call this ONLY when: (1) all requested tasks are fully complete — provide a brief confirmation summary, OR (2) the request is a greeting/small-talk, OR (3) the request is genuinely out-of-scope or ambiguous. NEVER call between steps.",
            parameters: {
                type: "object",
                properties: {
                    message: {
                        type: "string",
                        description: "Confirmation of completed tasks (e.g. 'Created user X and assigned them the Employee role.'), a greeting, or a clarifying question.",
                    },
                },
                required: ["message"],
            },
        },
    },
];

const SYSTEM_PROMPT =
    "You are a friendly and helpful ERP assistant. ALWAYS respond by calling a tool — never reply with plain text. " +
    "You can help with: managing products (create, list, update, delete), managing users (create, list, delete), " +
    "managing roles (list, assign to users, remove from users), and managing permissions (list all, view by user or role, assign/remove from roles). " +

    "CRITICAL — agentic loop: " +
    "Every tool result is automatically fed back to you. You must keep calling tools until ALL requested tasks are done. " +
    "Only call unknown_intent when every task in the user's message is complete — use it to send a brief confirmation. " +
    "Example flow for 'create user X and give employee role': " +
    "  Step 1 → create_user(email, password) — returns new user ID " +
    "  Step 2 → get_roles() — returns role list with real UUIDs " +
    "  Step 3 → assign_role(userId from step 1, roleId from step 2) " +
    "  Step 4 → unknown_intent('Created user X and assigned them the Employee role.') " +
    "Example flow for 'delete test user': " +
    "  Step 1 → get_users() — returns user list " +
    "  Step 2 → delete_user(id from step 1) " +
    "  Step 3 → unknown_intent('Deleted user test@test.com.') " +
    "Example flow for 'list all users': " +
    "  Step 1 → get_users() — returns formatted table " +
    "  Step 2 → unknown_intent(paste the full table exactly as returned) " +

    "CRITICAL — never announce, always act: " +
    "NEVER call unknown_intent to say what you are about to do ('Let me look up...', 'I will fetch...'). " +
    "Call the actual tool directly. unknown_intent is ONLY for: final confirmation, greetings, or genuine ambiguity. " +

    "CRITICAL — data integrity: " +
    "NEVER fabricate IDs. Only use IDs that appear in tool results from this conversation. " +
    "If user refers to something by name (e.g. 'test user'), call the list tool first to find the real UUID. " +
    "If user provides an email directly, pass it as the email parameter to delete_user — no lookup needed. " +

    "When asked about role permissions, use get_role_permissions. " +
    "When asked about user permissions, use get_user_permissions. " +
    "For greetings or small talk, call unknown_intent with a warm welcome message. " +
    "For ambiguous requests, call unknown_intent and ask a clarifying question. " +
    "For out-of-scope requests, call unknown_intent and redirect to what you can do.";

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

class ToolUseFailed extends Error {
    constructor() { super("tool_use_failed"); }
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
            const isToolUseFailed = status === 400 && (err as Error)?.message?.includes("tool_use_failed");
            if (isToolUseFailed) throw new ToolUseFailed();
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

const NARRATION = /\b(let me|i will|i'll|i need to|i'm going to|i am going to|looking up|going to|hang on|please wait|first[,\s]|finding|searching|checking|fetch)\b/i;

export async function runAgentLoop(
    message: string,
    history: ChatMessage[],
    executor: (tool: ToolName, args: Record<string, unknown>) => Promise<string>,
    quotedMessage?: QuotedMessage,
    maxSteps = 12
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

    let lastResult = "";
    let narrationCorrections = 0;
    let toolUseFailures = 0;

    for (let step = 0; step < maxSteps; step++) {
        let response: Groq.Chat.Completions.ChatCompletion;
        try {
            response = await callGroq(messages);
        } catch (err) {
            if (err instanceof ToolUseFailed && toolUseFailures < 2) {
                toolUseFailures++;
                messages.push({
                    role: "user",
                    content: "Your previous tool call had invalid syntax and was rejected. Call the correct tool now with properly formatted arguments.",
                } as Groq.Chat.Completions.ChatCompletionMessageParam);
                console.log(`[agent] tool_use_failed recovery #${toolUseFailures}`);
                continue;
            }
            throw err;
        }
        const msg = response.choices[0].message;

        if (!msg.tool_calls || msg.tool_calls.length === 0) {
            return msg.content?.trim() ?? lastResult ?? "I couldn't process your request.";
        }

        const toolCall = msg.tool_calls[0];
        const toolName = toolCall.function.name as ToolName;
        const args = parseArgs(toolCall.function.arguments);

        console.log(`[agent] step=${step + 1} tool=${toolName} args=${JSON.stringify(args)}`);

        if (toolName === "unknown_intent") {
            const text = (args.message as string) ?? "";
            // Model is narrating instead of acting — correct it once or twice, then give up
            if (NARRATION.test(text) && narrationCorrections < 2) {
                narrationCorrections++;
                messages.push({
                    role: "assistant",
                    content: msg.content ?? null,
                    tool_calls: msg.tool_calls,
                } as Groq.Chat.Completions.ChatCompletionMessageParam);
                messages.push({
                    role: "tool" as const,
                    tool_call_id: toolCall.id,
                    content: "WRONG: Do not announce. Call the correct tool right now.",
                } as Groq.Chat.Completions.ChatCompletionMessageParam);
                console.log(`[agent] narration_corrected (${narrationCorrections}) message="${text.slice(0, 80)}"`);
                continue;
            }
            // Narration corrections exhausted — don't return narration text as reply
            if (NARRATION.test(text)) {
                return lastResult || "I can only help with products, users, roles, and permissions.";
            }
            // Legitimate completion or out-of-scope
            return text || lastResult || "I can only help with products, users, roles, and permissions.";
        }

        // Execute tool — all results feed back so the model can chain actions
        const result = await executor(toolName, args);
        lastResult = result;

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
    }

    return lastResult || "I wasn't able to complete the request in time. Please try a more specific request.";
}
