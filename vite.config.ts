import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json';

export default defineConfig({
  // Relative base so the same build works on GitHub Pages sub-paths and Netlify.
  base: './',
  // Shown at the foot of Settings (tapping it five times opens test mode).
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  // Hashed build files go to dist/app/, so dist/assets/ holds only the optional art.
  build: { assetsDir: 'app' },
  plugins: [
    react(),
    VitePWA({
      // 'prompt': a new version waits until the player taps "Update",
      // so the game never reloads under their thumb mid-fight.
      registerType: 'prompt',
      includeAssets: ['icons/icon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Echoes of the Vault',
        short_name: 'Echoes',
        description: 'A dark science-fantasy roguelite deckbuilder with an idle layer.',
        theme_color: '#06060a',
        background_color: '#06060a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // The app shell (code, styles, fonts, icons) is cached up front for offline play.
        globPatterns: ['**/*.{js,css,html,woff2,svg,png}'],
        // Skip art (cached on demand) and non-Latin font subsets (the game is English-only).
        globIgnores: ['assets/**/*.webp', '**/*-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese,latin-ext}-*.woff2', '**/*.woff'],
        // Optional art is cached on first view instead, so the install stays small.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/assets/') && url.pathname.endsWith('.webp'),
            handler: 'CacheFirst',
            options: { cacheName: 'eotv-art', expiration: { maxEntries: 200 } },
          },
        ],
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
