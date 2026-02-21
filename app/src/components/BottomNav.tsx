import { useLocation, useNavigate } from 'react-router-dom'

const TABS = [
  { path: '/home', label: 'ראשי', icon: 'fa-solid fa-house' },
  { path: '/map', label: 'מפה', icon: 'fa-solid fa-map-location-dot' },
  { path: '/notifications', label: 'התראות', icon: 'fa-solid fa-bell' },
  { path: '/settings', label: 'הגדרות', icon: 'fa-solid fa-gear' },
] as const

interface Props {
  alertBadge?: boolean
}

export default function BottomNav({ alertBadge }: Props) {
  const location = useLocation()
  const nav = useNavigate()

  return (
    <nav className="bg-[#1F2937]/90 backdrop-blur-md border-t border-[#374151] absolute bottom-0 w-full z-40 pb-5 pt-2 px-6">
      <div className="flex justify-between items-center">
        {TABS.map(tab => {
          const active = location.pathname === tab.path
          return (
            <button
              key={tab.path}
              onClick={() => nav(tab.path)}
              className={`flex flex-col items-center gap-1 p-2 transition-colors relative ${
                active ? 'text-[#3B82F6]' : 'text-[#D1D5DB] hover:text-[#F9FAFB]'
              }`}
            >
              <i className={`${tab.icon} text-xl`} />
              {tab.path === '/notifications' && alertBadge && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#EF4444] rounded-full border-2 border-[#1F2937]" />
              )}
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
