import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

function apkMimePlugin(): Plugin {
  const applyHeaders = (
    req: { url?: string },
    res: { setHeader: (name: string, value: string) => void },
    next: () => void,
  ) => {
    const pathname = (req.url || '').split('?')[0];
    if (pathname.endsWith('.apk')) {
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.setHeader('Content-Disposition', 'attachment; filename="Vaultbound.apk"');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    next();
  };

  return {
    name: 'vaultbound-apk-mime',
    configureServer(server) {
      server.middlewares.use(applyHeaders);
    },
    configurePreviewServer(server) {
      server.middlewares.use(applyHeaders);
    },
  };
}

export default defineConfig(({ command }) => {
  const isBuild = command === 'build';

  return {
    base: './',
    plugins: [
      apkMimePlugin(),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        useCredentials: true,
        includeAssets: [
          'icon-v2.svg',
          'apple-touch-icon-v2.png',
          'pwa-icon-v2-192.png',
          'pwa-icon-v2-512.png',
          'pwa-icon-v2-maskable-512.png',
        ],
        manifest: {
          id: './',
          name: 'Vaultbound',
          short_name: 'Vaultbound',
          description:
            'Stylized first-person 3D puzzle-shooter where you unlock sealed doors, outsmart sentinels, and claim the sacred treasure.',
          theme_color: '#000815',
          background_color: '#000815',
          display: 'standalone',
          orientation: 'landscape',
          start_url: './',
          scope: './',
          icons: [
            {
              src: './pwa-icon-v2-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: './pwa-icon-v2-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: './pwa-icon-v2-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          cleanupOutdatedCaches: true,
          navigateFallback: null,
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          globPatterns: isBuild ? ['**/*.{js,css,html,ico,png,jpg,svg,woff,woff2}'] : [],
          globIgnores: ['**/vaultbound.apk', '**/assets/aistudio/**'],
          runtimeCaching: [
            ...(isBuild
              ? [
                  {
                    urlPattern: ({ request }: { request: Request }) =>
                      request.mode === 'navigate',
                    handler: 'NetworkFirst' as const,
                    options: {
                      cacheName: 'pages-cache',
                      networkTimeoutSeconds: 4,
                      cacheableResponse: {
                        statuses: [200],
                      },
                    },
                  },
                ]
              : []),
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'classic',
          navigateFallback: undefined,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      allowedHosts: true as const,
    },
  };
});
