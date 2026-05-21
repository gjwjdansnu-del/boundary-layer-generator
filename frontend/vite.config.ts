import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages: https://gjwjdansnu-del.github.io/boundary-layer-generator/
export default defineConfig({
  plugins: [react()],
  base: "/boundary-layer-generator/",
});
