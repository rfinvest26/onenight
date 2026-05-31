'use client'

import Link from 'next/link'
import { useStore } from '@/lib/store'
import { MessageSquare } from 'lucide-react'

export default function Footer() {
  const { lastThreadId } = useStore()

  return (
    <footer className="border-t border-gray-100 bg-white mt-auto">
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>&copy; 2026 OneNight</span>
          {lastThreadId && (
            <Link
              href={`/chat?threadId=${lastThreadId}`}
              className="inline-flex items-center gap-1 text-accent hover:text-accent-hover transition-colors"
            >
              <MessageSquare className="w-3 h-3" />
              Чат с оператором
            </Link>
          )}
        </div>
      </div>
    </footer>
  )
}
