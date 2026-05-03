// TFR-099: Admin Dashboard
// Tabbed administration interface: County Config, Data Quality, Security Audit,
// Users, Study Periods, Scrape Jobs.
//
// DATA POSTURE: API-only. Admin data is not fabricated when the backend is
// unavailable; tabs render loading, empty, or unavailable states.

import React, { useState, useCallback, useMemo, useEffect } from 'react';

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

async function fetchAdminArray<T>(path: string): Promise<T[]> {
  const response = await fetch(path, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  const payload = (await response.json()) as T[] | { items?: T[]; data?: T[] };
  if (Array.isArray(payload)) return payload;
  return payload.items ?? payload.data ?? [];
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">
      {message}
    </div>
  );
}

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

function CountyConfigPanel({ county }: { county: County | null }) {
  if (!county) {
    return <EmptyPanel message="No county configuration was returned by the admin API." />;
  }

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
  const [metrics, setMetrics] = useState<DataQualityMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAdminArray<DataQualityMetric>('/api/admin/data-quality')
      .then((data) => {
        if (cancelled) return;
        setMetrics(data);
        setError(null);
      })
      .catch((loadError) => {
        if (cancelled) return;
        setMetrics([]);
        setError(loadError instanceof Error ? loadError.message : 'Data quality API unavailable.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Data Quality Overview</h3>
      {loading && <EmptyPanel message="Loading data quality metrics from the admin API..." />}
      {!loading && error && <EmptyPanel message={`Data quality API unavailable: ${error}`} />}
      {!loading && !error && metrics.length === 0 && <EmptyPanel message="No data quality metrics returned." />}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((m) => (
          <MetricCard key={m.label} metric={m} />
        ))}
      </div>
    </div>
  );
}

function SecurityAuditPanel() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAdminArray<SecurityEvent>('/api/admin/security-events')
      .then((data) => {
        if (cancelled) return;
        setEvents(data);
        setError(null);
      })
      .catch((loadError) => {
        if (cancelled) return;
        setEvents([]);
        setError(loadError instanceof Error ? loadError.message : 'Security event API unavailable.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Security Event Log</h3>
      {loading && <EmptyPanel message="Loading security events from the admin API..." />}
      {!loading && error && <EmptyPanel message={`Security event API unavailable: ${error}`} />}
      {!loading && !error && events.length === 0 && <EmptyPanel message="No security events returned." />}
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
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAdminArray<AdminUser>('/api/admin/users')
      .then((data) => {
        if (cancelled) return;
        setUsers(data);
        setError(null);
      })
      .catch((loadError) => {
        if (cancelled) return;
        setUsers([]);
        setError(loadError instanceof Error ? loadError.message : 'User API unavailable.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
        <button disabled className="px-4 py-2 bg-gray-300 text-gray-600 text-sm font-medium rounded-lg cursor-not-allowed">
          Add User via Admin API
        </button>
      </div>
      {loading && <EmptyPanel message="Loading users from the admin API..." />}
      {!loading && error && <EmptyPanel message={`User API unavailable: ${error}`} />}
      {!loading && !error && users.length === 0 && <EmptyPanel message="No admin users returned." />}
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
  const [periods, setPeriods] = useState<StudyPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAdminArray<StudyPeriod>('/api/admin/study-periods')
      .then((data) => {
        if (cancelled) return;
        setPeriods(data);
        setError(null);
      })
      .catch((loadError) => {
        if (cancelled) return;
        setPeriods([]);
        setError(loadError instanceof Error ? loadError.message : 'Study period API unavailable.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Study Periods</h3>
      {loading && <EmptyPanel message="Loading study periods from the admin API..." />}
      {!loading && error && <EmptyPanel message={`Study period API unavailable: ${error}`} />}
      {!loading && !error && periods.length === 0 && <EmptyPanel message="No study periods returned." />}
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
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAdminArray<ScrapeJob>('/api/admin/scrape-jobs')
      .then((data) => {
        if (cancelled) return;
        setJobs(data);
        setError(null);
      })
      .catch((loadError) => {
        if (cancelled) return;
        setJobs([]);
        setError(loadError instanceof Error ? loadError.message : 'Scrape job API unavailable.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Scrape Jobs</h3>
      {loading && <EmptyPanel message="Loading scrape jobs from the admin API..." />}
      {!loading && error && <EmptyPanel message={`Scrape job API unavailable: ${error}`} />}
      {!loading && !error && jobs.length === 0 && <EmptyPanel message="No scrape jobs returned." />}
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
  const [selectedCountyId, setSelectedCountyId] = useState('');
  const [counties, setCounties] = useState<County[]>([]);
  const [countyError, setCountyError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAdminArray<County>('/api/admin/counties')
      .then((data) => {
        if (cancelled) return;
        setCounties(data);
        setSelectedCountyId((current) => current || data[0]?.id || '');
        setCountyError(null);
      })
      .catch((loadError) => {
        if (cancelled) return;
        setCounties([]);
        setCountyError(loadError instanceof Error ? loadError.message : 'County configuration API unavailable.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedCounty = useMemo(
    () => counties.find((c) => c.id === selectedCountyId) ?? null,
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Administration</h1>

          {/* County Switcher */}
          <div className="flex items-center gap-2">
            <label htmlFor="county-select" className="text-sm font-medium text-gray-600">
              County:
            </label>
            {counties.length > 0 ? (
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
            ) : (
              <span className="text-sm text-amber-700">
                {countyError ? 'County API unavailable' : 'Loading counties'}
              </span>
            )}
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
