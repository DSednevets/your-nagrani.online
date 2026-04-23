import Link from "next/link";
import Header from "@/components/Header";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col px-4">

        {/* Hero */}
        <section className="flex flex-col items-center justify-center text-center py-24 max-w-2xl mx-auto w-full">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-4 leading-tight">
            Ты можешь больше
            <br />
            <span className="text-gray-400">Но почему-то не живёшь даже на 10%</span>
          </h1>

          <p className="text-lg text-gray-600 mb-6 leading-relaxed max-w-lg mx-auto">
            AI-ассистент помогает разобраться, что тебя на самом деле тормозит
            и что с этим делать. Без мотивации и пустых советов.
          </p>

          <div className="text-sm text-gray-600 mb-10 space-y-1">
            <p>Ты уже знаешь часть ответов.</p>
            <p>Вопрос — готов ли ты их увидеть?</p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full max-w-md">
            <Link
              href="/auth/register"
              className="text-center px-6 py-3 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Начать разбор
            </Link>
            <Link
              href="/pricing"
              className="text-center px-6 py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:border-gray-400 transition-colors"
            >
              Узнать о тарифах
            </Link>
          </div>
        </section>

        {/* Value description */}
        <section className="max-w-xl mx-auto w-full text-center pb-16">
          <p className="text-base text-gray-700 leading-loose">
            <span className="font-semibold text-gray-900">Это не чат и не психология.</span>
            <br />
            Это разговор, в котором ты начинаешь видеть себя без иллюзий.
            <br />
            Где ты сливаешь энергию.
            <br />
            Где сам себя тормозишь.
            <br />
            И почему это повторяется.
          </p>
        </section>

        {/* How it works */}
        <section className="max-w-3xl mx-auto w-full pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="p-6 bg-gray-50 rounded-xl">
              <div className="text-2xl mb-3">01</div>
              <h3 className="font-semibold mb-2">Отвечаешь честно</h3>
              <p className="text-sm text-gray-500">
                Ты не проходишь тест. Ты говоришь как есть.
              </p>
            </div>
            <div className="p-6 bg-gray-50 rounded-xl">
              <div className="text-2xl mb-3">02</div>
              <h3 className="font-semibold mb-2">Находим, где ты себя тормозишь</h3>
              <p className="text-sm text-gray-500">
                Из ответов проявляются реальные причины — неочевидные, но точные.
              </p>
            </div>
            <div className="p-6 bg-gray-50 rounded-xl">
              <div className="text-2xl mb-3">03</div>
              <h3 className="font-semibold mb-2">Получаешь ясность и следующий шаг</h3>
              <p className="text-sm text-gray-500">
                Не просто «кто ты», а что с этим делать дальше.
              </p>
            </div>
          </div>
        </section>

        {/* This is for you if */}
        <section className="max-w-xl mx-auto w-full pb-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Это для тебя, если:</h2>
          <ul className="space-y-3 text-gray-700 text-base">
            <li className="flex gap-3 items-start">
              <span className="text-emerald-500 shrink-0">✓</span>
              ты чувствуешь, что можешь больше, но не двигаешься
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-emerald-500 shrink-0">✓</span>
              у тебя есть идеи, но ты их не доводишь
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-emerald-500 shrink-0">✓</span>
              ты застрял в работе или жизни
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-emerald-500 shrink-0">✓</span>
              ты много думаешь, но мало меняешь
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-emerald-500 shrink-0">✓</span>
              ты устал от советов, которые не работают
            </li>
          </ul>
        </section>

        {/* This is not */}
        <section className="max-w-xl mx-auto w-full pb-24">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Это не:</h2>
          <ul className="space-y-2 text-gray-600 text-base mb-5">
            <li className="flex gap-3">
              <span className="text-red-500 shrink-0">✗</span>
              мотивация
            </li>
            <li className="flex gap-3">
              <span className="text-red-500 shrink-0">✗</span>
              тесты личности
            </li>
            <li className="flex gap-3">
              <span className="text-red-500 shrink-0">✗</span>
              психотерапия
            </li>
          </ul>
          <p className="text-gray-500 text-sm leading-relaxed">
            Это структурированный разбор, где ты начинаешь видеть реальность без искажений.
          </p>
        </section>

      </main>

      <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-400">
        © 2025 НАГРАНИ · your-nagrani.online
      </footer>
    </div>
  );
}
