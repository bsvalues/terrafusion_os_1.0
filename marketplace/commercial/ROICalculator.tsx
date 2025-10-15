import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, DollarSign, Clock, Users, Zap  } from '@mui/icons-material';

interface ROIMetrics {
  currentCost: number;
  currentTime: number;
  currentUsers: number;
  terraFusionCost: number;
  terraFusionTime: number;
  terraFusionUsers: number;
}

interface ROIResults {
  costSavings: number;
  timeSavings: number;
  productivityGain: number;
  annualSavings: number;
  paybackPeriod: number;
  roi: number;
}

export const ROICalculator: React.FC = () => {
  const [metrics, setMetrics] = useState<ROIMetrics>({
    currentCost: 500000,
    currentTime: 30,
    currentUsers: 50,
    terraFusionCost: 144000,
    terraFusionTime: 3,
    terraFusionUsers: 50
  });

  const [results, setResults] = useState<ROIResults>({
    costSavings: 0,
    timeSavings: 0,
    productivityGain: 0,
    annualSavings: 0,
    paybackPeriod: 0,
    roi: 0
  });

  const calculateROI = () => {
    const costSavings = metrics.currentCost - metrics.terraFusionCost;
    const timeSavingsPercent = ((metrics.currentTime - metrics.terraFusionTime) / metrics.currentTime) * 100;
    const productivityGain = (metrics.currentTime / metrics.terraFusionTime) * 100 - 100;
    
    // Calculate annual operational savings
    const currentOperationalCost = metrics.currentUsers * 50000; // $50k per user annually
    const terraFusionOperationalCost = metrics.terraFusionUsers * 35000; // $35k per user with automation
    const operationalSavings = currentOperationalCost - terraFusionOperationalCost;
    
    const annualSavings = costSavings + operationalSavings;
    const paybackPeriod = metrics.terraFusionCost / annualSavings;
    const roi = (annualSavings / metrics.terraFusionCost) * 100;

    setResults({
      costSavings,
      timeSavings: timeSavingsPercent,
      productivityGain,
      annualSavings,
      paybackPeriod,
      roi
    });
  };

  useEffect(() => {
    calculateROI();
  }, [metrics]);

  const updateMetric = (key: keyof ROIMetrics, value: number) => {
    setMetrics(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8">
          <div className="flex items-center gap-3 mb-4">
            <Calculator className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Terrafusion ROI Calculator</h1>
          </div>
          <p className="text-xl opacity-95">
            Calculate your savings with the world's most advanced government operating system
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
          {/* Input Section */}
          <div className="space-y-6"><>

            <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Current System</h2>
            
            <div
</>
className="space-y-4">
              <div><>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Software Costs
                </label>
                <div
</>
className="relative">
                  <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={metrics.currentCost}
                    onChange={(e) => updateMetric('currentCost', Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="500000"
                  />
                </div>
              </div>

              <div><>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Average Processing Time (minutes)
                </label>
                <div
</>
className="relative">
                  <Clock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={metrics.currentTime}
                    onChange={(e) => updateMetric('currentTime', Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="30"
                  />
                </div>
              </div>

              <div><>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Users
                </label>
                <div
</>
className="relative">
                  <Users className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={metrics.currentUsers}
                    onChange={(e) => updateMetric('currentUsers', Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="50"
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg"><>

              <h3 className="text-lg font-semibold text-blue-800 mb-3">Terrafusion OS Performance</h3>
              <div
</>
className="space-y-2 text-sm text-blue-700">
                <div className="flex justify-between"><>

                  <span>Annual License Cost:</span>
                  <span
</>
className="font-semibold">${metrics.terraFusionCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between"><>

                  <span>Processing Time:</span>
                  <span
</>
className="font-semibold">{metrics.terraFusionTime} seconds</span>
                </div>
                <div className="flex justify-between"><>

                  <span>Speed Improvement:</span>
                  <span
</>
className="font-semibold text-green-600">379,000,000×</span>
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6"><>

            <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Savings</h2>
            
            <div
</>
className="grid grid-cols-1 gap-4">
              {/* Cost Savings */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-800">Annual Cost Savings</h3>
                </div><>

                <div className="text-3xl font-bold text-green-700">
                  ${results.annualSavings.toLocaleString()}
                </div>
                <div
</>
className="text-sm text-green-600 mt-1">
                  License + Operational Savings
                </div>
              </div>

              {/* Time Savings */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-blue-800">Time Savings</h3>
                </div><>

                <div className="text-3xl font-bold text-blue-700">
                  {results.timeSavings.toFixed(1)}%
                </div>
                <div
</>
className="text-sm text-blue-600 mt-1">
                  Processing Time Reduction
                </div>
              </div>

              {/* Productivity Gain */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                  <h3 className="text-lg font-semibold text-purple-800">Productivity Gain</h3>
                </div><>

                <div className="text-3xl font-bold text-purple-700">
                  {results.productivityGain.toFixed(0)}%
                </div>
                <div
</>
className="text-sm text-purple-600 mt-1">
                  Efficiency Improvement
                </div>
              </div>

              {/* ROI */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="w-6 h-6 text-orange-600" />
                  <h3 className="text-lg font-semibold text-orange-800">Return on Investment</h3>
                </div><>

                <div className="text-3xl font-bold text-orange-700">
                  {results.roi.toFixed(0)}%
                </div>
                <div
</>
className="text-sm text-orange-600 mt-1">
                  Payback in {results.paybackPeriod.toFixed(1)} months
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg p-6"><>

              <h3 className="text-xl font-bold mb-3">5-Year Impact</h3>
              <div
</>
className="space-y-2">
                <div className="flex justify-between"><>

                  <span>Total Savings:</span>
                  <span
</>
className="font-bold">${(results.annualSavings * 5).toLocaleString()}</span>
                </div>
                <div className="flex justify-between"><>

                  <span>Investment:</span>
                  <span
</>
className="font-bold">${(metrics.terraFusionCost * 5).toLocaleString()}</span>
                </div>
                <div className="border-t border-white/20 pt-2 mt-2">
                  <div className="flex justify-between text-lg"><>

                    <span>Net Benefit:</span>
                    <span
</>
className="font-bold">${((results.annualSavings - metrics.terraFusionCost) * 5).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-6 border-t">
          <div className="text-center text-gray-600"><>

            <p className="text-sm">
              * Calculations based on industry averages and Terrafusion OS performance benchmarks
            </p>
            <p
</>
className="text-sm mt-1">
              Ready to transform your government operations? 
              <a href="#contact" className="text-blue-600 hover:text-blue-800 font-medium ml-1">
                Contact our team
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ROICalculator;
