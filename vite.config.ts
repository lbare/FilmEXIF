import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { config as dotenvConfig } from "dotenv";

// Load environment variables
dotenvConfig();

export default defineConfig({
  base: "/FilmEXIF/",
  plugins: [react()],
});
