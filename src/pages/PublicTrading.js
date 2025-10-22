import React, { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Calculator, X } from 'lucide-react';

const PublicTrading = () => {
  const { language } = useLanguage();
  const t = translations[language];
  
  // Состояние для параметров калькулятора
  const [stopAmount, setStopAmount] = useState('');
  const [percent, setPercent] = useState('');
  const [result, setResult] = useState(null);

  // Функция для расчета объема сделки
  const calculateVolume = () => {
    const stopAmountNum = parseFloat(stopAmount);
    const percentNum = parseFloat(percent);

    if (isNaN(stopAmountNum) || isNaN(percentNum) || percentNum === 0) {
      return;
    }

    // Формула: Сумма стопа / 0.0n% или 0.n%
    // Если процент с десятичной частью (например 1.103), убираем 0 после запятой -> 0.1103
    // Если 1-3 цифры без запятой (например 2), добавляем к "0.0" -> 0.02
    // Если 4 цифры без запятой (например 1234), добавляем к "0." -> 0.1234
    let divisorString;
    if (percent.includes('.') || percent.includes(',')) {
      // Убираем точку/запятую из процента и добавляем к "0."
      const percentWithoutDot = percent.replace('.', '').replace(',', '');
      divisorString = "0." + percentWithoutDot;
    } else if (percent.length === 4) {
      // 4 цифры без запятой - добавляем к "0."
      divisorString = "0." + percent;
    } else {
      // 1-3 цифры без запятой - добавляем к "0.0"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 md:py-12 md:px-4">
      <div className="container mx-auto max-w-4xl md:min-h-0 min-h-screen flex items-center">
        {/* Калькулятор */}
        <Card className="shadow-xl md:rounded-lg rounded-none w-full md:border border-0">
          <CardHeader className="md:p-6 p-4">
            <CardTitle className="flex items-center gap-2 md:text-2xl text-xl">
              <Calculator className="md:h-6 md:w-6 h-5 w-5" />
              {t.trading?.volumeCalculator || 'Объем сделки'}
            </CardTitle>
          </CardHeader>
          <CardContent className="md:space-y-6 space-y-4 md:p-6 p-4">
            {/* Поля ввода в одну строку */}
            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-6 gap-4">
              {/* Сумма стопа */}
              <div className="md:space-y-3 space-y-2">
                <Label htmlFor="stopAmount" className="md:text-lg text-base font-semibold">
                  {t.trading?.stopAmount || 'Сумма стопа'}
                </Label>
                <div className="md:p-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <Input
                    id="stopAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={stopAmount}
                    onChange={(e) => setStopAmount(e.target.value)}
                    onWheel={(e) => e.target.blur()}
                    className="w-full md:text-3xl text-2xl font-bold text-center border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <p className="md:block hidden text-sm text-gray-500 text-center">
                  {t.trading?.stopAmountHelp || 'Фиксированное значение стопа для расчетов'}
                </p>
              </div>

              {/* Процент */}
              <div className="md:space-y-3 space-y-2">
                <Label htmlFor="percent" className="md:text-lg text-base font-semibold">
                  {t.trading?.percent || 'Процент'}
                </Label>
                <div className="relative md:p-6 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                  <Input
                    id="percent"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={percent}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Ограничиваем ввод до 4 цифр (включая десятичную точку)
                      if (value.length <= 4 || value.includes('.')) {
                        setPercent(value);
                      }
                    }}
                    onWheel={(e) => e.target.blur()}
                    className="w-full md:text-3xl text-2xl font-bold text-center border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none pr-12"
                  />
                  {percent && (
                    <button
                      onClick={clearResult}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-green-200 transition-colors"
                      type="button"
                    >
                      <X className="md:h-5 md:w-5 h-4 w-4 text-gray-500" />
                    </button>
                  )}
                </div>
                <p className="md:block hidden text-sm text-gray-500 text-center">
                  {t.trading?.percentHelp || 'Процент для расчета объема сделки'}
                </p>
              </div>
            </div>

            {/* Результат */}
            {result !== null && (
              <div className="md:mt-6 mt-4 md:p-6 p-4 bg-primary/10 rounded-lg border-2 border-primary">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    {t.trading?.result || 'Объем сделки'}
                  </p>
                  <p className="md:text-4xl text-3xl font-bold text-primary">
                    {result}
                  </p>
                  <p className="md:block hidden text-sm text-gray-500 mt-2">
                    {t.trading?.resultFormula || 'Формула: Сумма стопа / 0.0n%'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicTrading;

