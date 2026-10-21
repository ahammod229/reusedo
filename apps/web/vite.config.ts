import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  envDir: "../../",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "ReuseDo — কিছুই ফেলবেন না",
        short_name: "ReuseDo",
        description: "ব্যবহৃত জিনিস বিনামূল্যে দিন ও নিন — আপনার এলাকার যাচাই করা মানুষের সাথে।",
        lang: "bn",
        dir: "ltr",
        start_url: "/feed",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#fbfaf6",
        theme_color: "#1f7a4d",
        categories: ["lifestyle", "social", "shopping"],
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        shortcuts: [
          { name: "নতুন পোস্ট", url: "/post/new" },
          { name: "মেসেজ", url: "/messages" },
        ],
      },
      workbox: {
        // Never cache API traffic: a stale feed or chat is worse than a loading spinner.
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Only pin the libraries every page needs. Everything else (charts, maps, sockets,
        // emoji, icons) is left to the bundler so it loads with the route that uses it.
        // Match exact package folders: a bare "react" test also catches lucide-react,
        // @radix-ui/react-*, emoji-picker-react, etc. and drags them into the first load.
        manualChunks(id) {
          if (/\/node_modules\/(react|react-dom|scheduler|react-router)\//.test(id)) {
            return "vendor-react";
          }
          if (/\/node_modules\/(@firebase|firebase)\//.test(id)) {
            return "vendor-firebase";
          }
        },
      },
    },
  },
});
