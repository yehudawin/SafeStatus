import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { useAlerts } from './alertContext'
import { useAuth } from './auth'
import { supabase } from './supabase'
import { haptic } from './haptic'
import type { SocketAlert } from './types'

type PromptType = 'shelter' | 'safe_check'

interface ActivePrompt {
  type: PromptType
  alert: SocketAlert
  cities: string[]
  dismissedAt?: number
}

interface NotifState {
  prompt: ActivePrompt | null
  dismissPrompt: () => void
  respondShelter: () => void
  respondSafe: () => void
  permissionGranted: boolean
  requestPermission: () => Promise<void>
}

const NotifCtx = createContext<NotifState>({
  prompt: null,
  dismissPrompt: () => {},
  respondShelter: () => {},
  respondSafe: () => {},
  permissionGranted: false,
  requestPermission: async () => {},
})

function sendBrowserNotification(title: string, body: string) {
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico', tag: 'safestatus-alert' })
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { current } = useAlerts()
  const { user, profile, refreshProfile } = useAuth()
  const [prompt, setPrompt] = useState<ActivePrompt | null>(null)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const followUpTimer = useRef<ReturnType<typeof setTimeout>>(null)
  const lastAlertId = useRef<string | null>(null)

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPermissionGranted(Notification.permission === 'granted')
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return
    const result = await Notification.requestPermission()
    setPermissionGranted(result === 'granted')
  }, [])

  useEffect(() => {
    if (!current || !profile?.city) return

    const alertCities = current.cities ?? current.data ?? []
    const isMyArea = alertCities.some(c =>
      c === profile.city || c.includes(profile.city!) || profile.city!.includes(c)
    )
    if (!isMyArea) return

    const alertId = alertCities.sort().join(',') + (current.title ?? '')
    if (alertId === lastAlertId.current) return
    lastAlertId.current = alertId

    haptic(200)
    setPrompt({ type: 'shelter', alert: current, cities: alertCities })

    sendBrowserNotification(
      'אזעקה באזור שלך!',
      `${current.title ?? 'צבע אדום'} — היכנס למרחב מוגן ועדכן את הסטטוס שלך`
    )

    if (followUpTimer.current) clearTimeout(followUpTimer.current)
    followUpTimer.current = setTimeout(() => {
      haptic(100)
      setPrompt({ type: 'safe_check', alert: current, cities: alertCities })
      sendBrowserNotification(
        'האזעקה הסתיימה',
        'האם אתה בסדר? עדכן את הסטטוס שלך'
      )
    }, 10 * 60 * 1000)

    return () => {
      if (followUpTimer.current) clearTimeout(followUpTimer.current)
    }
  }, [current, profile?.city])

  const updateStatus = useCallback(async (status: 'in_shelter' | 'safe') => {
    if (!user) return
    await supabase.from('profiles')
      .update({ status, status_updated_at: new Date().toISOString() })
      .eq('id', user.id)
    await refreshProfile()
  }, [user, refreshProfile])

  const dismissPrompt = useCallback(() => setPrompt(null), [])

  const respondShelter = useCallback(async () => {
    haptic(50)
    await updateStatus('in_shelter')
    setPrompt(null)
  }, [updateStatus])

  const respondSafe = useCallback(async () => {
    haptic(50)
    await updateStatus('safe')
    setPrompt(null)
  }, [updateStatus])

  return (
    <NotifCtx.Provider value={{ prompt, dismissPrompt, respondShelter, respondSafe, permissionGranted, requestPermission }}>
      {children}
    </NotifCtx.Provider>
  )
}

export const useNotifications = () => useContext(NotifCtx)
