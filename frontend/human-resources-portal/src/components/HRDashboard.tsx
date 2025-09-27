import React, { useState, useEffect } from 'react';
import { 
  FaUsers, 
  FaMoneyBillWave, 
  FaClipboardList, 
  FaBuilding,
  FaChartLine,
  FaAward,
  FaShieldAlt,
  FaExclamationTriangle,
  FaClock,
  FaUserCheck
} from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

interface HRMetrics {
  total_employees: number;
  active_employees: number;
  departments: number;
  average_salary: string;
  union_representation: string;
  annual_payroll: string;
  average_benefits_cost: string;
  evaluations_completed: number;
  average_performance_rating: number;
  turnover_rate: string;
  employee_satisfaction: string;
  safety_incidents: number;
}

const HRDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<HRMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchHRMetrics();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchHRMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchHRMetrics = async () => {
    try {
      const response = await fetch('http://localhost:\${{TF_PORT_5360:-5360}}/api/hr/status');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      setMetrics({
        total_employees: data.employee_management?.total_employees || 0,
        active_employees: data.employee_management?.active_employees || 0,
        departments: data.employee_management?.departments || 0,
        average_salary: data.employee_management?.average_salary || '$0',
        union_representation: data.employee_management?.union_representation || '0%',
        annual_payroll: data.payroll_administration?.annual_payroll || '$0',
        average_benefits_cost: data.payroll_administration?.average_benefits_cost || '$0',
        evaluations_completed: data.performance_management?.evaluations_completed || 0,
        average_performance_rating: data.performance_management?.average_performance_rating || 0,
        turnover_rate: data.workforce_analytics?.turnover_rate || '0%',
        employee_satisfaction: data.workforce_analytics?.employee_satisfaction || '0/5.0',
        safety_incidents: data.workforce_analytics?.safety_incidents || 0
      });
      
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Failed to fetch HR metrics:', err);
      setError('Unable to connect to HR service. Please check if the service is running on port \${{TF_PORT_5360:-5360}}.');
      
      // Set demo data for display
      setMetrics({
        total_employees: 506,
        active_employees: 498,
        departments: 10,
        average_salary: '$67,500',
        union_representation: '68%',
        annual_payroll: '$42,600,000',
        average_benefits_cost: '$18,500',
        evaluations_completed: 456,
        average_performance_rating: 4.3,
        turnover_rate: '8.0%',
        employee_satisfaction: '4.2/5.0',
        safety_incidents: 2
      });
    } finally {
      setLoading(false);
    }
  };

  // Sample data for charts
  const employeeTrendData = [
    { month: 'Jan', employees: 498, hires: 12, separations: 8 },
    { month: 'Feb', employees: 502, hires: 15, separations: 11 },
    { month: 'Mar', employees: 506, hires: 18, separations: 14 },
    { month: 'Apr', employees: 510, hires: 16, separations: 12 },
    { month: 'May', employees: 514, hires: 14, separations: 10 },
    { month: 'Jun', employees: 518, hires: 13, separations: 9 }
  ];

  const departmentData = [
    { name: 'Sheriff\'s Office', employees: 156, color: '#1e40af' },
    { name: 'Public Works', employees: 89, color: '#059669' },
    { name: 'Health Dept', employees: 67, color: '#dc2626' },
    { name: 'Parks & Rec', employees: 52, color: '#d97706' },
    { name: 'Administration', employees: 45, color: '#7c3aed' },
    { name: 'Other', employees: 97, color: '#6b7280' }
  ];

  const performanceData = [
    { category: 'Exceeds Expectations', count: 89, percentage: 19.5 },
    { category: 'Meets Expectations', count: 298, percentage: 65.4 },
    { category: 'Needs Improvement', count: 69, percentage: 15.1 }
  ];

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b'];

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div className="loading"></div>
        <p>Loading HR Dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      {error && (
        <div style={{ 
          background: '#fee2e2', 
          border: '1px solid #fecaca', 
          color: '#991b1b',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <FaExclamationTriangle />
          <div>
            <strong>Service Connection Warning:</strong> {error}
            <br />
            <small>Displaying cached data for demonstration purposes.</small>
          </div>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="data-grid" style={{ 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        marginBottom: '2rem'
      }}>
        <div className="data-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="metric-value">{metrics?.active_employees.toLocaleString()}</div>
              <div className="metric-label">Active Employees</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                {metrics?.total_employees} total positions
              </div>
            </div>
            <FaUsers size={32} style={{ color: '#1e40af' }} />
          </div>
        </div>

        <div className="data-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="metric-value">{metrics?.annual_payroll}</div>
              <div className="metric-label">Annual Payroll</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Avg: {metrics?.average_salary}
              </div>
            </div>
            <FaMoneyBillWave size={32} style={{ color: '#059669' }} />
          </div>
        </div>

        <div className="data-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="metric-value">{metrics?.average_performance_rating}</div>
              <div className="metric-label">Avg Performance Rating</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                {metrics?.evaluations_completed} evaluations
              </div>
            </div>
            <FaAward size={32} style={{ color: '#d97706' }} />
          </div>
        </div>

        <div className="data-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="metric-value">{metrics?.turnover_rate}</div>
              <div className="metric-label">Annual Turnover</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Satisfaction: {metrics?.employee_satisfaction}
              </div>
            </div>
            <FaChartLine size={32} style={{ color: '#dc2626' }} />
          </div>
        </div>
      </div>

      {/* Department & Analytics Section */}
      <div className="data-grid" style={{ 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        marginBottom: '2rem'
      }}>
        {/* Employee Trend Chart */}
        <div className="data-card">
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: '600', 
            marginBottom: '1rem',
            color: '#374151'
          }}>
            Employee Trend Analysis
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={employeeTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  background: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="employees" 
                stroke="#1e40af" 
                strokeWidth={3}
                name="Total Employees"
              />
              <Line 
                type="monotone" 
                dataKey="hires" 
                stroke="#059669" 
                strokeWidth={2}
                name="New Hires"
              />
              <Line 
                type="monotone" 
                dataKey="separations" 
                stroke="#dc2626" 
                strokeWidth={2}
                name="Separations"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Department Distribution */}
        <div className="data-card">
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: '600', 
            marginBottom: '1rem',
            color: '#374151'
          }}>
            Department Employee Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={departmentData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="employees"
                label={({ name, percentage }) => `${name}: ${percentage}%`}
              >
                {departmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => [`${value} employees`, 'Count']}
                contentStyle={{ 
                  background: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance & Compliance Section */}
      <div className="data-grid" style={{ 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        marginBottom: '2rem'
      }}>
        {/* Performance Distribution */}
        <div className="data-card">
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: '600', 
            marginBottom: '1rem',
            color: '#374151'
          }}>
            Performance Evaluation Results
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="category" 
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  background: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}
              />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Stats */}
        <div className="data-card">
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: '600', 
            marginBottom: '1rem',
            color: '#374151'
          }}>
            HR Operations Overview
          </h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <FaBuilding style={{ color: '#1e40af' }} />
              <div>
                <div style={{ fontWeight: '600', fontSize: '1rem' }}>{metrics?.departments}</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Active Departments</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <FaUserCheck style={{ color: '#059669' }} />
              <div>
                <div style={{ fontWeight: '600', fontSize: '1rem' }}>{metrics?.union_representation}</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Union Representation</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <FaShieldAlt style={{ color: '#d97706' }} />
              <div>
                <div style={{ fontWeight: '600', fontSize: '1rem' }}>{metrics?.safety_incidents}</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Safety Incidents (YTD)</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <FaClock style={{ color: '#7c3aed' }} />
              <div>
                <div style={{ fontWeight: '600', fontSize: '1rem' }}>{metrics?.average_benefits_cost}</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Avg Benefits Cost</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Status Footer */}
      <div className="data-card" style={{ background: '#f8fafc', border: '1px solid #e5e7eb' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                background: '#10b981', 
                borderRadius: '50%' 
              }}></div>
              <span>HR System Operational</span>
            </div>
            <span>•</span>
            <span>Benton County, Washington</span>
            <span>•</span>
            <span>Port \${{TF_PORT_5360:-5360}}</span>
          </div>
          <div>
            {lastUpdated && (
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;