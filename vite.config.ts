import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const base = process.env.BASE || "/";

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  resolve: {
    tsconfigPaths: true,
  },
});
