import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { normalizePhone } from '../lib/phone'
import { useAlerts } from '../lib/alertContext'
import { useNotifications } from '../lib/notifications'
import { CITIES } from '../lib/cities'
import { useToast } from '../components/Toast'
import AppShell from '../components/AppShell'

const DEMO_USERS = [
  { name: 'שרה כהן', city: 'תל אביב - יפו', status: 'safe' as const },
  { name: 'דוד לוי', city: 'ירושלים', status: 'in_shelter' as const },
  { name: 'נועה אדרי', city: 'חיפה', status: 'unknown' as const },
  { name: 'יוסי כהן', city: 'באר שבע', status: 'safe' as const },
  { name: 'רוני גבאי', city: 'אשדוד', status: 'in_shelter' as const },
  { name: 'מיכל ברק', city: 'ראשון לציון', status: 'safe' as const },
  { name: 'אלון פרידמן', city: 'נתניה', status: 'unknown' as const },
  { name: 'תמר שלום', city: 'חולון', status: 'in_shelter' as const },
]

export default function SettingsPage() {
  const nav = useNavigate()
  const { user, profile, refreshProfile } = useAuth()
  const { triggerDemo, current: activeAlert } = useAlerts()
  const { permissionGranted, requestPermission } = useNotifications()
  const toast = useToast()
  const [syncing, setSyncing] = useState(false)
  const [showCityPicker, setShowCityPicker] = useState(false)
  const [citySearch, setCitySearch] = useState('')
  const [showDevPanel, setShowDevPanel] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [demoFollowUpSec, setDemoFollowUpSec] = useState(15)

  const resyncContacts = async () => {
    if (!user || syncing) return
    setSyncing(true)
    try {
      const demoContacts = [
        { phone: '0541234567', name: 'שרה כהן' },
        { phone: '0521234567', name: 'דוד לוי' },
        { phone: '0501234567', name: 'נועה אדרי' },
        { phone: '0531234567', name: 'יוסי כהן' },
        { phone: '0551234567', name: 'רוני גבאי' },
      ]
      const batch = demoContacts
        .map(c => ({ user_id: user.id, contact_phone: normalizePhone(c.phone), contact_name: c.name || null }))
        .filter(c => c.contact_phone !== null)
      await supabase.from('user_contacts').upsert(batch, { onConflict: 'user_id,contact_phone' })
      toast.show('אנשי הקשר סונכרנו מחדש בהצלחה', 'success')
    } catch {
      toast.show('שגיאה בסנכרון אנשי קשר', 'error')
    }
    setSyncing(false)
  }

  const handleDemoAlert = () => {
    triggerDemo(profile?.city)
    toast.show('התראת דמו הופעלה!', 'info')
  }

  const changeCity = async (city: string) => {
    if (!user) return
    await supabase.from('profiles').update({ city }).eq('id', user.id)
    await refreshProfile()
    setShowCityPicker(false)
    toast.show(`העיר עודכנה ל-${city}`, 'success')
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    nav('/login', { replace: true })
  }

  const deleteAccount = async () => {
    if (!user) return
    try {
      await supabase.from('status_requests').delete().or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      await supabase.from('user_contacts').delete().eq('user_id', user.id)
      await supabase.auth.signOut()
      nav('/login', { replace: true })
    } catch {
      toast.show('שגיאה במחיקת החשבון', 'error')
    }
    setShowDeleteConfirm(false)
  }

  const filteredCities = CITIES.filter(c => c.includes(citySearch))

  const statusColors = { safe: 'bg-[#10B981]', in_shelter: 'bg-[#F59E0B]', unknown: 'bg-[#9CA3AF]' }
  const statusLabels = { safe: 'בטוח', in_shelter: 'במרחב מוגן', unknown: 'לא ידוע' }

  return (
    <AppShell>
      {/* Header */}
      <header className="bg-[#1F2937]/90 backdrop-blur-md sticky top-0 z-50 border-b border-[#374151] px-5 py-4 flex items-center gap-3 h-[72px]">
        <button onClick={() => nav('/home')} className="w-10 h-10 rounded-full bg-[#374151] hover:bg-gray-600 flex items-center justify-center text-[#F9FAFB] transition-colors">
          <i className="fa-solid fa-arrow-right text-sm" />
        </button>
        <h1 className="font-bold text-lg">הגדרות</h1>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 px-5 py-6 space-y-6">

        {/* Profile section */}
        <div className="bg-[#1F2937] border border-[#374151] rounded-2xl p-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6] border border-[#3B82F6]/30">
              <i className="fa-solid fa-user text-xl" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg">{profile?.display_name ?? profile?.phone ?? 'משתמש'}</p>
              <p className="text-sm text-[#D1D5DB]">{profile?.phone}</p>
              {profile?.city && <p className="text-xs text-[#9CA3AF]">{profile.city}</p>}
            </div>
          </div>
        </div>

        {/* General */}
        <div>
          <h3 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3 px-1">כללי</h3>
          <div className="bg-[#1F2937] border border-[#374151] rounded-2xl overflow-hidden divide-y divide-[#374151]">

            {/* City */}
            <button onClick={() => setShowCityPicker(true)} className="w-full p-4 flex items-center gap-3 hover:bg-[#374151] transition-colors text-right">
              <div className="w-9 h-9 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center">
                <i className="fa-solid fa-location-dot text-[#3B82F6] text-sm" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">עיר מגורים</p>
                <p className="text-xs text-[#9CA3AF]">{profile?.city ?? 'לא נבחרה'}</p>
              </div>
              <i className="fa-solid fa-chevron-left text-[#9CA3AF] text-xs" />
            </button>

            {/* Resync */}
            <button onClick={resyncContacts} disabled={syncing} className="w-full p-4 flex items-center gap-3 hover:bg-[#374151] transition-colors text-right disabled:opacity-50">
              <div className="w-9 h-9 rounded-lg bg-[#10B981]/10 flex items-center justify-center">
                <i className={`fa-solid fa-sync-alt text-[#10B981] text-sm ${syncing ? 'animate-spin' : ''}`} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">סנכרון אנשי קשר מחדש</p>
                <p className="text-xs text-[#9CA3AF]">עדכן את רשימת אנשי הקשר</p>
              </div>
              <i className="fa-solid fa-chevron-left text-[#9CA3AF] text-xs" />
            </button>

            {/* Notifications permission */}
            <button onClick={requestPermission} className="w-full p-4 flex items-center gap-3 hover:bg-[#374151] transition-colors text-right">
              <div className="w-9 h-9 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center">
                <i className="fa-solid fa-bell text-[#8B5CF6] text-sm" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">הרשאת התראות</p>
                <p className="text-xs text-[#9CA3AF]">
                  {permissionGranted ? 'מאושר — תקבל התראות כשיש אזעקה' : 'לחץ לאשר קבלת התראות'}
                </p>
              </div>
              {permissionGranted
                ? <i className="fa-solid fa-check text-[#10B981] text-sm" />
                : <i className="fa-solid fa-chevron-left text-[#9CA3AF] text-xs" />
              }
            </button>
          </div>
        </div>

        {/* Testing */}
        <div>
          <h3 className="text-xs font-semibold text-[#F59E0B]/80 uppercase tracking-wider mb-3 px-1">בדיקות ופיתוח</h3>
          <div className="bg-[#1F2937] border border-[#374151] rounded-2xl overflow-hidden divide-y divide-[#374151]">

            {/* Demo alert */}
            <button onClick={handleDemoAlert} className="w-full p-4 flex items-center gap-3 hover:bg-[#374151] transition-colors text-right">
              <div className="w-9 h-9 rounded-lg bg-[#EF4444]/10 flex items-center justify-center">
                <i className="fa-solid fa-triangle-exclamation text-[#EF4444] text-sm" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">התראת דמו</p>
                <p className="text-xs text-[#9CA3AF]">
                  {activeAlert ? 'התראה פעילה כרגע' : 'הפעל התראת דמו לבדיקת מערכת'}
                </p>
              </div>
              {activeAlert && <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] animate-pulse" />}
            </button>

            {/* Dev panel toggle */}
            <button onClick={() => setShowDevPanel(!showDevPanel)} className="w-full p-4 flex items-center gap-3 hover:bg-[#374151] transition-colors text-right">
              <div className="w-9 h-9 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center">
                <i className="fa-solid fa-flask text-[#F59E0B] text-sm" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">פאנל בדיקות מפורט</p>
                <p className="text-xs text-[#9CA3AF]">סימולציית יוזרים, התראות ונוטיפיקציות</p>
              </div>
              <i className={`fa-solid fa-chevron-${showDevPanel ? 'down' : 'left'} text-[#9CA3AF] text-xs transition-transform`} />
            </button>
          </div>
        </div>

        {/* Dev panel expanded */}
        {showDevPanel && (
          <div className="bg-[#111827] border border-[#F59E0B]/30 rounded-2xl p-4 space-y-5 animate-slide-up">
            <div className="flex items-center gap-2 mb-1">
              <i className="fa-solid fa-flask text-[#F59E0B] text-xs" />
              <h4 className="font-bold text-sm text-[#F59E0B]">Dev Testing Panel</h4>
            </div>

            {/* Follow-up timing */}
            <div>
              <label className="text-xs text-[#D1D5DB] mb-2 block">זמן עד נוטיפיקציית "האם אתה בסדר?" (שניות)</label>
              <div className="flex items-center gap-3">
                {[15, 30, 60, 120].map(s => (
                  <button
                    key={s}
                    onClick={() => setDemoFollowUpSec(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      demoFollowUpSec === s
                        ? 'bg-[#F59E0B] text-black'
                        : 'bg-[#1F2937] text-[#D1D5DB] border border-[#374151]'
                    }`}
                  >
                    {s}s
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  triggerDemo(profile?.city)
                  toast.show(`התראת דמו! נוטיפיקציית follow-up תגיע בעוד ${demoFollowUpSec} שניות`, 'info')
                  setTimeout(() => {
                    triggerDemo(profile?.city)
                  }, demoFollowUpSec * 1000)
                }}
                className="mt-3 w-full py-3 rounded-xl bg-[#EF4444] hover:bg-red-600 text-white font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-play" />
                הפעל סימולציה מלאה
              </button>
              <p className="text-[10px] text-[#9CA3AF] mt-1.5 text-center">
                יפעיל אזעקה + popup &quot;היכנס למרחב מוגן&quot; ואז &quot;האם אתה בסדר?&quot; אחרי {demoFollowUpSec} שניות
              </p>
            </div>

            {/* Simulated users preview */}
            <div>
              <p className="text-xs text-[#D1D5DB] mb-2">תצוגת יוזרים לדוגמה</p>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {DEMO_USERS.map((u, i) => (
                  <div key={i} className="flex items-center gap-3 bg-[#1F2937] rounded-xl p-2.5">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-[#374151] flex items-center justify-center text-[#D1D5DB] font-bold text-sm">
                        {u.name[0]}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 ${statusColors[u.status]} border-2 border-[#1F2937] rounded-full`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{u.name}</p>
                      <p className="text-[10px] text-[#9CA3AF]">{u.city}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColors[u.status]} text-black font-medium`}>
                      {statusLabels[u.status]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* About */}
        <div>
          <h3 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3 px-1">אודות</h3>
          <div className="bg-[#1F2937] border border-[#374151] rounded-2xl overflow-hidden divide-y divide-[#374151]">
            <div className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#374151] flex items-center justify-center">
                <i className="fa-solid fa-shield-heart text-[#D1D5DB] text-sm" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">גרסה</p>
                <p className="text-xs text-[#9CA3AF]">1.0.0</p>
              </div>
            </div>
            <div className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#374151] flex items-center justify-center">
                <i className="fa-solid fa-envelope text-[#D1D5DB] text-sm" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">יצירת קשר</p>
                <p className="text-xs text-[#9CA3AF]">support@safestatus.app</p>
              </div>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div>
          <h3 className="text-xs font-semibold text-[#EF4444]/80 uppercase tracking-wider mb-3 px-1">אזור מסוכן</h3>
          <div className="bg-[#1F2937] border border-[#374151] rounded-2xl overflow-hidden divide-y divide-[#374151]">
            <button onClick={signOut} className="w-full p-4 flex items-center gap-3 hover:bg-[#374151] transition-colors text-right">
              <div className="w-9 h-9 rounded-lg bg-[#EF4444]/10 flex items-center justify-center">
                <i className="fa-solid fa-right-from-bracket text-[#EF4444] text-sm" />
              </div>
              <p className="font-medium text-sm text-[#EF4444]">התנתקות</p>
            </button>
            <button onClick={() => setShowDeleteConfirm(true)} className="w-full p-4 flex items-center gap-3 hover:bg-[#374151] transition-colors text-right">
              <div className="w-9 h-9 rounded-lg bg-[#EF4444]/10 flex items-center justify-center">
                <i className="fa-solid fa-trash text-[#EF4444] text-sm" />
              </div>
              <p className="font-medium text-sm text-[#EF4444]">מחיקת חשבון</p>
            </button>
          </div>
        </div>
      </main>

      {/* City picker modal */}
      {showCityPicker && (
        <div className="absolute inset-0 z-[60] flex items-end bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowCityPicker(false)}>
          <div className="bg-[#1F2937] w-full rounded-t-[32px] border-t border-[#374151] shadow-2xl p-6 pb-8 max-h-[80%] flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-[#374151] rounded-full mx-auto mb-4" />
            <h2 className="text-lg font-bold mb-4">בחר עיר</h2>
            <div className="relative mb-4">
              <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <input
                type="text"
                value={citySearch}
                onChange={e => setCitySearch(e.target.value)}
                placeholder="חיפוש..."
                className="w-full h-12 bg-[#111827] border border-[#374151] rounded-xl pr-10 pl-4 text-white placeholder-[#6B7280] focus:outline-none focus:border-[#3B82F6] text-right"
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-1">
              {filteredCities.map(city => (
                <button
                  key={city}
                  onClick={() => changeCity(city)}
                  className={`w-full p-3 rounded-xl text-right text-sm font-medium transition-colors ${
                    profile?.city === city
                      ? 'bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/30'
                      : 'hover:bg-[#374151] text-white'
                  }`}
                >
                  <i className="fas fa-map-marker-alt text-xs mr-2 opacity-50" />
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-6" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-[#1F2937] rounded-2xl border border-[#374151] shadow-2xl p-6 w-full max-w-sm text-center animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full bg-[#EF4444]/10 flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-triangle-exclamation text-[#EF4444] text-2xl" />
            </div>
            <h3 className="text-lg font-bold mb-2">מחיקת חשבון</h3>
            <p className="text-sm text-[#D1D5DB] mb-6">פעולה זו תמחק את כל הנתונים שלך ואינה ניתנת לביטול.</p>
            <div className="space-y-3">
              <button onClick={deleteAccount} className="w-full py-3 bg-[#EF4444] hover:bg-red-600 text-white font-bold rounded-xl transition-colors">
                כן, מחק את החשבון
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-3 bg-[#374151] hover:bg-[#4B5563] text-[#F9FAFB] font-medium rounded-xl transition-colors">
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
