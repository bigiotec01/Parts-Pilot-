import { defineConfig, minimalPreset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  preset: {
    ...minimalPreset,
    maskable: {
      sizes: [512],
      padding: 0.15,
      resizeOptions: { background: 'black' },
    },
    apple: {
      sizes: [180],
      padding: 0.15,
      resizeOptions: { background: 'black' },
    },
  },
  images: ['brand-assets/logo-source.png'],
})
