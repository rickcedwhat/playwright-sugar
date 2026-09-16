import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Allow ?raw imports of ../deprecated/playbook for standalone downloads
    fs: { allow: ['..'] },
  },
});
