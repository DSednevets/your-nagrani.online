"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// Minimal inline types for Web Speech API (not in standard TS lib)
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: { length: number; [i: number]: { isFinal: boolean; [j: number]: { transcript: string } } };
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w["SpeechRecognition"] as SpeechRecognitionCtor) ||
    (w["webkitSpeechRecognition"] as SpeechRecognitionCtor) ||
    null;
}

export default function MessageInput({
  onSendMessage,
  disabled,
}: {
  onSendMessage: (message: string) => void;
  disabled: boolean;
}) {
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  // Text in textarea at the moment recording started — interim results append to this
  const baseTextRef = useRef("");

  useEffect(() => {
    setSpeechSupported(getSpeechRecognition() !== null);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) return;

    setVoiceError("");
    baseTextRef.current = input;

    const recognition = new Ctor();
    recognition.lang = "ru-RU";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      // Show interim inline; on final commit
      if (final) {
        const next = baseTextRef.current
          ? `${baseTextRef.current} ${final}`.trimStart()
          : final;
        baseTextRef.current = next;
        setInput(next);
      } else {
        const preview = baseTextRef.current
          ? `${baseTextRef.current} ${interim}`.trimStart()
          : interim;
        setInput(preview);
      }
    };

    recognition.onerror = (e) => {
      const err = (e as Event & { error?: string }).error ?? "unknown";
      if (err === "not-allowed") {
        setVoiceError("Нет доступа к микрофону — разреши в настройках браузера");
      } else if (err !== "no-speech" && err !== "aborted") {
        setVoiceError("Не удалось распознать речь. Попробуй ещё раз");
      }
      setListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [input]);

  const toggleListening = () => {
    if (listening) stopListening();
    else startListening();
  };

  // Stop recognition when component unmounts or chat becomes disabled
  useEffect(() => {
    if (disabled && listening) stopListening();
  }, [disabled, listening, stopListening]);

  useEffect(() => () => { recognitionRef.current?.stop(); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (listening) stopListening();
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-100 bg-white px-4 py-4">
      <div className="max-w-3xl mx-auto flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            listening
              ? "Слушаю..."
              : disabled
              ? "Думаю..."
              : "Твой ответ... (Enter для отправки)"
          }
          disabled={disabled}
          rows={1}
          className={`flex-1 resize-none px-4 py-3 border rounded-xl focus:outline-none transition-colors text-sm max-h-32 disabled:opacity-50 disabled:bg-gray-50 ${
            listening
              ? "border-red-300 focus:border-red-400"
              : "border-gray-200 focus:border-black"
          }`}
        />

        {/* Microphone button — hidden if not supported */}
        {speechSupported && (
          <button
            type="button"
            onClick={toggleListening}
            disabled={disabled}
            title={listening ? "Остановить запись" : "Голосовой ввод"}
            className={`shrink-0 p-3 rounded-xl transition-all duration-200 disabled:opacity-40 ${
              listening
                ? "bg-red-500 text-white shadow-md shadow-red-200 animate-pulse"
                : "border border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-600"
            }`}
          >
            {listening ? (
              // Stop / recording icon
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              // Microphone icon
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z" />
                <path d="M19 10a7 7 0 0 1-14 0" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </button>
        )}

        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="px-5 py-3 bg-black text-white rounded-xl hover:bg-gray-800 disabled:opacity-40 transition-colors text-sm font-medium shrink-0"
        >
          {disabled ? "..." : "Отправить"}
        </button>
      </div>

      <p className="text-center text-xs mt-2 transition-colors duration-200 text-gray-400">
        {listening ? (
          <span className="text-red-400">Говори — текст появится автоматически</span>
        ) : voiceError ? (
          <span className="text-red-500">{voiceError}</span>
        ) : (
          "Shift+Enter для переноса строки"
        )}
      </p>
    </form>
  );
}
