'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'

interface StoreState {
  referralWorkerId: string | null
  referralCountry: string | null
  userId: number | null
  userNickname: string | null
  lastThreadId: number | null
  lastOrderId: number | null
  setUser: (id: number, nickname: string) => void
  clearUser: () => void
  setLastChat: (threadId: number, orderId: number) => void
  clearChat: () => void
}

const StoreContext = createContext<StoreState>({
  referralWorkerId: null,
  referralCountry: null,
  userId: null,
  userNickname: null,
  lastThreadId: null,
  lastOrderId: null,
  setUser: () => {},
  clearUser: () => {},
  setLastChat: () => {},
  clearChat: () => {},
})

export function StoreProvider({ children }: { children: ReactNode }) {
  const [referralWorkerId, setReferralWorkerId] = useState<string | null>(null)
  const [referralCountry, setReferralCountry] = useState<string | null>(null)
  const [userId, setUserId] = useState<number | null>(null)
  const [userNickname, setUserNickname] = useState<string | null>(null)
  const [lastThreadId, setLastThreadId] = useState<number | null>(null)
  const [lastOrderId, setLastOrderId] = useState<number | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    const country = params.get('country')

    if (ref) {
      localStorage.setItem('escort_ref_worker_id', ref)
      setReferralWorkerId(ref)
    } else {
      const stored = localStorage.getItem('escort_ref_worker_id')
      if (stored) setReferralWorkerId(stored)
    }

    if (country) {
      localStorage.setItem('escort_ref_country', country)
      setReferralCountry(country)
    } else {
      const stored = localStorage.getItem('escort_ref_country')
      if (stored) setReferralCountry(stored)
    }

    const storedUserId = localStorage.getItem('escort_user_id')
    const storedNickname = localStorage.getItem('escort_user_nickname')
    if (storedUserId) setUserId(Number(storedUserId))
    if (storedNickname) setUserNickname(storedNickname)

    const storedThreadId = localStorage.getItem('escort_last_thread_id')
    const storedOrderId = localStorage.getItem('escort_last_order_id')
    if (storedThreadId) setLastThreadId(Number(storedThreadId))
    if (storedOrderId) setLastOrderId(Number(storedOrderId))
  }, [])

  const setUser = useCallback((id: number, nickname: string) => {
    setUserId(id)
    setUserNickname(nickname)
    localStorage.setItem('escort_user_id', String(id))
    localStorage.setItem('escort_user_nickname', nickname)
  }, [])

  const clearUser = useCallback(() => {
    setUserId(null)
    setUserNickname(null)
    localStorage.removeItem('escort_user_id')
    localStorage.removeItem('escort_user_nickname')
  }, [])

  const setLastChat = useCallback((threadId: number, orderId: number) => {
    setLastThreadId(threadId)
    setLastOrderId(orderId)
    localStorage.setItem('escort_last_thread_id', String(threadId))
    localStorage.setItem('escort_last_order_id', String(orderId))
  }, [])

  const clearChat = useCallback(() => {
    setLastThreadId(null)
    setLastOrderId(null)
    localStorage.removeItem('escort_last_thread_id')
    localStorage.removeItem('escort_last_order_id')
  }, [])

  return (
    <StoreContext.Provider value={{
      referralWorkerId, referralCountry, userId, userNickname,
      lastThreadId, lastOrderId,
      setUser, clearUser, setLastChat, clearChat,
    }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  return useContext(StoreContext)
}
