/**
 * ═══════════════════════════════════════════════════════════════
 * COSTFORGE QUANTUM DASHBOARD - TRANSCENDENT INTERFACE
 * Migrated from TerraBuild TerraFusionQuantumDashboard with CostForge integration
 * THE TERRAFUSION WAY - GOVERNMENT-GRADE EXCELLENCE
 * ═══════════════════════════════════════════════════════════════
 */

import { Activity, Calculator, Cpu, Database, Gauge, Shield, TrendingUp } from 'lucide-react';
import { DemoDataBanner } from '../governance/DemoDataBanner';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

// CostForge TerraFusion Color System
const costForgeColors = {
  trustBlue: 'var(--tf-network-blue)',
  transcendCyan: 'var(--tf-transcend-highlight)',
  successGreen: 'var(--tf-accent-success)',
  deepSpace: 'var(--tf-bg-surface)',
  clarity: 'linear-gradient(135deg, var(--tf-network-blue) 0%, var(--tf-transcend-highlight) 50%, var(--tf-accent-success) 100%)',
};

// Mock analytics data for CostForge dashboard
const quantumAnalytics = [
  { name: 'Q1', accuracy: 98.2, performance: 99.1, costSavings: 15.2 },
  { name: 'Q2', accuracy: 98.8, performance: 99.4, costSavings: 18.7 },
  { name: 'Q3', accuracy: 99.1, performance: 99.7, costSavings: 22.1 },
  { name: 'Q4', accuracy: 99.5, performance: 99.9, costSavings: 25.8 },
];

const costForgePerformance = [
  { name: 'Estimation', calculations: 15420, accuracy: 99.8, avgTime: 47 },
  { name: 'Analysis', calculations: 12850, accuracy: 99.5, avgTime: 52 },
  { name: 'Validation', calculations: 18940, accuracy: 99.9, avgTime: 38 },
  { name: 'Reporting', calculations: 9680, accuracy: 99.7, avgTime: 65 },
];

const realTimeMetrics = [
  { time: '00:00', estimates: 2400, accuracy: 99.2 },
  { time: '04:00', estimates: 1800, accuracy: 99.4 },
  { time: '08:00', estimates: 4200, accuracy: 99.6 },
  { time: '12:00', estimates: 5800, accuracy: 99.8 },
  { time: '16:00', estimates: 6200, accuracy: 99.5 },
  { time: '20:00', estimates: 3600, accuracy: 99.3 },
];

