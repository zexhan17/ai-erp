import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface ReplyTo {
    id: string;
    role: "user" | "assistant";
    content: string;
}

export interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    replyTo?: ReplyTo;
}

interface MessageListProps {
    messages: Message[];
    onReply: (message: Message) => void;
}

export default function MessageList({ messages, onReply }: MessageListProps) {
    return (
        <div className="flex flex-col gap-4">
            {messages.length === 0 && (
                <div className="text-center text-gray-400 py-12">
                    <p className="text-lg font-medium">Welcome to AI-ERP</p>
                    <p className="text-sm mt-1">
                        Try: &quot;Create product named Keyboard priced 50&quot; or &quot;Show all products&quot;
                    </p>
                </div>
            )}
            {messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                    <div
                        key={msg.id}
                        className={`flex group ${isUser ? "justify-end" : "justify-start"}`}
                    >
                        {/* Reply button — left side for user messages */}
                        {isUser && (
                            <button
                                onClick={() => onReply(msg)}
                                title="Reply"
                                className="opacity-0 group-hover:opacity-100 transition-opacity self-center mr-2 text-gray-400 hover:text-gray-600 text-xs px-1.5 py-1 rounded"
                            >
                                ↩
                            </button>
                        )}

                        <div className={`max-w-[75%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
                            {/* Quoted message */}
                            {msg.replyTo && (
                                <div
                                    className={`text-xs rounded-lg px-3 py-1.5 max-w-full truncate border-l-2 ${
                                        isUser
                                            ? "bg-blue-500 border-blue-300 text-blue-100"
                                            : "bg-gray-100 border-gray-400 text-gray-500"
                                    }`}
                                    title={msg.replyTo.content}
                                >
                                    <span className="font-medium mr-1">
                                        {msg.replyTo.role === "assistant" ? "Assistant:" : "You:"}
                                    </span>
                                    {msg.replyTo.content.slice(0, 80)}
                                    {msg.replyTo.content.length > 80 ? "…" : ""}
                                </div>
                            )}

                            {/* Message bubble */}
                            <div
                                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                    isUser
                                        ? "bg-blue-600 text-white rounded-br-sm whitespace-pre-wrap"
                                        : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"
                                }`}
                            >
                                {isUser ? msg.content : (
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            table: ({ children }) => (
                                                <div className="overflow-x-auto my-1">
                                                    <table className="border-collapse text-xs w-full">{children}</table>
                                                </div>
                                            ),
                                            thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
                                            th: ({ children }) => (
                                                <th className="border border-gray-200 px-3 py-1.5 text-left font-medium text-gray-700">{children}</th>
                                            ),
                                            td: ({ children }) => (
                                                <td className="border border-gray-200 px-3 py-1.5 text-gray-700">{children}</td>
                                            ),
                                            code: ({ children }) => (
                                                <code className="bg-gray-100 rounded px-1 py-0.5 text-xs font-mono text-gray-700">{children}</code>
                                            ),
                                            p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                )}
                            </div>
                        </div>

                        {/* Reply button — right side for assistant messages */}
                        {!isUser && (
                            <button
                                onClick={() => onReply(msg)}
                                title="Reply"
                                className="opacity-0 group-hover:opacity-100 transition-opacity self-center ml-2 text-gray-400 hover:text-gray-600 text-xs px-1.5 py-1 rounded"
                            >
                                ↩
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
