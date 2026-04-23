# ПЛАН РАЗРАБОТКИ: your-nagrani.online
## Пошаговая дорожная карта с приоритетами

---

## 📅 ОБЩАЯ ОЦЕНКА

**Общее время разработки:** 3-4 недели  
**Первый MVP:** 2 недели  
**Полная готовность к деплою:** 3-4 недели  

**Распределение по фазам:**
- Фаза 1 (Основа): 5-6 дней
- Фаза 2 (AI интеграция): 5-6 дней
- Фаза 3 (Платежи): 3-4 дня
- Фаза 4 (Полирование): 3-4 дня

---

## ✅ ФАЗА 1: ОСНОВНАЯ ИНФРАСТРУКТУРА (5-6 дней)

### День 1: Setup проекта

**ЗАДАЧИ:**
- [ ] Создать Next.js проект с TypeScript
- [ ] Установить все зависимости (Tailwind, Supabase, и т.д.)
- [ ] Настроить структуру папок
- [ ] Создать `.env.local` с переменными

**КОМАНДЫ:**
```bash
npx create-next-app@latest your-nagrani --typescript --tailwind --eslint
cd your-nagrani
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install zustand react-query clsx tailwind-merge
```

**ФАЙЛЫ СОЗДАТЬ:**
- [ ] `lib/supabase.ts` - инициализация Supabase
- [ ] `tailwind.config.ts` - конфигурация цветов
- [ ] `.env.local` - переменные окружения
- [ ] `app/layout.tsx` - главный layout

**ВРЕМЕННАЯ ОЦЕНКА:** 1 день

---

### День 2-3: Аутентификация

**ЗАДАЧИ:**
- [ ] Создать страницу регистрации (`/auth/register`)
- [ ] Создать страницу логина (`/auth/login`)
- [ ] Создать хук `useAuth.ts`
- [ ] Создать компонент `ProtectedRoute.tsx`
- [ ] API endpoints для auth

**ФАЙЛЫ СОЗДАТЬ:**
- [ ] `app/auth/register/page.tsx`
- [ ] `app/auth/login/page.tsx`
- [ ] `components/AuthForm.tsx`
- [ ] `components/ProtectedRoute.tsx`
- [ ] `hooks/useAuth.ts`
- [ ] `app/api/auth/register/route.ts`
- [ ] `app/api/auth/login/route.ts`
- [ ] `app/api/auth/logout/route.ts`

**ФУНКЦИОНАЛ:**
- Email + password регистрация
- Email + password логин
- JWT токены (Supabase делает)
- Редирект после регистрации на чат
- Проверка аутентификации на защищенных страницах

**ВРЕМЕННАЯ ОЦЕНКА:** 2 дня

---

### День 4: Дизайн и Лендинг

**ЗАДАЧИ:**
- [ ] Создать компонент Header
- [ ] Создать компонент Footer
- [ ] Создать главную страницу (лендинг)
- [ ] Применить дизайн гайд (светлая тема)

**ФАЙЛЫ СОЗДАТЬ:**
- [ ] `components/Header.tsx`
- [ ] `components/Footer.tsx`
- [ ] `app/page.tsx` (лендинг)
- [ ] `app/layout.tsx` (обновить)

