import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCamera, FaTrash, FaUpload, FaCheckCircle } from 'react-icons/fa';
import { styles } from '../../styles';
import { saveProfileImage, getProfileImage } from '../services/localStorageDB';

interface ProfileImageUploadProps {
  childProfileId: string;
  currentImage?: string;
  onImageUploaded?: (imageData: string) => void;
  className?: string;
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  childProfileId,
  currentImage,
  onImageUploaded,
  className = '',
}) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(currentImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // טעינת תמונה קיימת
  React.useEffect(() => {
    const loadExistingImage = async () => {
      const existing = await getProfileImage(childProfileId);
      if (existing) {
        setUploadedImage(existing.imageData);
      }
    };
    loadExistingImage();
  }, [childProfileId]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    const file = acceptedFiles[0];

    // המרה ל-Base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;

      try {
        // שמירה ב-IndexedDB
        await saveProfileImage(childProfileId, base64, file.type);

        setUploadedImage(base64);
        setIsUploading(false);
        setUploadSuccess(true);

        if (onImageUploaded) {
          onImageUploaded(base64);
        }

        // הסתר הודעת הצלחה אחרי 3 שניות
        setTimeout(() => setUploadSuccess(false), 3000);
      } catch (error) {
        console.error('שגיאה בשמירת תמונה:', error);
        setIsUploading(false);
      }
    };

    reader.readAsDataURL(file);
  }, [childProfileId, onImageUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setUploadSuccess(false);
  };

  return (
    <div className={`profile-image-upload ${className}`}>
      <AnimatePresence mode="wait">
        {!uploadedImage ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            {...getRootProps()}
            style={{
              border: isDragActive
                ? '3px dashed var(--primary-color)'
                : '2px dashed var(--glass-border)',
              borderRadius: '20px',
              padding: 'clamp(2rem, 4vw, 3rem)',
              textAlign: 'center',
              cursor: 'pointer',
              background: isDragActive
                ? 'rgba(127, 217, 87, 0.1)'
                : 'rgba(26, 46, 26, 0.5)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <input {...getInputProps()} />

            <motion.div
              animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <FaCamera
                style={{
                  fontSize: 'clamp(3rem, 6vw, 5rem)',
                  color: 'var(--primary-color)',
                  marginBottom: '1rem',
                }}
              />

              <h3 style={{
                fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)',
                color: 'var(--primary-color)',
                marginBottom: '0.5rem',
                fontWeight: 'bold',
              }}>
                {isDragActive ? '🎯 שחרר כאן!' : '📸 העלה תמונת פרופיל'}
              </h3>

              <p style={{
                fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
                color: 'var(--text-secondary)',
                marginBottom: '1rem',
              }}>
                {isDragActive
                  ? 'כן! שחרר את התמונה עכשיו'
                  : 'גרור תמונה לכאן או לחץ לבחירה'}
              </p>

              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
                fontSize: 'clamp(0.85rem, 1.8vw, 0.95rem)',
                color: 'var(--text-secondary)',
              }}>
                <span>✅ JPG, PNG, WebP</span>
                <span>✅ עד 5MB</span>
                <span>✅ מומלץ: 512x512</span>
              </div>
            </motion.div>

            {isUploading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(13, 26, 13, 0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '20px',
                }}
              >
                <div className="spinner-optimized" />
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'relative',
              borderRadius: '20px',
              overflow: 'hidden',
              background: 'rgba(26, 46, 26, 0.5)',
              border: '3px solid var(--primary-color)',
              padding: '1rem',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(1rem, 2vw, 1.5rem)',
              flexWrap: 'wrap',
            }}>
              <motion.img
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                src={uploadedImage}
                alt="תמונת פרופיל"
                style={{
                  width: 'clamp(80px, 20vw, 150px)',
                  height: 'clamp(80px, 20vw, 150px)',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '4px solid var(--primary-color)',
                  boxShadow: '0 8px 32px rgba(127, 217, 87, 0.4)',
                }}
              />

              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                }}>
                  <FaCheckCircle style={{ color: 'var(--primary-color)', fontSize: '1.5rem' }} />
                  <h4 style={{
                    fontSize: 'clamp(1.1rem, 2.2vw, 1.4rem)',
                    color: 'var(--primary-color)',
                    fontWeight: 'bold',
                  }}>
                    תמונה הועלתה בהצלחה!
                  </h4>
                </div>

                <p style={{
                  fontSize: 'clamp(0.9rem, 1.8vw, 1rem)',
                  color: 'var(--text-secondary)',
                  marginBottom: '1rem',
                }}>
                  התמונה תשמש כרפרנס ליצירת סיפורים מותאמים אישית 🎨
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleRemoveImage}
                    style={{
                      ...styles.button,
                      background: 'rgba(255, 107, 107, 0.2)',
                      border: '2px solid var(--error-color)',
                      color: 'var(--error-color)',
                      padding: '0.5rem 1rem',
                      fontSize: 'clamp(0.9rem, 1.8vw, 1rem)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <FaTrash /> הסר תמונה
                  </button>

                  <button
                    {...getRootProps()}
                    style={{
                      ...styles.button,
                      background: 'rgba(127, 217, 87, 0.2)',
                      border: '2px solid var(--primary-color)',
                      padding: '0.5rem 1rem',
                      fontSize: 'clamp(0.9rem, 1.8vw, 1rem)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <FaUpload /> החלף תמונה
                  </button>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {uploadSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, var(--primary-color), var(--primary-light))',
                    color: '#0d1a0d',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '50px',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    boxShadow: '0 4px 16px rgba(127, 217, 87, 0.5)',
                    zIndex: 10,
                  }}
                >
                  ✨ נשמר בהצלחה!
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .profile-image-upload .spinner-optimized {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(127, 217, 87, 0.2);
          border-top-color: var(--primary-color);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ProfileImageUpload;
