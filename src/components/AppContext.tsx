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
    is_admin?: boolean;
    is_super_admin?: boolean;
    api_key_id?: number | null;
}

export interface APIKey {
    id: number;
    key_name: string;
    api_key: string;
    description?: string;
    is_active: boolean;
    usage_count: number;
    created_at?: string;
    updated_at?: string;
}

export interface CreditCosts {
    story_part: number;
    plan_step: number;
    worksheet: number;
    workbook: number;
    topic_suggestions: number;
}

export interface Notification {
    id: number;
    user_id?: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'announcement';
    is_read: boolean;
    is_global: boolean;
    sender_id?: string;
    created_at: string;
}

export interface SavedContent {
    id: number;
    user_id: string;
    profile_id?: number;
    content_type: 'story' | 'workbook' | 'learning_plan' | 'worksheet' | 'custom';
    title: string;
    description?: string;
    thumbnail_url?: string;
    content_data: any;
    is_favorite: boolean;
    is_archived: boolean;
    is_public: boolean;
    view_count: number;
    like_count: number;
    share_count: number;
    tags: string[];
    created_at: string;
    updated_at: string;
    last_viewed_at?: string;
}

export interface ContentSection {
    id?: number;
    content_id?: number;
    section_order: number;
    section_title: string;
    section_type: 'text' | 'image' | 'activity' | 'quiz' | 'video' | 'code';
    section_data: any;
    background_color?: string;
    icon?: string;
}

