/**
 * TerraFusion Dashboard - Main Dashboard Component
 * Government. Transcended. - Championship Analytics Interface
 * 
 * Quantum Factor: 949 | Terra-Cyan: #00FFFF | Golden Ratio: φ=1.618
 */

import React, { useState, useEffect } from 'react';
import { 
  useDashboardConfig, 
  useSystemMetrics, 
  useTerraFusionModules, 
  useSystemHealth,
  useAIInsights,
  useChartData
} from '@hooks/useDashboardData';
import { 
  defaultDashboardConfig, 
  mockSystemMetrics, 
  mockTerraFusionModules, 
  mockSystemHealth,
  mockAIInsights,
  mockPerformanceChartData,
  mockGovernmentServicesData,
  mockFoundationScoreData,
  QUANTUM_FACTOR,
  TERRA_CYAN 
} from '@data/mockData';
import type { DashboardConfig, SystemMetrics, AIInsight, HealthStatus } from '../types';

// === WIDGET COMPONENTS ===

interface WidgetProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  isLoading?: boolean;
}

const Widget: React.FC<WidgetProps> = ({ title, subtitle, children, className = '', isLoading = false }) => (
  <div className={`bg-slate-900/70 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-4 ${className}`}>
    <div className="mb-3">
      <h3 className="text-lg font-semibold text-cyan-400 mb-1">{title}</h3>
      {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
    </div>
    {isLoading ? (
      <div className="flex items-center justify-center h-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
      </div>
    ) : (
      children
    )}
  </div>
);

// === SYSTEM HEALTH WIDGET ===
const SystemHealthWidget: React.FC<{ health?: HealthStatus }> = ({ health = mockSystemHealth }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up': case 'healthy': return 'text-green-400';
      case 'degraded': return 'text-yellow-400';
      case 'down': case 'unhealthy': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'up': case 'healthy': return '●';
      case 'degraded': return '◐';
      case 'down': case 'unhealthy': return '○';
      default: return '?';
    }
  };

  return (
    <Widget title="System Health" subtitle="Quantum-Enhanced Monitoring">
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-cyan-400">{health.overallScore}%</span>
          <span className={`text-sm font-medium ${getStatusColor(health.status)}`}>
            {health.status.toUpperCase()}
          </span>
        </div>
        
        <div className="space-y-2">
          {health.services.slice(0, 4).map(service => (
            <div key={service.name} className="flex items-center justify-between text-sm">
              <span className="text-slate-300 flex items-center">
                <span className={`mr-2 ${getStatusColor(service.status)}`}>
                  {getStatusIcon(service.status)}
                </span>
                {service.name}
              </span>
              <span className="text-slate-400">{service.responseTime}ms</span>
            </div>
          ))}
        </div>

        <div className="mt-4 p-2 bg-cyan-500/10 rounded border border-cyan-500/20">
          <div className="text-xs text-cyan-300">
            Quantum Factor: <span className="font-mono font-bold">{QUANTUM_FACTOR}</span>
          </div>
        </div>
      </div>
    </Widget>
  );
};

