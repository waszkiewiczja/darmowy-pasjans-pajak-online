import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  base: "/darmowy-pasjans-pajak-online/",
  plugins: [react()],
});
