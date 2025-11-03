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

export interface CreditCosts {
    story_part: number;
    plan_step: number;
    worksheet: number;
    workbook: number;
    topic_suggestions: number;
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

        // Polling mechanism as backup (checks every 30 seconds)
        const setupPolling = () => {
            if (pollingInterval) return; // Already polling
            
            console.log('🔄 AppContext: Setting up polling for credit costs (30s intervals)');
            pollingInterval = setInterval(async () => {
                if (!isSubscribed) return;
                
                try {
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
                                console.log('🔄 AppContext: Credit costs updated via polling', newCosts);
                                // Show notification to user
                                setShowCostsUpdateNotification(true);
                                setTimeout(() => setShowCostsUpdateNotification(false), 5000);
                            }
                            return hasChanged ? newCosts : prev;
                        });
                    }
                } catch (error) {
                    console.error('❌ AppContext: Polling error:', error);
                }
            }, 30000); // 30 seconds
        };

        // Always set up polling as backup after 5 seconds
        const pollingTimer = setTimeout(() => {
            if (isSubscribed) {
                setupPolling();
            }
        }, 5000);

        // Cleanup subscription on unmount
        return () => {
            console.log('🔵 AppContext: Cleaning up credit costs sync...');
            isSubscribed = false;
            if (pollingInterval) {
                clearInterval(pollingInterval);
            }
            clearTimeout(pollingTimer);
            supabase.removeChannel(creditCostsSubscription);
        };
    }, []); // Run only once on mount

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
            isLoading 
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
