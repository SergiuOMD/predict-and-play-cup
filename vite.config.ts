// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

const PWA_THEME = "#1a2238";

const isLanDev =
  process.env.npm_lifecycle_event === "dev:lan"
  || process.env.npm_lifecycle_event === "preview:lan";

export default defineConfig({
  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.svg", "icon-192.png", "icon-512.png", "apple-touch-icon.png"],
        manifest: {
          name: "ORBICO MOLDOVA World Cup 2026",
          short_name: "WC2026",
          description: "Totalizator pronosticuri FIFA World Cup 2026",
          theme_color: PWA_THEME,
          background_color: PWA_THEME,
          display: "standalone",
          orientation: "portrait-primary",
          scope: "/",
          start_url: "/",
          lang: "ro",
          icons: [
            {
              src: "icon-192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "icon-512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webp,jpg}"],
          navigateFallback: null,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "supabase-api",
                expiration: { maxEntries: 32, maxAgeSeconds: 300 },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    server: {
      // localhost = doar pe PC; dev:lan = acces din telefon/laptop în aceeași rețea Wi‑Fi
      host: isLanDev ? "0.0.0.0" : "localhost",
      port: 5173,
      strictPort: true,
      hmr: isLanDev
        ? { port: 5173, protocol: "ws" }
        : { host: "localhost", port: 5173, protocol: "ws" },
    },
    preview: {
      host: isLanDev ? "0.0.0.0" : "localhost",
      port: 5173,
      strictPort: true,
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
