"use client";

import { useEffect, useState, useCallback } from "react";
import ChatWindow from "@/components/ChatWindow";
import ChatSidebar from "@/components/ChatSidebar";

interface Chat {
    id: string;
    title: string;
    updatedAt: string;
}

export default function ChatPage() {
    const [chats, setChats] = useState<Chat[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);

    const fetchChats = useCallback(async () => {
        const res = await fetch("/api/chats");
        const data = await res.json();
        if (data.chats) {
            setChats(data.chats);
        }
    }, []);

    // Load chat list on mount and select the most recent chat
    useEffect(() => {
        fetchChats().then(() => {
            setChats((prev) => {
                if (prev.length > 0 && activeChatId === null) {
                    setActiveChatId(prev[0].id);
                }
                return prev;
            });
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleNewChat() {
        setActiveChatId(null);
    }

    function handleSelect(chatId: string) {
        setActiveChatId(chatId);
    }

    function handleChatCreated(chatId: string, title: string) {
        const newChat: Chat = { id: chatId, title, updatedAt: new Date().toISOString() };
        setChats((prev) => [newChat, ...prev]);
        setActiveChatId(chatId);
    }

    return (
        <div className="flex flex-1 min-h-0">
            <ChatSidebar
                chats={chats}
                activeChatId={activeChatId}
                onSelect={handleSelect}
                onNewChat={handleNewChat}
            />
            <div className="flex-1 flex flex-col min-h-0 min-w-0">
                <ChatWindow
                    chatId={activeChatId}
                    onChatCreated={handleChatCreated}
                />
            </div>
        </div>
    );
}
