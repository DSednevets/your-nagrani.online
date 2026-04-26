"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const { status, isPremium } = useSubscription(user?.id);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

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

      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-10">
        <h1 className="text-2xl font-bold mb-8">Профиль</h1>

        <div className="space-y-4">
          <div className="p-5 border border-gray-100 rounded-xl">
            <p className="text-xs text-gray-400 mb-1">Email</p>
            <p className="text-sm font-medium">{user.email}</p>
          </div>

          <div className="p-5 border border-gray-100 rounded-xl">
            <p className="text-xs text-gray-400 mb-1">Подписка</p>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {isPremium ? "Premium" : "Бесплатный план"}
              </p>
              {!isPremium && (
                <a
                  href="/pricing"
                  className="text-xs px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Улучшить
                </a>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {`Статус: ${status === "active" ? "Активна" : "Не активна"}`}
            </p>
          </div>

          <button
            onClick={logout}
            className="w-full py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:border-gray-400 transition-colors"
          >
            Выйти из аккаунта
          </button>
        </div>
      </main>
    </div>
  );
}
