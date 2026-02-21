import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatPhone, toE164 } from '../lib/phone'
import { haptic } from '../lib/haptic'
import { useToast } from '../components/Toast'
import OnboardingShell from '../components/OnboardingShell'
import StatusBar from '../components/StatusBar'
import Numpad from '../components/Numpad'
import PrimaryButton from '../components/PrimaryButton'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()
  const toast = useToast()
  const isValid = /^05\d{8}$/.test(phone)

  const addDigit = useCallback((d: string) => {
    haptic()
    setPhone(p => p.length < 10 ? p + d : p)
  }, [])

  const delDigit = useCallback(() => {
    haptic()
    setPhone(p => p.slice(0, -1))
  }, [])

  const submit = async () => {
    if (!isValid) return
    setLoading(true)

    const e164 = toE164(phone)
    const { error } = await supabase.auth.signInWithOtp({ phone: e164 })

    setLoading(false)
    if (error) {
      toast.show('שגיאת תקשורת. אנא נסו שוב.', 'error')
      return
    }
    toast.show('קוד אימות נשלח בהצלחה!', 'success')
    setTimeout(() => nav('/otp', { state: { phone, e164 } }), 600)
  }

  return (
    <OnboardingShell>
      <StatusBar />

      <div className="flex-1 flex flex-col px-6 pt-8 pb-4 relative z-0">
        {/* Header */}
        <div className="mb-10 text-right animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="w-12 h-12 bg-[#232730] rounded-2xl flex items-center justify-center mb-6 shadow-lg border border-white/5">
            <i className="fas fa-shield-heart text-[#FF4D4D] text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3 tracking-tight leading-tight">
            ברוכים הבאים ל-<span className="safe-status-gradient">SafeStatus</span>
          </h1>
          <p className="text-[#9CA3AF] text-lg leading-relaxed">
            הכניסו את מספר הטלפון כדי להתחבר ולקבל עדכונים בזמן אמת.
          </p>
        </div>

        {/* Phone input */}
        <div className="flex-1 flex flex-col animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="relative mb-8">
            <label className="block text-sm font-medium text-[#9CA3AF] mb-2 pr-1">מספר טלפון נייד</label>
            <div className={`flex items-center bg-[#1A1D24] border rounded-xl h-14 px-4 transition-all duration-300 ${
              phone.length > 0
                ? 'border-[#FF4D4D] ring-1 ring-[#FF4D4D]/30 shadow-[0_0_20px_rgba(255,77,77,0.15)]'
                : 'border-white/10'
            }`}>
              <div className="flex items-center pl-3 border-l border-white/10 h-6">
                <span className="text-xl ml-2">🇮🇱</span>
                <span className="text-white font-mono text-lg tracking-wide" dir="ltr">+972</span>
              </div>
              <input
                type="tel"
                readOnly
                value={formatPhone(phone)}
                className="w-full bg-transparent border-none text-white text-xl font-mono tracking-widest placeholder-[#6B7280] focus:ring-0 px-3 py-2 text-left"
                dir="ltr"
                placeholder="05X-XXX-XXXX"
                inputMode="none"
                aria-label="מספר טלפון נייד"
              />
              <div className="w-6 flex items-center justify-center">
                {isValid && (
                  <i className="fas fa-check-circle text-[#10B981] transition-opacity duration-300" />
                )}
              </div>
            </div>
            <p className={`text-[#EF4444] text-xs mt-2 pr-1 h-4 transition-opacity duration-200 ${
              phone.length === 10 && !isValid ? 'opacity-100' : 'opacity-0'
            }`}>
              מספר הטלפון חייב להתחיל ב-05
            </p>
          </div>

          <div className="flex-grow" />

          {/* Legal */}
          <div className="text-center mb-6 px-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <p className="text-xs text-[#9CA3AF]/60 leading-5">
              בלחיצה על &quot;שלחו קוד&quot;, אתם מסכימים{' '}
              <a href="#" className="text-white/80 underline decoration-white/30 hover:text-white">לתנאי השימוש</a>
              {' '}ו<a href="#" className="text-white/80 underline decoration-white/30 hover:text-white">מדיניות הפרטיות</a>
              {' '}שלנו.
            </p>
          </div>

          {/* CTA */}
          <div className="mb-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <PrimaryButton onClick={submit} disabled={!isValid} loading={loading}>
              שלחו קוד
            </PrimaryButton>
          </div>
        </div>
      </div>

      <Numpad onDigit={addDigit} onDelete={delDigit} />
    </OnboardingShell>
  )
}
