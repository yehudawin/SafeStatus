import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

// Pages
import LoginPage from '@/pages/LoginPage'
import HomePage from '@/pages/HomePage'
import UpdateStatusPage from '@/pages/UpdateStatusPage'
import ContactSyncPage from '@/pages/ContactSyncPage'
import PrivacyPage from '@/pages/PrivacyPage'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-dark text-white font-heebo flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-400">טוען...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark text-white font-heebo">
      <Routes>
        {/* Public routes */}
        <Route path="/privacy" element={<PrivacyPage />} />
        
        {/* Protected routes */}
        {!user ? (
          <Route path="*" element={<LoginPage onLogin={() => {}} />} />
        ) : (
          <>
            <Route path="/" element={<HomePage />} />
            <Route path="/update-status" element={<UpdateStatusPage />} />
            <Route path="/contact-sync" element={<ContactSyncPage />} />
          </>
        )}
      </Routes>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
        
        {/* Toast notifications */}
        <Toaster 
          position="top-center"
          richColors
          dir="rtl"
        />
      </Router>
    </AuthProvider>
  )
}

export default App 