import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { connectAlerts, injectDemoAlert } from './alerts'
import type { SocketAlert } from './types'

interface AlertState {
  current: SocketAlert | null
  history: (SocketAlert & { ts: number })[]
  triggerDemo: (city?: string | null) => void
  clearCurrent: () => void
}

const AlertCtx = createContext<AlertState>({
  current: null,
  history: [],
  triggerDemo: () => {},
  clearCurrent: () => {},
})

export function AlertProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<SocketAlert | null>(null)
  const [history, setHistory] = useState<(SocketAlert & { ts: number })[]>([])
  const clearTimer = useRef<ReturnType<typeof setTimeout>>(null)

  const handleAlert = useCallback((data: SocketAlert) => {
    setCurrent(data)
    setHistory(prev => [{ ...data, ts: Date.now() }, ...prev].slice(0, 50))

    if (clearTimer.current) clearTimeout(clearTimer.current)
    clearTimer.current = setTimeout(() => setCurrent(null), 5 * 60 * 1000)
  }, [])

  useEffect(() => {
    const disconnect = connectAlerts(handleAlert)
    return () => {
      disconnect()
      if (clearTimer.current) clearTimeout(clearTimer.current)
    }
  }, [handleAlert])

  const triggerDemo = useCallback((city?: string | null) => {
    injectDemoAlert(city)
  }, [])

  const clearCurrent = useCallback(() => setCurrent(null), [])

  return (
    <AlertCtx.Provider value={{ current, history, triggerDemo, clearCurrent }}>
      {children}
    </AlertCtx.Provider>
  )
}

export const useAlerts = () => useContext(AlertCtx)
