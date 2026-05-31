import type { Metadata } from 'next'
import { StoreProvider } from '@/lib/store'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: 'OneNight — Элитный сервис',
  description: 'Премиальный сервис знакомств',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen flex flex-col bg-surface">
        <StoreProvider>
          <Header />
          <main className="flex-1 pb-8">{children}</main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  )
}
