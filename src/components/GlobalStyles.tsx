import React from 'react';

const keyframes = `
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slide-in-up { from { opacity: 0; transform: translateY(50px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes float {
    0% { transform: translateY(0px); opacity: 0; }
    25% { opacity: 0.3; }
    50% { transform: translateY(-100vh); opacity: 0.5; }
    75% { opacity: 0.2; }
    100% { transform: translateY(-200vh); opacity: 0; }
  }

  .fade-in { animation: fade-in 0.6s ease-out forwards; }
  .animate-on-scroll { opacity: 0; transition: opacity 0.8s ease-out, transform 0.8s ease-out; }
  .animate-on-scroll.is-visible { opacity: 1; transform: translateY(0); animation: slide-in-up 0.8s ease-out forwards; }
  
  button:hover:not(:disabled), .action-card:hover, .icon-button:hover:not(:disabled), .header-cta:hover { transform: translateY(-3px) scale(1.02); }
  button:active:not(:disabled), .icon-button:active:not(:disabled) { transform: translateY(-1px) scale(1.01); }
  button:disabled { background-color: #555; cursor: not-allowed; opacity: 0.7; }
  
  input:focus, select:focus { outline: none; box-shadow: 0 0 0 3px rgba(127, 217, 87, 0.5); border-color: var(--primary-color); }

  /* Custom Scrollbar Styles */
  * {
    scrollbar-width: thin;
    scrollbar-color: var(--primary-color) rgba(26, 46, 26, 0.3);
  }

  *::-webkit-scrollbar {
    width: 12px;
    height: 12px;
  }

  *::-webkit-scrollbar-track {
    background: rgba(26, 46, 26, 0.3);
    border-radius: 10px;
  }

  *::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    border-radius: 10px;
    border: 2px solid rgba(26, 46, 26, 0.3);
  }

  *::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, var(--primary-light), var(--primary-color));
  }

  /* Ensure scrollable containers are visible */
  .story-book, .learning-center-container {
    overflow-y: auto !important;
    max-height: calc(100vh - 100px);
  }
`;

const GlobalStyles = () => {
  return <style>{keyframes}</style>;
};

export default GlobalStyles;