import React, { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { db } from '../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';

const QuickAddDealForm = ({ onDealAdded, onCancel }) => {
  const { language } = useLanguage();
  const t = translations[language].deals;
  
  const [newDeal, setNewDeal] = useState({
    name: '',
    amount: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    companyName: '',
    companyAddress: ''
  });

  const handleInputChange = useCallback((field, value) => {
    setNewDeal(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleAmountChange = useCallback((e) => {
    const value = e.target.value.replace(/[^\d]/g, ''); // Only numbers
    handleInputChange('amount', value);
  }, [handleInputChange]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newDeal.name.trim()) {
      toast.error('Введите название сделки');
      return;
    }
    
    try {
      // Create new deal object for Firebase
      const dealData = {
        name: newDeal.name,
        contactName: newDeal.contactName,
        contactPhone: newDeal.contactPhone,
        contactEmail: newDeal.contactEmail,
        companyName: newDeal.companyName,
        companyAddress: newDeal.companyAddress,
        amount: parseFloat(newDeal.amount) || 0,
        stage: 'first-contact', // New deals start in first contact
        hasTask: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Save to Firebase
      const docRef = await addDoc(collection(db, 'crm_deals'), dealData);
      
      // Create deal object for local state
      const deal = {
        id: docRef.id,
        ...dealData,
        contact: [newDeal.contactName, newDeal.companyName].filter(Boolean).join(', '),
        time: `Сегодня ${new Date().toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit'
        })}`
      };
      
      toast.success('Сделка успешно добавлена');
      onDealAdded(deal);
      
    } catch (error) {
      console.error('Error saving deal:', error);
      toast.error('Ошибка при сохранении сделки');
    }
  };

  const resetAndCancel = () => {
    setNewDeal({
      name: '',
      amount: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      companyName: '',
      companyAddress: ''
    });
    onCancel();
  };

  return (
    <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder={t.dealNamePlaceholder}
          value={newDeal.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm"
          required
          autoFocus
        />
        
        <input
          type="text"
          placeholder="Rp0"
          value={newDeal.amount}
          onChange={handleAmountChange}
          className="w-full px-3 py-2 border rounded-lg text-sm"
        />
        
        <div className="grid grid-cols-1 gap-3">
          <input
            type="text"
            placeholder={t.contactName}
            value={newDeal.contactName}
            onChange={(e) => handleInputChange('contactName', e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          />
          <input
            type="tel"
            placeholder={t.contactPhone}
            value={newDeal.contactPhone}
            onChange={(e) => handleInputChange('contactPhone', e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          />
        </div>
        
        <input
          type="email"
          placeholder={t.contactEmail}
          value={newDeal.contactEmail}
          onChange={(e) => handleInputChange('contactEmail', e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm"
        />
        
        <div className="grid grid-cols-1 gap-3">
          <input
            type="text"
            placeholder={t.companyName}
            value={newDeal.companyName}
            onChange={(e) => handleInputChange('companyName', e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          />
          <input
            type="text"
            placeholder={t.companyAddress}
            value={newDeal.companyAddress}
            onChange={(e) => handleInputChange('companyAddress', e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          />
        </div>
        
        <div className="flex gap-2 pt-2">
          <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700">
            {t.add}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={resetAndCancel}
          >
            {t.cancel}
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm"
            className="ml-auto"
          >
            Настройки ⚙
          </Button>
        </div>
      </form>
    </div>
  );
};

export default QuickAddDealForm;