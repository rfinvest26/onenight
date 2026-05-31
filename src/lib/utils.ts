const EXTRA_SERVICE_PRICE = 50
const OUTCALL_FEE = 50

export const AVAILABLE_SERVICES = [
  'Классика',
  'Анал',
  'Французский',
  'БДСМ',
  'Золотой дождь',
  'Эскорт',
  'Массаж',
  'Выезд',
  'Апартаменты',
]

export const MEETING_TYPES = {
  incall: '🏠 Incall',
  outcall: '🚗 Outcall',
} as const

export function calcPrice(
  pricePerHour: number,
  hours: number,
  meetingType: 'incall' | 'outcall',
  extraServices: string[],
  discountPercent: number = 0,
): { subtotal: number; discount: number; total: number } {
  const base = pricePerHour * hours
  const extras = extraServices.length * EXTRA_SERVICE_PRICE
  const outcallFee = meetingType === 'outcall' ? OUTCALL_FEE : 0
  const subtotal = base + extras + outcallFee
  const discount = Math.round(subtotal * discountPercent / 100)
  const total = subtotal - discount
  return { subtotal, discount, total }
}

export function formatPrice(price: number): string {
  return `$${price.toLocaleString()}`
}

export function getReferralLink(workerId: number, country: string): string {
  const domain = process.env.NEXT_PUBLIC_SITE_URL
  if (!domain) return ''
  return `${domain}?ref=${workerId}&country=${country}`
}

export function generateUserId(): string {
  return `web_${crypto.randomUUID?.() || Math.random().toString(36).slice(2, 11)}`
}

export function parseStartPayload(payload: string): { workerId: number; country: string } | null {
  if (!payload.startsWith('ec_')) return null
  const body = payload.slice(3)
  const chunks = body.split('_')
  const workerId = parseInt(chunks[0], 10)
  const country = chunks[1]?.toLowerCase() || ''
  if (isNaN(workerId)) return null
  return { workerId, country }
}
