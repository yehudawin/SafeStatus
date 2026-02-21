import '@fortawesome/fontawesome-free/css/all.min.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import { AlertProvider } from './lib/alertContext'
import { NotificationProvider } from './lib/notifications'
import { ToastProvider } from './components/Toast'
import AlertPrompt from './components/AlertPrompt'
import App from './App'
import './index.css'

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
