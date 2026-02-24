import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: process.env.NODE_ENV === "development" ? "Memzo YouTube [DEV]" : "Memzo YouTube",
    description: "Bilingual subtitles & vocabulary builder for YouTube",
    permissions: ["storage"],
    host_permissions: [
      "https://www.youtube.com/*",
      "https://translate.googleapis.com/*",
      "https://api.dictionaryapi.dev/*",
      "http://localhost:3000/*",
      "https://memzo.vercel.app/*",
    ],
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
