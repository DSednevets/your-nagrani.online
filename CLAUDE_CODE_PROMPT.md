# CLAUDE CODE PROMPT
## Полный гайд для разработки your-nagrani.online

---

## 🚀 БЫСТРЫЙ СТАРТ

### Шаг 1: Инициализация проекта

```bash
npx create-next-app@latest your-nagrani --typescript --tailwind
cd your-nagrani
npm install
```

### Шаг 2: Установка зависимостей

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install @anthropic-ai/sdk
npm install stripe @stripe/stripe-js
npm install zustand react-query
npm install clsx tailwind-merge
npm install --save-dev @types/node @types/react typescript
```

### Шаг 3: Конфигурация переменных окружения

Создать `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

## 📁 СТРУКТУРА ПРОЕКТА

```
your-nagrani/
├── app/
│   ├── layout.tsx
│   ├── page.tsx (лендинг)
│   ├── auth/
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── login/
│   │       └── page.tsx
│   ├── chat/
│   │   └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── pricing/
│   │   └── page.tsx
│   ├── profile/
│   │   └── page.tsx
│   └── api/
│       ├── auth/
│       │   ├── register/route.ts
│       │   ├── login/route.ts
│       │   └── logout/route.ts
│       ├── chat/
│       │   ├── send-message/route.ts
│       │   ├── history/[id]/route.ts
│       │   └── conversations/route.ts
│       ├── ai/
│       │   └── process-message/route.ts
│       ├── subscription/
│       │   ├── check-status/route.ts
│       │   ├── create-checkout/route.ts
│       │   └── webhook/route.ts
│       └── user/
│           └── profile/route.ts
├── components/
│   ├── AuthForm.tsx
│   ├── ChatInterface.tsx
│   ├── MessageList.tsx
│   ├── MessageInput.tsx
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── PricingCard.tsx
│   └── ProtectedRoute.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useChat.ts
│   └── useSubscription.ts
├── lib/
│   ├── supabase.ts
│   ├── stripe.ts
│   ├── api.ts
│   ├── utils.ts
│   └── constants.ts
├── styles/
│   ├── globals.css
│   └── tailwind.config.ts
├── public/
│   └── logo.png (логотип НАГРАНИ)
├── .env.local
├── package.json
└── tsconfig.json
```

---

## 🔧 ОСНОВНЫЕ ФАЙЛЫ

### 1. `lib/supabase.ts` - Инициализация Supabase

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Для серверных API routes используй:
export const supabaseServer = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};
```

### 2. `hooks/useAuth.ts` - Хук аутентификации

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return { user, loading, logout };
}
```

### 3. `hooks/useChat.ts` - Хук для управления чатом

```typescript
import { useState } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export function useChat(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);

  const sendMessage = async (content: string) => {
    setLoading(true);
    try {
      // Отправить на AI endpoint
      const response = await fetch('/api/ai/process-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          user_message: content,
          conversation_history: messages,
          message_count: messageCount
        })
      });

      const data = await response.json();
      
      // Добавить сообщение пользователя
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'user',
        content,
        created_at: new Date().toISOString()
      }]);

      // Добавить ответ ассистента
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.ai_response,
        created_at: new Date().toISOString()
      }]);

      setMessageCount(prev => prev + 1);

      return data;
    } finally {
      setLoading(false);
    }
  };

  return { messages, loading, sendMessage, messageCount };
}
```

### 4. `app/api/ai/process-message/route.ts` - Главный AI endpoint

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabaseServer } from '@/lib/supabase';

const client = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const { conversation_id, user_message, conversation_history, message_count } = 
      await request.json();

    // Получить текущего пользователя
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверить подписку пользователя (если message_count > 15)
    if (message_count >= 15) {
      const supabase = supabaseServer();
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', token)
        .single();

      if (!sub || sub.status !== 'active') {
        return NextResponse.json(
          { error: 'Subscription required' }, 
          { status: 403 }
        );
      }
    }

    // Формировать историю для Claude
    const messages = conversation_history.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    messages.push({
      role: 'user',
      content: user_message
    });

    // Системный промт из документации
    const systemPrompt = `[ПОЛНЫЙ ПРОМТ ИЗ ДОКУМЕНТА выше]`;

    // Вызвать Claude API
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages
    });

    let aiResponse = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';

    // Если это 15+ сообщение, добавить вывод
    const isFinalResponse = message_count >= 14; // 15-й вопрос
    if (isFinalResponse) {
      // Здесь добавить логику для генерации выводов
      const summaryPrompt = `
        На основе всего диалога сформулируй вывод в формате:
        "И вот первый вывод, который я вижу из всего что ты рассказал сегодня.
        Что повторяется в тебе — не случайно:
        Первая линия: ты [анализ]
        ...
        Предварительные гипотезы:
        «Я здесь, чтобы [гипотеза]»
        ..."
      `;
      
      // Добавить это к ответу
      aiResponse += `\n\n[ВЫВОД БЛОКА ИССЛЕДОВАНИЯ]`;
    }

    // Сохранить сообщения в БД
    const supabase = supabaseServer();
    await supabase.from('messages').insert([
      {
        conversation_id,
        role: 'user',
        content: user_message,
        message_number: message_count + 1
      },
      {
        conversation_id,
        role: 'assistant',
        content: aiResponse,
        message_number: message_count + 1
      }
    ]);

    return NextResponse.json({
      ai_response: aiResponse,
      is_final_response: isFinalResponse
    });

  } catch (error) {
    console.error('AI processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
```

### 5. `components/ChatInterface.tsx` - Основной компонент чата

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useChat } from '@/hooks/useChat';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useParams } from 'next/navigation';

export default function ChatInterface() {
  const params = useParams();
  const conversationId = params.id as string;
  const { messages, loading, sendMessage, messageCount } = useChat(conversationId);
  const [isInitialized, setIsInitialized] = useState(false);

  // Загрузить историю чата при монтировании
  useEffect(() => {
    const loadHistory = async () => {
      const response = await fetch(`/api/chat/history/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        // Загрузить сообщения
      }
      setIsInitialized(true);
    };

    loadHistory();
  }, [conversationId]);

  const handleSendMessage = async (content: string) => {
    const result = await sendMessage(content);
    
    if (result.is_final_response) {
      // Показать экран подписки через 2 секунды
      setTimeout(() => {
        // Redirect или показать modal
      }, 2000);
    }
  };

  if (!isInitialized) {
    return <div className="flex justify-center items-center h-screen">Загрузка...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <MessageList messages={messages} />
      <MessageInput 
        onSendMessage={handleSendMessage} 
        disabled={loading}
      />
    </div>
  );
}
```

### 6. `components/MessageList.tsx`

```typescript
'use client';

