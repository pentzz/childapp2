import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load ALL environment variables (including VITE_*)
    // Vite automatically loads .env.production in production mode
    // The third parameter '' means load from current directory (where vite.config.ts is)
    // Use process.cwd() to get the actual working directory (where npm run build is executed)
    const rootDir = process.cwd();
    const env = loadEnv(mode, rootDir, '');
    
    // 🔥 Debug: Log environment variables (without values for security)
    console.log('🔍 Environment variables check (mode:', mode, '):');
    console.log('   Working directory:', rootDir);
    console.log('   Vite config directory:', __dirname);
    console.log('   VITE_SUPABASE_URL:', env.VITE_SUPABASE_URL ? `SET (length: ${env.VITE_SUPABASE_URL.length})` : 'NOT SET');
    console.log('   VITE_SUPABASE_ANON_KEY:', env.VITE_SUPABASE_ANON_KEY ? `SET (length: ${env.VITE_SUPABASE_ANON_KEY.length})` : 'NOT SET');
    console.log('   VITE_GEMINI_API_KEY:', env.VITE_GEMINI_API_KEY ? `SET (length: ${env.VITE_GEMINI_API_KEY.length})` : 'NOT SET');
    
    // 🔥 Check if .env.production exists in the working directory
    const envProdPath = path.resolve(rootDir, '.env.production');
    if (fs.existsSync(envProdPath)) {
        console.log('   ✅ .env.production file found at:', envProdPath);
        const envContent = fs.readFileSync(envProdPath, 'utf-8');
        const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
        console.log('   📋 .env.production contains', lines.length, 'non-empty lines');
        
        // 🔥 Debug: Show which variables are in the file (without values)
        const varNames = lines.map(line => line.split('=')[0].trim()).filter(name => name.startsWith('VITE_'));
        console.log('   📋 Variables found in .env.production:', varNames.join(', '));
        
        // 🔥 If variables are NOT SET but file exists, show warning
        if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
            console.error('   ❌ ERROR: .env.production file exists but variables are not loaded!');
            console.error('   This means Vite is not reading the file correctly.');
            console.error('   File content (first 3 lines):');
            const firstLines = envContent.split('\n').slice(0, 3);
            firstLines.forEach((line, i) => {
                const hidden = line.includes('=') ? line.split('=')[0] + '=***HIDDEN***' : line;
                console.error(`   ${i + 1}: ${hidden}`);
            });
        }
    } else {
        console.log('   ⚠️  .env.production file NOT found at:', envProdPath);
        console.log('   🔍 Searching for .env files in:', rootDir);
        try {
            const files = fs.readdirSync(rootDir);
            const envFiles = files.filter(f => f.startsWith('.env'));
            console.log('   📁 Found .env files:', envFiles.length > 0 ? envFiles.join(', ') : 'none');
        } catch (e) {
            console.log('   ⚠️  Could not read directory:', e);
        }
    }
    
    return {
      // Set base URL from environment variable or default to '/'
      // For DEV environment, use '/dev/', for production use '/'
      base: env.VITE_BASE_URL || process.env.BASE_URL || '/',
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
        // Increase chunk size warning limit
        chunkSizeWarningLimit: 1000,
      },
    };
});
