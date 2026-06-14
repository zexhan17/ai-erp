export interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

interface MessageListProps {
    messages: Message[];
}

export default function MessageList({ messages }: MessageListProps) {
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
            {messages.map((msg) => (
                <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                    <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${msg.role === "user"
                                ? "bg-blue-600 text-white rounded-br-sm"
                                : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"
                            }`}
                    >
                        {msg.content}
                    </div>
                </div>
            ))}
        </div>
    );
}
