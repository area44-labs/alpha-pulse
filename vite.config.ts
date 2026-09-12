import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const base = process.env.BASE || process.env.BASE_URL || "/";

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    tanstackStart({
      prerender: {
        enabled: true,
        pages: [{ path: "/" }, { path: "/history" }, { path: "/stock" }],
      },
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
});
