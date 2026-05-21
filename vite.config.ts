import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// lovable-tagger is optional (only used in lovable.dev environment)
let taggerPlugin: PluginOption | null = null;
try {
  // @ts-ignore — dynamic import fallback for environments without this dep
  const { componentTagger } = await import("lovable-tagger");
  taggerPlugin = componentTagger();
} catch {
  // not installed — skip silently
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
    mode === "development" && taggerPlugin,
  ].filter(Boolean) as PluginOption[],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
