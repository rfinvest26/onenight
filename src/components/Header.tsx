'use client'

import Link from 'next/link'
import { useStore } from '@/lib/store'
import { getReferralLink } from '@/lib/utils'
import { Link as LinkIcon, MessageSquare } from 'lucide-react'

export default function Header() {
  const { referralWorkerId, referralCountry, lastThreadId } = useStore()

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
              href={`/chat/${lastThreadId}`}
              className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center hover:bg-accent/20 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-accent" />
            </Link>
          )}
        </div>
      </div>
      {referralWorkerId && (
        <div className="px-4 pb-2.5 flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <LinkIcon className="w-3 h-3" />
          <span>Ваша реф. ссылка:</span>
          <a
            href={getReferralLink(Number(referralWorkerId), referralCountry || '')}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-accent-hover transition-colors truncate max-w-[220px]"
          >
            {getReferralLink(Number(referralWorkerId), referralCountry || '')}
          </a>
        </div>
      )}
    </header>
  )
}
