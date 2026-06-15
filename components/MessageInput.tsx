"use client";

import { FormEvent, KeyboardEvent } from "react";
import React from "react";
import type { ReplyTo } from "@/components/MessageList";

interface MessageInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    disabled?: boolean;
    replyTo?: ReplyTo | null;
    onCancelReply?: () => void;
    extraAction?: React.ReactNode;
}

export default function MessageInput({
    value,
    onChange,
    onSubmit,
    disabled,
    replyTo,
    onCancelReply,
    extraAction,
}: MessageInputProps) {
    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (value.trim() && !disabled) onSubmit();
    }

    function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim() && !disabled) onSubmit();
        }
    }

    return (
        <div className="flex flex-col gap-2">
            {replyTo && (
                <div className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-500">
                    <span className="border-l-2 border-blue-500 pl-2 flex-1 truncate">
                        <span className="font-medium text-gray-700 mr-1">
                            {replyTo.role === "assistant" ? "Assistant:" : "You:"}
                        </span>
                        {replyTo.content.slice(0, 100)}
                        {replyTo.content.length > 100 ? "…" : ""}
                    </span>
                    <button
                        onClick={onCancelReply}
                        className="shrink-0 text-gray-400 hover:text-gray-600 font-bold leading-none"
                        title="Cancel reply"
                    >
                        ✕
                    </button>
                </div>
            )}
            <form onSubmit={handleSubmit} className="flex gap-2 items-end">
                {extraAction}
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    rows={1}
                    placeholder="Type a command... (e.g. Create product named Keyboard priced 50)"
                    className="flex-1 resize-none px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-400 disabled:opacity-50 max-h-32"
                    style={{ overflowY: "auto" }}
                />
                <button
                    type="submit"
                    disabled={disabled || !value.trim()}
                    className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl text-sm transition-colors shrink-0"
                >
                    {disabled ? "..." : "Send"}
                </button>
            </form>
        </div>
    );
}
