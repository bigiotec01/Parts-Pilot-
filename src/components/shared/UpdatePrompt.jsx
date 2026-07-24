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
    // Pedimos el registro fresco en vez de confiar en la referencia interna de
    // workbox-window: tras varios ciclos de instalación puede quedar desactualizada
    // y su mensaje SKIP_WAITING no llega a ningún lado.
    const reg = await navigator.serviceWorker.getRegistration()
    const waitingSW = reg?.waiting
    console.log('[PWA] Click en Actualizar. waiting worker:', waitingSW)

    let reloaded = false
    const reloadOnce = (origen) => {
      if (reloaded) return
      reloaded = true
      console.log('[PWA] Recargando página, origen:', origen)
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] controllerchange disparado, nuevo controller:', navigator.serviceWorker.controller?.scriptURL)
      reloadOnce('controllerchange')
    }, { once: true })

    if (waitingSW) {
      waitingSW.postMessage({ type: 'SKIP_WAITING' })
    } else {
      console.warn('[PWA] No había ningún worker en espera al hacer clic.')
    }
    // Respaldo: si el mensaje SKIP_WAITING no provoca el cambio de controller,
    // forzamos la recarga igual. El ciclo skipWaiting → activating → activated →
    // clientsClaim puede tardar varios segundos en completarse, así que le damos
    // margen generoso antes de forzar nada.
    setTimeout(() => reloadOnce('respaldo 15s (controllerchange nunca llegó)'), 15000)
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
