import React, { useState, useEffect } from 'react';
import { 
  FaMoneyBillWave, 
  FaCalendarAlt, 
  FaFileInvoiceDollar,
  FaChartPie,
  FaDownload,
  FaCalculator,
  FaPrint,
  FaUsers,
  FaBuilding,
  FaPercentage,
  FaSearch
} from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface PayrollRecord {
  payroll_id: string;
  employee_id: string;
  pay_period_start: string;
  pay_period_end: string;
  gross_pay: number;
  federal_tax: number;
  state_tax: number;
  social_security: number;
  medicare: number;
  health_insurance: number;
  retirement_contribution: number;
  net_pay: number;
  overtime_hours: number;
  overtime_pay: number;
}

interface PayrollSummary {
  total_gross_pay: number;
  total_net_pay: number;
  total_deductions: number;
  employee_count: number;
}

const PayrollAdministration: React.FC = () => {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [payrollSummary, setPayrollSummary] = useState<PayrollSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [searchEmployee, setSearchEmployee] = useState('');

  useEffect(() => {
    fetchPayrollData();
  }, []);

  const fetchPayrollData = async () => {
    try {
      const response = await fetch('http://localhost:\${{TF_PORT_5360:-5360}}/api/hr/payroll');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPayrollRecords(data.payroll_records || []);
      
      const summary = {
        total_gross_pay: data.total_gross_pay || 0,
        total_net_pay: data.total_net_pay || 0,
        total_deductions: (data.total_gross_pay || 0) - (data.total_net_pay || 0),
        employee_count: data.count || 0
      };
      setPayrollSummary(summary);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch payroll data:', err);
      setError('Unable to connect to HR service. Please check if the service is running on port \${{TF_PORT_5360:-5360}}.');
      
      // Set demo data for display
      const demoRecords = [
        {
          payroll_id: 'PAY-001-20240901',
          employee_id: 'BC-EMP-2024-001',
          pay_period_start: '2024-08-26',
          pay_period_end: '2024-09-08',
          gross_pay: 5576.92,
          federal_tax: 1226.92,
          state_tax: 390.38,
          social_security: 345.77,
          medicare: 80.87,
          health_insurance: 156.50,
          retirement_contribution: 432.21,
          net_pay: 2943.27,
          overtime_hours: 0,
          overtime_pay: 0
        },
        {
          payroll_id: 'PAY-002-20240901',
          employee_id: 'BC-EMP-2024-002',
          pay_period_start: '2024-08-26',
          pay_period_end: '2024-09-08',
          gross_pay: 3019.23,
          federal_tax: 664.23,
          state_tax: 211.35,
          social_security: 187.19,
          medicare: 43.78,
          health_insurance: 156.50,
          retirement_contribution: 234.00,
          net_pay: 1522.18,
          overtime_hours: 4,
          overtime_pay: 235.64
        },
        {
          payroll_id: 'PAY-003-20240901',
          employee_id: 'BC-EMP-2024-003',
          pay_period_start: '2024-08-26',
          pay_period_end: '2024-09-08',
          gross_pay: 3277.69,
          federal_tax: 721.09,
          state_tax: 229.44,
          social_security: 203.22,
          medicare: 47.53,
          health_insurance: 156.50,
          retirement_contribution: 254.02,
          net_pay: 1865.89,
          overtime_hours: 2,
          overtime_pay: 126.45
        },
        {
          payroll_id: 'PAY-004-20240901',
          employee_id: 'BC-EMP-2024-004',
          pay_period_start: '2024-08-26',
          pay_period_end: '2024-09-08',
          gross_pay: 2259.62,
          federal_tax: 497.12,
          state_tax: 158.17,
          social_security: 140.10,
          medicare: 32.76,
          health_insurance: 156.50,
          retirement_contribution: 175.12,
          net_pay: 1099.85,
          overtime_hours: 0,
          overtime_pay: 0
        },
        {
          payroll_id: 'PAY-005-20240901',
          employee_id: 'BC-EMP-2024-005',
          pay_period_start: '2024-08-26',
          pay_period_end: '2024-09-08',
          gross_pay: 3538.46,
          federal_tax: 778.46,
          state_tax: 247.69,
          social_security: 219.38,
          medicare: 51.31,
          health_insurance: 156.50,
          retirement_contribution: 274.23,
          net_pay: 1810.89,
          overtime_hours: 0,
          overtime_pay: 0
        }
      ];
      
      setPayrollRecords(demoRecords);
      setPayrollSummary({
        total_gross_pay: demoRecords.reduce((sum, record) => sum + record.gross_pay, 0),
        total_net_pay: demoRecords.reduce((sum, record) => sum + record.net_pay, 0),
        total_deductions: demoRecords.reduce((sum, record) => sum + (record.gross_pay - record.net_pay), 0),
        employee_count: demoRecords.length
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Sample data for charts
  const deductionBreakdown = [
    { name: 'Federal Tax', value: payrollSummary ? payrollRecords.reduce((sum, r) => sum + r.federal_tax, 0) : 0, color: '#dc2626' },
    { name: 'State Tax', value: payrollSummary ? payrollRecords.reduce((sum, r) => sum + r.state_tax, 0) : 0, color: '#d97706' },
    { name: 'Social Security', value: payrollSummary ? payrollRecords.reduce((sum, r) => sum + r.social_security, 0) : 0, color: '#059669' },
    { name: 'Medicare', value: payrollSummary ? payrollRecords.reduce((sum, r) => sum + r.medicare, 0) : 0, color: '#7c3aed' },
    { name: 'Health Insurance', value: payrollSummary ? payrollRecords.reduce((sum, r) => sum + r.health_insurance, 0) : 0, color: '#0284c7' },
    { name: 'Retirement', value: payrollSummary ? payrollRecords.reduce((sum, r) => sum + r.retirement_contribution, 0) : 0, color: '#1e40af' }
  ];

  const payrollTrendData = [
    { period: 'Jul 2024', gross: 2180000, net: 1534000, deductions: 646000 },
    { period: 'Aug 2024', gross: 2215000, net: 1558000, deductions: 657000 },
    { period: 'Sep 2024', gross: 2195000, net: 1542000, deductions: 653000 },
    { period: 'Oct 2024', gross: 2220000, net: 1564000, deductions: 656000 }
  ];

  const filteredRecords = payrollRecords.filter(record =>
    record.employee_id.toLowerCase().includes(searchEmployee.toLowerCase())
  );

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
        <p>Loading Payroll Data...</p>
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
          <FaMoneyBillWave />
          <div>
            <strong>Service Connection Warning:</strong> {error}
            <br />
            <small>Displaying cached payroll data for demonstration purposes.</small>
          </div>
        </div>
      )}

      {/* Payroll Summary Cards */}
      <div className="data-grid" style={{ 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        marginBottom: '2rem'
      }}>
        <div className="data-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="metric-value">
                {payrollSummary ? formatCurrency(payrollSummary.total_gross_pay) : '$0'}
              </div>
              <div className="metric-label">Total Gross Pay</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Current pay period
              </div>
            </div>
            <FaMoneyBillWave size={32} style={{ color: '#059669' }} />
          </div>
        </div>

        <div className="data-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="metric-value">
                {payrollSummary ? formatCurrency(payrollSummary.total_net_pay) : '$0'}
              </div>
              <div className="metric-label">Total Net Pay</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                After deductions
              </div>
            </div>
            <FaCalculator size={32} style={{ color: '#1e40af' }} />
          </div>
        </div>

        <div className="data-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="metric-value">
                {payrollSummary ? formatCurrency(payrollSummary.total_deductions) : '$0'}
              </div>
              <div className="metric-label">Total Deductions</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Taxes & benefits
              </div>
            </div>
            <FaPercentage size={32} style={{ color: '#dc2626' }} />
          </div>
        </div>

        <div className="data-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="metric-value">
                {payrollSummary ? payrollSummary.employee_count : 0}
              </div>
              <div className="metric-label">Employees Paid</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                This pay period
              </div>
            </div>
            <FaUsers size={32} style={{ color: '#7c3aed' }} />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="data-grid" style={{ 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        marginBottom: '2rem'
      }}>
        {/* Deduction Breakdown */}
        <div className="data-card">
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: '600', 
            marginBottom: '1rem',
            color: '#374151'
          }}>
            Deduction Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={deductionBreakdown}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
              >
                {deductionBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => [formatCurrency(value), 'Amount']}
                contentStyle={{ 
                  background: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Payroll Trend */}
        <div className="data-card">
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: '600', 
            marginBottom: '1rem',
            color: '#374151'
          }}>
            Monthly Payroll Trend
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={payrollTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="period" stroke="#6b7280" />
              <YAxis 
                stroke="#6b7280"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip 
                formatter={(value: any) => [formatCurrency(value), 'Amount']}
                contentStyle={{ 
                  background: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="gross" 
                stroke="#059669" 
                strokeWidth={3}
                name="Gross Pay"
              />
              <Line 
                type="monotone" 
                dataKey="net" 
                stroke="#1e40af" 
                strokeWidth={3}
                name="Net Pay"
              />
              <Line 
                type="monotone" 
                dataKey="deductions" 
                stroke="#dc2626" 
                strokeWidth={2}
                name="Deductions"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Controls and Search */}
      <div className="data-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#374151' }}>
            Payroll Records
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="government-button secondary">
              <FaCalculator size={14} style={{ marginRight: '0.5rem' }} />
              Process Payroll
            </button>
            <button className="government-button">
              <FaPrint size={14} style={{ marginRight: '0.5rem' }} />
              Print Reports
            </button>
            <button className="government-button">
              <FaDownload size={14} style={{ marginRight: '0.5rem' }} />
              Export
            </button>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem'
        }}>
          <div className="form-group">
            <label className="form-label">
              <FaSearch style={{ marginRight: '0.5rem' }} />
              Search Employee
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Search by Employee ID..."
              value={searchEmployee}
              onChange={(e) => setSearchEmployee(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <FaCalendarAlt style={{ marginRight: '0.5rem' }} />
              Pay Period
            </label>
            <select
              className="form-input"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="current">Current Period (Sep 2024)</option>
              <option value="previous">Previous Period (Aug 2024)</option>
              <option value="ytd">Year to Date</option>
            </select>
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginTop: '1rem',
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          <span>Pay Period: <strong>Aug 26 - Sep 8, 2024</strong></span>
          <span>•</span>
          <span>Records: <strong>{filteredRecords.length}</strong></span>
          <span>•</span>
          <span>Status: <strong>Processed</strong></span>
        </div>
      </div>

      {/* Payroll Records Table */}
      <div className="government-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Pay Period</th>
              <th>Gross Pay</th>
              <th>Deductions</th>
              <th>Net Pay</th>
              <th>Overtime</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record) => (
              <tr key={record.payroll_id}>
                <td>
                  <div style={{ fontWeight: '500', color: '#374151' }}>
                    {record.employee_id}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {record.payroll_id}
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: '0.875rem' }}>
                    {formatDate(record.pay_period_start)} -
                  </div>
                  <div style={{ fontSize: '0.875rem' }}>
                    {formatDate(record.pay_period_end)}
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: '600', color: '#059669' }}>
                    {formatCurrency(record.gross_pay)}
                  </div>
                  {record.overtime_pay > 0 && (
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      +{formatCurrency(record.overtime_pay)} OT
                    </div>
                  )}
                </td>
                <td>
                  <div style={{ fontWeight: '500', color: '#dc2626' }}>
                    {formatCurrency(record.gross_pay - record.net_pay)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {(((record.gross_pay - record.net_pay) / record.gross_pay) * 100).toFixed(1)}%
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: '600', color: '#1e40af', fontSize: '1rem' }}>
                    {formatCurrency(record.net_pay)}
                  </div>
                </td>
                <td>
                  {record.overtime_hours > 0 ? (
                    <div>
                      <div style={{ fontWeight: '500' }}>
                        {record.overtime_hours.toFixed(1)} hrs
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {formatCurrency(record.overtime_pay)}
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: '#6b7280' }}>None</span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#1e40af',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        borderRadius: '4px'
                      }}
                      title="View Pay Stub"
                    >
                      <FaFileInvoiceDollar size={14} />
                    </button>
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#059669',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        borderRadius: '4px'
                      }}
                      title="Print Pay Stub"
                    >
                      <FaPrint size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Benefits Summary */}
      <div className="data-card" style={{ marginTop: '2rem', background: '#f8fafc' }}>
        <h3 style={{ 
          fontSize: '1.125rem', 
          fontWeight: '600', 
          marginBottom: '1rem',
          color: '#374151'
        }}>
          Benefits & Deductions Summary
        </h3>
        <div className="data-grid" style={{ 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>
              Federal Taxes
            </div>
            <div style={{ fontWeight: '600', fontSize: '1.125rem', color: '#dc2626' }}>
              {formatCurrency(deductionBreakdown[0]?.value || 0)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>
              State Taxes
            </div>
            <div style={{ fontWeight: '600', fontSize: '1.125rem', color: '#d97706' }}>
              {formatCurrency(deductionBreakdown[1]?.value || 0)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>
              Retirement (PERS)
            </div>
            <div style={{ fontWeight: '600', fontSize: '1.125rem', color: '#1e40af' }}>
              {formatCurrency(deductionBreakdown[5]?.value || 0)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>
              Health Insurance
            </div>
            <div style={{ fontWeight: '600', fontSize: '1.125rem', color: '#0284c7' }}>
              {formatCurrency(deductionBreakdown[4]?.value || 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollAdministration;