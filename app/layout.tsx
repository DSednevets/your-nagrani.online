import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "НАГРАНИ — Исследование личности с AI",
  description: "AI-ассистент для глубокого исследования личности. Пойми себя глубже.",
  openGraph: {
    title: "НАГРАНИ — Исследование личности с AI",
    description: "AI-ассистент для глубокого исследования личности. Пойми себя глубже.",
    url: "https://your-nagrani.online",
    siteName: "НАГРАНИ",
    locale: "ru_RU",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased bg-white text-gray-900">{children}</body>
    </html>
  );
}
