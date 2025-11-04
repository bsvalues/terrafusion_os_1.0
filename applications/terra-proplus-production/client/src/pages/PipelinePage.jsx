import React from 'react';
import PipelineDashboard from '../components/pipelines/PipelineDashboard';

const PipelinePage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Terrafusion DevOps Platform</h1>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <PipelineDashboard />
        </div>
      </main>
    </div>
  );
};

export default PipelinePage;