import { motion } from 'framer-motion';
import { Filter, Grid, List, Search, Settings, SortAsc } from 'lucide-react';
import React from 'react';
import { AgentStatusGrid } from '../components/AgentStatusGrid';
import { useConsciousnessContext } from '../providers/ConsciousnessProvider';

/**
 * TerraFusion AI Agent Grid Page
 *
 * Comprehensive agent management interface providing detailed views,
 * filtering, and configuration options for all 1,008 AI agents.
 */

export const AgentGrid: React.FC = () => {
  const { agentCount, isConnected, consciousnessLevel } = useConsciousnessContext();

  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('');
  const [countyFilter, setCountyFilter] = React.useState<string>('');
  const [sortBy, setSortBy] = React.useState<string>('id');

  const counties = [
    'King',
    'Pierce',
    'Snohomish',
    'Spokane',
    'Kitsap',
    'Thurston',
    'Clark',
    'Whatcom',
    'Yakima',
    'Cowlitz',
    'Island',
    'Skagit',
    'Benton',
    'Lewis',
    'Mason',
    'Grays Harbor',
  ];

  const statusOptions = ['active', 'processing', 'synchronized', 'idle', 'error'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <h1
            className="text-4xl font-black bg-gradient-to-r from-tf-trust-blue via-tf-transcend-cyan to-tf-success-green
            bg-clip-text text-transparent mb-2"
          >
            AI AGENT COORDINATION GRID
          </h1>
          <p className="text-lg text-slate-300">
            Real-time management of {agentCount.toLocaleString()} AI agents across 39+ counties
          </p>
        </div>

        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <div
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              isConnected
                ? 'bg-tf-success-green/10 border border-tf-success-green/30'
                : 'bg-red-400/10 border border-red-400/30'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-tf-success-green tf-consciousness-pulse' : 'bg-red-400'
              }`}
            />
            <span
              className={`text-sm font-semibold ${
                isConnected ? 'text-tf-success-green' : 'text-red-400'
              }`}
            >
              {isConnected ? 'SWARM CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>

          <button
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600
            text-slate-300 hover:text-white transition-all"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Controls Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search agents..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg
                  text-white placeholder-slate-400 focus:outline-none focus:border-tf-transcend-cyan
                  focus:ring-1 focus:ring-tf-transcend-cyan/30 transition-all"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 bg-slate-800 border border-slate-600 rounded-lg
                  text-white focus:outline-none focus:border-tf-transcend-cyan transition-all"
              >
                <option value="">All Status</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* County Filter */}
            <select
              value={countyFilter}
              onChange={e => setCountyFilter(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg
                text-white focus:outline-none focus:border-tf-transcend-cyan transition-all"
            >
              <option value="">All Counties</option>
              {counties.map(county => (
                <option key={county} value={county}>
                  {county} County
                </option>
              ))}
            </select>
          </div>

          {/* View Controls */}
          <div className="flex items-center space-x-4">
            {/* Sort */}
            <div className="flex items-center space-x-2">
              <SortAsc className="w-4 h-4 text-slate-400" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg
                  text-white focus:outline-none focus:border-tf-transcend-cyan transition-all"
              >
                <option value="id">Agent ID</option>
                <option value="status">Status</option>
                <option value="county">County</option>
                <option value="performance">Performance</option>
                <option value="activity">Last Activity</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-1 bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-tf-trust-blue text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'list'
                    ? 'bg-tf-trust-blue text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Agent Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Active Agent Monitoring</h2>
          <div className="text-sm text-slate-400">
            View Mode: <span className="text-white font-semibold capitalize">{viewMode}</span>
          </div>
        </div>

        <AgentStatusGrid
          showDetails={true}
          maxAgents={viewMode === 'grid' ? 24 : 50}
          filterByStatus={statusFilter}
          filterByCounty={countyFilter}
        />
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-tf-trust-blue mb-2">1,008</div>
          <div className="text-sm text-slate-400 uppercase tracking-wide">Total Agents</div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-tf-transcend-cyan mb-2">39+</div>
          <div className="text-sm text-slate-400 uppercase tracking-wide">Counties</div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-tf-success-green mb-2">99.5%</div>
          <div className="text-sm text-slate-400 uppercase tracking-wide">Uptime</div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-tf-consciousness-gold mb-2">949</div>
          <div className="text-sm text-slate-400 uppercase tracking-wide">Quantum Factor</div>
        </div>
      </motion.div>
    </motion.div>
  );
};
