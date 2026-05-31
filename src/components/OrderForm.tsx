'use client'

import { useState, useCallback, useEffect } from 'react'
import { Minus, Plus, Check, Clock, MapPin, Home, Car, Sparkles, Ticket, Rocket } from 'lucide-react'
import type { EscortModel, EscortPromocode } from '@/types'
import { MEETING_TYPES, AVAILABLE_SERVICES, calcPrice, formatPrice } from '@/lib/utils'
import { validatePromocode } from '@/lib/api'
import { useStore } from '@/lib/store'
import NicknameInput from './NicknameInput'

interface Props {
  model: EscortModel
  onSubmit: (data: {
    hours: number
    meetingType: 'incall' | 'outcall'
    extraServices: string[]
    promoCode: string
    promoDiscount: number
    totalPrice: number
    subtotal: number
    discount: number
    tgNickname: string
  }) => void
  loading?: boolean
}

export default function OrderForm({ model, onSubmit, loading }: Props) {
  const { referralWorkerId, userNickname: storedNickname } = useStore()
  const [hours, setHours] = useState(1)
  const [meetingType, setMeetingType] = useState<'incall' | 'outcall'>('incall')
  const [extraServices, setExtraServices] = useState<string[]>([])
  const [promoCode, setPromoCode] = useState('')
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoError, setPromoError] = useState('')
  const [tgNickname, setTgNickname] = useState(storedNickname || '')
  const [promoLoading, setPromoLoading] = useState(false)

  useEffect(() => {
    if (storedNickname) setTgNickname(storedNickname)
  }, [storedNickname])

  const toggleService = useCallback((service: string) => {
    setExtraServices(prev =>
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service],
    )
  }, [])

  const applyPromo = useCallback(async () => {
    if (!promoCode.trim() || !referralWorkerId) return
    setPromoLoading(true)
    setPromoError('')
    try {
      const promo = await validatePromocode(promoCode.trim(), Number(referralWorkerId))
      if (promo) {
        setPromoDiscount(promo.discount_percent)
      } else {
        setPromoError('Промокод не найден или неактивен')
        setPromoDiscount(0)
      }
    } catch {
      setPromoError('Ошибка проверки промокода')
    } finally {
      setPromoLoading(false)
    }
  }, [promoCode, referralWorkerId])

  const { subtotal, discount, total } = calcPrice(
    model.price_per_hour,
    hours,
    meetingType,
    extraServices,
    promoDiscount,
  )

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!tgNickname.trim()) return
    onSubmit({
      hours,
      meetingType,
      extraServices,
      promoCode: promoCode.toUpperCase(),
      promoDiscount,
      totalPrice: total,
      subtotal,
      discount,
      tgNickname: tgNickname.trim(),
    })
  }, [hours, meetingType, extraServices, promoCode, promoDiscount, total, subtotal, discount, tgNickname, onSubmit])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-gray-400" />
            Часы
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setHours(h => Math.max(1, h - 1))}
              disabled={hours <= 1}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-medium text-lg">{hours}</span>
            <button
              type="button"
              onClick={() => setHours(h => Math.min(24, h + 1))}
              disabled={hours >= 24}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <span className="text-sm font-medium text-gray-900 block mb-2 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-gray-400" />
            Тип встречи
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMeetingType('incall')}
              className={`flex-1 h-10 rounded-xl text-sm font-medium border transition-all flex items-center justify-center gap-1.5 ${
                meetingType === 'incall'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              <Home className="w-4 h-4" />
              Incall
            </button>
            <button
              type="button"
              onClick={() => setMeetingType('outcall')}
              className={`flex-1 h-10 rounded-xl text-sm font-medium border transition-all flex items-center justify-center gap-1.5 ${
                meetingType === 'outcall'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              <Car className="w-4 h-4" />
              Outcall +$50
            </button>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <span className="text-sm font-medium text-gray-900 block mb-3 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-gray-400" />
          Дополнительные услуги <span className="text-gray-400 font-normal">(+$50 каждая)</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_SERVICES.map(service => {
            const active = extraServices.includes(service)
            return (
              <button
                key={service}
                type="button"
                onClick={() => toggleService(service)}
                className={`chip ${active ? 'chip-active' : 'chip-inactive'}`}
              >
                {active && <Check className="w-3.5 h-3.5" />}
                {service}
              </button>
            )
          })}
        </div>
      </div>

      <div className="card p-4">
        <span className="text-sm font-medium text-gray-900 block mb-2 flex items-center gap-1.5">
          <Ticket className="w-4 h-4 text-gray-400" />
          Промокод
        </span>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Введите промокод"
            className="input-field flex-1"
            value={promoCode}
            onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoDiscount(0); setPromoError('') }}
            onBlur={applyPromo}
          />
          <button
            type="button"
            onClick={applyPromo}
            disabled={!promoCode.trim() || promoLoading}
            className="btn-secondary"
          >
            Применить
          </button>
        </div>
        {promoDiscount > 0 && (
          <p className="text-green-600 text-xs mt-1.5">Скидка {promoDiscount}%</p>
        )}
        {promoError && (
          <p className="text-red-500 text-xs mt-1.5">{promoError}</p>
        )}
      </div>

      <NicknameInput value={tgNickname} onChange={setTgNickname} />

      <div className="card p-4 bg-gray-50 border-gray-100">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>{model.price_per_hour}$ × {hours}ч</span>
            <span>{formatPrice(model.price_per_hour * hours)}</span>
          </div>
          {extraServices.length > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Доп. услуги ({extraServices.length})</span>
              <span>{formatPrice(extraServices.length * 50)}</span>
            </div>
          )}
          {meetingType === 'outcall' && (
            <div className="flex justify-between text-gray-500">
              <span>Выезд</span>
              <span>$50</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Скидка ({promoDiscount}%)</span>
              <span>-{formatPrice(discount)}</span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-semibold text-lg">
            <span>Итого</span>
            <span className="text-accent">{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!tgNickname.trim() || loading}
        className="btn-primary flex items-center justify-center gap-2"
      >
        {loading ? (
          'Создание заказа...'
        ) : (
          <>
            <Rocket className="w-5 h-5" />
            Подтвердить заказ ({formatPrice(total)})
          </>
        )}
      </button>
    </form>
  )
}
