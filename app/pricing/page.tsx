"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

function PricingContent() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const fromTrial = searchParams.get("from") === "trial";

  const handleCheckout = async () => {
    if (!user) {
      router.push("/auth/register");
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/subscription/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          price_id: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || "price_premium",
        }),
      });

      const data = await res.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-16">
        {fromTrial && (
          <div className="mb-10 p-6 bg-gray-50 border border-gray-100 rounded-2xl text-center">
            <h2 className="text-lg font-semibold mb-2">
              Блок ИССЛЕДОВАНИЕ завершён
            </h2>
            <p className="text-gray-500 text-sm">
              Ты прошёл первый блок. Оформи подписку, чтобы продолжить работу
              в режимах СБОРКА, ПРОРЫВ и ДЕЙСТВИЕ.
            </p>
          </div>
        )}

        <h1 className="text-3xl font-bold text-center mb-12">Выбери план</h1>

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Free Plan */}
          <div className="flex flex-col border border-gray-200 rounded-2xl p-8">
            <h2 className="text-xl font-bold mb-1">Бесплатный</h2>
            <p className="text-3xl font-bold mt-4 mb-6">$0</p>

            <ul className="flex-1 space-y-3 mb-8 text-sm">
              <li className="flex gap-2 items-start">
                <span className="text-green-500 shrink-0">✓</span>
                1 блок ИССЛЕДОВАНИЕ (~15 вопросов)
              </li>
              <li className="flex gap-2 items-start">
                <span className="text-green-500 shrink-0">✓</span>
                Итоговый вывод о паттернах
              </li>
              <li className="flex gap-2 items-start text-gray-400">
                <span className="text-red-500 shrink-0">✗</span>
                Режимы СБОРКА, ПРОРЫВ, ДЕЙСТВИЕ
              </li>
            </ul>

            <button
              disabled
              className="w-full py-3 bg-gray-100 text-gray-400 rounded-xl text-sm font-medium cursor-not-allowed"
            >
              Уже активен
            </button>
          </div>

          {/* Premium Plan */}
          <div className="flex flex-col border-2 border-black rounded-2xl p-8 bg-black text-white">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-bold">Premium</h2>
              <span className="text-xs px-2.5 py-1 bg-white text-black rounded-full font-medium">
                Рекомендуем
              </span>
            </div>
            <p className="text-3xl font-bold mt-4 mb-6">$14.49</p>

            <ul className="flex-1 space-y-3 mb-8 text-sm">
              <li className="flex gap-2 items-start">
                <span className="text-green-400 shrink-0">✓</span>
                Все 4 режима (ИССЛЕДОВАНИЕ → ДЕЙСТВИЕ)
              </li>
              <li className="flex gap-2 items-start">
                <span className="text-green-400 shrink-0">✓</span>
                Неограниченные исследования
              </li>
              <li className="flex gap-2 items-start">
                <span className="text-green-400 shrink-0">✓</span>
                История всех диалогов
              </li>
              <li className="flex gap-2 items-start">
                <span className="text-green-400 shrink-0">✓</span>
                Приоритетная поддержка
              </li>
            </ul>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-3 bg-white text-black rounded-xl text-sm font-medium hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              {loading ? "Загрузка..." : "Оформить подписку"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense>
      <PricingContent />
    </Suspense>
  );
}
