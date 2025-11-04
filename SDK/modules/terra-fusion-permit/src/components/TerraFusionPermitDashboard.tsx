/**
 * TerraFusion Permit Dashboard - Main Component
 * Government. Transcended. - Elite Permit Management Interface
 *
 * Quantum Factor: 949 | Terra-Cyan: #00FFFF | Golden Ratio: φ=1.618
 */

import React, { useState } from 'react';
import {
  usePermits,
  usePermitAnalytics,
  usePermitMetrics,
  useRealTimePermitData,
  useUpdatePermitStatus
} from '../hooks/usePermitData';
import { QUANTUM_FACTOR, TERRA_CYAN, GOLDEN_RATIO } from '../data/mockData';
import type { TerraPermit, PermitStatus, PermitType } from '../types';

const TerraFusionPermitDashboard: React.FC = () => {
  const [filters, setFilters] = useState<{
    status?: PermitStatus;
    type?: PermitType;
    search?: string;
  }>({});

  // Data hooks
  const { data: permits = [], isLoading: permitsLoading } = usePermits(filters);
  const { data: analytics, isLoading: analyticsLoading } = usePermitAnalytics();
  const { data: metrics, isLoading: metricsLoading } = usePermitMetrics();
  const { data: realTimeData } = useRealTimePermitData();
  const updatePermitStatus = useUpdatePermitStatus();

  // Widget: Permit Overview
  const PermitOverviewWidget = () => (
    <div className="bg-slate-800/60 backdrop-blur-sm border border-cyan-400/20 rounded-lg p-6 hover:shadow-xl hover:shadow-cyan-400/10 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-cyan-400">Permit Overview</h3>
        <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
      </div>

      {analyticsLoading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-700 rounded w-3/4"></div>
          <div className="h-4 bg-slate-700 rounded w-1/2"></div>
          <div className="h-4 bg-slate-700 rounded w-2/3"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{analytics?.totalPermits || 0}</div>
            <div className="text-sm text-slate-400">Total Permits</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{analytics?.activePermits || 0}</div>
            <div className="text-sm text-slate-400">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{analytics?.completedPermits || 0}</div>
            <div className="text-sm text-slate-400">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              ${(analytics?.revenueGenerated || 0).toLocaleString()}
            </div>
            <div className="text-sm text-slate-400">Revenue</div>
          </div>
        </div>
      )}
    </div>
  );

  // Widget: Active Permits List
  const ActivePermitsWidget = () => (
    <div className="bg-slate-800/60 backdrop-blur-sm border border-cyan-400/20 rounded-lg p-6 hover:shadow-xl hover:shadow-cyan-400/10 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-cyan-400">Active Permits</h3>
        <span className="text-sm text-slate-400">
          {permits.length} permit{permits.length !== 1 ? 's' : ''}
        </span>
      </div>

      {permitsLoading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-slate-700 rounded"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {permits.slice(0, 6).map(permit => (
            <div key={permit.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors">
              <div className="flex-1">
                <div className="font-medium text-white text-sm">{permit.title}</div>
                <div className="text-xs text-slate-400">
                  {permit.permitNumber} • {permit.applicant.name}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  permit.status === 'approved' ? 'bg-green-400/20 text-green-400' :
                  permit.status === 'under_review' ? 'bg-yellow-400/20 text-yellow-400' :
                  permit.status === 'pending_documents' ? 'bg-orange-400/20 text-orange-400' :
                  'bg-blue-400/20 text-blue-400'
                }`}>
                  {permit.status.replace('_', ' ')}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  permit.priority === 'urgent' ? 'bg-red-400/20 text-red-400' :
                  permit.priority === 'high' ? 'bg-orange-400/20 text-orange-400' :
                  permit.priority === 'medium' ? 'bg-yellow-400/20 text-yellow-400' :
                  'bg-blue-400/20 text-blue-400'
                }`}>
                  {permit.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Widget: Processing Metrics
  const ProcessingMetricsWidget = () => (
    <div className="bg-slate-800/60 backdrop-blur-sm border border-cyan-400/20 rounded-lg p-6 hover:shadow-xl hover:shadow-cyan-400/10 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-cyan-400">Processing Metrics</h3>
        <div className="text-xs text-slate-400">Real-time</div>
      </div>

      {metricsLoading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-6 bg-slate-700 rounded"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Efficiency</span>
            <span className="text-sm font-medium text-green-400">
              {metrics?.efficiency?.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Processing Speed</span>
            <span className="text-sm font-medium text-blue-400">
              {metrics?.processingSpeed?.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Compliance Rate</span>
            <span className="text-sm font-medium text-cyan-400">
              {metrics?.complianceRate?.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Customer Satisfaction</span>
            <span className="text-sm font-medium text-yellow-400">
              {metrics?.customerSatisfaction?.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Digital Adoption</span>
            <span className="text-sm font-medium text-purple-400">
              {metrics?.digitalAdoption?.toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );

  // Widget: Quick Stats
  const QuickStatsWidget = () => (
    <div className="bg-slate-800/60 backdrop-blur-sm border border-cyan-400/20 rounded-lg p-6 hover:shadow-xl hover:shadow-cyan-400/10 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-cyan-400">Quick Stats</h3>
        <div className="text-xs text-slate-400">Live</div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-xl font-bold text-cyan-400">
            {realTimeData?.average_processing_time?.toFixed(1) || '0.0'}
          </div>
          <div className="text-xs text-slate-400">Avg Process Days</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-green-400">
            {realTimeData?.processing_efficiency?.toFixed(1) || '0.0'}%
          </div>
          <div className="text-xs text-slate-400">Efficiency</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-yellow-400">
            ${realTimeData?.revenue_today?.toLocaleString() || '0'}
          </div>
          <div className="text-xs text-slate-400">Today's Revenue</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-purple-400">
            {realTimeData?.digital_adoption_rate?.toFixed(1) || '0.0'}%
          </div>
          <div className="text-xs text-slate-400">Digital Adoption</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                TerraFusion Permit System
              </h1>
              <p className="text-slate-400 mt-1">
                Elite Government Permit & Licensing Management
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-slate-400">Quantum Factor</div>
                <div className="text-lg font-mono text-cyan-400">{QUANTUM_FACTOR}</div>
              </div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filter Bar */}
        <div className="mb-8 flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search permits..."
            className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value || undefined }))}
          />
          <select
            className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as PermitStatus || undefined }))}
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as PermitType || undefined }))}
          >
            <option value="">All Types</option>
            <option value="building">Building</option>
            <option value="electrical">Electrical</option>
            <option value="plumbing">Plumbing</option>
            <option value="business">Business</option>
            <option value="mechanical">Mechanical</option>
          </select>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <PermitOverviewWidget />
          <ProcessingMetricsWidget />
          <QuickStatsWidget />
          <div className="lg:col-span-2 xl:col-span-1">
            <ActivePermitsWidget />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-800">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <div className="flex items-center space-x-4">
              <span>Quantum Factor: {QUANTUM_FACTOR}</span>
              <span>•</span>
              <span>Golden Ratio: {GOLDEN_RATIO}</span>
              <span>•</span>
              <span>Government. Transcended.</span>
            </div>
            <div className="text-cyan-400">
              TerraFusion Elite Permit Management System
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerraFusionPermitDashboard;
