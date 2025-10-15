import React from 'react';

interface ValuationChartProps {
  data?: any;
}

const ValuationChart: React.FC<ValuationChartProps> = ({ data }) => {
  return (
    <div className="valuation-chart p-4 border rounded">


      <h3 className="text-lg font-semibold mb-2">Property Valuation Chart</h3>
      <div

className="bg-gray-100 h-64 rounded flex items-center justify-center">
        <p className="text-gray-600">Chart visualization placeholder</p>
      </div>
      {data && (
        <div className="mt-2 text-sm text-gray-600">
          Data points: {JSON.stringify(data).length}
        </div>
      )}
    </div>
  );
};

export default ValuationChart;
