import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { formatCurrency, formatNumber } from '../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { marketDataApi } from '../api';

// Define interfaces for data structures
type PriceTrendDataPoint = {
  month: string;
  value: number;
  year: number;
}

type DomTrendDataPoint = {
  month: string;
  days: number;
  year: number;
}

type SalesTrendDataPoint = {
  month: string;
  sales: number;
  year: number;
}

type PropertyTypeDataPoint = {
  name: string;
  value: number;
}

type NeighborhoodPriceDataPoint = {
  name: string;
  medianPrice: number;
  pricePerSqft: number;
}

type MarketData = {
  priceTrends: PriceTrendDataPoint[];
  domTrends: DomTrendDataPoint[];
  salesTrends: SalesTrendDataPoint[];
  propertyTypes: PropertyTypeDataPoint[];
  neighborhoodPrices: NeighborhoodPriceDataPoint[];
  medianPrices: {
    currentYear: number;
    previousYear: number;
    percentChange: number;
  };
}

type CustomTooltipProps = {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const MarketAnalysisComponent = () => {
  const [timeframe, setTimeframe] = useState('12');
  const [location, setLocation] = useState('Austin, TX');
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  
  // Fetch market data from API
  const { data: priceTrendsData, isLoading: isPriceTrendsLoading } = 
    useQuery({ 
      queryKey: ['market-data/price-trends', location],
      queryFn: () => marketDataApi.getPriceTrends(location)
    });
  
  const { data: domTrendsData, isLoading: isDomTrendsLoading } = 
    useQuery({
      queryKey: ['market-data/dom-trends', location],
      queryFn: () => marketDataApi.getDaysOnMarketTrends(location)
    });
  
  const { data: salesTrendsData, isLoading: isSalesTrendsLoading } = 
    useQuery({
      queryKey: ['market-data/sales-trends', location],
      queryFn: () => marketDataApi.getSalesVolumeTrends(location)
    });
  
  const { data: propertyTypesData, isLoading: isPropertyTypesLoading } = 
    useQuery({
      queryKey: ['market-data/property-types', location],
      queryFn: () => marketDataApi.getPropertyTypeDistribution(location)
    });
  
  const { data: neighborhoodPricesData, isLoading: isNeighborhoodPricesLoading } = 
    useQuery({
      queryKey: ['market-data/neighborhood-prices', location],
      queryFn: () => marketDataApi.getNeighborhoodPrices(location)
    });
  
  // Combine all market data
  useEffect(() => {
    // Once all data is loaded, combine into a single market data object
    if (
      priceTrendsData && 
      domTrendsData && 
      salesTrendsData && 
      propertyTypesData && 
      neighborhoodPricesData
    ) {
      setMarketData({
        priceTrends: priceTrendsData,
        domTrends: domTrendsData,
        salesTrends: salesTrendsData,
        propertyTypes: propertyTypesData,
        neighborhoodPrices: neighborhoodPricesData,
        medianPrices: {
          currentYear: 950000,
          previousYear: 880000,
          percentChange: 7.9
        }
      });
    }
  }, [priceTrendsData, domTrendsData, salesTrendsData, propertyTypesData, neighborhoodPricesData]);
  
  // Use fallback data while loading
  const isLoading = isPriceTrendsLoading || isDomTrendsLoading || isSalesTrendsLoading || 
                   isPropertyTypesLoading || isNeighborhoodPricesLoading;
  
  // Custom tooltip component for charts
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded"><>

          <p className="text-sm font-medium">{label}</p>
          <p
</> className="text-sm text-gray-700">
            {payload[0].name}: {
              payload[0].name === 'value' 
                ? formatCurrency(payload[0].value) 
                : payload[0].name === 'days' 
                  ? `${payload[0].value} days` 
                  : payload[0].value
            }
          </p>
        </div>
      );
    }
    return null;
  };
  
  // Colors for pie chart
  const COLORS = ['#3b82f6', '#22c55e', '#a855f7', '#f97316'];
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div><>

            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">
              Market Analysis
            </h1>
            <p
</> className="text-gray-600">Analyze real estate market trends and insights</p>
          </div>
          
          <div>
            <select 
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
            ><>

              <option value="3">Last 3 Months</option>
              <option
</> value="6">Last 6 Months</option><>

              <option value="12">Last 12 Months</option>
              <option
</> value="24">Last 24 Months</option>
            </select>
          </div>
        </div>
        
        {/* Market Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <div className="bg-white p-5 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4"><>

              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-lg font-bold">
                $
              </div>
              <div
</> className="flex items-center text-sm text-green-600 font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                7.9%
              </div>
            </div><>

            <div className="text-sm text-gray-500">Median Sale Price</div>
            <div
</> className="text-xl font-bold mt-1">{formatCurrency(950000)}</div>
            <div className="text-xs text-gray-500 mt-1">vs {formatCurrency(880000)} last year</div>
          </div>
          
          <div className="bg-white p-5 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4"><>

              <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center text-lg font-bold">
                P
              </div>
              <div
</> className="flex items-center text-sm text-green-600 font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                4.3%
              </div>
            </div><>

            <div className="text-sm text-gray-500">Avg. Price Per Sq.Ft.</div>
            <div
</> className="text-xl font-bold mt-1">${marketData.priceTrends[marketData.priceTrends.length - 1].value}/sqft</div>
            <div className="text-xs text-gray-500 mt-1">vs $450/sqft 12 months ago</div>
          </div>
          
          <div className="bg-white p-5 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4"><>

              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-lg font-bold">
                T
              </div>
              <div
</> className="flex items-center text-sm text-red-600 font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                </svg>
                8.2%
              </div>
            </div><>

            <div className="text-sm text-gray-500">Avg. Days on Market</div>
            <div
</> className="text-xl font-bold mt-1">{marketData.domTrends[marketData.domTrends.length - 1].days} days</div>
            <div className="text-xs text-gray-500 mt-1">vs 32 days 12 months ago</div>
          </div>
          
          <div className="bg-white p-5 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4"><>

              <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-lg font-bold">
                L
              </div>
              <div
</> className="flex items-center text-sm text-green-600 font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                2.1%
              </div>
            </div><>

            <div className="text-sm text-gray-500">Active Listings</div>
            <div
</> className="text-xl font-bold mt-1">483</div>
            <div className="text-xs text-gray-500 mt-1">vs 473 last month</div>
          </div>
        </div>
        
        {/* Price Trends Chart */}
        <div className="bg-white p-5 rounded-lg shadow mb-6"><>

          <h2 className="text-lg font-medium mb-4">Price Per Square Foot Trends</h2>
          <div
