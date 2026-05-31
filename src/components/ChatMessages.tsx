'use client'

import { useEffect, useRef } from 'react'
import { FileText, Image } from 'lucide-react'
import type { EscortSupportMessage } from '@/types'

function isPdf(url: string) {
  return url.toLowerCase().endsWith('.pdf')
}

function MediaContent({ url }: { url: string }) {
  if (isPdf(url)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 bg-white/20 rounded-lg p-3 mb-2 hover:bg-white/30 transition-colors"
      >
        <FileText className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-medium truncate">Открыть PDF</span>
      </a>
    )
  }
  return (
    <img
      src={url}
      alt="photo"
      className="max-w-full rounded-lg mb-2"
    />
  )
}

interface Props {
  messages: EscortSupportMessage[]
  loading?: boolean
}

export default function ChatMessages({ messages, loading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!messages.length) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Сообщений пока нет</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
      {messages.map(msg => (
        <div
          key={msg.id}
          className={`flex ${msg.author === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
              msg.author === 'user'
                ? 'bg-accent text-white rounded-br-md'
                : 'bg-gray-100 text-gray-900 rounded-bl-md'
            }`}
          >
            {msg.image_url && <MediaContent url={msg.image_url} />}
            {msg.text && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
