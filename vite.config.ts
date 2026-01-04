/**
 * LUMIX OS - Advanced Intelligence-First SMS
 * Created by: Faizain Murtuza
 * © 2025 Faizain Murtuza. All Rights Reserved.
 */

import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      host: '127.0.0.1',
      strictPort: false,
      cors: true,
      hmr: {
        host: 'localhost',
        protocol: 'ws',
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'lucide-react', 'react-router-dom'],
    },
    plugins: [react()],
    define: {
      __SYSTEM_CREATOR__: JSON.stringify('Faizain Murtuza'),
      __SYSTEM_VERSION__: JSON.stringify('1.0.0'),
      __SYSTEM_COPYRIGHT__: JSON.stringify(`© ${new Date().getFullYear()} Faizain Murtuza`),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
