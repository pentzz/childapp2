import React, { useState, useEffect } from 'react';
import { useAppContext, Profile } from './AppContext';
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
        if (e.target.files && e.target.files[0]) {
            const base64 = await toBase64(e.target.files[0]);
            setFormState(prev => ({ ...prev, photo: base64 }));
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
                        <label>תמונת פרופיל (אופציונלי):</label>
                        <input type="file" accept="image/*" onChange={handlePhotoChange} style={{...styles.input, marginTop: '0.5rem'}}/>
                        {formState.photo && <img src={formState.photo} alt="preview" style={{width: '80px', height: '80px', objectFit: 'cover', borderRadius: '50%', marginTop: '1rem'}} />}
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
        if (profileData.id !== undefined) {
            // This is an update. The `profileData` from the form can be partial.
            // We must merge it with the existing profile to create a complete `Profile` object.
            const originalProfile = user.profiles.find(p => p.id === profileData.id);
            if (originalProfile) {
                const updatedProfile: Profile = { ...originalProfile, ...profileData };
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
                photo_url: profileData.photo_url,
                // Keep backward compatibility with base64 photo
                photo: profileData.photo,
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