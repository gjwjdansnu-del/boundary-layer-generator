import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages: https://podobooks-ganghwa.github.io/boundary-layer-generator/
export default defineConfig({
  plugins: [react()],
  base: "/boundary-layer-generator/",
});
