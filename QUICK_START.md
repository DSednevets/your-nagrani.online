# QUICK START GUIDE
## Краткая шпаргалка для разработки your-nagrani.online

---

## 🚀 СТАРТ ЗА 5 МИНУТ

```bash
# 1. Создать проект
npx create-next-app@latest your-nagrani --typescript --tailwind --eslint
cd your-nagrani

# 2. Установить зависимости
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install @anthropic-ai/sdk stripe @stripe/stripe-js
npm install zustand react-query clsx tailwind-merge

# 3. Создать .env.local
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[SERVICE-ROLE-KEY]
ANTHROPIC_API_KEY=[CLAUDE-API-KEY]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[STRIPE-PUB-KEY]
STRIPE_SECRET_KEY=[STRIPE-SECRET-KEY]
STRIPE_WEBHOOK_SECRET=[STRIPE-WEBHOOK-SECRET]
EOF

# 4. Запустить dev сервер
npm run dev
# Открыть http://localhost:3000
```

---

## 📁 СТРУКТУРА ПАПОК (сразу создать)

```bash
mkdir -p app/auth/register
mkdir -p app/auth/login
mkdir -p app/chat
mkdir -p app/dashboard
mkdir -p app/pricing
mkdir -p app/profile
mkdir -p app/api/auth
mkdir -p app/api/chat
mkdir -p app/api/ai
mkdir -p app/api/subscription
mkdir -p app/api/user
mkdir -p components
mkdir -p hooks
mkdir -p lib
mkdir -p styles
mkdir -p public
```

---

## 🔗 ВАЖНЫЕ ССЫЛКИ

### Сервисы которые нужны:

1. **Supabase** (БД + Auth)
   - Создать проект: https://supabase.com
   - Документация: https://supabase.com/docs
   - Необходимо: `SUPABASE_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`

2. **Anthropic Claude API** (AI)
   - Создать ключ: https://console.anthropic.com
   - Документация: https://docs.anthropic.com/
   - Необходимо: `ANTHROPIC_API_KEY`

3. **Stripe** (Платежи)
   - Создать аккаунт: https://stripe.com
   - Документация: https://stripe.com/docs
   - Необходимо: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`

---

## 📝 ОСНОВНЫЕ ФАЙЛЫ (порядок создания)

### Шаг 1: Конфиг и утилиты

**`lib/supabase.ts`**
```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const supabaseServer = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
```

**`lib/constants.ts`**
```typescript
export const SYSTEM_PROMPT = `Ты — не коуч и не советчик...` // весь промт

export const CHAT_MODES = {
  FREE_TRIAL: 'free_trial',
  PREMIUM: 'premium'
};

export const SUBSCRIPTION_STATUS = {
  FREE: 'free',
  ACTIVE: 'active',
  CANCELLED: 'cancelled'
};
```

### Шаг 2: Хуки

**`hooks/useAuth.ts`** ← смотри в CLAUDE_CODE_PROMPT.md  
**`hooks/useChat.ts`** ← смотри в CLAUDE_CODE_PROMPT.md

### Шаг 3: Компоненты

**`components/Header.tsx`** - навигация, логотип, профиль  
**`components/Footer.tsx`** - футер, соцсети  
**`components/ChatInterface.tsx`** - основная страница чата  
**`components/MessageList.tsx`** - список сообщений  
**`components/MessageInput.tsx`** - инпут для ввода  

### Шаг 4: Страницы

**`app/page.tsx`** - лендинг  
**`app/auth/register/page.tsx`** - регистрация  
**`app/auth/login/page.tsx`** - логин  
**`app/chat/[id]/page.tsx`** - чат  
**`app/dashboard/page.tsx`** - история  
**`app/pricing/page.tsx`** - тарифы  
**`app/profile/page.tsx`** - профиль  

### Шаг 5: API Routes

**`app/api/ai/process-message/route.ts`** ← главный endpoint  
**`app/api/chat/send-message/route.ts`** ← сохранение сообщений  
**`app/api/chat/history/[id]/route.ts`** ← загрузка истории  
**`app/api/subscription/create-checkout/route.ts`** ← Stripe  
**`app/api/subscription/webhook/route.ts`** ← Stripe webhook  

---

## 🗄️ SETUP БАЗЫ ДАННЫХ

Скопируй и выполни в Supabase SQL Editor:

```sql
-- Таблица пользователей
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  subscription_status VARCHAR(50) DEFAULT 'free',
  subscription_end_date TIMESTAMP,
  stripe_customer_id VARCHAR(255)
);

-- Таблица диалогов
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'active',
  conversation_mode VARCHAR(50) DEFAULT 'free_trial'
);

-- Таблица сообщений
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  message_number INT
);

