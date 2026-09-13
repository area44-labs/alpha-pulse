import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const base = process.env.BASE || process.env.BASE_URL || "/";

// Representative stock routes to statically prerender for SSG / GitHub Pages
const prerenderStockSymbols = [
  "ACB",
  "FPT",
  "VCB",
  "HPG",
  "MBB",
  "TCB",
  "VNM",
  "SSI",
  "VHM",
  "MWG",
];

const prerenderPages = [
  { path: "/" },
  { path: "/history" },
  { path: "/methodology" },
  ...prerenderStockSymbols.map((sym) => ({ path: `/stock/${sym}` })),
];

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    tanstackStart({
      prerender: {
        enabled: true,
        pages: prerenderPages,
      },
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
});
