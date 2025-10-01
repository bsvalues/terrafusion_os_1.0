import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, FileText, Calendar, User, AlertCircle, CheckCircle, Clock, Eye } from 'lucide-react';

interface LegalCase {
  id: string;
  case_number: string;
  case_type: string;
  court_type: string;
  status: string;
  title: string;
  plaintiff: string;
  defendant: string;
  filed_date: string;
  judge_assigned: string;
  attorney_plaintiff: string | null;
  attorney_defendant: string | null;
  next_hearing: string | null;
  estimated_duration_minutes: number;
  filing_fee: number;
  priority_level: number;
}

interface CasesData {
  cases: LegalCase[];
  total_count: number;
  active_count: number;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'filed':
      return <FileText size={16} className="status-icon filed" />;
    case 'pending':
      return <Clock size={16} className="status-icon pending" />;
    case 'in_progress':
      return <AlertCircle size={16} className="status-icon in-progress" />;
    case 'scheduled':
      return <Calendar size={16} className="status-icon scheduled" />;
    case 'closed':
      return <CheckCircle size={16} className="status-icon closed" />;
    default:
      return <FileText size={16} className="status-icon" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'filed': return '#059669';
    case 'pending': return '#d97706';
    case 'in_progress': return '#dc2626';
    case 'scheduled': return '#1e40af';
    case 'closed': return '#16a34a';
    default: return '#64748b';
  }
};

const formatCaseType = (type: string) => {
  return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const CaseManagement: React.FC = () => {
  const [casesData, setCasesData] = useState<CasesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedCase, setSelectedCase] = useState<LegalCase | null>(null);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await fetch('http://localhost:\${{TF_PORT_5290:-5290}}/api/legal/cases');
        if (!response.ok) {
          throw new Error('Failed to fetch cases');
        }
        const data = await response.json();
        setCasesData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
    const interval = setInterval(fetchCases, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredCases = casesData?.cases.filter(case_ => {
    const matchesSearch = 
      case_.case_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.plaintiff.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.defendant.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || case_.status === filterStatus;
    const matchesType = filterType === 'all' || case_.case_type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  }) || [];

  if (loading) {
    return (
      <div className="cases-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading case records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cases-container">
        <div className="error-state">
          <AlertCircle size={48} />
          <h3>Error Loading Cases</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cases-container">
      {/* Header */}
      <div className="cases-header">
        <div className="header-content">
          <FileText size={28} />
          <div>
            <h1>Case Management</h1>
            <p>Comprehensive legal case tracking and management</p>
          </div>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-number">{casesData?.total_count || 0}</span>
            <span className="stat-label">Total Cases</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{casesData?.active_count || 0}</span>
            <span className="stat-label">Active Cases</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="cases-controls">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by case number, title, plaintiff, or defendant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-controls">
          <div className="filter-group">
            <Filter size={16} />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="filed">Filed</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="scheduled">Scheduled</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          
          <div className="filter-group">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="civil">Civil</option>
              <option value="criminal">Criminal</option>
              <option value="family">Family</option>
              <option value="probate">Probate</option>
              <option value="traffic">Traffic</option>
              <option value="small_claims">Small Claims</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cases Grid */}
      <div className="cases-grid">
        {filteredCases.map((case_) => (
          <div key={case_.id} className="case-card">
            <div className="case-header">
              <div className="case-number">
                {getStatusIcon(case_.status)}
                <span>{case_.case_number}</span>
              </div>
              <div className="case-type" style={{ color: getStatusColor(case_.status) }}>
                {formatCaseType(case_.case_type)}
              </div>
            </div>
            
            <div className="case-title">
              <h3>{case_.title}</h3>
              <p className="case-parties">
                {case_.plaintiff} v. {case_.defendant}
              </p>
            </div>
            
            <div className="case-details">
              <div className="detail-row">
                <User size={14} />
                <span>Judge: {case_.judge_assigned}</span>
              </div>
              <div className="detail-row">
                <Calendar size={14} />
                <span>Filed: {new Date(case_.filed_date).toLocaleDateString()}</span>
              </div>
              {case_.next_hearing && (
                <div className="detail-row">
                  <Clock size={14} />
                  <span>Next: {new Date(case_.next_hearing).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            
            <div className="case-footer">
              <div className="case-status" style={{ backgroundColor: getStatusColor(case_.status) }}>
                {case_.status.replace('_', ' ').toUpperCase()}
              </div>
              <div className="case-priority">
                Priority: {case_.priority_level}
              </div>
              <button 
                className="view-button"
                onClick={() => setSelectedCase(case_)}
              >
                <Eye size={16} />
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredCases.length === 0 && (
        <div className="empty-state">
          <FileText size={48} />
          <h3>No Cases Found</h3>
          <p>No cases match your current search and filter criteria.</p>
        </div>
      )}

      {/* Case Detail Modal */}
      {selectedCase && (
        <div className="modal-overlay" onClick={() => setSelectedCase(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Case Details: {selectedCase.case_number}</h2>
              <button onClick={() => setSelectedCase(null)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="detail-section">
                <h4>Case Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Title:</label>
                    <span>{selectedCase.title}</span>
                  </div>
                  <div className="detail-item">
                    <label>Type:</label>
                    <span>{formatCaseType(selectedCase.case_type)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Court:</label>
                    <span>{selectedCase.court_type.replace('_', ' ').toUpperCase()}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status:</label>
                    <span style={{ color: getStatusColor(selectedCase.status) }}>
                      {selectedCase.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h4>Parties</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Plaintiff:</label>
                    <span>{selectedCase.plaintiff}</span>
                  </div>
                  <div className="detail-item">
                    <label>Defendant:</label>
                    <span>{selectedCase.defendant}</span>
                  </div>
                  <div className="detail-item">
                    <label>Plaintiff Attorney:</label>
                    <span>{selectedCase.attorney_plaintiff || 'Not assigned'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Defendant Attorney:</label>
                    <span>{selectedCase.attorney_defendant || 'Not assigned'}</span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h4>Schedule & Fees</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Filed Date:</label>
                    <span>{new Date(selectedCase.filed_date).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <label>Judge:</label>
                    <span>{selectedCase.judge_assigned}</span>
                  </div>
                  <div className="detail-item">
                    <label>Next Hearing:</label>
                    <span>
                      {selectedCase.next_hearing 
                        ? new Date(selectedCase.next_hearing).toLocaleDateString() 
                        : 'Not scheduled'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Filing Fee:</label>
                    <span>${selectedCase.filing_fee.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseManagement;