"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export default function Header({ className }: { className?: string }) {
  const { user, loading, logout } = useAuth();

  return (
    <header className={cn("border-b border-gray-100 bg-white", className)}>
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          НАГРАНИ
        </Link>

        <nav className="flex items-center gap-6">
          {!loading && (
            <>
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-sm text-gray-600 hover:text-black transition-colors"
                  >
                    Мои исследования
                  </Link>
                  <Link
                    href="/pricing"
                    className="text-sm text-gray-600 hover:text-black transition-colors"
                  >
                    Тарифы
                  </Link>
                  <button
                    onClick={logout}
                    className="text-sm text-gray-600 hover:text-black transition-colors"
                  >
                    Выйти
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-sm text-gray-600 hover:text-black transition-colors"
                  >
                    Войти
                  </Link>
                  <Link
                    href="/auth/register"
                    className="text-sm bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Начать
                  </Link>
                </>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
