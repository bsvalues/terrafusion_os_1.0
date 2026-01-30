import React from 'react';

interface AnalyticsProps {
  data?: any;
}

const Analytics: React.FC<AnalyticsProps> = ({ data }) => {
  return (
    <div className='analytics p-4 border rounded'>
      <h3 className='text-lg font-semibold mb-2'>Analytics Dashboard</h3>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div className='stat-card p-3 bg-blue-50 rounded'>
          <div className='text-2xl font-bold text-blue-600'>--</div>
          <div className='text-sm text-blue-800'>Total Properties</div>
        </div>
        <div className='stat-card p-3 bg-green-50 rounded'>
          <div className='text-2xl font-bold text-green-600'>--</div>
          <div className='text-sm text-green-800'>Avg Valuation</div>
        </div>
        <div className='stat-card p-3 bg-purple-50 rounded'>
          <div className='text-2xl font-bold text-purple-600'>--</div>
          <div className='text-sm text-purple-800'>Performance Score</div>
        </div>
      </div>
      {data && (
        <div className='mt-4 text-sm text-gray-600'>Analytics data loaded: {typeof data}</div>
      )}
    </div>
  );
};

export default Analytics;
