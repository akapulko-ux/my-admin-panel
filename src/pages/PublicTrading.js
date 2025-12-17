import React, { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Calculator, X, Copy, Moon, Sun } from 'lucide-react';

const PublicTrading = () => {
  const { language } = useLanguage();
  const t = translations[language];
  
  // Состояние для параметров калькулятора
  const [stopAmount, setStopAmount] = useState('');
  const [percent, setPercent] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Функция для расчета объема сделки
  const calculateVolume = () => {
    const stopAmountNum = parseFloat(stopAmount);
    const percentNum = parseFloat(percent);

    if (isNaN(stopAmountNum) || isNaN(percentNum) || percentNum === 0) {
      return;
    }

    // Формула: Сумма стопа / 0.0n% или 0.n%
    // Если процент с десятичной частью (например 1.103), убираем 0 после запятой -> 0.1103
    // 1 цифра → 0.000 + цифры (например: 2 → 0.0002)
    // 2 цифры → 0.00 + цифры (например: 22 → 0.0022)
    // 3 цифры → 0.0 + цифры (например: 222 → 0.0222)
    // 4 цифры → 0. + цифры (например: 1234 → 0.1234)
    let divisorString;
    if (percent.includes('.') || percent.includes(',')) {
      // Убираем точку/запятую из процента и добавляем к "0."
      const percentWithoutDot = percent.replace('.', '').replace(',', '');
      divisorString = "0." + percentWithoutDot;
    } else if (percent.length === 1) {
      // 1 цифра - добавляем к "0.000"
      divisorString = "0.000" + percent;
    } else if (percent.length === 2) {
      // 2 цифры - добавляем к "0.00"
      divisorString = "0.00" + percent;
    } else if (percent.length === 3) {
      // 3 цифры - добавляем к "0.0"
      divisorString = "0.0" + percent;
    } else if (percent.length === 4) {
      // 4 цифры - добавляем к "0."
      divisorString = "0." + percent;
    }
    
    const divisor = parseFloat(divisorString);
    const volume = stopAmountNum / divisor;
    setResult(volume.toFixed(1));
  };

  // Функция для очистки результата
  const clearResult = () => {
    setPercent('');
    setResult(null);
  };

  // Функция для копирования результата в буфер обмена
  const copyToClipboard = async () => {
    if (result) {
      try {
        await navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Сброс через 2 секунды
      } catch (err) {
        console.error('Ошибка при копировании:', err);
      }
    }
  };

  // Функция переключения темы
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
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
    <div className={`min-h-screen md:py-12 md:px-4 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
        : 'bg-gradient-to-br from-blue-50 to-indigo-100'
    }`}>
      <div className="container mx-auto max-w-4xl md:min-h-0 min-h-screen flex items-center">
        {/* Калькулятор */}
        <Card className={`shadow-xl md:rounded-lg rounded-none w-full md:border border-0 ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
        }`}>
          <CardHeader className="md:p-6 p-4">
            <div className="flex items-center justify-between">
              <CardTitle className={`flex items-center gap-2 md:text-2xl text-xl ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
              <Calculator className="md:h-6 md:w-6 h-5 w-5" />
              {t.trading?.volumeCalculator || 'Объем сделки'}
            </CardTitle>
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={isDarkMode ? 'Переключить на светлую тему' : 'Переключить на темную тему'}
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
            </div>
          </CardHeader>
          <CardContent className="md:space-y-6 space-y-4 md:p-6 p-4">
            {/* Поля ввода в одну строку */}
            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-6 gap-4">
              {/* Сумма стопа */}
              <div className="md:space-y-3 space-y-2">
                <Label htmlFor="stopAmount" className={`md:text-lg text-base font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {t.trading?.stopAmount || 'Сумма стопа'}
                </Label>
                <div className={`md:p-6 p-4 rounded-lg border-2 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <Input
                    id="stopAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={stopAmount}
                    onChange={(e) => setStopAmount(e.target.value)}
                    onWheel={(e) => e.target.blur()}
                    className={`w-full md:text-3xl text-2xl font-bold text-center border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-900'
                    }`}
                  />
                </div>
                <p className={`md:block hidden text-sm text-center ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {t.trading?.stopAmountHelp || 'Фиксированное значение стопа для расчетов'}
                </p>
              </div>

              {/* Процент */}
              <div className="md:space-y-3 space-y-2">
                <Label htmlFor="percent" className={`md:text-lg text-base font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {t.trading?.percent || 'Процент'}
                </Label>
                <div className={`relative md:p-6 p-4 rounded-lg border-2 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-green-50 border-green-200'
                }`}>
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
                    className={`w-full md:text-3xl text-2xl font-bold text-center border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none pr-12 ${
                      isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-900'
                    }`}
                  />
                  {percent && (
                    <button
                      onClick={clearResult}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors ${
                        isDarkMode 
                          ? 'hover:bg-gray-600' 
                          : 'hover:bg-green-200'
                      }`}
                      type="button"
                    >
                      <X className={`md:h-5 md:w-5 h-4 w-4 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                    </button>
                  )}
                </div>
                <p className={`md:block hidden text-sm text-center ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {t.trading?.percentHelp || 'Процент для расчета объема сделки'}
                </p>
              </div>
            </div>

            {/* Результат */}
            {result !== null && (
              <div className={`md:mt-6 mt-4 md:p-6 p-4 rounded-lg border-2 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600' 
                  : 'bg-primary/10 border-primary'
              }`}>
                <div className="text-center">
                  <p className={`text-sm mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {t.trading?.result || 'Объем сделки'}
                  </p>
                  <div className="relative flex items-center justify-center gap-3">
                    <p className={`md:text-4xl text-3xl font-bold ${
                      isDarkMode ? 'text-blue-400' : 'text-primary'
                    }`}>
                    {result}
                  </p>
                    <button
                      onClick={copyToClipboard}
                      className={`p-2 rounded-full transition-colors ${
                        copied 
                          ? 'bg-green-200 text-green-700' 
                          : isDarkMode
                            ? 'bg-gray-600 text-blue-400 hover:bg-gray-500'
                            : 'bg-primary/20 text-primary hover:bg-primary/30'
                      }`}
                      title={copied ? 'Скопировано!' : 'Копировать'}
                    >
                      <Copy className="md:h-5 md:w-5 h-4 w-4" />
                    </button>
                    {copied && (
                      <span className="absolute top-1/2 -translate-y-1/2 left-full -ml-[275px] text-sm text-green-600 font-medium animate-fade-in whitespace-nowrap">
                        Скопировано
                      </span>
                    )}
                  </div>
                  <p className={`md:block hidden text-sm mt-2 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
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

