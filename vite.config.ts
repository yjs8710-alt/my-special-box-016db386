import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// Build ID used to version the SW + caches. Changes on every build.
const BUILD_ID = `${Date.now()}`;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    __APP_BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false, // we register manually with iframe/preview guard
      strategies: "generateSW",
      // Disable in dev to avoid breaking Lovable preview iframe
      devOptions: {
        enabled: false,
      },
      includeAssets: [
        "favicon-zibda-v2-20260427.png",
        "apple-touch-icon-zibda-active-v3-20260427.png",
        "icon-zibda-active-192-v3-20260427.png",
        "icon-zibda-active-512-v3-20260427.png",
        "robots.txt",
      ],
      manifest: {
        id: "/",
        name: "집다 - 청주 공실 플랫폼",
        short_name: "집다",
        description: "중개사 전용 청주 공실 정보 플랫폼",
        start_url: "/?v=20260427-v3",
        scope: "/",
        display: "standalone",
        background_color: "#0F2A5C",
        theme_color: "#0F2A5C",
        lang: "ko",
        orientation: "portrait",
        icons: [
          {
            src: "/icon-zibda-active-192-v3-20260427.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/icon-zibda-active-512-v3-20260427.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        // Versioned cache prefix — old caches purged on activation automatically
        cacheId: `jibda-${BUILD_ID}`,
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/~oauth/, /^\/api\//, /^\/admin\//],
        globPatterns: ["**/*.{js,css,html,png,jpg,jpeg,svg,webp,ico,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // Always go to network for index.html so deploys are picked up immediately
        runtimeCaching: [
          {
            urlPattern: ({ request, url }) =>
              request.mode === "navigate" || url.pathname === "/index.html",
            handler: "NetworkFirst",
            options: {
              cacheName: `jibda-html-${BUILD_ID}`,
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 16, maxAgeSeconds: 60 * 5 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Hashed JS/CSS — long-term immutable
            urlPattern: /\/assets\/.*\.(?:js|css)$/,
            handler: "CacheFirst",
            options: {
              cacheName: `jibda-assets-${BUILD_ID}`,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp|ico)$/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: `jibda-images-${BUILD_ID}`,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ].filter(Boolean) as Plugin[],
  build: {
    rollupOptions: {},
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
