'use client'

import { Search, ArrowRight, MessageSquare, Shield } from 'lucide-react'
import SearchBar from '@/components/SearchBar'

export default function HomePage() {
  return (
    <div className="max-w-lg mx-auto px-5">
      <div className="text-center pt-16 pb-6">
        <h1 className="text-2xl font-semibold text-primary tracking-tight">OneNight</h1>
        <p className="text-sm text-gray-400 mt-1">Премиальный сервис знакомств</p>
      </div>

      <div className="text-center mb-8">
        <p className="text-xs text-gray-400 mb-3">Введите 4-значный код модели</p>
        <SearchBar large />
      </div>

      <div className="space-y-6 pb-10">
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Как это работает</h2>
          <div className="space-y-2">
            {[
              { icon: Search, label: 'Введите код', desc: 'Получите код модели' },
              { icon: ArrowRight, label: 'Выберите услуги', desc: 'Часы, тип встречи, дополнения' },
              { icon: MessageSquare, label: 'Подтверждение', desc: 'Оператор пришлёт реквизиты' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
                {i < 2 && <div className="w-px h-6 bg-gray-100 ml-1" />}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Почему выбирают нас</h2>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-accent" /> Конфиденциально
            </span>
            <span className="flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-accent" /> Проверенные анкеты
            </span>
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-accent" /> 24/7 поддержка
            </span>
          </div>
        </section>
      </div>
    </div>
  )
}
