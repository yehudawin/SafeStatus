import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useAlerts } from '../lib/alertContext'
import AppShell from '../components/AppShell'
import type { ActiveAlert } from '../lib/types'

const CITY_COORDS: Record<string, [number, number]> = {
  "תל אביב - יפו": [32.0853, 34.7818],
  "ירושלים": [31.7683, 35.2137],
  "חיפה": [32.7940, 34.9896],
  "ראשון לציון": [31.9730, 34.7925],
  "פתח תקווה": [32.0841, 34.8878],
  "אשדוד": [31.8018, 34.6435],
  "נתניה": [32.3215, 34.8532],
  "באר שבע": [31.2529, 34.7915],
  "חולון": [32.0111, 34.7746],
  "רמת גן": [32.0832, 34.8133],
  "אשקלון": [31.6688, 34.5743],
  "הרצליה": [32.1662, 34.8436],
  "כפר סבא": [32.1751, 34.9066],
  "חדרה": [32.4340, 34.9196],
  "לוד": [31.9514, 34.8882],
  "רעננה": [32.1849, 34.8706],
  "נצרת": [32.7019, 35.3027],
  "עכו": [32.9273, 35.0841],
  "כרמיאל": [32.9186, 35.3053],
  "טבריה": [32.7922, 35.5312],
  "שדרות": [31.5270, 34.5962],
  "אילת": [29.5577, 34.9519],
  "עפולה": [32.6100, 35.2900],
  "נהריה": [33.0060, 35.0945],
  "קריית שמונה": [33.2073, 35.5716],
  "דימונה": [31.0700, 35.0330],
  "ערד": [31.2610, 35.2126],
  "מצפה רמון": [30.6095, 34.8010],
}

type FilterMode = 'all' | 'my_area'

