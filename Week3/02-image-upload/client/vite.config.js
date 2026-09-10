import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // Fixed, because the API only allows this origin through CORS.
  server: { port: 5174, strictPort: true },
});
