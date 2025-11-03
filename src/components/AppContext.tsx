import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export interface Profile {
    id: number;
    user_id?: string; // Supabase user ID
    name: string;
    age: number;
    gender: 'בן' | 'בת';
    interests: string;
    learningGoals?: string;
    learning_goals?: string; // Database column name
    photo_url?: string; // URL to photo stored in Supabase Storage
    // Keep old 'photo' for backward compatibility
    photo?: string; // base64 string (deprecated, use photo_url)
}

export interface User {
    id: string; // Supabase UUID
    username: string;
    email?: string;
    role: 'parent' | 'admin';
    credits: number;
    profiles: Profile[];
}

interface AppContextType {
    user: User | null;
    activeProfile: Profile | null;
    setActiveProfile: (profile: Profile | null) => void;
    updateUserProfile: (updatedProfile: Profile) => Promise<void>;
    addUserProfile: (newProfile: Omit<Profile, 'id' | 'user_id'>) => Promise<void>;
    refreshProfiles: () => Promise<void>;
    isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [supabaseUser, setSupabaseUser] = useState<any>(null);

    // Listen to auth changes
    useEffect(() => {
        // Get initial session
        supabase.auth.getSession()
            .then(({ data: { session } }) => {
                setSupabaseUser(session?.user ?? null);
            })
            .catch((error) => {
                console.error('🔴 AppContext: Failed to get session:', error);
                setSupabaseUser(null);
            });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSupabaseUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Load user data and profiles from Supabase
    useEffect(() => {
        const loadUserData = async () => {
            console.log('🔵 AppContext: Starting loadUserData...');
            
            if (!supabaseUser) {
                console.log('🟡 AppContext: No supabaseUser, clearing state');
                setUser(null);
                setActiveProfile(null);
                setIsLoading(false);
                return;
            }

            console.log('🟢 AppContext: User authenticated:', {
                id: supabaseUser.id,
                email: supabaseUser.email,
                metadata: supabaseUser.user_metadata
            });

            try {
                setIsLoading(true);

                // Get user data from public.users table
                console.log('🔵 AppContext: Fetching from public.users...');
                let { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', supabaseUser.id)
                    .single();

                console.log('🔵 AppContext: public.users response:', { userData, userError });

                // If user doesn't exist, wait a bit and retry (trigger should create them)
                if (userError && userError.code === 'PGRST116') {
                    console.log('🟡 AppContext: User not found in public.users, waiting for trigger...');

                    // Wait 2 seconds for the trigger to create the user
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    // Retry fetching the user
                    const { data: retryUserData, error: retryError } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', supabaseUser.id)
                        .single();

                    console.log('🔵 AppContext: Retry fetch response:', { retryUserData, retryError });

                    if (retryError) {
                        console.error('❌ AppContext: User still not found after waiting');
                        alert('שגיאה: המשתמש לא נוצר אוטומטית. אנא פנה למנהל המערכת.');
                        setIsLoading(false);
                        return;
                    }

                    // Use the user data from retry
                    userData = retryUserData;
                    userError = null;
                    console.log('✅ AppContext: User found after waiting');
                } else if (userError) {
                    console.error('❌ AppContext: Error fetching user data:', userError);
                    const errorMsg = `שגיאה בטעינת נתוני משתמש: ${userError.message || userError.code || 'Unknown error'}. אנא רענן את הדף.`;
                    alert(errorMsg);
                    setIsLoading(false);
                    return;
                }

                // Get profiles from public.profiles table
                console.log('🔵 AppContext: Fetching profiles...');
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('user_id', supabaseUser.id)
                    .order('created_at', { ascending: true });

                console.log('🔵 AppContext: Profiles response:', { 
                    profilesData, 
                    profilesError,
                    count: profilesData?.length || 0 
                });

                if (profilesError) {
                    console.error('❌ AppContext: Error fetching profiles:', profilesError);
                }

                // Map database profiles to our Profile interface
                const profiles: Profile[] = (profilesData || []).map(p => ({
                    id: p.id,
                    user_id: p.user_id,
                    name: p.name,
                    age: p.age,
                    gender: p.gender,
                    interests: p.interests,
                    learningGoals: p.learning_goals,
                    photo_url: p.photo_url,
                }));

                // Construct User object
                const currentUser: User = {
                    id: supabaseUser.id,
                    username: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'משתמש',
                    email: supabaseUser.email,
                    role: userData.role,
                    credits: userData.credits,
                    profiles: profiles,
                };

                console.log('✅ AppContext: User object constructed:', {
                    id: currentUser.id,
                    username: currentUser.username,
                    role: currentUser.role,
                    credits: currentUser.credits,
                    profileCount: currentUser.profiles.length
                });

                setUser(currentUser);

                // Set first profile as active if none selected
                if (!activeProfile && profiles.length > 0) {
                    console.log('🟢 AppContext: Setting first profile as active:', profiles[0].name);
                    setActiveProfile(profiles[0]);
                } else if (profiles.length === 0) {
                    console.log('🟡 AppContext: No profiles found for user');
                }

            } catch (error) {
                console.error('❌ AppContext: Unexpected error loading user data:', error);
                alert('שגיאה בטעינת נתונים. אנא רענן את הדף.');
            } finally {
                console.log('🔵 AppContext: Setting isLoading = false');
                setIsLoading(false);
            }
        };

        loadUserData();
    }, [supabaseUser?.id]); // Only re-run when user ID changes

    // Refresh profiles from database
    const refreshProfiles = async () => {
        if (!supabaseUser) return;

        try {
            const { data: profilesData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', supabaseUser.id)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error refreshing profiles:', error);
                return;
            }

            const profiles: Profile[] = (profilesData || []).map(p => ({
                id: p.id,
                user_id: p.user_id,
                name: p.name,
                age: p.age,
                gender: p.gender,
                interests: p.interests,
                learningGoals: p.learning_goals,
                photo_url: p.photo_url,
            }));

            if (user) {
                setUser({ ...user, profiles });
            }
        } catch (error) {
            console.error('Error refreshing profiles:', error);
        }
    };

    // Update profile in Supabase
    const updateUserProfile = async (updatedProfile: Profile) => {
        if (!supabaseUser) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    name: updatedProfile.name,
                    age: updatedProfile.age,
                    gender: updatedProfile.gender,
                    interests: updatedProfile.interests,
                    learning_goals: updatedProfile.learningGoals,
                    photo_url: updatedProfile.photo_url,
                })
                .eq('id', updatedProfile.id)
                .eq('user_id', supabaseUser.id);

            if (error) {
                console.error('Error updating profile:', error);
                alert('שגיאה בעדכון הפרופיל. נסה שוב.');
                return;
            }

            // Update local state
            await refreshProfiles();

            // Update active profile if it's the one being edited
            if (activeProfile?.id === updatedProfile.id) {
                setActiveProfile(updatedProfile);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('שגיאה בעדכון הפרופיל. נסה שוב.');
        }
    };