-- Таблица подписок
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  status VARCHAR(50),
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS политики
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own conversations" ON conversations
FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own messages" ON messages
FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM conversations WHERE id = conversation_id)
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscriptions" ON subscriptions
FOR SELECT USING (auth.uid() = user_id);
```

---

## 🎨 TAILWIND COLORS

Добавить в `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      primary: '#000000',
      secondary: '#666666',
      light: '#F5F5F5',
      border: '#E0E0E0',
      text: {
        primary: '#1A1A1A',
        secondary: '#666666',
      }
    },
  },
}
```

---

## 🔐 ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ CHECKLIST

**Supabase:**
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY

**Claude:**
- [ ] ANTHROPIC_API_KEY

**Stripe:**
- [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- [ ] STRIPE_SECRET_KEY
- [ ] STRIPE_WEBHOOK_SECRET

**Как получить:**
```
Supabase: Project Settings → API
Claude: console.anthropic.com → API keys
Stripe: Dashboard → Developers → API keys
```

---

## 🧪 ТЕСТИРОВАНИЕ ЛОКАЛЬНО

### Регистрация и Логин
```
Email: test@example.com
Password: TestPassword123
```

### Тестирование AI
```
Первое сообщение: "Расскажи о моменте в жизни, когда ты чувствовал: вот сейчас я настоящий."
Ответ: "Когда я запустил свой проект..."
```

### Тестирование Stripe (режим Test)
```
Карточка: 4242 4242 4242 4242
Дата: любая будущая (12/34)
CVC: любые 3 цифры
```

---

## 📊 ОСНОВНЫЕ API ENDPOINTS

### Auth
```
POST /api/auth/register - регистрация
POST /api/auth/login - логин
POST /api/auth/logout - выход
```

### Chat
```
POST /api/chat/send-message - отправить сообщение
GET /api/chat/history/[id] - загрузить историю
GET /api/chat/conversations - список диалогов
```

### AI (главный!)
```
POST /api/ai/process-message
{
  conversation_id: string,
  user_message: string,
  conversation_history: [],
  message_count: number
}
```

### Subscription
```
POST /api/subscription/create-checkout - создать платеж
GET /api/subscription/check-status - проверить статус
POST /api/subscription/webhook - Stripe webhook
```

---

## 🐛 DEBUGGING TIPS

### Проблема: Auth не работает
```
1. Проверь NEXT_PUBLIC_SUPABASE_URL
2. Проверь NEXT_PUBLIC_SUPABASE_ANON_KEY
3. Проверь что Supabase auth включен
4. Проверь браузер console (F12)
```

### Проблема: Claude API не работает
```
1. Проверь ANTHROPIC_API_KEY
2. Проверь что ключ имеет access
3. Проверь rate limiting (100 req/hour)
4. Проверь network tab в браузере
```

### Проблема: Сообщения не сохраняются
```
1. Проверь что БД таблицы созданы
2. Проверь RLS политики
3. Проверь что пользователь аутентифицирован
4. Посмотри Supabase logs
```

### Проблема: Stripe не работает
```
1. Используешь тестовые ключи?
2. Проверь что STRIPE_WEBHOOK_SECRET установлен
3. Проверь Stripe webhook endpoint в dashboard
4. Посмотри Stripe logs
```

---

## 💡 БЫСТРЫЕ КОМАНДЫ

```bash
# Запустить dev сервер
npm run dev

# Сбилдить для production
npm run build

# Запустить production версию
npm run start

# Проверить ошибки TypeScript
npm run type-check

# Форматировать код
npm run lint

# Очистить cache
rm -rf .next
rm -rf node_modules
npm install
```

---

## 📚 ДОКУМЕНТАЦИЯ

**Основные файлы ТЗ:**
1. `YOUR_NAGRANI_TECH_SPEC.md` - полное ТЗ
2. `CLAUDE_CODE_PROMPT.md` - код и примеры
3. `AI_ASSISTANT_SYSTEM_PROMPT.md` - промт для ИИ
4. `DESIGN_GUIDE.md` - дизайн и компоненты
5. `DEVELOPMENT_ROADMAP.md` - пошаговый план

**Как использовать:**
```
1. Прочитать YOUR_NAGRANI_TECH_SPEC.md полностью
2. Использовать CLAUDE_CODE_PROMPT.md как шаблоны кода
3. Копировать AI_ASSISTANT_SYSTEM_PROMPT.md в API
4. Следовать DESIGN_GUIDE.md при создании компонентов
5. Держать DEVELOPMENT_ROADMAP.md открытым как чек-лист
```

---

## 🎯 ГЛАВНЫЙ ФЛОУ (помни!)

```
Новый пользователь:
  Регистрация → Автовход → Первый вопрос ИИ
  → 15 вопросов-ответов → Вывод
  → Экран "Требуется подписка" → /pricing
  → Stripe checkout → Подписка активна

Возвращающийся:
  Логин → Dashboard (список чатов)
  → Клик "Продолжить" → Загрузка истории
  → Продолжение диалога в нужном режиме
```

---

## 📞 КОНТАКТЫ

**Email владельца:** dsednevets@gmail.com  
**Домен:** your-nagrani.online  
**DigitalOcean:** (после разработки)

---

## ✅ ПЕРЕД ДЕПЛОЕМ

- [ ] Все API endpoints работают
- [ ] Чат работает (15 вопросов, вывод, redirect)
- [ ] Регистрация и логин работают
- [ ] Подписка работает (Stripe тестовый режим)
- [ ] История диалогов загружается и продолжается
- [ ] Дизайн соответствует Design Guide
- [ ] Нет ошибок в консоли браузера
- [ ] Все переменные окружения установлены

---

**Готово! Начинай кодить в Claude Code! 🚀**

**Помни: открывай файлы ТЗ в параллельном табе и сверяйся с ними!**
