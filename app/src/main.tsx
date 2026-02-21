import '@fortawesome/fontawesome-free/css/all.min.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'
import { App as CapApp } from '@capacitor/app'
import { AuthProvider } from './lib/auth'
import { AlertProvider } from './lib/alertContext'
import { NotificationProvider } from './lib/notifications'
import { ToastProvider } from './components/Toast'
import AlertPrompt from './components/AlertPrompt'
import App from './App'
import './index.css'

StatusBar.setStyle({ style: Style.Dark }).catch(() => {})
StatusBar.setBackgroundColor({ color: '#111827' }).catch(() => {})
SplashScreen.hide().catch(() => {})

CapApp.addListener('backButton', ({ canGoBack }) => {
  if (canGoBack) window.history.back()
  else CapApp.exitApp()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AlertProvider>
          <NotificationProvider>
            <ToastProvider>
              <App />
              <AlertPrompt />
            </ToastProvider>
          </NotificationProvider>
        </AlertProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
