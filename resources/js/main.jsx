import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// + React 18 createRoot mount
const rootElement = document.getElementById('root');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}
