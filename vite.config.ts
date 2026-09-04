import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";

function copyGeneratedPlugin(): Plugin {
  return {
    name: "copy-generated-files",
    closeBundle() {
      const srcDir = path.resolve(import.meta.dirname, "generated");
      const destDir = path.resolve(import.meta.dirname, "dist/generated");
      if (fs.existsSync(srcDir)) {
        fs.cpSync(srcDir, destDir, { recursive: true });
      }
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith("/generated/")) {
          const relativePath = req.url.replace(/^\/generated\//, "").split("?")[0];
          const filePath = path.resolve(import.meta.dirname, "generated", relativePath);
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(fs.readFileSync(filePath));
            return;
          }
        }
        next();
      });
    },
  };
}

const base = process.env.BASE || "/";

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [TanStackRouterVite(), react(), tailwindcss(), copyGeneratedPlugin()],
  resolve: {
    tsconfigPaths: true,
  },
});
