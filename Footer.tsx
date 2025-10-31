import React from 'react';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    return (
        <footer className="app-footer no-print">
            <div className="footer-content">
                <img src="/logo.png" alt="לוגו גאון" className="footer-logo" />
                <p>&copy; {currentYear} ZBANG. כל הזכויות שמורות.</p>
            </div>
        </footer>
    );
};

export default Footer;
