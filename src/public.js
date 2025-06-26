import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import StandalonePublicChessboard from './pages/StandalonePublicChessboard';

const root = ReactDOM.createRoot(document.getElementById('public-root'));
root.render(
  <React.StrictMode>
    <StandalonePublicChessboard />
  </React.StrictMode>
); 