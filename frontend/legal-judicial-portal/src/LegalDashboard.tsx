import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Scale, Calendar, Users, FileText, TrendingUp, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

interface DashboardData {
  total_cases: number;
  active_cases: number;
  case_completion_rate: number;
  case_type_distribution: { [key: string]: number };
  average_case_duration_days: number;
  court_efficiency_rating: number;
  calendar: {
    total_courtrooms: number;
    scheduled_hearings_today: number;
    utilization_rate: number;
    next_available_slot: string;
    average_case_duration: number;
  };
  judges: {
    total_judges: number;
    available_judges: number;
  };
}

const COLORS = ['#1e40af', '#059669', '#dc2626', '#d97706', '#7c3aed', '#0891b2'];

const LegalDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsResponse, calendarResponse, judgesResponse] = await Promise.all([
          fetch('http://localhost:\${{TF_PORT_5290:-5290}}/api/legal/statistics'),
          fetch('http://localhost:\${{TF_PORT_5290:-5290}}/api/legal/calendar'),
          fetch('http://localhost:\${{TF_PORT_5290:-5290}}/api/legal/judges')
        ]);

        if (!statsResponse.ok || !calendarResponse.ok || !judgesResponse.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const [stats, calendar, judges] = await Promise.all([
          statsResponse.json(),
          calendarResponse.json(),
          judgesResponse.json()
        ]);

        setDashboardData({
          ...stats,
          calendar: calendar.calendar,
          judges: {
            total_judges: judges.total_judges,
            available_judges: judges.available_judges
          }
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading Legal & Judicial Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-state">
          <AlertTriangle size={48} />
          <h3>Dashboard Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const caseTypeData = Object.entries(dashboardData.case_type_distribution).map(([type, count]) => ({
    name: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: count
  }));

  const efficiencyData = [
    { name: 'Case Completion Rate', value: dashboardData.case_completion_rate },
    { name: 'Court Efficiency', value: dashboardData.court_efficiency_rating },
    { name: 'Court Utilization', value: dashboardData.calendar.utilization_rate }
  ];

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <Scale size={32} />
          <div>
            <h1>Legal & Judicial Dashboard</h1>
            <p>Benton County Superior Court System</p>
          </div>
        </div>
        <div className="status-badge">
          <CheckCircle size={16} />
          <span>Court System Online</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">
            <FileText size={24} />
          </div>
          <div className="metric-content">
            <h3>{dashboardData.total_cases.toLocaleString()}</h3>
            <p>Total Cases</p>
            <span className="metric-subtitle">{dashboardData.active_cases} active</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <Calendar size={24} />
          </div>
          <div className="metric-content">
            <h3>{dashboardData.calendar.scheduled_hearings_today}</h3>
            <p>Scheduled Hearings Today</p>
            <span className="metric-subtitle">{dashboardData.calendar.total_courtrooms} courtrooms</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <Users size={24} />
          </div>
          <div className="metric-content">
            <h3>{dashboardData.judges.available_judges}/{dashboardData.judges.total_judges}</h3>
            <p>Available Judges</p>
            <span className="metric-subtitle">Ready for assignment</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <Clock size={24} />
          </div>
          <div className="metric-content">
            <h3>{dashboardData.average_case_duration_days}</h3>
            <p>Avg. Case Duration (Days)</p>
            <span className="metric-subtitle">Processing time</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Case Type Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Case Type Distribution</h3>
            <p>Breakdown by case category</p>
          </div>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={caseTypeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {caseTypeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Court Efficiency Metrics */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Court Performance Metrics</h3>
            <p>Efficiency and utilization rates</p>
          </div>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={efficiencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Rate']} />
                <Bar dataKey="value" fill="#1e40af" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Court Calendar Summary */}
      <div className="calendar-summary">
        <div className="calendar-header">
          <Calendar size={24} />
          <h3>Court Calendar Status</h3>
        </div>
        <div className="calendar-stats">
          <div className="calendar-stat">
            <span className="stat-label">Court Utilization</span>
            <span className="stat-value">{dashboardData.calendar.utilization_rate.toFixed(1)}%</span>
          </div>
          <div className="calendar-stat">
            <span className="stat-label">Next Available Slot</span>
            <span className="stat-value">
              {new Date(dashboardData.calendar.next_available_slot).toLocaleDateString()}
            </span>
          </div>
          <div className="calendar-stat">
            <span className="stat-label">Avg. Hearing Duration</span>
            <span className="stat-value">{dashboardData.calendar.average_case_duration} min</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalDashboard;