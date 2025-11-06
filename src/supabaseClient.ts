import { createClient } from '@supabase/supabase-js';

// Environment variables from .env.local (development) or .env.production (production)
// Vite automatically loads these based on mode
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 🔥 Debug: Log environment variable status (without values for security)
const isDev = import.meta.env.MODE === 'development';
if (isDev) {
    console.log('🔍 Supabase environment check (DEV mode):');
    console.log('   VITE_SUPABASE_URL:', supabaseUrl ? `SET (length: ${supabaseUrl.length})` : 'NOT SET');
    console.log('   VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? `SET (length: ${supabaseAnonKey.length})` : 'NOT SET');
} else {
    console.log('🔍 Supabase environment check (PROD mode):');
    console.log('   VITE_SUPABASE_URL:', supabaseUrl ? `SET (length: ${supabaseUrl.length})` : 'NOT SET');
    console.log('   VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? `SET (length: ${supabaseAnonKey.length})` : 'NOT SET');
}

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ ERROR: Supabase environment variables are not set!');
    console.error('   VITE_SUPABASE_URL:', supabaseUrl || 'MISSING');
    console.error('   VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING');
    console.error('   Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.production file on the server.');
    console.error('   File location: /var/repo/childapp2.env');
}

// Create Supabase client (will fail if variables are missing, but we log the error)
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-key', {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

// Database types (will be extended as we build)
export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string;
                    role: 'parent' | 'admin';
                    credits: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    role?: 'parent' | 'admin';
                    credits?: number;
                };
                Update: {
                    role?: 'parent' | 'admin';
                    credits?: number;
                };
            };
            profiles: {
                Row: {
                    id: number;
                    user_id: string;
                    name: string;
                    age: number;
                    gender: 'בן' | 'בת';
                    interests: string;
                    learning_goals: string | null;
                    photo_url: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    user_id: string;
                    name: string;
                    age: number;
                    gender: 'בן' | 'בת';
                    interests: string;
                    learning_goals?: string | null;
                    photo_url?: string | null;
                };
                Update: {
                    name?: string;
                    age?: number;
                    gender?: 'בן' | 'בת';
                    interests?: string;
                    learning_goals?: string | null;
                    photo_url?: string | null;
                };
            };
            stories: {
                Row: {
                    id: number;
                    user_id: string;
                    profile_id: number;
                    title: string;
                    story_parts: any; // jsonb
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    user_id: string;
                    profile_id: number;
                    title: string;
                    story_parts: any;
                };
                Update: {
                    title?: string;
                    story_parts?: any;
                };
            };
            workbooks: {
                Row: {
                    id: number;
                    user_id: string;
                    profile_id: number;
                    title: string;
                    workbook_data: any; // jsonb
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    user_id: string;
                    profile_id: number;
                    title: string;
                    workbook_data: any;
                };
                Update: {
                    title?: string;
                    workbook_data?: any;
                };
            };
            learning_plans: {
                Row: {
                    id: number;
                    user_id: string;
                    profile_id: number;
                    title: string;
                    plan_steps: any; // jsonb
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    user_id: string;
                    profile_id: number;
                    title: string;
                    plan_steps: any;
                };
                Update: {
                    title?: string;
                    plan_steps?: any;
                };
            };
        };
    };
}

// Typed Supabase client
export type SupabaseClient = typeof supabase;

