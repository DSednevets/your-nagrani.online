"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  message_number?: number;
}

export function useChat(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [isFinalResponse, setIsFinalResponse] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!conversationId) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading history:", error);
      return;
    }

    if (data) {
      setMessages(data as Message[]);
      const assistantMessages = data.filter((m) => m.role === "assistant");
      setMessageCount(assistantMessages.length);
    }
  }, [conversationId]);

  const sendMessage = async (content: string) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch("/api/ai/process-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          user_message: content,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to get AI response");
      }

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          role: "user",
          content,
          created_at: new Date().toISOString(),
        },
        {
          id: `assistant-${Date.now() + 1}`,
          role: "assistant",
          content: data.ai_response,
          created_at: new Date().toISOString(),
        },
      ]);

      setMessageCount((prev) => prev + 1);

      if (data.is_final_response) {
        setIsFinalResponse(true);
      }

      return data;
    } finally {
      setLoading(false);
    }
  };

  return { messages, setMessages, loading, sendMessage, messageCount, setMessageCount, isFinalResponse, loadHistory };
}
