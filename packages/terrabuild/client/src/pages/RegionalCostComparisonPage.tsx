import RegionalCostComparison from '@/components/cost-analysis/RegionalCostComparison';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Download, FileBarChart } from 'lucide-react';
import React from 'react';

const RegionalCostComparisonPage: React.FC = () => {
  return (
    <MainLayout
      pageTitle="Regional Cost Comparison"
      pageDescription="Compare building costs across different reval areas in your jurisdiction."
    >
      <div className="flex gap-2 mb-4">
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
        <Button variant="outline" size="sm">
          <FileBarChart className="mr-2 h-4 w-4" />
          Generate Report
        </Button>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <RegionalCostComparison />
      </div>
    </MainLayout>
  );
};

export default RegionalCostComparisonPage;
