import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { writeFileSync } from "node:fs";

// Build version used to detect fresh deployments. Changes on every build.
const BUILD_VERSION = "MOBILE_INAPP_FIX_20260427_01";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    __APP_BUILD_ID__: JSON.stringify(BUILD_VERSION),
    __APP_BUILD_VERSION__: JSON.stringify(BUILD_VERSION),
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
      devOptions: {
        enabled: false,
      },
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ["**/*.{js,css,ico,svg,webp,woff,woff2}"],
        globIgnores: ["**/index.html"],
        navigateFallback: null,
      },
    }),
    {
      name: "jibda-build-id",
      buildStart() {
        writeFileSync(
          path.resolve(__dirname, "public/version.json"),
          `${JSON.stringify({ build: BUILD_VERSION }, null, 2)}\n`
        );
      },
      transformIndexHtml(html: string) {
        return html.replace(
          '<link rel="manifest" href="/manifest.webmanifest" />',
          `<link rel="manifest" href="/manifest.webmanifest?v=${BUILD_VERSION}" />`
        ).replace(
          "</head>",
          `<meta name="app-build-version" content="${BUILD_VERSION}" /></head>`
        );
      },
      generateBundle(this: { emitFile: (file: { type: "asset"; fileName: string; source: string }) => void }) {
        this.emitFile({
          type: "asset",
          fileName: "version.json",
          source: JSON.stringify({ build: BUILD_VERSION }, null, 2),
        });
      },
    },
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