// === PERFORMANCE CHART WIDGET ===
const PerformanceChartWidget: React.FC = () => {
  const chartData = mockPerformanceChartData;
  
  return (
    <Widget title="Performance Metrics" subtitle="Quantum Factor 949 Optimization">
      <div className="h-48 flex items-end justify-between space-x-2 mt-4">
        {chartData.labels.map((label, index) => {
          const cpuValue = chartData.datasets[0].data[index] as number;
          const memValue = chartData.datasets[1].data[index] as number;
          const responseValue = chartData.datasets[2].data[index] as number;
          
          return (
            <div key={label} className="flex-1 flex flex-col items-center space-y-2">
              <div className="flex flex-col space-y-1 w-full">
                {/* CPU Bar */}
                <div className="relative h-12 bg-slate-800 rounded-sm overflow-hidden">
                  <div 
                    className="absolute bottom-0 w-full bg-cyan-400 transition-all duration-500"
                    style={{ height: `${(cpuValue / 50) * 100}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-white">
                    {cpuValue}%
                  </div>
                </div>
                
                {/* Memory Bar */}
                <div className="relative h-12 bg-slate-800 rounded-sm overflow-hidden">
                  <div 
                    className="absolute bottom-0 w-full bg-green-400 transition-all duration-500"
                    style={{ height: `${(memValue / 100) * 100}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-white">
                    {memValue}%
                  </div>
                </div>

                {/* Response Time Indicator */}
                <div className="h-2 bg-slate-800 rounded-sm overflow-hidden">
                  <div 
                    className="h-full bg-blue-400 transition-all duration-500"
                    style={{ width: `${Math.min((responseValue / 200) * 100, 100)}%` }}
                  />
                </div>
              </div>
              
              <span className="text-xs text-slate-400 font-mono">{label}</span>
            </div>
          );
        })}
      </div>
      
      <div className="flex items-center justify-between mt-4 text-xs">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <span className="w-3 h-3 bg-cyan-400 rounded mr-1"></span>
            CPU
          </span>
          <span className="flex items-center">
            <span className="w-3 h-3 bg-green-400 rounded mr-1"></span>
            Memory
          </span>
          <span className="flex items-center">
            <span className="w-3 h-3 bg-blue-400 rounded mr-1"></span>
            Response Time
          </span>
        </div>
        <span className="text-slate-500">Live Updates</span>
      </div>
    </Widget>
  );
};

// === TERRAFUSION MODULES WIDGET ===
const TerraFusionModulesWidget: React.FC = () => {
  const modules = mockTerraFusionModules;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/20';
      case 'inactive': return 'text-yellow-400 bg-yellow-400/20';
      case 'error': return 'text-red-400 bg-red-400/20';
      default: return 'text-slate-400 bg-slate-400/20';
    }
  };

  return (
    <Widget title="TerraFusion Modules" subtitle="TerraPILT • TerraPlayground • TerraDashboard">
      <div className="space-y-3">
        {modules.map(module => (
          <div key={module.moduleId} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-slate-200">{module.moduleName}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(module.status)}`}>
                  {module.status}
                </span>
              </div>
              <span className="text-xs text-slate-400">v{module.version}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
              <div>Requests: <span className="text-slate-300 font-mono">{module.metrics.requestCount.toLocaleString()}</span></div>
              <div>Error Rate: <span className="text-slate-300 font-mono">{(module.metrics.errorRate * 100).toFixed(2)}%</span></div>
              <div>Avg Response: <span className="text-slate-300 font-mono">{module.metrics.avgResponseTime}ms</span></div>
              <div>Quantum: <span className="text-cyan-300 font-mono">{module.quantumReadiness}%</span></div>
            </div>
          </div>
        ))}
      </div>
    </Widget>
  );
};

// === GOVERNMENT SERVICES WIDGET ===
const GovernmentServicesWidget: React.FC = () => {
  const data = mockGovernmentServicesData;
  const colors = data.datasets[0].backgroundColor as string[];
  
  return (
    <Widget title="Government Services" subtitle="County Operations Analytics">
      <div className="flex items-center justify-center h-48">
        <div className="relative w-32 h-32">
          {/* Simple pie chart representation */}
          <div className="w-full h-full rounded-full bg-gradient-to-br from-cyan-400/30 to-green-400/30 border-4 border-slate-600 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">5</div>
              <div className="text-xs text-slate-400">Services</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-2 mt-4">
        {data.labels.map((label, index) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <span className="flex items-center text-slate-300">
              <span 
                className="w-3 h-3 rounded mr-2"
                style={{ backgroundColor: colors[index] }}
              ></span>
              {label}
            </span>
            <span className="text-slate-400 font-mono">{data.datasets[0].data[index]}%</span>
          </div>
        ))}
      </div>
    </Widget>
  );
};