</> className="h-80">
            <div style={{ width: '100%', height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                {(marketData?.priceTrends || priceTrendsData) && (
                  <LineChart
                    data={marketData?.priceTrends || priceTrendsData || []}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis 
                      tickFormatter={(value) => `$${value}`}
                      domain={['dataMin - 20', 'dataMax + 20']}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      name="Price/sqft"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Two-column charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-5 rounded-lg shadow"><>

            <h2 className="text-lg font-medium mb-4">Days on Market Trends</h2>
            <div
</> className="h-64">
              <div style={{ width: '100%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  {(marketData?.domTrends || domTrendsData) && (
                    <LineChart
                      data={marketData?.domTrends || domTrendsData || []}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis 
                        domain={['dataMin - 5', 'dataMax + 5']}
                        tickFormatter={(value) => `${value}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="days" 
                        stroke="#a855f7" 
                        name="Days"
                        strokeWidth={2}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-lg shadow"><>

            <h2 className="text-lg font-medium mb-4">Monthly Sales Volume</h2>
            <div
</> className="h-64">
              <div style={{ width: '100%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  {(marketData?.salesTrends || salesTrendsData) && (
                    <BarChart
                      data={marketData?.salesTrends || salesTrendsData || []}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis 
                        domain={[0, 'dataMax + 10']}
                        tickFormatter={(value) => `${value}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="sales" 
                        fill="#22c55e" 
                        name="Sales"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
        
        {/* Property Types and Neighborhood Prices */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-5 rounded-lg shadow"><>

            <h2 className="text-lg font-medium mb-4">Property Types Distribution</h2>
            <div
</> className="h-64 flex items-center justify-center">
              <div style={{ width: '100%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  {(marketData?.propertyTypes || propertyTypesData) && (
                    <PieChart>
                      <Pie
                        data={marketData?.propertyTypes || propertyTypesData || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {(marketData?.propertyTypes || propertyTypesData || []).map((entry /* , index */) => (<>

                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
</> 
                        formatter={(value, name) => [
                          `${value}%`, 
                          `${name}`
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-lg shadow"><>

            <h2 className="text-lg font-medium mb-4">Median Prices by Neighborhood</h2>
            <div
</> className="space-y-4">
              {marketData.neighborhoodPrices.map((neighborhood /* , index */) => (
                <div key={index} className="flex items-center"><>

                  <div className="mr-3 text-red-500">📍</div>
                  <div
</> className="flex-1">
                    <div className="flex justify-between items-center mb-1"><>

                      <div className="text-sm font-medium">{neighborhood.name}</div>
                      <div
</> className="text-sm font-semibold">{formatCurrency(neighborhood.medianPrice)}</div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(neighborhood.medianPrice / 1000000) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">${neighborhood.pricePerSqft}/sqft</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Market Insights */}
        <div className="bg-white p-5 rounded-lg shadow mb-6"><>

          <h2 className="text-lg font-medium mb-4">Market Insights</h2>
          
          <div
</> className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg"><>

              <h3 className="text-blue-800 font-medium mb-2">Price Trends Analysis</h3>
              <p
</> className="text-blue-900">
                The average price per square foot has shown a steady increase over the past year, 
                reaching ${marketData.priceTrends[marketData.priceTrends.length - 1].value}/sqft in the most recent month. 
                This represents a 4.3% increase compared to 12 months ago, indicating a healthy appreciation rate in property values.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg"><>

              <h3 className="text-green-800 font-medium mb-2">Inventory & Sales Analysis</h3>
              <p
</> className="text-green-900">
                The current inventory level of 483 active listings represents a slight increase from the previous month. 
                With an average of 128 sales per month, the current absorption rate is approximately 3.5 months, 
                which indicates a balanced market with a slight advantage for sellers.
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg"><>

              <h3 className="text-purple-800 font-medium mb-2">Market Efficiency</h3>
              <p
</> className="text-purple-900">
                Properties are selling in an average of {marketData.domTrends[marketData.domTrends.length - 1].days} days, 
                which is 8.2% faster than the same period last year. This indicates increasing market efficiency and buyer demand, 
                particularly in the North End and Westview neighborhoods which show the strongest price appreciation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Generate mock market data for demonstration
const generateMarketData = (): MarketData => {
  // Generate price trend data
  const priceTrends: PriceTrendDataPoint[] = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Start at 450 and gradually increase with some variation
  let currentPrice = 450;
  for (let i = 0; i < 12; i++) {
    // Random growth between 0.5% and 1.5% with occasional dips
    const randomGrowth = Math.random() * 0.01 + 0.005;
    const growthFactor = Math.random() > 0.2 ? 1 + randomGrowth : 1 - (randomGrowth / 2);
    
    currentPrice = Math.round(currentPrice * growthFactor);
    
    priceTrends.push({
      month: months[i],
      value: currentPrice,
      year: 2024
    });
  }
  
  // Generate days on market data
  const domTrends: DomTrendDataPoint[] = [];
  
  // Start at higher DOM and gradually decrease
  let currentDays = 32;
  for (let i = 0; i < 12; i++) {
    // Random reduction between 0% and 2%
    const randomChange = Math.random() * 0.02;
    const changeFactor = Math.random() > 0.3 ? 1 - randomChange : 1 + (randomChange / 2);
    
    currentDays = Math.round(currentDays * changeFactor);
    
    domTrends.push({
      month: months[i],
      days: currentDays,
      year: 2024
    });
  }
  
  // Generate sales volume data
  const salesTrends: SalesTrendDataPoint[] = [];
  
  // Seasonal variation with summer peak
  const seasonalPattern = [0.7, 0.8, 1.0, 1.1, 1.2, 1.3, 1.3, 1.2, 1.1, 0.9, 0.8, 0.7];
  const baseSales = 100;
  
  for (let i = 0; i < 12; i++) {
    const monthlySales = Math.round(baseSales * seasonalPattern[i] * (1 + (Math.random() * 0.1 - 0.05)));
    
    salesTrends.push({
      month: months[i],
      sales: monthlySales,
      year: 2024
    });
  }
  
  // Property type distribution
  const propertyTypes: PropertyTypeDataPoint[] = [
    { name: 'Single Family', value: 65 },
    { name: 'Condo', value: 18 },
    { name: 'Multi-Family', value: 10 },
    { name: 'Townhouse', value: 7 }
  ];
  
  // Neighborhood prices
  const neighborhoodPrices: NeighborhoodPriceDataPoint[] = [
    { name: 'Downtown', medianPrice: 625000, pricePerSqft: 450 },
    { name: 'North End', medianPrice: 875000, pricePerSqft: 520 },
    { name: 'South Side', medianPrice: 425000, pricePerSqft: 320 },
    { name: 'Westview', medianPrice: 750000, pricePerSqft: 480 },
    { name: 'Eastside', medianPrice: 580000, pricePerSqft: 410 }
  ];
  
  return {
    priceTrends,
    domTrends,
    salesTrends,
    propertyTypes,
    neighborhoodPrices,
    medianPrices: {
      currentYear: 950000,
      previousYear: 880000,
      percentChange: 7.9
    }
  };
};

export default MarketAnalysisComponent;