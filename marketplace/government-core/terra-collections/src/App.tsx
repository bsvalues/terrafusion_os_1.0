import "./terrafusion-brand.css";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

interface TaxRecord {
  id: string;
  property_id: string;
  property_address: string;
  owner_name: string;
  tax_year: number;
  amount_due: number;
  amount_paid: number;
  status: 'paid' | 'pending' | 'delinquent' | 'partial';
  due_date: string;
  payment_date?: string;
  penalty_amount?: number;
}

interface CollectionStats {
  total_due: number;
  total_collected: number;
  collection_rate: number;
  delinquent_count: number;
  pending_count: number;
}

interface PaymentPlan {
  id: string;
  property_id: string;
  total_amount: number;
  down_payment: number;
  monthly_payment: number;
  duration_months: number;
  start_date: string;
  status: 'active' | 'completed' | 'defaulted';
}

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [taxRecords, setTaxRecords] = useState<TaxRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<TaxRecord | null>(null);
  const [collectionStats, setCollectionStats] = useState<CollectionStats>({
    total_due: 0,
    total_collected: 0,
    collection_rate: 0,
    delinquent_count: 0,
    pending_count: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);

  useEffect(() => {
    loadTaxRecords();
    loadCollectionStats();
    loadPaymentPlans();
  }, []);

  const loadTaxRecords = async () => {
    try {
      // Simulated data for demo
      const mockRecords: TaxRecord[] = [
        {
          id: '1',
          property_id: 'PROP-001',
          property_address: '123 Main St, Springfield, IL',
          owner_name: 'John Smith',
          tax_year: 2024,
          amount_due: 5250.00,
          amount_paid: 5250.00,
          status: 'paid',
          due_date: '2024-12-31',
          payment_date: '2024-11-15'
        },
        {
          id: '2',
          property_id: 'PROP-002',
          property_address: '456 Oak Ave, Springfield, IL',
          owner_name: 'Jane Doe',
          tax_year: 2024,
          amount_due: 3800.00,
          amount_paid: 0,
          status: 'pending',
          due_date: '2024-12-31'
        },
        {
          id: '3',
          property_id: 'PROP-003',
          property_address: '789 Pine Rd, Springfield, IL',
          owner_name: 'Bob Johnson',
          tax_year: 2023,
          amount_due: 4200.00,
          amount_paid: 0,
          status: 'delinquent',
          due_date: '2023-12-31',
          penalty_amount: 420.00
        },
        {
          id: '4',
          property_id: 'PROP-004',
          property_address: '321 Elm St, Springfield, IL',
          owner_name: 'Alice Brown',
          tax_year: 2024,
          amount_due: 2900.00,
          amount_paid: 1450.00,
          status: 'partial',
          due_date: '2024-12-31',
          payment_date: '2024-10-15'
        }
      ];
      setTaxRecords(mockRecords);
    } catch (error) {
      console.error('Failed to load tax records:', error);
    }
  };

  const loadCollectionStats = async () => {
    try {
      const mockStats: CollectionStats = {
        total_due: 16150.00,
        total_collected: 6700.00,
        collection_rate: 0.415,
        delinquent_count: 1,
        pending_count: 1
      };
      setCollectionStats(mockStats);
    } catch (error) {
      console.error('Failed to load collection stats:', error);
    }
  };

  const loadPaymentPlans = async () => {
    try {
      const mockPlans: PaymentPlan[] = [
        {
          id: '1',
          property_id: 'PROP-005',
          total_amount: 8500.00,
          down_payment: 1500.00,
          monthly_payment: 583.33,
          duration_months: 12,
          start_date: '2024-11-01',
          status: 'active'
        },
        {
          id: '2',
          property_id: 'PROP-006',
          total_amount: 6200.00,
          down_payment: 1000.00,
          monthly_payment: 433.33,
          duration_months: 12,
          start_date: '2024-10-15',
          status: 'active'
        }
      ];
      setPaymentPlans(mockPlans);
    } catch (error) {
      console.error('Failed to load payment plans:', error);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'paid': return 'status-badge-paid';
      case 'pending': return 'status-badge-pending';
      case 'delinquent': return 'status-badge-delinquent';
      case 'partial': return 'status-badge-partial';
      default: return 'status-badge-pending';
    }
  };

  const filteredRecords = taxRecords.filter(record => {
    const matchesSearch = 
      record.property_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.property_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || record.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const handleRecordSelect = (record: TaxRecord) => {
    setSelectedRecord(record);
  };

  const handlePayment = async (recordId: string, amount: number) => {
    try {
      await invoke('process_payment', { recordId, amount });
      // Reload records after payment
      loadTaxRecords();
      loadCollectionStats();
    } catch (error) {
      console.error('Payment processing failed:', error);
    }
  };

  return (
    <div className="terracollections-app">
      <div className="app-header">
        <div className="header-content">
          <h1>TerraCollections</h1>
          <span className="app-subtitle">Tax Collections Management System</span>
        </div>
        <div className="collection-summary">
          <div className="summary-card">
            <span className="summary-label">Total Due</span>
            <span className="summary-value">{formatCurrency(collectionStats.total_due)}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Collected</span>
            <span className="summary-value">{formatCurrency(collectionStats.total_collected)}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Collection Rate</span>
            <span className="summary-value">{(collectionStats.collection_rate * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <div className="app-content">
        <nav className="app-nav">
          <button
            className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button
            className={`nav-btn ${activeTab === 'records' ? 'active' : ''}`}
            onClick={() => setActiveTab('records')}
          >
            📋 Tax Records
          </button>
          <button
            className={`nav-btn ${activeTab === 'payment-plans' ? 'active' : ''}`}
            onClick={() => setActiveTab('payment-plans')}
          >
            💳 Payment Plans
          </button>
          <button
            className={`nav-btn ${activeTab === 'notices' ? 'active' : ''}`}
            onClick={() => setActiveTab('notices')}
          >
            📨 Notices
          </button>
          <button
            className={`nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            📈 Analytics
          </button>
        </nav>

        <main className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-panel">
              <div className="stats-grid">
                <div className="tf-card stat-card">
                  <div className="stat-header">
                    <h3>Collection Performance</h3>
                  </div>
                  <div className="stat-content">
                    <div className="performance-ring">
                      <div className="ring-value">{(collectionStats.collection_rate * 100).toFixed(0)}%</div>
                      <div className="ring-label">Current Rate</div>
                    </div>
                    <div className="performance-details">
                      <div className="detail-item">
                        <span className="detail-label">Target Rate</span>
                        <span className="detail-value">85%</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Last Month</span>
                        <span className="detail-value">78%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="tf-card stat-card">
                  <div className="stat-header">
                    <h3>Delinquency Status</h3>
                  </div>
                  <div className="stat-content">
                    <div className="delinquency-breakdown">
                      <div className="breakdown-item urgent">
                        <span className="breakdown-count">{collectionStats.delinquent_count}</span>
                        <span className="breakdown-label">Delinquent</span>
                      </div>
                      <div className="breakdown-item warning">
                        <span className="breakdown-count">{collectionStats.pending_count}</span>
                        <span className="breakdown-label">Pending</span>
                      </div>
                      <div className="breakdown-item success">
                        <span className="breakdown-count">{taxRecords.filter(r => r.status === 'paid').length}</span>
                        <span className="breakdown-label">Current</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="tf-card stat-card">
                  <div className="stat-header">
                    <h3>Recent Activity</h3>
                  </div>
                  <div className="stat-content">
                    <div className="activity-feed">
                      <div className="activity-item">
                        <div className="activity-icon">💰</div>
                        <div className="activity-details">
                          <div className="activity-text">Payment received from John Smith</div>
                          <div className="activity-time">2 hours ago</div>
                        </div>
                        <div className="activity-amount">+{formatCurrency(5250)}</div>
                      </div>
                      <div className="activity-item">
                        <div className="activity-icon">📨</div>
                        <div className="activity-details">
                          <div className="activity-text">Delinquency notice sent to Bob Johnson</div>
                          <div className="activity-time">1 day ago</div>
                        </div>
                      </div>
                      <div className="activity-item">
                        <div className="activity-icon">📋</div>
                        <div className="activity-details">
                          <div className="activity-text">Payment plan setup for Alice Brown</div>
                          <div className="activity-time">3 days ago</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="quick-actions">
                <div className="tf-card">
                  <div className="card-header">
                    <h3>Quick Actions</h3>
                  </div>
                  <div className="actions-grid">
                    <button className="tf-button-primary action-btn">
                      📊 Generate Collection Report
                    </button>
                    <button className="tf-button-primary action-btn">
                      📨 Send Bulk Notices
                    </button>
                    <button className="tf-button-primary action-btn">
                      💳 Setup Payment Plan
                    </button>
                    <button className="tf-button-primary action-btn">
                      📋 Import Tax Records
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'records' && (
            <div className="records-panel">
              <div className="records-controls">
                <div className="search-section">
                  <input
                    type="text"
                    placeholder="Search by property address, owner name, or property ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                <div className="filter-section">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Status</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="delinquent">Delinquent</option>
                    <option value="partial">Partial</option>
                  </select>
                </div>
              </div>

              <div className="records-table-container">
                <table className="records-table">
                  <thead>
                    <tr>
                      <th>Property ID</th>
                      <th>Address</th>
                      <th>Owner</th>
                      <th>Tax Year</th>
                      <th>Amount Due</th>
                      <th>Amount Paid</th>
                      <th>Status</th>
                      <th>Due Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map(record => (
                      <tr key={record.id} className="record-row">
                        <td className="property-id">{record.property_id}</td>
                        <td className="property-address">{record.property_address}</td>
                        <td className="owner-name">{record.owner_name}</td>
                        <td className="tax-year">{record.tax_year}</td>
                        <td className="amount-due">{formatCurrency(record.amount_due)}</td>
                        <td className="amount-paid">{formatCurrency(record.amount_paid)}</td>
                        <td className="status">
                          <span className={`status-badge ${getStatusBadgeClass(record.status)}`}>
                            {record.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="due-date">{formatDate(record.due_date)}</td>
                        <td className="actions">
                          <button
                            className="tf-button-small"
                            onClick={() => handleRecordSelect(record)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedRecord && (
                <div className="record-details-modal">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h3>Tax Record Details - {selectedRecord.property_id}</h3>
                      <button 
                        className="close-btn"
                        onClick={() => setSelectedRecord(null)}
                      >
                        ×
                      </button>
                    </div>
                    <div className="modal-body">
                      <div className="detail-grid">
                        <div className="detail-item">
                          <label>Property Address:</label>
                          <span>{selectedRecord.property_address}</span>
                        </div>
                        <div className="detail-item">
                          <label>Owner:</label>
                          <span>{selectedRecord.owner_name}</span>
                        </div>
                        <div className="detail-item">
                          <label>Tax Year:</label>
                          <span>{selectedRecord.tax_year}</span>
                        </div>
                        <div className="detail-item">
                          <label>Amount Due:</label>
                          <span>{formatCurrency(selectedRecord.amount_due)}</span>
                        </div>
                        <div className="detail-item">
                          <label>Amount Paid:</label>
                          <span>{formatCurrency(selectedRecord.amount_paid)}</span>
                        </div>
                        <div className="detail-item">
                          <label>Balance:</label>
                          <span>{formatCurrency(selectedRecord.amount_due - selectedRecord.amount_paid)}</span>
                        </div>
                        {selectedRecord.penalty_amount && (
                          <div className="detail-item">
                            <label>Penalty:</label>
                            <span>{formatCurrency(selectedRecord.penalty_amount)}</span>
                          </div>
                        )}
                      </div>
                      
                      {selectedRecord.status !== 'paid' && (
                        <div className="payment-actions">
                          <h4>Payment Options</h4>
                          <div className="payment-buttons">
                            <button 
                              className="tf-button-primary"
                              onClick={() => handlePayment(selectedRecord.id, selectedRecord.amount_due - selectedRecord.amount_paid)}
                            >
                              💰 Pay Full Amount
                            </button>
                            <button className="tf-button-secondary">
                              💰 Make Partial Payment
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {selectedRecord.status === 'paid' && (
                        <div className="recent-payments">
                          <h4>Payment History</h4>
                          <div className="payments-list">
                            <div className="payment-item">
                              <div className="payment-details">
                                <span className="payment-date">Nov 15, 2024</span>
                                <span className="payment-method">Online Payment</span>
                              </div>
                              <span className="payment-amount">{formatCurrency(selectedRecord.amount_paid)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'payment-plans' && (
            <div className="payment-plans-panel">
              <div className="panel-header">
                <h2>Payment Plans</h2>
                <div className="plans-controls">
                  <button className="tf-button-primary">+ New Payment Plan</button>
                </div>
              </div>

              <div className="plans-grid">
                {paymentPlans.map(plan => (
                  <div key={plan.id} className="tf-card plan-card">
                    <div className="plan-header">
                      <div className="plan-title">
                        <span className={`status-badge ${plan.status}`}>
                          {plan.status.toUpperCase()}
                        </span>
                        <span className="plan-property">{plan.property_id}</span>
                      </div>
                    </div>
                    
                    <div className="plan-details">
                      <div className="detail-row">
                        <span className="detail-label">Total Amount:</span>
                        <span className="detail-value">{formatCurrency(plan.total_amount)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Down Payment:</span>
                        <span className="detail-value">{formatCurrency(plan.down_payment)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Monthly Payment:</span>
                        <span className="detail-value">{formatCurrency(plan.monthly_payment)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Duration:</span>
                        <span className="detail-value">{plan.duration_months} months</span>
                      </div>
                    </div>
                    
                    <div className="plan-actions">
                      <button className="tf-button-small">View Details</button>
                      <button className="tf-button-small">Modify Plan</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notices' && (
            <div className="notices-panel">
              <div className="panel-header">
                <h2>Notice Management</h2>
                <div className="notice-templates">
                  <h3>Notice Templates</h3>
                  <div className="templates-grid">
                    <div className="template-card">
                      <h4>First Notice</h4>
                      <p>Send to properties with upcoming due dates</p>
                      <button className="tf-button-primary">Send Bulk</button>
                    </div>
                    <div className="template-card">
                      <h4>Second Notice</h4>
                      <p>For properties 30+ days overdue</p>
                      <button className="tf-button-primary">Send Bulk</button>
                    </div>
                    <div className="template-card">
                      <h4>Final Notice</h4>
                      <p>For seriously delinquent accounts</p>
                      <button className="tf-button-primary">Send Bulk</button>
                    </div>
                    <div className="template-card">
                      <h4>Lien Notice</h4>
                      <p>Pre-lien notification</p>
                      <button className="tf-button-primary">Send Bulk</button>
                    </div>
                  </div>
                </div>

                <div className="notice-history">
                  <h3>Recent Notices Sent</h3>
                  <div className="notices-list">
                    <div className="notice-item">
                      <div className="notice-details">
                        <span className="notice-type">Second Notice</span>
                        <span className="notice-property">789 Pine Rd</span>
                      </div>
                      <span className="notice-date">Nov 12, 2024</span>
                    </div>
                    <div className="notice-item">
                      <div className="notice-details">
                        <span className="notice-type">First Notice</span>
                        <span className="notice-property">456 Oak Ave</span>
                      </div>
                      <span className="notice-date">Nov 10, 2024</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="analytics-panel">
              <div className="panel-header">
                <h2>Collection Analytics</h2>
                <div className="analytics-grid">
                  <div className="tf-card analytics-card">
                    <h3>Collection Trends</h3>
                    <div className="trend-chart">
                      <div className="chart-placeholder">
                        <p>Monthly collection trends chart would appear here</p>
                      </div>
                    </div>
                  </div>

                  <div className="tf-card analytics-card">
                    <h3>Collections by Category</h3>
                    <div className="category-breakdown">
                      <div className="category-item">
                        <span className="category-label">Current Year</span>
                        <span className="category-value">{formatCurrency(280000)}</span>
                        <div className="bar-fill" style={{ width: '75%' }}></div>
                      </div>
                      <div className="category-item">
                        <span className="category-label">Prior Year</span>
                        <span className="category-value">{formatCurrency(85000)}</span>
                        <div className="bar-fill" style={{ width: '45%' }}></div>
                      </div>
                      <div className="category-item">
                        <span className="category-label">Penalties</span>
                        <span className="category-value">{formatCurrency(15000)}</span>
                        <div className="bar-fill" style={{ width: '25%' }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="tf-card analytics-card">
                    <h3>Delinquency Analysis</h3>
                    <div className="delinquency-stats">
                      <div className="stat-item">
                        <span className="stat-label">30-60 Days</span>
                        <span className="stat-value">25 properties</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">60-90 Days</span>
                        <span className="stat-value">15 properties</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">90+ Days</span>
                        <span className="stat-value">5 properties</span>
                      </div>
                    </div>
                  </div>

                  <div className="tf-card analytics-card">
                    <h3>Performance Metrics</h3>
                    <div className="performance-metrics">
                      <div className="metric-item">
                        <span className="metric-label">Collection Rate (MTD)</span>
                        <span className="metric-value">22</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Payment Plan Success</span>
                        <span className="metric-value">87%</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Notice Response Rate</span>
                        <span className="metric-value">65%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="report-actions">
                  <button className="tf-button-primary">
                    📊 Generate Monthly Report
                  </button>
                  <button className="tf-button-primary">
                    📈 Export Analytics Data
                  </button>
                  <button className="tf-button-primary">
                    📧 Schedule Email Reports
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
