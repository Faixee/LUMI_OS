import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    server: {
      port: 3001,
      host: '127.0.0.1',
      strictPort: true,
      cors: true,
      hmr: {
        host: 'localhost',
        protocol: 'ws',
        port: 3001,
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'lucide-react', 'react-router-dom'],
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
