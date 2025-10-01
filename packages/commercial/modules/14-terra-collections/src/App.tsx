import "./terrafusion-brand.css";
import {useState, useEffect} from "react";
import {invoke} from "@tauri-apps/api/core";
import "./App.css";

interface TaxRecord {id: string;
  property_id: string;
  property_address: string;
  owner_name: string;
  tax_year: number;
  amount_due: number;
  amount_paid: number;
  status: 'paid' | 'pending' | 'delinquent' | 'partial';
  due_date: string;
  payment_date?: string;
  penalty_amount?: number;}

interface CollectionStats {total_due: number;
  total_collected: number;
  collection_rate: number;
  delinquent_count: number;
  pending_count: number;}

interface PaymentPlan {id: string;
  property_id: string;
  total_amount: number;
  down_payment: number;
  monthly_payment: number;
  duration_months: number;
  start_date: string;
  status: 'active' | 'completed' | 'defaulted';}

function App() {const [activeTab, setActiveTab] = useState('overview');
  const [taxRecords, setTaxRecords] = useState<TaxRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<TaxRecord | null>(null);
  const [collectionStats, setCollectionStats] = useState<CollectionStats>({
    total_due: 0,
    total_collected: 0,
    collection_rate: 0,
    delinquent_count: 0,
    pending_count: 0});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);

  useEffect(() => {loadTaxRecords();
    loadCollectionStats();
    loadPaymentPlans();}, []);

  const loadTaxRecords = async () => {try {
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
          payment_date: '2024-11-15'},
        {id: '2',
          property_id: 'PROP-002',
          property_address: '456 Oak Ave, Springfield, IL',
          owner_name: 'Jane Doe',
          tax_year: 2024,
          amount_due: 3800.00,
          amount_paid: 0,
          status: 'pending',
          due_date: '2024-12-31'},
        {id: '3',
          property_id: 'PROP-003',
          property_address: '789 Pine Rd, Springfield, IL',
          owner_name: 'Bob Johnson',
          tax_year: 2023,
          amount_due: 4200.00,
          amount_paid: 0,
          status: 'delinquent',
          due_date: '2023-12-31',
          penalty_amount: 420.00},
        {id: '4',
          property_id: 'PROP-004',
          property_address: '321 Elm St, Springfield, IL',
          owner_name: 'Alice Williams',
          tax_year: 2024,
          amount_due: 6100.00,
          amount_paid: 3050.00,
          status: 'partial',
          due_date: '2024-12-31'}
      ];
      
      setTaxRecords(mockRecords);
    } catch (error) {console.error('Failed to load tax records:', error);}
  };

  const loadCollectionStats = async () => {try {
      const stats = await invoke<CollectionStats>('get_collection_stats');
      setCollectionStats(stats);} catch (error) {// Use mock data if invoke fails
      setCollectionStats({
        total_due: 525000,
        total_collected: 380000,
        collection_rate: 72.4,
        delinquent_count: 45,
        pending_count: 120});
    }
  };

  const loadPaymentPlans = async () => {try {
      const mockPlans: PaymentPlan[] = [
        {
          id: 'PLAN-001',
          property_id: 'PROP-004',
          total_amount: 6100.00,
          down_payment: 1500.00,
          monthly_payment: 383.33,
          duration_months: 12,
          start_date: '2024-01-01',
          status: 'active'}
      ];
      setPaymentPlans(mockPlans);
    } catch (error) {console.error('Failed to load payment plans:', error);}
  };

  const handleSearch = async () => {try {
      const results = await invoke<TaxRecord[]>('search_tax_records', { 
        term: searchTerm,
        status: filterStatus});
      setTaxRecords(results);
    } catch (error) {console.error('Search failed:', error);}
  };

  const handleProcessPayment = async (recordId: string, amount: number) =>{try {
      await invoke('process_payment', { recordId, amount});
      await loadTaxRecords();
      await loadCollectionStats();
    } catch (error) {console.error('Payment processing failed:', error);}
  };

  const handleSendNotice = async (recordId: string, noticeType: string) => {try {
      await invoke('send_collection_notice', { recordId, noticeType});
      alert(`${noticeType} notice sent successfully`);
    } catch (error) {console.error('Failed to send notice:', error);}
  };

  const getStatusColor = (status: string) => {switch (status) {
      case 'paid': return '#00ff88';
      case 'pending': return '#ff9500';
      case 'delinquent': return '#ff0066';
      case 'partial': return '#00ccff';
      default: return '#666';}
  };

  const filteredRecords = taxRecords.filter(record => {if (filterStatus !== 'all' && record.status !== filterStatus) return false;
    if (searchTerm && !record.property_address.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !record.owner_name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;});

  const formatCurrency = (amount: number) => {return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'}).format(amount);
  };

  return (<div className="collections-container"><header className="collections-header"><><h1 className="tf-gradient-text">💰 Terrafusion Revenue Collections</h1><div
</>
className="header-stats"><div className="stat-card"><><span className="stat-label">Collection Rate</span><span
</>className="stat-value" style={{ color: collectionStats.collection_rate > 70 ? '#00ff88' : '#ff9500'}}>
              {collectionStats.collection_rate.toFixed(1)}%</span></div><div className="stat-card"><><span className="stat-label">Total Collected</span><span
</>
className="stat-value">{formatCurrency(collectionStats.total_collected)}</span></div></div></header><nav className="nav-tabs"><><button 
          className={activeTab === 'overview' ? 'tab-active' : 'tab'}
          onClick={() =>setActiveTab('overview')}
        >
          📊 Overview</button><button
</>className={activeTab === 'records' ? 'tab-active' : 'tab'}
          onClick={() => setActiveTab('records')}
        >
          📋 Tax Records</button><><button 
          className={activeTab === 'collections' ? 'tab-active' : 'tab'}
          onClick={() =>setActiveTab('collections')}
        >
          💸 Collections</button><button
</>className={activeTab === 'payment-plans' ? 'tab-active' : 'tab'}
          onClick={() => setActiveTab('payment-plans')}
        >
          📅 Payment Plans</button><><button 
          className={activeTab === 'notices' ? 'tab-active' : 'tab'}
          onClick={() =>setActiveTab('notices')}
        >
          📬 Notices</button><button
</>className={activeTab === 'analytics' ? 'tab-active' : 'tab'}
          onClick={() => setActiveTab('analytics')}
        >
          📈 Analytics</button></nav><div className="collections-content">{activeTab === 'overview' && (<div className="overview-panel"><><h2>Revenue Collection Overview</h2><div
</>
className="overview-grid"><div className="tf-card overview-card"><><h3>Collection Summary</h3><div
</>
className="summary-stats"><div className="summary-row"><><span>Total Due:</span><span
</>
className="amount">{formatCurrency(collectionStats.total_due)}</span></div><div className="summary-row"><><span>Total Collected:</span><span
</>
className="amount collected">{formatCurrency(collectionStats.total_collected)}</span></div><div className="summary-row"><><span>Outstanding:</span><span
</>className="amount outstanding">
                      {formatCurrency(collectionStats.total_due - collectionStats.total_collected)}</span></div></div></div><div className="tf-card overview-card"><><h3>Status Distribution</h3><div
</>
className="status-grid"><div className="status-item"><><div className="status-icon paid">✓</div><div
</>
className="status-info"><><span className="status-count">{taxRecords.filter(r => r.status === 'paid').length}</span><span
</>
className="status-label">Paid</span></div></div><div className="status-item"><><div className="status-icon pending">⏳</div><div
</>
className="status-info"><><span className="status-count">{collectionStats.pending_count}</span><span
</>
className="status-label">Pending</span></div></div><div className="status-item"><><div className="status-icon delinquent">!</div><div
</>
className="status-info"><><span className="status-count">{collectionStats.delinquent_count}</span><span
</>
className="status-label">Delinquent</span></div></div></div></div><div className="tf-card overview-card"><><h3>Quick Actions</h3><div
</>
className="quick-actions"><><button className="tf-button-primary" onClick={() =>setActiveTab('records')}>
                    🔍 Search Records</button><button
</>className="tf-button-primary" onClick={() => setActiveTab('collections')}>
                    💳 Process Payment</button><><button className="tf-button-primary" onClick={() =>setActiveTab('notices')}>
                    📧 Send Notices</button><button
</>className="tf-button-primary" onClick={() => setActiveTab('analytics')}>
                    📊 View Reports</button></div></div><div className="tf-card overview-card"><><h3>Recent Activity</h3><div
</>
className="activity-list"><div className="activity-item"><><span className="activity-time">10:32 AM</span><span
</>
className="activity-text">Payment received - PROP-001</span><span className="activity-amount">+$5,250</span></div><div className="activity-item"><><span className="activity-time">9:15 AM</span><span
</>
className="activity-text">Notice sent - PROP-003</span><span className="activity-type">Delinquent</span></div><div className="activity-item"><><span className="activity-time">Yesterday</span><span
</>
className="activity-text">Payment plan created - PROP-004</span><span className="activity-amount">$383/mo</span></div></div></div></div></div>)}

        {activeTab === 'records' && (<div className="records-panel"><><h2>Tax Records Management</h2><div
</>
className="search-controls"><div className="search-bar"><input
                  type="text"
                  className="search-input"
                  placeholder="Search by address or owner name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                /><select 
                  className="filter-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                ><><option value="all">All Status</option><option
</>
value="paid">Paid</option><><option value="pending">Pending</option><option
</>
value="delinquent">Delinquent</option><option value="partial">Partial</option></select><button className="search-btn" onClick={handleSearch}>🔍 Search</button></div></div><div className="records-grid">{filteredRecords.map(record => (<div 
                  key={record.id} 
                  className="tf-card record-card"
                  onClick={() => setSelectedRecord(record)}
                ><div className="record-header"><><h3>{record.property_address}</h3><span
</>className="status-badge"
                      style={{ backgroundColor: getStatusColor(record.status)}}
                    >
                      {record.status.toUpperCase()}</span></div><div className="record-details"><div className="detail-row"><><span>Owner:</span><span
</></>>{record.owner_name}</span></div><div className="detail-row"><><span>Property ID:</span><span
</></>>{record.property_id}</span></div><div className="detail-row"><><span>Tax Year:</span><span
</></>>{record.tax_year}</span></div><div className="detail-row"><><span>Amount Due:</span><span
</>
className="amount-due">{formatCurrency(record.amount_due)}</span></div><div className="detail-row"><><span>Amount Paid:</span><span
</>
className="amount-paid">{formatCurrency(record.amount_paid)}</span></div>{record.penalty_amount && (<div className="detail-row"><><span>Penalty:</span><span
</>
className="penalty">{formatCurrency(record.penalty_amount)}</span></div>)}</div><div className="record-actions"><><button 
                      className="action-btn"
                      onClick={(e) =>{
                        e.stopPropagation();
                        handleProcessPayment(record.id, record.amount_due - record.amount_paid);}}
                    >
                      💳 Process Payment</button><button
</>className="action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab('notices');}}
                    >
                      📧 Send Notice</button></div></div>))}</div></div>)}

        {activeTab === 'collections' && (<div className="collections-panel"><h2>Payment Processing</h2>{selectedRecord ? (<div className="tf-card payment-form"><><h3>Process Payment for {selectedRecord.property_address}</h3><div
</>
className="payment-details"><div className="detail-row"><><span>Owner:</span><span
</></>>{selectedRecord.owner_name}</span></div><div className="detail-row"><><span>Total Due:</span><span
</></>>{formatCurrency(selectedRecord.amount_due)}</span></div><div className="detail-row"><><span>Already Paid:</span><span
</></>>{formatCurrency(selectedRecord.amount_paid)}</span></div><div className="detail-row"><><span>Balance:</span><span
</>className="balance">
                      {formatCurrency(selectedRecord.amount_due - selectedRecord.amount_paid)}</span></div></div><div className="payment-options"><><h4>Payment Options</h4><button
</>className="tf-button-primary full-width">
                    💳 Pay Full Balance</button><><button className="tf-button-primary full-width">📅 Setup Payment Plan</button><button
</>className="tf-button-primary full-width">
                    💰 Make Partial Payment</button></div></div>) : (<div className="empty-state"><p>Select a tax record from the Records tab to process payment</p></div>)}<div className="recent-payments"><><h3>Recent Payments</h3><div
</>
className="payments-list"><div className="payment-item"><div className="payment-info"><><span className="payment-address">123 Main St</span><span
</>
className="payment-date">Nov 15, 2024</span></div><span className="payment-amount">$5,250.00</span></div><div className="payment-item"><div className="payment-info"><><span className="payment-address">321 Elm St</span><span
</>
className="payment-date">Nov 10, 2024</span></div><span className="payment-amount">$1,550.00</span></div></div></div></div>)}

        {activeTab === 'payment-plans' && (<div className="payment-plans-panel"><><h2>Payment Plan Management</h2><div
</>
className="plans-controls"><button className="tf-button-primary">➕ Create New Payment Plan</button></div><div className="plans-grid">{paymentPlans.map(plan => (<div key={plan.id} className="tf-card plan-card"><div className="plan-header"><><h3>Plan {plan.id}</h3><span
</>className={`status-badge ${plan.status}`}>
                      {plan.status.toUpperCase()}</span></div><div className="plan-details"><div className="detail-row"><><span>Property:</span><span
</></>>{plan.property_id}</span></div><div className="detail-row"><><span>Total Amount:</span><span
</></>>{formatCurrency(plan.total_amount)}</span></div><div className="detail-row"><><span>Down Payment:</span><span
</></>>{formatCurrency(plan.down_payment)}</span></div><div className="detail-row"><><span>Monthly Payment:</span><span
</></>>{formatCurrency(plan.monthly_payment)}</span></div><div className="detail-row"><><span>Duration:</span><span
</></>>{plan.duration_months} months</span></div></div><div className="plan-progress"><div className="progress-bar"><div 
                        className="progress-fill"
                        style={{ width: '25%'}}
                      ></div></div><span className="progress-text">3 of 12 payments made</span></div></div>))}</div></div>)}

        {activeTab === 'notices' && (<div className="notices-panel"><><h2>Collection Notices</h2><div
</>
className="notice-templates"><><h3>Notice Templates</h3><div
</>
className="templates-grid"><div className="tf-card template-card"><><h4>📧 Friendly Reminder</h4><p
</></>>Send to properties with upcoming due dates</p><button className="tf-button-primary">Send Bulk</button></div><div className="tf-card template-card"><><h4>⚠️ Past Due Notice</h4><p
</></>>For properties 30+ days overdue</p><button className="tf-button-primary">Send Bulk</button></div><div className="tf-card template-card"><><h4>🚨 Final Notice</h4><p
</></>>For seriously delinquent accounts</p><button className="tf-button-primary">Send Bulk</button></div><div className="tf-card template-card"><><h4>⚖️ Legal Action Warning</h4><p
</></>>Pre-lien notification</p><button className="tf-button-primary">Send Bulk</button></div></div></div><div className="notice-history"><><h3>Recent Notices Sent</h3><div
</>
className="notices-list"><div className="notice-item"><><span className="notice-type">Past Due Notice</span><span
</>
className="notice-property">789 Pine Rd</span><span className="notice-date">Nov 12, 2024</span></div><div className="notice-item"><><span className="notice-type">Friendly Reminder</span><span
</>
className="notice-property">456 Oak Ave</span><span className="notice-date">Nov 10, 2024</span></div></div></div></div>)}

        {activeTab === 'analytics' && (<div className="analytics-panel"><><h2>Collection Analytics</h2><div
</>
className="analytics-grid"><div className="tf-card analytics-card"><><h3>Collection Trends</h3><div
</>
className="trend-chart"><div className="chart-placeholder">📈 Monthly Collection Rate Chart</div></div></div><div className="tf-card analytics-card"><><h3>Revenue by Category</h3><div
</>
className="category-breakdown"><div className="category-item"><><span>Residential</span><span
</></>>$280,000</span><div className="category-bar"><div className="bar-fill" style={{ width: '75%'}}></div></div></div><div className="category-item"><><span>Commercial</span><span
</></>>$85,000</span><div className="category-bar"><div className="bar-fill" style={{ width: '25%'}}></div></div></div><div className="category-item"><><span>Industrial</span><span
</></>>$15,000</span><div className="category-bar"><div className="bar-fill" style={{ width: '5%'}}></div></div></div></div></div><div className="tf-card analytics-card"><><h3>Delinquency Analysis</h3><div
</>
className="delinquency-stats"><div className="stat-row"><><span>30-60 days:</span><span
</></>>25 properties</span></div><div className="stat-row"><><span>60-90 days:</span><span
</></>>15 properties</span></div><div className="stat-row"><><span>90+ days:</span><span
</></>>5 properties</span></div></div></div><div className="tf-card analytics-card"><><h3>Performance Metrics</h3><div
</>
className="performance-metrics"><div className="metric-item"><><span className="metric-label">Avg Days to Payment</span><span
</>
className="metric-value">22</span></div><div className="metric-item"><><span className="metric-label">Payment Plan Success</span><span
</>
className="metric-value">87%</span></div><div className="metric-item"><><span className="metric-label">Notice Response Rate</span><span
</>
className="metric-value">65%</span></div></div></div></div><div className="report-actions"><><button className="tf-button-primary">📊 Generate Monthly Report</button><button
</>className="tf-button-primary">
                📈 Export Analytics Data</button><button className="tf-button-primary">📧 Schedule Email Reports</button></div></div>)}</div></div>
  );
}

export default App;