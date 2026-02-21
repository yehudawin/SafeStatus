import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  variant?: 'ob' | 'app'
  className?: string
}

export default function PrimaryButton({ children, onClick, disabled, loading, variant = 'ob', className = '' }: Props) {
  const bg = variant === 'ob' ? 'bg-[#FF4D4D] hover:bg-[#E04343] shadow-[#FF4D4D]/20' : 'bg-[#3B82F6] hover:bg-blue-600 shadow-blue-900/20'

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full ${bg} text-white font-bold h-14 rounded-xl shadow-lg transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 text-lg ${className}`}
    >
      {loading ? <div className="spinner" /> : children}
    </button>
  )
}
