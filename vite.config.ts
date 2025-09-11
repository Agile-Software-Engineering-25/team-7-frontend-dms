import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import vitePluginSingleSpa from "vite-plugin-single-spa";
import vitePluginReactHMR from "vite-plugin-react-single-spa-hmr";

const PORT = parseInt(process.env.PORT ?? "5173");

const ENTRY_POINT = "src/singleSpa.tsx";

const NPM_EXTERNALS: string[] = [];

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === "serve" ? "/" : "/api/ASE-7/",
  plugins: [
    react(),
    command === "serve" && vitePluginReactHMR(ENTRY_POINT),
    vitePluginSingleSpa({
      type: "mife",
      serverPort: PORT,
      spaEntryPoints: ENTRY_POINT,
    }),
  ],
resolve: {
    alias: {
        "@": path.resolve(__dirname, "./src"),
        "@components": path.resolve(__dirname, "./src/components"),
        "@pages": path.resolve(__dirname, "./src/pages"),
        "@utils": path.resolve(__dirname, "./src/utils"),
        "@custom-types": path.resolve(__dirname, "./src/@custom-types"),
        "@hooks": path.resolve(__dirname, "./src/hooks"),
        "@assets": path.resolve(__dirname, "./src/assets"),
        "@stores": path.resolve(__dirname, "./src/stores"),
        "@shared-components": path.resolve(__dirname, "./shared-components/src/components"),
    },
},
  build: {
    // Emit a single bundle with deterministic names (no hashed assets folder)
    // - inlineDynamicImports ensures dynamic imports are inlined into the single bundle
    // - entryFileNames sets the produced entry filename to singleSpa.js
    // - assetFileNames allows placing logo.svg at the build root
    // - assetsDir left as '' so assets are emitted into the root of the dist folder
    assetsDir: "",
    cssCodeSplit: false,
    rollupOptions: {
      external: [...NPM_EXTERNALS],
      output: {
        inlineDynamicImports: true,
        entryFileNames: "singleSpa.js",
        // chunkFileNames won't be used when inlineDynamicImports is true, but keep a stable pattern
        chunkFileNames: "singleSpa-[name].js",
        assetFileNames: (assetInfo) => {
          // Emit logo.svg at the dist root as logo.svg
          if (assetInfo && assetInfo.name && assetInfo.name.endsWith("logo.svg")) {
            return "logo.svg";
          }
          // For other assets keep their original name and extension at root
          return assetInfo && assetInfo.name ? assetInfo.name : "[name][extname]";
        },
      },
    },
  },
}));