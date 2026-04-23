"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@/hooks/useChat";
import { cn } from "@/lib/utils";

export default function MessageList({ messages }: { messages: Message[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        Загрузка исследования...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={cn(
            "flex",
            msg.role === "user" ? "justify-end" : "justify-start"
          )}
        >
          <div
            className={cn(
              "max-w-2xl px-5 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
              msg.role === "user"
                ? "bg-black text-white rounded-br-sm"
                : "bg-gray-100 text-gray-900 rounded-bl-sm"
            )}
          >
            {msg.content}
          </div>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
