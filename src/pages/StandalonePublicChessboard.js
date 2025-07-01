import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import PublicChessboard from './PublicChessboard';
import ChessboardOverview from './ChessboardOverview';
import { LanguageProvider } from '../lib/LanguageContext';
import { chessboardTranslations } from '../lib/chessboardTranslations';

const PublicChessboardWrapper = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  
  if (!id) {
    return <div>Ошибка: ID шахматки не указан</div>;
  }
  
  return <PublicChessboard publicId={id} />;
};

const StandalonePublicChessboard = () => {
  return (
    <LanguageProvider>
    <Router>
      <Routes>
        <Route path="/public/index.html" element={<PublicChessboardWrapper />} />
          <Route path="/chessboard-overview/:publicId" element={<ChessboardOverview />} />
        <Route path="*" element={<Navigate to="/public/index.html" />} />
      </Routes>
    </Router>
    </LanguageProvider>
  );
};

export default StandalonePublicChessboard; 