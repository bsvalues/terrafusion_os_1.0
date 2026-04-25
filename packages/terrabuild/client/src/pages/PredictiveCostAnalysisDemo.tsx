import React from 'react';
import PredictiveCostAnalysis from '../components/predictive/PredictiveCostAnalysis';
import MainLayout from '@/components/layout/MainLayout';
import DemoNavigation from '@/components/DemoNavigation';

const PredictiveCostAnalysisDemo: React.FC = () => {
  return (
    <MainLayout pageTitle="Predictive Cost Analysis">
      <div className="container mx-auto py-2">
        <DemoNavigation />
        <PredictiveCostAnalysis />
      </div>
    </MainLayout>
  );
};

export default PredictiveCostAnalysisDemo;
