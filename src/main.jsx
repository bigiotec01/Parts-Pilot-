import React from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App'

const CHECK_INTERVAL_MS = 60 * 60 * 1000 // 1 hora

registerSW({
  immediate: true,
  onRegisteredSW(swUrl, registration) {
    if (!registration) return
    setInterval(async () => {
      if (registration.installing || !navigator.onLine) return
      const resp = await fetch(swUrl, { cache: 'no-store', headers: { cache: 'no-store' } })
      if (resp?.status === 200) await registration.update()
    }, CHECK_INTERVAL_MS)
  },
})

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
