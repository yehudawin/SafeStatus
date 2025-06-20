import { Shield, CheckCircle } from 'lucide-react'
import type { UserStatus } from '@/types'

interface StatusButtonProps {
  statusType: 'shelter' | 'safe'
  onClick: (statusValue: UserStatus) => void
  disabled?: boolean
}

export default function StatusButton({ statusType, onClick, disabled = false }: StatusButtonProps) {
  const config = {
    shelter: {
      icon: Shield,
      text: 'נכנסתי למרחב מוגן',
      bgColor: 'bg-warning',
      textColor: 'text-white',
      hoverColor: 'hover:bg-opacity-90'
    },
    safe: {
      icon: CheckCircle,
      text: 'חזרתי לשגרה',
      bgColor: 'bg-safe',
      textColor: 'text-white',
      hoverColor: 'hover:bg-opacity-90'
    }
  }
  
  const { icon: Icon, text, bgColor, textColor, hoverColor } = config[statusType]
  
  return (
    <button
      onClick={() => onClick(statusType as UserStatus)}
      disabled={disabled}
      className={`
        w-full ${bgColor} ${textColor} rounded-design p-8 
        flex flex-col items-center transition-all duration-200
        active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
        ${hoverColor} shadow-light hover:shadow-medium
      `}
    >
      <Icon className="text-5xl mb-6" size={80} />
      <span className="text-xl font-bold">{text}</span>
    </button>
  )
} 