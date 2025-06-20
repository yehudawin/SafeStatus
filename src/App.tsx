import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

// Pages
import LoginPage from '@/pages/LoginPage'
import HomePage from '@/pages/HomePage'
import UpdateStatusPage from '@/pages/UpdateStatusPage'
import ContactSyncPage from '@/pages/ContactSyncPage'
import PrivacyPage from '@/pages/PrivacyPage'
import NotFoundPage from '@/pages/NotFoundPage'

function AppContent() {
  const { user, loading } = useAuth()

  console.log('AppContent: user:', user, 'loading:', loading)

  if (loading) {
    console.log('AppContent: Still loading, showing spinner')
    return (
      <div className="min-h-screen bg-background text-text-primary font-sf flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">טוען...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    console.log('AppContent: No user, showing LoginPage')
  } else {
    console.log('AppContent: User exists, showing protected routes')
  }

  return (
    <div className="min-h-screen bg-background text-text-primary font-sf">
      <Routes>
        {/* Public routes */}
        <Route path="/privacy" element={<PrivacyPage />} />
        
        {/* Protected routes */}
        {!user ? (
          <Route path="*" element={<LoginPage />} />
        ) : (
          <>
            <Route path="/" element={<HomePage />} />
            <Route path="/update-status" element={<UpdateStatusPage />} />
            <Route path="/contact-sync" element={<ContactSyncPage />} />
            {/* Catch-all for logged-in users */}
            <Route path="*" element={<NotFoundPage />} />
          </>
        )}
      </Routes>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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