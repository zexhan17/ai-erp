"use client";

interface Chat {
    id: string;
    title: string;
    updatedAt: string;
}

interface ChatSidebarProps {
    chats: Chat[];
    activeChatId: string | null;
    onSelect: (chatId: string) => void;
    onNewChat: () => void;
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

export default function ChatSidebar({ chats, activeChatId, onSelect, onNewChat }: ChatSidebarProps) {
    return (
        <div className="w-64 shrink-0 flex flex-col bg-white border-r border-gray-200 h-full">
            <div className="p-3 border-b border-gray-200">
                <button
                    onClick={onNewChat}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    New Chat
                </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
                {chats.length === 0 && (
                    <p className="text-xs text-gray-400 text-center px-4 py-6">No chats yet</p>
                )}
                {chats.map((chat) => (
                    <button
                        key={chat.id}
                        onClick={() => onSelect(chat.id)}
                        className={`w-full text-left px-3 py-2.5 mx-1 rounded-lg transition-colors group ${
                            activeChatId === chat.id
                                ? "bg-blue-50 text-blue-700"
                                : "text-gray-700 hover:bg-gray-100"
                        }`}
                        style={{ width: "calc(100% - 8px)" }}
                    >
                        <p className="text-sm font-medium truncate leading-snug">{chat.title}</p>
                        <p className={`text-xs mt-0.5 ${activeChatId === chat.id ? "text-blue-400" : "text-gray-400"}`}>
                            {timeAgo(chat.updatedAt)}
                        </p>
                    </button>
                ))}
            </div>
        </div>
    );
}
