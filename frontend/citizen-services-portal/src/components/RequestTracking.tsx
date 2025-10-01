import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  User, 
  MessageSquare,
  Download,
  Eye,
  RefreshCw,
  Star,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Upload,
  Paperclip,
  ExternalLink,
  Bell
} from 'lucide-react';

interface ServiceRequest {
  id: string;
  serviceType: string;
  citizen: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  status: 'Submitted' | 'Document Review' | 'Processing' | 'Quality Check' | 'Completed' | 'On Hold' | 'Cancelled';
  priority: 'High' | 'Standard' | 'Low' | 'Urgent';
  submittedDate: string;
  lastUpdated: string;
  estimatedCompletion: string;
  progress: number;
  assignedTo: string;
  fee: string;
  paymentStatus: 'Paid' | 'Pending' | 'Not Required' | 'Overdue';
  documents: {
    name: string;
    status: 'Uploaded' | 'Required' | 'Under Review' | 'Approved' | 'Rejected';
    uploadDate?: string;
  }[];
  statusHistory: {
    status: string;
    timestamp: string;
    notes: string;
    updatedBy: string;
  }[];
  notes: string[];
  contactLog: {
    date: string;
    type: 'Phone' | 'Email' | 'In-Person' | 'System';
    summary: string;
    staff: string;
  }[];
}

