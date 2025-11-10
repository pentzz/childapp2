/**
 * רישום Service Worker
 */

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('✅ Service Worker נרשם בהצלחה:', registration.scope);

          // בדיקה לעדכונים
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // גרסה חדשה זמינה
                  console.log('📦 עדכון חדש זמין');
                  if (confirm('גרסה חדשה של האפליקציה זמינה. האם לרענן?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('❌ רישום Service Worker נכשל:', error);
        });
    });
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error('❌ ביטול רישום Service Worker נכשל:', error);
      });
  }
}
