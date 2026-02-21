import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import OnboardingShell from '../components/OnboardingShell'
import OnboardingHeader from '../components/OnboardingHeader'
import ProgressBar from '../components/ProgressBar'
import PrimaryButton from '../components/PrimaryButton'

const AVATARS = [
  'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg',
  'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg',
  'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-6.jpg',
]

function fireConfetti() {
  const colors = ['#FF4D4D', '#3B82F6', '#10B981', '#FFD700', '#FFFFFF']
  for (let i = 0; i < 50; i++) {
    const el = document.createElement('div')
    el.style.cssText = `position:fixed;width:8px;height:16px;top:0;left:${Math.random()*100}%;z-index:9999;pointer-events:none;`
    el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
    el.animate([
      { transform: 'translateY(-10px) rotate(0deg)', opacity: '1' },
      { transform: `translateY(${window.innerHeight}px) rotate(${Math.random()*360}deg)`, opacity: '0' },
    ], { duration: 1500 + Math.random() * 1000, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', fill: 'forwards' })
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 3000)
  }
}

export default function ReadyPage() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [mutualCount, setMutualCount] = useState(0)

  const fetchMutuals = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.rpc('get_mutual_contacts', { requesting_user_id: user.id })
    setMutualCount(data?.length ?? 0)
  }, [user])

  useEffect(() => { fetchMutuals() }, [fetchMutuals])

  useEffect(() => {
    const t = setTimeout(fireConfetti, 500)
    return () => clearTimeout(t)
  }, [])

  return (
    <OnboardingShell>
      <OnboardingHeader showBack />
      <ProgressBar step={3} />

      <div className="flex-1 flex flex-col px-6 relative overflow-y-auto pb-6">
        <div className="flex flex-col h-full">

          <div className="flex justify-center py-6 relative mb-2">
            <div className="absolute inset-0 rounded-full opacity-30" style={{ background: 'radial-gradient(circle at center, rgba(16,185,129,0.15) 0%, transparent 70%)' }} />
            <div className="w-48 h-48 relative animate-float">
              <div className="absolute inset-4 bg-[#232730] rounded-full border border-white/5 opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center z-10 animate-[pop-in_0.5s_ease-out_0.2s_forwards] opacity-0">
                <div className="relative">
                  <i className="fas fa-shield-heart text-6xl text-[#FF4D4D] drop-shadow-[0_0_15px_rgba(255,77,77,0.4)]" />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#10B981] rounded-full flex items-center justify-center border-4 border-[#0F1115] shadow-lg animate-[pop-in_0.5s_ease-out_0.6s_forwards] opacity-0">
                    <i className="fas fa-check text-white text-xs" />
                  </div>
                </div>
              </div>
              {AVATARS.map((src, i) => {
                const pos = ['top-0 right-4 w-10 h-10', 'bottom-8 left-2 w-8 h-8', 'top-10 left-0 w-6 h-6']
                return (
                  <div key={i} className={`absolute ${pos[i]} rounded-full bg-[#1A1D24] border-2 border-[#0F1115] overflow-hidden animate-fade-in shadow-lg`}
                    style={{ animationDelay: `${0.4 + i * 0.15}s` }}>
                    <img src={src} className="w-full h-full object-cover" alt="" />
                  </div>
                )
              })}
            </div>
          </div>

          <div className="text-center mb-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <h1 className="text-3xl font-bold text-white mb-3">אנחנו מוכנים!</h1>
            <p className="text-[#9CA3AF] text-sm leading-relaxed px-4">
              האפליקציה הוגדרה בהצלחה. מעכשיו תוכלו לעדכן סטטוס ולראות מה שלום היקרים לכם בזמן אמת.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-5 mb-6 animate-slide-up shadow-lg relative overflow-hidden" style={{ animationDelay: '0.5s' }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF4D4D]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-[#232730] flex items-center justify-center shrink-0 border border-white/5">
                <i className="fas fa-user-friends text-xl text-[#FF4D4D]" />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl font-bold text-white tabular-nums">{mutualCount}</span>
                  <span className="text-sm font-medium text-white/90">אנשי קשר הדדיים</span>
                </div>
                <p className="text-xs text-[#9CA3AF] leading-relaxed">
                  {mutualCount > 0
                    ? 'אלו אנשי קשר ששמרו את המספר שלך וגם משתמשים באפליקציה.'
                    : 'כרגע אין אנשי קשר הדדיים. הזמינו חברים להתקין את SafeStatus.'}
                </p>
              </div>
            </div>
            {mutualCount > 0 && (
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex -space-x-2 space-x-reverse overflow-hidden px-1">
                  {AVATARS.slice(0, Math.min(mutualCount, 3)).map((src, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[#1A1D24] bg-[#232730] relative" style={{ zIndex: 30 - i * 10 }}>
                      <img src={src} className="w-full h-full rounded-full object-cover" alt="" />
                    </div>
                  ))}
                  {mutualCount > 3 && (
                    <div className="w-8 h-8 rounded-full border-2 border-[#1A1D24] bg-[#232730] flex items-center justify-center text-[10px] text-white font-medium">
                      +{mutualCount - 3}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1" />

          <div className="text-center mb-6 animate-slide-up" style={{ animationDelay: '0.7s' }}>
            <p className="text-xs text-[#9CA3AF] mb-3">המספר לא נראה הגיוני?</p>
            <button onClick={() => nav('/onboarding/sync')} className="min-h-[44px] px-6 py-2 text-sm font-medium text-[#3B82F6] hover:text-white transition-colors border border-[#3B82F6]/20 rounded-full flex items-center justify-center gap-2 mx-auto active:bg-[#3B82F6]/10">
              <i className="fas fa-sync-alt text-xs" />
              <span>בצע סנכרון מחדש</span>
            </button>
          </div>

          <PrimaryButton onClick={() => nav('/home', { replace: true })} className="mb-4 animate-slide-up">
            <span>בוא נתחיל</span>
            <i className="fas fa-arrow-left" />
          </PrimaryButton>
        </div>
      </div>
    </OnboardingShell>
  )
}
