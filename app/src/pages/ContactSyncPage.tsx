import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { normalizePhone } from '../lib/phone'
import OnboardingShell from '../components/OnboardingShell'
import OnboardingHeader from '../components/OnboardingHeader'
import ProgressBar from '../components/ProgressBar'
import PrimaryButton from '../components/PrimaryButton'

type SyncState = 'permission' | 'importing' | 'success' | 'error'

const AVATARS = [
  'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg',
  'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg',
  'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg',
  'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-6.jpg',
]

export default function ContactSyncPage() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [state, setState] = useState<SyncState>('permission')
  const [importCount, setImportCount] = useState(0)
  const [totalScanned, setTotalScanned] = useState(0)
  const [mutualCount, setMutualCount] = useState(0)
  const animRef = useRef<number>(null)
  const apiDone = useRef(false)
  const apiFailed = useRef(false)
  const animDone = useRef(false)

  const tryFinish = () => {
    if (apiFailed.current) {
      setState('error')
      return
    }
    if (apiDone.current && animDone.current) {
      setState('success')
    }
  }

  const startSync = async () => {
    apiDone.current = false
    apiFailed.current = false
    animDone.current = false
    setState('importing')
    try {
      const demoContacts = [
        { phone: '0541234567', name: 'שרה כהן' },
        { phone: '0521234567', name: 'דוד לוי' },
        { phone: '0501234567', name: 'נועה אדרי' },
        { phone: '0531234567', name: 'יוסי כהן' },
        { phone: '0551234567', name: 'רוני גבאי' },
      ]
      const batch = demoContacts
        .map(c => ({ user_id: user!.id, contact_phone: normalizePhone(c.phone), contact_name: c.name || null }))
        .filter(c => c.contact_phone !== null)

      await supabase.from('user_contacts').upsert(batch, { onConflict: 'user_id,contact_phone' })
      setTotalScanned(batch.length)

      const { data: mutuals } = await supabase.rpc('get_mutual_contacts', { requesting_user_id: user!.id })
      setMutualCount(mutuals?.length ?? 0)
      apiDone.current = true
      tryFinish()
    } catch {
      apiFailed.current = true
      tryFinish()
    }
  }

  useEffect(() => {
    if (state !== 'importing') return
    const target = 482
    const duration = 2500
    const start = Date.now()
    let cancelled = false
    const tick = () => {
      if (cancelled) return
      const progress = Math.min((Date.now() - start) / duration, 1)
      setImportCount(Math.floor(progress * target))
      if (progress < 1) {
        animRef.current = requestAnimationFrame(tick)
      } else {
        setTotalScanned(prev => prev || target)
        animDone.current = true
        tryFinish()
      }
    }
    animRef.current = requestAnimationFrame(tick)
    return () => { cancelled = true; if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [state])

  return (
    <OnboardingShell>
      <OnboardingHeader showSkip={state === 'permission'} onSkip={() => nav('/onboarding/ready')} />
      <ProgressBar step={2} />

      <div className="flex-1 flex flex-col px-6 relative overflow-y-auto pb-6">

        {state === 'permission' && (
          <div className="flex flex-col h-full animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex justify-center py-4 relative">
              <div className="w-24 h-24 relative flex items-center justify-center">
                <div className="pulse-ring inset-0 absolute" />
                <div className="w-20 h-20 rounded-full bg-[#232730] flex items-center justify-center z-10 border border-white/5 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '8px 8px' }} />
                  <i className="fas fa-users text-4xl text-[#FF4D4D] animate-bounce-slight" />
                </div>
                <div className="absolute top-0 right-0 w-10 h-10 rounded-full bg-[#1A1D24] border-2 border-[#0F1115] overflow-hidden animate-fade-in" style={{ animationDelay: '0.3s' }}>
                  <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg" className="w-full h-full object-cover opacity-80" alt="" />
                </div>
                <div className="absolute bottom-2 left-0 w-8 h-8 rounded-full bg-[#1A1D24] border-2 border-[#0F1115] overflow-hidden animate-fade-in" style={{ animationDelay: '0.5s' }}>
                  <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg" className="w-full h-full object-cover opacity-80" alt="" />
                </div>
              </div>
            </div>

            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">מי מהחברים שלך כבר כאן?</h1>
              <p className="text-[#9CA3AF] text-sm leading-relaxed px-2">
                כדי שתוכלו לראות את הסטטוס אחד של השני בזמן אמת, אנחנו צריכים להתאים את אנשי הקשר שלך.
              </p>
            </div>

            <div className="gradient-border rounded-2xl p-4 mb-6 bg-[#1A1D24]/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FF4D4D]/10 flex items-center justify-center shrink-0">
                  <i className="fas fa-shield-alt text-[#FF4D4D] text-sm" />
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm">הפרטיות שלך חשובה לנו</h3>
                  <p className="text-[11px] text-[#9CA3AF] leading-tight">ההתאמה נעשית בצורה מוצפנת. לא נשלח הודעות לאנשי הקשר שלך.</p>
                </div>
              </div>
            </div>

            <div className="flex-1" />

            <PrimaryButton onClick={startSync} className="mb-4">
              <span>אפשרו גישה לאנשי קשר</span>
              <i className="fas fa-address-book" />
            </PrimaryButton>
            <p className="text-[11px] text-center text-[#9CA3AF]/60 mb-2">תקפוץ הודעה של מערכת ההפעלה לאישור הגישה</p>
          </div>
        )}

        {state === 'importing' && (
          <div className="flex flex-col h-full items-center justify-center animate-fade-in">
            <div className="relative w-40 h-40 mb-8 flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-[#232730] rounded-full" />
              <div className="absolute inset-0 border-4 border-[#FF4D4D] border-t-transparent rounded-full animate-spin" />
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-white tabular-nums">{importCount}</span>
                <span className="text-xs text-[#9CA3AF] mt-1">אנשי קשר</span>
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">מחפשים חברים...</h2>
            <p className="text-[#9CA3AF] text-sm text-center px-8">זה ייקח רק כמה שניות. אנחנו בודקים מי מאנשי הקשר שלך כבר משתמש ב-SafeStatus.</p>
          </div>
        )}

        {state === 'success' && (
          <div className="flex flex-col h-full animate-slide-up">
            <div className="flex-1 flex flex-col items-center justify-center pt-10">
              <div className="w-20 h-20 rounded-full bg-[#10B981]/10 flex items-center justify-center mb-6 ring-1 ring-[#10B981]/30">
                <i className="fas fa-check text-3xl text-[#10B981]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 text-center">הסנכרון הושלם!</h2>
              <p className="text-[#9CA3AF] text-sm text-center mb-8">מצאנו חברים שתוכלו לעקוב אחריהם.</p>

              <div className="grid grid-cols-2 gap-4 w-full mb-8">
                <div className="bg-[#1A1D24] border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center">
                  <span className="text-3xl font-bold text-white mb-1">{totalScanned}</span>
                  <span className="text-xs text-[#9CA3AF]">אנשי קשר נסרקו</span>
                </div>
                <div className="bg-[#1A1D24] border border-[#FF4D4D]/30 rounded-2xl p-4 flex flex-col items-center text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[#FF4D4D]/5" />
                  <span className="text-3xl font-bold text-[#FF4D4D] mb-1 relative">{mutualCount}</span>
                  <span className="text-xs text-[#9CA3AF] relative">כבר ב-SafeStatus</span>
                </div>
              </div>

              <div className="w-full bg-[#1A1D24]/50 rounded-xl p-4 border border-white/5 mb-4">
                <div className="text-xs text-[#9CA3AF] mb-3">חברים שנמצאו:</div>
                <div className="flex -space-x-3 space-x-reverse overflow-x-auto py-2 px-1">
                  {AVATARS.map((src, i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0F1115] relative shrink-0">
                      <img src={src} className="w-full h-full rounded-full object-cover" alt="" />
                      {i < 2 && <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#10B981] rounded-full border border-[#0F1115]" />}
                    </div>
                  ))}
                  {mutualCount > AVATARS.length && (
                    <div className="w-10 h-10 rounded-full border-2 border-[#0F1115] bg-[#232730] flex items-center justify-center text-xs text-white font-medium shrink-0">
                      +{mutualCount - AVATARS.length}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pb-8 pt-2">
              <PrimaryButton onClick={() => nav('/onboarding/ready')}>
                <span>סיום והמשך</span>
                <i className="fas fa-arrow-left" />
              </PrimaryButton>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="flex flex-col h-full justify-center items-center text-center animate-slide-up">
            <div className="w-20 h-20 rounded-full bg-[#232730] flex items-center justify-center mb-6">
              <i className="fas fa-lock text-3xl text-[#9CA3AF]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">שגיאה בסנכרון</h2>
            <p className="text-[#9CA3AF] text-sm mb-8 px-4">אירעה שגיאה בסנכרון אנשי הקשר. אנא נסו שוב.</p>
            <button onClick={() => setState('permission')} className="w-full bg-[#FF4D4D] hover:bg-[#E04343] text-white font-medium h-12 rounded-xl transition-all mb-3 flex items-center justify-center gap-2">
              <i className="fas fa-redo-alt text-sm" />
              <span>נסה שוב</span>
            </button>
            <button onClick={() => nav('/onboarding/ready')} className="text-[#9CA3AF] text-sm font-medium py-2 px-4 hover:text-white transition-colors">
              דלג
            </button>
          </div>
        )}
      </div>
    </OnboardingShell>
  )
}
