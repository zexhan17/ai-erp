"use client";

import { FormEvent, KeyboardEvent, useRef } from "react";

interface MessageInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    disabled?: boolean;
}

export default function MessageInput({
    value,
    onChange,
    onSubmit,
    disabled,
}: MessageInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (value.trim() && !disabled) {
            onSubmit();
        }
    }

    function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim() && !disabled) {
                onSubmit();
            }
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
            <textarea
                ref={textareaRef}
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
    );
}
