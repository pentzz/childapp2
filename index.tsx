import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './src/components/App';
import GlobalStyles from './src/components/GlobalStyles';

// --- Speech Recognition Setup ---
// This can be used by components that need speech recognition capabilities.
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'he-IL';
    recognition.interimResults = false;
}

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <GlobalStyles />
            <App />
        </React.StrictMode>
    );
}
