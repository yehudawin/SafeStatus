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
      bgColor: 'bg-shelter bg-opacity-20',
      borderColor: 'border-shelter',
      textColor: 'text-shelter'
    },
    safe: {
      icon: CheckCircle,
      text: 'חזרתי לשגרה',
      bgColor: 'bg-safe bg-opacity-20',
      borderColor: 'border-safe',
      textColor: 'text-safe'
    }
  }
  
  const { icon: Icon, text, bgColor, borderColor, textColor } = config[statusType]
  
  return (
    <button
      onClick={() => onClick(statusType as UserStatus)}
      disabled={disabled}
      className={`
        w-full ${bgColor} border-2 ${borderColor} rounded-xl p-8 
        flex flex-col items-center transition-transform 
        active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      <Icon className={`text-5xl mb-6 ${textColor}`} size={80} />
      <span className="text-xl font-bold">{text}</span>
    </button>
  )
} 