import { useEffect, useRef } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export default function MessageList({ messages }: { messages: Message[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-md px-4 py-2 rounded-lg ${
              msg.role === 'user'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-black'
            }`}
          >
            <p className="text-sm">{msg.content}</p>
          </div>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
```

### 7. `components/MessageInput.tsx`

```typescript
'use client';

import { useState } from 'react';

export default function MessageInput({ 
  onSendMessage, 
  disabled 
}: { 
  onSendMessage: (message: string) => void;
  disabled: boolean;
}) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Твой ответ..."
          disabled={disabled}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          Отправить
        </button>
      </div>
    </form>
  );
}
```

### 8. `app/auth/register/page.tsx` - Страница регистрации

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password
      });

      if (signUpError) throw signUpError;

      // Автоматически логинить
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (loginError) throw loginError;

      // Создать пользователя в БД
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('users').insert({
        id: user?.id,
        email,
        subscription_status: 'free'
      });

      // Создать первую сессию
      const { data: conversation } = await supabase
        .from('conversations')
        .insert({
          user_id: user?.id,
          title: 'Исследование #1',
          status: 'active',
          conversation_mode: 'free_trial'
        })
        .select()
        .single();

      router.push(`/chat/${conversation.id}`);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-white">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Создать аккаунт</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
          />
          
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль (мин. 8 символов)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
            minLength={8}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Создание...' : 'Создать аккаунт'}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600">
          Уже есть аккаунт?{' '}
          <a href="/auth/login" className="text-black underline">
            Войти
          </a>
        </p>
      </div>
    </div>
  );
}
```

### 9. `app/pricing/page.tsx` - Страница тарифов

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCheckout = async (priceId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/subscription/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_id: priceId })
      });

      const data = await response.json();
      window.location.href = data.checkout_url;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-12 text-center">Выбери план</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <div className="border border-gray-300 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Бесплатный</h2>
            <p className="text-3xl font-bold mb-6">0 ₽</p>
            
            <ul className="space-y-3 mb-8">
              <li>✓ 1 исследование (блок ИССЛЕДОВАНИЕ)</li>
              <li>✓ ~15 вопросов</li>
              <li>✓ Итоговый вывод</li>
            </ul>

            <button disabled className="w-full px-4 py-2 bg-gray-200 text-gray-600 rounded-lg cursor-not-allowed">
              Уже включен
            </button>
          </div>

          {/* Premium Plan */}
          <div className="border-2 border-black rounded-lg p-8 bg-black text-white">
            <h2 className="text-2xl font-bold mb-4">Premium</h2>
            <p className="text-3xl font-bold mb-6">29 $/мес</p>
            
            <ul className="space-y-3 mb-8">
              <li>✓ Все 4 режима (ИССЛЕДОВАНИЕ, СБОРКА, ПРОРЫВ, ДЕЙСТВИЕ)</li>
              <li>✓ Неограниченные исследования</li>
              <li>✓ История всех диалогов</li>
              <li>✓ Приоритетная поддержка</li>
            </ul>

            <button
              onClick={() => handleCheckout('price_premium')}
              disabled={loading}
              className="w-full px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              {loading ? 'Загрузка...' : 'Оформить подписку'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎨 TAILWIND CONFIGURATION

`tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#000000',
        secondary: '#666666',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
```

---

## 🔐 ВАЖНЫЕ МОМЕНТЫ

1. **Секретные ключи**
   - Никогда не коммитить `.env.local`
   - Использовать `.env.local.example` для документации

2. **Безопасность API**
   - Всегда проверять JWT токен в API routes
   - Использовать RLS в Supabase

3. **Rate Limiting**
   - Добавить rate limiting для AI endpoint
   - Max 100 запросов/час на пользователя

4. **CORS**
   - Настроить CORS только для your-nagrani.online

5. **Ошибки**
   - Логировать все ошибки (особенно API)
   - Показывать user-friendly ошибки в UI

---

## 📦 ДЕПЛОЙ CHECKLIST

- [ ] Все переменные окружения установлены на DigitalOcean
- [ ] Supabase migrations выполнены
- [ ] Stripe production keys настроены
- [ ] Domain your-nagrani.online указывает на сервер
- [ ] SSL сертификат установлен
- [ ] Базовое тестирование пройдено
- [ ] Email уведомления работают

---

**Готово! Начинай разработку в Claude Code! 🚀**
