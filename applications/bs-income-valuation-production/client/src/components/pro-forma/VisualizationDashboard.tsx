import React from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import ComparisonChart from './ComparisonChart';

// Sample data for the charts - this would be dynamically generated from the formData in a real app
const PROPERTY_TYPES = ['Single Family', 'Multi-Family', 'Commercial', 'Mixed Use'];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Interfaces
export interface VisualizationDashboardProps {
  formData: any;
  calculatedMetrics: any;
  comparisonScenarios?: any[];
  applyAssumptions?: (assumptions: any) => void;
}

/**
 * Visualization Dashboard Component
 * Displays various charts and graphs to visualize property performance
 */
const VisualizationDashboard: React.FC<VisualizationDashboardProps> = ({ 
  formData, 
  calculatedMetrics,
  comparisonScenarios = [],
  applyAssumptions
}) => {
  // Generate annual cash flow projection data
  const getCashFlowData = () => {
    return Array.from({ length: 10 }, (_, i) => {
      const year = i + 1;
      // Calculate with compounding growth rates
      const propertyValue = formData.financing.purchasePrice * Math.pow(1.03, year); // 3% appreciation
      const income = calculatedMetrics.effectiveGrossIncome * Math.pow(1.02, year); // 2% income growth
      const expenses = calculatedMetrics.operatingExpenses * Math.pow(1.03, year); // 3% expense growth
      const noi = income - expenses;
      const cashFlow = noi - calculatedMetrics.annualDebtService;
      
      return {
        year,
        cashFlow,
        propertyValue,
        noi
      };
    });
  };

  // Expense breakdown data for pie chart
  const getExpenseBreakdownData = () => {
    const { propertyTaxes, insurance, utilities, maintenance, managementFees, replacementReserves, otherExpenses } = formData.expenseProjections;
    
    return [
      { name: 'Property Taxes', value: propertyTaxes },
      { name: 'Insurance', value: insurance },
      { name: 'Utilities', value: utilities },
      { name: 'Maintenance', value: maintenance },
      { name: 'Management', value: managementFees },
      { name: 'Reserves', value: replacementReserves },
      { name: 'Other', value: otherExpenses }
    ];
  };

  const cashFlowData = getCashFlowData();
  const expenseData = getExpenseBreakdownData();
  
  // Handler for clicking on chart points to apply assumptions
  const handleChartClick = (data: any) => {
    if (!applyAssumptions) return;
    
    // If a year is clicked, apply assumptions based on that year's projections
    if (data && data.activePayload && data.activePayload[0]) {
      const clickedData = data.activePayload[0].payload;
      
      if (clickedData.year) {
        // Create assumptions based on the clicked year
        const assumptions = {
          year: clickedData.year,
          propertyValue: clickedData.propertyValue,
          cashFlow: clickedData.cashFlow,
          noi: clickedData.noi,
          // Add other relevant assumptions
          appreciationRate: 3.0, // Default assumption
          incomeGrowthRate: 2.0, // Default assumption
          expenseGrowthRate: 3.0 // Default assumption
        };
        
        applyAssumptions(assumptions);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
      {/* Cash Flow Projection */}
      <div className="bg-white p-4 rounded-lg shadow-md"><>

        <h3 className="text-lg font-semibold mb-4">Cash Flow Projection (10 Years)</h3>
        <ResponsiveContainer
</>

width="100%" height={300}>
          <LineChart
            data={cashFlowData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            onClick={applyAssumptions ? handleChartClick : undefined}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottomRight', offset: -5 }} />
            <YAxis />
            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            <Legend />
            <Line type="monotone" dataKey="cashFlow" stroke="#8884d8" name="Cash Flow" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Expense Breakdown */}
      <div className="bg-white p-4 rounded-lg shadow-md"><>

        <h3 className="text-lg font-semibold mb-4">Expense Breakdown</h3>
        <ResponsiveContainer
</>

width="100%" height={300}>
          <PieChart>
            <Pie
              data={expenseData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {expenseData.map((entry /* , index */) => (<>

                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
</>

formatter={(value) => `$${value.toLocaleString()}`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Property Value Growth */}
      <div className="bg-white p-4 rounded-lg shadow-md"><>

        <h3 className="text-lg font-semibold mb-4">Property Value Growth</h3>
        <ResponsiveContainer
</>

width="100%" height={300}>
          <BarChart
            data={cashFlowData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            onClick={applyAssumptions ? handleChartClick : undefined}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            <Legend />
            <Bar dataKey="propertyValue" fill="#82ca9d" name="Property Value" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Income vs Expenses */}
      <div className="bg-white p-4 rounded-lg shadow-md"><>

        <h3 className="text-lg font-semibold mb-4">NOI Trend</h3>
        <ResponsiveContainer
</>

width="100%" height={300}>
          <LineChart
            data={cashFlowData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            onClick={applyAssumptions ? handleChartClick : undefined}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            <Legend />
            <Line type="monotone" dataKey="noi" stroke="#ff7300" name="NOI" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Comparison Charts (only show if we have comparison scenarios) */}
      {comparisonScenarios.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow-md lg:col-span-2"><>

            <ComparisonChart 
              scenarios={comparisonScenarios}
              metricKey="capRate"
              chartType="bar"
              title="Cap Rate Comparison"
            />
          </div>

          <div
</>

className="bg-white p-4 rounded-lg shadow-md lg:col-span-2">
            <ComparisonChart 
              scenarios={comparisonScenarios}
              metricKey="cashOnCash"
              chartType="bar"
              title="Cash-On-Cash Return Comparison"
            />
          </div>
      )}
    </div>
  );
};

export default VisualizationDashboard;