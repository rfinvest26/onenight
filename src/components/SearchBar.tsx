'use client'

import { useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'
import { Search, ArrowRight } from 'lucide-react'

export default function SearchBar({ large = false }: { large?: boolean }) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    setError(false)
    const trimmed = code.trim()
    if (trimmed.length === 4 && /^\d{4}$/.test(trimmed)) {
      router.push(`/model?code=${trimmed}`)
    } else {
      setError(true)
    }
  }, [code, router])

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={`${large ? 'max-w-sm mx-auto' : ''}`}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 ${large ? 'w-5 h-5' : 'w-4 h-4'}`} />
            <input
              type="text"
              maxLength={4}
              inputMode="numeric"
              placeholder="Введите код"
              className={`w-full rounded-xl border bg-gray-50 text-center tracking-[0.3em] font-mono
                placeholder:tracking-normal placeholder:font-sans placeholder:text-gray-400
                focus:bg-white focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all
                ${error ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                ${large ? 'h-14 text-2xl' : 'h-9 text-lg'}`}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            className={`flex-shrink-0 rounded-xl bg-accent text-white flex items-center justify-center hover:bg-accent-hover transition-colors
              ${large ? 'h-14 w-14' : 'h-9 w-9'}`}
          >
            <ArrowRight className={large ? 'w-6 h-6' : 'w-4 h-4'} />
          </button>
        </div>
      </div>
      {error && (
        <p className="text-red-500 text-sm mt-2 text-center">Введите 4-значный код модели</p>
      )}
    </form>
  )
}
