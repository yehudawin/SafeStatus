import { useNavigate } from 'react-router-dom'

interface Props {
  title?: string
  showBack?: boolean
  showSkip?: boolean
  onSkip?: () => void
}

export default function OnboardingHeader({ title, showBack = true, showSkip = false, onSkip }: Props) {
  const nav = useNavigate()

  return (
    <div className="px-6 pt-4 pb-2 flex items-center justify-between z-10">
      {showBack ? (
        <button
          onClick={() => nav(-1)}
          className="w-10 h-10 rounded-full bg-[#1A1D24] hover:bg-[#232730] flex items-center justify-center text-white transition-colors border border-white/5"
        >
          <i className="fas fa-arrow-right text-sm" />
        </button>
      ) : <div className="w-10" />}

      {title && <div className="text-sm font-medium text-[#9CA3AF]">{title}</div>}

      {showSkip ? (
        <button
          onClick={onSkip}
          className="text-sm font-bold text-white/90 hover:text-white transition-colors px-3 py-1 bg-white/5 rounded-lg border border-white/10"
        >
          דילוג
        </button>
      ) : <div className="w-10" />}
    </div>
  )
}