interface AppContextType {
    user: User | null;
    activeProfile: Profile | null;
    setActiveProfile: (profile: Profile | null) => void;
    updateUserProfile: (updatedProfile: Profile) => Promise<void>;
    addUserProfile: (newProfile: Omit<Profile, 'id' | 'user_id'>) => Promise<void>;
    refreshProfiles: () => Promise<void>;
    updateUserCredits: (creditsDelta: number) => Promise<boolean>;
    creditCosts: CreditCosts;
    updateCreditCosts: (costs: Partial<CreditCosts>) => Promise<void>;
    refreshCreditCosts: () => Promise<void>;
    isLoading: boolean;
    // Admin functions
    allUsers: User[];
    refreshAllUsers: () => Promise<void>;
    updateOtherUserCredits: (userId: string, newCredits: number) => Promise<boolean>;
    updateUserAPIKey: (userId: string, apiKeyId: number | null) => Promise<boolean>;
    // API Keys management
    apiKeys: APIKey[];
    refreshAPIKeys: () => Promise<void>;
    addAPIKey: (keyData: Omit<APIKey, 'id' | 'usage_count' | 'created_at' | 'updated_at'>) => Promise<boolean>;
    updateAPIKey: (id: number, keyData: Partial<APIKey>) => Promise<boolean>;
    deleteAPIKey: (id: number) => Promise<boolean>;
    getUserAPIKey: () => string | null;
    // Notifications
    notifications: Notification[];
    unreadNotificationsCount: number;
    refreshNotifications: () => Promise<void>;
    markNotificationAsRead: (id: number) => Promise<boolean>;
    sendGlobalNotification: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error' | 'announcement') => Promise<boolean>;
    // Content Management
    saveContent: (contentData: Omit<SavedContent, 'id' | 'created_at' | 'updated_at' | 'view_count' | 'like_count' | 'share_count'>, sections?: ContentSection[]) => Promise<number | null>;
    updateContent: (contentId: number, contentData: Partial<SavedContent>, sections?: ContentSection[]) => Promise<boolean>;
    deleteContent: (contentId: number) => Promise<boolean>;
    getContent: (contentId: number) => Promise<{ content: SavedContent | null, sections: ContentSection[] }>;
    getUserContents: (contentType?: string) => Promise<SavedContent[]>;
    getAllContents: () => Promise<SavedContent[]>; // Admin only
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_CREDIT_COSTS: CreditCosts = {
    story_part: 1,
    plan_step: 2,
    worksheet: 2,
    workbook: 3,
    topic_suggestions: 1
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [supabaseUser, setSupabaseUser] = useState<any>(null);
    const [creditCosts, setCreditCosts] = useState<CreditCosts>(DEFAULT_CREDIT_COSTS);
    const [showCostsUpdateNotification, setShowCostsUpdateNotification] = useState(false);
    
    // Admin states
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [apiKeys, setAPIKeys] = useState<APIKey[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

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
                    username: userData.username || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'משתמש',
                    email: supabaseUser.email,
                    role: userData.role || 'parent',
                    credits: userData.credits || 0,
                    profiles: profiles,
                    is_admin: userData.is_admin || false,
                    is_super_admin: userData.is_super_admin || false,
                    api_key_id: userData.api_key_id || null,
                };

                console.log('✅ AppContext: User object constructed:', {
                    id: currentUser.id,
                    username: currentUser.username,
                    email: currentUser.email,
                    role: currentUser.role,
                    credits: currentUser.credits,
                    is_admin: currentUser.is_admin,
                    is_super_admin: currentUser.is_super_admin,
                    api_key_id: currentUser.api_key_id,
                    profileCount: currentUser.profiles.length
                });

                // 🔥 CRITICAL DEBUG INFO
                if (currentUser.email === 'ofirbaranesad@gmail.com') {
                    console.log('🔥🔥🔥 SUPER ADMIN CHECK:', {
                        email: currentUser.email,
                        is_admin: currentUser.is_admin,
                        is_super_admin: currentUser.is_super_admin,
                        role: currentUser.role,
                        raw_is_admin_from_db: userData.is_admin,
                        raw_is_super_admin_from_db: userData.is_super_admin,
                        should_be_admin: true
                    });
                    
                    if (!currentUser.is_admin || !currentUser.is_super_admin) {
                        console.error('❌❌❌ SUPER ADMIN NOT SET CORRECTLY IN DATABASE!');
                        console.error('Run this SQL in Supabase:');
                        console.error(`UPDATE users SET is_admin = true, is_super_admin = true, role = 'admin' WHERE email = 'ofirbaranesad@gmail.com';`);
                    }
                }

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

    // Update user credits (deduct or add)
    const updateUserCredits = async (creditsDelta: number): Promise<boolean> => {
        if (!supabaseUser || !user) return false;

        try {
            const newCredits = Math.max(0, user.credits + creditsDelta);
            
            const { error } = await supabase
                .from('users')
                .update({ credits: newCredits })
                .eq('id', supabaseUser.id);

            if (error) {
                console.error('Error updating credits:', error);
                return false;
            }

            // Update local state
            setUser({ ...user, credits: newCredits });
            return true;
        } catch (error) {
            console.error('Error updating credits:', error);
            return false;
        }
    };

    // Load credit costs from database (stored in a settings table or config)
    const loadCreditCosts = async () => {
        try {
            console.log('🔵 AppContext: Loading credit costs from Supabase...');
            const { data, error } = await supabase
                .from('credit_costs')
                .select('*')
                .limit(1)
                .maybeSingle(); // Use maybeSingle instead of single to handle empty table

            if (data && !error) {
                console.log('✅ AppContext: Credit costs loaded from DB:', data);
                setCreditCosts({
                    story_part: data.story_part || DEFAULT_CREDIT_COSTS.story_part,
                    plan_step: data.plan_step || DEFAULT_CREDIT_COSTS.plan_step,
                    worksheet: data.worksheet || DEFAULT_CREDIT_COSTS.worksheet,
                    workbook: data.workbook || DEFAULT_CREDIT_COSTS.workbook,
                    topic_suggestions: data.topic_suggestions || DEFAULT_CREDIT_COSTS.topic_suggestions
                });
            } else if (!data) {
                // If no data exists, create default entry
                console.log('🟡 AppContext: No credit costs found, creating defaults...');
                const { data: insertedData, error: insertError } = await supabase
                    .from('credit_costs')
                    .insert({
                        story_part: DEFAULT_CREDIT_COSTS.story_part,
                        plan_step: DEFAULT_CREDIT_COSTS.plan_step,
                        worksheet: DEFAULT_CREDIT_COSTS.worksheet,
                        workbook: DEFAULT_CREDIT_COSTS.workbook,
                        topic_suggestions: DEFAULT_CREDIT_COSTS.topic_suggestions
                    })
                    .select()
                    .single();

                if (insertError && insertError.code !== '23505') { // Ignore duplicate key errors
                    console.error('❌ AppContext: Error creating default credit costs:', insertError);
                } else if (insertedData) {
                    console.log('✅ AppContext: Default credit costs created:', insertedData);
                    setCreditCosts({
                        story_part: insertedData.story_part,
                        plan_step: insertedData.plan_step,
                        worksheet: insertedData.worksheet,
                        workbook: insertedData.workbook,
                        topic_suggestions: insertedData.topic_suggestions
                    });
                }
            } else if (error) {
                console.error('❌ AppContext: Error loading credit costs:', error);
            }
        } catch (error: any) {
            if (error.code === 'PGRST116') {
                // Table doesn't exist or no data - create default
                console.log('🟡 AppContext: No credit_costs table found, using defaults');
                setCreditCosts(DEFAULT_CREDIT_COSTS);
            } else {
                console.log('⚠️ AppContext: Error loading credit costs, using defaults:', error);
                setCreditCosts(DEFAULT_CREDIT_COSTS);
            }
        }
    };

    // Update credit costs (for super admin only)
    const updateCreditCosts = async (costs: Partial<CreditCosts>): Promise<void> => {
        try {
            console.log('🔵 AppContext: Updating credit costs in Supabase...', costs);
            const newCosts = { ...creditCosts, ...costs };
            
            // Get the first row (there should only be one)
            const { data: existingData } = await supabase
                .from('credit_costs')
                .select('id')
                .limit(1)
                .maybeSingle();

            if (existingData) {
                // Update existing row
                const { error } = await supabase
                    .from('credit_costs')
                    .update({
                    story_part: newCosts.story_part,
                    plan_step: newCosts.plan_step,
                    worksheet: newCosts.worksheet,
                    workbook: newCosts.workbook,
                    topic_suggestions: newCosts.topic_suggestions,
                    updated_at: new Date().toISOString()
                    })
                    .eq('id', existingData.id);

                if (error) {
                    console.error('❌ AppContext: Error updating credit costs:', error);
                    throw error;
                }
            } else {
                // Insert new row if none exists
                const { error } = await supabase
                    .from('credit_costs')
                    .insert({
                        story_part: newCosts.story_part,
                        plan_step: newCosts.plan_step,
                        worksheet: newCosts.worksheet,
                        workbook: newCosts.workbook,
                        topic_suggestions: newCosts.topic_suggestions
                    });

                if (error) {
                    console.error('❌ AppContext: Error inserting credit costs:', error);
                    throw error;
                }
            }

            console.log('✅ AppContext: Credit costs updated successfully');
            setCreditCosts(newCosts);
        } catch (error) {
            console.error('❌ AppContext: Error updating credit costs:', error);
            throw error;
        }
    };

    // Load credit costs when app starts and subscribe to real-time changes
    useEffect(() => {
        let isSubscribed = true;
        let pollingInterval: NodeJS.Timeout | null = null;

        // Load initial data
            loadCreditCosts();

        // Subscribe to real-time changes
        console.log('🔵 AppContext: Setting up real-time subscription for credit_costs...');
        const creditCostsSubscription = supabase
            .channel('credit_costs_changes')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
                    schema: 'public',
                    table: 'credit_costs'
                },
                (payload) => {
                    if (!isSubscribed) return;
                    
                    console.log('🔔 AppContext: Credit costs changed in real-time!', payload);
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        const newData = payload.new as any;
                        const newCosts = {
                            story_part: newData.story_part || DEFAULT_CREDIT_COSTS.story_part,
                            plan_step: newData.plan_step || DEFAULT_CREDIT_COSTS.plan_step,
                            worksheet: newData.worksheet || DEFAULT_CREDIT_COSTS.worksheet,
                            workbook: newData.workbook || DEFAULT_CREDIT_COSTS.workbook,
                            topic_suggestions: newData.topic_suggestions || DEFAULT_CREDIT_COSTS.topic_suggestions
                        };
                        setCreditCosts(newCosts);
                        console.log('✅ AppContext: Credit costs synced in real-time!', newCosts);
                        
                        // Show notification to user
                        setShowCostsUpdateNotification(true);
                        setTimeout(() => setShowCostsUpdateNotification(false), 5000);
                    }
                }
            )
            .subscribe((status) => {
                console.log('🔵 AppContext: Real-time subscription status:', status);
                
                // If subscription fails or is not connected, set up polling as backup
                if (status === 'SUBSCRIBED') {
                    console.log('✅ AppContext: Real-time subscription active!');
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    console.warn('⚠️ AppContext: Real-time subscription failed, using polling instead');
                    setupPolling();
                }
            });