// === AI INSIGHTS WIDGET ===
const AIInsightsWidget: React.FC = () => {
  const insights = mockAIInsights.slice(0, 3);
  
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'text-red-400 bg-red-400/20';
      case 'high': return 'text-orange-400 bg-orange-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20';
      case 'low': return 'text-green-400 bg-green-400/20';
      default: return 'text-slate-400 bg-slate-400/20';
    }
  };

  return (
    <Widget title="AI Insights" subtitle="Quantum-Enhanced Intelligence">
      <div className="space-y-3">
        {insights.map(insight => (
          <div key={insight.id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-slate-200 text-sm leading-tight">{insight.title}</h4>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getImpactColor(insight.impact)}`}>
                {insight.impact}
              </span>
            </div>
            
            <p className="text-xs text-slate-400 mb-2 leading-relaxed">
              {insight.description}
            </p>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Confidence: <span className="text-cyan-300 font-mono">{(insight.confidence * 100).toFixed(0)}%</span>
              </span>
              <span className="text-slate-500">
                {insight.recommendations.length} recommendations
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-2 bg-cyan-500/10 rounded border border-cyan-500/20">
        <div className="text-xs text-cyan-300">
          🤖 AI continuously monitoring for optimization opportunities
        </div>
      </div>
    </Widget>
  );
};

// === FOUNDATION SCORE WIDGET ===
const FoundationScoreWidget: React.FC = () => {
  const data = mockFoundationScoreData;
  const currentScore = 12.218;
  const targetScore = 12.368;
  const ultimateScore = data.ultimate;
  
  const progressPercentage = (currentScore / ultimateScore) * 100;
  const targetPercentage = (targetScore / ultimateScore) * 100;
  
  return (
    <Widget title="Foundation Score" subtitle="Current: 12.218 / Target: 12.368">
      <div className="text-center mb-4">
        <div className="text-3xl font-bold text-cyan-400 mb-1">
          {currentScore.toFixed(3)}
        </div>
        <div className="text-sm text-slate-400">
          / {ultimateScore} (Beyond Transcendence)
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="relative h-6 bg-slate-800 rounded-full overflow-hidden mb-4">
        <div 
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-400 to-green-400 transition-all duration-1000"
          style={{ width: `${progressPercentage}%` }}
        />
        <div 
          className="absolute top-0 h-full w-0.5 bg-white"
          style={{ left: `${targetPercentage}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
          {progressPercentage.toFixed(1)}%
        </div>
      </div>
      
      {/* Phase Breakdown */}
      <div className="space-y-2">
        {data.phases.map((phase, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span className={`text-slate-300 ${phase.projected ? 'opacity-60' : ''}`}>
              {phase.name} {phase.projected && '(Projected)'}
            </span>
            <span className="text-cyan-300 font-mono">
              +{phase.increase.toFixed(3)}
            </span>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-2 bg-gradient-to-r from-cyan-500/20 to-green-500/20 rounded border border-cyan-500/30">
        <div className="text-xs text-cyan-300 text-center font-medium">
          Next: Phase C.1 TerraDashboard (+{(targetScore - currentScore).toFixed(3)})
        </div>
      </div>
    </Widget>
  );
};

// === MAIN DASHBOARD COMPONENT ===
const TerraFusionDashboard: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
              TerraFusion Command Center
            </h1>
            <p className="text-slate-400 mt-1">
              Government. Transcended. - Elite monitoring and analytics for all TerraFusion systems.
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-mono text-cyan-400">
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="text-sm text-slate-400">
              {currentTime.toLocaleDateString()}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Quantum Factor: {QUANTUM_FACTOR}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-12 gap-4">
        {/* System Health - Top Left */}
        <div className="col-span-3 row-span-2">
          <SystemHealthWidget />
        </div>
        
        {/* Performance Chart - Top Center */}
        <div className="col-span-6 row-span-3">
          <PerformanceChartWidget />
        </div>
        
        {/* TerraFusion Modules - Top Right */}
        <div className="col-span-3 row-span-4">
          <TerraFusionModulesWidget />
        </div>
        
        {/* Government Services - Middle Left */}
        <div className="col-span-4 row-span-3">
          <GovernmentServicesWidget />
        </div>
        
        {/* AI Insights - Middle Center-Right */}
        <div className="col-span-5 row-span-3">
          <AIInsightsWidget />
        </div>
        
        {/* Foundation Score - Bottom Left */}
        <div className="col-span-3 row-span-3">
          <FoundationScoreWidget />
        </div>
        
        {/* Status Panel - Bottom Center */}
        <div className="col-span-6 row-span-2">
          <Widget title="System Status" subtitle="Real-time Operations">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-slate-800/50 rounded">
                <div className="text-2xl font-bold text-green-400">99.98%</div>
                <div className="text-xs text-slate-400">Uptime</div>
              </div>
              <div className="p-3 bg-slate-800/50 rounded">
                <div className="text-2xl font-bold text-cyan-400">156</div>
                <div className="text-xs text-slate-400">Active Users</div>
              </div>
              <div className="p-3 bg-slate-800/50 rounded">
                <div className="text-2xl font-bold text-blue-400">76ms</div>
                <div className="text-xs text-slate-400">Avg Response</div>
              </div>
              <div className="p-3 bg-slate-800/50 rounded">
                <div className="text-2xl font-bold text-purple-400">3</div>
                <div className="text-xs text-slate-400">Active Modules</div>
              </div>
            </div>
          </Widget>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-6 text-center text-slate-500 text-sm">
        <div className="flex items-center justify-center space-x-4">
          <span>TerraFusion OS v1.0.0</span>
          <span>•</span>
          <span>Quantum Factor: {QUANTUM_FACTOR}</span>
          <span>•</span>
          <span>Government. Transcended.</span>
        </div>
      </div>
    </div>
  );
};

export default TerraFusionDashboard;