    // Add new profile to Supabase
    const addUserProfile = async (newProfile: Omit<Profile, 'id' | 'user_id'>) => {
        if (!supabaseUser) return;

        try {
            const { data, error } = await supabase
                .from('profiles')
                .insert({
                    user_id: supabaseUser.id,
                    name: newProfile.name,
                    age: newProfile.age,
                    gender: newProfile.gender,
                    interests: newProfile.interests,
                    learning_goals: newProfile.learningGoals,
                    photo_url: newProfile.photo_url,
                })
                .select()
                .single();

            if (error) {
                console.error('Error adding profile:', error);
                alert('שגיאה ביצירת הפרופיל. נסה שוב.');
                return;
            }

            // Refresh profiles to get the new one
            await refreshProfiles();

            // Set as active profile if it's the first one
            if (user && user.profiles.length === 0) {
                const newProfileMapped: Profile = {
                    id: data.id,
                    user_id: data.user_id,
                    name: data.name,
                    age: data.age,
                    gender: data.gender,
                    interests: data.interests,
                    learningGoals: data.learning_goals,
                    photo_url: data.photo_url,
                };
                setActiveProfile(newProfileMapped);
            }
        } catch (error) {
            console.error('Error adding profile:', error);
            alert('שגיאה ביצירת הפרופיל. נסה שוב.');
        }
    };

    return (
        <AppContext.Provider value={{ 
            user, 
            activeProfile, 
            setActiveProfile, 
            updateUserProfile, 
            addUserProfile, 
            refreshProfiles,
            isLoading 
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
