# PROJECT CONTEXT — your-nagrani.online
## Для использования в новых чатах Claude

---

## СТЕК

- **Frontend/Backend:** Next.js 15 (App Router, TypeScript)
- **БД + Auth:** Supabase (PostgreSQL + RLS)
- **AI:** Claude API (`claude-sonnet-4-6`) через `@anthropic-ai/sdk`
- **Платежи:** Stripe (подписка $14.49, одноразово)
- **Стили:** Tailwind CSS (светлая тема, шрифт Inter)
- **Деплой:** DigitalOcean (Docker), IP: 161.35.216.172
- **Домен:** your-nagrani.online
- **GitHub:** https://github.com/DSednevets/your-nagrani.online

---

## СТРУКТУРА ФАЙЛОВ

```
your-nagrani.online/
├── app/
│   ├── page.tsx                          ← лендинг
│   ├── layout.tsx                        ← root layout
│   ├── globals.css
│   ├── auth/
│   │   ├── register/page.tsx             ← регистрация → создаёт conversation → /chat/[id]
│   │   └── login/page.tsx               ← логин → /dashboard
│   ├── chat/[id]/page.tsx               ← страница чата (оборачивает ChatInterface)
│   ├── dashboard/page.tsx               ← список бесед пользователя
│   ├── pricing/page.tsx                 ← тарифы + Stripe checkout
│   ├── profile/page.tsx                 ← профиль, статус подписки
│   └── api/
│       ├── ai/process-message/route.ts  ← ГЛАВНЫЙ: вызов Claude API
│       ├── chat/conversations/route.ts  ← GET список / POST создать беседу
│       ├── subscription/
│       │   ├── create-checkout/route.ts ← Stripe checkout session
│       │   └── webhook/route.ts         ← Stripe webhook (обновление статуса)
├── components/
│   ├── ChatInterface.tsx                ← логика чата + онбординг
│   ├── MessageList.tsx                  ← рендер сообщений
│   ├── MessageInput.tsx                 ← textarea + отправка
│   └── Header.tsx                       ← навигация
├── hooks/
│   ├── useAuth.ts                       ← Supabase auth state
│   ├── useChat.ts                       ← messages, sendMessage, loadHistory
│   └── useSubscription.ts              ← статус подписки
├── lib/
│   ├── supabase.ts                      ← lazy Supabase client
│   ├── constants.ts                     ← SYSTEM_PROMPT, FREE_TRIAL_LIMIT=15
│   └── utils.ts                         ← cn(), formatDate(), truncate()
├── Dockerfile
├── deploy.sh                            ← bash deploy.sh → git push + SSH деплой
└── supabase-setup.sql                   ← SQL для создания таблиц
```

---

## БАЗА ДАННЫХ (Supabase)

### Таблицы
```sql
users          (id, email, subscription_status, stripe_customer_id)
conversations  (id, user_id, title, status, conversation_mode, updated_at)
messages       (id, conversation_id, role, content, message_number, created_at)
subscriptions  (id, user_id, stripe_subscription_id, status, current_period_end)
```

### RLS
- Каждый пользователь видит только свои данные
- Серверные API routes используют `SUPABASE_SERVICE_ROLE_KEY` (обход RLS)

---

## ФЛОУ ПОЛЬЗОВАТЕЛЯ

### Новый пользователь
```
/ (лендинг) → /auth/register → создаётся conversation → /chat/[id]
  Онбординг (3 шага, не через API):
    1. Ассистент: "Привет! Готов начать?"
    2. Ассистент: "Как тебя зовут?"
    3. Ассистент: "[Имя], давай начнём спокойно..." + первый вопрос
  Далее: Claude API (счётчик message_count)
  После 15 сообщений: вывод + редирект на /pricing?from=trial
```

### Возвращающийся пользователь
```
/auth/login → /dashboard → клик на беседу → /chat/[id]
  loadHistory() → загрузка из Supabase → продолжение диалога
```

---

## AI ЛОГИКА (app/api/ai/process-message/route.ts)

- Модель: `claude-sonnet-4-6`
- Системный промт: в `lib/constants.ts` → `SYSTEM_PROMPT`
- Лимит free trial: `FREE_TRIAL_LIMIT = 15` (в `lib/constants.ts`)
- При `message_count >= 15` → проверка подписки → 403 если нет
- `is_final_response: true` при `message_count === 14` (15-й обмен)
- Сохраняет user + assistant сообщения в `messages` таблицу

### Системный промт (4 режима)
- **ИССЛЕДОВАНИЕ** — начало, мало данных: отражение → наблюдение → 1 вопрос
- **СБОРКА** — после 7-10 вопросов: структурирование паттернов
- **ПРОРЫВ** — при оправданиях/саботаже: жёстко, коротко
- **ДЕЙСТВИЕ** — есть ясность: конкретный шаг

---

## КОМПОНЕНТ ChatInterface.tsx

### Онбординг (3 шага, локально без API)
```
STEP_IDLE(0) → STEP_GREETED(1) → STEP_ASKED_NAME(2) → STEP_STARTED(3)
```
- Шаг 1: авто-показ "Привет! Готов начать?" при `messages.length === 0`
- Шаг 2: "Как тебя зовут?" после первого ответа пользователя
- Шаг 3: приветствие с именем + реальный вопрос
- С шага STARTED: `sendMessage()` → AI API

### Имя пользователя
```ts
const name = content.trim().replace(/[.,;:!?\s]+$/, "") || "Друг";
```

---

## ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## ДЕПЛОЙ

```bash
# Локально
bash deploy.sh
# → git push + SSH на 161.35.216.172 + docker build + docker run

# На сервере вручную
ssh mila-deploy@161.35.216.172
cd /home/mila-deploy/your-nagrani-online
sudo docker build -t your-nagrani:latest .
sudo docker run -d --env-file .env.production -p 127.0.0.1:3000:3000 \
  --name your-nagrani-site --restart always your-nagrani:latest
```

---

## ТАРИФЫ

| План | Цена | Возможности |
|------|------|-------------|
| Free | $0 | 1 блок ИССЛЕДОВАНИЕ (~15 вопросов) + итоговый вывод |
| Premium | $14.49 | Все 4 режима, неограниченно, история |

---

## ЧАСТЫЕ ЗАДАЧИ → ФАЙЛЫ

| Задача | Файл |
|--------|------|
| Изменить текст лендинга | `app/page.tsx` |
| Изменить онбординг/приветствие | `components/ChatInterface.tsx` |
| Изменить системный промт AI | `lib/constants.ts` → `SYSTEM_PROMPT` |
| Изменить лимит free trial | `lib/constants.ts` → `FREE_TRIAL_LIMIT` |
| Изменить цены | `app/pricing/page.tsx` |
| Изменить навигацию | `components/Header.tsx` |
| Изменить стили сообщений | `components/MessageList.tsx` |
| Добавить API endpoint | `app/api/...` |
| Изменить схему БД | `supabase-setup.sql` + Supabase SQL Editor |
