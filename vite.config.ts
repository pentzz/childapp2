import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load ALL environment variables (including VITE_*)
    // Vite automatically loads .env.production in production mode
    const env = loadEnv(mode, '.', '');
    
    // 🔥 Debug: Log environment variables (without values for security)
    console.log('🔍 Environment variables check:');
    console.log('   VITE_SUPABASE_URL:', env.VITE_SUPABASE_URL ? `SET (length: ${env.VITE_SUPABASE_URL.length})` : 'NOT SET');
    console.log('   VITE_SUPABASE_ANON_KEY:', env.VITE_SUPABASE_ANON_KEY ? `SET (length: ${env.VITE_SUPABASE_ANON_KEY.length})` : 'NOT SET');
    console.log('   VITE_GEMINI_API_KEY:', env.VITE_GEMINI_API_KEY ? `SET (length: ${env.VITE_GEMINI_API_KEY.length})` : 'NOT SET');
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Use VITE_GEMINI_API_KEY from environment (VITE_ prefix is included)
        'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || ''),
        // Note: VITE_* variables are automatically available via import.meta.env
        // No need to define them here - Vite handles them automatically
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          // Ensure React is resolved from node_modules
          'react': path.resolve(__dirname, 'node_modules/react'),
          'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
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
            // Ensure assets are properly named and accessible
            assetFileNames: 'assets/[name]-[hash][extname]',
            chunkFileNames: 'assets/[name]-[hash].js',
            entryFileNames: 'assets/[name]-[hash].js',
          },
        },
        // Ensure assets are copied correctly
        assetsDir: 'assets',
        // Ensure proper base path for production
        base: '/',
        // Increase chunk size warning limit
        chunkSizeWarningLimit: 1000,
      },
    };
});
