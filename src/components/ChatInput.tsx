'use client'

import { useState, useRef, useCallback } from 'react'
import { Send, ImagePlus, Loader2, FileText } from 'lucide-react'

function isPdf(file: File) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

interface Props {
  onSend: (text: string, file?: File) => Promise<void>
}

export default function ChatInput({ onSend }: Props) {
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!text.trim() && !file) || sending) return
    setSending(true)
    try {
      await onSend(text.trim(), file || undefined)
      setText('')
      setFile(null)
    } finally {
      setSending(false)
    }
  }, [text, file, sending, onSend])

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-100 p-3 bg-white">
      {file && (
        <div className="mb-2 flex items-center gap-2 px-1">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
            {isPdf(file) ? (
              <FileText className="w-6 h-6 text-accent" />
            ) : (
              <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
            )}
          </div>
          <span className="text-xs text-gray-500 truncate flex-1">{file.name}</span>
          <button
            type="button"
            onClick={() => setFile(null)}
            className="text-xs text-red-500 hover:text-red-600"
          >
            Удалить
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors flex-shrink-0"
        >
          <ImagePlus className="w-5 h-5 text-gray-500" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={e => setFile(e.target.files?.[0] || null)}
        />

        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Сообщение..."
            className="input-field pr-4"
            value={text}
            onChange={e => setText(e.target.value)}
            disabled={sending}
          />
        </div>

        <button
          type="submit"
          disabled={(!text.trim() && !file) || sending}
          className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center hover:bg-accent-hover disabled:opacity-50 transition-colors flex-shrink-0"
        >
          {sending ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <Send className="w-5 h-5 text-white" />
          )}
        </button>
      </div>
    </form>
  )
}
