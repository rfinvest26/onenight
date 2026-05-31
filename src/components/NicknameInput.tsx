'use client'

import { AtSign, User } from 'lucide-react'

interface Props {
  value: string
  onChange: (value: string) => void
}

export default function NicknameInput({ value, onChange }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-900 mb-1.5 flex items-center gap-1.5">
        <User className="w-4 h-4 text-gray-400" />
        Ваш Telegram nickname
      </label>
      <div className="relative">
        <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="username"
          className="input-field pl-10"
          value={value}
          onChange={e => onChange(e.target.value.replace(/[@\s]/g, ''))}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1.5">
        Оператор будет знать, как к вам обращаться
      </p>
    </div>
  )
}
