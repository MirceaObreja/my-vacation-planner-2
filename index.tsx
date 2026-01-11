
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log("App initialization started...");

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Critical Error: Root element #root not found in DOM.");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("React app mounted successfully.");
  } catch (error) {
    console.error("Failed to render React app:", error);
  }
}
