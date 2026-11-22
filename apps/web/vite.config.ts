import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            if (!res.headersSent && 'writeHead' in res) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  success: false,
                  error: {
                    code: 'BACKEND_OFFLINE',
                    message:
                      'Backend API belum aktif di http://localhost:4000. Jalankan npm run dev atau npm run dev:api.'
                  }
                })
              );
            }
          });
        }
      }
    }
  }
});
