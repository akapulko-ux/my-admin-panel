import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { showError } from '../utils/notifications';
import toast from 'react-hot-toast';

const RegistrationRequestModal = ({ open, onClose }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    // Валидация названия компании
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Введите название компании';
    }

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Введите email';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Введите корректный email';
    }

    // Валидация телефона - только проверка на заполненность
    if (!formData.phone.trim()) {
      newErrors.phone = 'Введите номер телефона';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Форматируем данные перед отправкой
      const requestData = {
        ...formData,
        status: 'new',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'registrationRequests'), requestData);
      
      toast.success('Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.');
      
      // Очищаем форму
      setFormData({
        companyName: '',
        email: '',
        phone: ''
      });
      setErrors({});
      
      onClose();
    } catch (error) {
      console.error('Ошибка при отправке заявки:', error);
      showError('Не удалось отправить заявку. Пожалуйста, проверьте подключение к интернету и попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-2xl font-semibold mb-6">Заявка на регистрацию</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Название компании</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="ООО Строительная компания"
              error={errors.companyName}
              disabled={isLoading}
            />
            {errors.companyName && (
              <p className="text-sm text-destructive">{errors.companyName}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="company@example.com"
              error={errors.email}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Телефон</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+7 (999) 999-99-99"
              error={errors.phone}
              disabled={isLoading}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Отправка...' : 'Отправить заявку'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrationRequestModal; 