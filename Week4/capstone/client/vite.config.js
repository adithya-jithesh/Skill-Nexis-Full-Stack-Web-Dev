import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // Fixed, because the API's CORS list names this origin.
  server: { port: 5176, strictPort: true },
});
