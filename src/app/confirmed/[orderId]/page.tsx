'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Loader2, MessageSquare, Clock, MapPin } from 'lucide-react'
import type { EscortOrder, EscortModel } from '@/types'
import { getOrder, getModelById } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import { useStore } from '@/lib/store'

export default function ConfirmedPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const { setLastChat } = useStore()
  const [order, setOrder] = useState<EscortOrder | null>(null)
  const [model, setModel] = useState<EscortModel | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = Number(orderId)
    if (isNaN(id)) { setLoading(false); return }

    getOrder(id).then(async o => {
      if (!o) { setLoading(false); return }
      setOrder(o)
      if (o.support_thread_id) {
        setLastChat(o.support_thread_id, o.id)
      }
      const m = await getModelById(o.model_id)
      if (m) setModel(m)
    }).finally(() => setLoading(false))
  }, [orderId, setLastChat])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-16 flex justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-16 text-center">
        <p className="text-gray-400">Заказ не найден</p>
        <Link href="/" className="text-accent text-sm mt-2 inline-block">На главную</Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8">
      <div className="text-center space-y-4 mb-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
        <h1 className="text-2xl font-semibold">Заказ #{order.id} создан</h1>
        <p className="text-gray-500 text-sm">Ожидайте реквизиты для оплаты — оператор отправит их в чате</p>
      </div>

      <div className="card p-5 space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Модель</span>
          <span className="font-medium">{model?.name || order.model_name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Часы
          </span>
          <span className="font-medium">{order.hours} ч</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            Тип встречи
          </span>
          <span className="font-medium">{order.meeting_type === 'incall' ? 'Incall' : 'Outcall'}</span>
        </div>
        {order.total_before_discount > order.total_price && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Скидка</span>
            <span className="font-medium text-green-600">-{order.discount_percent}%</span>
          </div>
        )}
        <div className="border-t border-gray-100 pt-3 flex justify-between">
          <span className="font-semibold">Итого</span>
          <span className="font-semibold text-accent">{formatPrice(order.total_price)}</span>
        </div>
      </div>

      <Link
        href={`/chat/${order.support_thread_id}`}
        className="btn-primary flex items-center justify-center gap-2"
      >
        <MessageSquare className="w-5 h-5" />
        Чат с оператором
      </Link>
    </div>
  )
}
