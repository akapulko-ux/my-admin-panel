import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import PublicChessboard from './PublicChessboard';
import ChessboardOverview from './ChessboardOverview';

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
    <Router>
      <Routes>
        <Route path="/public/index.html" element={<PublicChessboardWrapper />} />
        <Route path="*" element={<Navigate to="/public/index.html" />} />
      </Routes>
    </Router>
  );
};

export default StandalonePublicChessboard; 