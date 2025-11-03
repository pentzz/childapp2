import React, { useState, useEffect } from 'react';

const THEMED_CHARS = 'אבגדהוזחטיכלמנסעפצקרשת1234567890'.split('');

interface LoaderProps {
    message: string;
}

const Loader: React.FC<LoaderProps> = ({ message }) => {
    const [char, setChar] = useState('א');

    useEffect(() => {
        const interval = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * THEMED_CHARS.length);
            setChar(THEMED_CHARS[randomIndex]);
        }, 150); // Change character quickly for a dynamic feel

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="themed-loader">
            <div className="loader-char">{char}</div>
            <p className="loader-message">{message}</p>
        </div>
    );
};

export default Loader;
