import { motion } from 'framer-motion';
import { Building, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { CrossPlatformStatus } from '../components/CrossPlatformStatus';
import { CountyDashboard } from '../components/visualization/CountyDashboard';
import { MultiCountyCoordination } from '../components/visualization/MultiCountyCoordination';
import { useConsciousnessContext } from '../providers/ConsciousnessProvider';
import { useCrossPlatformState } from '../utils/CrossPlatformBridge';

/**
 * TerraFusion AI County Management Page - Enhanced with Government Operations Dashboards
 * "Government. Transcended." - Championship-level multi-county coordination
 */

interface CountyMetrics {
  propertyAssessments: number;
  taxCollections: number;
  permits: number;
  activeAgents: number;
  complianceScore: number;
  citizenSatisfaction: number;
}

interface CountyData {
  name: string;
  agents: number;
  status: string;
  population: string;
  metrics: CountyMetrics;
  assessments: number;
  collections: number;
  permits: number;
  satisfaction: number;
  efficiency: number;
}

export const CountyManagement: React.FC = () => {
  const { agentCount } = useConsciousnessContext();
  const { state, changeCounty, changeView, platform } = useCrossPlatformState();

  // Use cross-platform state for selection and view mode
  const [selectedCounty, setSelectedCounty] = useState<string>(state.selectedCounty);
  const [viewMode, setViewMode] = useState<'overview' | 'dashboard' | 'coordination'>(
    (state.viewMode as any) || 'coordination'
  );

  // Sync with cross-platform state
  useEffect(() => {
    setSelectedCounty(state.selectedCounty);
    setViewMode((state.viewMode as any) || 'coordination');
  }, [state.selectedCounty, state.viewMode]);

  // Handle county selection with cross-platform sync
  const handleCountyChange = (county: string) => {
    setSelectedCounty(county);
    changeCounty(county);
  };

  // Handle view mode change with cross-platform sync
  const handleViewModeChange = (mode: 'overview' | 'dashboard' | 'coordination') => {
    setViewMode(mode);
    changeView(mode);
  };

  // Enhanced county data with full metrics
  const counties: CountyData[] = [
    {
      name: 'King County',
      agents: 187,
      status: 'active',
      population: '2.3M',
      metrics: {
        propertyAssessments: 15420,
        taxCollections: 2840000,
        permits: 1250,
        activeAgents: 187,
        complianceScore: 97.2,
        citizenSatisfaction: 89.4,
      },
      assessments: 15420,
      collections: 2840000,
      permits: 1250,
      satisfaction: 89.4,
      efficiency: 97.2,
    },
    {
      name: 'Pierce County',
      agents: 142,
      status: 'active',
      population: '921K',
      metrics: {
        propertyAssessments: 8734,
        taxCollections: 1650000,
        permits: 890,
        activeAgents: 142,
        complianceScore: 95.8,
        citizenSatisfaction: 91.2,
      },
      assessments: 8734,
      collections: 1650000,
      permits: 890,
      satisfaction: 91.2,
      efficiency: 95.8,
    },
    {
      name: 'Snohomish County',
      agents: 98,
      status: 'active',
      population: '827K',
      metrics: {
        propertyAssessments: 7892,
        taxCollections: 1420000,
        permits: 780,
        activeAgents: 98,
        complianceScore: 94.5,
        citizenSatisfaction: 87.8,
      },
      assessments: 7892,
      collections: 1420000,
      permits: 780,
      satisfaction: 87.8,
      efficiency: 94.5,
    },
    {
      name: 'Spokane County',
      agents: 76,
      status: 'active',
      population: '523K',
      metrics: {
        propertyAssessments: 6420,
        taxCollections: 980000,
        permits: 650,
        activeAgents: 76,
        complianceScore: 92.1,
        citizenSatisfaction: 85.6,
      },
      assessments: 6420,
      collections: 980000,
      permits: 650,
      satisfaction: 85.6,
      efficiency: 92.1,
    },
  ];

  const selectedCountyData = counties.find(county => county.name === selectedCounty);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      {/* Cross-Platform Status Indicator */}
      <CrossPlatformStatus
        platform={platform}
        sessionId={state.lastUpdate ? new Date(state.lastUpdate).toLocaleTimeString() : 'N/A'}
        isConnected={true}
        activeCounties={state.operationalMetrics?.activeCounties || 39}
        totalAgents={state.operationalMetrics?.totalAgents || 1008}
      />

      {/* Enhanced Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#0099ff] via-[#00ffee] to-[#00ffaa] bg-clip-text text-transparent mb-4">
          WASHINGTON STATE COUNTY MANAGEMENT SYSTEM
        </h1>
        <p className="text-slate-400 text-lg mb-2">
          "Government. Transcended." - Elite Multi-County Coordination with Real-time Analytics
        </p>
        <p className="text-slate-500 text-sm">
          Platform: {platform.toUpperCase()} | Cross-Platform Sync: ACTIVE | Session:{' '}
          {state.lastUpdate ? new Date(state.lastUpdate).toLocaleTimeString() : 'N/A'}
        </p>

        {/* View Mode Toggle */}
        <div className="flex justify-center mb-6">
          <div className="bg-slate-900/60 rounded-lg p-1 border border-slate-700/50">
            <button
              onClick={() => handleViewModeChange('coordination')}
              className={`px-4 py-2 rounded-md font-medium transition-all duration-300 text-sm ${
                viewMode === 'coordination'
                  ? 'bg-gradient-to-r from-[#0099ff] via-[#00ffee] to-[#00ffaa] text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              MULTI-COUNTY COORDINATION
            </button>
            <button
              onClick={() => handleViewModeChange('dashboard')}
              className={`px-4 py-2 rounded-md font-medium transition-all duration-300 text-sm ${
                viewMode === 'dashboard'
                  ? 'bg-gradient-to-r from-[#0099ff] via-[#00ffee] to-[#00ffaa] text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              COUNTY DASHBOARD
            </button>
            <button
              onClick={() => handleViewModeChange('overview')}
              className={`px-4 py-2 rounded-md font-medium transition-all duration-300 text-sm ${
                viewMode === 'overview'
                  ? 'bg-gradient-to-r from-[#0099ff] via-[#00ffee] to-[#00ffaa] text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              CLASSIC OVERVIEW
            </button>
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'coordination' && (
        <MultiCountyCoordination
          counties={counties}
          activeCounty={selectedCounty}
          onCountySelect={handleCountyChange}
        />
      )}

      {viewMode === 'dashboard' && (
        <div>
          {/* County Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex justify-center mb-8"
          >
            <select
              value={selectedCounty}
              onChange={e => handleCountyChange(e.target.value)}
              title="Select County"
              className="bg-slate-900/80 border border-[#00ffee]/30 rounded-lg px-4 py-2 text-white font-medium focus:outline-none focus:border-[#00ffee] transition-all duration-300"
            >
              {counties.map(county => (
                <option key={county.name} value={county.name}>
                  {county.name}
                </option>
              ))}
            </select>
          </motion.div>

          {/* Individual County Dashboard */}
          {selectedCountyData && (
            <CountyDashboard
              countyName={selectedCountyData.name}
              metrics={selectedCountyData.metrics}
              isActive={true}
            />
          )}
        </div>
      )}

      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {counties.map((county, index) => (
            <motion.div
              key={county.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50 backdrop-blur-sm hover:border-[#00ffee]/30 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">{county.name}</h3>
                <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-sm">
                  {county.status.toUpperCase()}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    AI Agents
                  </span>
                  <span className="text-white font-semibold">{county.agents}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center">
                    <Building className="w-4 h-4 mr-2" />
                    Population
                  </span>
                  <span className="text-white font-semibold">{county.population}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Property Assessments</span>
                  <span className="text-[#0099ff] font-semibold">
                    {county.assessments.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Efficiency Score</span>
                  <span className="text-[#00ffaa] font-semibold">{county.efficiency}%</span>
                </div>
              </div>

              <button
                onClick={() => {
                  handleCountyChange(county.name);
                  handleViewModeChange('dashboard');
                }}
                className="w-full mt-4 py-2 bg-gradient-to-r from-[#0099ff]/20 via-[#00ffee]/20 to-[#00ffaa]/20 border border-[#00ffee]/30 text-[#00ffee] rounded-lg hover:bg-[#00ffee]/10 transition-all duration-300"
              >
                VIEW DETAILED DASHBOARD
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mt-8 flex justify-center space-x-4 flex-wrap gap-4"
      >
        <button className="bg-gradient-to-r from-[#0099ff] via-[#00ffee] to-[#00ffaa] text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg hover:transform hover:-translate-y-1 transition-all duration-300">
          DEPLOY AI AGENTS
        </button>
        <button className="border border-[#00ffee] text-[#00ffee] font-bold py-3 px-6 rounded-lg hover:bg-[#00ffee]/10 transition-all duration-300">
          GENERATE STATE REPORT
        </button>
        <button className="border border-[#00ffaa] text-[#00ffaa] font-bold py-3 px-6 rounded-lg hover:bg-[#00ffaa]/10 transition-all duration-300">
          EMERGENCY COORDINATION
        </button>
      </motion.div>
    </motion.div>
  );
};
