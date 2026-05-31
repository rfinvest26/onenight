'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  urls: string[]
  modelName: string
}

export default function PhotoGallery({ urls, modelName }: Props) {
  const [index, setIndex] = useState(0)

  if (!urls.length) {
    return (
      <div className="aspect-[4/5] rounded-2xl bg-gray-100 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Нет фото</p>
      </div>
    )
  }

  const prev = () => setIndex(i => (i === 0 ? urls.length - 1 : i - 1))
  const next = () => setIndex(i => (i === urls.length - 1 ? 0 : i + 1))

  return (
    <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 group">
      <img
        src={urls[index]}
        alt={`${modelName} ${index + 1}`}
        className="w-full h-full object-cover"
        loading="lazy"
      />

      {urls.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {urls.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === index ? 'bg-white w-4' : 'bg-white/50'}`}
              />
            ))}
          </div>

          <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/40 text-white text-xs font-medium">
            {index + 1}/{urls.length}
          </div>
        </>
      )}
    </div>
  )
}
