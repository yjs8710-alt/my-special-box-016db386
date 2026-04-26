import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
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
  ].filter(Boolean) as Plugin[],
  build: {
    // Vite 기본 content-hash 사용:
    //   assets/[name]-[hash].js / [name]-[hash].css / [name]-[hash][extname]
    // → 파일 내용이 바뀌면 파일명이 자동 변경되어 브라우저/CDN 캐시가 자연 무효화됨.
    rollupOptions: {},
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
