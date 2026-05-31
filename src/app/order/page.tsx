'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { EscortModel } from '@/types'
import { getModelByCode, getOrCreateUser, createOrder } from '@/lib/api'
import { useStore } from '@/lib/store'
import OrderForm from '@/components/OrderForm'

function OrderContent() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const router = useRouter()
  const { referralWorkerId, setUser } = useStore()

  const [model, setModel] = useState<EscortModel | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!code || !/^\d{4}$/.test(code)) {
      setNotFound(true)
      setLoading(false)
      return
    }

    getModelByCode(code).then(data => {
      if (data) setModel(data)
      else setNotFound(true)
    }).catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [code])

  const handleSubmit = useCallback(async (data: {
    hours: number
    meetingType: 'incall' | 'outcall'
    extraServices: string[]
    promoCode: string
    promoDiscount: number
    totalPrice: number
    subtotal: number
    discount: number
    tgNickname: string
  }) => {
    if (!model) return
    setSubmitting(true)

    try {
      const user = await getOrCreateUser(
        data.tgNickname,
        referralWorkerId || undefined,
      )
      setUser(user.id, data.tgNickname)

      const order = await createOrder({
        userId: user.id,
        modelId: model.id,
        workerId: model.user_id,
        hours: data.hours,
        meetingType: data.meetingType,
        extraServices: data.extraServices,
        totalPrice: data.totalPrice,
        totalBeforeDiscount: data.subtotal,
        discountAmount: data.discount,
        discountPercent: data.promoDiscount,
        promoCode: data.promoCode,
        nickname: data.tgNickname,
        modelName: model.name,
      })

      router.push(`/confirmed?orderId=${order.id}`)
    } catch (err) {
      console.error('Order creation failed:', err)
      alert('Не удалось создать заказ. Попробуйте ещё раз.')
    } finally {
      setSubmitting(false)
    }
  }, [model, referralWorkerId, router, setUser])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-16 flex justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    )
  }

  if (notFound || !model) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-16 text-center space-y-4">
        <p className="text-xl font-medium text-gray-400">Модель не найдена</p>
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover transition-colors">
          <ArrowLeft className="w-4 h-4" />
          На главную
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
      <Link
        href={`/model?code=${code}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к анкете
      </Link>

      <div className="flex items-center gap-3 card p-3">
        {model.photo_urls[0] && (
          <img src={model.photo_urls[0]} alt="" className="w-12 h-12 rounded-xl object-cover" />
        )}
        <div>
          <p className="font-medium text-sm">{model.name}, {model.age}</p>
          <p className="text-xs text-gray-400">{model.price_per_hour}$/час · Код {model.code}</p>
        </div>
      </div>

      <OrderForm model={model} onSubmit={handleSubmit} loading={submitting} />
    </div>
  )
}

export default function OrderPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto px-4 pt-16 flex justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    }>
      <OrderContent />
    </Suspense>
  )
}
