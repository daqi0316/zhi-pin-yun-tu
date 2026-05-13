import devServer from "@hono/vite-dev-server"
import path from "path"
const __dirname = import.meta.dirname
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const devServerPlugin = devServer({ entry: "api/boot.ts", exclude: [/^\/(?!api\/).*$/] })
  const plugins: any[] = [devServerPlugin, react()]

  if (mode === "development") {
    const { inspectAttr } = await import("kimi-plugin-inspect-react")
    plugins.splice(1, 0, inspectAttr())
  }

  return {
  plugins,
  server: {
    port: 3001,
  },
  optimizeDeps: {
    exclude: ["bcryptjs", "mysql2", "jose"],
    include: ["cookie", "react-router", "set-cookie-parser"],
    entries: ["src/main.tsx"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@contracts": path.resolve(__dirname, "./contracts"),
      "@db": path.resolve(__dirname, "./db"),
      "db": path.resolve(__dirname, "./db"),
    },
  },
  envDir: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  };
});
