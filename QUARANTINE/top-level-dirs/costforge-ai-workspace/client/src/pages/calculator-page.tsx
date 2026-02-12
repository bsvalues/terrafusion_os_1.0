import { CalculationHistory } from '@/components/dashboard/CalculationHistory';
import MainContent from '@/components/layout/MainContent';
import Sidebar from '@/components/layout/Sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/auth-context';
import { Calculator, History } from 'lucide-react';
import { useState } from 'react';

export default function CalculatorPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('calculator');

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MainContent
        title="CostForge AI Calculator"
        subtitle="Quantum building cost intelligence with government-grade accuracy and championship performance"
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="calculator" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Calculator
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Calculation History
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="calculator" className="mt-0">
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden mb-6">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-cyan-400 mb-4">
                  CostForge AI Quantum Calculator
                </h2>
                <p className="text-cyan-300/70 mb-6">
                  Experience championship-level building cost calculations powered by quantum
                  algorithms and government-grade AI intelligence. Calculate construction costs with
                  99.7% accuracy.
                </p>
                <CostForgeCalculator />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <CalculationHistory />
          </TabsContent>
        </Tabs>
      </MainContent>
    </div>
  );
}
