import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  // Load .env from repo root; command-line env vars take precedence
  const env = loadEnv(mode, resolve(__dirname, '../..'), '');
  const apiPort = process.env.PORT || env.PORT;
  const clientPort = process.env.VITE_PORT || env.VITE_PORT;

  if (!apiPort) throw new Error('PORT is not set — copy .env.example to .env');
  if (!clientPort) throw new Error('VITE_PORT is not set — copy .env.example to .env');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@cartrack/shared': resolve(__dirname, '../../packages/shared/src/index.ts'),
        '@client': resolve(__dirname, './src'),
      },
    },
    server: {
      port: Number(clientPort),
      proxy: {
        '/api': {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
