import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import AppShell from '../components/AppShell'

interface StatusRequest {
  id: number
  from_user_id: string
  to_user_id: string
  created_at: string
  seen_at: string | null
  from_profile?: { display_name: string | null; phone: string }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'עכשיו'
  if (mins < 60) return `לפני ${mins} דק'`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `לפני ${hrs} שע'`
  return new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })
}

export default function NotificationsPage() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [requests, setRequests] = useState<StatusRequest[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRequests = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('status_requests')
      .select('*')
      .eq('to_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)

    if (data && data.length > 0) {
      const fromIds = [...new Set(data.map(r => r.from_user_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, phone')
        .in('id', fromIds)

      const profileMap = new Map(profiles?.map(p => [p.id, p]) ?? [])
      const enriched = data.map(r => ({
        ...r,
        from_profile: profileMap.get(r.from_user_id) ?? undefined,
      }))
      setRequests(enriched)
    } else {
      setRequests([])
    }
    setLoading(false)
  }, [user])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const markSeen = async (id: number) => {
    await supabase.from('status_requests')
      .update({ seen_at: new Date().toISOString() })
      .eq('id', id)
    setRequests(prev => prev.map(r => r.id === id ? { ...r, seen_at: new Date().toISOString() } : r))
  }

  const unseen = requests.filter(r => !r.seen_at).length

  return (
    <AppShell alertBadge={unseen > 0}>
      {/* Header */}
      <header className="bg-[#1F2937]/90 backdrop-blur-md sticky top-0 z-50 border-b border-[#374151] px-5 py-4 flex items-center gap-3 h-[72px]">
        <button onClick={() => nav('/home')} className="w-10 h-10 rounded-full bg-[#374151] hover:bg-gray-600 flex items-center justify-center text-[#F9FAFB] transition-colors">
          <i className="fa-solid fa-arrow-right text-sm" />
        </button>
        <h1 className="font-bold text-lg flex-1">התראות</h1>
        {unseen > 0 && (
          <span className="bg-[#EF4444] text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {unseen} חדשות
          </span>
        )}
      </header>

      <main className="flex-1 overflow-y-auto pb-24">

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="spinner" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 text-[#9CA3AF]">
            <div className="w-16 h-16 bg-[#1F2937] rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-bell-slash text-2xl opacity-50" />
            </div>
            <p className="text-lg font-medium mb-1">אין התראות</p>
            <p className="text-sm">כשמישהו ישלח לך &quot;מה שלומך?&quot; ההודעה תופיע כאן</p>
          </div>
        ) : (
          <div className="divide-y divide-[#374151]">
            {requests.map(r => {
              const name = r.from_profile?.display_name ?? r.from_profile?.phone ?? 'משתמש'
              const isNew = !r.seen_at
              return (
                <div
                  key={r.id}
                  onClick={() => { if (isNew) markSeen(r.id) }}
                  className={`p-4 flex items-start gap-3 transition-colors ${
                    isNew
                      ? 'bg-[#3B82F6]/5 hover:bg-[#3B82F6]/10 cursor-pointer'
                      : 'hover:bg-[#1F2937]'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    isNew ? 'bg-[#3B82F6]/20' : 'bg-[#374151]'
                  }`}>
                    <i className={`fa-solid fa-hand-holding-heart ${isNew ? 'text-[#3B82F6]' : 'text-[#9CA3AF]'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className={`text-sm ${isNew ? 'font-bold' : 'font-medium'}`}>
                        {name} <span className="font-normal text-[#D1D5DB]">שואל/ת מה שלומך</span>
                      </p>
                      {isNew && <span className="w-2.5 h-2.5 bg-[#3B82F6] rounded-full shrink-0 mt-1.5 mr-2" />}
                    </div>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">{timeAgo(r.created_at)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </AppShell>
  )
}
