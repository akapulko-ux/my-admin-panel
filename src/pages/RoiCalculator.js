import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Calculator, Download, Save, FolderOpen } from 'lucide-react';
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { PDFDownloadLink } from '@react-pdf/renderer';
import Presentation from '../components/Presentation';

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
    purchasePrice: '',
    renovationCosts: '',
    legalFees: '',
    additionalExpenses: '',
    investmentPeriod: '',
  });

  const [rentalData, setRentalData] = useState({
    dailyRate: '',
    occupancyRate: '',
    daysPerYear: '365',
    otaCommission: '',
  });

  const [expensesData, setExpensesData] = useState({
    maintenanceFees: '',
    utilityBills: '',
    annualTax: '',
  });

  const [scenario, setScenario] = useState('base');
  const [calculationResults, setCalculationResults] = useState(null);

  const [savedCalculations, setSavedCalculations] = useState([]);
  const [calculationName, setCalculationName] = useState('');

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

  // Функция для расчета всех показателей
  const calculateInvestment = () => {
    // Преобразуем все входные данные в числа и добавляем отладочные логи
    const purchasePrice = Number(costData.purchasePrice) || 0;
    const renovationCosts = Number(costData.renovationCosts) || 0;
    const legalFees = Number(costData.legalFees) || 0;
    const additionalExpenses = Number(costData.additionalExpenses) || 0;
    const investmentPeriod = Number(costData.investmentPeriod) || 30;
    
    console.log('Input values:', {
      purchasePrice,
      renovationCosts,
      legalFees,
      additionalExpenses,
      investmentPeriod
    });
    
    const dailyRate = Number(rentalData.dailyRate) || 0;
    const occupancyRate = Number(rentalData.occupancyRate) || 0;
    const daysPerYear = Number(rentalData.daysPerYear) || 365;
    const otaCommission = Number(rentalData.otaCommission) || 0;
    
    console.log('Rental data:', {
      dailyRate,
      occupancyRate,
      daysPerYear,
      otaCommission
    });

    const maintenanceFees = Number(expensesData.maintenanceFees) || 0;
    const utilityBills = Number(expensesData.utilityBills) || 0;
    const annualTax = Number(expensesData.annualTax) || 0;

    // Базовые расчеты
    const totalInvestment = purchasePrice + renovationCosts + legalFees + additionalExpenses;
    const annualRentalIncome = dailyRate * daysPerYear * (occupancyRate / 100) * (1 - otaCommission / 100);
    const annualExpenses = maintenanceFees + utilityBills + annualTax;
    const annualNetProfit = annualRentalIncome - annualExpenses;
    
    console.log('Base calculations:', {
      totalInvestment,
      annualRentalIncome,
      annualExpenses,
      annualNetProfit
    });

    // Генерация данных для графика
    const graphData = [];
    let accumulatedProfit = -totalInvestment; // Начинаем с отрицательного значения (первоначальные инвестиции)
    
    for (let year = 1; year <= investmentPeriod; year++) {
      let yearlyProfit = annualNetProfit;
      
      // Применяем модификаторы в зависимости от сценария
      if (scenario === 'optimistic') {
        yearlyProfit *= (1 + 0.05 * year); // 5% рост каждый год
      } else if (scenario === 'pessimistic') {
        yearlyProfit *= (1 - 0.02 * year); // 2% падение каждый год
      }
      
      accumulatedProfit += yearlyProfit;
      
      graphData.push({
        year: `Год ${year}`,
        profit: Math.round(yearlyProfit),
        accumulatedProfit: Math.round(accumulatedProfit),
      });
    }

    console.log('Graph data:', graphData);

    setCalculationResults({
      totalInvestment,
      annualRentalIncome,
      annualExpenses,
      annualNetProfit,
      roi: (annualNetProfit / totalInvestment) * 100,
      paybackPeriod: totalInvestment / annualNetProfit,
      graphData,
    });
  };

  // Добавляем эффект для отслеживания изменений в calculationResults
  useEffect(() => {
    if (calculationResults) {
      console.log('Updated calculation results:', calculationResults);
    }
  }, [calculationResults]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Калькулятор ROI</h1>
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
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadCalculation(calc)}
                    >
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteCalculation(calc.id)}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <Label htmlFor="daysPerYear">Дней в году</Label>
            <Input
              id="daysPerYear"
              type="number"
              max="365"
              value={rentalData.daysPerYear}
              onChange={(e) => setRentalData({...rentalData, daysPerYear: e.target.value})}
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
        </Card>

        {/* Блок операционных расходов */}
        <Card className="p-4 space-y-4">
          <h2 className="text-xl font-semibold">Операционные расходы</h2>
          
          <div className="space-y-2">
            <Label htmlFor="maintenanceFees">Обслуживание в год ($)</Label>
            <Input
              id="maintenanceFees"
              type="number"
              value={expensesData.maintenanceFees}
              onChange={(e) => setExpensesData({...expensesData, maintenanceFees: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="utilityBills">Коммунальные платежи в год ($)</Label>
            <Input
              id="utilityBills"
              type="number"
              value={expensesData.utilityBills}
              onChange={(e) => setExpensesData({...expensesData, utilityBills: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="annualTax">Налоги в год ($)</Label>
            <Input
              id="annualTax"
              type="number"
              value={expensesData.annualTax}
              onChange={(e) => setExpensesData({...expensesData, annualTax: e.target.value})}
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

          <div className="flex flex-wrap items-center gap-4">
            <Button onClick={calculateInvestment} className="bg-blue-600 hover:bg-blue-700">
              <Calculator className="mr-2 h-4 w-4" /> Рассчитать
            </Button>
          </div>
        </Card>
      </div>

      {calculationResults && (
        <div className="mt-8 p-6 bg-white rounded-2xl shadow-lg">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">
                Результаты расчета
              </h2>
              <p className="text-gray-500">
                На основе введенных данных и сценария "{scenario}"
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Название расчета"
                  value={calculationName}
                  onChange={(e) => setCalculationName(e.target.value)}
                  className="w-48"
                />
                <Button onClick={saveCalculation} size="sm" disabled={!calculationName.trim()}>
                  <Save className="h-4 w-4" />
                </Button>
              </div>

              <Button 
                onClick={() => exportToCSV({ ...calculationResults, graphData: calculationResults.graphData }, 'roi-analysis.csv')}
                variant="outline"
                size="sm"
              >
                <Download className="mr-2 h-4 w-4" /> Экспорт в CSV
              </Button>

              <PDFDownloadLink
                document={<Presentation data={calculationResults} />}
                fileName="investor-presentation.pdf"
                style={{ textDecoration: 'none' }}
              >
                {({ loading }) => (
                  <Button variant="outline" size="sm" disabled={loading}>
                    <Download className="mr-2 h-4 w-4" />
                    {loading ? 'Генерация...' : 'Скачать презентацию'}
                  </Button>
                )}
              </PDFDownloadLink>
            </div>
          </div>

          {/* Investment Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div>
              <p className="text-sm text-muted-foreground">Общие инвестиции</p>
              <p className="text-lg font-semibold">${calculationResults.totalInvestment.toLocaleString()}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Годовой доход от аренды</p>
              <p className="text-lg font-semibold">${calculationResults.annualRentalIncome.toLocaleString()}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Годовые расходы</p>
              <p className="text-lg font-semibold">${calculationResults.annualExpenses.toLocaleString()}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Чистая прибыль в год</p>
              <p className="text-lg font-semibold">${calculationResults.annualNetProfit.toLocaleString()}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">ROI</p>
              <p className="text-lg font-semibold">{calculationResults.roi.toFixed(2)}%</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Срок окупаемости</p>
              <p className="text-lg font-semibold">{calculationResults.paybackPeriod.toFixed(1)} лет</p>
            </div>
          </div>

          {/* Chart */}
          <div className="h-96 bg-gray-50 p-4 rounded-lg">
            <ResponsiveContainer width="100%" height="100%">
              {calculationResults?.graphData && calculationResults.graphData.length > 0 ? (
                <LineChart
                  data={calculationResults.graphData}
                  margin={{ top: 20, right: 100, left: 70, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis
                    dataKey="year"
                    label={{ value: 'Период', position: 'bottom', offset: 20 }}
                    tick={{ fontSize: 12, angle: -45, textAnchor: 'end' }}
                    interval={3}
                    height={60}
                  />
                  <YAxis
                    yAxisId="left"
                    label={{
                      value: 'Прибыль за год ($)',
                      angle: -90,
                      position: 'insideLeft',
                      offset: -20,
                      style: { textAnchor: 'middle' }
                    }}
                    tickFormatter={formatLargeNumber}
                    tick={{ fontSize: 12 }}
                    domain={['auto', 'auto']}
                    width={80}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    label={{
                      value: 'Накопленная прибыль ($)',
                      angle: 90,
                      position: 'outside',
                      offset: 25,
                      style: { textAnchor: 'middle' }
                    }}
                    tickFormatter={formatLargeNumber}
                    tick={{ fontSize: 12 }}
                    domain={['auto', 'auto']}
                    width={90}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    wrapperStyle={{ outline: 'none' }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconType="circle"
                    iconSize={10}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="profit"
                    name="Прибыль за год"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#8884d8' }}
                    activeDot={{ r: 6, fill: '#8884d8' }}
                    isAnimationActive={true}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="accumulatedProfit"
                    name="Накопленная прибыль"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#82ca9d' }}
                    activeDot={{ r: 6, fill: '#82ca9d' }}
                    isAnimationActive={true}
                  />
                </LineChart>
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