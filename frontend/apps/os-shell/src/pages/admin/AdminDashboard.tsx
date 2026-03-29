// TFR-099: Admin Dashboard
// Tabbed administration interface: County Config, Data Quality, Security Audit,
// Users, Study Periods, Scrape Jobs.
//
// DATA POSTURE: ALL tab panels (County Config, Data Quality, Security Audit, Users,
// Study Periods, Scrape Jobs) use hardcoded sample fixtures scoped to Benton County.
// No backend connection exists. County selector, security events, user list,
// study periods, scrape jobs, and data quality metrics are all static sample data.
// Mutations are in-memory only and do not persist.

import React, { useState, useCallback, useMemo } from 'react';
import { useParcelCount } from '../../hooks/useParcelCount';
import { DemoDataBanner } from '@/components/governance/DemoDataBanner';

// ── Types ───────────────────────────────────────────────────────────────────

interface County {
  id: string;
  name: string;
  state: string;
  fipsCode: string;
}

interface DataQualityMetric {
  label: string;
  value: number;
  total: number;
  status: 'good' | 'warning' | 'critical';
}

interface SecurityEvent {
  id: string;
  timestamp: string;
  type: string;
  user: string;
  action: string;
  resource: string;
  outcome: 'success' | 'failure' | 'blocked';
  ipAddress: string;
}

interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: 'Admin' | 'Developer' | 'Viewer';
  status: 'active' | 'suspended' | 'pending';
  lastLogin: string | null;
  countyId: string;
}

interface StudyPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'closed' | 'draft';
  propertyCount: number;
}

interface ScrapeJob {
  id: string;
  source: string;
  status: 'running' | 'completed' | 'failed' | 'queued';
  startedAt: string;
  completedAt: string | null;
  recordsProcessed: number;
  errors: number;
}

type TabId = 'county' | 'quality' | 'security' | 'users' | 'studies' | 'scrape';

// ── Tab definitions ─────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string }[] = [
  { id: 'county', label: 'County Config' },
  { id: 'quality', label: 'Data Quality' },
  { id: 'security', label: 'Security Audit' },
  { id: 'users', label: 'Users' },
  { id: 'studies', label: 'Study Periods' },
  { id: 'scrape', label: 'Scrape Jobs' },
];

// ── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    good: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    critical: 'bg-red-100 text-red-800',
    active: 'bg-green-100 text-green-800',
    suspended: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    running: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    queued: 'bg-gray-100 text-gray-800',
    closed: 'bg-gray-100 text-gray-800',
    draft: 'bg-yellow-100 text-yellow-800',
    success: 'bg-green-100 text-green-800',
    failure: 'bg-red-100 text-red-800',
    blocked: 'bg-orange-100 text-orange-800',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[status] ?? 'bg-gray-100 text-gray-800'}`}
    >
      {status}
    </span>
  );
}

function MetricCard({ metric }: { metric: DataQualityMetric }) {
  const pct = metric.total > 0 ? Math.round((metric.value / metric.total) * 100) : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-600">{metric.label}</h4>
        <StatusBadge status={metric.status} />
      </div>
      <p className="text-2xl font-bold text-gray-900">{pct}%</p>
      <p className="text-xs text-gray-500 mt-1">
        {metric.value.toLocaleString()} / {metric.total.toLocaleString()} records
      </p>
      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${metric.status === 'good' ? 'bg-green-500' : metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Tab panels ──────────────────────────────────────────────────────────────

function CountyConfigPanel({ county }: { county: County }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">County Configuration</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">County Name</label>
          <p className="text-lg text-gray-900">{county.name}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">State</label>
          <p className="text-lg text-gray-900">{county.state}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">FIPS Code</label>
          <p className="text-lg text-gray-900">{county.fipsCode}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">County ID</label>
          <p className="text-lg text-gray-900 font-mono">{county.id}</p>
        </div>
      </div>
    </div>
  );
}

function DataQualityPanel() {
  const { data: statsData } = useParcelCount();
  const parcelCount = statsData?.totalParcels ?? 89_247;

  const metrics: DataQualityMetric[] = [
    { label: 'Parcel Completeness', value: 87432, total: parcelCount, status: 'good' },
    { label: 'Address Validation', value: 84100, total: parcelCount, status: 'warning' },
    { label: 'Value Assessment Coverage', value: 88500, total: parcelCount, status: 'good' },
    { label: 'GIS Spatial Match', value: 82300, total: parcelCount, status: 'warning' },
    { label: 'Owner Record Linkage', value: 88900, total: parcelCount, status: 'good' },
    { label: 'Tax Code Validity', value: 89100, total: parcelCount, status: 'good' },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Data Quality Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((m) => (
          <MetricCard key={m.label} metric={m} />
        ))}
      </div>
    </div>
  );
}

function SecurityAuditPanel() {
  const events: SecurityEvent[] = [
    { id: '1', timestamp: '2026-03-15T09:32:00Z', type: 'AUTH', user: 'admin@benton.wa.gov', action: 'LOGIN', resource: '/api/auth/login', outcome: 'success', ipAddress: '10.0.1.45' },
    { id: '2', timestamp: '2026-03-15T09:28:00Z', type: 'RBAC', user: 'viewer@benton.wa.gov', action: 'ACCESS_DENIED', resource: '/api/admin/users', outcome: 'blocked', ipAddress: '10.0.1.52' },
    { id: '3', timestamp: '2026-03-15T09:15:00Z', type: 'AUTH', user: 'unknown@external.com', action: 'LOGIN_FAILED', resource: '/api/auth/login', outcome: 'failure', ipAddress: '192.168.1.100' },
    { id: '4', timestamp: '2026-03-15T08:55:00Z', type: 'DATA', user: 'dev@benton.wa.gov', action: 'EXPORT', resource: '/api/properties/export', outcome: 'success', ipAddress: '10.0.1.60' },
    { id: '5', timestamp: '2026-03-15T08:30:00Z', type: 'AUTH', user: 'admin@benton.wa.gov', action: 'TOKEN_REFRESH', resource: '/api/auth/refresh', outcome: 'success', ipAddress: '10.0.1.45' },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Security Event Log</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outcome</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {events.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                  {new Date(e.timestamp).toLocaleTimeString()}
                </td>
                <td className="px-4 py-3 text-sm font-mono text-gray-700">{e.type}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{e.user}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{e.action}</td>
                <td className="px-4 py-3 text-sm font-mono text-gray-500">{e.resource}</td>
                <td className="px-4 py-3"><StatusBadge status={e.outcome} /></td>
                <td className="px-4 py-3 text-sm font-mono text-gray-500">{e.ipAddress}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsersPanel() {
  const [users] = useState<AdminUser[]>([
    { id: '1', email: 'admin@benton.wa.gov', displayName: 'County Admin', role: 'Admin', status: 'active', lastLogin: '2026-03-15T09:32:00Z', countyId: 'benton' },
    { id: '2', email: 'dev@benton.wa.gov', displayName: 'Dev User', role: 'Developer', status: 'active', lastLogin: '2026-03-14T16:45:00Z', countyId: 'benton' },
    { id: '3', email: 'viewer@benton.wa.gov', displayName: 'Staff Viewer', role: 'Viewer', status: 'active', lastLogin: '2026-03-15T08:10:00Z', countyId: 'benton' },
    { id: '4', email: 'suspended@benton.wa.gov', displayName: 'Former Staff', role: 'Viewer', status: 'suspended', lastLogin: '2026-02-28T10:00:00Z', countyId: 'benton' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
        <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          Add User
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.displayName}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                <td className="px-4 py-3"><StatusBadge status={u.role.toLowerCase()} /></td>
                <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-4 py-3 text-sm space-x-2">
                  <button className="text-blue-600 hover:text-blue-800">Edit</button>
                  <button className="text-red-600 hover:text-red-800">
                    {u.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StudyPeriodsPanel() {
  const periods: StudyPeriod[] = [
    { id: '1', name: '2026 Annual Revaluation', startDate: '2026-01-01', endDate: '2026-12-31', status: 'active', propertyCount: 89_247 },
    { id: '2', name: '2025 Annual Revaluation', startDate: '2025-01-01', endDate: '2025-12-31', status: 'closed', propertyCount: 87500 },
    { id: '3', name: '2027 Preliminary', startDate: '2027-01-01', endDate: '2027-12-31', status: 'draft', propertyCount: 0 },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Study Periods</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {periods.map((p) => (
          <div key={p.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{p.name}</h4>
              <StatusBadge status={p.status} />
            </div>
            <p className="text-sm text-gray-600">{p.startDate} to {p.endDate}</p>
            <p className="text-sm text-gray-500 mt-1">
              {p.propertyCount.toLocaleString()} properties
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScrapeJobsPanel() {
  const jobs: ScrapeJob[] = [
    { id: '1', source: 'County CAMA', status: 'completed', startedAt: '2026-03-15T02:00:00Z', completedAt: '2026-03-15T04:32:00Z', recordsProcessed: 89_247, errors: 3 },
    { id: '2', source: 'GIS Parcel Layer', status: 'running', startedAt: '2026-03-15T06:00:00Z', completedAt: null, recordsProcessed: 45200, errors: 0 },
    { id: '3', source: 'Tyler Vision Sync', status: 'queued', startedAt: '2026-03-15T08:00:00Z', completedAt: null, recordsProcessed: 0, errors: 0 },
    { id: '4', source: 'Aumentum Import', status: 'failed', startedAt: '2026-03-14T22:00:00Z', completedAt: '2026-03-14T22:15:00Z', recordsProcessed: 1200, errors: 48 },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Scrape Jobs</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Records</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Errors</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {jobs.map((j) => (
              <tr key={j.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{j.source}</td>
                <td className="px-4 py-3"><StatusBadge status={j.status} /></td>
                <td className="px-4 py-3 text-sm text-gray-600">{new Date(j.startedAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {j.completedAt ? new Date(j.completedAt).toLocaleString() : '--'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{j.recordsProcessed.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={j.errors > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                    {j.errors}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('county');
  const [selectedCountyId, setSelectedCountyId] = useState('benton');

  const counties: County[] = useMemo(() => [
    { id: 'benton', name: 'Benton County', state: 'WA', fipsCode: '53005' },
    { id: 'franklin', name: 'Franklin County', state: 'WA', fipsCode: '53021' },
    { id: 'yakima', name: 'Yakima County', state: 'WA', fipsCode: '53077' },
  ], []);

  const selectedCounty = useMemo(
    () => counties.find((c) => c.id === selectedCountyId) ?? counties[0],
    [counties, selectedCountyId],
  );

  const handleCountyChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCountyId(e.target.value);
  }, []);

  const renderTabPanel = useCallback(() => {
    switch (activeTab) {
      case 'county':
        return <CountyConfigPanel county={selectedCounty} />;
      case 'quality':
        return <DataQualityPanel />;
      case 'security':
        return <SecurityAuditPanel />;
      case 'users':
        return <UsersPanel />;
      case 'studies':
        return <StudyPeriodsPanel />;
      case 'scrape':
        return <ScrapeJobsPanel />;
      default:
        return null;
    }
  }, [activeTab, selectedCounty]);

  return (
    <div className="min-h-screen bg-gray-50">
      <DemoDataBanner module="Administration" />
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Administration</h1>

          {/* County Switcher */}
          <div className="flex items-center gap-2">
            <label htmlFor="county-select" className="text-sm font-medium text-gray-600">
              County:
            </label>
            <select
              id="county-select"
              value={selectedCountyId}
              onChange={handleCountyChange}
              className="block w-48 rounded-md border-gray-300 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {counties.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Bar */}
        <nav className="flex space-x-1 mt-4" role="tablist" aria-label="Admin sections">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Panel */}
      <div
        id={`panel-${activeTab}`}
        role="tabpanel"
        className="p-6"
      >
        {renderTabPanel()}
      </div>
    </div>
  );
};

export default AdminDashboard;
