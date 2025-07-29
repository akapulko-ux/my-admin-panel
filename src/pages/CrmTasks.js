import React from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';

const CrmTasks = () => {
  const { language } = useLanguage();
  const nav = translations[language].navigation;

  return (
    <div className="p-6">
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{nav.tasks}</h1>
        <p className="text-gray-600 text-lg">
          Эта страница находится в разработке
        </p>
        <p className="text-gray-500 mt-2">
          Здесь будет реализован функционал управления задачами
        </p>
      </div>
    </div>
  );
};

export default CrmTasks;