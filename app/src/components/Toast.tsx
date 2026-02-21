import { useState, useCallback, createContext, useContext, type ReactNode } from 'react'

type ToastType = 'info' | 'success' | 'error'

interface Toast {
  id: number
  message: string
  type: ToastType
  visible: boolean
}

interface ToastCtx {
  show: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastCtx>({ show: () => {} })

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId++
    setToasts(prev => [...prev, { id, message, type, visible: false }])
    requestAnimationFrame(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: true } : t))
    })
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: false } : t))
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300)
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[400px] pointer-events-none">
        {toasts.map(t => {
          const iconClass = t.type === 'success' ? 'fa-check-circle text-[#10B981]'
            : t.type === 'error' ? 'fa-exclamation-circle text-[#EF4444]'
            : 'fa-info-circle text-[#3B82F6]'
          const borderColor = t.type === 'success' ? 'border-r-[#10B981]'
            : t.type === 'error' ? 'border-r-[#EF4444]'
            : 'border-r-[#3B82F6]'
          return (
            <div
              key={t.id}
              className={`bg-[#232730] rounded-xl px-4 py-3 mb-2.5 shadow-lg flex items-center justify-between border-r-4 ${borderColor} transition-all duration-300 ${
                t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'
              }`}
            >
              <div className="flex items-center gap-3">
                <i className={`fas ${iconClass}`} />
                <span className="text-sm font-medium text-white">{t.message}</span>
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
