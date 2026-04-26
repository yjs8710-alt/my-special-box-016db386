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
    rollupOptions: {
      output: {
        entryFileNames: "assets/app-v2-20260427-[hash].js",
        chunkFileNames: "assets/[name]-v2-20260427-[hash].js",
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name ?? "asset";
          if (name.endsWith(".css")) return "assets/main-v2-20260427-[hash][extname]";
          return "assets/[name]-v2-20260427-[hash][extname]";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
