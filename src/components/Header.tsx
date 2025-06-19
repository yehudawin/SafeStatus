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
  onLogout
}: HeaderProps) {
  return (
    <header className="bg-dark-surface p-4 fixed top-0 w-full z-10 shadow-md">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          {showBack && (
            <button 
              onClick={onBack}
              className="p-2 ml-2 rounded-full hover:bg-gray-700"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
        
        <div className="flex space-x-2 space-x-reverse">
          {showRefresh && (
            <button 
              onClick={onRefresh}
              className="p-2 rounded-full hover:bg-gray-700"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}
          {showSettings && (
            <button 
              onClick={onSettings}
              className="p-2 rounded-full hover:bg-gray-700"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
          {showContacts && (
            <button 
              onClick={onContacts}
              className="p-2 rounded-full hover:bg-gray-700"
              title="נהל אנשי קשר"
            >
              <Users className="w-5 h-5" />
            </button>
          )}
          {showLogout && (
            <button 
              onClick={onLogout}
              className="p-2 rounded-full hover:bg-gray-700 text-red-400 hover:text-red-300"
              title="התנתק"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  )
} 