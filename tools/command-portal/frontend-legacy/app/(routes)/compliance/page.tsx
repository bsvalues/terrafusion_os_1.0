'use client';
import { useState, useEffect } from 'react';
import useSWR from 'swr';

interface Regulation {
  id: string;
  name: string;
  type: 'FOIA' | 'ADA' | 'Privacy' | 'Security' | 'Records' | 'Accessibility';
  status: 'compliant' | 'non-compliant' | 'pending' | 'review-required';
  lastCheck: Date;
  requirements: Requirement[];
  evidence: Evidence[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface Requirement {
  id: string;
  description: string;
  status: 'met' | 'not-met' | 'partial' | 'not-applicable';
  evidence: string[];
  lastUpdated: Date;
}

interface Evidence {
  id: string;
  type: 'document' | 'policy' | 'audit' | 'training' | 'system-config';
  name: string;
  description: string;
  url: string;
  uploadDate: Date;
  expiryDate?: Date;
}

interface CitizenRequest {
  id: string;
  type: 'FOIA' | 'Public Records' | 'Service Request' | 'Complaint' | 'Information';
  title: string;
  description: string;
  status: 'received' | 'processing' | 'pending-approval' | 'completed' | 'denied';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  submittedBy: CitizenInfo;
  submissionDate: Date;
  dueDate: Date;
  assignedTo?: string;
  documents: Document[];
  timeline: TimelineEvent[];
}

interface CitizenInfo {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  isVerified?: boolean;
}

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: Date;
  accessLevel: 'public' | 'restricted' | 'confidential';
}

interface TimelineEvent {
  id: string;
  event: string;
  description: string;
  timestamp: Date;
  actor: string;
  status: string;
}

interface AccessibilityCheck {
  id: string;
  page: string;
  url: string;
  status: 'pass' | 'fail' | 'warning';
  score: number;
  issues: AccessibilityIssue[];
  lastCheck: Date;
  wcagLevel: 'A' | 'AA' | 'AAA';
}

interface AccessibilityIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  element: string;
  suggestion: string;
}

