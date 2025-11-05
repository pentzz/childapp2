import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react({
        // Ensure React is properly bundled
        jsxRuntime: 'automatic',
      })],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        },
        // Ensure React is resolved correctly
        dedupe: ['react', 'react-dom'],
      },
      build: {
        // Ensure React is included in the bundle
        commonjsOptions: {
          include: [/node_modules/],
        },
        rollupOptions: {
          output: {
            manualChunks: undefined, // Let Vite handle chunking
          },
        },
      },
    };
});
