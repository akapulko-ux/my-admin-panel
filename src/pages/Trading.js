import React, { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Calculator, Copy, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

const Trading = () => {
  const { language } = useLanguage();
  const t = translations[language];
  
  // Состояние для параметров калькулятора
  const [stopAmount, setStopAmount] = useState('');
  const [percent, setPercent] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Функция для копирования публичной ссылки
  const copyPublicLink = () => {
    const publicUrl = `${window.location.origin}/public-trading`;
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      toast.success(t.trading?.linkCopied || 'Ссылка скопирована');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error(t.trading?.linkCopyError || 'Ошибка копирования ссылки');
    });
  };

  // Функция для расчета объема сделки
  const calculateVolume = () => {
    const stopAmountNum = parseFloat(stopAmount);
    const percentNum = parseFloat(percent);

    if (isNaN(stopAmountNum) || isNaN(percentNum) || percentNum === 0) {
      return;
    }

    // Формула: Сумма стопа / 0.0n%
    // Если процент с десятичной частью (например 1.103), убираем 0 после запятой -> 0.1103
    // Если целое число (например 2), оставляем 0 -> 0.02
    let divisorString;
    if (percent.includes('.') || percent.includes(',')) {
      // Убираем точку/запятую из процента и добавляем к "0."
      const percentWithoutDot = percent.replace('.', '').replace(',', '');
      divisorString = "0." + percentWithoutDot;
    } else {
      // Целое число - добавляем к "0.0"
      divisorString = "0.0" + percent;
    }
    
    const divisor = parseFloat(divisorString);
    const volume = stopAmountNum / divisor;
    setResult(volume.toFixed(2));
  };

  // Функция для очистки результата
  const clearResult = () => {
    setPercent('');
    setResult(null);
  };

  // Автоматический расчет при изменении процента
  useEffect(() => {
    if (stopAmount && percent) {
      calculateVolume();
    } else {
      setResult(null);
    }
  }, [stopAmount, percent]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          {t.trading?.title || 'Трейдинг'}
        </h1>
        <p className="text-gray-600">
          {t.trading?.subtitle || 'Инструменты для расчета параметров сделок'}
        </p>
      </div>

      {/* Секция: Объем сделки */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              {t.trading?.volumeCalculator || 'Объем сделки'}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={copyPublicLink}
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  {t.trading?.copied || 'Скопировано'}
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  {t.trading?.copyPublicLink || 'Копировать ссылку'}
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Поля ввода в одну строку */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Сумма стопа */}
            <div className="space-y-3">
              <Label htmlFor="stopAmount" className="text-lg font-semibold">
                {t.trading?.stopAmount || 'Сумма стопа'}
              </Label>
              <div className="p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                <Input
                  id="stopAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={stopAmount}
                  onChange={(e) => setStopAmount(e.target.value)}
                  onWheel={(e) => e.target.blur()}
                  className="w-full text-3xl font-bold text-center border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <p className="text-sm text-gray-500 text-center">
                {t.trading?.stopAmountHelp || 'Фиксированное значение стопа для расчетов'}
              </p>
            </div>

            {/* Процент */}
            <div className="space-y-3">
              <Label htmlFor="percent" className="text-lg font-semibold">
                {t.trading?.percent || 'Процент'}
              </Label>
              <div className="relative p-6 bg-green-50 rounded-lg border-2 border-green-200">
                <Input
                  id="percent"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={percent}
                  onChange={(e) => setPercent(e.target.value)}
                  onWheel={(e) => e.target.blur()}
                  className="w-full text-3xl font-bold text-center border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none pr-12"
                />
                {percent && (
                  <button
                    onClick={clearResult}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-green-200 transition-colors"
                    type="button"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-500 text-center">
                {t.trading?.percentHelp || 'Процент для расчета объема сделки'}
              </p>
            </div>
          </div>

          {/* Результат */}
          {result !== null && (
            <div className="mt-6 p-6 bg-primary/10 rounded-lg border-2 border-primary">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  {t.trading?.result || 'Объем сделки'}
                </p>
                <p className="text-4xl font-bold text-primary">
                  {result}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {t.trading?.resultFormula || 'Формула: Сумма стопа / 0.0n%'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Trading;