const RequestTracking: React.FC = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const sampleRequests: ServiceRequest[] = [
    {
      id: 'REQ-2025-84739',
      serviceType: 'Business License Application',
      citizen: {
        name: 'Sarah Chen',
        email: 'sarah.chen@email.com',
        phone: '(555) 123-4567',
        address: '123 Main St, Benton City, WA 99320'
      },
      status: 'Processing',
      priority: 'High',
      submittedDate: '2025-01-15',
      lastUpdated: '2025-01-16',
      estimatedCompletion: '2025-01-17',
      progress: 75,
      assignedTo: 'Agent Martinez',
      fee: '$150.00',
      paymentStatus: 'Paid',
      documents: [
        { name: 'Business Plan', status: 'Approved', uploadDate: '2025-01-15' },
        { name: 'EIN Letter', status: 'Approved', uploadDate: '2025-01-15' },
        { name: 'Lease Agreement', status: 'Under Review', uploadDate: '2025-01-16' },
        { name: 'Insurance Certificate', status: 'Required' }
      ],
      statusHistory: [
        {
          status: 'Submitted',
          timestamp: '2025-01-15T09:30:00Z',
          notes: 'Application received and assigned tracking number',
          updatedBy: 'System'
        },
        {
          status: 'Document Review',
          timestamp: '2025-01-15T14:20:00Z',
          notes: 'Initial document verification completed',
          updatedBy: 'Agent Wilson'
        },
        {
          status: 'Processing',
          timestamp: '2025-01-16T10:15:00Z',
          notes: 'Application under active processing, waiting for insurance certificate',
          updatedBy: 'Agent Martinez'
        }
      ],
      notes: [
        'Application for restaurant license',
        'Location: Downtown Benton City',
        'Previous license holder at different location'
      ],
      contactLog: [
        {
          date: '2025-01-16',
          type: 'Phone',
          summary: 'Called regarding missing insurance certificate',
          staff: 'Agent Martinez'
        },
        {
          date: '2025-01-15',
          type: 'Email',
          summary: 'Welcome email sent with tracking information',
          staff: 'System'
        }
      ]
    },
    {
      id: 'REQ-2025-84738',
      serviceType: 'Birth Certificate Request',
      citizen: {
        name: 'Michael Rodriguez',
        email: 'mrodriguez@email.com',
        phone: '(555) 987-6543',
        address: '456 Oak Ave, Richland, WA 99352'
      },
      status: 'Completed',
      priority: 'Standard',
      submittedDate: '2025-01-14',
      lastUpdated: '2025-01-15',
      estimatedCompletion: '2025-01-15',
      progress: 100,
      assignedTo: 'Agent Davis',
      fee: '$25.00',
      paymentStatus: 'Paid',
      documents: [
        { name: 'ID Copy', status: 'Approved', uploadDate: '2025-01-14' },
        { name: 'Application Form', status: 'Approved', uploadDate: '2025-01-14' }
      ],
      statusHistory: [
        {
          status: 'Submitted',
          timestamp: '2025-01-14T11:00:00Z',
          notes: 'Birth certificate request received',
          updatedBy: 'System'
        },
        {
          status: 'Processing',
          timestamp: '2025-01-14T13:30:00Z',
          notes: 'Record located and verified',
          updatedBy: 'Agent Davis'
        },
        {
          status: 'Completed',
          timestamp: '2025-01-15T09:45:00Z',
          notes: 'Certificate printed and mailed',
          updatedBy: 'Agent Davis'
        }
      ],
      notes: [
        'Request for own birth certificate',
        'Born at Kadlec Medical Center',
        'Rush delivery requested'
      ],
      contactLog: [
        {
          date: '2025-01-15',
          type: 'Email',
          summary: 'Completion notification sent with tracking number',
          staff: 'System'
        }
      ]
    },
    {
      id: 'REQ-2025-84737',
      serviceType: 'Property Tax Payment',
      citizen: {
        name: 'Jennifer Wilson',
        email: 'jwilson@email.com',
        phone: '(555) 456-7890',
        address: '789 Pine Rd, Kennewick, WA 99336'
      },
      status: 'Completed',
      priority: 'Standard',
      submittedDate: '2025-01-14',
      lastUpdated: '2025-01-14',
      estimatedCompletion: '2025-01-14',
      progress: 100,
      assignedTo: 'System',
      fee: '$2,847.50',
      paymentStatus: 'Paid',
      documents: [],
      statusHistory: [
        {
          status: 'Submitted',
          timestamp: '2025-01-14T16:20:00Z',
          notes: 'Online payment initiated',
          updatedBy: 'System'
        },
        {
          status: 'Completed',
          timestamp: '2025-01-14T16:22:00Z',
          notes: 'Payment processed successfully',
          updatedBy: 'System'
        }
      ],
      notes: [
        'Annual property tax payment',
        'Parcel ID: 123456789',
        'Paid via online portal'
      ],
      contactLog: [
        {
          date: '2025-01-14',
          type: 'Email',
          summary: 'Payment confirmation and receipt sent',
          staff: 'System'
        }
      ]
    },
    {
      id: 'REQ-2025-84736',
      serviceType: 'Parking Permit',
      citizen: {
        name: 'David Thompson',
        email: 'dthompson@email.com',
        phone: '(555) 321-9876',
        address: '321 Elm St, West Richland, WA 99353'
      },
      status: 'Document Review',
      priority: 'Low',
      submittedDate: '2025-01-13',
      lastUpdated: '2025-01-14',
      estimatedCompletion: '2025-01-16',
      progress: 40,
      assignedTo: 'Agent Johnson',
      fee: '$50.00',
      paymentStatus: 'Pending',
      documents: [
        { name: 'Driver License', status: 'Approved', uploadDate: '2025-01-13' },
        { name: 'Vehicle Registration', status: 'Under Review', uploadDate: '2025-01-13' },
        { name: 'Proof of Residency', status: 'Required' }
      ],
      statusHistory: [
        {
          status: 'Submitted',
          timestamp: '2025-01-13T14:45:00Z',
          notes: 'Parking permit application received',
          updatedBy: 'System'
        },
        {
          status: 'Document Review',
          timestamp: '2025-01-14T09:30:00Z',
          notes: 'Reviewing submitted documents, proof of residency needed',
          updatedBy: 'Agent Johnson'
        }
      ],
      notes: [
        'Residential parking permit for Zone C',
        'First-time applicant',
        'Vehicle: 2019 Honda Civic'
      ],
      contactLog: [
        {
          date: '2025-01-14',
          type: 'Email',
          summary: 'Requested additional documentation',
          staff: 'Agent Johnson'
        }
      ]
    }
  ];

  useEffect(() => {
    setRequests(sampleRequests);
  }, []);

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.citizen.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'Processing': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Document Review': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Quality Check': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'On Hold': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Cancelled': return 'text-red-600 bg-red-50 border-red-200';
      case 'Submitted': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'text-red-700 bg-red-100 border-red-300';
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      case 'Standard': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Low': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'text-green-600 bg-green-50';
      case 'Pending': return 'text-yellow-600 bg-yellow-50';
      case 'Overdue': return 'text-red-600 bg-red-50';
      case 'Not Required': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'text-green-600 bg-green-50';
      case 'Under Review': return 'text-yellow-600 bg-yellow-50';
      case 'Rejected': return 'text-red-600 bg-red-50';
      case 'Required': return 'text-blue-600 bg-blue-50';
      case 'Uploaded': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleViewDetails = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setShowDetails(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="request-tracking">
      {/* Header */}
      <div className="tracking-header">
        <div className="header-content">
          <h1>Service Request Tracking</h1>
          <p>Monitor and manage citizen service requests</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn-secondary">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="tracking-filters">
        <div className="search-container">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by request ID, service type, or citizen name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Document Review">Document Review</option>
            <option value="Processing">Processing</option>
            <option value="Quality Check">Quality Check</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Standard">Standard</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="requests-section">
        <div className="section-header">
          <h2>Service Requests</h2>
          <div className="results-count">
            {filteredRequests.length} requests found
          </div>
        </div>

        <div className="table-container">
          <table className="requests-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Service Type</th>
                <th>Citizen</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Progress</th>
                <th>Submitted</th>
                <th>Est. Completion</th>
                <th>Assigned To</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request.id}>
                  <td className="request-id">{request.id}</td>
                  <td className="service-type">{request.serviceType}</td>
                  <td className="citizen-info">
                    <div className="citizen-name">{request.citizen.name}</div>
                    <div className="citizen-contact">{request.citizen.email}</div>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td>
                    <span className={`priority-badge ${getPriorityColor(request.priority)}`}>
                      {request.priority}
                    </span>
                  </td>
                  <td>
                    <div className="progress-container">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${request.progress}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">{request.progress}%</span>
                    </div>
                  </td>
                  <td className="date">{formatDate(request.submittedDate)}</td>
                  <td className="date">{formatDate(request.estimatedCompletion)}</td>
                  <td className="assigned-to">{request.assignedTo}</td>
                  <td>
                    <div className="payment-info">
                      <div className="fee">{request.fee}</div>
                      <span className={`payment-status ${getPaymentStatusColor(request.paymentStatus)}`}>
                        {request.paymentStatus}
                      </span>
                    </div>
                  </td>
                  <td className="actions">
                    <button 
                      className="btn-icon" 
                      title="View Details"
                      onClick={() => handleViewDetails(request)}
                    >
                      <Eye size={14} />
                    </button>
                    <button className="btn-icon" title="Contact Citizen">
                      <MessageSquare size={14} />
                    </button>
                    <button className="btn-icon" title="Download Documents">
                      <Download size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Details Modal */}
      {showDetails && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Request Details: {selectedRequest.id}</h2>
              <button 
                className="modal-close"
                onClick={() => setShowDetails(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="details-grid">
                {/* Basic Information */}
                <div className="detail-section">
                  <h3>Basic Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Service Type:</label>
                      <span>{selectedRequest.serviceType}</span>
                    </div>
                    <div className="detail-item">
                      <label>Status:</label>
                      <span className={`status-badge ${getStatusColor(selectedRequest.status)}`}>
                        {selectedRequest.status}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Priority:</label>
                      <span className={`priority-badge ${getPriorityColor(selectedRequest.priority)}`}>
                        {selectedRequest.priority}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Progress:</label>
                      <div className="progress-container">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${selectedRequest.progress}%` }}
                          ></div>
                        </div>
                        <span>{selectedRequest.progress}%</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <label>Assigned To:</label>
                      <span>{selectedRequest.assignedTo}</span>
                    </div>
                    <div className="detail-item">
                      <label>Fee:</label>
                      <span>{selectedRequest.fee}</span>
                    </div>
                    <div className="detail-item">
                      <label>Payment Status:</label>
                      <span className={`payment-status ${getPaymentStatusColor(selectedRequest.paymentStatus)}`}>
                        {selectedRequest.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Citizen Information */}
                <div className="detail-section">
                  <h3>Citizen Information</h3>
                  <div className="citizen-details">
                    <div className="detail-item">
                      <User size={16} />
                      <span>{selectedRequest.citizen.name}</span>
                    </div>
                    <div className="detail-item">
                      <Mail size={16} />
                      <span>{selectedRequest.citizen.email}</span>
                    </div>
                    <div className="detail-item">
                      <Phone size={16} />
                      <span>{selectedRequest.citizen.phone}</span>
                    </div>
                    <div className="detail-item">
                      <MapPin size={16} />
                      <span>{selectedRequest.citizen.address}</span>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="detail-section">
                  <h3>Documents</h3>
                  <div className="documents-list">
                    {selectedRequest.documents.map((doc, index) => (
                      <div key={index} className="document-item">
                        <div className="document-info">
                          <Paperclip size={16} />
                          <span className="document-name">{doc.name}</span>
                        </div>
                        <div className="document-meta">
                          <span className={`document-status ${getDocumentStatusColor(doc.status)}`}>
                            {doc.status}
                          </span>
                          {doc.uploadDate && (
                            <span className="upload-date">{formatDate(doc.uploadDate)}</span>
                          )}
                        </div>
                        <div className="document-actions">
                          <button className="btn-icon" title="View Document">
                            <Eye size={14} />
                          </button>
                          <button className="btn-icon" title="Download">
                            <Download size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status History */}
                <div className="detail-section full-width">
                  <h3>Status History</h3>
                  <div className="status-timeline">
                    {selectedRequest.statusHistory.map((entry, index) => (
                      <div key={index} className="timeline-item">
                        <div className="timeline-marker"></div>
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <span className="timeline-status">{entry.status}</span>
                            <span className="timeline-date">{formatDateTime(entry.timestamp)}</span>
                          </div>
                          <div className="timeline-notes">{entry.notes}</div>
                          <div className="timeline-author">Updated by: {entry.updatedBy}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact Log */}
                <div className="detail-section full-width">
                  <h3>Contact Log</h3>
                  <div className="contact-log">
                    {selectedRequest.contactLog.map((contact, index) => (
                      <div key={index} className="contact-item">
                        <div className="contact-header">
                          <div className="contact-type">
                            {contact.type === 'Phone' && <Phone size={16} />}
                            {contact.type === 'Email' && <Mail size={16} />}
                            {contact.type === 'In-Person' && <User size={16} />}
                            {contact.type === 'System' && <Bell size={16} />}
                            <span>{contact.type}</span>
                          </div>
                          <span className="contact-date">{formatDate(contact.date)}</span>
                        </div>
                        <div className="contact-summary">{contact.summary}</div>
                        <div className="contact-staff">By: {contact.staff}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDetails(false)}>
                Close
              </button>
              <button className="btn-primary">
                <MessageSquare size={16} />
                Contact Citizen
              </button>
              <button className="btn-primary">
                <Upload size={16} />
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestTracking;