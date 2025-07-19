import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Функция форматирования чисел
const formatCurrency = (number) => {
  if (!number && number !== 0) return '$0';
  return `$${number.toLocaleString()}`;
};

const formatPercentage = (number) => {
  if (!number && number !== 0) return '0%';
  return `${number.toFixed(2)}%`;
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

const PublicRoiPage = () => {
  const { id } = useParams();
  const { language, changeLanguage } = useLanguage();
  const [data, setData] = useState(null);
  const [chartView, setChartView] = useState('totalReturns');
  const [timeframe, setTimeframe] = useState('5 Years');
  const [scenario, setScenario] = useState('realistic');
  const [maxPeriod, setMaxPeriod] = useState(30);

  // Получаем переводы для текущего языка
  const t = useMemo(() => translations[language] || translations.en, [language]);

  // Отладочный useEffect
  useEffect(() => {
    console.log('Current language:', language);
    console.log('Available translations:', Object.keys(translations));
    console.log('Current translations:', t);
  }, [language, t]);

  const handleLanguageChange = (newLang) => {
    console.log('Changing language to:', newLang);
    changeLanguage(newLang);
  };

  // Коэффициенты для разных сценариев
  const scenarioMultipliers = {
    pessimistic: {
      occupancyRate: 0.8, // 80% от базового значения
      rentGrowthRate: 0.7, // 70% от базового значения
      annualAppreciation: 0.7, // 70% от базового значения
    },
    realistic: {
      occupancyRate: 1, // 100% - базовое значение
      rentGrowthRate: 1,
      annualAppreciation: 1,
    },
    optimistic: {
      occupancyRate: 1.1, // 110% от базового значения
      rentGrowthRate: 1.3, // 130% от базового значения
      annualAppreciation: 1.3,
    },
  };

  useEffect(() => {
    if (id) {
      const savedData = localStorage.getItem(`publicROI_${id}`);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setData(parsedData);
        
        // Устанавливаем максимальный период из результатов расчета
        if (parsedData.results?.maxInvestmentPeriod) {
          setMaxPeriod(Number(parsedData.results.maxInvestmentPeriod));
          // Устанавливаем начальный период не больше максимального
          setTimeframe(`${Math.min(5, parsedData.results.maxInvestmentPeriod)} Years`);
        }
      }
    }
  }, [id]);

  // Получаем данные для текущего выбранного периода (мемоизируем для производительности)
  const currentData = useMemo(() => {
    if (!data || !data.data) return null;
    
    const roiData = data.data;

    // Функция для пересчета данных для выбранного периода
    const recalculateDataForPeriod = (years) => {
      if (!roiData.inputs) return roiData;

      const { costData, rentalData, expensesData } = roiData.inputs;

      // Преобразуем данные
      const purchasePrice = Number(costData.purchasePrice) || 0;
      const renovationCosts = Number(costData.renovationCosts) || 0;
      const legalFees = Number(costData.legalFees) || 0;
      const additionalExpenses = Number(costData.additionalExpenses) || 0;
      
      const dailyRate = Number(rentalData.dailyRate) || 0;
      const baseOccupancyRate = Number(rentalData.occupancyRate) || 0;
      const daysPerYear = Number(rentalData.daysPerYear) || 365;

      const maintenanceFees = Number(expensesData.maintenanceFees) || 0;
      const utilityBills = Number(expensesData.utilityBills) || 0;
      const annualTax = Number(expensesData.annualTax) || 0;
      const propertyManagementFee = Number(expensesData.propertyManagementFee) || 0;
      const baseAnnualAppreciation = Number(expensesData.annualAppreciation) || 0;
      const baseRentGrowthRate = Number(expensesData.rentGrowthRate) || 0;
      const operationStartYear = Number(rentalData.operationStartYear) || 0;

      // Применяем множители сценария
      const occupancyRate = baseOccupancyRate * scenarioMultipliers[scenario].occupancyRate;
      const annualAppreciation = baseAnnualAppreciation * scenarioMultipliers[scenario].annualAppreciation;
      const rentGrowthRate = baseRentGrowthRate * scenarioMultipliers[scenario].rentGrowthRate;

      // Базовые расчеты
      const totalInvestment = purchasePrice + renovationCosts + legalFees + additionalExpenses;
      const initialAnnualRentalIncome = dailyRate * daysPerYear * (occupancyRate / 100);
      
      // Операционные расходы (без налогов)
      const initialOperationalExpenses = initialAnnualRentalIncome * (maintenanceFees + utilityBills + propertyManagementFee) / 100;
      const initialProfitBeforeTax = initialAnnualRentalIncome - initialOperationalExpenses;
      
      // Налоги рассчитываются от прибыли до налогов
      const initialTaxes = initialProfitBeforeTax * (annualTax / 100);
      const initialAnnualExpenses = initialOperationalExpenses + initialTaxes;

      // Пересчет для выбранного периода
      const graphData = [];
      const detailedProjection = [];
      let accumulatedProfit = -totalInvestment;
      let currentPropertyValue = totalInvestment;
      let cumulativeIncome = 0;
      let totalSpend = totalInvestment;
      let cumulativeCashflow = -totalInvestment;
      let cumulativeAppreciation = 0;
      
      for (let year = 1; year <= years; year++) {
        // Расчет удорожания для текущего года
        let yearlyAppreciationRate = 0;
        if (year === 1) {
          yearlyAppreciationRate = annualAppreciation;
        } else if (year === 2) {
          yearlyAppreciationRate = annualAppreciation;
        } else if (year === 3) {
          yearlyAppreciationRate = annualAppreciation;
        }

        // Расчет стоимости недвижимости с учетом удорожания
        const previousPropertyValue = currentPropertyValue;
        currentPropertyValue = currentPropertyValue * (1 + yearlyAppreciationRate / 100);
        const yearlyAppreciation = currentPropertyValue - previousPropertyValue;
        cumulativeAppreciation += yearlyAppreciation;

        // Расчет дохода от аренды
        const rentalIncome = year <= operationStartYear ? 0 :
          initialAnnualRentalIncome * Math.pow(1 + rentGrowthRate / 100, year - 1 - operationStartYear);
        
        // Операционные расходы (без налогов)
        const operationalExpenses = rentalIncome * (maintenanceFees + utilityBills + propertyManagementFee) / 100;
        const profitBeforeTax = rentalIncome - operationalExpenses;
        
        // Налоги рассчитываются от прибыли до налогов
        const taxes = profitBeforeTax * (annualTax / 100);
        const expenses = operationalExpenses + taxes;
        const totalReturn = rentalIncome - expenses + yearlyAppreciation;
        
        accumulatedProfit += totalReturn;
        cumulativeIncome += rentalIncome;
        totalSpend += expenses;
        cumulativeCashflow += (rentalIncome - expenses);
        
        const yearData = {
          year: year,
          yearLabel: `${2025 + year}`,
          income: Math.round(rentalIncome),
          cumulativeIncome: Math.round(cumulativeIncome + cumulativeAppreciation),
          spend: Math.round(expenses),
          cumulativeSpend: Math.round(totalSpend),
          cashflow: Math.round(rentalIncome - expenses),
          cumulativeCashflow: Math.round(cumulativeCashflow),
          appreciation: Math.round(yearlyAppreciation),
          propertyValue: Math.round(currentPropertyValue),
          accumulatedReturn: Math.round(accumulatedProfit),
          totalReturn: Math.round(totalReturn)
        };
        
        graphData.push({
          year: `${2025 + year}`,
          profit: Math.round(rentalIncome - expenses),
          accumulatedProfit: Math.round(accumulatedProfit),
          cashFlow: Math.round(rentalIncome - expenses),
          appreciation: Math.round(yearlyAppreciation),
          totalReturns: Math.round(totalReturn)
        });
        
        detailedProjection.push(yearData);
      }

      // Расчет средних значений для инвестиционных показателей
      const averageROI = detailedProjection.length > 0 
        ? (detailedProjection.reduce((sum, year) => sum + year.totalReturn, 0) / detailedProjection.length) / totalInvestment * 100
        : 0;
      
      const finalCumulativeCashflow = detailedProjection[detailedProjection.length - 1]?.cumulativeCashflow || 0;
      const finalPropertyValue = detailedProjection[detailedProjection.length - 1]?.propertyValue || totalInvestment;
      const totalProjectedReturn = finalCumulativeCashflow + (finalPropertyValue - totalInvestment);

      return {
        ...roiData,
        averageROI: averageROI,
        detailedProjection,
        graphData,
        totalProjectedReturn,
        totalCashFlow: finalCumulativeCashflow,
        totalAppreciation: finalPropertyValue - totalInvestment,
        investmentPeriod: years,
        unitPrice: totalInvestment,
        rentGrowthRate: baseRentGrowthRate,
        propertyManagementFee: propertyManagementFee + maintenanceFees + utilityBills + annualTax,
        appreciationYear1: baseAnnualAppreciation,
        appreciationYear2: baseAnnualAppreciation,
        appreciationYear3: baseAnnualAppreciation
      };
    };

    // Получаем количество лет из выбранного периода
    const getYearsFromTimeframe = (timeframe) => {
      switch (timeframe) {
        case '5 Years': return 5;
        case '10 Years': return 10;
        case '20 Years': return 20;
        case '30 Years': return 30;
        default: return 5;
      }
    };

    return recalculateDataForPeriod(getYearsFromTimeframe(timeframe));
  }, [data, timeframe, scenario]);

  // Функция для получения доступных периодов
  const getAvailablePeriods = () => {
    const allPeriods = [5, 10, 20, 30];
    return allPeriods.filter(period => period <= maxPeriod);
  };

  if (!data || !data.data || !currentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.dataNotFound}</h2>
          <p className="text-gray-600">{t.publicRoiNotAvailable}</p>
        </div>
      </div>
    );
  }

  // Подготовка данных для графика
  const getChartData = () => {
    if (!currentData.graphData || currentData.graphData.length === 0) {
      return [];
    }
    return currentData.graphData.map(item => ({
      year: item.year,
      totalReturns: item.totalReturns,
      cashFlow: item.cashFlow,
      appreciation: item.appreciation
    }));
  };

  const getCurrentLineKey = () => {
    switch(chartView) {
      case 'cashFlow': return 'cashFlow';
      case 'appreciation': return 'appreciation';
      default: return 'totalReturns';
    }
  };

  const getCurrentLineColor = () => {
    switch(chartView) {
      case 'cashFlow': return '#22c55e';
      case 'appreciation': return '#3b82f6';
      default: return '#6366f1';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden touch-none">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8 overflow-x-hidden">
        {/* Language Switcher */}
        <div className="flex justify-end mb-4 sm:mb-6 -mx-2 sm:mx-0 overflow-x-hidden">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm w-full sm:w-auto justify-center">
            <Button
              variant={language === 'en' ? 'default' : 'ghost'}
              onClick={() => handleLanguageChange('en')}
              size="sm"
              className="flex-1 sm:flex-none px-2 sm:px-3 text-[10px] xs:text-xs sm:text-sm min-w-0"
            >
              English
            </Button>
            <Button
              variant={language === 'ru' ? 'default' : 'ghost'}
              onClick={() => handleLanguageChange('ru')}
              size="sm"
              className="flex-1 sm:flex-none px-2 sm:px-3 text-[10px] xs:text-xs sm:text-sm min-w-0"
            >
              Русский
            </Button>
            <Button
              variant={language === 'id' ? 'default' : 'ghost'}
              onClick={() => handleLanguageChange('id')}
              size="sm"
              className="flex-1 sm:flex-none px-2 sm:px-3 text-[10px] xs:text-xs sm:text-sm min-w-0"
            >
              Indonesia
            </Button>
          </div>
        </div>
        
        {/* Investor Highlights */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6 mb-4 sm:mb-8">
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">{t.investorHighlights}</h1>
          
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-8">
            <div>
              <div className="text-xs sm:text-sm text-gray-500 mb-1">{t.unitPrice}</div>
              <div className="text-base sm:text-2xl font-bold text-gray-900">
                {formatCurrency(currentData.unitPrice)}
              </div>
            </div>
            
            <div>
              <div className="text-xs sm:text-sm text-gray-500 mb-1 flex items-center gap-1">
                {t.averageROI}
                <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-gray-300"></span>
              </div>
              <div className="text-base sm:text-2xl font-bold text-gray-900">
                {formatPercentage(currentData.averageROI)}
              </div>
            </div>
            
            <div>
              <div className="text-xs sm:text-sm text-gray-500 mb-1 flex items-center gap-1">
                {t.annualRentExpenseGrowth}
                <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-gray-300"></span>
              </div>
              <div className="text-base sm:text-2xl font-bold text-gray-900">
                +{formatPercentage(currentData.rentGrowthRate)}
              </div>
            </div>
            
            <div>
              <div className="text-xs sm:text-sm text-gray-500 mb-1 flex items-center gap-1">
                {t.propertyManagementFee}
                <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-gray-300"></span>
              </div>
              <div className="text-base sm:text-2xl font-bold text-gray-900">
                {formatPercentage(currentData.propertyManagementFee)}
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6 mb-4 sm:mb-8">
          <div className="flex flex-col gap-4 mb-6">
            {/* Chart Type Buttons - Scrollable on mobile */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
              <Button 
                variant={chartView === 'totalReturns' ? 'default' : 'ghost'}
                onClick={() => setChartView('totalReturns')}
                size="sm"
                className="whitespace-nowrap text-[10px] xs:text-xs sm:text-sm flex-shrink-0 min-w-0 px-2 sm:px-3"
              >
                {t.totalReturns}
              </Button>
              <Button 
                variant={chartView === 'cashFlow' ? 'default' : 'ghost'}
                onClick={() => setChartView('cashFlow')}
                size="sm"
                className="whitespace-nowrap text-[10px] xs:text-xs sm:text-sm flex-shrink-0 min-w-0 px-2 sm:px-3"
              >
                {t.cashFlow}
              </Button>
              <Button 
                variant={chartView === 'appreciation' ? 'default' : 'ghost'}
                onClick={() => setChartView('appreciation')}
                size="sm"
                className="whitespace-nowrap text-[10px] xs:text-xs sm:text-sm flex-shrink-0 min-w-0 px-2 sm:px-3"
              >
                {t.appreciation}
              </Button>
            </div>
            
            {/* Scenario and Period Selection */}
            <div className="flex flex-col gap-4">
              {/* Scenarios */}
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
                <Badge 
                  variant={scenario === 'pessimistic' ? 'default' : 'outline'}
                  className="cursor-pointer whitespace-nowrap text-[10px] xs:text-xs sm:text-sm flex-shrink-0 min-w-0 px-2 sm:px-3"
                  onClick={() => setScenario('pessimistic')}
                >
                  {t.pessimistic}
                </Badge>
                <Badge 
                  variant={scenario === 'realistic' ? 'default' : 'outline'}
                  className="cursor-pointer whitespace-nowrap text-[10px] xs:text-xs sm:text-sm flex-shrink-0 min-w-0 px-2 sm:px-3"
                  onClick={() => setScenario('realistic')}
                >
                  {t.realistic}
                </Badge>
                <Badge 
                  variant={scenario === 'optimistic' ? 'default' : 'outline'}
                  className="cursor-pointer whitespace-nowrap text-[10px] xs:text-xs sm:text-sm flex-shrink-0 min-w-0 px-2 sm:px-3"
                  onClick={() => setScenario('optimistic')}
                >
                  {t.optimistic}
                </Badge>
              </div>
              
              {/* Time Periods */}
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
                {getAvailablePeriods().map(period => (
                  <Button
                    key={period}
                    variant={timeframe === `${period} Years` ? 'default' : 'ghost'}
                    onClick={() => setTimeframe(`${period} Years`)}
                    size="sm"
                    className="whitespace-nowrap text-[10px] xs:text-xs sm:text-sm flex-shrink-0 min-w-0 px-2 sm:px-3"
                  >
                    {period} Years
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Chart */}
          <div className="h-60 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getChartData()} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="totalReturnsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="cashFlowGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="appreciationGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="year" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  interval={'preserveStartEnd'}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                  domain={calculateOptimalDomain(getChartData(), getCurrentLineKey())}
                  width={45}
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), chartView]}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={getCurrentLineKey()}
                  stroke={getCurrentLineColor()}
                  strokeWidth={2}
                  fill={`url(#${chartView}Gradient)`}
                  dot={false}
                  activeDot={{ r: 4, fill: getCurrentLineColor() }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Projected Cumulative Return */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">
            {t.projectedCumulativeReturn.replace('{years}', currentData.investmentPeriod)}
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div>
              <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                {t.totalReturns}
                <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-gray-300"></span>
              </div>
              <div className="text-lg sm:text-2xl font-bold text-gray-900">
                {formatCurrency(currentData.totalProjectedReturn)}
              </div>
              <div className={`text-xs sm:text-sm font-medium ${currentData.totalProjectedReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage((currentData.totalProjectedReturn / currentData.unitPrice) * 100)}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500 mb-1">{t.cashFlow}</div>
              <div className="text-lg sm:text-2xl font-bold text-gray-900">
                {formatCurrency(currentData.totalCashFlow)}
              </div>
              <div className={`text-xs sm:text-sm font-medium ${currentData.totalCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage((currentData.totalCashFlow / currentData.unitPrice) * 100)}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                {t.appreciationYoY.replace('{rate}', '5')}
                <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-gray-300"></span>
              </div>
              <div className="text-lg sm:text-2xl font-bold text-gray-900">
                {formatCurrency(currentData.totalAppreciation)}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500 mb-1">{t.approximateUnitCost}</div>
              <div className="text-lg sm:text-2xl font-bold text-gray-900">
                {formatCurrency(currentData.unitPrice + currentData.totalAppreciation)}
              </div>
              <div className="text-xs sm:text-sm text-green-600 font-medium">
                +{formatPercentage((currentData.totalAppreciation / currentData.unitPrice) * 100)}
              </div>
            </div>
          </div>

          {/* Detailed Table - Scrollable container for mobile */}
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-[800px] px-4 sm:px-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500">{t.year}</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500">{t.income}</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500">{t.cumulativeIncome}</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500">{t.totalSpend}</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500">{t.cumulativeSpend}</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500">{t.cashFlow}</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500">{t.cumulativeCashflow}</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.detailedProjection.map((row, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-900">{index + 1}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-900">{row.yearLabel}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-bold text-gray-900">{formatCurrency(row.income)}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-bold text-gray-900">{formatCurrency(row.cumulativeIncome)}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-900">{formatCurrency(row.spend)}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-bold text-gray-900">{formatCurrency(row.cumulativeSpend)}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-900">{formatCurrency(row.cashflow)}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-bold text-gray-900">{formatCurrency(row.cumulativeCashflow)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicRoiPage; 