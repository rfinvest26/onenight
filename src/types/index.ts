export interface EscortModel {
  id: number
  user_id: number
  name: string
  age: number
  country: string
  country_code: string
  city: string
  display_city: string
  description: string
  services: string[]
  price_per_hour: number
  photo_urls: string[]
  photo_file_ids: string[]
  code: string
  created_at: string
}

export interface EscortUser {
  id: number
  tg_id: string
  username: string
  name: string
  tg_photo_url: string | null
  created_at: string
}

export type OrderStatus = 'pending' | 'confirmed' | 'paid' | 'in_progress' | 'completed' | 'cancelled'

export interface EscortOrder {
  id: number
  user_id: number
  model_id: number
  worker_id: number
  hours: number
  total_price: number
  discount_amount: number
  promo_code: string
  client_name: string
  client_phone: string
  status: OrderStatus
  payment_screenshot_url: string
  support_thread_id: number
  model_name: string
  discount_percent: number
  total_before_discount: number
  screenshot_url: string
  lead_name: string
  lead_username: string
  meeting_type: 'incall' | 'outcall'
  extra_services: string[]
  created_at: string
}

export interface EscortSupportThread {
  id: number
  user_id: number
  status: 'open' | 'closed'
  topic: string
  tg_chat_id: number | null
  tg_thread_id: number | null
  created_at: string
}

export interface EscortSupportMessage {
  id: number
  thread_id: number
  author: 'user' | 'agent'
  text: string
  image_url: string
  created_at: string
}

export interface EscortPromocode {
  id: number
  user_id: number
  code: string
  discount_percent: number
  active: boolean
}

export interface EscortBotEvent {
  id: number
  event_type: string
  payload: Record<string, unknown>
  status: 'pending' | 'processing' | 'processed' | 'failed'
  created_at: string
}

export interface OrderFormData {
  hours: number
  meetingType: 'incall' | 'outcall'
  extraServices: string[]
  promoCode: string
  promoDiscount: number
  tgNickname: string
}
