import React, { useState } from 'react';
import { supabase } from './src/supabaseClient';
import { styles } from './styles';

interface ContentItem {
    section_key: string;
    content_type: string;
    content_value: string;
    image_url?: string;
}

interface ContentEditorProps {
    sectionKey: string;
    currentValue: string;
    currentImageUrl?: string;
    contentType: 'text' | 'image';
    onSave: (value: string, imageUrl?: string) => void;
    onCancel: () => void;
}

const ContentEditor = ({
    sectionKey,
    currentValue,
    currentImageUrl,
    contentType,
    onSave,
    onCancel
}: ContentEditorProps) => {
    const [value, setValue] = useState(currentValue);
    const [imageUrl, setImageUrl] = useState(currentImageUrl || '');
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!e.target.files || e.target.files.length === 0) {
                return;
            }

            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `landing-page/${fileName}`;

            setUploading(true);

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('public-images')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                throw uploadError;
            }

            // Get public URL
            const { data } = supabase.storage
                .from('public-images')
                .getPublicUrl(filePath);

            setImageUrl(data.publicUrl);
            alert('תמונה הועלתה בהצלחה!');
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('שגיאה בהעלאת התמונה');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = () => {
        if (contentType === 'image') {
            onSave(imageUrl, imageUrl);
        } else {
            onSave(value, currentImageUrl);
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 10000,
                padding: '2rem'
            }}
            onClick={onCancel}
        >
            <div
                style={{
                    background: 'linear-gradient(145deg, rgba(26, 46, 26, 0.95), rgba(36, 60, 36, 0.95))',
                    padding: '2.5rem',
                    borderRadius: 'var(--border-radius-large)',
                    border: '2px solid var(--primary-color)',
                    maxWidth: '600px',
                    width: '100%',
                    boxShadow: '0 20px 60px rgba(127, 217, 87, 0.4)',
                    backdropFilter: 'blur(20px)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 style={{
                    ...styles.title,
                    marginTop: 0,
                    color: 'var(--primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    ✏️ עריכת תוכן: {sectionKey}
                </h2>

                {contentType === 'text' ? (
                    <div>
                        <label style={{
                            color: 'var(--text-light)',
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontWeight: '500'
                        }}>
                            תוכן:
                        </label>
                        <textarea
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            style={{
                                ...styles.textarea,
                                minHeight: '150px',
                                width: '100%',
                                fontFamily: 'var(--font-family)',
                                fontSize: '1rem'
                            }}
                            placeholder="הזן תוכן כאן..."
                        />
                    </div>
                ) : (
                    <div>
                        <label style={{
                            color: 'var(--text-light)',
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontWeight: '500'
                        }}>
                            URL תמונה:
                        </label>
                        <input
                            type="text"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            style={{
                                ...styles.input,
                                width: '100%',
                                marginBottom: '1rem'
                            }}
                            placeholder="או הזן URL ידני..."
                        />

                        {imageUrl && (
                            <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                                <img
                                    src={imageUrl}
                                    alt="Preview"
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '200px',
                                        borderRadius: 'var(--border-radius)',
                                        border: '2px solid var(--glass-border)'
                                    }}
                                />
                            </div>
                        )}

                        <label style={{
                            color: 'var(--text-light)',
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontWeight: '500'
                        }}>
                            או העלה תמונה חדשה:
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploading}
                            style={{
                                ...styles.input,
                                width: '100%',
                                padding: '0.75rem',
                                cursor: uploading ? 'not-allowed' : 'pointer'
                            }}
                        />
                        {uploading && (
                            <p style={{ color: 'var(--primary-light)', marginTop: '0.5rem' }}>
                                מעלה תמונה...
                            </p>
                        )}
                    </div>
                )}

                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginTop: '2rem',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        onClick={onCancel}
                        style={{
                            ...styles.button,
                            background: 'var(--glass-bg)',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--text-light)',
                            boxShadow: 'none'
                        }}
                    >
                        ביטול
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={uploading}
                        style={{
                            ...styles.button,
                            background: uploading
                                ? 'var(--glass-bg)'
                                : 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                            cursor: uploading ? 'not-allowed' : 'pointer',
                            opacity: uploading ? 0.6 : 1
                        }}
                    >
                        💾 שמור
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContentEditor;
