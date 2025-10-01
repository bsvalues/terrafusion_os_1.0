import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, Plus, Search, Filter, AlertCircle, CheckCircle } from 'lucide-react';

interface CourtHearing {
  id: string;
  case_id: string;
  hearing_type: string;
  scheduled_date: string;
  duration_minutes: number;
  courtroom: string;
  judge: string;
  status: string;
  participants: string[];
  documents_required: string[];
}

interface HearingsData {
  hearings: CourtHearing[];
  scheduled_count: number;
}

const getHearingTypeColor = (type: string) => {
  switch (type) {
    case 'trial': return '#dc2626';
    case 'motion': return '#1e40af';
    case 'arraignment': return '#059669';
    case 'sentencing': return '#7c2d12';
    case 'conference': return '#0891b2';
    case 'appeal': return '#7c3aed';
    default: return '#64748b';
  }
};

const formatHearingType = (type: string) => {
  return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const CourtCalendar: React.FC = () => {
  const [hearingsData, setHearingsData] = useState<HearingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterCourtroom, setFilterCourtroom] = useState('all');
  const [selectedHearing, setSelectedHearing] = useState<CourtHearing | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const fetchHearings = async () => {
      try {
        const response = await fetch('http://localhost:\${{TF_PORT_5290:-5290}}/api/legal/hearings');
        if (!response.ok) {
          throw new Error('Failed to fetch hearings');
        }
        const data = await response.json();
        setHearingsData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchHearings();
    const interval = setInterval(fetchHearings, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredHearings = hearingsData?.hearings.filter(hearing => {
    const matchesSearch = 
      hearing.case_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hearing.judge.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hearing.courtroom.toLowerCase().includes(searchTerm.toLowerCase());
    
    const hearingDate = new Date(hearing.scheduled_date).toDateString();
    const matchesDate = !filterDate || hearingDate === new Date(filterDate).toDateString();
    
    const matchesCourtroom = filterCourtroom === 'all' || hearing.courtroom === filterCourtroom;
    
    return matchesSearch && matchesDate && matchesCourtroom;
  }) || [];

  // Group hearings by date
  const hearingsByDate = filteredHearings.reduce((acc, hearing) => {
    const date = new Date(hearing.scheduled_date).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(hearing);
    return acc;
  }, {} as { [key: string]: CourtHearing[] });

  // Get unique courtrooms for filter
  const courtrooms = Array.from(new Set(hearingsData?.hearings.map(h => h.courtroom) || []));

  if (loading) {
    return (
      <div className="calendar-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading court calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="calendar-container">
        <div className="error-state">
          <AlertCircle size={48} />
          <h3>Error Loading Calendar</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-container">
      {/* Header */}
      <div className="calendar-header">
        <div className="header-content">
          <Calendar size={28} />
          <div>
            <h1>Court Calendar</h1>
            <p>Comprehensive hearing schedule and courtroom management</p>
          </div>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-number">{hearingsData?.hearings.length || 0}</span>
            <span className="stat-label">Total Hearings</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{hearingsData?.scheduled_count || 0}</span>
            <span className="stat-label">Scheduled</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="calendar-controls">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by case ID, judge, or courtroom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-controls">
          <div className="filter-group">
            <Calendar size={16} />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <Filter size={16} />
            <select value={filterCourtroom} onChange={(e) => setFilterCourtroom(e.target.value)}>
              <option value="all">All Courtrooms</option>
              {courtrooms.map(room => (
                <option key={room} value={room}>{room}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="calendar-content">
        {Object.keys(hearingsByDate).length === 0 ? (
          <div className="empty-state">
            <Calendar size={48} />
            <h3>No Hearings Scheduled</h3>
            <p>No hearings match your current search and filter criteria.</p>
          </div>
        ) : (
          Object.entries(hearingsByDate)
            .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
            .map(([date, hearings]) => (
              <div key={date} className="calendar-day">
                <div className="day-header">
                  <h3>{new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</h3>
                  <span className="hearings-count">{hearings.length} hearings</span>
                </div>
                
                <div className="hearings-timeline">
                  {hearings
                    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
                    .map(hearing => (
                      <div key={hearing.id} className="hearing-card">
                        <div className="hearing-time">
                          <Clock size={16} />
                          <span>
                            {new Date(hearing.scheduled_date).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span className="duration">
                            ({hearing.duration_minutes} min)
                          </span>
                        </div>
                        
                        <div className="hearing-content">
                          <div className="hearing-header">
                            <div 
                              className="hearing-type"
                              style={{ backgroundColor: getHearingTypeColor(hearing.hearing_type) }}
                            >
                              {formatHearingType(hearing.hearing_type)}
                            </div>
                            <div className="case-id">Case: {hearing.case_id}</div>
                          </div>
                          
                          <div className="hearing-details">
                            <div className="detail-row">
                              <MapPin size={14} />
                              <span>{hearing.courtroom}</span>
                            </div>
                            <div className="detail-row">
                              <User size={14} />
                              <span>{hearing.judge}</span>
                            </div>
                          </div>
                          
                          <div className="hearing-participants">
                            <span className="participants-label">Participants:</span>
                            <span className="participants-list">
                              {hearing.participants.join(', ')}
                            </span>
                          </div>
                          
                          <div className="hearing-footer">
                            <div className="status-badge" data-status={hearing.status}>
                              {hearing.status === 'scheduled' ? (
                                <CheckCircle size={14} />
                              ) : (
                                <Clock size={14} />
                              )}
                              {hearing.status.toUpperCase()}
                            </div>
                            <button 
                              className="view-button"
                              onClick={() => setSelectedHearing(hearing)}
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))
        )}
      </div>

      {/* Hearing Detail Modal */}
      {selectedHearing && (
        <div className="modal-overlay" onClick={() => setSelectedHearing(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Hearing Details</h2>
              <button onClick={() => setSelectedHearing(null)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="detail-section">
                <h4>Hearing Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Case ID:</label>
                    <span>{selectedHearing.case_id}</span>
                  </div>
                  <div className="detail-item">
                    <label>Hearing Type:</label>
                    <span style={{ color: getHearingTypeColor(selectedHearing.hearing_type) }}>
                      {formatHearingType(selectedHearing.hearing_type)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Scheduled Date:</label>
                    <span>
                      {new Date(selectedHearing.scheduled_date).toLocaleString()}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Duration:</label>
                    <span>{selectedHearing.duration_minutes} minutes</span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h4>Location & Personnel</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Courtroom:</label>
                    <span>{selectedHearing.courtroom}</span>
                  </div>
                  <div className="detail-item">
                    <label>Judge:</label>
                    <span>{selectedHearing.judge}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status:</label>
                    <span>{selectedHearing.status.toUpperCase()}</span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h4>Participants</h4>
                <ul className="participants-list">
                  {selectedHearing.participants.map((participant, index) => (
                    <li key={index}>{participant}</li>
                  ))}
                </ul>
              </div>
              
              <div className="detail-section">
                <h4>Required Documents</h4>
                <ul className="documents-list">
                  {selectedHearing.documents_required.map((document, index) => (
                    <li key={index}>{document}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourtCalendar;