import { MapPin, DollarSign, Tag, FileText } from 'lucide-react'
import type { EscortModel } from '@/types'
import { formatPrice } from '@/lib/utils'

interface Props {
  model: EscortModel
}

export default function ModelInfo({ model }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-primary">{model.name}</h1>
          <p className="text-base text-gray-500">{model.age} лет</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-accent">{formatPrice(model.price_per_hour)}</p>
          <p className="text-xs text-gray-400">за час</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="w-4 h-4" />
          {model.display_city || model.city}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Tag className="w-4 h-4" />
          Код: {model.code}
        </span>
      </div>

      {model.description && (
        <div className="card p-4">
          <h2 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-accent" />
            О себе
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{model.description}</p>
        </div>
      )}
    </div>
  )
}
