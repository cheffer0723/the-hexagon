import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// BASE_PATH lets this deploy under a subpath (e.g. GitHub Pages project site).
export default defineConfig({
  base: process.env.BASE_PATH || "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
    dedupe: ["react", "react-dom"],
  },
  build: { outDir: "dist", emptyOutDir: true },
  server: { host: true, port: Number(process.env.PORT || 5173) },
  preview: { host: true, port: Number(process.env.PORT || 4173) },
});
