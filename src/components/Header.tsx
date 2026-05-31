'use client'

import Link from 'next/link'
import { useStore } from '@/lib/store'
import { MessageSquare } from 'lucide-react'

export default function Header() {
  const { lastThreadId } = useStore()

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex-1" />
        <Link href="/" className="text-xl font-semibold text-primary tracking-tight">
          OneNight
        </Link>
        <div className="flex-1 flex justify-end">
          {lastThreadId && (
            <Link
              href={`/chat?threadId=${lastThreadId}`}
              className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center hover:bg-accent/20 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-accent" />
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
