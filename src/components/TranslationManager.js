import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Trash2, Globe, Save } from 'lucide-react';

const TranslationManager = ({ propertyId, onUpdate }) => {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    loadProperty();
  }, [propertyId]);

  const loadProperty = async () => {
    try {
      setLoading(true);
      const propertyRef = doc(db, "properties", propertyId);
      const propertySnap = await getDoc(propertyRef);
      
      if (propertySnap.exists()) {
        const data = propertySnap.data();
        setProperty({ id: propertyId, ...data });
      }
    } catch (error) {
      console.error('Error loading property:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTranslation = async (languageCode) => {
    try {
      const propertyRef = doc(db, "properties", propertyId);
      const descriptions = property.descriptions || {};
      
      // Удаляем перевод для конкретного языка
      delete descriptions[languageCode];
      
      await updateDoc(propertyRef, {
        descriptions: descriptions
      });
      
      // Обновляем локальное состояние
      setProperty(prev => ({
        ...prev,
        descriptions: descriptions
      }));
      
      if (onUpdate) {
        onUpdate();
      }
      
      console.log(`✅ Translation deleted for ${languageCode}`);
    } catch (error) {
      console.error('Error deleting translation:', error);
    }
  };

  const deleteAllTranslations = async () => {
    try {
      const propertyRef = doc(db, "properties", propertyId);
      
      await updateDoc(propertyRef, {
        descriptions: deleteField()
      });
      
      // Обновляем локальное состояние
      setProperty(prev => ({
        ...prev,
        descriptions: {}
      }));
      
      if (onUpdate) {
        onUpdate();
      }
      
      console.log('✅ All translations deleted');
    } catch (error) {
      console.error('Error deleting all translations:', error);
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading translations...</div>;
  }

  if (!property) {
    return <div>Property not found</div>;
  }

  const descriptions = property.descriptions || {};
  const availableLanguages = Object.keys(descriptions);
  const languageNames = {
    'ru': 'Русский',
    'en': 'English',
    'id': 'Bahasa Indonesia'
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Globe className="w-5 h-5" />
          {t?.translationManager?.title || 'Translation Manager'}
        </h3>
        {availableLanguages.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={deleteAllTranslations}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {t?.translationManager?.deleteAll || 'Delete All'}
          </Button>
        )}
      </div>

      {/* Original Description */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">
          {t?.translationManager?.originalDescription || 'Original Description'}
        </h4>
        <p className="text-sm text-gray-600 whitespace-pre-line">
          {property.description || t?.translationManager?.noDescription || 'No description'}
        </p>
      </div>

      {/* Available Translations */}
      {availableLanguages.length > 0 ? (
        <div className="space-y-3">
          <h4 className="font-medium">
            {t?.translationManager?.availableTranslations || 'Available Translations'}
          </h4>
          {availableLanguages.map(lang => (
            <div key={lang} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {languageNames[lang] || lang}
                  </Badge>
                  <span className="text-xs text-gray-500">({lang})</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteTranslation(lang)}
                  className="flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  {t?.translationManager?.delete || 'Delete'}
                </Button>
              </div>
              <p className="text-sm whitespace-pre-line">
                {descriptions[lang]}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Globe className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>{t?.translationManager?.noTranslations || 'No translations available'}</p>
          <p className="text-sm">
            {t?.translationManager?.noTranslationsHint || 'Translations will appear here when users view the property in different languages'}
          </p>
        </div>
      )}

      {/* Translation Stats */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">
          {t?.translationManager?.stats || 'Translation Statistics'}
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">
              {t?.translationManager?.totalTranslations || 'Total translations'}: 
            </span>
            <span className="font-medium ml-1">{availableLanguages.length}</span>
          </div>
          <div>
            <span className="text-gray-600">
              {t?.translationManager?.languages || 'Languages'}: 
            </span>
            <span className="font-medium ml-1">
              {availableLanguages.map(lang => languageNames[lang] || lang).join(', ')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslationManager;
