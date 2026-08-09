import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // exposes on your LAN so you can open it from your phone during dev
    port: 5173,
  },
});
