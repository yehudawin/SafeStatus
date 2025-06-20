import { ArrowRight, RotateCcw, Settings, LogOut, Users } from 'lucide-react'

interface HeaderProps {
  title: string
  showBack?: boolean
  showRefresh?: boolean
  showSettings?: boolean
  showContacts?: boolean
  showLogout?: boolean
  onBack?: () => void
  onRefresh?: () => void
  onSettings?: () => void
  onContacts?: () => void
  onLogout?: () => void
  isRefreshing?: boolean
}

export default function Header({
  title,
  showBack = false,
  showRefresh = false,
  showSettings = false,
  showContacts = false,
  showLogout = false,
  onBack,
  onRefresh,
  onSettings,
  onContacts,
  onLogout,
  isRefreshing = false
}: HeaderProps) {
  return (
    <header className="bg-primary p-4 fixed top-0 w-full z-10 shadow-medium header-height flex items-center">
      <div className="flex justify-between items-center w-full">
        {/* Right side - Title and Back button */}
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-white">{title}</h1>
        </div>
        
        {/* Left side - Action buttons (RTL layout) */}
        <div className="flex space-x-2 space-x-reverse">
          {showBack && (
            <button 
              onClick={onBack}
              className="p-2 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
              aria-label="חזור"
            >
              <ArrowRight className="w-5 h-5 text-white" />
            </button>
          )}
          {showRefresh && (
            <button 
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-full hover:bg-black hover:bg-opacity-10 disabled:opacity-50 transition-colors"
              aria-label="רענן"
            >
              <RotateCcw className={`w-5 h-5 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
          {showSettings && (
            <button 
              onClick={onSettings}
              className="p-2 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
              aria-label="הגדרות"
            >
              <Settings className="w-5 h-5 text-white" />
            </button>
          )}
          {showContacts && (
            <button 
              onClick={onContacts}
              className="p-2 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
              title="נהל אנשי קשר"
              aria-label="נהל אנשי קשר"
            >
              <Users className="w-5 h-5 text-white" />
            </button>
          )}
          {showLogout && (
            <button 
              onClick={() => {
                if (window.confirm('האם אתה בטוח שברצונך להתנתק?')) {
                  onLogout?.()
                }
              }}
              className="p-2 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
              title="התנתק"
              aria-label="התנתק"
            >
              <LogOut className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>
    </header>
  )
} 