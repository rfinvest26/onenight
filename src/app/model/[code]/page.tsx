'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Loader2, Flame } from 'lucide-react'
import Link from 'next/link'
import type { EscortModel } from '@/types'
import { getModelByCode } from '@/lib/api'
import PhotoGallery from '@/components/PhotoGallery'
import ModelInfo from '@/components/ModelInfo'
import ServicesList from '@/components/ServicesList'

export default function ModelPage() {
  const { code } = useParams<{ code: string }>()
  const [model, setModel] = useState<EscortModel | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!code || !/^\d{4}$/.test(code)) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setLoading(true)
    setNotFound(false)
    getModelByCode(code).then(data => {
      if (data) setModel(data)
      else setNotFound(true)
    }).catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [code])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-16 flex justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    )
  }

  if (notFound || !model) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-16 text-center space-y-4">
        <p className="text-xl font-medium text-gray-400">Модель не найдена</p>
        <p className="text-sm text-gray-400">Проверьте код и попробуйте снова</p>
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover transition-colors">
          <ArrowLeft className="w-4 h-4" />
          На главную
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 space-y-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        На главную
      </Link>

      <PhotoGallery urls={model.photo_urls} modelName={model.name} />

      <ModelInfo model={model} />

      <ServicesList services={model.services} />

      <Link
        href={`/order/${model.code}`}
        className="btn-primary flex items-center justify-center gap-2"
      >
        <Flame className="w-5 h-5" />
        Заказать {model.name}
      </Link>
    </div>
  )
}
