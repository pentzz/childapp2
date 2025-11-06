import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load ALL environment variables (including VITE_*)
    // loadEnv will look for .env.production when mode is 'production'
    // The second parameter is the directory to search ('.' = current directory)
    // The third parameter is the prefix to filter ('' = all variables)
    const env = loadEnv(mode, process.cwd(), '');
    
    console.log('🔵 Vite Config: Loading environment variables for mode:', mode);
    console.log('🔵 Vite Config: Current working directory:', process.cwd());
    console.log('🔵 Vite Config: Looking for .env.production in:', process.cwd());
    console.log('🔵 Vite Config: VITE_SUPABASE_URL:', env.VITE_SUPABASE_URL ? `${env.VITE_SUPABASE_URL.substring(0, 30)}...` : 'NOT SET');
    console.log('🔵 Vite Config: VITE_SUPABASE_ANON_KEY:', env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
    console.log('🔵 Vite Config: VITE_GEMINI_API_KEY:', env.VITE_GEMINI_API_KEY ? 'SET' : 'NOT SET');
    
    // Also check process.env as fallback (for when variables are passed via command line)
    console.log('🔵 Vite Config: Checking process.env:');
    console.log('🔵 Vite Config: process.env.VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? `${process.env.VITE_SUPABASE_URL.substring(0, 30)}...` : 'NOT SET');
    console.log('🔵 Vite Config: process.env.VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
    console.log('🔵 Vite Config: process.env.VITE_GEMINI_API_KEY:', process.env.VITE_GEMINI_API_KEY ? 'SET' : 'NOT SET');
    
    const finalEnv = {
        ...env,
        VITE_SUPABASE_URL: env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
        VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
        VITE_GEMINI_API_KEY: env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || ''
    };
    
    console.log('🔵 Vite Config: Final environment variables:');
    console.log('🔵 Vite Config: VITE_SUPABASE_URL:', finalEnv.VITE_SUPABASE_URL ? `${finalEnv.VITE_SUPABASE_URL.substring(0, 30)}...` : 'NOT SET');
    console.log('🔵 Vite Config: VITE_SUPABASE_ANON_KEY:', finalEnv.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
    console.log('🔵 Vite Config: VITE_GEMINI_API_KEY:', finalEnv.VITE_GEMINI_API_KEY ? 'SET' : 'NOT SET');
    
    // If still not set, throw error
    if (!finalEnv.VITE_SUPABASE_URL || !finalEnv.VITE_SUPABASE_ANON_KEY) {
        console.error('❌ ERROR: Supabase environment variables are not set!');
        console.error('❌ This will cause the app to fail. Please check your .env.production file or environment variables.');
    }
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Use VITE_GEMINI_API_KEY from environment (VITE_ prefix is included)
        'process.env.API_KEY': JSON.stringify(finalEnv.VITE_GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(finalEnv.VITE_GEMINI_API_KEY || ''),
        // IMPORTANT: Define Supabase variables so they're available at build time
        // Vite automatically replaces import.meta.env.VITE_* with these values during build
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(finalEnv.VITE_SUPABASE_URL || ''),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(finalEnv.VITE_SUPABASE_ANON_KEY || ''),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(finalEnv.VITE_GEMINI_API_KEY || '')
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
          },
        },
      },
    };
});