export function CostForgeQuantumDashboard() {
  // Sample analytics — static fixture values, not county-runtime truth
  const totalEstimates = 52847;
  const systemHealth = 'TRANSCENDENT';
  const quantumAccuracy = 99.5;
  const aiAgentsActive = 8450;
  const costSavings = 2.8;

  return (
    <div className='min-h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6'>
      <DemoDataBanner module="CostForge" />
      {/* CostForge Header */}
      <div className='mb-8'>
        <div className='bg-white/10 backdrop-blur-lg border border-cyan-400/20 rounded-2xl p-6 relative overflow-hidden'>
          <div className='absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent -translate-x-full animate-pulse' />
          <div className='relative z-10'>
            <h1 className='text-6xl font-black bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 bg-clip-text text-transparent mb-2'>
              COSTFORGE QUANTUM
            </h1>
            <p className='text-2xl text-cyan-400 font-semibold'>
              Construction Intelligence • Transcended.
            </p>
            <p className='text-lg text-slate-300 mt-2'>
              AI-Powered Cost Estimation • Real-Time Analytics • Government Excellence
            </p>
          </div>
        </div>
      </div>

      {/* CostForge Metrics Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        {/* Total Estimates */}
        <div className='bg-white/10 backdrop-blur-lg border border-cyan-400/30 rounded-2xl p-6 hover:shadow-2xl hover:shadow-cyan-400/20 hover:transform hover:-translate-y-1 transition-all duration-500'>
          <div className='flex items-center justify-between mb-4'>
            <Calculator className='w-8 h-8 text-cyan-400' />
            <div className='w-3 h-3 bg-green-400 rounded-full animate-pulse' />
          </div>
          <div className='text-3xl font-black text-white mb-2'>
            {totalEstimates.toLocaleString()}
          </div>
          <div className='text-cyan-400 font-semibold'>TOTAL ESTIMATES</div>
          <div className='text-xs text-slate-400 mt-1'>This Month • AI-Powered</div>
        </div>

        {/* Quantum Accuracy */}
        <div className='bg-white/10 backdrop-blur-lg border border-green-400/30 rounded-2xl p-6 hover:shadow-2xl hover:shadow-green-400/20 hover:transform hover:-translate-y-1 transition-all duration-500'>
          <div className='flex items-center justify-between mb-4'>
            <Gauge className='w-8 h-8 text-green-400' />
            <div className='w-3 h-3 bg-green-400 rounded-full animate-pulse' />
          </div>
          <div className='text-3xl font-black text-white mb-2'>{quantumAccuracy.toFixed(1)}%</div>
          <div className='text-green-400 font-semibold'>QUANTUM ACCURACY</div>
          <div className='text-xs text-slate-400 mt-1'>Government Standard</div>
        </div>

        {/* Active AI Agents */}
        <div className='bg-white/10 backdrop-blur-lg border border-blue-400/30 rounded-2xl p-6 hover:shadow-2xl hover:shadow-blue-400/20 hover:transform hover:-translate-y-1 transition-all duration-500'>
          <div className='flex items-center justify-between mb-4'>
            <Cpu className='w-8 h-8 text-blue-400' />
            <div className='w-3 h-3 bg-green-400 rounded-full animate-pulse' />
          </div>
          <div className='text-3xl font-black text-white mb-2'>{aiAgentsActive}</div>
          <div className='text-blue-400 font-semibold'>AI AGENTS ACTIVE</div>
          <div className='text-xs text-slate-400 mt-1'>Real-Time Processing</div>
        </div>

        {/* Cost Savings */}
        <div className='bg-white/10 backdrop-blur-lg border border-purple-400/30 rounded-2xl p-6 hover:shadow-2xl hover:shadow-purple-400/20 hover:transform hover:-translate-y-1 transition-all duration-500'>
          <div className='flex items-center justify-between mb-4'>
            <TrendingUp className='w-8 h-8 text-purple-400' />
            <div className='w-3 h-3 bg-green-400 rounded-full animate-pulse' />
          </div>
          <div className='text-3xl font-black text-white mb-2'>${costSavings.toFixed(1)}M</div>
          <div className='text-purple-400 font-semibold'>COST SAVINGS</div>
          <div className='text-xs text-slate-400 mt-1'>Quantum Optimization</div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
        {/* Quantum Performance Analytics */}
        <div className='bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-lg border-2 border-cyan-400/30 rounded-3xl p-8 relative'>
          <div className='absolute inset-0 opacity-5 bg-gradient-to-br from-cyan-400/20 to-transparent' />
          <div className='relative z-10'>
            <h3 className='text-2xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 bg-clip-text text-transparent mb-6'>
              QUANTUM ANALYTICS ENGINE
            </h3>
            <ResponsiveContainer width='100%' height={300}>
              <AreaChart data={quantumAnalytics}>
                <defs>
                  <linearGradient id='costForgeGradient' x1='0%' y1='0%' x2='100%' y2='0%'>
                    <stop offset='0%' stopColor='var(--tf-network-blue)' stopOpacity={0.8} />
                    <stop offset='50%' stopColor='var(--tf-transcend-highlight)' stopOpacity={1} />
                    <stop offset='100%' stopColor='var(--tf-accent-success)' stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id='areaGradient' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor='var(--tf-transcend-highlight)' stopOpacity={0.8} />
                    <stop offset='95%' stopColor='var(--tf-transcend-highlight)' stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray='3 3' stroke='var(--gray-700)' />
                <XAxis dataKey='name' stroke='var(--tf-text-secondary)' />
                <YAxis stroke='var(--tf-text-secondary)' domain={[95, 100]} />
                <Area
                  type='monotone'
                  dataKey='accuracy'
                  stroke='var(--tf-transcend-highlight)'
                  fillOpacity={1}
                  fill='url(#areaGradient)'
                  strokeWidth={3}
                />
                <Line
                  type='monotone'
                  dataKey='performance'
                  stroke='var(--tf-network-blue)'
                  strokeWidth={2}
                  dot={{ fill: 'var(--tf-network-blue)', r: 6, strokeWidth: 2, stroke: 'var(--tf-accent-success)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CostForge Performance Distribution */}
        <div className='bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-lg border-2 border-green-400/30 rounded-3xl p-8 relative'>
          <div className='absolute inset-0 opacity-10 bg-gradient-to-br from-green-400/20 to-transparent' />
          <div className='relative z-10'>
            <h3 className='text-2xl font-bold bg-gradient-to-r from-green-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent mb-6'>
              COSTFORGE AI PERFORMANCE
            </h3>
            <ResponsiveContainer width='100%' height={300}>
              <BarChart data={costForgePerformance}>
                <CartesianGrid strokeDasharray='3 3' stroke='var(--gray-700)' />
                <XAxis dataKey='name' stroke='var(--tf-text-secondary)' />
                <YAxis stroke='var(--tf-text-secondary)' />
                <Bar dataKey='calculations' radius={[4, 4, 0, 0]}>
                  {costForgePerformance.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        index % 4 === 0
                          ? 'var(--tf-network-blue)'
                          : index % 4 === 1
                            ? 'var(--tf-transcend-highlight)'
                            : index % 4 === 2
                              ? 'var(--tf-accent-success)'
                              : 'var(--tf-accent-pink)'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Real-Time Activity Monitor */}
      <div className='bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-lg border-2 border-blue-400/30 rounded-3xl p-8 relative mb-8'>
        <div className='absolute inset-0 opacity-10 bg-gradient-to-br from-blue-400/20 to-transparent' />
        <div className='relative z-10'>
          <h3 className='text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-6'>
            REAL-TIME ESTIMATION ACTIVITY
          </h3>
          <ResponsiveContainer width='100%' height={200}>
            <LineChart data={realTimeMetrics}>
              <CartesianGrid strokeDasharray='3 3' stroke='var(--gray-700)' />
              <XAxis dataKey='time' stroke='var(--tf-text-secondary)' />
              <YAxis yAxisId='left' stroke='var(--tf-text-secondary)' />
              <YAxis yAxisId='right' orientation='right' stroke='var(--tf-text-secondary)' />
              <Line
                yAxisId='left'
                type='monotone'
                dataKey='estimates'
                stroke='var(--tf-transcend-highlight)'
                strokeWidth={3}
                dot={{ fill: 'var(--tf-transcend-highlight)', r: 4 }}
                activeDot={{ r: 8, stroke: 'var(--tf-accent-success)', strokeWidth: 2 }}
              />
              <Line
                yAxisId='right'
                type='monotone'
                dataKey='accuracy'
                stroke='var(--tf-accent-pink)'
                strokeWidth={2}
                strokeDasharray='5 5'
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* System Status & Performance Indicators */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
        <div className='bg-white/10 backdrop-blur-lg border border-cyan-400/20 rounded-xl p-6'>
          <div className='flex items-center justify-between mb-4'>
            <Shield className='w-6 h-6 text-cyan-400' />
            <div className='text-sm text-green-400 font-medium'>OPERATIONAL</div>
          </div>
          <div className='text-lg font-bold text-white mb-1'>System Health</div>
          <div className='text-2xl font-black text-cyan-400'>{systemHealth}</div>
          <div className='text-xs text-slate-400 mt-1'>Government-Grade Security</div>
        </div>

        <div className='bg-white/10 backdrop-blur-lg border border-green-400/20 rounded-xl p-6'>
          <div className='flex items-center justify-between mb-4'>
            <Database className='w-6 h-6 text-green-400' />
            <div className='text-sm text-green-400 font-medium'>SYNCHRONIZED</div>
          </div>
          <div className='text-lg font-bold text-white mb-1'>Data Pipeline</div>
          <div className='text-2xl font-black text-green-400'>REAL-TIME</div>
          <div className='text-xs text-slate-400 mt-1'>Zero Latency Processing</div>
        </div>

        <div className='bg-white/10 backdrop-blur-lg border border-blue-400/20 rounded-xl p-6'>
          <div className='flex items-center justify-between mb-4'>
            <Activity className='w-6 h-6 text-blue-400' />
            <div className='text-sm text-green-400 font-medium'>OPTIMAL</div>
          </div>
          <div className='text-lg font-bold text-white mb-1'>AI Processing</div>
          <div className='text-2xl font-black text-blue-400'>47ms</div>
          <div className='text-xs text-slate-400 mt-1'>Average Response Time</div>
        </div>
      </div>

      {/* CostForge Action Panel */}
      <div className='bg-white/10 backdrop-blur-lg border border-cyan-400/20 rounded-2xl p-6 relative overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent -translate-x-full animate-pulse' />
        <div className='relative z-10 flex flex-wrap gap-4'>
          <button className='bg-gradient-to-br from-blue-500 via-cyan-500 to-green-500 text-white uppercase font-semibold rounded-full px-8 py-3 shadow-lg hover:shadow-2xl hover:transform hover:-translate-y-1 transition-all duration-300 border border-cyan-400/30 backdrop-blur-sm'>
            🎯 NEW ESTIMATE
          </button>
          <button className='bg-gradient-to-br from-blue-500 via-cyan-500 to-green-500 text-white uppercase font-semibold rounded-full px-8 py-3 shadow-lg hover:shadow-2xl hover:transform hover:-translate-y-1 transition-all duration-300 border border-cyan-400/30 backdrop-blur-sm'>
            📊 ANALYTICS DEEP DIVE
          </button>
          <button className='bg-gradient-to-br from-blue-500 via-cyan-500 to-green-500 text-white uppercase font-semibold rounded-full px-8 py-3 shadow-lg hover:shadow-2xl hover:transform hover:-translate-y-1 transition-all duration-300 border border-cyan-400/30 backdrop-blur-sm'>
            🧠 AI INSIGHTS
          </button>
          <button className='bg-gradient-to-br from-blue-500 via-cyan-500 to-green-500 text-white uppercase font-semibold rounded-full px-8 py-3 shadow-lg hover:shadow-2xl hover:transform hover:-translate-y-1 transition-all duration-300 border border-cyan-400/30 backdrop-blur-sm'>
            ⚡ QUANTUM DEPLOY
          </button>
        </div>
      </div>

      {/* Footer Stats */}
      <div className='mt-8 grid grid-cols-2 md:grid-cols-4 gap-4'>
        <div className='bg-slate-800/30 border border-slate-600/50 rounded-lg p-4 text-center'>
          <div className='text-2xl font-bold text-cyan-400'>39+</div>
          <div className='text-sm text-slate-400'>Counties Served</div>
        </div>
        <div className='bg-slate-800/30 border border-slate-600/50 rounded-lg p-4 text-center'>
          <div className='text-2xl font-bold text-green-400'>99.5%</div>
          <div className='text-sm text-slate-400'>AI Accuracy</div>
        </div>
        <div className='bg-slate-800/30 border border-slate-600/50 rounded-lg p-4 text-center'>
          <div className='text-2xl font-bold text-purple-400'>$47M+</div>
          <div className='text-sm text-slate-400'>Cost Savings</div>
        </div>
        <div className='bg-slate-800/30 border border-slate-600/50 rounded-lg p-4 text-center'>
          <div className='text-2xl font-bold text-blue-400'>&lt;50ms</div>
          <div className='text-sm text-slate-400'>Quantum Response</div>
        </div>
      </div>
    </div>
  );
}

export default CostForgeQuantumDashboard;
