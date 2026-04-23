"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Sign up
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;
      if (!data.user) throw new Error("Не удалось создать пользователя");

      // Sign in immediately (skip email confirmation for now)
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        // If email confirmation needed, redirect to login
        router.push("/auth/login?registered=1");
        return;
      }

      // Create user record in DB
      await supabase.from("users").upsert({
        id: data.user.id,
        email,
        subscription_status: "free",
      });

      // Create first conversation
      const { data: session } = await supabase.auth.getSession();
      const conversationRes = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.session?.access_token}`,
        },
      });

      const conversationData = await conversationRes.json();
      if (!conversationRes.ok || !conversationData.conversation?.id) {
        throw new Error(conversationData.error || "Не удалось создать беседу");
      }
      router.push(`/chat/${conversationData.conversation.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ошибка регистрации";
      if (msg.includes("already registered")) {
        setError("Этот email уже зарегистрирован. Войдите в аккаунт.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-xl font-bold mb-8">
          НАГРАНИ
        </Link>

        <h1 className="text-2xl font-bold mb-1">Создать аккаунт</h1>
        <p className="text-gray-500 text-sm mb-6">
          Начни бесплатное исследование личности
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 8 символов"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors text-sm"
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors text-sm"
          >
            {loading ? "Создаём аккаунт..." : "Начать исследование"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Уже есть аккаунт?{" "}
          <Link href="/auth/login" className="text-black font-medium hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
