import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

export default defineConfig({
  base: process.env.VITE_BASE_URL,
  plugins: [react()],
});
