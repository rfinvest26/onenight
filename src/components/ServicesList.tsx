import { Sparkles } from 'lucide-react'

interface Props {
  services: string[]
}

export default function ServicesList({ services }: Props) {
  if (!services.length) return null

  return (
    <div>
      <h2 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-1.5">
        <Sparkles className="w-4 h-4 text-accent" />
        Доступные услуги
      </h2>
      <div className="flex flex-wrap gap-2">
        {services.map(s => (
          <span
            key={s}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm bg-accent/10 text-accent border border-accent/20"
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}
