
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Do not define process.env or polyfill it here, as per Gemini API guidelines.
// The execution context is assumed to provide process.env.API_KEY directly.

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
