"use client";

import { useState, useRef, useEffect } from "react";
import MessageList, { type Message, type ReplyTo } from "@/components/MessageList";
import MessageInput from "@/components/MessageInput";

interface ChatWindowProps {
    chatId: string | null;
    onChatCreated: (chatId: string, title: string) => void;
}

export default function ChatWindow({ chatId, onChatCreated }: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chatId) {
            setMessages([]);
            setReplyTo(null);
            return;
        }
        setLoadingHistory(true);
        fetch(`/api/chats/${chatId}/messages`)
            .then((res) => res.json())
            .then((data) => {
                if (data.messages) {
                    setMessages(
                        data.messages.map((m: {
                            id: string;
                            role: string;
                            content: string;
                            createdAt: string;
                            replyTo?: { id: string; role: string; content: string } | null;
                        }) => ({
                            id: m.id,
                            role: m.role as "user" | "assistant",
                            content: m.content,
                            timestamp: new Date(m.createdAt),
                            replyTo: m.replyTo
                                ? { id: m.replyTo.id, role: m.replyTo.role as "user" | "assistant", content: m.replyTo.content }
                                : undefined,
                        }))
                    );
                }
            })
            .finally(() => setLoadingHistory(false));
    }, [chatId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function handleSend() {
        const text = input.trim();
        if (!text || loading) return;

        const userMessage: Message = {
            id: crypto.randomUUID(),
            role: "user",
            content: text,
            timestamp: new Date(),
            replyTo: replyTo ?? undefined,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        const capturedReplyTo = replyTo;
        setReplyTo(null);
        setLoading(true);

        try {
            const history = messages.map((m) => ({ role: m.role, content: m.content }));

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: text,
                    history,
                    ...(chatId ? { chatId } : {}),
                    ...(capturedReplyTo ? { replyTo: capturedReplyTo } : {}),
                }),
            });

            const data = await res.json();

            if (data.chatId && data.chatId !== chatId) {
                onChatCreated(data.chatId, text.slice(0, 60));
            }

            const assistantMessage: Message = {
                id: crypto.randomUUID(),
                role: "assistant",
                content: res.ok ? (data.reply ?? "Done.") : (data.error ?? "Something went wrong."),
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: "Network error. Please try again.",
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setLoading(false);
        }
    }

    if (loadingHistory) {
        return (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                Loading messages...
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto px-4 py-6">
                <div className="max-w-3xl mx-auto">
                    <MessageList
                        messages={messages}
                        onReply={(msg) => setReplyTo({ id: msg.id, role: msg.role, content: msg.content })}
                    />
                    {loading && (
                        <div className="flex justify-start mt-4">
                            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                                <span className="text-gray-400 text-sm">Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>
            </div>

            <div className="border-t border-gray-200 bg-white px-4 py-4 shrink-0">
                <div className="max-w-3xl mx-auto">
                    <MessageInput
                        value={input}
                        onChange={setInput}
                        onSubmit={handleSend}
                        disabled={loading}
                        replyTo={replyTo}
                        onCancelReply={() => setReplyTo(null)}
                    />
                </div>
            </div>
        </div>
    );
}
