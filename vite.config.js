import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Parts Pilot',
        short_name: 'Parts Pilot',
        description: 'Portal de pedidos de piezas de carrocería',
        theme_color: '#1c1917',
        background_color: '#1c1917',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-64x64.png',            sizes: '64x64',   type: 'image/png' },
          { src: 'pwa-192x192.png',           sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png',           sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        clientsClaim: true,
        // index.html NO va en el precache: si el SW sirve una copia vieja, esa página pide
        // JS/CSS de un deploy anterior que Vercel ya no tiene y la app queda en blanco.
        // Se pide siempre a la red (con copia de respaldo solo para cuando no hay conexión).
        globPatterns: ['**/*.{js,css,ico,png,svg,woff2}'],
        globIgnores: ['firebase-messaging-sw-init.js'],
        navigateFallback: null,
        importScripts: ['/firebase-messaging-sw-init.js'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: { cacheName: 'pp-pages', networkTimeoutSeconds: 5 },
          },
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'firebase-cache', networkTimeoutSeconds: 10 },
          },
        ],
      },
    }),
  ],
  build: {
    // El chunk de Firebase (~535 KB) es el SDK de Google y no se puede achicar más.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Firebase y React casi nunca cambian: en archivos propios el navegador
        // los conserva en caché entre actualizaciones de la app.
        manualChunks: {
          react: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage', 'firebase/functions'],
        },
      },
    },
  },
})
