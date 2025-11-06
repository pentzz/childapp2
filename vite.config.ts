import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load ALL environment variables (including VITE_*)
    // Vite automatically loads .env.production in production mode
    // The third parameter '' means load from current directory (where vite.config.ts is)
    const env = loadEnv(mode, process.cwd(), '');
    
    // 🔥 Debug: Log environment variables (without values for security)
    console.log('🔍 Environment variables check (mode:', mode, '):');
    console.log('   Working directory:', process.cwd());
    console.log('   VITE_SUPABASE_URL:', env.VITE_SUPABASE_URL ? `SET (length: ${env.VITE_SUPABASE_URL.length})` : 'NOT SET');
    console.log('   VITE_SUPABASE_ANON_KEY:', env.VITE_SUPABASE_ANON_KEY ? `SET (length: ${env.VITE_SUPABASE_ANON_KEY.length})` : 'NOT SET');
    console.log('   VITE_GEMINI_API_KEY:', env.VITE_GEMINI_API_KEY ? `SET (length: ${env.VITE_GEMINI_API_KEY.length})` : 'NOT SET');
    
    // 🔥 Check if .env.production exists
    const fs = require('fs');
    const path = require('path');
    const envProdPath = path.resolve(process.cwd(), '.env.production');
    if (fs.existsSync(envProdPath)) {
        console.log('   ✅ .env.production file found at:', envProdPath);
        const envContent = fs.readFileSync(envProdPath, 'utf-8');
        const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
        console.log('   📋 .env.production contains', lines.length, 'non-empty lines');
    } else {
        console.log('   ⚠️  .env.production file NOT found at:', envProdPath);
    }
    
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
