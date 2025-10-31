import { createClient } from '@supabase/supabase-js';

// Environment variables from .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase environment variables are not set. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local file.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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

