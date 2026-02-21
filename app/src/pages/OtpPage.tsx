import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatPhone } from '../lib/phone'
import { haptic, hapticError } from '../lib/haptic'
import { useToast } from '../components/Toast'
import OnboardingShell from '../components/OnboardingShell'
import StatusBar from '../components/StatusBar'
import OnboardingHeader from '../components/OnboardingHeader'
import Numpad from '../components/Numpad'
import PrimaryButton from '../components/PrimaryButton'

const OTP_LENGTH = 6

export default function OtpPage() {
  const nav = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const { phone = '', e164 = '' } = (location.state as { phone?: string; e164?: string }) ?? {}

  const [otp, setOtp] = useState<string[]>([])
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(45)

  useEffect(() => {
    if (timeLeft <= 0) return
    const t = setInterval(() => setTimeLeft(s => s - 1), 1000)
    return () => clearInterval(t)
  }, [timeLeft])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') addDigit(e.key)
      else if (e.key === 'Backspace') delDigit()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  })

  const addDigit = useCallback((d: string) => {
    haptic()
    setError(false)
    setOtp(prev => prev.length < OTP_LENGTH ? [...prev, d] : prev)
  }, [])

  const delDigit = useCallback(() => {
    haptic()
    setError(false)
    setOtp(prev => prev.slice(0, -1))
  }, [])

  const verify = async () => {
    const code = otp.join('')
    if (code.length < OTP_LENGTH) return
    setLoading(true)

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      phone: e164,
      token: code,
      type: 'sms',
    })

    if (verifyError || !data.user) {
      setError(true)
      hapticError()
      setLoading(false)
      setTimeout(() => setOtp([]), 1000)
      return
    }

    toast.show('האימות הצליח! מתחבר...', 'success')
    const { data: profile } = await supabase
      .from('profiles').select('city').eq('id', data.user.id).single()

    setTimeout(() => {
      if (profile?.city) nav('/home', { replace: true })
      else nav('/onboarding/city', { replace: true })
    }, 800)
  }

  const resend = async () => {
    setTimeLeft(45)
    await supabase.auth.signInWithOtp({ phone: e164 })
    toast.show('קוד חדש נשלח בהצלחה', 'success')
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const timerText = `0${minutes}:${seconds < 10 ? '0' : ''}${seconds}`

  return (
    <OnboardingShell>
      <StatusBar />
      <OnboardingHeader title="אימות מספר טלפון" />

      <div className="flex-1 flex flex-col px-6 relative z-0">
        {/* Instructions */}
        <div className="text-right mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h1 className="text-2xl font-bold text-white mb-2">קוד האימות נשלח</h1>
          <div className="flex items-center gap-2 text-[#9CA3AF] text-lg flex-wrap">
            <span>אל המספר</span>
            <span className="text-white font-mono tracking-wide" dir="ltr">{formatPhone(phone)}</span>
            <button
              onClick={() => nav('/login')}
              className="text-[#FF4D4D] text-sm font-medium min-w-[44px] min-h-[44px] flex items-center justify-center rounded hover:bg-[#FF4D4D]/10 transition-colors mr-1"
            >
              עריכה
            </button>
          </div>
        </div>

        {/* OTP boxes */}
        <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex justify-between gap-2 mb-2" dir="ltr">
            {Array.from({ length: OTP_LENGTH }).map((_, i) => (
              <div
                key={i}
                className={`otp-box w-12 h-14 rounded-xl border bg-[#1A1D24] flex items-center justify-center text-2xl font-bold text-white transition-all ${
                  error ? 'error animate-[shake_0.4s_ease-in-out]' :
                  i < otp.length ? 'filled border-white/30' :
                  i === otp.length ? 'active' : 'border-white/10'
                }`}
              >
                {i < otp.length && <span className="animate-pop-in">{otp[i]}</span>}
              </div>
            ))}
          </div>
          <div className="h-6 flex items-center mt-2">
            {error ? (
              <p className="text-[#EF4444] text-xs flex items-center gap-1">
                <i className="fas fa-exclamation-circle" />
                <span>הקוד שהוזן שגוי, אנא נסו שוב</span>
              </p>
            ) : (
              <p className="text-[#3B82F6] text-xs flex items-center gap-1 mr-auto">
                <i className="fas fa-magic" />
                <span>זיהוי SMS אוטומטי פעיל</span>
              </p>
            )}
          </div>
        </div>

        {/* Resend timer */}
        <div className="flex justify-center items-center mb-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          {timeLeft > 0 ? (
            <div className="text-[#9CA3AF] text-sm bg-[#1A1D24]/50 px-4 py-2 rounded-full border border-white/5">
              שליחה חוזרת בעוד <span className="font-mono w-8 inline-block text-center text-white">{timerText}</span>
            </div>
          ) : (
            <button
              onClick={resend}
              className="text-[#3B82F6] hover:text-white text-sm font-medium transition-colors flex items-center gap-2 px-4 py-2 rounded-full hover:bg-[#1A1D24] border border-transparent hover:border-white/10"
            >
              <i className="fas fa-redo-alt text-xs" />
              שלחו לי קוד חדש
            </button>
          )}
        </div>

        <div className="flex-grow" />

        {/* Verify */}
        <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <PrimaryButton onClick={verify} disabled={otp.length < OTP_LENGTH} loading={loading}>
            <span>אימות וכניסה</span>
            {otp.length === OTP_LENGTH && !loading && <i className="fas fa-check" />}
          </PrimaryButton>
        </div>
      </div>

      <Numpad onDigit={addDigit} onDelete={delDigit} />
    </OnboardingShell>
  )
}
