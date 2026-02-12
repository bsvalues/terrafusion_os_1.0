import { useEffect, useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { DollarSign, Activity, Clock, TrendingUp  } from '@mui/icons-material';

interface MarketDataPoint {
  id: number;
  zipCode: string;
  period: string;
  medianSalePrice: number;
  averageSalePrice: number;
  averagePricePerSqft: number;
  totalSales: number;
  averageDaysOnMarket: number;
  propertyType: string;
}

type ChartType = 'price' | 'volume' | 'days' | 'pricePerSqft';

interface MarketDataChartProps {
  zipCode: string;
  propertyType?: string;
}

const chartColors = {
  medianPrice: '#3B82F6', // Blue
  averagePrice: '#10B981', // Green
  pricePerSqft: '#8B5CF6', // Purple
  sales: '#F59E0B', // Amber
  daysOnMarket: '#EF4444' // Red
};

const MarketDataChart: React.FC<MarketDataChartProps> = ({ zipCode, propertyType }) => {
  const [data, setData] = useState<MarketDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<ChartType>('price');
  
  useEffect(() => {
    const fetchMarketData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Construct query params
        const params = new URLSearchParams();
        params.append('zipCode', zipCode);
        if (propertyType) {
          params.append('propertyType', propertyType);
        }
        
        const response = await fetch(`/api/market-data?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch market data');
        }
        
        const marketData = await response.json();
        
        // Sort by period to ensure chronological order
        const sortedData = [...marketData].sort((a, b) => {
          return a.period.localeCompare(b.period);
        });
        
        // Convert string values to numbers
        const processedData = sortedData.map(item => ({
          ...item,
          medianSalePrice: Number(item.medianSalePrice),
          averageSalePrice: Number(item.averageSalePrice),
          averagePricePerSqft: Number(item.averagePricePerSqft),
          averageDaysOnMarket: Number(item.averageDaysOnMarket)
        }));
        
        setData(processedData);
      } catch (err) {
        console.error('Error fetching market data:', err);
        setError('Unable to load market data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMarketData();
  }, [zipCode, propertyType]);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Determine which chart to render based on chartType
  const renderChart = () => {
    if (data.length === 0) {
      return <div className="text-center py-8">No data available</div>;
    }
    
    switch (chartType) {
      case 'price':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value)} 
                domain={['auto', 'auto']} 
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)} 
                labelFormatter={(label) => `Period: ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="medianSalePrice" 
                name="Median Price" 
                stroke={chartColors.medianPrice} 
                activeDot={{ r: 8 }} 
              />
              <Line 
                type="monotone" 
                dataKey="averageSalePrice" 
                name="Average Price" 
                stroke={chartColors.averagePrice} 
                activeDot={{ r: 8 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        );
        
      case 'volume':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="totalSales" 
                name="Total Sales" 
                fill={chartColors.sales} 
              />
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'days':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="averageDaysOnMarket" 
                name="Avg. Days on Market" 
                stroke={chartColors.daysOnMarket} 
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
        
      case 'pricePerSqft':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis 
                tickFormatter={(value) => `$${value}`} 
                domain={['auto', 'auto']} 
              />
              <Tooltip 
                formatter={(value: number) => `$${value}`} 
                labelFormatter={(label) => `Period: ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="averagePricePerSqft" 
                name="$/sq.ft" 
                stroke={chartColors.pricePerSqft} 
                activeDot={{ r: 8 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        );
        
      default:
        return null;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
        <p>{error}</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Market Trends for {zipCode}</h2>
      
      {/* Chart type selector */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm ${
            chartType === 'price' 
              ? 'bg-blue-100 text-blue-800 border border-blue-300' 
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
          onClick={() => setChartType('price')}
        ><>

          <DollarSign className="h-4 w-4 mr-1" />
          Price Trends
        </button>
        
        <button
</>
          className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm ${
            chartType === 'volume' 
              ? 'bg-amber-100 text-amber-800 border border-amber-300' 
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
          onClick={() => setChartType('volume')}
        ><>

          <Activity className="h-4 w-4 mr-1" />
          Sales Volume
        </button>
        
        <button
</>
          className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm ${
            chartType === 'days' 
              ? 'bg-red-100 text-red-800 border border-red-300' 
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
          onClick={() => setChartType('days')}
        ><>

          <Clock className="h-4 w-4 mr-1" />
          Days on Market
        </button>
        
        <button
</>
          className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm ${
            chartType === 'pricePerSqft' 
              ? 'bg-purple-100 text-purple-800 border border-purple-300' 
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
          onClick={() => setChartType('pricePerSqft')}
        >
          <TrendingUp className="h-4 w-4 mr-1" />
          Price per sq.ft
        </button>
      </div>
      
      {/* Render chart based on selected type */}
      {renderChart()}
      
      {/* Show key metrics summary */}
      {data.length > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg"><>

            <p className="text-sm text-blue-600 font-medium">Current Median Price</p>
            <p
</> className="text-xl font-bold">{formatCurrency(data[data.length - 1].medianSalePrice)}</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 font-medium">YoY Change</p>
            {data.length > 4 ? (
              <p className="text-xl font-bold">
                {((data[data.length - 1].medianSalePrice / data[data.length - 5].medianSalePrice - 1) * 100).toFixed(1)}%
              </p>
            ) : (
              <p className="text-sm italic">Insufficient data</p>
            )}
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg"><>

            <p className="text-sm text-amber-600 font-medium">Avg. Price/Sq.Ft</p>
            <p
</> className="text-xl font-bold">${data[data.length - 1].averagePricePerSqft}</p>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg"><>

            <p className="text-sm text-red-600 font-medium">Avg. Days on Market</p>
            <p
</> className="text-xl font-bold">{data[data.length - 1].averageDaysOnMarket} days</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketDataChart;