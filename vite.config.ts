import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const supabaseUrl = (env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '')
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY ?? ''

  return {
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'RadiusOne',
        short_name: 'RadiusOne',
        description: 'RadiusOne - RADIUS Administration & Billing',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone'
      },
      workbox: { globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'] }
    })
  ],
  server: {
    proxy: supabaseUrl
      ? {
          '/api/mikrotik-test': {
            target: supabaseUrl,
            changeOrigin: true,
            rewrite: (path) => '/functions/v1/mikrotik-test',
            configure: (proxy) => {
              proxy.on('proxyReq', (proxyReq) => {
                if (supabaseKey) proxyReq.setHeader('Authorization', `Bearer ${supabaseKey}`)
                proxyReq.setHeader('Content-Type', 'application/json')
              })
            },
          },
          '/api/mikrotik-check-all': {
            target: supabaseUrl,
            changeOrigin: true,
            rewrite: () => '/functions/v1/mikrotik-check-all',
            configure: (proxy) => {
              proxy.on('proxyReq', (proxyReq) => {
                if (supabaseKey) proxyReq.setHeader('Authorization', `Bearer ${supabaseKey}`)
                proxyReq.setHeader('Content-Type', 'application/json')
              })
            },
          },
          '/api/mikrotik-disconnect': {
            target: supabaseUrl,
            changeOrigin: true,
            rewrite: () => '/functions/v1/mikrotik-disconnect',
            configure: (proxy) => {
              proxy.on('proxyReq', (proxyReq) => {
                if (supabaseKey) proxyReq.setHeader('Authorization', `Bearer ${supabaseKey}`)
                proxyReq.setHeader('Content-Type', 'application/json')
              })
            },
          },
        }
      : undefined,
  },
  }
})