export default function AlertsMapPage() {
  const nav = useNavigate()
  const { profile } = useAuth()
  const { current, history: liveHistory } = useAlerts()
  const [dbAlerts, setDbAlerts] = useState<ActiveAlert[]>([])
  const [filter, setFilter] = useState<FilterMode>('all')

  const fetchDbAlerts = useCallback(async () => {
    const { data } = await supabase
      .from('active_alerts')
      .select('*')
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(50)
    if (data) setDbAlerts(data)
  }, [])

  useEffect(() => { fetchDbAlerts() }, [fetchDbAlerts])

  const allAlertCities = new Set<string>()
  liveHistory.forEach(a => (a.cities ?? a.data ?? []).forEach(c => allAlertCities.add(c)))
  dbAlerts.forEach(a => a.cities.forEach(c => allAlertCities.add(c)))

  const filteredCities = filter === 'my_area' && profile?.city
    ? [...allAlertCities].filter(c => c === profile.city)
    : [...allAlertCities]

  const allHistory = [
    ...liveHistory.map((a, i) => ({
      id: `live-${i}`,
      cities: a.cities ?? a.data ?? [],
      type: a.cat ?? a.type ?? 'צבע אדום',
      title: a.title ?? 'אזעקה',
      time: new Date(a.ts).toISOString(),
      live: true,
    })),
    ...dbAlerts.map(a => ({
      id: `db-${a.id}`,
      cities: a.cities,
      type: a.alert_type,
      title: a.alert_type,
      time: a.started_at,
      live: false,
    })),
  ]

  const filteredHistory = filter === 'my_area' && profile?.city
    ? allHistory.filter(a => a.cities.includes(profile.city!))
    : allHistory

  return (
    <AppShell alertBadge={!!current}>
      {/* Header */}
      <header className="bg-[#1F2937]/90 backdrop-blur-md sticky top-0 z-50 border-b border-[#374151] px-5 py-4 flex items-center gap-3 h-[72px]">
        <button onClick={() => nav('/home')} className="w-10 h-10 rounded-full bg-[#374151] hover:bg-gray-600 flex items-center justify-center text-[#F9FAFB] transition-colors">
          <i className="fa-solid fa-arrow-right text-sm" />
        </button>
        <h1 className="font-bold text-lg flex-1">מפת התראות</h1>
        {liveHistory.length > 0 && (
          <span className="bg-[#EF4444] text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
            {liveHistory.length} פעילות
          </span>
        )}
      </header>

      <main className="flex-1 overflow-y-auto pb-24 flex flex-col">

        {/* Map */}
        <div className="relative h-64 shrink-0 border-b border-[#374151]">
          <MapContainer
            center={[31.5, 34.8]}
            zoom={7}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
            attributionControl={false}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            {filteredCities.map(city => {
              const coords = CITY_COORDS[city]
              if (!coords) return null
              return (
                <CircleMarker
                  key={city}
                  center={coords}
                  radius={12}
                  pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.5, weight: 2 }}
                >
                  <Popup>
                    <div className="text-center font-bold text-sm" dir="rtl">{city}</div>
                  </Popup>
                </CircleMarker>
              )
            })}
          </MapContainer>

          {/* Legend */}
          <div className="absolute bottom-3 left-3 bg-[#1F2937]/90 backdrop-blur-md rounded-xl border border-[#374151] p-3 z-[1000] text-xs space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#EF4444] animate-pulse" />
              <span className="text-[#F9FAFB]">אזעקה פעילה</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#F59E0B]" />
              <span className="text-[#F9FAFB]">חשד / בדיקה</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#10B981]" />
              <span className="text-[#F9FAFB]">הכל תקין</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-5 pt-4 pb-2 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-[#3B82F6] text-white'
                : 'bg-[#1F2937] text-[#D1D5DB] border border-[#374151] hover:bg-[#374151]'
            }`}
          >
            <i className="fas fa-globe mr-1" /> הכל
          </button>
          <button
            onClick={() => setFilter('my_area')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === 'my_area'
                ? 'bg-[#3B82F6] text-white'
                : 'bg-[#1F2937] text-[#D1D5DB] border border-[#374151] hover:bg-[#374151]'
            }`}
          >
            <i className="fas fa-map-marker-alt mr-1" /> באזור שלי
          </button>
        </div>

        {/* Alert history */}
        <section className="px-5 flex-1">
          <h3 className="font-bold text-base mb-3">היסטוריית התראות</h3>
          {filteredHistory.length === 0 ? (
            <div className="text-center py-16 text-[#9CA3AF]">
              <div className="w-16 h-16 bg-[#1F2937] rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-shield-halved text-2xl opacity-50" />
              </div>
              <p className="text-lg font-medium mb-1">אין התראות</p>
              <p className="text-sm">
                {filter === 'my_area' ? 'אין התראות באזור שלך כרגע' : 'המערכת שקטה כרגע'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {filteredHistory.map((a, i) => (
                <div key={a.id + i} className="bg-[#1F2937] border border-[#374151] rounded-xl p-3 flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    a.live ? 'bg-[#EF4444]/20' : 'bg-[#374151]'
                  }`}>
                    <i className={`fa-solid ${a.live ? 'fa-triangle-exclamation text-[#EF4444]' : 'fa-clock-rotate-left text-[#9CA3AF]'} text-sm`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-sm">{a.title}</span>
                      {a.live && (
                        <span className="text-[10px] bg-[#EF4444]/20 text-[#EF4444] px-1.5 py-0.5 rounded-full font-bold animate-pulse shrink-0 mr-2">
                          LIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#D1D5DB] mt-0.5 truncate">
                      {a.cities.length > 0 ? a.cities.slice(0, 3).join(', ') : 'כל הארץ'}
                      {a.cities.length > 3 && ` +${a.cities.length - 3}`}
                    </p>
                    <p className="text-[10px] text-[#9CA3AF] mt-1">
                      {new Date(a.time).toLocaleString('he-IL', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </AppShell>
  )
}
