"use client";

import { useState, useRef, useEffect } from "react";

export default function MessageInput({
  onSendMessage,
  disabled,
}: {
  onSendMessage: (message: string) => void;
  disabled: boolean;
}) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-gray-100 bg-white px-4 py-4"
    >
      <div className="max-w-3xl mx-auto flex gap-3 items-end">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Думаю..." : "Твой ответ... (Enter для отправки)"}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors text-sm max-h-32 disabled:opacity-50 disabled:bg-gray-50"
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="px-5 py-3 bg-black text-white rounded-xl hover:bg-gray-800 disabled:opacity-40 transition-colors text-sm font-medium shrink-0"
        >
          {disabled ? "..." : "Отправить"}
        </button>
      </div>
      <p className="text-center text-xs text-gray-400 mt-2">
        Shift+Enter для переноса строки
      </p>
    </form>
  );
}
