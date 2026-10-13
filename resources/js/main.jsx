import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Ensure clean root zoom style so resources/css/app.css is the single source of truth
if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('ui_zoom');
}
if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.style.zoom = '';
}

// + React 18 createRoot mount
const rootElement = document.getElementById('root');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}
