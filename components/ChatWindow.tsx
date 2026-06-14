"use client";

import { useState, useRef, useEffect } from "react";
import MessageList, { type Message } from "@/components/MessageList";
import MessageInput from "@/components/MessageInput";

export default function ChatWindow() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

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
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            // Include conversation history so Gemini has context for follow-up questions
            const history = messages.map((m) => ({ role: m.role, content: m.content }));

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text, history }),
            });

            const data = await res.json();

            const assistantMessage: Message = {
                id: crypto.randomUUID(),
                role: "assistant",
                content:
                    res.ok
                        ? (data.reply ?? "Done.")
                        : (data.error ?? "Something went wrong."),
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

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-4 py-6">
                <div className="max-w-3xl mx-auto">
                    <MessageList messages={messages} />
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

            <div className="border-t border-gray-200 bg-white px-4 py-4">
                <div className="max-w-3xl mx-auto">
                    <MessageInput
                        value={input}
                        onChange={setInput}
                        onSubmit={handleSend}
                        disabled={loading}
                    />
                </div>
            </div>
        </div>
    );
}
