import React, { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Calculator, Download, Share2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
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
import Presentation from './Presentation';
import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

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

const PropertyRoiCalculator = ({ propertyId, propertyData, onClose }) => {
  // Состояния для всех входных данных
  const [costData, setCostData] = useState({
    purchasePrice: propertyData?.price?.toString() || '',
    renovationCosts: '',
    legalFees: '',
    additionalExpenses: '',
    investmentPeriod: '',
  });

  const [rentalData, setRentalData] = useState({
    dailyRate: '',
    occupancyRate: '',
    rentGrowthRate: '',
    operationStartYear: '',
  });

  const [expensesData, setExpensesData] = useState({
    maintenanceFees: '',
    utilityBills: '',
    annualTax: '',
    propertyManagementFee: '',
    appreciationYear1: '',
    appreciationYear2: '',
    appreciationYear3: '',
  });

  const [scenario, setScenario] = useState('base');
  const [calculationResults, setCalculationResults] = useState(null);
  const [pdfLanguage, setPdfLanguage] = useState('en');
  const [hasSavedData, setHasSavedData] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Функция для показа уведомлений
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Детектор мобильного устройства
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Загрузка сохраненных данных при монтировании
  useEffect(() => {
    const loadSavedCalculation = async () => {
      try {
        const roiDoc = await getDoc(doc(db, "properties", propertyId, "calculations", "roi"));
        if (roiDoc.exists()) {
          const data = roiDoc.data();
          setCostData(data.costData);
          setRentalData(data.rentalData);
          setExpensesData(data.expensesData);
          setScenario(data.scenario);
          setCalculationResults(data.results);
          setHasSavedData(true);
        } else {
          // Если сохраненных данных нет, оставляем только цену недвижимости
          setCostData(prev => ({
            ...prev,
            purchasePrice: propertyData?.price?.toString() || ''
          }));
          setHasSavedData(false);
        }
      } catch (error) {
        console.error("Ошибка при загрузке расчета:", error);
        // В случае ошибки также оставляем только цену недвижимости
        setCostData(prev => ({
          ...prev,
          purchasePrice: propertyData?.price?.toString() || ''
        }));
        setHasSavedData(false);
      }
    };

    loadSavedCalculation();
  }, [propertyId, propertyData?.price]);

  // Функция сохранения расчета
  const saveCalculation = async () => {
    if (!calculationResults) return;

    try {
      const calculationData = {
        costData,
        rentalData,
        expensesData,
        scenario,
        results: calculationResults,
        updatedAt: new Date(),
      };

      await setDoc(doc(db, "properties", propertyId, "calculations", "roi"), calculationData);
      setHasSavedData(true);
      // Уведомление об успешном сохранении
      setNotification({ type: 'success', message: 'Расчет успешно сохранен!' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error("Ошибка при сохранении расчета:", error);
      setNotification({ type: 'error', message: 'Ошибка при сохранении расчета' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Функция создания публичной страницы
  const generatePublicPage = async () => {
    if (!calculationResults) {
      showNotification('Сначала выполните расчет ROI', 'error');
      return;
    }
    
    try {
      // Сохраняем данные в Firestore для публичной страницы
      const roiDocRef = doc(db, 'properties', propertyId, 'calculations', 'roi');
      
      const publicData = {
        costData,
        rentalData,
        expensesData,
        results: {
          ...calculationResults,
          maxInvestmentPeriod: Number(costData.investmentPeriod) || 5
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(roiDocRef, publicData);
      
      // Открываем публичную страницу в новой вкладке
      const url = `/public-roi/property/${propertyId}`;
      window.open(url, '_blank');
      
      showNotification('Публичная страница создана и открыта в новой вкладке', 'success');
    } catch (error) {
      console.error('Ошибка при создании публичной страницы:', error);
      showNotification('Ошибка при создании публичной страницы', 'error');
    }
  };

  // Функция для расчета всех показателей
  const calculateInvestment = useCallback(() => {
    // Проверяем, заполнены ли основные поля для расчета
    if (!costData.purchasePrice || !rentalData.dailyRate || !rentalData.occupancyRate) {
      setCalculationResults(null);
      return;
    }

    // Преобразуем все входные данные в числа
    const purchasePrice = Number(costData.purchasePrice) || 0;
    const renovationCosts = Number(costData.renovationCosts) || 0;
    const legalFees = Number(costData.legalFees) || 0;
    const additionalExpenses = Number(costData.additionalExpenses) || 0;
    const investmentPeriod = Number(costData.investmentPeriod) || 5;
    
    const dailyRate = Number(rentalData.dailyRate) || 0;
    const occupancyRate = Number(rentalData.occupancyRate) || 0;
    const daysPerYear = 365; // Фиксированное значение дней в году
    const rentGrowthRate = Number(rentalData.rentGrowthRate) || 0;
    const operationStartYear = Number(rentalData.operationStartYear) || 0;
    
    const maintenanceFees = Number(expensesData.maintenanceFees) || 0;
    const utilityBills = Number(expensesData.utilityBills) || 0;
    const annualTax = Number(expensesData.annualTax) || 0;
    const propertyManagementFee = Number(expensesData.propertyManagementFee) || 0;
    const appreciationYear1 = Number(expensesData.appreciationYear1) || 0;
    const appreciationYear2 = Number(expensesData.appreciationYear2) || 0;
    const appreciationYear3 = Number(expensesData.appreciationYear3) || 0;

    // Базовые расчеты
    const totalInvestment = purchasePrice + renovationCosts + legalFees + additionalExpenses;
    const initialAnnualRentalIncome = dailyRate * daysPerYear * (occupancyRate / 100);
    
    // Операционные расходы (без налогов)
    const initialOperationalExpenses = initialAnnualRentalIncome * (maintenanceFees + utilityBills + propertyManagementFee) / 100;
    const initialProfitBeforeTax = initialAnnualRentalIncome - initialOperationalExpenses;
    
    // Налоги рассчитываются от прибыли до налогов
    const initialTaxes = initialProfitBeforeTax * (annualTax / 100);
    const initialAnnualExpenses = initialOperationalExpenses + initialTaxes;

    // Применяем сценарий
    let scenarioMultiplier = 1;
    switch (scenario) {
      case 'pessimistic':
        scenarioMultiplier = 0.7;
        break;
      case 'optimistic':
        scenarioMultiplier = 1.3;
        break;
      default:
        scenarioMultiplier = 1;
    }

    // Расчет по годам с учетом роста
    let graphData = [];
    let totalProfit = 0;
    let accumulatedProfit = 0;
    let currentPropertyValue = totalInvestment;

    for (let year = 1; year <= investmentPeriod; year++) {
      const rentalIncome = year <= operationStartYear ? 0 : 
        initialAnnualRentalIncome * 
        Math.pow(1 + rentGrowthRate / 100, year - 1 - operationStartYear) * 
        scenarioMultiplier;
      
      // Операционные расходы (без налогов)
      const operationalExpenses = rentalIncome * (maintenanceFees + utilityBills + propertyManagementFee) / 100;
      const profitBeforeTax = rentalIncome - operationalExpenses;
      
      // Налоги рассчитываются от прибыли до налогов
      const taxes = profitBeforeTax * (annualTax / 100);
      const expenses = operationalExpenses + taxes;
      
      // Учитываем удорожание проекта только в первые 3 года
      let yearlyAppreciationRate = 0;
      if (year === 1) {
        yearlyAppreciationRate = appreciationYear1;
      } else if (year === 2) {
        yearlyAppreciationRate = appreciationYear2;
      } else if (year === 3) {
        yearlyAppreciationRate = appreciationYear3;
      }
      currentPropertyValue = currentPropertyValue * (1 + yearlyAppreciationRate / 100);
      
      const yearlyProfit = rentalIncome - expenses;
      accumulatedProfit += yearlyProfit;

      graphData.push({
        year: `Год ${year}`,
        profit: Math.round(yearlyProfit),
        accumulatedProfit: Math.round(accumulatedProfit),
        propertyValue: Math.round(currentPropertyValue)
      });

      totalProfit += yearlyProfit;
    }

    // Расчет ROI и срока окупаемости с учетом удорожания
    const annualNetProfit = (totalProfit / investmentPeriod);
    const totalAppreciation = currentPropertyValue - totalInvestment;
    const totalReturnWithAppreciation = accumulatedProfit + totalAppreciation;
    const roi = (annualNetProfit / totalInvestment) * 100;
    const totalRoi = (totalReturnWithAppreciation / totalInvestment) * 100;
    const paybackPeriod = totalInvestment / annualNetProfit;

    setCalculationResults({
      totalInvestment,
      annualRentalIncome: initialAnnualRentalIncome * scenarioMultiplier,
      annualExpenses: initialAnnualExpenses,
      annualNetProfit,
      roi,
      totalRoi,
      paybackPeriod,
      graphData,
      finalPropertyValue: currentPropertyValue,
      totalAppreciation,
      totalReturnWithAppreciation,
      appreciationYear1,
      appreciationYear2,
      appreciationYear3,
      maxInvestmentPeriod: investmentPeriod
    });
  }, [costData, rentalData, expensesData, scenario]);

  // Автоматический расчет при изменении данных
  useEffect(() => {
    calculateInvestment();
  }, [calculateInvestment]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* Уведомление */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[60] p-4 rounded-lg shadow-lg transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}
      
      <div className={`bg-white rounded-lg ${isMobile ? 'p-4' : 'p-6'} max-w-7xl w-full max-h-[90vh] overflow-y-auto`}>
        <div className={`${isMobile ? 'flex flex-col gap-4' : 'flex justify-between items-center'} mb-6`}>
          <div className="flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>Расчет ROI</h1>
          </div>
          <Button 
            onClick={onClose} 
            variant="ghost"
            className={isMobile ? 'self-end w-12 h-12' : ''}
          >
            ✕
          </Button>
        </div>

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
              <Label htmlFor="renovationCosts">Ремонт и обустройство ($)</Label>
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
              <Select
                value={costData.investmentPeriod}
                onValueChange={(value) => setCostData({...costData, investmentPeriod: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите период" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 лет</SelectItem>
                  <SelectItem value="10">10 лет</SelectItem>
                  <SelectItem value="20">20 лет</SelectItem>
                  <SelectItem value="30">30 лет</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Блок арендного дохода */}
          <Card className="p-4 space-y-4">
            <h2 className="text-xl font-semibold">Арендный доход</h2>
            
            <div className="space-y-2">
              <Label htmlFor="dailyRate">Стоимость за сутки ($)</Label>
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
                value={rentalData.occupancyRate}
                onChange={(e) => setRentalData({...rentalData, occupancyRate: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rentGrowthRate">Рост арендной платы в год (%)</Label>
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

          {/* Блок операционных показателей */}
          <Card className="p-4 space-y-4">
            <h2 className="text-xl font-semibold">Операционные показатели</h2>
            
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
              <Label htmlFor="propertyManagementFee">Управление недвижимостью (%)</Label>
              <Input
                id="propertyManagementFee"
                type="number"
                value={expensesData.propertyManagementFee}
                onChange={(e) => setExpensesData({...expensesData, propertyManagementFee: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appreciationYear1">Удорожание объекта в первый год (%)</Label>
              <Input
                id="appreciationYear1"
                type="number"
                value={expensesData.appreciationYear1}
                onChange={(e) => setExpensesData({...expensesData, appreciationYear1: e.target.value})}
                placeholder="Например: 5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appreciationYear2">Удорожание объекта во второй год (%)</Label>
              <Input
                id="appreciationYear2"
                type="number"
                value={expensesData.appreciationYear2}
                onChange={(e) => setExpensesData({...expensesData, appreciationYear2: e.target.value})}
                placeholder="Например: 3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appreciationYear3">Удорожание объекта в третий год (%)</Label>
              <Input
                id="appreciationYear3"
                type="number"
                value={expensesData.appreciationYear3}
                onChange={(e) => setExpensesData({...expensesData, appreciationYear3: e.target.value})}
                placeholder="Например: 2"
              />
            </div>

            <div className="space-y-2">
              <Label>Сценарий расчета</Label>
              <Select value={scenario} onValueChange={setScenario}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите сценарий" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pessimistic">Пессимистичный (70%)</SelectItem>
                  <SelectItem value="base">Реалистичный (100%)</SelectItem>
                  <SelectItem value="optimistic">Оптимистичный (130%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
        </div>

        {/* Информационное сообщение если поля не заполнены */}
        {!calculationResults && (
          <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              Для выполнения расчета заполните следующие обязательные поля:
            </h3>
            <ul className="text-blue-700 space-y-1">
              <li>• Стоимость недвижимости</li>
              <li>• Дневная ставка аренды</li>
              <li>• Процент заполняемости</li>
            </ul>
            <p className="text-sm text-blue-600 mt-2">
              Остальные поля заполняются по желанию для более точного расчета.
            </p>
          </div>
        )}

        {calculationResults && (
          <div className="mt-8 p-6 bg-white rounded-2xl shadow-lg">
            <div className={`${isMobile ? 'flex flex-col gap-4' : 'flex justify-between items-start'} mb-6`}>
              <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-800`}>
                Результаты расчета
              </h2>
              <div className={`${isMobile ? 'flex flex-col gap-4' : 'flex items-center gap-4'}`}>
                <Button 
                  onClick={saveCalculation} 
                  className={`bg-green-600 hover:bg-green-700 ${isMobile ? 'w-full h-12' : ''}`}
                >
                  {hasSavedData ? 'Обновить расчет' : 'Сохранить расчет'}
                </Button>

                <div className={`${isMobile ? 'flex flex-col gap-2' : 'flex gap-2'}`}>
                  <Button 
                    onClick={generatePublicPage}
                    variant="outline"
                    className={isMobile ? 'w-full h-12' : ''}
                  >
                    <Share2 className="mr-2 h-4 w-4" /> Создать публичную страницу
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      const url = `${window.location.origin}/public-roi/property/${propertyId}`;
                      navigator.clipboard.writeText(url).then(() => {
                        showNotification('Ссылка скопирована в буфер обмена!', 'success');
                      }).catch(() => {
                        showNotification('Не удалось скопировать ссылку', 'error');
                      });
                    }}
                    variant="outline"
                    className={isMobile ? 'w-full h-12' : ''}
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
                        disabled={loading}
                        className={isMobile ? 'w-full h-12' : ''}
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
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Общие инвестиции</p>
                <p className="text-lg font-semibold">${calculationResults.totalInvestment.toLocaleString()}</p>
              </Card>
              
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Годовой доход от аренды</p>
                <p className="text-lg font-semibold">${calculationResults.annualRentalIncome.toLocaleString()}</p>
              </Card>
              
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Годовые расходы</p>
                <p className="text-lg font-semibold">${calculationResults.annualExpenses.toLocaleString()}</p>
              </Card>
              
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Чистая прибыль в год</p>
                <p className="text-lg font-semibold">${calculationResults.annualNetProfit.toLocaleString()}</p>
              </Card>
              
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">ROI</p>
                <p className="text-lg font-semibold">{calculationResults.roi.toFixed(2)}%</p>
              </Card>
              
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Срок окупаемости</p>
                <p className="text-lg font-semibold">{calculationResults.paybackPeriod.toFixed(1)} лет</p>
              </Card>
              
              {calculationResults.totalRoi && (
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground">Общий ROI за период</p>
                  <p className="text-lg font-semibold">{calculationResults.totalRoi.toFixed(2)}%</p>
                </Card>
              )}
              
                              {calculationResults.totalAppreciation && (calculationResults.appreciationYear1 > 0 || calculationResults.appreciationYear2 > 0 || calculationResults.appreciationYear3 > 0) && (
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground">Удорожание недвижимости</p>
                  <p className="text-lg font-semibold">${calculationResults.totalAppreciation.toLocaleString()}</p>
                </Card>
              )}
              
                              {calculationResults.finalPropertyValue && (calculationResults.appreciationYear1 > 0 || calculationResults.appreciationYear2 > 0 || calculationResults.appreciationYear3 > 0) && (
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground">Финальная стоимость недвижимости</p>
                  <p className="text-lg font-semibold">${calculationResults.finalPropertyValue.toLocaleString()}</p>
                </Card>
              )}
            </div>

            {/* Chart */}
            <div className={`${isMobile ? 'h-[400px]' : 'h-96'} bg-gray-50 p-4 rounded-lg`}>
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
                      <linearGradient id="propertyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff7300" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ff7300" stopOpacity={0.1}/>
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
                          if ((calculationResults.appreciationYear1 > 0 || calculationResults.appreciationYear2 > 0 || calculationResults.appreciationYear3 > 0) && item.propertyValue) {
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
                    {(calculationResults.appreciationYear1 > 0 || calculationResults.appreciationYear2 > 0 || calculationResults.appreciationYear3 > 0) && (
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="propertyValue"
                        name="Стоимость недвижимости"
                        stroke="#ff7300"
                        strokeWidth={isMobile ? 1.5 : 2}
                        fill="url(#propertyGradient)"
                        dot={{ r: isMobile ? 3 : 4, fill: '#ff7300' }}
                        activeDot={{ r: isMobile ? 5 : 6, fill: '#ff7300' }}
                      />
                    )}
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
    </div>
  );
};

export default PropertyRoiCalculator; 