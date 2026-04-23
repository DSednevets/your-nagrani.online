"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  status: string;
  conversation_mode: string;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      const { data } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      setConversations((data as Conversation[]) || []);
      setFetching(false);
    };

    fetchConversations();
  }, [user]);

  const handleNewConversation = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/chat/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
    });
    const data = await res.json();
    if (!res.ok || !data.conversation?.id) {
      console.error("Failed to create conversation:", data.error);
      return;
    }
    router.push(`/chat/${data.conversation.id}`);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Мои исследования</h1>
          <button
            onClick={handleNewConversation}
            className="px-5 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Новое исследование
          </button>
        </div>

        {fetching ? (
          <p className="text-gray-400 text-sm">Загрузка...</p>
        ) : conversations.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-4">Ещё нет исследований</p>
            <button
              onClick={handleNewConversation}
              className="px-6 py-3 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Начать первое исследование
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/chat/${conv.id}`}
                className="block p-5 border border-gray-100 rounded-xl hover:border-gray-300 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 group-hover:text-black">
                      {conv.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(conv.updated_at)}
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                    {conv.conversation_mode === "premium" ? "Premium" : "Бесплатный"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
