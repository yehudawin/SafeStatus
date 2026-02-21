import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useAlerts } from '../lib/alertContext'
import { haptic } from '../lib/haptic'
import { useToast } from '../components/Toast'
import AppShell from '../components/AppShell'
import type { UserStatus, MutualContact } from '../lib/types'

const STATUS_META: Record<UserStatus, { label: string; group: string; color: string; bg: string; iconClass: string }> = {
  in_shelter: { label: 'במרחב מוגן', group: 'במרחב מוגן', color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]', iconClass: 'fa-solid fa-shield-halved' },
  safe:       { label: 'בטוח', group: 'בטוחים', color: 'text-[#10B981]', bg: 'bg-[#10B981]', iconClass: 'fa-solid fa-check' },
  unknown:    { label: 'לא ידוע', group: 'לא ידוע', color: 'text-[#D1D5DB]', bg: 'bg-[#D1D5DB]', iconClass: 'fa-solid fa-question' },
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'לא זמין'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'עכשיו'
  if (mins < 60) return `לפני ${mins} דק'`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `לפני ${hrs} שע'`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'אתמול'
  if (days < 7) return `לפני ${days} ימים`
  return new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })
}

export default function HomePage() {
  const nav = useNavigate()
  const { user, profile, refreshProfile } = useAuth()
  const { current: alert } = useAlerts()
  const toast = useToast()
  const [contacts, setContacts] = useState<MutualContact[]>([])
  const [contactsLoading, setContactsLoading] = useState(true)
  const [selectedContact, setSelectedContact] = useState<MutualContact | null>(null)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [sendingRequest, setSendingRequest] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const fetchContacts = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await supabase.rpc('get_mutual_contacts', { requesting_user_id: user.id })
      if (data) setContacts(data as MutualContact[])
    } catch { /* network error — keep stale data */ }
    setContactsLoading(false)
  }, [user])

  useEffect(() => { fetchContacts() }, [fetchContacts])

  useEffect(() => {
    if (!user) return
    const ch = supabase
      .channel('contact-status-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, () => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(fetchContacts, 2000)
      })
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [user, fetchContacts])

  const updateStatus = async (s: UserStatus) => {
    if (!user || statusUpdating) return
    setStatusUpdating(true)
    haptic(50)
    try {
      await supabase.from('profiles')
        .update({ status: s, status_updated_at: new Date().toISOString() })
        .eq('id', user.id)
      await refreshProfile()
    } catch {
      toast.show('שגיאה בעדכון סטטוס', 'error')
    }
    setStatusUpdating(false)
  }

  const sendStatusRequest = async (toUserId: string) => {
    if (!user || sendingRequest) return
    setSendingRequest(true)
    try {
      const { error } = await supabase.from('status_requests').insert({ from_user_id: user.id, to_user_id: toUserId })
      if (error) throw error
      toast.show('בקשת "מה שלומך?" נשלחה בהצלחה', 'success')
    } catch {
      toast.show('שגיאה בשליחת הבקשה', 'error')
    }
    setSendingRequest(false)
  }

  const grouped = {
    in_shelter: contacts.filter(c => c.friend_status === 'in_shelter'),
    safe: contacts.filter(c => c.friend_status === 'safe'),
    unknown: contacts.filter(c => c.friend_status === 'unknown'),
  }

  const alertCities = alert?.cities ?? alert?.data ?? []
  const alertTitle = alert?.title ?? 'אזעקת צבע אדום פעילה'
  const alertDesc = alert?.desc ?? (alertCities.length > 0 ? `אזעקות נשמעות ב: ${alertCities.join(', ')}` : '')

  return (
    <AppShell alertBadge={!!alert}>
      <header className="bg-[#1F2937]/90 backdrop-blur-md sticky top-0 z-50 border-b border-[#374151] px-5 py-4 flex justify-between items-center h-[72px]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#3B82F6]/20 rounded-full flex items-center justify-center text-[#3B82F6] border border-[#3B82F6]/30">
            <i className="fa-solid fa-shield-heart text-lg" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">SafeStatus</h1>
            <p className="text-xs text-[#D1D5DB] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#10B981] block" />
              מחובר
            </p>
          </div>
        </div>
        <button onClick={() => nav('/notifications')} aria-label="התראות" className="w-10 h-10 rounded-full bg-[#374151] hover:bg-gray-600 flex items-center justify-center text-[#F9FAFB] transition-colors relative">
          <i className="fa-solid fa-bell" />
          {alert && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#EF4444] rounded-full border-2 border-[#1F2937]" />}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 relative">
        {alert && (
          <div className="bg-[#EF4444]/10 border-b border-[#EF4444]/30 p-4 animate-pulse mb-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#EF4444]/20 flex items-center justify-center text-[#EF4444] shrink-0 pulse-ring">
                <i className="fa-solid fa-triangle-exclamation" />
              </div>
              <div>
                <h3 className="font-bold text-[#EF4444] text-sm mb-1">{alertTitle}</h3>
                {alertDesc && <p className="text-xs text-[#F9FAFB] opacity-90 mb-2">{alertDesc}</p>}
                <div className="flex items-center gap-2 text-xs font-medium text-[#EF4444]">
                  <i className="fa-solid fa-person-shelter" />
                  <span>היכנסו למרחב המוגן מיד!</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <section className="px-5 py-6">
          <h2 className="text-xl font-bold mb-4 text-center">מה המצב שלך כרגע?</h2>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => updateStatus('safe')} disabled={statusUpdating}
              className={`group relative flex flex-col items-center justify-center p-6 bg-[#1F2937] border rounded-2xl transition-all duration-300 h-40 ${
                profile?.status === 'safe' ? 'border-[#10B981] shadow-[0_0_20px_rgba(16,185,129,0.3)] bg-[#10B981]/10'
                : 'border-[#374151] hover:bg-[#374151] hover:border-[#10B981]/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]'}`}>
              <div className="w-14 h-14 rounded-full bg-[#10B981]/10 flex items-center justify-center text-[#10B981] text-2xl mb-3 group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-check" />
              </div>
              <span className="font-bold text-lg">אני בסדר</span>
              <span className="text-xs text-[#D1D5DB] mt-1">לחץ לעדכון</span>
            </button>
            <button onClick={() => updateStatus('in_shelter')} disabled={statusUpdating}
              className={`group relative flex flex-col items-center justify-center p-6 bg-[#1F2937] border rounded-2xl transition-all duration-300 h-40 ${
                profile?.status === 'in_shelter' ? 'border-[#F59E0B] shadow-[0_0_20px_rgba(245,158,11,0.3)] bg-[#F59E0B]/10'
                : 'border-[#374151] hover:bg-[#374151] hover:border-[#F59E0B]/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]'}`}>
              <div className="w-14 h-14 rounded-full bg-[#F59E0B]/10 flex items-center justify-center text-[#F59E0B] text-2xl mb-3 group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-shield-halved" />
              </div>
              <span className="font-bold text-lg">במרחב מוגן</span>
              <span className="text-xs text-[#D1D5DB] mt-1">לחץ לעדכון</span>
            </button>
          </div>
          {profile?.status_updated_at && (
            <div className="mt-4 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1F2937] border border-[#374151] text-xs text-[#D1D5DB]">
                <i className="fa-regular fa-clock text-[10px]" />
                עודכן לאחרונה: {timeAgo(profile.status_updated_at)}
              </span>
            </div>
          )}
        </section>

        <section className="px-5 mt-2">
          <div className="flex justify-between items-end mb-4">
            <h3 className="font-bold text-lg">אנשי קשר</h3>
            <button onClick={fetchContacts} aria-label="רענן אנשי קשר" className="text-xs bg-[#1F2937] border border-[#374151] px-2 py-1 rounded-lg text-[#D1D5DB] hover:text-[#F9FAFB] transition-colors">
              <i className="fa-solid fa-arrows-rotate mr-1" /> רענן
            </button>
          </div>
          {contactsLoading ? (
            <div className="flex items-center justify-center py-12"><div className="spinner" /></div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-12 text-[#D1D5DB]">
              <div className="w-16 h-16 bg-[#1F2937] rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-user-plus text-2xl text-[#9CA3AF] opacity-50" />
              </div>
              <p className="text-lg mb-2 font-medium">אין עדיין אנשי קשר הדדיים</p>
              <p className="text-sm text-[#9CA3AF]">הזמן חברים להתקין את SafeStatus</p>
            </div>
          ) : (
            <div className="space-y-6 pb-6">
              {(['in_shelter', 'safe', 'unknown'] as UserStatus[]).map(status => {
                const list = grouped[status]
                if (list.length === 0) return null
                const meta = STATUS_META[status]
                return (
                  <div key={status} className="space-y-3">
                    <h4 className={`text-xs font-semibold ${meta.color} uppercase tracking-wider flex items-center gap-2`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.bg}`} />
                      {meta.group} ({list.length})
                    </h4>
                    {list.map(c => (
                      <div key={c.friend_id} onClick={() => setSelectedContact(c)}
                        className={`bg-[#1F2937] border border-[#374151] rounded-xl p-3 flex items-center gap-3 hover:bg-[#374151] cursor-pointer transition-colors ${status === 'unknown' ? 'opacity-70' : ''}`}>
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-[#374151] border-2 border-[#1F2937] flex items-center justify-center text-[#D1D5DB] font-bold text-lg">
                            {(c.friend_name ?? c.friend_phone)?.[0] ?? '?'}
                          </div>
                          <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 ${meta.bg} border-2 border-[#1F2937] rounded-full`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h5 className="font-semibold text-sm truncate">{c.friend_name ?? c.friend_phone}</h5>
                            <span className="text-[10px] text-[#D1D5DB] bg-[#374151] px-1.5 py-0.5 rounded shrink-0 mr-2">{timeAgo(c.friend_status_updated_at)}</span>
                          </div>
                          <p className="text-xs text-[#D1D5DB] truncate">{c.friend_city ?? 'לא צוין'}{c.friend_battery_level != null ? ` • סוללה ${c.friend_battery_level}%` : ''}</p>
                        </div>
                        <div className={`${meta.color} text-lg px-1`}><i className={meta.iconClass} /></div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>

      {selectedContact && (
        <div className="absolute inset-0 z-[60] flex items-end bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedContact(null)}>
          <div className="bg-[#1F2937] w-full rounded-t-[32px] border-t border-[#374151] shadow-2xl p-6 pb-12 relative max-h-[90%] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-[#374151] rounded-full mx-auto mb-6" />
            <button onClick={() => setSelectedContact(null)} aria-label="סגור" className="absolute top-6 left-6 text-[#D1D5DB] hover:text-[#F9FAFB] p-2"><i className="fa-solid fa-xmark text-xl" /></button>
            <div className="flex flex-col items-center mb-8">
              <div className="relative mb-4">
                <div className="w-24 h-24 rounded-full bg-[#374151] border-4 border-[#1F2937] shadow-lg flex items-center justify-center text-3xl font-bold text-[#D1D5DB]">
                  {(selectedContact.friend_name ?? selectedContact.friend_phone)?.[0] ?? '?'}
                </div>
                <span className={`absolute bottom-1 right-1 w-6 h-6 ${STATUS_META[selectedContact.friend_status].bg} border-4 border-[#1F2937] rounded-full shadow-md`} />
              </div>
              <h2 className="text-2xl font-bold mb-1">{selectedContact.friend_name ?? selectedContact.friend_phone}</h2>
              <div className={`flex items-center gap-2 ${STATUS_META[selectedContact.friend_status].color} px-3 py-1 rounded-full border border-current/20`}>
                <i className={STATUS_META[selectedContact.friend_status].iconClass + ' text-sm'} />
                <span className="text-sm font-medium">{STATUS_META[selectedContact.friend_status].label}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { icon: 'fa-solid fa-location-dot', color: 'text-[#D1D5DB]', label: 'מיקום אחרון', value: selectedContact.friend_city ?? 'לא צוין' },
                { icon: 'fa-regular fa-clock', color: 'text-[#D1D5DB]', label: 'עודכן', value: timeAgo(selectedContact.friend_status_updated_at) },
                { icon: 'fa-solid fa-battery-half', color: selectedContact.friend_battery_level != null && selectedContact.friend_battery_level < 20 ? 'text-[#F59E0B]' : 'text-[#D1D5DB]', label: 'סוללה', value: selectedContact.friend_battery_level != null ? `${selectedContact.friend_battery_level}%` : 'לא זמין' },
                { icon: 'fa-solid fa-wifi', color: 'text-[#3B82F6]', label: 'חיבור', value: selectedContact.friend_network_type ?? 'לא זמין' },
              ].map((item, i) => (
                <div key={i} className="bg-[#111827] rounded-2xl p-4 border border-[#374151] flex flex-col items-center text-center">
                  <i className={`${item.icon} ${item.color} mb-2`} />
                  <span className="text-xs text-[#D1D5DB] mb-1">{item.label}</span>
                  <span className="font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
            <button disabled={sendingRequest} onClick={() => { sendStatusRequest(selectedContact.friend_id); setSelectedContact(null) }}
              className="w-full bg-[#3B82F6] hover:bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50">
              <i className="fa-solid fa-bell-concierge" />
              <span>שלח בקשת &quot;מה שלומך?&quot;</span>
            </button>
          </div>
        </div>
      )}
    </AppShell>
  )
}
