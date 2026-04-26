import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

// 빌드할 때마다 public/sw.js 의 CACHE_NAME 을 현재 타임스탬프로 자동 치환해
// 새 배포가 있을 때 항상 새로운 캐시 버전이 활성화되도록 한다.
function swVersionPlugin(): Plugin {
  const buildId = `jibda-pwa-${new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, "")
    .slice(0, 14)}`;
  return {
    name: "sw-version-injector",
    apply: "build",
    transform(code, id) {
      if (id.endsWith("/public/sw.js") || id.endsWith("\\public\\sw.js")) {
        return code.replace(/const CACHE_NAME = ".*?";/, `const CACHE_NAME = "${buildId}";`);
      }
      return null;
    },
    generateBundle() {
      // sw.js 는 public/ 라서 transform 을 안 탈 수 있음 → emit 으로 직접 갱신
      const fs = require("fs");
      const swPath = path.resolve(__dirname, "public/sw.js");
      try {
        const original = fs.readFileSync(swPath, "utf-8");
        const replaced = original.replace(
          /const CACHE_NAME = ".*?";/,
          `const CACHE_NAME = "${buildId}";`
        );
        this.emitFile({
          type: "asset",
          fileName: "sw.js",
          source: replaced,
        });
      } catch {
        // ignore - sw.js 가 없으면 스킵
      }
    },
  };
}

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
    mode !== "development" && swVersionPlugin(),
  ].filter(Boolean) as Plugin[],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
