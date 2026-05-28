"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.612 14.01 17.64 11.81 17.64 9.2z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (oauthError) throw oauthError;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка входа через Google");
      setGoogleLoading(false);
    }
  };

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

        <div className="mt-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">или</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading}
          className="mt-4 w-full py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm flex items-center justify-center gap-3"
        >
          <GoogleIcon />
          {googleLoading ? "Переходим к Google..." : "Войти через Google"}
        </button>

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
