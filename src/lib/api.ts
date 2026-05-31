import { supabase } from './supabase'
import type { EscortModel, EscortUser, EscortOrder, EscortSupportThread, EscortSupportMessage, EscortPromocode } from '@/types'

function genId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

export async function getModelByCode(code: string): Promise<EscortModel | null> {
  const { data } = await supabase
    .from('escort_models')
    .select('*')
    .eq('code', code)
    .single()
  return data
}

export async function getModelById(id: number): Promise<EscortModel | null> {
  const { data } = await supabase
    .from('escort_models')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

export async function getOrCreateUser(nickname: string, refWorkerId?: string): Promise<EscortUser> {
  const tgId = `web_${genId()}`
  const { data, error } = await supabase
    .from('escort_users')
    .insert({
      tg_id: tgId,
      name: nickname,
      username: nickname,
    })
    .select()
    .single()

  if (error) {
    const username = nickname.replace('@', '')
    const { data: existing } = await supabase
      .from('escort_users')
      .select('*')
      .or(`username.eq.${username},name.eq.${nickname}`)
      .maybeSingle()
    if (existing) return existing
    throw error
  }

  if (refWorkerId) {
    const workerId = parseInt(refWorkerId, 10)
    if (!isNaN(workerId)) {
      await supabase.from('escort_leads').upsert({
        worker_id: workerId,
        lead_tg_id: tgId,
        lead_username: nickname,
        lead_name: nickname,
        country: typeof window !== 'undefined' ? localStorage.getItem('escort_ref_country') || '' : '',
      }, { onConflict: 'worker_id,lead_tg_id' })

      await supabase.from('escort_bot_events').insert({
        event_type: 'lead_registered',
        payload: {
          lead_tg_id: tgId,
          lead_username: nickname,
          lead_name: nickname,
          worker_id: workerId,
          country: typeof window !== 'undefined' ? localStorage.getItem('escort_ref_country') || '' : '',
        },
        status: 'pending',
      })
    }
  }

  return data
}

export async function validatePromocode(code: string, workerId: number): Promise<EscortPromocode | null> {
  const { data } = await supabase
    .from('escort_promocodes')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('user_id', workerId)
    .eq('active', true)
    .maybeSingle()
  return data
}

export async function createOrder(params: {
  userId: number
  modelId: number
  workerId: number
  hours: number
  meetingType: 'incall' | 'outcall'
  extraServices: string[]
  totalPrice: number
  totalBeforeDiscount: number
  discountAmount: number
  discountPercent: number
  promoCode: string
  nickname: string
  modelName: string
}): Promise<EscortOrder> {
  const { data: thread } = await supabase
    .from('escort_support_threads')
    .insert({
      user_id: params.userId,
      topic: params.nickname,
      status: 'open',
    })
    .select()
    .single()

  if (!thread) throw new Error('Failed to create support thread')

  const { data: order, error } = await supabase
    .from('escort_orders')
    .insert({
      user_id: params.userId,
      model_id: params.modelId,
      worker_id: params.workerId,
      hours: params.hours,
      total_price: params.totalPrice,
      total_before_discount: params.totalBeforeDiscount,
      discount_amount: params.discountAmount,
      discount_percent: params.discountPercent,
      promo_code: params.promoCode,
      lead_name: params.nickname,
      lead_username: params.nickname,
      client_name: params.nickname,
      meeting_type: params.meetingType,
      extra_services: params.extraServices,
      model_name: params.modelName,
      status: 'pending',
      support_thread_id: thread.id,
    })
    .select()
    .single()

  if (error) throw error

  await supabase.from('escort_bot_events').insert({
    event_type: 'support_thread_created',
    payload: {
      thread_id: thread.id,
      user_id: params.userId,
      topic: params.nickname,
    },
    status: 'pending',
  })

  await supabase.from('escort_bot_events').insert({
    event_type: 'order_created',
    payload: {
      order_id: order.id,
      user_id: params.userId,
      model_id: params.modelId,
      worker_id: params.workerId,
      total_price: params.totalPrice,
      model_name: params.modelName,
      client_name: params.nickname,
      client_username: params.nickname,
      support_thread_id: thread.id,
      hours: params.hours,
      meeting_type: params.meetingType,
      extra_services: params.extraServices,
      discount_percent: params.discountPercent,
      promo_code: params.promoCode,
    },
    status: 'pending',
  })

  await supabase.from('escort_support_messages').insert({
    thread_id: thread.id,
    author: 'user',
    text: `Новый заказ #${order.id}\nМодель: ${params.modelName}\nЧасы: ${params.hours}\nТип: ${params.meetingType === 'incall' ? 'Incall' : 'Outcall'}\nСумма: $${params.totalPrice}`,
  })

  return order
}

export async function getThreadMessages(threadId: number): Promise<EscortSupportMessage[]> {
  const { data } = await supabase
    .from('escort_support_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
  return data || []
}

export async function getThread(threadId: number): Promise<EscortSupportThread | null> {
  const { data } = await supabase
    .from('escort_support_threads')
    .select('*')
    .eq('id', threadId)
    .single()
  return data
}

export async function getOrderByThread(threadId: number): Promise<EscortOrder | null> {
  const { data } = await supabase
    .from('escort_orders')
    .select('*')
    .eq('support_thread_id', threadId)
    .maybeSingle()
  return data
}

export async function getOrder(orderId: number): Promise<EscortOrder | null> {
  const { data } = await supabase
    .from('escort_orders')
    .select('*')
    .eq('id', orderId)
    .single()
  return data
}

export async function sendMessage(
  threadId: number,
  text: string,
  imageUrl?: string,
): Promise<EscortSupportMessage> {
  const { data, error } = await supabase
    .from('escort_support_messages')
    .insert({
      thread_id: threadId,
      author: 'user',
      text,
      image_url: imageUrl || '',
    })
    .select()
    .single()

  if (error) throw error

  await supabase.from('escort_bot_events').insert({
    event_type: 'support_message_created',
    payload: {
      thread_id: threadId,
      message_id: data.id,
      text,
      image_url: imageUrl || '',
      author: 'user',
    },
    status: 'pending',
  })

  return data
}

export async function sendPaymentReceipt(
  file: File,
  orderId: number,
  threadId: number,
): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `payments/${orderId}_${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('models')
    .upload(path, file, { contentType: file.type })

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from('models')
    .getPublicUrl(path)

  await supabase
    .from('escort_orders')
    .update({
      screenshot_url: publicUrl,
      status: 'paid',
    })
    .eq('id', orderId)

  await supabase.from('escort_support_messages').insert({
    thread_id: threadId,
    author: 'user',
    text: 'Отправил(а) чек оплаты',
    image_url: publicUrl,
  })

  const { data: order } = await supabase
    .from('escort_orders')
    .select('worker_id, model_name, total_price')
    .eq('id', orderId)
    .single()

  if (order) {
    await supabase.from('escort_bot_events').insert({
      event_type: 'payment_screenshot_uploaded',
      payload: {
        order_id: orderId,
        worker_id: order.worker_id,
        model_name: order.model_name,
        total_price: order.total_price,
        screenshot_url: publicUrl,
      },
      status: 'pending',
    })

    await supabase.from('escort_bot_events').insert({
      event_type: 'support_message_created',
      payload: {
        thread_id: threadId,
        author: 'user',
        text: 'Отправил(а) чек оплаты',
        image_url: publicUrl,
        order_id: orderId,
      },
      status: 'pending',
    })
  }

  return publicUrl
}

export function subscribeToMessages(
  threadId: number,
  onMessage: (message: EscortSupportMessage) => void,
) {
  return supabase
    .channel(`thread_${threadId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'escort_support_messages',
        filter: `thread_id=eq.${threadId}`,
      },
      (payload) => {
        onMessage(payload.new as EscortSupportMessage)
      },
    )
    .subscribe()
}
