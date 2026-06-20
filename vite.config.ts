import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the app under https://<user>.github.io/<repo-name>/
// Keep this in sync with the repository name.
export default defineConfig({
  plugins: [react()],
  base: '/b3_support_ticket_system/',
});