interface PublicRecord {
  id: string;
  title: string;
  category: string;
  description: string;
  createdDate: Date;
  lastModified: Date;
  accessLevel: 'public' | 'restricted' | 'confidential';
  retentionPeriod: number; // years
  size: number;
  format: string;
  downloads: number;
  views: number;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function GovernmentCompliance() {
  const [activeTab, setActiveTab] = useState<string>('compliance');
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [citizenRequests, setCitizenRequests] = useState<CitizenRequest[]>([]);
  const [accessibilityChecks, setAccessibilityChecks] = useState<AccessibilityCheck[]>([]);
  const [publicRecords, setPublicRecords] = useState<PublicRecord[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  // Real-time compliance data
  const { data: complianceData, error } = useSWR('/api/compliance', fetcher, { 
    refreshInterval: 30000 
  });
  const { data: requestsData } = useSWR('/api/citizen-requests', fetcher, {
    refreshInterval: 10000
  });

  useEffect(() => {
    // Mock compliance data
    const mockRegulations: Regulation[] = [
      {
        id: 'reg-1',
        name: 'Freedom of Information Act (FOIA)',
        type: 'FOIA',
        status: 'compliant',
        lastCheck: new Date(Date.now() - 24 * 60 * 60 * 1000),
        riskLevel: 'low',
        requirements: [
          {
            id: 'foia-1',
            description: 'Respond to FOIA requests within 20 business days',
            status: 'met',
            evidence: ['response-time-report.pdf', 'foia-log-2024.xlsx'],
            lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          },
          {
            id: 'foia-2',
            description: 'Maintain public FOIA request log',
            status: 'met',
            evidence: ['public-foia-log.html'],
            lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          }
        ],
        evidence: [
          {
            id: 'ev-1',
            type: 'policy',
            name: 'FOIA Response Policy',
            description: 'Comprehensive policy for handling FOIA requests',
            url: '/policies/foia-response-policy.pdf',
            uploadDate: new Date('2024-01-15'),
            expiryDate: new Date('2025-01-15')
          }
        ]
      },
      {
        id: 'reg-2',
        name: 'Americans with Disabilities Act (ADA)',
        type: 'ADA',
        status: 'pending',
        lastCheck: new Date(Date.now() - 2 * 60 * 60 * 1000),
        riskLevel: 'medium',
        requirements: [
          {
            id: 'ada-1',
            description: 'Website must meet WCAG 2.1 AA standards',
            status: 'partial',
            evidence: ['accessibility-audit-q1-2024.pdf'],
            lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          },
          {
            id: 'ada-2',
            description: 'Digital content must be accessible to screen readers',
            status: 'met',
            evidence: ['screen-reader-test-results.pdf'],
            lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          }
        ],
        evidence: []
      },
      {
        id: 'reg-3',
        name: 'Public Records Retention',
        type: 'Records',
        status: 'compliant',
        lastCheck: new Date(Date.now() - 6 * 60 * 60 * 1000),
        riskLevel: 'low',
        requirements: [
          {
            id: 'records-1',
            description: 'Maintain records according to state retention schedule',
            status: 'met',
            evidence: ['retention-schedule-compliance.xlsx'],
            lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          }
        ],
        evidence: []
      }
    ];

    const mockCitizenRequests: CitizenRequest[] = [
      {
        id: 'req-1',
        type: 'FOIA',
        title: 'Budget Documents for 2024 Fiscal Year',
        description: 'Requesting all budget-related documents and meeting minutes for the 2024 fiscal year budget planning process.',
        status: 'processing',
        priority: 'medium',
        submittedBy: {
          name: 'John Smith',
          email: 'john.smith@email.com',
          phone: '(555) 123-4567',
          isVerified: true
        },
        submissionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        assignedTo: 'Sarah Chen',
        documents: [],
        timeline: [
          {
            id: 'tl-1',
            event: 'Request Received',
            description: 'FOIA request received and logged in system',
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            actor: 'System',
            status: 'received'
          },
          {
            id: 'tl-2',
            event: 'Request Assigned',
            description: 'Request assigned to Sarah Chen for processing',
            timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            actor: 'Admin',
            status: 'processing'
          }
        ]
      },
      {
        id: 'req-2',
        type: 'Public Records',
        title: 'Property Tax Assessment Records',
        description: 'Request for property tax assessment records for 123 Main Street for years 2020-2024.',
        status: 'completed',
        priority: 'low',
        submittedBy: {
          name: 'Maria Garcia',
          email: 'maria.garcia@email.com',
          isVerified: true
        },
        submissionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        assignedTo: 'Mike Rodriguez',
        documents: [
          {
            id: 'doc-1',
            name: 'Property Assessment 2020-2024.pdf',
            type: 'PDF',
            size: 2456789,
            uploadDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            accessLevel: 'public'
          }
        ],
        timeline: [
          {
            id: 'tl-3',
            event: 'Request Completed',
            description: 'All requested documents provided to citizen',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            actor: 'Mike Rodriguez',
            status: 'completed'
          }
        ]
      }
    ];

    const mockAccessibilityChecks: AccessibilityCheck[] = [
      {
        id: 'acc-1',
        page: 'Home Page',
        url: '/',
        status: 'pass',
        score: 95,
        wcagLevel: 'AA',
        lastCheck: new Date(Date.now() - 2 * 60 * 60 * 1000),
        issues: [
          {
            id: 'issue-1',
            severity: 'low',
            type: 'Color Contrast',
            description: 'Link color contrast could be improved',
            element: '.footer a',
            suggestion: 'Increase color contrast ratio to at least 4.5:1'
          }
        ]
      },
      {
        id: 'acc-2',
        page: 'Services Page',
        url: '/services',
        status: 'warning',
        score: 87,
        wcagLevel: 'AA',
        lastCheck: new Date(Date.now() - 1 * 60 * 60 * 1000),
        issues: [
          {
            id: 'issue-2',
            severity: 'medium',
            type: 'Missing Alt Text',
            description: 'Images missing alternative text',
            element: 'img[src="/services-banner.jpg"]',
            suggestion: 'Add descriptive alt text to all images'
          }
        ]
      }
    ];

    const mockPublicRecords: PublicRecord[] = [
      {
        id: 'pr-1',
        title: '2024 Annual Budget Report',
        category: 'Budget & Finance',
        description: 'Comprehensive annual budget report including revenue, expenditures, and financial projections',
        createdDate: new Date('2024-01-15'),
        lastModified: new Date('2024-02-01'),
        accessLevel: 'public',
        retentionPeriod: 7,
        size: 15728640,
        format: 'PDF',
        downloads: 245,
        views: 1432
      },
      {
        id: 'pr-2',
        title: 'City Council Meeting Minutes - March 2024',
        category: 'Meeting Minutes',
        description: 'Official minutes from City Council meetings held in March 2024',
        createdDate: new Date('2024-03-01'),
        lastModified: new Date('2024-03-15'),
        accessLevel: 'public',
        retentionPeriod: 10,
        size: 5242880,
        format: 'PDF',
        downloads: 89,
        views: 567
      }
    ];

    setRegulations(mockRegulations);
    setCitizenRequests(mockCitizenRequests);
    setAccessibilityChecks(mockAccessibilityChecks);
    setPublicRecords(mockPublicRecords);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'completed':
      case 'met':
      case 'pass': return '#28a745';
      case 'non-compliant':
      case 'denied':
      case 'not-met':
      case 'fail': return '#dc3545';
      case 'pending':
      case 'processing':
      case 'partial':
      case 'warning': return '#ffc107';
      case 'review-required':
      case 'received': return '#007bff';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'completed':
      case 'met':
      case 'pass': return '✅';
      case 'non-compliant':
      case 'denied':
      case 'not-met':
      case 'fail': return '❌';
      case 'pending':
      case 'processing':
      case 'partial':
      case 'warning': return '⚠️';
      case 'review-required':
      case 'received': return '📋';
      default: return '❓';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return '#28a745';
      case 'medium': return '#ffc107';
      case 'high': return '#fd7e14';
      case 'critical': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const calculateDaysRemaining = (dueDate: Date) => {
    const days = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  return (
    <div style={{ padding: 16, background: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        padding: '16px 24px',
        background: 'white',
        borderRadius: 8,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, color: '#2c3e50' }}>
            🏛️ Government Compliance Center
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#6c757d' }}>
            FOIA, ADA, accessibility, and regulatory compliance management • {regulations.filter(r => r.status === 'compliant').length}/{regulations.length} compliant
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={{
              padding: '8px 16px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            📊 Run Compliance Check
          </button>
          <button
            style={{
              padding: '8px 16px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            📝 Generate Report
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        background: 'white',
        borderRadius: '8px 8px 0 0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: 0
      }}>
        {[
          { id: 'compliance', name: 'Compliance Dashboard', icon: '📊' },
          { id: 'foia', name: 'FOIA Requests', icon: '📋' },
          { id: 'accessibility', name: 'ADA Accessibility', icon: '♿' },
          { id: 'records', name: 'Public Records', icon: '📄' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '16px 24px',
              background: activeTab === tab.id ? '#007bff' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#6c757d',
              border: 'none',
              borderRadius: activeTab === tab.id ? '8px 8px 0 0' : 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
              fontWeight: 600
            }}
          >
            <span>{tab.icon}</span>
            {tab.name}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{
        background: 'white',
        borderRadius: '0 0 8px 8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: 24
      }}>
        {activeTab === 'compliance' && (
          <div>
            {/* Compliance Overview Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 16,
              marginBottom: 24
            }}>
              {regulations.map(regulation => (
                <div key={regulation.id} style={{
                  border: `2px solid ${getStatusColor(regulation.status)}`,
                  borderRadius: 8,
                  padding: 16,
                  background: `${getStatusColor(regulation.status)}08`
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12
                  }}>
                    <h3 style={{ margin: 0, fontSize: 16, color: '#2c3e50' }}>
                      {regulation.name}
                    </h3>
                    <div style={{
                      padding: '4px 8px',
                      background: getRiskColor(regulation.riskLevel),
                      color: 'white',
                      borderRadius: 12,
                      fontSize: 10,
                      fontWeight: 600
                    }}>
                      {regulation.riskLevel.toUpperCase()} RISK
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 12
                  }}>
                    <span style={{ fontSize: 16 }}>{getStatusIcon(regulation.status)}</span>
                    <span style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: getStatusColor(regulation.status)
                    }}>
                      {regulation.status.toUpperCase().replace('-', ' ')}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 12 }}>
                    Last Check: {regulation.lastCheck.toLocaleDateString()}
                  </div>

                  {/* Requirements Progress */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 4 }}>
                      Requirements Progress:
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: 4,
                      marginBottom: 4
                    }}>
                      {regulation.requirements.map(req => (
                        <div key={req.id} style={{
                          width: 16,
                          height: 4,
                          background: getStatusColor(req.status),
                          borderRadius: 2
                        }}></div>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: '#6c757d' }}>
                      {regulation.requirements.filter(r => r.status === 'met').length}/{regulation.requirements.length} requirements met
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Detailed Requirements */}
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: 18, color: '#2c3e50' }}>
                📋 Detailed Requirements Status
              </h3>
              {regulations.map(regulation => (
                <div key={regulation.id} style={{
                  marginBottom: 24,
                  border: '1px solid #dee2e6',
                  borderRadius: 8,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    padding: 16,
                    background: '#f8f9fa',
                    borderBottom: '1px solid #dee2e6'
                  }}>
                    <h4 style={{ margin: 0, fontSize: 16, color: '#2c3e50' }}>
                      {regulation.name} ({regulation.type})
                    </h4>
                  </div>

                  <div style={{ padding: 16 }}>
                    {regulation.requirements.map(req => (
                      <div key={req.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 12,
                        borderBottom: '1px solid #f8f9fa',
                        marginBottom: 8
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                            {req.description}
                          </div>
                          <div style={{ fontSize: 12, color: '#6c757d' }}>
                            Last Updated: {req.lastUpdated.toLocaleDateString()}
                          </div>
                          {req.evidence.length > 0 && (
                            <div style={{ marginTop: 4 }}>
                              <div style={{ fontSize: 11, color: '#6c757d', marginBottom: 2 }}>
                                Evidence:
                              </div>
                              {req.evidence.map(evidence => (
                                <span key={evidence} style={{
                                  display: 'inline-block',
                                  padding: '2px 6px',
                                  background: '#e9ecef',
                                  borderRadius: 10,
                                  fontSize: 10,
                                  marginRight: 4,
                                  marginBottom: 2
                                }}>
                                  📄 {evidence}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '6px 12px',
                          background: getStatusColor(req.status),
                          color: 'white',
                          borderRadius: 16,
                          fontSize: 12,
                          fontWeight: 600
                        }}>
                          <span>{getStatusIcon(req.status)}</span>
                          <span>{req.status.toUpperCase().replace('-', ' ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'foia' && (
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, color: '#2c3e50' }}>
              📋 FOIA & Citizen Requests
            </h3>

            {/* Request Summary Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 16,
              marginBottom: 24
            }}>
              <div style={{
                padding: 16,
                background: '#007bff08',
                border: '2px solid #007bff',
                borderRadius: 8,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#007bff' }}>
                  {citizenRequests.length}
                </div>
                <div style={{ fontSize: 12, color: '#6c757d' }}>Total Requests</div>
              </div>
              <div style={{
                padding: 16,
                background: '#ffc10708',
                border: '2px solid #ffc107',
                borderRadius: 8,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#ffc107' }}>
                  {citizenRequests.filter(r => r.status === 'processing').length}
                </div>
                <div style={{ fontSize: 12, color: '#6c757d' }}>Processing</div>
              </div>
              <div style={{
                padding: 16,
                background: '#28a74508',
                border: '2px solid #28a745',
                borderRadius: 8,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#28a745' }}>
                  {citizenRequests.filter(r => r.status === 'completed').length}
                </div>
                <div style={{ fontSize: 12, color: '#6c757d' }}>Completed</div>
              </div>
            </div>

            {/* Requests List */}
            <div style={{ display: 'grid', gap: 16 }}>
              {citizenRequests.map(request => (
                <div key={request.id} style={{
                  border: `2px solid ${getStatusColor(request.status)}`,
                  borderRadius: 8,
                  padding: 16,
                  background: `${getStatusColor(request.status)}08`
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12
                  }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 16, color: '#2c3e50' }}>
                        {request.title}
                      </h4>
                      <div style={{ display: 'flex', gap: 16, marginTop: 4, fontSize: 12, color: '#6c757d' }}>
                        <span><strong>Type:</strong> {request.type}</span>
                        <span><strong>Submitted:</strong> {request.submissionDate.toLocaleDateString()}</span>
                        <span><strong>Due:</strong> {request.dueDate.toLocaleDateString()}</span>
                        {request.assignedTo && <span><strong>Assigned:</strong> {request.assignedTo}</span>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        padding: '4px 8px',
                        background: getStatusColor(request.priority),
                        color: 'white',
                        borderRadius: 12,
                        fontSize: 10,
                        fontWeight: 600
                      }}>
                        {request.priority.toUpperCase()}
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '6px 12px',
                        background: getStatusColor(request.status),
                        color: 'white',
                        borderRadius: 16,
                        fontSize: 12,
                        fontWeight: 600
                      }}>
                        <span>{getStatusIcon(request.status)}</span>
                        <span>{request.status.toUpperCase().replace('-', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  <p style={{ margin: '0 0 12px 0', fontSize: 14, color: '#6c757d' }}>
                    {request.description}
                  </p>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 16,
                    marginTop: 12
                  }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                        Submitted By:
                      </div>
                      <div style={{ fontSize: 12, color: '#6c757d' }}>
                        {request.submittedBy.name}<br />
                        {request.submittedBy.email}<br />
                        {request.submittedBy.phone}
                        {request.submittedBy.isVerified && (
                          <span style={{
                            marginLeft: 8,
                            padding: '2px 6px',
                            background: '#28a745',
                            color: 'white',
                            borderRadius: 10,
                            fontSize: 10
                          }}>
                            ✓ Verified
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                        Progress:
                      </div>
                      <div style={{ fontSize: 12, color: '#6c757d' }}>
                        Days remaining: <strong>{calculateDaysRemaining(request.dueDate)}</strong><br />
                        Documents: <strong>{request.documents.length}</strong><br />
                        Timeline events: <strong>{request.timeline.length}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'accessibility' && (
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, color: '#2c3e50' }}>
              ♿ ADA Accessibility Compliance
            </h3>

            {/* Accessibility Score Overview */}
            <div style={{
              padding: 24,
              background: '#f8f9fa',
              borderRadius: 8,
              marginBottom: 24,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 48, fontWeight: 600, color: '#28a745', marginBottom: 8 }}>
                {Math.round(accessibilityChecks.reduce((acc, check) => acc + check.score, 0) / accessibilityChecks.length)}
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                Overall Accessibility Score
              </div>
              <div style={{ fontSize: 14, color: '#6c757d' }}>
                WCAG 2.1 AA Compliance • Last updated: {new Date().toLocaleDateString()}
              </div>
            </div>

            {/* Page-by-Page Results */}
            <div style={{ display: 'grid', gap: 16 }}>
              {accessibilityChecks.map(check => (
                <div key={check.id} style={{
                  border: `2px solid ${getStatusColor(check.status)}`,
                  borderRadius: 8,
                  padding: 16,
                  background: `${getStatusColor(check.status)}08`
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12
                  }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 16, color: '#2c3e50' }}>
                        {check.page}
                      </h4>
                      <div style={{ fontSize: 12, color: '#6c757d', marginTop: 4 }}>
                        {check.url} • Last checked: {check.lastCheck.toLocaleString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 24, fontWeight: 600, color: getStatusColor(check.status) }}>
                          {check.score}
                        </div>
                        <div style={{ fontSize: 10, color: '#6c757d' }}>Score</div>
                      </div>
                      <div style={{
                        padding: '6px 12px',
                        background: getStatusColor(check.status),
                        color: 'white',
                        borderRadius: 16,
                        fontSize: 12,
                        fontWeight: 600
                      }}>
                        WCAG {check.wcagLevel}
                      </div>
                    </div>
                  </div>

                  {check.issues.length > 0 && (
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                        Issues Found ({check.issues.length}):
                      </div>
                      {check.issues.map(issue => (
                        <div key={issue.id} style={{
                          padding: 12,
                          background: 'white',
                          borderRadius: 6,
                          marginBottom: 8,
                          borderLeft: `4px solid ${getStatusColor(issue.severity)}`
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 4
                          }}>
                            <strong style={{ fontSize: 14 }}>{issue.type}</strong>
                            <span style={{
                              padding: '2px 8px',
                              background: getStatusColor(issue.severity),
                              color: 'white',
                              borderRadius: 10,
                              fontSize: 10,
                              fontWeight: 600
                            }}>
                              {issue.severity.toUpperCase()}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 4 }}>
                            {issue.description}
                          </div>
                          <div style={{ fontSize: 11, color: '#6c757d', fontFamily: 'monospace', marginBottom: 4 }}>
                            Element: {issue.element}
                          </div>
                          <div style={{ fontSize: 12, color: '#007bff' }}>
                            💡 {issue.suggestion}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'records' && (
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, color: '#2c3e50' }}>
              📄 Public Records Management
            </h3>

            {/* Records Statistics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
              marginBottom: 24
            }}>
              <div style={{
                padding: 16,
                background: '#007bff08',
                border: '2px solid #007bff',
                borderRadius: 8,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#007bff' }}>
                  {publicRecords.length}
                </div>
                <div style={{ fontSize: 12, color: '#6c757d' }}>Total Records</div>
              </div>
              <div style={{
                padding: 16,
                background: '#28a74508',
                border: '2px solid #28a745',
                borderRadius: 8,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#28a745' }}>
                  {publicRecords.filter(r => r.accessLevel === 'public').length}
                </div>
                <div style={{ fontSize: 12, color: '#6c757d' }}>Public Access</div>
              </div>
              <div style={{
                padding: 16,
                background: '#17a2b808',
                border: '2px solid #17a2b8',
                borderRadius: 8,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#17a2b8' }}>
                  {publicRecords.reduce((acc, r) => acc + r.downloads, 0).toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: '#6c757d' }}>Total Downloads</div>
              </div>
            </div>

            {/* Records List */}
            <div style={{ display: 'grid', gap: 16 }}>
              {publicRecords.map(record => (
                <div key={record.id} style={{
                  border: '2px solid #dee2e6',
                  borderRadius: 8,
                  padding: 16,
                  background: 'white'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12
                  }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 16, color: '#2c3e50' }}>
                        {record.title}
                      </h4>
                      <div style={{ fontSize: 12, color: '#6c757d', marginTop: 4 }}>
                        Category: <strong>{record.category}</strong> • 
                        Format: <strong>{record.format}</strong> • 
                        Size: <strong>{formatFileSize(record.size)}</strong>
                      </div>
                    </div>

                    <div style={{
                      padding: '6px 12px',
                      background: record.accessLevel === 'public' ? '#28a745' : '#ffc107',
                      color: 'white',
                      borderRadius: 16,
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      {record.accessLevel.toUpperCase()}
                    </div>
                  </div>

                  <p style={{ margin: '0 0 12px 0', fontSize: 14, color: '#6c757d' }}>
                    {record.description}
                  </p>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: 16,
                    marginTop: 12
                  }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#6c757d' }}>Created</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>
                        {record.createdDate.toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#6c757d' }}>Last Modified</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>
                        {record.lastModified.toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#6c757d' }}>Retention</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>
                        {record.retentionPeriod} years
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#6c757d' }}>Downloads</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>
                        {record.downloads.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#6c757d' }}>Views</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>
                        {record.views.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}