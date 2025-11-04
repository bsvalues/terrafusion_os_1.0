import { useState } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  usePriceTrends, 
  useDaysOnMarketTrends, 
  useSalesVolumeTrends,
  usePropertyTypeDistribution,
  useNeighborhoodPrices 
} from '../hooks/useMarketData';

// Location options
const LOCATIONS = [
  'San Francisco',
  'Oakland',
  'San Jose',
  'Berkeley',
  'Palo Alto'
];

// Colors for charts
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', 
  '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'
];

// Price format helper
const formatPrice = (price: number) => {
  return price.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  });
};

const MarketAnalysis = () => {
  const [selectedLocation, setSelectedLocation] = useState(LOCATIONS[0]);
  const [year, setYear] = useState(2025); // Default to current year
  
  // Fetch market data for selected location
  const { data: priceTrends = [], isLoading: isLoadingPrices } = usePriceTrends(selectedLocation);
  const { data: domTrends = [], isLoading: isLoadingDOM } = useDaysOnMarketTrends(selectedLocation);
  const { data: salesTrends = [], isLoading: isLoadingSales } = useSalesVolumeTrends(selectedLocation);
  const { data: propertyTypes = [], isLoading: isLoadingTypes } = usePropertyTypeDistribution();
  const { data: neighborhoods = [], isLoading: isLoadingNeighborhoods } = useNeighborhoodPrices();
  
  // Filter data by selected year
  const filteredPriceTrends = priceTrends.filter(item => item.year === year);
  const filteredDomTrends = domTrends.filter(item => item.year === year);
  const filteredSalesTrends = salesTrends.filter(item => item.year === year);
  
  // Calculate averages and changes
  const calculateAveragePrice = () => {
    if (filteredPriceTrends.length === 0) return 0;
    return filteredPriceTrends.reduce((sum, item) => sum + item.value, 0) / filteredPriceTrends.length;
  };
  
  const calculateAverageDom = () => {
    if (filteredDomTrends.length === 0) return 0;
    return filteredDomTrends.reduce((sum, item) => sum + item.days, 0) / filteredDomTrends.length;
  };
  
  const calculateTotalSales = () => {
    if (filteredSalesTrends.length === 0) return 0;
    return filteredSalesTrends.reduce((sum, item) => sum + item.sales, 0);
  };
  
  const averagePrice = calculateAveragePrice();
  const averageDom = calculateAverageDom();
  const totalSales = calculateTotalSales();
  
  // Calculate year-over-year changes
  const prevYearPriceTrends = priceTrends.filter(item => item.year === year - 1);
  const prevYearAvgPrice = prevYearPriceTrends.length ? 
    prevYearPriceTrends.reduce((sum, item) => sum + item.value, 0) / prevYearPriceTrends.length : 0;
  
  const prevYearDomTrends = domTrends.filter(item => item.year === year - 1);
  const prevYearAvgDom = prevYearDomTrends.length ? 
    prevYearDomTrends.reduce((sum, item) => sum + item.days, 0) / prevYearDomTrends.length : 0;
  
  const prevYearSalesTrends = salesTrends.filter(item => item.year === year - 1);
  const prevYearTotalSales = prevYearSalesTrends.length ? 
    prevYearSalesTrends.reduce((sum, item) => sum + item.sales, 0) : 0;
  
  const priceChange = prevYearAvgPrice ? ((averagePrice - prevYearAvgPrice) / prevYearAvgPrice) * 100 : 0;
  const domChange = prevYearAvgDom ? ((averageDom - prevYearAvgDom) / prevYearAvgDom) * 100 : 0;
  const salesChange = prevYearTotalSales ? ((totalSales - prevYearTotalSales) / prevYearTotalSales) * 100 : 0;

  // Loading state
  const isLoading = isLoadingPrices || isLoadingDOM || isLoadingSales || isLoadingTypes || isLoadingNeighborhoods;
  
  if (isLoading) {
    return <div className="p-8 flex justify-center items-center">Loading market data...</div>;
  }
  
  return (
    <div className="p-6">
      <div className="mb-6"><>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">Market Analysis</h1>
        <p
</> className="text-gray-600">
          Comprehensive real estate market insights and trends for informed appraisal decisions.
        </p>
      </div>
      
      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><>

            <label className="block text-sm font-medium mb-1">Location</label>
            <select
</>
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              {LOCATIONS.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
          <div><>

            <label className="block text-sm font-medium mb-1">Year</label>
            <select
</>
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md"
            ><>

              <option value={2024}>2024</option>
              <option
</> value={2025}>2025</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4"><>

          <h3 className="text-lg font-semibold mb-2 text-gray-800">Average Home Price</h3>
          <p
</> className="text-3xl font-bold text-primary mb-1">{formatPrice(averagePrice)}</p>
          <div className={`flex items-center text-sm ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}><>

            <span className="mr-1">{priceChange >= 0 ? '↑' : '↓'}</span>
            <span
</>>{Math.abs(priceChange).toFixed(1)}% from last year</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4"><>

          <h3 className="text-lg font-semibold mb-2 text-gray-800">Average Days on Market</h3>
          <p
</> className="text-3xl font-bold text-primary mb-1">{Math.round(averageDom)} days</p>
          <div className={`flex items-center text-sm ${domChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <span className="mr-1">{domChange <= 0 ? '↓' : '↑'}</span>
            <span>{Math.abs(domChange).toFixed(1)}% from last year</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4"><>

          <h3 className="text-lg font-semibold mb-2 text-gray-800">Total Sales</h3>
          <p
</> className="text-3xl font-bold text-primary mb-1">{totalSales.toLocaleString()}</p>
          <div className={`flex items-center text-sm ${salesChange >= 0 ? 'text-green-600' : 'text-red-600'}`}><>

            <span className="mr-1">{salesChange >= 0 ? '↑' : '↓'}</span>
            <span
</>>{Math.abs(salesChange).toFixed(1)}% from last year</span>
          </div>
        </div>
      </div>
      
      {/* Price Trends Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4"><>

          <h3 className="text-lg font-semibold mb-4 text-gray-800">Price Trends</h3>
          <div
</> className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredPriceTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis 
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  domain={['dataMin - 50000', 'dataMax + 50000']}
                />
                <Tooltip 
                  formatter={(value) => formatPrice(Number(value))}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Home Price"
                  stroke="#0088FE"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Days on Market Chart */}
        <div className="bg-white rounded-lg shadow-md p-4"><>

          <h3 className="text-lg font-semibold mb-4 text-gray-800">Days on Market</h3>
          <div
</> className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredDomTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis 
                  domain={['dataMin - 5', 'dataMax + 5']}
                  label={{ value: 'Days', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value) => [`${value} days`, 'Average DOM']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="days"
                  name="Days on Market"
                  stroke="#00C49F"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Sales Volume and Property Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sales Volume Chart */}
        <div className="bg-white rounded-lg shadow-md p-4"><>

          <h3 className="text-lg font-semibold mb-4 text-gray-800">Sales Volume</h3>
          <div
</> className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredSalesTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis 
                  domain={['dataMin - 20', 'dataMax + 20']}
                />
                <Tooltip 
                  formatter={(value) => [`${value} sales`, 'Volume']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Bar 
                  dataKey="sales" 
                  name="Sales Volume" 
                  fill="#FFBB28" 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Property Types Distribution */}
        <div className="bg-white rounded-lg shadow-md p-4"><>

          <h3 className="text-lg font-semibold mb-4 text-gray-800">Property Types</h3>
          <div
</> className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={propertyTypes}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {propertyTypes.map((entry /* , index */) => (<>

                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
</> 
                  formatter={(value, name, props) => [`${value}%`, props.payload.name]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Neighborhood Price Comparison */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6"><>

        <h3 className="text-lg font-semibold mb-4 text-gray-800">Neighborhood Price Comparison</h3>
        <div
</> className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr><>

                <th className="py-3 px-4 text-left font-medium">Neighborhood</th>
                <th
</> className="py-3 px-4 text-right font-medium">Median Price</th><>

                <th className="py-3 px-4 text-right font-medium">Price/sqft</th>
                <th
</> className="py-3 px-4 text-right font-medium">vs. City Average</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {neighborhoods.map((neighborhood /* , index */) => {
                const priceDiff = ((neighborhood.medianPrice - averagePrice) / averagePrice) * 100;
                
                return (
                  <tr key={index} className="hover:bg-gray-50"><>

                    <td className="py-3 px-4 font-medium">{neighborhood.name}</td>
                    <td
</> className="py-3 px-4 text-right">{formatPrice(neighborhood.medianPrice)}</td><>

                    <td className="py-3 px-4 text-right">${neighborhood.pricePerSqft}/sqft</td>
                    <td
</> className={`py-3 px-4 text-right ${priceDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {priceDiff >= 0 ? '+' : ''}{priceDiff.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Market Insights */}
      <div className="bg-white rounded-lg shadow-md p-4"><>

        <h3 className="text-lg font-semibold mb-4 text-gray-800">Market Insights</h3>
        <div
</> className="space-y-4">
          <div><>

            <h4 className="font-medium text-primary">Price Trends Analysis</h4>
            <p
</> className="text-gray-700 mt-1">
              {priceChange > 5 
                ? `${selectedLocation} is experiencing strong price growth (${priceChange.toFixed(1)}%), indicating a seller's market. Appraisers should consider recent comparable sales carefully as values may be rising rapidly.`
                : priceChange < -5
                ? `${selectedLocation} is seeing significant price decreases (${priceChange.toFixed(1)}%), indicating a buyer's market. Appraisers should account for this downward trend in valuations.`
                : `${selectedLocation} prices are relatively stable (${priceChange > 0 ? '+' : ''}${priceChange.toFixed(1)}%). Current comparable sales should provide reliable valuation data.`
              }
            </p>
          </div>
          
          <div><>

            <h4 className="font-medium text-primary">Inventory & Days on Market</h4>
            <p
</> className="text-gray-700 mt-1">
              {averageDom < 20
                ? `Properties are selling quickly (${Math.round(averageDom)} days on average), suggesting high demand and limited inventory. Appraisers should consider this market pressure when evaluating comparable sales.`
                : averageDom > 60
                ? `Extended days on market (${Math.round(averageDom)} days on average) indicate a slower market with ample inventory. Appraisers should carefully analyze price reductions and concessions.`
                : `The market shows balanced inventory levels with properties selling in an average of ${Math.round(averageDom)} days. This provides good comparable data for appraisals.`
              }
            </p>
          </div>
          
          <div><>

            <h4 className="font-medium text-primary">Neighborhood Analysis</h4>
            <p
</> className="text-gray-700 mt-1">
              {`The ${neighborhoods[0].name} area commands the highest prices at ${formatPrice(neighborhoods[0].medianPrice)}, while ${neighborhoods[neighborhoods.length-1].name} shows more affordable options at ${formatPrice(neighborhoods[neighborhoods.length-1].medianPrice)}. Appraisers should adjust comparable sales based on these neighborhood value differentials.`}
            </p>
          </div>
          
          <div><>

            <h4 className="font-medium text-primary">Property Type Considerations</h4>
            <p
</> className="text-gray-700 mt-1">
              {`${propertyTypes[0].name} properties represent the largest market segment (${propertyTypes[0].value}%), followed by ${propertyTypes[1].name} (${propertyTypes[1].value}%). When appraising less common property types, consider limited comparable data and potential market liquidity factors.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketAnalysis;