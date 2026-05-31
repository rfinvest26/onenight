'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Loader2, MessageSquare, Upload } from 'lucide-react'
import type { EscortSupportThread, EscortSupportMessage, EscortOrder } from '@/types'
import { supabase } from '@/lib/supabase'
import { getThread, getThreadMessages, getOrderByThread, sendMessage, sendPaymentReceipt } from '@/lib/api'
import { useStore } from '@/lib/store'
import ChatMessages from '@/components/ChatMessages'
import ChatInput from '@/components/ChatInput'

export default function ChatPage() {
  const { threadId } = useParams<{ threadId: string }>()
  const { setLastChat } = useStore()
  const [thread, setThread] = useState<EscortSupportThread | null>(null)
  const [messages, setMessages] = useState<EscortSupportMessage[]>([])
  const [order, setOrder] = useState<EscortOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasRequisites, setHasRequisites] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const id = Number(threadId)
    if (isNaN(id)) { setLoading(false); return }

    Promise.all([
      getThread(id),
      getThreadMessages(id),
      getOrderByThread(id),
    ]).then(([t, msgs, o]) => {
      if (t) setThread(t)
      setMessages(msgs)
      if (o) {
        setOrder(o)
        setLastChat(o.support_thread_id || id, o.id)
      }
      setHasRequisites(msgs.some(m => m.author === 'agent' && m.text.toLowerCase().includes('реквизит')))
    }).finally(() => setLoading(false))
  }, [threadId, setLastChat])

  useEffect(() => {
    const id = Number(threadId)
    if (isNaN(id)) return

    const channel = supabase
      .channel(`thread_${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'escort_support_messages',
          filter: `thread_id=eq.${id}`,
        },
        (payload) => {
          const msg = payload.new as EscortSupportMessage
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev
            if (msg.author === 'agent' && msg.text.toLowerCase().includes('реквизит')) {
              setHasRequisites(true)
            }
            return [...prev, msg]
          })
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [threadId])

  const handleSend = useCallback(async (text: string, file?: File) => {
    const id = Number(threadId)
    if (isNaN(id)) return

    if (file && order) {
      setUploading(true)
      try {
        await sendPaymentReceipt(file, order.id, id)
      } finally {
        setUploading(false)
      }
      return
    }

    await sendMessage(id, text)
  }, [threadId, order])

  const handleReceiptUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !order) return
    setUploading(true)
    try {
      await sendPaymentReceipt(file, order.id, Number(threadId))
    } finally {
      setUploading(false)
    }
  }, [order, threadId])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-16 flex justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    )
  }

  if (!thread) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-16 text-center space-y-4">
        <p className="text-gray-400">Чат не найден</p>
        <a href="/" className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover transition-colors">
          <ArrowLeft className="w-4 h-4" />
          На главную
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 bg-white flex-shrink-0">
        <a href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </a>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium flex items-center gap-1.5"><MessageSquare className="w-4 h-4" /> Чат с оператором</p>
          <p className="text-xs text-gray-400 truncate">{thread.topic}</p>
        </div>
        <div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            thread.status === 'open' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {thread.status === 'open' ? 'Открыт' : 'Закрыт'}
          </span>
        </div>
      </div>

      <ChatMessages messages={messages} />

      {hasRequisites && order?.status === 'pending' && (
        <div className="px-4 py-3 bg-amber-50 border-t border-amber-100 flex-shrink-0">
          <label className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 font-medium text-sm cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            {uploading ? 'Загрузка...' : 'Отправить чек оплаты'}
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleReceiptUpload}
              disabled={uploading}
            />
          </label>
          <p className="text-xs text-amber-600 text-center mt-1.5">
            Принимаются скриншоты, фото чеков и PDF
          </p>
        </div>
      )}

      <ChatInput onSend={handleSend} />
    </div>
  )
}
