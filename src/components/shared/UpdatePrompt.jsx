import { useRef } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

const CHECK_INTERVAL_MS = 10 * 1000 // TEST: 10 segundos (cambiar a 60 * 60 * 1000 en producción)

export function UpdatePrompt() {
  const intervalRef = useRef(null)

  const {
    needRefresh: [needRefresh],
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      console.log('[PWA] Service worker registrado:', swUrl, registration)
      if (!registration) return
      intervalRef.current = setInterval(async () => {
        // Una vez que ya hay una actualización esperando, dejamos de chequear:
        // seguir llamando a update() mientras el usuario decide puede pisar
        // la referencia al worker en espera que necesita el botón "Actualizar".
        if (registration.waiting) {
          clearInterval(intervalRef.current)
          return
        }
        if (registration.installing || !navigator.onLine) return
        const resp = await fetch(swUrl, { cache: 'no-store', headers: { cache: 'no-store' } })
        if (resp?.status === 200) await registration.update()
      }, CHECK_INTERVAL_MS)
    },
    onNeedRefresh() {
      console.log('[PWA] Actualización detectada (needRefresh = true)')
    },
    onRegisterError(error) {
      console.error('[PWA] Error registrando el service worker:', error)
    },
  })

  if (!needRefresh) return null

  const handleUpdate = async () => {
    // El mensaje SKIP_WAITING (la forma "elegante" de activar el worker en espera
    // sin recargar del todo) resultó poco fiable en pruebas reales: el mensaje
    // llegaba y self.skipWaiting() se ejecutaba sin error, pero el evento
    // 'activate' nunca disparaba. En vez de perseguir eso, desregistramos el
    // service worker viejo y forzamos una recarga completa — más simple y
    // confiable, aunque pierda la elegancia de una transición en caliente.
    console.log('[PWA] Click en Actualizar: desregistrando el service worker y recargando.')
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      await reg?.unregister()
    } catch (err) {
      console.error('[PWA] Error al desregistrar el service worker:', err)
    }
    window.location.reload()
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 bg-stone-900 border border-orange-500/40 text-white px-4 py-3 rounded-xl shadow-xl max-w-sm w-[calc(100%-2rem)]">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-orange-400">Nueva actualización</p>
        <p className="text-xs text-stone-400 mt-0.5">Hay una versión nueva disponible.</p>
      </div>
      <button
        onClick={handleUpdate}
        className="shrink-0 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
      >
        Actualizar
      </button>
    </div>
  )
}
