import React, { useState, useEffect } from 'react';
import { User, Star, Calendar, BookOpen, MapPin, AlertCircle, Users, Clock, Award, CheckCircle } from 'lucide-react';

interface Judge {
  id: string;
  name: string;
  court_type: string;
  years_experience: number;
  specializations: string[];
  availability: { [day: string]: string[] };
  current_caseload: number;
  max_caseload: number;
}

interface JudgesData {
  judges: Judge[];
  total_judges: number;
  available_judges: number;
}

const getCourtTypeColor = (type: string) => {
  switch (type) {
    case 'superior': return '#1e40af';
    case 'district': return '#059669';
    case 'municipal': return '#d97706';
    case 'juvenile': return '#7c3aed';
    default: return '#64748b';
  }
};

const getWorkloadStatus = (current: number, max: number) => {
  const percentage = (current / max) * 100;
  if (percentage < 70) return { status: 'low', color: '#16a34a', label: 'Available' };
  if (percentage < 90) return { status: 'medium', color: '#d97706', label: 'Busy' };
  return { status: 'high', color: '#dc2626', label: 'Full' };
};

const formatSpecialization = (spec: string) => {
  return spec.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const JudgeManagement: React.FC = () => {
  const [judgesData, setJudgesData] = useState<JudgesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJudge, setSelectedJudge] = useState<Judge | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourt, setFilterCourt] = useState('all');
  const [filterAvailability, setFilterAvailability] = useState('all');

  useEffect(() => {
    const fetchJudges = async () => {
      try {
        const response = await fetch('http://localhost:\${{TF_PORT_5290:-5290}}/api/legal/judges');
        if (!response.ok) {
          throw new Error('Failed to fetch judges');
        }
        const data = await response.json();
        setJudgesData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchJudges();
    const interval = setInterval(fetchJudges, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredJudges = judgesData?.judges.filter(judge => {
    const matchesSearch = judge.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourt = filterCourt === 'all' || judge.court_type === filterCourt;
    
    let matchesAvailability = true;
    if (filterAvailability === 'available') {
      matchesAvailability = judge.current_caseload < judge.max_caseload;
    } else if (filterAvailability === 'busy') {
      const percentage = (judge.current_caseload / judge.max_caseload) * 100;
      matchesAvailability = percentage >= 70 && percentage < 90;
    } else if (filterAvailability === 'full') {
      matchesAvailability = judge.current_caseload >= judge.max_caseload;
    }
    
    return matchesSearch && matchesCourt && matchesAvailability;
  }) || [];

  const getCurrentDayAvailability = (judge: Judge) => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    return judge.availability[today] || [];
  };

  if (loading) {
    return (
      <div className="judges-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading judicial personnel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="judges-container">
        <div className="error-state">
          <AlertCircle size={48} />
          <h3>Error Loading Judges</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="judges-container">
      {/* Header */}
      <div className="judges-header">
        <div className="header-content">
          <Users size={28} />
          <div>
            <h1>Judicial Personnel</h1>
            <p>Judge assignments, availability, and caseload management</p>
          </div>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-number">{judgesData?.total_judges || 0}</span>
            <span className="stat-label">Total Judges</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{judgesData?.available_judges || 0}</span>
            <span className="stat-label">Available</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="judges-controls">
        <div className="search-bar">
          <User size={20} />
          <input
            type="text"
            placeholder="Search judges by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-controls">
          <div className="filter-group">
            <select value={filterCourt} onChange={(e) => setFilterCourt(e.target.value)}>
              <option value="all">All Courts</option>
              <option value="superior">Superior Court</option>
              <option value="district">District Court</option>
              <option value="municipal">Municipal Court</option>
              <option value="juvenile">Juvenile Court</option>
            </select>
          </div>
          
          <div className="filter-group">
            <select value={filterAvailability} onChange={(e) => setFilterAvailability(e.target.value)}>
              <option value="all">All Availability</option>
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="full">Full Caseload</option>
            </select>
          </div>
        </div>
      </div>

      {/* Judges Grid */}
      <div className="judges-grid">
        {filteredJudges.map((judge) => {
          const workload = getWorkloadStatus(judge.current_caseload, judge.max_caseload);
          const todaySchedule = getCurrentDayAvailability(judge);
          
          return (
            <div key={judge.id} className="judge-card">
              <div className="judge-header">
                <div className="judge-avatar">
                  <User size={24} />
                </div>
                <div className="judge-info">
                  <h3>{judge.name}</h3>
                  <div 
                    className="court-type"
                    style={{ color: getCourtTypeColor(judge.court_type) }}
                  >
                    {judge.court_type.replace('_', ' ').toUpperCase()} COURT
                  </div>
                </div>
                <div className="workload-indicator">
                  <div 
                    className="workload-badge"
                    style={{ backgroundColor: workload.color }}
                  >
                    {workload.label}
                  </div>
                </div>
              </div>
              
              <div className="judge-experience">
                <Award size={16} />
                <span>{judge.years_experience} years experience</span>
              </div>
              
              <div className="judge-caseload">
                <div className="caseload-header">
                  <span>Current Caseload</span>
                  <span>{judge.current_caseload}/{judge.max_caseload}</span>
                </div>
                <div className="caseload-bar">
                  <div 
                    className="caseload-fill"
                    style={{ 
                      width: `${(judge.current_caseload / judge.max_caseload) * 100}%`,
                      backgroundColor: workload.color
                    }}
                  ></div>
                </div>
              </div>
              
              <div className="judge-specializations">
                <h4>Specializations</h4>
                <div className="specializations-list">
                  {judge.specializations.slice(0, 3).map((spec, index) => (
                    <span key={index} className="specialization-tag">
                      {formatSpecialization(spec)}
                    </span>
                  ))}
                  {judge.specializations.length > 3 && (
                    <span className="more-specs">+{judge.specializations.length - 3} more</span>
                  )}
                </div>
              </div>
              
              <div className="judge-availability">
                <div className="availability-header">
                  <Clock size={16} />
                  <span>Today's Schedule</span>
                </div>
                {todaySchedule.length > 0 ? (
                  <div className="schedule-times">
                    {todaySchedule.map((time, index) => (
                      <span key={index} className="time-slot">{time}</span>
                    ))}
                  </div>
                ) : (
                  <div className="no-schedule">No schedule today</div>
                )}
              </div>
              
              <div className="judge-actions">
                <button 
                  className="view-details-btn"
                  onClick={() => setSelectedJudge(judge)}
                >
                  View Full Profile
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredJudges.length === 0 && (
        <div className="empty-state">
          <Users size={48} />
          <h3>No Judges Found</h3>
          <p>No judges match your current search and filter criteria.</p>
        </div>
      )}

      {/* Judge Detail Modal */}
      {selectedJudge && (
        <div className="modal-overlay" onClick={() => setSelectedJudge(null)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedJudge.name} - Judicial Profile</h2>
              <button onClick={() => setSelectedJudge(null)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="profile-overview">
                <div className="profile-avatar">
                  <User size={48} />
                </div>
                <div className="profile-info">
                  <h3>{selectedJudge.name}</h3>
                  <div 
                    className="court-designation"
                    style={{ color: getCourtTypeColor(selectedJudge.court_type) }}
                  >
                    {selectedJudge.court_type.replace('_', ' ').toUpperCase()} COURT JUDGE
                  </div>
                  <div className="experience-badge">
                    <Award size={16} />
                    <span>{selectedJudge.years_experience} Years of Judicial Experience</span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h4>Caseload Management</h4>
                <div className="caseload-details">
                  <div className="caseload-stat">
                    <span className="stat-label">Current Cases</span>
                    <span className="stat-value">{selectedJudge.current_caseload}</span>
                  </div>
                  <div className="caseload-stat">
                    <span className="stat-label">Maximum Capacity</span>
                    <span className="stat-value">{selectedJudge.max_caseload}</span>
                  </div>
                  <div className="caseload-stat">
                    <span className="stat-label">Utilization Rate</span>
                    <span className="stat-value">
                      {((selectedJudge.current_caseload / selectedJudge.max_caseload) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="caseload-stat">
                    <span className="stat-label">Availability Status</span>
                    <span 
                      className="stat-value"
                      style={{ color: getWorkloadStatus(selectedJudge.current_caseload, selectedJudge.max_caseload).color }}
                    >
                      {getWorkloadStatus(selectedJudge.current_caseload, selectedJudge.max_caseload).label}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h4>Areas of Specialization</h4>
                <div className="specializations-grid">
                  {selectedJudge.specializations.map((spec, index) => (
                    <div key={index} className="specialization-item">
                      <BookOpen size={16} />
                      <span>{formatSpecialization(spec)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="detail-section">
                <h4>Weekly Schedule</h4>
                <div className="schedule-grid">
                  {Object.entries(selectedJudge.availability).map(([day, times]) => (
                    <div key={day} className="schedule-day">
                      <div className="day-name">
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </div>
                      <div className="day-times">
                        {times.length > 0 ? (
                          times.map((time, index) => (
                            <span key={index} className="time-block">{time}</span>
                          ))
                        ) : (
                          <span className="no-availability">Not available</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JudgeManagement;