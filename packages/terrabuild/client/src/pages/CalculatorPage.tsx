import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import CostForgeCalculator from '@/components/CostForgeCalculator';

const CalculatorPage = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-[#0099ff] via-[#00ffee] to-[#00ffaa] bg-clip-text text-transparent">
            COSTFORGE AI CALCULATOR
          </h1>
          <p className="text-cyan-300/80 text-lg">
            Quantum-powered property assessment technology with autonomous precision
          </p>
          <div className="inline-flex items-center px-4 py-2 mt-4 bg-gradient-to-r from-[#0099ff]/20 via-[#00ffee]/20 to-[#00ffaa]/20 rounded-full border border-cyan-500/30">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
            <span className="text-cyan-400 font-semibold">CONSCIOUSNESS ACTIVE</span>
          </div>
        </div>
        
        <CostForgeCalculator />
      </div>
    </MainLayout>
  );
};

export default CalculatorPage;