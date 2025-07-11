import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Calculator, Download, Save, FolderOpen, Share2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { PDFDownloadLink } from '@react-pdf/renderer';
import Presentation from '../components/Presentation';
import { showSuccess, showError } from '../utils/notifications';

// Функция форматирования больших чисел
const formatLargeNumber = (number) => {
  if (!number && number !== 0) return '0';
  
  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1)}M`;
  } else if (number >= 1000) {
    return `${(number / 1000).toFixed(1)}K`;
  }
  return number.toLocaleString('ru-RU');
};

// Кастомный компонент тултипа
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white p-4 border rounded-lg shadow-lg">
      <p className="font-semibold mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div
          key={index}
          className="flex items-center gap-2 text-sm py-1"
          style={{ color: entry.color }}
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="font-medium">
            {entry.name}:
          </span>
          <span className="font-bold">
            ${formatLargeNumber(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

// Функция для расчета оптимального масштаба графика
const calculateOptimalDomain = (data, dataKey, padding = 0.15) => {
  if (!data || data.length === 0) return ['auto', 'auto'];
  
  const values = data.map(item => Number(item[dataKey]) || 0).filter(val => !isNaN(val));
  if (values.length === 0) return ['auto', 'auto'];
  
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  
  // Обработка случая, когда все значения равны нулю
  if (minValue === 0 && maxValue === 0) {
    return [-1000, 1000];
  }
  
  // Если все значения одинаковые или очень близкие
  if (maxValue - minValue < Math.abs(maxValue) * 0.05) {
    const center = maxValue || 0;
    const range = Math.max(Math.abs(center) * 0.4, 1000);
    return [center - range, center + range];
  }
  
  const range = maxValue - minValue;
  const paddingValue = range * padding;
  
  let domainMin = minValue - paddingValue;
  let domainMax = maxValue + paddingValue;
  
  // Убеждаемся, что диапазон достаточно широкий для хорошей визуализации
  const finalRange = domainMax - domainMin;
  const minDesiredRange = Math.max(Math.abs(maxValue) * 0.5, 2000);
  
  if (finalRange < minDesiredRange) {
    const center = (domainMin + domainMax) / 2;
    const expansion = (minDesiredRange - finalRange) / 2;
    domainMin = center - minDesiredRange / 2;
    domainMax = center + minDesiredRange / 2;
  }
  
  return [Math.floor(domainMin), Math.ceil(domainMax)];
};

// Функция для экспорта данных в CSV
const exportToCSV = (data, filename) => {
  // Заголовки для CSV
  const headers = [
    'Параметр',
    'Значение',
    '',
    'Год',
    'Прибыль за год',
    'Накопленная прибыль'
  ].join(',');

  // Данные инвестиций
  const investmentData = [
    ['Общие инвестиции', data.totalInvestment],
    ['Годовой доход от аренды', data.annualRentalIncome],
    ['Годовые расходы', data.annualExpenses],
    ['Чистая прибыль в год', data.annualNetProfit],
    ['ROI', `${data.roi.toFixed(2)}%`],
    ['Срок окупаемости', `${data.paybackPeriod.toFixed(1)} лет`],
  ].map(row => row.join(','));

  // Пустая строка для разделения
  const separator = ['', '', '', '', '', ''].join(',');

  // Данные графика
  const graphData = data.graphData.map(item => 
    ['', '', '', item.year, item.profit, item.accumulatedProfit].join(',')
  );

  // Объединяем все данные
  const csvContent = [
    headers,
    ...investmentData,
    separator,
    ...graphData
  ].join('\n');

  // Создаем и скачиваем файл
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const RoiCalculator = () => {
  console.log('RoiCalculator component rendered'); // Отладочный лог

  // Состояния для всех входных данных
  const [costData, setCostData] = useState({
    purchasePrice: '127500',
    renovationCosts: '15000',
    legalFees: '5000',
    additionalExpenses: '7500',
    investmentPeriod: '5',
  });

  const [rentalData, setRentalData] = useState({
    dailyRate: '85',
    occupancyRate: '75',
    otaCommission: '15',
    rentGrowthRate: '1',
    operationStartYear: '0',
  });

  const [expensesData, setExpensesData] = useState({
    maintenanceFees: '8',
    utilityBills: '6',
    annualTax: '4',
    propertyManagementFee: '18',
  });

  const [scenario, setScenario] = useState('base');
  const [calculationResults, setCalculationResults] = useState(null);

  const [savedCalculations, setSavedCalculations] = useState([]);
  const [calculationName, setCalculationName] = useState('');
  const [pdfLanguage, setPdfLanguage] = useState('en');
  const [isMobile, setIsMobile] = useState(false);

  // Детектор мобильного устройства
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Загрузка сохраненных расчетов при монтировании
  useEffect(() => {
    const saved = localStorage.getItem('roiCalculations');
    if (saved) {
      setSavedCalculations(JSON.parse(saved));
    }
  }, []);

  // Функция сохранения расчета
  const saveCalculation = () => {
    if (!calculationResults || !calculationName.trim()) return;

    const newCalculation = {
      id: Date.now(),
      name: calculationName,
      date: new Date().toLocaleDateString(),
      data: {
        costData,
        rentalData,
        expensesData,
        scenario,
        results: calculationResults
      }
    };

    const updatedCalculations = [...savedCalculations, newCalculation];
    setSavedCalculations(updatedCalculations);
    localStorage.setItem('roiCalculations', JSON.stringify(updatedCalculations));
    setCalculationName('');
  };

  // Функция загрузки расчета
  const loadCalculation = (calculation) => {
    const { data } = calculation;
    setCostData(data.costData);
    setRentalData(data.rentalData);
    setExpensesData(data.expensesData);
    setScenario(data.scenario);
    setCalculationResults(data.results);
  };

  // Функция удаления расчета
  const deleteCalculation = (id) => {
    const updatedCalculations = savedCalculations.filter(calc => calc.id !== id);
    setSavedCalculations(updatedCalculations);
    localStorage.setItem('roiCalculations', JSON.stringify(updatedCalculations));
  };

  // Функция создания публичной страницы
  const generatePublicPage = () => {
    if (!calculationResults) {
      showError('Сначала выполните расчет ROI');
      return;
    }

    try {
      const publicData = {
        id: Date.now(),
        data: {
          unitPrice: calculationResults.unitPrice,
          averageROI: calculationResults.averageROI,
          rentGrowthRate: calculationResults.rentGrowthRate,
          propertyManagementFee: calculationResults.propertyManagementFee,
          totalProjectedReturn: calculationResults.totalProjectedReturn,
          totalCashFlow: calculationResults.totalCashFlow,
          totalAppreciation: calculationResults.totalAppreciation,
          detailedProjection: calculationResults.detailedProjection,
          graphData: calculationResults.graphData,
          investmentPeriod: calculationResults.investmentPeriod,
          inputs: { costData, rentalData, expensesData }
        }
      };

      // Сохраняем данные для публичной страницы в localStorage
      localStorage.setItem(`publicROI_${publicData.id}`, JSON.stringify(publicData));
      
      // Открываем публичную страницу в новой вкладке
      const url = `/public-roi/${publicData.id}`;
      window.open(url, '_blank');
      
      showSuccess('Публичная страница создана и открыта в новой вкладке');
    } catch (error) {
      console.error('Ошибка при создании публичной страницы:', error);
      showError('Ошибка при создании публичной страницы');
    }
  };

  // Функция для расчета всех показателей
  const calculateInvestment = useCallback(() => {
    // Преобразуем все входные данные в числа и добавляем отладочные логи
    const purchasePrice = Number(costData.purchasePrice) || 0;
    const renovationCosts = Number(costData.renovationCosts) || 0;
    const legalFees = Number(costData.legalFees) || 0;
    const additionalExpenses = Number(costData.additionalExpenses) || 0;
    const investmentPeriod = Number(costData.investmentPeriod) || 5;
    
    const dailyRate = Number(rentalData.dailyRate) || 0;
    const occupancyRate = Number(rentalData.occupancyRate) || 0;
    const daysPerYear = 365; // Фиксированное значение дней в году
    const otaCommission = Number(rentalData.otaCommission) || 0;
    const rentGrowthRate = Number(rentalData.rentGrowthRate) || 0;
    const operationStartYear = Number(rentalData.operationStartYear) || 0;
    
    const maintenanceFees = Number(expensesData.maintenanceFees) || 0;
    const utilityBills = Number(expensesData.utilityBills) || 0;
    const annualTax = Number(expensesData.annualTax) || 0;
    const propertyManagementFee = Number(expensesData.propertyManagementFee) || 0;

    // Базовые расчеты
    const totalInvestment = purchasePrice + renovationCosts + legalFees + additionalExpenses;
    const initialAnnualRentalIncome = dailyRate * daysPerYear * (occupancyRate / 100) * (1 - otaCommission / 100);
    
    // Операционные расходы (без налогов)
    const initialOperationalExpenses = initialAnnualRentalIncome * (maintenanceFees + utilityBills + propertyManagementFee) / 100;
    const initialProfitBeforeTax = initialAnnualRentalIncome - initialOperationalExpenses;
    
    // Налоги рассчитываются от прибыли до налогов
    const initialTaxes = initialProfitBeforeTax * (annualTax / 100);
    const initialTotalExpenses = initialOperationalExpenses + initialTaxes;
    const initialNetProfit = initialProfitBeforeTax - initialTaxes;

    // Генерация данных для графика и детального анализа
    const graphData = [];
    const detailedProjection = [];
    let accumulatedProfit = -totalInvestment;
    let totalSpend = totalInvestment;
    let cumulativeIncome = 0;
    let cumulativeCashflow = -totalInvestment;
    
    for (let year = 1; year <= investmentPeriod; year++) {
      // Расчет дохода с учетом роста и периода начала эксплуатации
      const yearlyRentalIncome = year <= operationStartYear ? 0 : 
        initialAnnualRentalIncome * Math.pow(1 + rentGrowthRate / 100, year - 1 - operationStartYear);
      
      // Операционные расходы (без налогов)
      const yearlyOperationalExpenses = yearlyRentalIncome * (maintenanceFees + utilityBills + propertyManagementFee) / 100;
      const yearlyProfitBeforeTax = yearlyRentalIncome - yearlyOperationalExpenses;
      
      // Налоги рассчитываются от прибыли до налогов
      const yearlyTaxes = yearlyProfitBeforeTax * (annualTax / 100);
      const yearlyTotalExpenses = yearlyOperationalExpenses + yearlyTaxes;
      
      // Чистый доход
      const yearlyNetProfit = yearlyProfitBeforeTax - yearlyTaxes;
      
      // Накопленные значения
      accumulatedProfit += yearlyNetProfit;
      cumulativeIncome += yearlyRentalIncome;
      totalSpend += yearlyTotalExpenses;
      cumulativeCashflow += yearlyNetProfit;
      
      const yearData = {
        year: year,
        yearLabel: `${2025 + year}`,
        income: Math.round(yearlyRentalIncome),
        cumulativeIncome: Math.round(cumulativeIncome),
        spend: Math.round(yearlyTotalExpenses),
        cumulativeSpend: Math.round(totalSpend),
        cashflow: Math.round(yearlyNetProfit),
        cumulativeCashflow: Math.round(cumulativeCashflow),
        totalReturn: Math.round(yearlyNetProfit),
        accumulatedReturn: Math.round(accumulatedProfit),
        propertyValue: Math.round(totalInvestment)
      };
      
      graphData.push({
        year: `${2025 + year}`,
        profit: Math.round(yearlyNetProfit),
        accumulatedProfit: Math.round(accumulatedProfit),
        cashFlow: Math.round(yearlyNetProfit),
        totalReturns: Math.round(yearlyNetProfit)
      });
      
      detailedProjection.push(yearData);
    }

    // Расчет средних значений для инвестиционных показателей
    const averageROI = detailedProjection.length > 0 
      ? detailedProjection.reduce((sum, year) => sum + (year.totalReturn / totalInvestment * 100), 0) / detailedProjection.length 
      : 0;
    
    const finalCumulativeCashflow = detailedProjection[detailedProjection.length - 1]?.cumulativeCashflow || 0;
    
    setCalculationResults({
      totalInvestment,
      annualRentalIncome: initialAnnualRentalIncome,
      annualExpenses: initialTotalExpenses,
      annualNetProfit: initialNetProfit,
      roi: (initialNetProfit / totalInvestment) * 100,
      paybackPeriod: totalInvestment / initialNetProfit,
      graphData,
      unitPrice: totalInvestment,
      averageROI: averageROI,
      rentGrowthRate: rentGrowthRate,
      propertyManagementFee: propertyManagementFee,
      detailedProjection,
      totalProjectedReturn: accumulatedProfit + totalInvestment,
      finalPropertyValue: totalInvestment,
      totalCashFlow: cumulativeCashflow,
      investmentPeriod
    });
  }, [costData, rentalData, expensesData, scenario]);

  // Автоматический расчет при изменении данных
  useEffect(() => {
    calculateInvestment();
  }, [calculateInvestment]);

  // Добавляем эффект для отслеживания изменений в calculationResults
  useEffect(() => {
    if (calculationResults) {
      console.log('Updated calculation results:', calculationResults);
    }
  }, [calculationResults]);

  return (
    <div className={`container mx-auto ${isMobile ? 'p-4' : 'p-6'} space-y-6`}>
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="h-6 w-6" />
        <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>Калькулятор ROI</h1>
      </div>

      {/* Блок сохраненных расчетов */}
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">Сохраненные расчеты</h2>
        <div className="space-y-4">
          {savedCalculations.length > 0 ? (
            <div className="grid gap-4">
              {savedCalculations.map((calc) => (
                <div
                  key={calc.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium">{calc.name}</p>
                    <p className="text-sm text-muted-foreground">{calc.date}</p>
                  </div>
                  <div className={`${isMobile ? 'flex flex-col gap-2' : 'flex gap-2'}`}>
                    <Button
                      variant="outline"
                      size={isMobile ? "default" : "sm"}
                      onClick={() => loadCalculation(calc)}
                      className={isMobile ? 'h-12 w-full' : ''}
                    >
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size={isMobile ? "default" : "sm"}
                      onClick={() => deleteCalculation(calc.id)}
                      className={isMobile ? 'h-12 w-full' : ''}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">Нет сохраненных расчетов</p>
          )}
        </div>
      </Card>

      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} gap-6`}>
        {/* Блок затрат и инвестиций */}
        <Card className="p-4 space-y-4">
          <h2 className="text-xl font-semibold">Затраты и инвестиции</h2>
          
          <div className="space-y-2">
            <Label htmlFor="purchasePrice">Стоимость недвижимости ($)</Label>
            <Input
              id="purchasePrice"
              type="number"
              value={costData.purchasePrice}
              onChange={(e) => setCostData({...costData, purchasePrice: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="renovationCosts">Затраты на ремонт ($)</Label>
            <Input
              id="renovationCosts"
              type="number"
              value={costData.renovationCosts}
              onChange={(e) => setCostData({...costData, renovationCosts: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="legalFees">Юридические расходы ($)</Label>
            <Input
              id="legalFees"
              type="number"
              value={costData.legalFees}
              onChange={(e) => setCostData({...costData, legalFees: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalExpenses">Дополнительные расходы ($)</Label>
            <Input
              id="additionalExpenses"
              type="number"
              value={costData.additionalExpenses}
              onChange={(e) => setCostData({...costData, additionalExpenses: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="investmentPeriod">Период инвестирования (лет)</Label>
            <Input
              id="investmentPeriod"
              type="number"
              value={costData.investmentPeriod}
              onChange={(e) => setCostData({...costData, investmentPeriod: e.target.value})}
            />
          </div>
        </Card>

        {/* Блок арендного дохода */}
        <Card className="p-4 space-y-4">
          <h2 className="text-xl font-semibold">Арендный доход</h2>
          
          <div className="space-y-2">
            <Label htmlFor="dailyRate">Стоимость аренды в день ($)</Label>
            <Input
              id="dailyRate"
              type="number"
              value={rentalData.dailyRate}
              onChange={(e) => setRentalData({...rentalData, dailyRate: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="occupancyRate">Заполняемость (%)</Label>
            <Input
              id="occupancyRate"
              type="number"
              min="0"
              max="100"
              value={rentalData.occupancyRate}
              onChange={(e) => setRentalData({...rentalData, occupancyRate: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="otaCommission">Комиссия площадок (%)</Label>
            <Input
              id="otaCommission"
              type="number"
              min="0"
              max="100"
              value={rentalData.otaCommission}
              onChange={(e) => setRentalData({...rentalData, otaCommission: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rentGrowthRate">Годовой рост аренды (%)</Label>
            <Input
              id="rentGrowthRate"
              type="number"
              value={rentalData.rentGrowthRate}
              onChange={(e) => setRentalData({...rentalData, rentGrowthRate: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="operationStartYear">Начало эксплуатации через (год)</Label>
            <Input
              id="operationStartYear"
              type="number"
              min="0"
              value={rentalData.operationStartYear}
              onChange={(e) => setRentalData({...rentalData, operationStartYear: e.target.value})}
            />
          </div>
        </Card>

        {/* Блок операционных расходов */}
        <Card className="p-4 space-y-4">
          <h2 className="text-xl font-semibold">Операционные расходы</h2>
          
          <div className="space-y-2">
            <Label htmlFor="maintenanceFees">Обслуживание в год (%)</Label>
            <Input
              id="maintenanceFees"
              type="number"
              value={expensesData.maintenanceFees}
              onChange={(e) => setExpensesData({...expensesData, maintenanceFees: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="utilityBills">Коммунальные платежи в год (%)</Label>
            <Input
              id="utilityBills"
              type="number"
              value={expensesData.utilityBills}
              onChange={(e) => setExpensesData({...expensesData, utilityBills: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="annualTax">Налоги в год (%)</Label>
            <Input
              id="annualTax"
              type="number"
              value={expensesData.annualTax}
              onChange={(e) => setExpensesData({...expensesData, annualTax: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="propertyManagementFee">Комиссия управления (%)</Label>
            <Input
              id="propertyManagementFee"
              type="number"
              value={expensesData.propertyManagementFee}
              onChange={(e) => setExpensesData({...expensesData, propertyManagementFee: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scenario">Сценарий расчета</Label>
            <Select value={scenario} onValueChange={setScenario}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите сценарий" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="optimistic">Оптимистичный</SelectItem>
                <SelectItem value="base">Базовый</SelectItem>
                <SelectItem value="pessimistic">Пессимистичный</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className={`${isMobile ? 'flex flex-col gap-4' : 'flex flex-wrap items-center gap-4'}`}>
            <Button 
              onClick={calculateInvestment} 
              className={`bg-blue-600 hover:bg-blue-700 ${isMobile ? 'w-full h-12' : ''}`}
            >
              <Calculator className="mr-2 h-4 w-4" /> Рассчитать
            </Button>
          </div>
        </Card>
      </div>

      {calculationResults && (
        <div className="mt-8 p-6 bg-white rounded-2xl shadow-lg">
          <div className={`${isMobile ? 'flex flex-col gap-4' : 'flex justify-between items-start'} mb-6`}>
            <div>
              <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-800`}>
                Результаты расчета
              </h2>
              <p className="text-gray-500">
                На основе введенных данных и сценария "{scenario}"
              </p>
            </div>
            <div className={`${isMobile ? 'flex flex-col gap-4' : 'flex items-center gap-4'}`}>
              <div className={`${isMobile ? 'flex flex-col gap-2' : 'flex items-center gap-2'}`}>
                <Input
                  type="text"
                  placeholder="Название расчета"
                  value={calculationName}
                  onChange={(e) => setCalculationName(e.target.value)}
                  className={`${isMobile ? 'w-full' : 'w-48'}`}
                />
                <Button 
                  onClick={saveCalculation} 
                  size={isMobile ? "default" : "sm"} 
                  disabled={!calculationName.trim()}
                  className={isMobile ? 'h-12 w-full' : ''}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>

              <Button 
                onClick={() => exportToCSV({ ...calculationResults, graphData: calculationResults.graphData }, 'roi-analysis.csv')}
                variant="outline"
                size={isMobile ? "default" : "sm"}
                className={isMobile ? 'h-12 w-full' : ''}
              >
                <Download className="mr-2 h-4 w-4" /> Экспорт в CSV
              </Button>

              <div className={`${isMobile ? 'flex flex-col gap-2' : 'flex gap-2'}`}>
                <Button 
                  onClick={generatePublicPage}
                  variant="outline"
                  size={isMobile ? "default" : "sm"}
                  className={isMobile ? 'h-12 w-full' : ''}
                >
                  <Share2 className="mr-2 h-4 w-4" /> Создать публичную страницу
                </Button>
                
                <Button 
                  onClick={() => {
                    if (!calculationResults) {
                      showError('Сначала создайте расчет ROI');
                      return;
                    }
                    
                    // Получаем последний созданный ID из localStorage или создаем новый
                    const keys = Object.keys(localStorage).filter(key => key.startsWith('publicROI_'));
                    if (keys.length === 0) {
                      showError('Сначала создайте публичную страницу');
                      return;
                    }
                    
                    const lastKey = keys[keys.length - 1];
                    const id = lastKey.replace('publicROI_', '');
                    const url = `${window.location.origin}/public-roi/${id}`;
                    
                    navigator.clipboard.writeText(url).then(() => {
                      showSuccess('Ссылка скопирована в буфер обмена!');
                    }).catch(() => {
                      showError('Не удалось скопировать ссылку');
                    });
                  }}
                  variant="outline"
                  size={isMobile ? "default" : "sm"}
                  className={isMobile ? 'h-12 w-full' : ''}
                >
                  📋 Копировать ссылку
                </Button>
              </div>

              <div className={`${isMobile ? 'flex flex-col gap-2' : 'flex items-center gap-2'}`}>
                <Select value={pdfLanguage} onValueChange={setPdfLanguage}>
                  <SelectTrigger className={`${isMobile ? 'w-full h-12' : 'w-[120px]'}`}>
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ru">Русский</SelectItem>
                    <SelectItem value="id">Indonesian</SelectItem>
                  </SelectContent>
                </Select>
                <PDFDownloadLink
                  document={<Presentation 
                    data={calculationResults} 
                    inputs={{ costData, rentalData, expensesData }}
                    language={pdfLanguage}
                  />}
                  fileName={`investor-presentation-${pdfLanguage}.pdf`}
                  style={{ textDecoration: 'none' }}
                >
                  {({ loading }) => (
                    <Button 
                      variant="outline" 
                      size={isMobile ? "default" : "sm"} 
                      disabled={loading}
                      className={isMobile ? 'h-12 w-full' : ''}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {loading ? '...' : 'PDF'}
                    </Button>
                  )}
                </PDFDownloadLink>
              </div>
            </div>
          </div>

          {/* Investment Summary Cards */}
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'} gap-6 mb-8`}>
            <div className={`${isMobile ? 'p-4 bg-gray-50 rounded-lg' : ''}`}>
              <p className="text-sm text-muted-foreground">Общие инвестиции</p>
              <p className="text-lg font-semibold">${calculationResults.totalInvestment.toLocaleString()}</p>
            </div>
            
            <div className={`${isMobile ? 'p-4 bg-gray-50 rounded-lg' : ''}`}>
              <p className="text-sm text-muted-foreground">Годовой доход от аренды</p>
              <p className="text-lg font-semibold">${calculationResults.annualRentalIncome.toLocaleString()}</p>
            </div>
            
            <div className={`${isMobile ? 'p-4 bg-gray-50 rounded-lg' : ''}`}>
              <p className="text-sm text-muted-foreground">Годовые расходы</p>
              <p className="text-lg font-semibold">${calculationResults.annualExpenses.toLocaleString()}</p>
            </div>
            
            <div className={`${isMobile ? 'p-4 bg-gray-50 rounded-lg' : ''}`}>
              <p className="text-sm text-muted-foreground">Чистая прибыль в год</p>
              <p className="text-lg font-semibold">${calculationResults.annualNetProfit.toLocaleString()}</p>
            </div>
            
            <div className={`${isMobile ? 'p-4 bg-gray-50 rounded-lg' : ''}`}>
              <p className="text-sm text-muted-foreground">ROI</p>
              <p className="text-lg font-semibold">{calculationResults.roi.toFixed(2)}%</p>
            </div>
            
            <div className={`${isMobile ? 'p-4 bg-gray-50 rounded-lg' : ''}`}>
              <p className="text-sm text-muted-foreground">Срок окупаемости</p>
              <p className="text-lg font-semibold">{calculationResults.paybackPeriod.toFixed(1)} лет</p>
            </div>
          </div>

          {/* График */}
          <div className={`${isMobile ? 'h-[400px]' : 'h-96'} bg-gray-50 p-4 rounded-lg mt-8`}>
            <ResponsiveContainer width="100%" height="100%">
              {calculationResults.graphData && calculationResults.graphData.length > 0 ? (
                <AreaChart
                  data={calculationResults.graphData}
                  margin={isMobile ? {
                    top: 20, right: 15, left: 0, bottom: 60,
                  } : {
                    top: 20, right: 30, left: 20, bottom: 5,
                  }}
                >
                  <defs>
                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="accumulatedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis
                    dataKey="year"
                    label={isMobile ? null : { value: 'Период', position: 'bottom', offset: 20 }}
                    tick={{ 
                      fontSize: isMobile ? 10 : 12, 
                      angle: isMobile ? -45 : 0, 
                      textAnchor: isMobile ? 'end' : 'middle',
                      dy: isMobile ? 10 : 0
                    }}
                    interval={isMobile ? 0 : 3}
                    height={isMobile ? 80 : 60}
                  />
                  <YAxis
                    yAxisId="left"
                    tickFormatter={formatLargeNumber}
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    domain={calculateOptimalDomain(calculationResults.graphData, 'profit')}
                    width={isMobile ? 60 : 80}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={formatLargeNumber}
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    domain={(() => {
                      const rightAxisData = [];
                      calculationResults.graphData.forEach(item => {
                        rightAxisData.push(item.accumulatedProfit);
                        if (item.propertyValue) {
                          rightAxisData.push(item.propertyValue);
                        }
                      });
                      
                      if (rightAxisData.length === 0) return ['auto', 'auto'];
                      
                      const minValue = Math.min(...rightAxisData);
                      const maxValue = Math.max(...rightAxisData);
                      const range = maxValue - minValue;
                      const padding = range * 0.15;
                      
                      return [Math.floor(minValue - padding), Math.ceil(maxValue + padding)];
                    })()}
                    width={isMobile ? 70 : 90}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    wrapperStyle={{ outline: 'none' }}
                  />
                  <Legend
                    verticalAlign={isMobile ? "bottom" : "top"}
                    height={isMobile ? 48 : 36}
                    iconType="circle"
                    iconSize={isMobile ? 8 : 10}
                    wrapperStyle={isMobile ? { fontSize: '10px', paddingTop: '10px' } : undefined}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="profit"
                    name="Прибыль за год"
                    stroke="#8884d8"
                    strokeWidth={isMobile ? 1.5 : 2}
                    fill="url(#profitGradient)"
                    dot={{ r: isMobile ? 3 : 4, fill: '#8884d8' }}
                    activeDot={{ r: isMobile ? 5 : 6, fill: '#8884d8' }}
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="accumulatedProfit"
                    name="Накопленная прибыль"
                    stroke="#82ca9d"
                    strokeWidth={isMobile ? 1.5 : 2}
                    fill="url(#accumulatedGradient)"
                    dot={{ r: isMobile ? 3 : 4, fill: '#82ca9d' }}
                    activeDot={{ r: isMobile ? 5 : 6, fill: '#82ca9d' }}
                  />
                </AreaChart>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Нет данных для отображения графика
                </div>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoiCalculator; 