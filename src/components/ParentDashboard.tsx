import React, { useState, useEffect } from 'react';
import { useAppContext, Profile } from './AppContext';
import { supabase } from '../supabaseClient';
import { toBase64 } from '../../helpers';
import { styles } from '../../styles';

// A profile being edited or created in the form can have partial data.
type EditableProfile = Partial<Profile>;

const ProfileFormModal = ({ profile, onClose, onSave }: { profile: EditableProfile | null, onClose: () => void, onSave: (p: EditableProfile) => void }) => {
    const [formState, setFormState] = useState<EditableProfile>({});

    useEffect(() => {
        if (profile && profile.id) { // Check for ID to determine if it's an existing profile
            setFormState(profile);
        } else {
            // Default for new profile
            setFormState({ name: '', age: 5, gender: 'בן', interests: '', learningGoals: '' });
        }
    }, [profile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: name === 'age' ? parseInt(value) : value }));
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        
        const file = e.target.files[0];
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            alert('התמונה גדולה מדי. אנא בחר תמונה עד 5MB');
            return;
        }

        try {
            // Show preview with base64 for immediate feedback
            const base64 = await toBase64(file);
            setFormState(prev => ({ ...prev, photo: base64, photoFile: file }));
        } catch (error) {
            console.error('Error processing photo:', error);
            alert('שגיאה בעיבוד התמונה');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formState.name || !formState.age || !formState.interests) {
            alert('נא למלא את כל שדות החובה.');
            return;
        }
        onSave(formState);
    };

    if (!profile) return null;

    return (
        <div className="modal-backdrop no-print" onClick={onClose}>
            <div className="modal-content profile-form-modal" onClick={e => e.stopPropagation()}>
                <h2 style={{...styles.title, marginTop: 0}}>{profile.id ? 'עריכת פרופיל' : 'יצירת פרופיל חדש'}</h2>
                <form onSubmit={handleSubmit} style={styles.glassForm}>
                    <input type="text" name="name" value={formState.name || ''} onChange={handleInputChange} placeholder="שם הילד/ה" style={styles.input} required/>
                    <div style={styles.formRow}>
                        <input type="number" name="age" value={formState.age || ''} onChange={handleInputChange} placeholder="גיל" style={{...styles.input, flex: 1}} required/>
                        <select name="gender" value={formState.gender} onChange={handleInputChange} style={{...styles.select, flex: 1}} required>
                            <option value="בן">בן</option>
                            <option value="בת">בת</option>
                        </select>
                    </div>
                    <textarea name="interests" value={formState.interests} onChange={handleInputChange} placeholder="תחומי עניין (לדוגמה: דינוזאורים, חלל, פיות)" style={styles.textarea} required/>
                    <textarea name="learningGoals" value={formState.learningGoals || ''} onChange={handleInputChange} placeholder="מטרות למידה (לדוגמה: שיפור הקריאה, הכרת מספרים)" style={styles.textarea} />
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                            color: 'var(--white)',
                            marginBottom: '0.5rem',
                            fontWeight: 'bold'
                        }}>
                            📷 תמונת פרופיל (אופציונלי):
                        </label>
                        <p style={{
                            fontSize: 'clamp(0.8rem, 1.8vw, 0.9rem)',
                            color: 'var(--text-light)',
                            marginBottom: '0.75rem',
                            lineHeight: 1.5
                        }}>
                            התמונה תשמש כהפנייה ליצירת תמונות עקביות בסיפור עם תווי פנים דומים
                        </p>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            style={{
                                ...styles.input,
                                marginTop: '0.5rem',
                                padding: 'clamp(0.75rem, 2vw, 1rem)',
                                fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                            className="profile-photo-input"
                        />
                        {(formState.photo || formState.photo_url) && (
                            <div style={{
                                marginTop: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                flexWrap: 'wrap'
                            }}>
                                <img
                                    src={formState.photo || formState.photo_url}
                                    alt="preview"
                                    style={{
                                        width: 'clamp(80px, 15vw, 120px)',
                                        height: 'clamp(80px, 15vw, 120px)',
                                        objectFit: 'cover',
                                        borderRadius: '50%',
                                        border: '3px solid var(--primary-color)',
                                        boxShadow: '0 4px 12px rgba(127, 217, 87, 0.3)',
                                        transition: 'all 0.3s ease'
                                    }}
                                    className="profile-photo-preview"
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'scale(1.1)';
                                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(127, 217, 87, 0.5)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(127, 217, 87, 0.3)';
                                    }}
                                />
                                <div style={{
                                    fontSize: 'clamp(0.8rem, 1.8vw, 0.9rem)',
                                    color: 'var(--text-light)'
                                }}>
                                    <div style={{marginBottom: '0.25rem'}}>✅ תמונה נבחרה</div>
                                    <div style={{fontSize: '0.75rem', opacity: 0.8}}>התמונה תועלה אוטומטית</div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
                        <button type="submit" style={styles.button}>{profile.id ? 'עדכון פרופיל' : 'צור פרופיל'}</button>
                        <button type="button" onClick={onClose} style={{...styles.button, background: 'transparent', color: 'var(--text-light)', boxShadow: 'none'}}>ביטול</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ParentDashboard = () => {
    const { user, activeProfile, setActiveProfile, addUserProfile, updateUserProfile } = useAppContext();
    const [editingProfile, setEditingProfile] = useState<EditableProfile | null>(null);

    if (!user) return null;

    const handleSaveProfile = async (profileData: EditableProfile) => {
        let photoUrl = profileData.photo_url;
        
        // Upload photo to Supabase Storage if a new file was selected
        if ((profileData as any).photoFile && user) {
            try {
                const file = (profileData as any).photoFile;
                const fileExt = file.name.split('.').pop();
                const fileName = `${profileData.id || 'new'}-${Date.now()}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`;

                // Upload to Supabase Storage
                const { error: uploadError } = await supabase.storage
                    .from('profile-photos')
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: true
                    });

                if (uploadError) {
                    console.error('Error uploading photo:', uploadError);
                    // Fallback to base64 if upload fails
                    photoUrl = profileData.photo_url || profileData.photo;
                } else {
                    // Get public URL
                    const { data } = supabase.storage
                        .from('profile-photos')
                        .getPublicUrl(filePath);
                    
                    photoUrl = data.publicUrl;
                }
            } catch (error) {
                console.error('Error uploading photo:', error);
                // Fallback to base64 or existing photo_url
                photoUrl = profileData.photo_url || profileData.photo;
            }
        } else if (profileData.photo && !profileData.photo_url && !(profileData as any).photoFile) {
            // If only base64 photo exists (no file), keep it for backward compatibility
            photoUrl = profileData.photo;
        }

        if (profileData.id !== undefined) {
            // This is an update. The `profileData` from the form can be partial.
            // We must merge it with the existing profile to create a complete `Profile` object.
            const originalProfile = user.profiles.find(p => p.id === profileData.id);
            if (originalProfile) {
                const updatedProfile: Profile = {
                    ...originalProfile,
                    ...profileData,
                    photo_url: photoUrl || profileData.photo_url,
                    // Remove photo if we have photo_url
                    photo: photoUrl ? undefined : profileData.photo
                };
                await updateUserProfile(updatedProfile);
            }
        } else {
            // This is a new profile. Construct profile data without ID (database will generate it)
            const newProfileData = {
                name: profileData.name || '',
                age: profileData.age || 0,
                gender: (profileData.gender || 'בן') as 'בן' | 'בת',
                interests: profileData.interests || '',
                learningGoals: profileData.learningGoals,
                photo_url: photoUrl,
                // Keep backward compatibility with base64 photo only if no photo_url
                photo: photoUrl ? undefined : profileData.photo,
            };
            await addUserProfile(newProfileData);
        }
        setEditingProfile(null);
    };

    return (
        <>
            {editingProfile && <ProfileFormModal profile={editingProfile} onClose={() => setEditingProfile(null)} onSave={handleSaveProfile} />}
            <div style={styles.dashboard}>
                <h1 style={styles.mainTitle}>דשבורד הורים</h1>
                <p style={styles.subtitle}>ניהול פרופילי הילדים ויצירת עולמות תוכן מותאמים אישית.</p>
                
                <div className="parent-dashboard-grid">
                    {user.profiles.map(profile => (
                        <div key={profile.id} className={`profile-card ${activeProfile?.id === profile.id ? 'active' : ''}`} >
                            <img 
                                src={profile.photo_url || profile.photo || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${profile.name}`} 
                                alt={profile.name} 
                                className="profile-avatar"
                            />
                            <div className="profile-info">
                                <h3>{profile.name}</h3>
                                <p>{profile.age}, {profile.gender}</p>
                            </div>
                            <div className="profile-actions">
                                <button onClick={() => setEditingProfile(profile)} style={{...styles.button, padding: '8px 16px', fontSize: '0.9rem'}}>עריכה</button>
                                <button onClick={() => setActiveProfile(profile)} style={{...styles.button, background: 'var(--secondary-color)', padding: '8px 16px', fontSize: '0.9rem'}} disabled={activeProfile?.id === profile.id}>
                                    {activeProfile?.id === profile.id ? 'פעיל' : 'הפעל'}
                                </button>
                            </div>
                        </div>
                    ))}
                    <div className="profile-card-add" onClick={() => setEditingProfile({})}>
                        <div className="icon">➕</div>
                        <h3>הוספת פרופיל</h3>
                    </div>
                    <div className="progress-card">
                        <div className="icon">📈</div>
                        <h3>מעקב התקדמות</h3>
                        <p style={{color: 'var(--text-light)'}}>בקרוב!</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ParentDashboard;