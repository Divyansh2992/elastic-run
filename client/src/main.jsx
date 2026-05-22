import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Load leaflet.heat from CDN into window.L
const script = document.createElement('script');
script.src = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js';
script.async = true;
document.head.appendChild(script);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
