import React, { useState, useEffect } from 'react';
import './PublicPortal.css';

interface QuickStat {
  label: string;
  value: string;
  icon: string;
  trend?: string;
}

interface RecentRequest {
  id: string;
  type: string;
  department: string;
  status: 'pending' | 'processing' | 'completed' | 'denied';
  submitDate: string;
  description: string;
}

interface PopularRecord {
  id: string;
  title: string;
  category: string;
  downloads: number;
  lastUpdated: string;
}

const PublicPortal: React.FC = () => {
  const [quickStats, setQuickStats] = useState<QuickStat[]>([]);
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [popularRecords, setPopularRecords] = useState<PopularRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPortalData();
  }, []);

  const fetchPortalData = async () => {
    try {
      // Mock data for demonstration
      setQuickStats([
        {
          label: 'Total Public Records',
          value: '1,247,893',
          icon: '📄',
          trend: '+2.3% this month'
        },
        {
          label: 'FOIA Requests (YTD)',
          value: '8,542',
          icon: '📝',
          trend: '+15.7% vs last year'
        },
        {
          label: 'Avg Response Time',
          value: '4.2 days',
          icon: '⏱️',
          trend: '12% faster'
        },
        {
          label: 'Records Digitized',
          value: '94.7%',
          icon: '💾',
          trend: '+8.1% this quarter'
        }
      ]);

      setRecentRequests([
        {
          id: 'FOIA-2024-0892',
          type: 'Freedom of Information Act',
          department: 'Public Works',
          status: 'processing',
          submitDate: '2024-09-10',
          description: 'Infrastructure maintenance records for Highway 101'
        },
        {
          id: 'PR-2024-1156',
          type: 'Public Records Request',
          department: 'City Planning',
          status: 'completed',
          submitDate: '2024-09-08',
          description: 'Zoning variance applications - Downtown District'
        },
        {
          id: 'FOIA-2024-0887',
          type: 'Freedom of Information Act',
          department: 'Police Department',
          status: 'pending',
          submitDate: '2024-09-12',
          description: 'Crime statistics report for Q3 2024'
        },
        {
          id: 'PR-2024-1159',
          type: 'Public Records Request',
          department: 'Environmental Services',
          status: 'completed',
          submitDate: '2024-09-06',
          description: 'Water quality testing results - Municipal wells'
        }
      ]);

      setPopularRecords([
        {
          id: 'BUD-2024-ANNUAL',
          title: 'Annual Budget Report 2024',
          category: 'Financial Records',
          downloads: 15247,
          lastUpdated: '2024-09-01'
        },
        {
          id: 'MEET-CC-0914',
          title: 'City Council Meeting Minutes - September 14, 2024',
          category: 'Meeting Records',
          downloads: 8956,
          lastUpdated: '2024-09-14'
        },
        {
          id: 'ELEC-2024-RESULTS',
          title: 'Election Results - Primary 2024',
          category: 'Electoral Records',
          downloads: 12034,
          lastUpdated: '2024-08-15'
        },
        {
          id: 'PLAN-MASTER-2024',
          title: 'Master Development Plan Update',
          category: 'Planning Documents',
          downloads: 6728,
          lastUpdated: '2024-08-30'
        },
        {
          id: 'AUDIT-FIN-2023',
          title: 'Independent Financial Audit 2023',
          category: 'Financial Records',
          downloads: 9413,
          lastUpdated: '2024-07-20'
        }
      ]);

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch portal data:', error);
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#00ff88';
      case 'processing': return '#0099ff';
      case 'pending': return '#ffaa00';
      case 'denied': return '#ff3333';
      default: return '#888888';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'processing': return '🔄';
      case 'pending': return '⏳';
      case 'denied': return '❌';
      default: return '❓';
    }
  };

  if (isLoading) {
    return (
      <div className="portal-loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading public portal...</div>
      </div>
    );
  }

  return (
    <div className="public-portal">
      
      {/* Hero Section */}
      <div className="portal-hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Welcome to Government Transparency</h1>
            <p className="hero-subtitle">
              Access public records, submit FOIA requests, and explore government data 
              with our comprehensive transparency portal.
            </p>
            <div className="hero-actions">
              <button className="cta-button primary">
                <span className="button-icon">🔍</span>
                <span>Search Records</span>
              </button>
              <button className="cta-button secondary">
                <span className="button-icon">📝</span>
                <span>Submit FOIA Request</span>
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="transparency-icon">
              <div className="icon-circle">
                <span className="main-icon">🏛️</span>
              </div>
              <div className="icon-orbits">
                <div className="orbit orbit-1">
                  <span className="orbit-icon">📄</span>
                </div>
                <div className="orbit orbit-2">
                  <span className="orbit-icon">🔍</span>
                </div>
                <div className="orbit orbit-3">
                  <span className="orbit-icon">📊</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-section">
        <div className="stats-header">
          <h2>Transparency at a Glance</h2>
          <p>Real-time metrics from our government transparency initiatives</p>
        </div>
        <div className="stats-grid">
          {quickStats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-content">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
                {stat.trend && (
                  <div className="stat-trend">{stat.trend}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="portal-content">
        
        {/* Recent Requests */}
        <div className="content-panel">
          <div className="panel-header">
            <h3>Recent Public Requests</h3>
            <button className="view-all-btn">View All →</button>
          </div>
          <div className="panel-content">
            <div className="requests-list">
              {recentRequests.map(request => (
                <div key={request.id} className="request-item">
                  <div className="request-header">
                    <div className="request-id">{request.id}</div>
                    <div className="request-status">
                      <span className="status-icon">{getStatusIcon(request.status)}</span>
                      <span 
                        className="status-text"
                        style={{color: getStatusColor(request.status)}}
                      >
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="request-details">
                    <div className="request-description">{request.description}</div>
                    <div className="request-meta">
                      <span className="request-type">{request.type}</span>
                      <span className="request-department">{request.department}</span>
                      <span className="request-date">{request.submitDate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Popular Records */}
        <div className="content-panel">
          <div className="panel-header">
            <h3>Most Accessed Records</h3>
            <button className="view-all-btn">Browse All →</button>
          </div>
          <div className="panel-content">
            <div className="records-list">
              {popularRecords.map((record, index) => (
                <div key={record.id} className="record-item">
                  <div className="record-rank">#{index + 1}</div>
                  <div className="record-content">
                    <div className="record-title">{record.title}</div>
                    <div className="record-meta">
                      <span className="record-category">{record.category}</span>
                      <span className="record-updated">Updated: {record.lastUpdated}</span>
                    </div>
                    <div className="record-stats">
                      <span className="download-count">
                        📥 {record.downloads.toLocaleString()} downloads
                      </span>
                    </div>
                  </div>
                  <button className="download-btn" title="Download Record">
                    ⬇️
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="content-panel">
          <div className="panel-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="panel-content">
            <div className="actions-grid">
              <div className="action-card">
                <div className="action-icon">📋</div>
                <div className="action-title">Submit Request</div>
                <div className="action-description">File a new FOIA or public records request</div>
                <button className="action-button">Get Started</button>
              </div>
              
              <div className="action-card">
                <div className="action-icon">📊</div>
                <div className="action-title">Data Portal</div>
                <div className="action-description">Explore open datasets and analytics</div>
                <button className="action-button">Explore Data</button>
              </div>
              
              <div className="action-card">
                <div className="action-icon">📞</div>
                <div className="action-title">Contact Office</div>
                <div className="action-description">Speak with records management staff</div>
                <button className="action-button">Contact Us</button>
              </div>
              
              <div className="action-card">
                <div className="action-icon">❓</div>
                <div className="action-title">How-To Guide</div>
                <div className="action-description">Learn about your access rights</div>
                <button className="action-button">Learn More</button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Footer Info */}
      <div className="portal-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Your Rights</h4>
            <ul>
              <li>Freedom of Information Act (FOIA)</li>
              <li>Public Records Act compliance</li>
              <li>Government transparency access</li>
              <li>Privacy protection guarantee</li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Response Times</h4>
            <ul>
              <li>Simple requests: 1-3 business days</li>
              <li>Complex requests: 5-10 business days</li>
              <li>Appeals process: 10-20 business days</li>
              <li>Emergency requests: Same day</li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Contact Information</h4>
            <ul>
              <li>📧 records@government.local</li>
              <li>📞 (555) 123-FOIA (3642)</li>
              <li>🏢 123 Government Plaza</li>
              <li>🕒 Mon-Fri, 8:00 AM - 5:00 PM</li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
};

export default PublicPortal;