import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(
    (registration) => {
      if (import.meta.env.DEV) {
        console.log('SW registered: ', registration);
      }
    },
    (registrationError) => {
      if (import.meta.env.DEV) {
        console.log('SW registration failed: ', registrationError);
      }
    }
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
) 