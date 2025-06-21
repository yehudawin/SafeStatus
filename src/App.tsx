import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import ErrorBoundary from '@/components/ErrorBoundary'
import TestAuthHelper from '@/components/TestAuthHelper'

// Pages
import LoginPage from '@/pages/LoginPage'
import HomePage from '@/pages/HomePage'
import UpdateStatusPage from '@/pages/UpdateStatusPage'
import ContactSyncPage from '@/pages/ContactSyncPage'
import PrivacyPage from '@/pages/PrivacyPage'
import NotFoundPage from '@/pages/NotFoundPage'

function AppContent() {
  const { user, loading } = useAuth()

  if (import.meta.env.DEV) {
    console.log('AppContent: user:', user, 'loading:', loading)
  }

  if (loading) {
    if (import.meta.env.DEV) {
      console.log('AppContent: Still loading, showing spinner')
    }
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">טוען...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    if (import.meta.env.DEV) {
      console.log('AppContent: No user, showing LoginPage')
    }
    return <LoginPage />
  } else {
    if (import.meta.env.DEV) {
      console.log('AppContent: User exists, showing protected routes')
    }
    return (
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/update-status" element={<UpdateStatusPage />} />
        <Route path="/contacts" element={<ContactSyncPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    )
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppContent />
          
          {/* Toast notifications */}
          <Toaster 
            position="top-center"
            richColors
            dir="rtl"
          />
          
          {/* Development auth helper */}
          <TestAuthHelper />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App 