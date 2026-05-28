"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    console.log("Callback page loaded");

    const handle = async () => {
      const errorParam = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");
      if (errorParam) {
        console.log("OAuth error param:", errorParam, errorDescription);
        setError(errorDescription ?? errorParam);
        return;
      }

      console.log("Code from URL:", searchParams.get("code"));

      const code = searchParams.get("code");
      if (!code) {
        router.replace("/auth/login");
        return;
      }

      try {
        const { data, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) throw exchangeError;

        console.log("Session received:", data.session?.user?.email);

        const user = data.session?.user;
        if (!user) throw new Error("Не удалось получить данные пользователя");

        // Upsert user record (needed for OAuth users who skip the register form)
        await supabase.from("users").upsert({
          id: user.id,
          email: user.email,
          subscription_status: "free",
        });

        // Check if returning user (has at least one conversation)
        const { data: existing } = await supabase
          .from("conversations")
          .select("id")
          .eq("user_id", user.id)
          .limit(1);

        const redirectPath =
          existing && existing.length > 0
            ? "/dashboard"
            : null;

        if (redirectPath) {
          console.log("About to redirect to:", redirectPath);
          router.replace(redirectPath);
          return;
        }

        // New user — create first conversation
        const res = await fetch("/api/chat/conversations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.session?.access_token}`,
          },
        });

        const json = await res.json();
        const chatPath = res.ok && json.conversation?.id
          ? `/chat/${json.conversation.id}`
          : "/dashboard";

        console.log("About to redirect to:", chatPath);
        router.replace(chatPath);
      } catch (err: unknown) {
        console.log("Callback error:", err);
        setError(err instanceof Error ? err.message : "Ошибка входа через Google");
      }
    };

    handle();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <a
            href="/auth/login"
            className="text-sm text-black font-medium hover:underline"
          >
            Вернуться к входу
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-7 h-7 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Входим через Google...</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense>
      <CallbackHandler />
    </Suspense>
  );
}