        // Polling mechanism as backup (checks every 10 seconds - AGGRESSIVE)
        const setupPolling = () => {
            if (pollingInterval) return; // Already polling
            
            console.log('🔄 AppContext: Setting up AGGRESSIVE polling for credit costs (10s intervals)');
            pollingInterval = setInterval(async () => {
                if (!isSubscribed) return;
                
                try {
                    console.log('🔍 AppContext: Polling credit costs...');
                    const { data, error } = await supabase
                        .from('credit_costs')
                        .select('*')
                        .limit(1)
                        .maybeSingle();

                    if (data && !error) {
                        const newCosts = {
                            story_part: data.story_part || DEFAULT_CREDIT_COSTS.story_part,
                            plan_step: data.plan_step || DEFAULT_CREDIT_COSTS.plan_step,
                            worksheet: data.worksheet || DEFAULT_CREDIT_COSTS.worksheet,
                            workbook: data.workbook || DEFAULT_CREDIT_COSTS.workbook,
                            topic_suggestions: data.topic_suggestions || DEFAULT_CREDIT_COSTS.topic_suggestions
                        };
                        
                        // Only update if changed
                        setCreditCosts(prev => {
                            const hasChanged = JSON.stringify(prev) !== JSON.stringify(newCosts);
                            if (hasChanged) {
                                console.log('✅ AppContext: Credit costs updated via polling!', newCosts);
                                // Show notification to user
                                setShowCostsUpdateNotification(true);
                                setTimeout(() => setShowCostsUpdateNotification(false), 5000);
                            }
                            return hasChanged ? newCosts : prev;
                        });
                    } else {
                        console.warn('⚠️ AppContext: No credit costs data found in polling');
                    }
                } catch (error) {
                    console.error('❌ AppContext: Polling error:', error);
                }
            }, 10000); // 10 seconds - MUCH MORE AGGRESSIVE
        };

