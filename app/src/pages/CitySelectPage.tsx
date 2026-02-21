import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { CITIES } from '../lib/cities'
import { useToast } from '../components/Toast'
import OnboardingShell from '../components/OnboardingShell'
import OnboardingHeader from '../components/OnboardingHeader'
import ProgressBar from '../components/ProgressBar'
import PrimaryButton from '../components/PrimaryButton'

function highlightMatch(text: string, filter: string) {
  if (!filter) return text
  const idx = text.indexOf(filter)
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-[#FF4D4D]">{filter}</span>
      {text.slice(idx + filter.length)}
    </>
  )
}

export default function CitySelectPage() {
  const nav = useNavigate()
  const { user, refreshProfile } = useAuth()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const filtered = useMemo(
    () => CITIES.filter(c => c.includes(search)),
    [search]
  )

  const proceed = async () => {
    if (!selected || !user) return
    setLoading(true)
    try {
      const { error } = await supabase.from('profiles').update({ city: selected }).eq('id', user.id)
      if (error) throw error
      await refreshProfile()
      nav('/onboarding/sync')
    } catch {
      toast.show('שגיאה בשמירת העיר. נסו שוב.', 'error')
      setLoading(false)
    }
  }

  return (
    <OnboardingShell>
      <OnboardingHeader showSkip onSkip={() => nav('/onboarding/sync')} />
      <ProgressBar step={1} />

      <div className="flex-1 flex flex-col px-6 overflow-hidden">
        {/* Title */}
        <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h1 className="text-2xl font-bold text-white mb-2">באיזו עיר אתם גרים?</h1>
          <p className="text-[#9CA3AF] text-sm">כך נוכל לעדכן אתכם על אזעקות באזורכם בזמן אמת.</p>
        </div>

        {/* Search */}
        <div className="mb-4 relative animate-slide-up rounded-xl transition-all duration-200 focus-within:ring-1 focus-within:ring-[#FF4D4D]/30 focus-within:border-[#FF4D4D]" style={{ animationDelay: '0.15s' }}>
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <i className="fas fa-search text-[#6B7280] text-lg" />
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חפשו עיר או יישוב..."
            className="w-full h-14 bg-[#1A1D24] border border-white/10 rounded-xl pr-12 pl-12 text-white placeholder-[#6B7280] focus:outline-none focus:bg-[#232730] transition-colors text-right"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute inset-y-0 left-4 flex items-center cursor-pointer"
            >
              <i className="fas fa-times-circle text-[#9CA3AF] hover:text-white transition-colors" />
            </button>
          )}
        </div>

        {/* Cities list */}
        <div className="flex-1 overflow-hidden relative bg-[#1A1D24]/30 rounded-2xl border border-white/5 mb-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="w-16 h-16 bg-[#1A1D24] rounded-full flex items-center justify-center mb-4">
                <i className="fas fa-map-marker-alt text-[#9CA3AF] text-2xl opacity-50" />
              </div>
              <h3 className="text-white font-medium mb-1">לא נמצאו תוצאות</h3>
              <p className="text-[#9CA3AF] text-sm">נסו לחפש עיר אחרת או בדקו את האיות.</p>
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-2 space-y-2 custom-scrollbar">
              {filtered.map(city => {
                const isSelected = selected === city
                return (
                  <div
                    key={city}
                    onClick={() => setSelected(city)}
                    className={`city-item p-4 rounded-xl border cursor-pointer flex items-center justify-between relative overflow-hidden ${
                      isSelected
                        ? 'selected bg-[#FF4D4D]/10 border-[#FF4D4D]'
                        : 'border-transparent hover:bg-[#232730] bg-[#1A1D24] mb-2'
                    }`}
                  >
                    <div className="flex items-center gap-3 z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-[#FF4D4D] text-white' : 'bg-[#232730] text-[#9CA3AF]'
                      }`}>
                        <i className="fas fa-map-marker-alt text-xs" />
                      </div>
                      <span className={`text-lg font-medium ${isSelected ? 'text-white' : 'text-white/90'}`}>
                        {highlightMatch(city, search)}
                      </span>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all z-10 ${
                      isSelected ? 'border-[#FF4D4D] bg-[#FF4D4D]' : 'border-white/20'
                    }`}>
                      {isSelected && <i className="fas fa-check text-white text-xs" />}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0F1115] to-transparent pointer-events-none" />
        </div>

        {/* Continue */}
        <div className="pb-8 pt-2 animate-slide-up" style={{ animationDelay: '0.25s' }}>
          <PrimaryButton onClick={proceed} disabled={!selected} loading={loading}>
            <span>המשך</span>
            <i className="fas fa-arrow-left" />
          </PrimaryButton>
        </div>
      </div>
    </OnboardingShell>
  )
}
