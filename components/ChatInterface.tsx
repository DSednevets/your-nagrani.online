"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useChat, type Message } from "@/hooks/useChat";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { FREE_TRIAL_LIMIT } from "@/lib/constants";

// Onboarding steps before real AI conversation starts
const STEP_IDLE = 0;
const STEP_GREETED = 1;   // shown "Привет! Готов начать?"
const STEP_ASKED_NAME = 2; // shown "Как тебя зовут?"
const STEP_STARTED = 3;    // real AI conversation running

function makeMsg(role: "user" | "assistant", content: string): Message {
  return { id: `${role}-${Date.now()}-${Math.random()}`, role, content, created_at: new Date().toISOString() };
}

export default function ChatInterface({
  conversationId,
}: {
  conversationId: string;
}) {
  const router = useRouter();
  const {
    messages,
    setMessages,
    loading,
    sendMessage,
    messageCount,
    setMessageCount,
    isFinalResponse,
    loadHistory,
  } = useChat(conversationId);

  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState("");
  const [onboardingStep, setOnboardingStep] = useState(STEP_IDLE);
  const [userName, setUserName] = useState("");

  // Load history then decide if onboarding is needed
  useEffect(() => {
    loadHistory().then(() => setInitialized(true));
  }, [loadHistory]);

  // After history loads: if no messages → start onboarding
  // Uses onboardingStep (state, not ref) as guard — works correctly in React 18 Strict Mode
  useEffect(() => {
    if (!initialized || onboardingStep !== STEP_IDLE) return;

    if (messages.length === 0) {
      setMessages([makeMsg("assistant", "Привет! Готов начать?")]);
      setOnboardingStep(STEP_GREETED);
    } else {
      setOnboardingStep(STEP_STARTED);
    }
  }, [initialized, messages.length, onboardingStep, setMessages]);

  useEffect(() => {
    if (isFinalResponse) {
      setTimeout(() => router.push("/pricing?from=trial"), 3000);
    }
  }, [isFinalResponse, router]);

  const handleSend = async (content: string) => {
    setError("");

    // Onboarding step 1: user responded to "Привет! Готов начать?"
    if (onboardingStep === STEP_GREETED) {
      setMessages((prev) => [
        ...prev,
        makeMsg("user", content),
        makeMsg("assistant", "Как тебя зовут?"),
      ]);
      setOnboardingStep(STEP_ASKED_NAME);
      return;
    }

    // Onboarding step 2: user gave their name
    if (onboardingStep === STEP_ASKED_NAME) {
      const name = content.trim().replace(/[.,;:!?\s]+$/, "") || "Друг";
      setUserName(name);

      const welcomeText =
        `${name}, давай начнём спокойно.\n\n` +
        `Я не буду давать тебе быстрые советы. Моя задача — разобраться вместе с тобой: где ты по-настоящему живой, сильный и настоящий. Из этого потом сложится более точная картина и понятные следующие шаги.\n\n` +
        `Отвечай так, как чувствуешь. Не обязательно идеально или правильно — важнее, чтобы было честно и с примерами.\n\n` +
        `Расскажи о моменте в жизни, когда ты чувствовал: «вот сейчас я настоящий». Это может быть что угодно — работа, разговор, действие или случайный эпизод. Главное это твоё внутреннее ощущение, что ты на своём месте.`;

      setMessages((prev) => [
        ...prev,
        makeMsg("user", content),
        makeMsg("assistant", welcomeText),
      ]);
      setOnboardingStep(STEP_STARTED);
      return;
    }

    // Normal AI conversation
    try {
      await sendMessage(content);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ошибка отправки";
      if (msg === "Subscription required") {
        router.push("/pricing?from=trial");
      } else {
        setError(msg);
      }
    }
  };

  if (!initialized) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Загрузка...</p>
      </div>
    );
  }

  // Count only real AI exchanges (exclude onboarding messages)
  const realMessageCount = onboardingStep === STEP_STARTED ? messageCount : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Progress bar — only shown after onboarding */}
      {onboardingStep === STEP_STARTED && (
        <div className="px-4 py-2 border-b border-gray-100">
          <div className="max-w-3xl mx-auto flex items-center justify-between text-xs text-gray-400">
            <span>Блок ИССЛЕДОВАНИЕ</span>
            <span>{Math.min(realMessageCount, FREE_TRIAL_LIMIT)}/{FREE_TRIAL_LIMIT}</span>
          </div>
          <div className="max-w-3xl mx-auto mt-1 h-0.5 bg-gray-100 rounded">
            <div
              className="h-full bg-black rounded transition-all duration-500"
              style={{ width: `${Math.min((realMessageCount / FREE_TRIAL_LIMIT) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {isFinalResponse && (
        <div className="bg-gray-900 text-white text-center text-sm py-3 px-4">
          Блок ИССЛЕДОВАНИЕ завершён. Перехожу к тарифам...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-700 text-sm py-2 px-4">
          {error}
        </div>
      )}

      <MessageList messages={messages} />
      <MessageInput
        onSendMessage={handleSend}
        disabled={loading || isFinalResponse}
      />
    </div>
  );
}