        // Start polling immediately (no delay)
        setupPolling();
        
        // Also reload when user returns to tab (visibility change)
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible' && isSubscribed) {
                console.log('👀 AppContext: Tab became visible, refreshing credit costs...');
                await loadCreditCosts();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Also reload on window focus
        const handleWindowFocus = async () => {
            if (isSubscribed) {
                console.log('🎯 AppContext: Window focused, refreshing credit costs...');
                await loadCreditCosts();
            }
        };
        window.addEventListener('focus', handleWindowFocus);

        // Cleanup subscription on unmount
        return () => {
            console.log('🔵 AppContext: Cleaning up credit costs sync...');
            isSubscribed = false;
            if (pollingInterval) {
                clearInterval(pollingInterval);
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleWindowFocus);
            supabase.removeChannel(creditCostsSubscription);
        };
    }, []); // Run only once on mount

    // =========================================
    // ADMIN FUNCTIONS - ALL USERS MANAGEMENT
    // =========================================
    
    // Load all users (for admins)
    const refreshAllUsers = async () => {
        console.log('🔥 refreshAllUsers called!', {
            user_exists: !!user,
            user_email: user?.email,
            user_is_admin: user?.is_admin,
            user_is_super_admin: user?.is_super_admin
        });

        if (!user?.is_admin) {
            console.log('🟡 AppContext: Not admin, skipping allUsers load');
            console.log('🟡 To fix: Log out, then log back in as admin user');
            return;
        }

        try {
            console.log('🔵 AppContext: Loading all users with profiles...');
            const { data, error } = await supabase
                .from('users')
                .select('*, profiles(*)')
                .order('username', { ascending: true });

            if (error) {
                console.error('❌ Supabase query error:', error);
                throw error;
            }

            console.log('🔵 Raw data from Supabase users table:', data);

            // Transform data to match User interface
            const transformedUsers = (data || []).map((u: any) => ({
                id: u.id,
                username: u.username || u.email?.split('@')[0] || 'משתמש',
                email: u.email,
                role: u.role || 'parent',
                credits: u.credits || 0,
                profiles: u.profiles || [],
                is_admin: u.is_admin || false,
                is_super_admin: u.is_super_admin || false,
                api_key_id: u.api_key_id
            }));

            console.log('✅ AppContext: Loaded all users:', transformedUsers.length, transformedUsers);
            setAllUsers(transformedUsers);
        } catch (error) {
            console.error('❌ AppContext: Failed to load all users:', error);
        }
    };

    // Real-time sync for all users (for admins)
    useEffect(() => {
        if (!user?.is_admin) return;

        console.log('🔵 AppContext: Setting up real-time for all users...');
        
        // Initial load
        refreshAllUsers();

        // Subscribe to changes
        const usersChannel = supabase
            .channel('all_users_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'users'
                },
                (payload) => {
                    console.log('🔔 AppContext: Users table changed!', payload);
                    refreshAllUsers(); // Reload all users
                }
            )
            .subscribe((status) => {
                console.log('🔵 AppContext: Users real-time status:', status);
            });

        return () => {
            console.log('🔵 AppContext: Cleaning up users real-time');
            supabase.removeChannel(usersChannel);
        };
    }, [user?.is_admin]);

    // Update other user's credits
    const updateOtherUserCredits = async (userId: string, newCredits: number): Promise<boolean> => {
        if (!user?.is_admin) {
            console.error('❌ Not authorized to update other users');
            return false;
        }

        try {
            console.log(`🔵 AppContext: Updating user ${userId} credits to ${newCredits}`);
            
            const { error } = await supabase
                .from('users')
                .update({ credits: newCredits })
                .eq('id', userId);

            if (error) throw error;

            console.log('✅ AppContext: Credits updated successfully');
            
            // Refresh all users to show updated data
            await refreshAllUsers();
            
            return true;
        } catch (error) {
            console.error('❌ AppContext: Failed to update credits:', error);
            return false;
        }
    };

    // Update user's API key
    const updateUserAPIKey = async (userId: string, apiKeyId: number | null): Promise<boolean> => {
        if (!user?.is_admin) {
            console.error('❌ Not authorized to update users');
            return false;
        }

        try {
            console.log(`🔵 AppContext: Updating user ${userId} API key to ${apiKeyId}`);
            
            const { error } = await supabase
                .from('users')
                .update({ api_key_id: apiKeyId })
                .eq('id', userId);

            if (error) throw error;

            console.log('✅ AppContext: API key updated successfully');
            
            // Refresh all users
            await refreshAllUsers();
            
            return true;
        } catch (error) {
            console.error('❌ AppContext: Failed to update API key:', error);
            return false;
        }
    };

    // =========================================
    // API KEYS MANAGEMENT
    // =========================================
    
    // Load all API keys
    const refreshAPIKeys = async () => {
        try {
            console.log('🔵 AppContext: Loading API keys...');
            const { data, error } = await supabase
                .from('api_keys')
                .select('*')
                .order('key_name', { ascending: true });

            if (error) throw error;

            console.log('✅ AppContext: Loaded API keys:', data?.length);
            setAPIKeys(data || []);
        } catch (error) {
            console.error('❌ AppContext: Failed to load API keys:', error);
        }
    };

    // Real-time sync for API keys
    useEffect(() => {
        console.log('🔵 AppContext: Setting up real-time for API keys...');
        
        // Initial load
        refreshAPIKeys();

        // Subscribe to changes
        const keysChannel = supabase
            .channel('api_keys_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'api_keys'
                },
                (payload) => {
                    console.log('🔔 AppContext: API keys changed!', payload);
                    refreshAPIKeys();
                }
            )
            .subscribe((status) => {
                console.log('🔵 AppContext: API keys real-time status:', status);
            });

        return () => {
            console.log('🔵 AppContext: Cleaning up API keys real-time');
            supabase.removeChannel(keysChannel);
        };
    }, []);

    // Add new API key
    const addAPIKey = async (keyData: Omit<APIKey, 'id' | 'usage_count' | 'created_at' | 'updated_at'>): Promise<boolean> => {
        if (!user?.is_super_admin) {
            console.error('❌ Not authorized to add API keys');
            return false;
        }

        try {
            console.log('🔵 AppContext: Adding new API key');
            
            const { error } = await supabase
                .from('api_keys')
                .insert({
                    key_name: keyData.key_name,
                    api_key: keyData.api_key,
                    description: keyData.description,
                    is_active: keyData.is_active
                });

            if (error) throw error;

            console.log('✅ AppContext: API key added successfully');
            await refreshAPIKeys();
            
            return true;
        } catch (error) {
            console.error('❌ AppContext: Failed to add API key:', error);
            return false;
        }
    };

    // Update API key
    const updateAPIKey = async (id: number, keyData: Partial<APIKey>): Promise<boolean> => {
        if (!user?.is_super_admin) {
            console.error('❌ Not authorized to update API keys');
            return false;
        }

        try {
            console.log(`🔵 AppContext: Updating API key ${id}`);
            
            const { error } = await supabase
                .from('api_keys')
                .update(keyData)
                .eq('id', id);

            if (error) throw error;

            console.log('✅ AppContext: API key updated successfully');
            await refreshAPIKeys();
            
            return true;
        } catch (error) {
            console.error('❌ AppContext: Failed to update API key:', error);
            return false;
        }
    };

    // Delete API key
    const deleteAPIKey = async (id: number): Promise<boolean> => {
        if (!user?.is_super_admin) {
            console.error('❌ Not authorized to delete API keys');
            return false;
        }

        try {
            console.log(`🔵 AppContext: Deleting API key ${id}`);
            
            const { error } = await supabase
                .from('api_keys')
                .delete()
                .eq('id', id);

            if (error) throw error;

            console.log('✅ AppContext: API key deleted successfully');
            await refreshAPIKeys();
            
            return true;
        } catch (error) {
            console.error('❌ AppContext: Failed to delete API key:', error);
            return false;
        }
    };

    // Get current user's API key
    const getUserAPIKey = (): string | null => {
        if (!user || !user.api_key_id) {
            console.warn('⚠️ AppContext: User has no API key assigned');
            return null;
        }

        const userKey = apiKeys.find(k => k.id === user.api_key_id && k.is_active);

        if (!userKey) {
            console.error('❌ AppContext: User API key not found or inactive');
            return null;
        }

        return userKey.api_key;
    };

    // =========================================
    // NOTIFICATIONS MANAGEMENT
    // =========================================

    // Load user notifications
    const refreshNotifications = async () => {
        if (!user) return;

        try {
            console.log('🔵 AppContext: Loading notifications...');
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .or(`user_id.eq.${user.id},is_global.eq.true`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            console.log('✅ AppContext: Loaded notifications:', data?.length);
            setNotifications(data || []);

            // Count unread
            const unreadCount = (data || []).filter(n => !n.is_read).length;
            setUnreadNotificationsCount(unreadCount);
        } catch (error) {
            console.error('❌ AppContext: Failed to load notifications:', error);
        }
    };

    // Mark notification as read
    const markNotificationAsRead = async (id: number): Promise<boolean> => {
        if (!user) return false;

        try {
            console.log(`🔵 AppContext: Marking notification ${id} as read`);

            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            if (error) throw error;

            console.log('✅ AppContext: Notification marked as read');

            // Refresh notifications
            await refreshNotifications();

            return true;
        } catch (error) {
            console.error('❌ AppContext: Failed to mark notification as read:', error);
            return false;
        }
    };

    // Send global notification (super admin only)
    const sendGlobalNotification = async (
        title: string,
        message: string,
        type: 'info' | 'success' | 'warning' | 'error' | 'announcement' = 'announcement'
    ): Promise<boolean> => {
        if (!user?.is_super_admin) {
            console.error('❌ Not authorized to send global notifications');
            return false;
        }

        try {
            console.log('🔵 AppContext: Sending global notification');

            // Get all users
            const { data: allUsersData } = await supabase
                .from('users')
                .select('id');

            if (!allUsersData) {
                throw new Error('Failed to fetch users');
            }

            // Create notification for each user
            const notifications = allUsersData.map(u => ({
                user_id: u.id,
                title,
                message,
                type,
                is_read: false,
                is_global: true,
                sender_id: user.id
            }));

            const { error } = await supabase
                .from('notifications')
                .insert(notifications);

            if (error) throw error;

            console.log(`✅ AppContext: Global notification sent to ${allUsersData.length} users`);

            return true;
        } catch (error) {
            console.error('❌ AppContext: Failed to send global notification:', error);
            return false;
        }
    };

    // =========================================
    // Content Management Functions
    // =========================================

    // Save new content
    const saveContent = async (
        contentData: Omit<SavedContent, 'id' | 'created_at' | 'updated_at' | 'view_count' | 'like_count' | 'share_count'>,
        sections?: ContentSection[]
    ): Promise<number | null> => {
        if (!user) return null;

        try {
            console.log('🔵 AppContext: Saving content...', contentData.title);

            // Insert content
            const { data, error } = await supabase
                .from('saved_content')
                .insert({
                    ...contentData,
                    user_id: user.id
                })
                .select()
                .single();

            if (error) throw error;

            console.log('✅ AppContext: Content saved with ID:', data.id);

            // Insert sections if provided
            if (sections && sections.length > 0) {
                const sectionsToInsert = sections.map(section => ({
                    content_id: data.id,
                    ...section
                }));

                const { error: sectionsError } = await supabase
                    .from('content_sections')
                    .insert(sectionsToInsert);

                if (sectionsError) {
                    console.error('⚠️ Error saving sections:', sectionsError);
                }
            }

            return data.id;
        } catch (error) {
            console.error('❌ AppContext: Failed to save content:', error);
            return null;
        }
    };

    // Update existing content
    const updateContent = async (
        contentId: number,
        contentData: Partial<SavedContent>,
        sections?: ContentSection[]
    ): Promise<boolean> => {
        if (!user) return false;

        try {
            console.log('🔵 AppContext: Updating content...', contentId);

            // Update content
            const { error } = await supabase
                .from('saved_content')
                .update(contentData)
                .eq('id', contentId)
                .eq('user_id', user.id);

            if (error) throw error;

            // Update sections if provided
            if (sections) {
                // Delete existing sections
                await supabase
                    .from('content_sections')
                    .delete()
                    .eq('content_id', contentId);

                // Insert new sections
                if (sections.length > 0) {
                    const sectionsToInsert = sections.map(section => ({
                        content_id: contentId,
                        ...section
                    }));

                    const { error: sectionsError } = await supabase
                        .from('content_sections')
                        .insert(sectionsToInsert);

                    if (sectionsError) {
                        console.error('⚠️ Error updating sections:', sectionsError);
                    }
                }
            }

            console.log('✅ AppContext: Content updated');
            return true;
        } catch (error) {
            console.error('❌ AppContext: Failed to update content:', error);
            return false;
        }
    };

    // Delete content (archive it)
    const deleteContent = async (contentId: number): Promise<boolean> => {
        if (!user) return false;

        try {
            console.log('🔵 AppContext: Archiving content...', contentId);

            const { error } = await supabase
                .from('saved_content')
                .update({ is_archived: true })
                .eq('id', contentId)
                .eq('user_id', user.id);

            if (error) throw error;

            console.log('✅ AppContext: Content archived');
            return true;
        } catch (error) {
            console.error('❌ AppContext: Failed to archive content:', error);
            return false;
        }
    };

    // Get single content with sections
    const getContent = async (contentId: number): Promise<{ content: SavedContent | null, sections: ContentSection[] }> => {
        try {
            console.log('🔵 AppContext: Fetching content...', contentId);

            // Get content
            const { data: contentData, error: contentError } = await supabase
                .from('saved_content')
                .select('*')
                .eq('id', contentId)
                .single();

            if (contentError) throw contentError;

            // Get sections
            const { data: sectionsData, error: sectionsError } = await supabase
                .from('content_sections')
                .select('*')
                .eq('content_id', contentId)
                .order('section_order', { ascending: true });

            if (sectionsError) {
                console.error('⚠️ Error fetching sections:', sectionsError);
            }

            console.log('✅ AppContext: Content fetched');
            return {
                content: contentData,
                sections: sectionsData || []
            };
        } catch (error) {
            console.error('❌ AppContext: Failed to fetch content:', error);
            return { content: null, sections: [] };
        }
    };

    // Get all user's contents
    const getUserContents = async (contentType?: string): Promise<SavedContent[]> => {
        if (!user) return [];

        try {
            console.log('🔵 AppContext: Fetching user contents...', contentType || 'all');

            let query = supabase
                .from('saved_content')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_archived', false);

            if (contentType) {
                query = query.eq('content_type', contentType);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            console.log('✅ AppContext: Fetched', data?.length || 0, 'contents');
            return data || [];
        } catch (error) {
            console.error('❌ AppContext: Failed to fetch user contents:', error);
            return [];
        }
    };

    // Get all contents (admin only)
    const getAllContents = async (): Promise<SavedContent[]> => {
        if (!user?.is_admin) {
            console.error('❌ Not authorized to view all contents');
            return [];
        }

        try {
            console.log('🔵 AppContext: Fetching all contents (admin)...');

            const { data, error } = await supabase
                .from('saved_content')
                .select('*')
                .eq('is_archived', false)
                .order('created_at', { ascending: false });

            if (error) throw error;

            console.log('✅ AppContext: Fetched', data?.length || 0, 'contents');
            return data || [];
        } catch (error) {
            console.error('❌ AppContext: Failed to fetch all contents:', error);
            return [];
        }
    };

    // Real-time sync for notifications
    useEffect(() => {
        if (!user) return;

        console.log('🔵 AppContext: Setting up real-time for notifications...');

        // Initial load
        refreshNotifications();

        // Subscribe to changes
        const notificationsChannel = supabase
            .channel('notifications_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    console.log('🔔 AppContext: Notifications changed!', payload);
                    refreshNotifications();
                }
            )
            .subscribe((status) => {
                console.log('🔵 AppContext: Notifications real-time status:', status);
            });

        return () => {
            console.log('🔵 AppContext: Cleaning up notifications real-time');
            supabase.removeChannel(notificationsChannel);
        };
    }, [user?.id]);

    return (
        <AppContext.Provider value={{ 
            user, 
            activeProfile, 
            setActiveProfile, 
            updateUserProfile, 
            addUserProfile, 
            refreshProfiles,
            updateUserCredits,
            creditCosts,
            updateCreditCosts,
            refreshCreditCosts: loadCreditCosts,
            isLoading,
            // Admin functions
            allUsers,
            refreshAllUsers,
            updateOtherUserCredits,
            updateUserAPIKey,
            // API Keys
            apiKeys,
            refreshAPIKeys,
            addAPIKey,
            updateAPIKey,
            deleteAPIKey,
            getUserAPIKey,
            // Notifications
            notifications,
            unreadNotificationsCount,
            refreshNotifications,
            markNotificationAsRead,
            sendGlobalNotification
        }}>
            {children}
            
            {/* Notification toast for credit costs updates */}
            {showCostsUpdateNotification && (
                <div style={{
                    position: 'fixed',
                    top: '80px',
                    right: '20px',
                    background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                    color: 'white',
                    padding: '1rem 1.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    zIndex: 10000,
                    animation: 'slideInRight 0.3s ease-out',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.8rem',
                    maxWidth: '350px'
                }}>
                    <span style={{ fontSize: '1.5rem' }}>💎</span>
                    <div>
                        <strong style={{ display: 'block', marginBottom: '0.2rem' }}>עלויות קרדיטים עודכנו!</strong>
                        <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>מחירי היצירות השתנו על ידי המנהל</span>
                    </div>
                </div>
            )}
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