**ДИЗАЙН:**
- Светлая тема (#FFFFFF фон, #000000 текст)
- Логотип НАГРАНИ в хедере
- Минимализм (как на nagrani.online)
- Responsive на всех устройствах

**ВРЕМЕННАЯ ОЦЕНКА:** 1 день

---

### День 5-6: База данных

**ЗАДАЧИ:**
- [ ] Создать таблицы в Supabase (БД schema)
- [ ] Настроить RLS политики
- [ ] Создать миграции (если нужно)

**ТАБЛИЦЫ:**
```sql
-- users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  subscription_status VARCHAR(50),
  subscription_end_date TIMESTAMP,
  stripe_customer_id VARCHAR(255)
);

-- conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50),
  conversation_mode VARCHAR(50)
);

-- messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  role VARCHAR(50),
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  message_number INT
);

-- subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  stripe_subscription_id VARCHAR(255),
  status VARCHAR(50),
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**RLS ПОЛИТИКИ:**
```sql
-- Users могут видеть только свои данные
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own conversations" ON conversations
FOR SELECT USING (auth.uid() = user_id);

-- Similar для messages
```

**ВРЕМЕННАЯ ОЦЕНКА:** 1 день

---

## ✅ ФАЗА 2: ЧАТИНТЕРФЕЙС И AI (5-6 дней)

### День 1: UI для чата

**ЗАДАЧИ:**
- [ ] Создать компонент `ChatInterface.tsx`
- [ ] Создать компонент `MessageList.tsx`
- [ ] Создать компонент `MessageInput.tsx`
- [ ] Создать хук `useChat.ts`

**ФАЙЛЫ СОЗДАТЬ:**
- [ ] `components/ChatInterface.tsx`
- [ ] `components/MessageList.tsx`
- [ ] `components/MessageInput.tsx`
- [ ] `hooks/useChat.ts`
- [ ] `app/chat/[id]/page.tsx`

**ФУНКЦИОНАЛ:**
- Отображение сообщений
- Инпут для ввода текста
- Скролл вниз при новом сообщении
- Разный стиль для user/assistant сообщений
- Загрузка истории из БД

**ВРЕМЕННАЯ ОЦЕНКА:** 1 день

---

### День 2: AI API endpoint (основной)

**ЗАДАЧИ:**
- [ ] Создать endpoint `/api/ai/process-message`
- [ ] Интегрировать Claude API
- [ ] Реализовать счетчик вопросов
- [ ] Реализовать сохранение сообщений в БД

**ФАЙЛ СОЗДАТЬ:**
- [ ] `app/api/ai/process-message/route.ts`

**ФУНКЦИОНАЛ:**
```typescript
POST /api/ai/process-message
Input:
{
  conversation_id: string,
  user_message: string,
  conversation_history: Message[],
  message_count: number
}

Output:
{
  ai_response: string,
  is_final_response: boolean,
  message_count: number
}
```

**КЛЮЧЕВЫЕ МОМЕНТЫ:**
- Использовать Claude Sonnet 4
- Передавать полную историю диалога
- Проверять подписку (если message_count >= 15)
- Сохранять сообщения в БД

**ВРЕМЕННАЯ ОЦЕНКА:** 1.5 дня

---

### День 3: Системный промт и логика

**ЗАДАЧИ:**
- [ ] Добавить полный системный промт (из документа)
- [ ] Реализовать счетчик вопросов (15+)
- [ ] Реализовать вывод в конце первого блока
- [ ] Тестирование диалога

**ФУНКЦИОНАЛ:**
- Правильно работает режим ИССЛЕДОВАНИЕ
- На 15-м вопросе добавляется вывод
- Вывод содержит 3 линии + гипотезу
- После вывода показывается экран "Требуется подписка"

**ТЕСТИРОВАНИЕ:**
```
1. Регистрация → автоматический вход
2. Первое сообщение ассистента: "Расскажи о моменте..."
3. 15 вопросов-ответов
4. 15-й ответ + вывод
5. Redirect на /pricing
```

**ВРЕМЕННАЯ ОЦЕНКА:** 1.5 дня

---

### День 4: Dashboard и история чатов

**ЗАДАЧИ:**
- [ ] Создать компонент Dashboard
- [ ] Вывести список всех диалогов
- [ ] Функция "Продолжить диалог"
- [ ] API endpoint для получения истории

**ФАЙЛЫ СОЗДАТЬ:**
- [ ] `components/Dashboard.tsx`
- [ ] `app/dashboard/page.tsx`
- [ ] `app/api/chat/conversations/route.ts`
- [ ] `app/api/chat/history/[id]/route.ts`

**ФУНКЦИОНАЛ:**
- Список всех диалогов пользователя
- Дата, заголовок для каждого
- Кнопка "Продолжить"
- Кнопка "Удалить"
- При клике "Продолжить" загружается история и открывается чат

**ВРЕМЕННАЯ ОЦЕНКА:** 1 день

---

### День 5: Загрузка истории и продолжение диалога

**ЗАДАЧИ:**
- [ ] Реализовать загрузку истории при открытии диалога
- [ ] Реализовать продолжение диалога с правильным message_count
- [ ] Тестирование всего флоу

**ФУНКЦИОНАЛ:**
- При открытии чата загружается вся история
- message_count выставляется правильно
- Ассистент переключается в соответствующий режим
- Диалог продолжается с учетом всей истории

**ВРЕМЕННАЯ ОЦЕНКА:** 1 день

---

## ✅ ФАЗА 3: ПЛАТЕЖИ И ПОДПИСКА (3-4 дня)

### День 1: Stripe интеграция

**ЗАДАЧИ:**
- [ ] Создать Stripe аккаунт (тестовый и production)
- [ ] Создать products и prices в Stripe
- [ ] Установить Stripe SDK
- [ ] Создать API endpoints для подписок

**ФАЙЛЫ СОЗДАТЬ:**
- [ ] `lib/stripe.ts`
- [ ] `app/api/subscription/create-checkout/route.ts`
- [ ] `app/api/subscription/check-status/route.ts`

**ФУНКЦИОНАЛ:**
```typescript
POST /api/subscription/create-checkout
Input: { plan_id: string }
Output: { checkout_url: string }

GET /api/subscription/check-status
Output: { status, end_date, can_continue }
```

**ВРЕМЕННАЯ ОЦЕНКА:** 1.5 дня

---

### День 2: Страница тарифов

**ЗАДАЧИ:**
- [ ] Создать страницу `/pricing`
- [ ] Вывести два плана (Free и Premium)
- [ ] Кнопка оформления подписки

**ФАЙЛ СОЗДАТЬ:**
- [ ] `app/pricing/page.tsx`

**ФУНКЦИОНАЛ:**
- Информация о Free плане (1 блок, бесплатно)
- Информация о Premium плане ($29/мес)
- Кнопка "Оформить подписку" → Stripe
- Красивый дизайн согласно Design Guide

**ВРЕМЕННАЯ ОЦЕНКА:** 0.5 дня

---

### День 3: Webhook для синхронизации

**ЗАДАЧИ:**
- [ ] Создать endpoint для Stripe webhook
- [ ] Обновлять статус подписки при платеже
- [ ] Обновлять дату окончания подписки

**ФАЙЛ СОЗДАТЬ:**
- [ ] `app/api/subscription/webhook/route.ts`

**СОБЫТИЯ:**
- `checkout.session.completed` → создать подписку
- `customer.subscription.updated` → обновить статус
- `customer.subscription.deleted` → отменить подписку

**ВРЕМЕННАЯ ОЦЕНКА:** 1 день

---

### День 4: Проверка подписки в API

**ЗАДАЧИ:**
- [ ] Добавить проверку подписки в `/api/ai/process-message`
- [ ] Блокировать доступ если нет подписки после 15 вопросов
- [ ] Тестирование всего флоу платежей

**ФУНКЦИОНАЛ:**
- Free пользователи могут пройти 15 вопросов бесплатно
- После 15 вопросов требуется подписка
- Если подписка не активна → ошибка 403
- Пользователь видит экран "Требуется подписка" → redirect на /pricing

**ВРЕМЕННАЯ ОЦЕНКА:** 0.5 дня

---

## ✅ ФАЗА 4: ПОЛИРОВАНИЕ И ДЕПЛОЙ (3-4 дня)

### День 1: Профиль пользователя

**ЗАДАЧИ:**
- [ ] Создать страницу `/profile`
- [ ] Вывести информацию о пользователе
- [ ] Показать статус подписки
- [ ] Кнопка смены пароля
- [ ] Кнопка удаления аккаунта

**ФАЙЛ СОЗДАТЬ:**
- [ ] `app/profile/page.tsx`
- [ ] `app/api/user/profile/route.ts`

**ВРЕМЕННАЯ ОЦЕНКА:** 0.5 дня

---

### День 2: Ошибки и обработка исключений

**ЗАДАЧИ:**
- [ ] Добавить error handling во все API endpoints
- [ ] Логирование ошибок
- [ ] User-friendly ошибки в UI
- [ ] Тестирование edge cases

**ПРОВЕРИТЬ:**
- [ ] Что происходит если AI API падает
- [ ] Что происходит если БД недоступна
- [ ] Что происходит если пользователь теряет сеть
- [ ] Что происходит если истекает сессия

**ВРЕМЕННАЯ ОЦЕНКА:** 1 день

---

### День 3: Тестирование и bug fixes

**ЗАДАЧИ:**
- [ ] Полное тестирование всех флоу
- [ ] Тестирование на мобильных устройствах
- [ ] Тестирование на разных браузерах
- [ ] Исправление bugs

**ТЕСТ-СЦЕНАРИИ:**
```
Сценарий 1: Новый пользователь
1. Регистрация
2. Первый вопрос ассистента
3. 15 вопросов-ответов
4. Вывод + redirect на pricing
5. Покупка подписки

Сценарий 2: Возвращающийся пользователь
1. Логин
2. Dashboard с историей
3. Клик "Продолжить"
4. Загрузка истории
5. Продолжение диалога

Сценарий 3: Отказ от платежа
1. На экране pricing нажал "Закрыть"
2. Вернулся на dashboard
3. Может повторить попытку позже
```

**ВРЕМЕННАЯ ОЦЕНКА:** 1 день

---

### День 4: Деплой и оптимизация

**ЗАДАЧИ:**
- [ ] Оптимизация производительности
- [ ] Минификация кода
- [ ] Оптимизация изображений
- [ ] Настройка CORS
- [ ] Подготовка к production деплою

**ДЕПЛОЙ CHECKLIST:**
- [ ] Все переменные окружения установлены
- [ ] API endpoints работают
- [ ] БД инициирована и готова
- [ ] Stripe production keys настроены (когда буду деплоить)
- [ ] Domain вы указываете на сервер
- [ ] SSL сертификат готов

**ВРЕМЕННАЯ ОЦЕНКА:** 1 день

---

## 🚀 БЫСТРЫЙ РЕФРЕНС: ЧТО ДЕЛАТЬ КАЖДЫЙ ДЕНЬ

### Неделя 1

**День 1 (Пн):**
- [ ] Setup проекта (Next.js, Tailwind, Supabase)
- [ ] Создать структуру папок
- [ ] `.env.local` файл

**День 2 (Вт):**
- [ ] Регистрация + Логин + Auth endpoints
- [ ] Хук useAuth
- [ ] ProtectedRoute компонент

**День 3 (Ср):**
- [ ] Дизайн Header + Footer
- [ ] Лендинг страница
- [ ] Темы и цвета согласно Design Guide

**День 4 (Чт):**
- [ ] База данных (таблицы, RLS)
- [ ] API endpoints для чата
- [ ] Хук useChat

**День 5 (Пт):**
- [ ] ChatInterface компонент
- [ ] MessageList + MessageInput
- [ ] Страница `/chat/[id]`

### Неделя 2

**День 1 (Пн):**
- [ ] API `/api/ai/process-message`
- [ ] Интеграция Claude API
- [ ] Счетчик вопросов

**День 2 (Вт):**
- [ ] Системный промт
- [ ] Вывод на 15-м вопросе
- [ ] Проверка подписки в API

**День 3 (Ср):**
- [ ] Dashboard + история чатов
- [ ] API endpoints для истории
- [ ] Функция "Продолжить диалог"

**День 4 (Чт):**
- [ ] Stripe интеграция
- [ ] Страница `/pricing`
- [ ] Create checkout endpoint

**День 5 (Пт):**
- [ ] Webhook для Stripe
- [ ] Синхронизация подписки
- [ ] Проверка подписки при доступе

### Неделя 3

**День 1-2:**
- [ ] Профиль пользователя
- [ ] Ошибки и обработка исключений
- [ ] Логирование

**День 3-4:**
- [ ] Тестирование всех флоу
- [ ] Bug fixes
- [ ] Оптимизация

**День 5:**
- [ ] Финальная подготовка к деплою
- [ ] Проверка всех чек-листов

---

## 📋 ФИНАЛЬНЫЙ ЧЕК-ЛИСТ ПЕРЕД ДЕПЛОЕМ

### Frontend
- [ ] Все страницы загружаются
- [ ] Дизайн соответствует Design Guide
- [ ] Responsive на мобильных, планшетах, десктопе
- [ ] Нет консольных ошибок
- [ ] Все ссылки работают

### Backend
- [ ] Все API endpoints работают
- [ ] Аутентификация работает
- [ ] Чат работает
- [ ] AI интеграция работает
- [ ] Подписка проверяется

### База данных
- [ ] Все таблицы созданы
- [ ] RLS политики установлены
- [ ] Данные безопасны

### Платежи
- [ ] Stripe интеграция работает (тестовый режим)
- [ ] Checkout работает
- [ ] Webhook работает
- [ ] Статус подписки обновляется

### Безопасность
- [ ] Нет API ключей в коде
- [ ] Нет паролей в коде
- [ ] CORS правильно настроен
- [ ] RLS политики работают
- [ ] JWT токены работают

### Окружение
- [ ] `.env.local` не коммитится
- [ ] Все production переменные установлены
- [ ] Domain настроен
- [ ] SSL готов

---

## 📞 ПОДДЕРЖКА И ПОМОЩЬ

**Если что-то не работает:**
1. Проверь консоль браузера (F12)
2. Проверь серверные логи
3. Проверь переменные окружения
4. Проверь RLS политики в Supabase
5. Проверь Stripe dashboard

**Документация:**
- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- Stripe: https://stripe.com/docs
- Tailwind: https://tailwindcss.com/docs
- Claude API: https://docs.anthropic.com/

---

**Готово! Начинай разработку! 🚀**

**Первый MVP (базовый функционал) должен быть готов за 2 недели.**  
**Полная готовность к деплою за 3-4 недели.**
