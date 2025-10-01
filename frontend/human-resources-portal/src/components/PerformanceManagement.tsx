import React, { useState, useEffect } from 'react';
import { 
  FaClipboardList, 
  FaAward, 
  FaStar,
  FaChartLine,
  FaCalendarCheck,
  FaUser,
  FaTasks,
  FaGraduationCap,
  FaPlus,
  FaEdit,
  FaEye,
  FaSearch,
  FaFilter,
  FaDownload
} from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface PerformanceEvaluation {
  evaluation_id: string;
  employee_id: string;
  evaluator_id: string;
  evaluation_period: string;
  overall_rating: number;
  competency_scores: {
    [key: string]: number;
  };
  goals_met: string[];
  development_areas: string[];
  action_plan: string;
  evaluation_date: string;
  next_review_date: string;
}

interface PerformanceMetrics {
  average_rating: number;
  evaluations_completed: number;
  overdue_evaluations: number;
  goal_completion_rate: number;
  employee_development_hours: number;
}

const PerformanceManagement: React.FC = () => {
  const [evaluations, setEvaluations] = useState<PerformanceEvaluation[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<PerformanceEvaluation | null>(null);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('2024');

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      const response = await fetch('http://localhost:\${{TF_PORT_5360:-5360}}/api/hr/performance');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setEvaluations(data.evaluations || []);
      
      const performanceMetrics = {
        average_rating: data.average_rating || 0,
        evaluations_completed: data.count || 0,
        overdue_evaluations: data.overdue_evaluations || 0,
        goal_completion_rate: 87.5,
        employee_development_hours: 1240
      };
      setMetrics(performanceMetrics);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch performance data:', err);
      setError('Unable to connect to HR service. Please check if the service is running on port \${{TF_PORT_5360:-5360}}.');
      
      // Set demo data for display
      const demoEvaluations = [
        {
          evaluation_id: 'EVAL-2024-001',
          employee_id: 'BC-EMP-2024-001',
          evaluator_id: 'County Commissioners',
          evaluation_period: '2024 Annual Review',
          overall_rating: 4.8,
          competency_scores: {
            leadership: 4.9,
            communication: 4.7,
            strategic_thinking: 4.8,
            fiscal_management: 4.8,
            public_service: 4.9
          },
          goals_met: [
            'Balanced county budget',
            'Improved inter-departmental coordination',
            'Enhanced public engagement'
          ],
          development_areas: [
            'Technology integration',
            'Regional partnerships'
          ],
          action_plan: 'Attend technology leadership conference, establish regional collaboration committee',
          evaluation_date: '2024-08-01T00:00:00',
          next_review_date: '2025-08-01T00:00:00'
        },
        {
          evaluation_id: 'EVAL-2024-002',
          employee_id: 'BC-EMP-2024-002',
          evaluator_id: 'Sheriff',
          evaluation_period: '2024 Annual Review',
          overall_rating: 4.5,
          competency_scores: {
            leadership: 4.6,
            law_enforcement: 4.7,
            community_relations: 4.3,
            training: 4.5,
            supervision: 4.4
          },
          goals_met: [
            'Reduced response times',
            'Improved officer training',
            'Enhanced community partnerships'
          ],
          development_areas: [
            'Advanced investigation techniques',
            'Budget management'
          ],
          action_plan: 'Complete advanced investigations course, participate in budget planning sessions',
          evaluation_date: '2024-07-15T00:00:00',
          next_review_date: '2025-07-15T00:00:00'
        },
        {
          evaluation_id: 'EVAL-2024-003',
          employee_id: 'BC-EMP-2024-003',
          evaluator_id: 'Public Works Director',
          evaluation_period: '2024 Annual Review',
          overall_rating: 4.7,
          competency_scores: {
            technical_expertise: 4.8,
            project_management: 4.7,
            communication: 4.6,
            teamwork: 4.8,
            innovation: 4.5
          },
          goals_met: [
            'Completed bridge rehabilitation project',
            'Improved infrastructure maintenance efficiency',
            'Led sustainability initiatives'
          ],
          development_areas: [
            'Public speaking',
            'Contract management'
          ],
          action_plan: 'Attend public communication workshop, complete contract administration certification',
          evaluation_date: '2024-06-30T00:00:00',
          next_review_date: '2025-06-30T00:00:00'
        },
        {
          evaluation_id: 'EVAL-2024-004',
          employee_id: 'BC-EMP-2024-004',
          evaluator_id: 'Health Director',
          evaluation_period: '2024 Annual Review',
          overall_rating: 4.2,
          competency_scores: {
            technical_knowledge: 4.4,
            regulatory_compliance: 4.3,
            communication: 4.0,
            customer_service: 4.2,
            problem_solving: 4.1
          },
          goals_met: [
            'Improved inspection efficiency',
            'Enhanced food safety compliance',
            'Reduced complaint response time'
          ],
          development_areas: [
            'Advanced environmental health techniques',
            'Data analysis skills'
          ],
          action_plan: 'Complete advanced environmental health certification, attend data analysis training',
          evaluation_date: '2024-05-20T00:00:00',
          next_review_date: '2025-05-20T00:00:00'
        },
        {
          evaluation_id: 'EVAL-2024-005',
          employee_id: 'BC-EMP-2024-005',
          evaluator_id: 'County Administrator',
          evaluation_period: '2024 Annual Review',
          overall_rating: 4.6,
          competency_scores: {
            hr_expertise: 4.7,
            communication: 4.6,
            problem_solving: 4.5,
            compliance: 4.8,
            strategic_thinking: 4.4
          },
          goals_met: [
            'Implemented new HRIS system',
            'Improved employee retention',
            'Enhanced benefits administration'
          ],
          development_areas: [
            'Labor relations',
            'Organizational development'
          ],
          action_plan: 'Complete labor relations certification, attend organizational development conference',
          evaluation_date: '2024-07-01T00:00:00',
          next_review_date: '2025-07-01T00:00:00'
        }
      ];
      
      setEvaluations(demoEvaluations);
      setMetrics({
        average_rating: 4.56,
        evaluations_completed: 5,
        overdue_evaluations: 0,
        goal_completion_rate: 87.5,
        employee_development_hours: 1240
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPerformanceColor = (rating: number) => {
    if (rating >= 4.5) return '#10b981';
    if (rating >= 4.0) return '#3b82f6';
    if (rating >= 3.5) return '#f59e0b';
    return '#ef4444';
  };

  const getPerformanceLabel = (rating: number) => {
    if (rating >= 4.5) return 'Exceeds Expectations';
    if (rating >= 4.0) return 'Meets Expectations';
    if (rating >= 3.5) return 'Needs Improvement';
    return 'Below Expectations';
  };

  const openEvaluationDetails = (evaluation: PerformanceEvaluation) => {
    setSelectedEvaluation(evaluation);
    setShowEvaluationModal(true);
  };

  // Sample data for charts
  const performanceDistribution = [
    { category: 'Exceeds Expectations (4.5+)', count: 89, percentage: 19.5 },
    { category: 'Meets Expectations (4.0-4.4)', count: 298, percentage: 65.4 },
    { category: 'Needs Improvement (3.5-3.9)', count: 69, percentage: 15.1 }
  ];

  const competencyAverages = [
    { competency: 'Leadership', average: 4.6, subject: 'Leadership', A: 4.6, fullMark: 5 },
    { competency: 'Communication', average: 4.4, subject: 'Communication', A: 4.4, fullMark: 5 },
    { competency: 'Technical Skills', average: 4.7, subject: 'Technical Skills', A: 4.7, fullMark: 5 },
    { competency: 'Teamwork', average: 4.5, subject: 'Teamwork', A: 4.5, fullMark: 5 },
    { competency: 'Problem Solving', average: 4.3, subject: 'Problem Solving', A: 4.3, fullMark: 5 },
    { competency: 'Customer Service', average: 4.2, subject: 'Customer Service', A: 4.2, fullMark: 5 }
  ];

  const filteredEvaluations = evaluations.filter(evaluation =>
    evaluation.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    evaluation.evaluator_id.toLowerCase().includes(searchTerm.toLowerCase())
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
        <p>Loading Performance Data...</p>
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
          <FaClipboardList />
          <div>
            <strong>Service Connection Warning:</strong> {error}
            <br />
            <small>Displaying cached performance data for demonstration purposes.</small>
          </div>
        </div>
      )}

      {/* Performance Metrics Cards */}
      <div className="data-grid" style={{ 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        marginBottom: '2rem'
      }}>
        <div className="data-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="metric-value">{metrics?.average_rating.toFixed(2)}</div>
              <div className="metric-label">Average Performance Rating</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Out of 5.0 scale
              </div>
            </div>
            <FaAward size={32} style={{ color: '#d97706' }} />
          </div>
        </div>

        <div className="data-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="metric-value">{metrics?.evaluations_completed}</div>
              <div className="metric-label">Evaluations Completed</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                2024 Annual Reviews
              </div>
            </div>
            <FaClipboardList size={32} style={{ color: '#1e40af' }} />
          </div>
        </div>

        <div className="data-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="metric-value">{metrics?.goal_completion_rate}%</div>
              <div className="metric-label">Goal Completion Rate</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Employee objectives
              </div>
            </div>
            <FaTasks size={32} style={{ color: '#059669' }} />
          </div>
        </div>

        <div className="data-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="metric-value">{metrics?.employee_development_hours.toLocaleString()}</div>
              <div className="metric-label">Development Hours</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Training & certification
              </div>
            </div>
            <FaGraduationCap size={32} style={{ color: '#7c3aed' }} />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="data-grid" style={{ 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
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
            Performance Rating Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={performanceDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="category" 
                stroke="#6b7280"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
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

        {/* Competency Radar */}
        <div className="data-card">
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: '600', 
            marginBottom: '1rem',
            color: '#374151'
          }}>
            Average Competency Scores
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={competencyAverages}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 5]} 
                tick={false}
              />
              <Radar
                name="Average Score"
                dataKey="A"
                stroke="#1e40af"
                fill="#1e40af"
                fillOpacity={0.2}
              />
              <Tooltip 
                formatter={(value: any) => [value.toFixed(2), 'Average Score']}
                contentStyle={{ 
                  background: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}
              />
            </RadarChart>
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
            Performance Evaluations
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="government-button secondary">
              <FaPlus size={14} style={{ marginRight: '0.5rem' }} />
              New Evaluation
            </button>
            <button className="government-button">
              <FaDownload size={14} style={{ marginRight: '0.5rem' }} />
              Export Reports
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
              Search Evaluations
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Search by employee or evaluator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <FaFilter style={{ marginRight: '0.5rem' }} />
              Review Period
            </label>
            <select
              className="form-input"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="2024">2024 Annual Reviews</option>
              <option value="2023">2023 Annual Reviews</option>
              <option value="mid-year">Mid-Year Reviews</option>
              <option value="probationary">Probationary Reviews</option>
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
          <span>Total Evaluations: <strong>{evaluations.length}</strong></span>
          <span>•</span>
          <span>Completed: <strong>{evaluations.length}</strong></span>
          <span>•</span>
          <span>Overdue: <strong>{metrics?.overdue_evaluations || 0}</strong></span>
        </div>
      </div>

      {/* Evaluations Table */}
      <div className="government-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Evaluator</th>
              <th>Period</th>
              <th>Overall Rating</th>
              <th>Performance Level</th>
              <th>Evaluation Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvaluations.map((evaluation) => (
              <tr key={evaluation.evaluation_id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%',
                      background: '#1e40af',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '0.75rem'
                    }}>
                      <FaUser />
                    </div>
                    <div>
                      <div style={{ fontWeight: '500', color: '#374151' }}>
                        {evaluation.employee_id}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {evaluation.evaluation_id}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: '500' }}>
                    {evaluation.evaluator_id}
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: '500' }}>
                    {evaluation.evaluation_period}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '50%',
                      background: getPerformanceColor(evaluation.overall_rating)
                    }}></div>
                    <span style={{ fontWeight: '600', fontSize: '1rem' }}>
                      {evaluation.overall_rating.toFixed(1)}
                    </span>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar
                          key={star}
                          size={12}
                          style={{
                            color: star <= evaluation.overall_rating ? '#f59e0b' : '#e5e7eb'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </td>
                <td>
                  <span style={{ 
                    background: getPerformanceColor(evaluation.overall_rating) + '20',
                    color: getPerformanceColor(evaluation.overall_rating),
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {getPerformanceLabel(evaluation.overall_rating)}
                  </span>
                </td>
                <td>
                  <div style={{ fontWeight: '500' }}>
                    {formatDate(evaluation.evaluation_date)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    Next: {formatDate(evaluation.next_review_date)}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => openEvaluationDetails(evaluation)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#1e40af',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        borderRadius: '4px'
                      }}
                      title="View Details"
                    >
                      <FaEye size={14} />
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
                      title="Edit Evaluation"
                    >
                      <FaEdit size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Evaluation Detail Modal */}
      {showEvaluationModal && selectedEvaluation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div className="government-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                  Performance Evaluation Details
                </h3>
                <button
                  onClick={() => setShowEvaluationModal(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    color: 'white',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>
              <div style={{ marginTop: '0.5rem', opacity: 0.9 }}>
                {selectedEvaluation.employee_id} - {selectedEvaluation.evaluation_period}
              </div>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div className="data-grid" style={{ 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem'
              }}>
                {/* Overall Performance */}
                <div>
                  <h4 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    marginBottom: '1rem',
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <FaAward />
                    Overall Performance
                  </h4>
                  <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <div style={{ 
                      fontSize: '3rem', 
                      fontWeight: '700',
                      color: getPerformanceColor(selectedEvaluation.overall_rating)
                    }}>
                      {selectedEvaluation.overall_rating.toFixed(1)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '0.5rem' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar
                          key={star}
                          size={20}
                          style={{
                            color: star <= selectedEvaluation.overall_rating ? '#f59e0b' : '#e5e7eb'
                          }}
                        />
                      ))}
                    </div>
                    <div style={{ 
                      fontSize: '1rem', 
                      fontWeight: '500',
                      color: getPerformanceColor(selectedEvaluation.overall_rating)
                    }}>
                      {getPerformanceLabel(selectedEvaluation.overall_rating)}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    <div><strong>Evaluator:</strong> {selectedEvaluation.evaluator_id}</div>
                    <div><strong>Date:</strong> {formatDate(selectedEvaluation.evaluation_date)}</div>
                    <div><strong>Next Review:</strong> {formatDate(selectedEvaluation.next_review_date)}</div>
                  </div>
                </div>

                {/* Competency Scores */}
                <div>
                  <h4 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    marginBottom: '1rem',
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <FaChartLine />
                    Competency Scores
                  </h4>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {Object.entries(selectedEvaluation.competency_scores).map(([competency, score]) => (
                      <div key={competency}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          marginBottom: '0.25rem'
                        }}>
                          <span style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: '500',
                            textTransform: 'capitalize'
                          }}>
                            {competency.replace('_', ' ')}
                          </span>
                          <span style={{ fontWeight: '600' }}>{score.toFixed(1)}</span>
                        </div>
                        <div style={{ 
                          background: '#e5e7eb',
                          height: '6px',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            background: getPerformanceColor(score),
                            height: '100%',
                            width: `${(score / 5) * 100}%`,
                            transition: 'width 0.3s ease'
                          }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Goals Met */}
                <div>
                  <h4 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    marginBottom: '1rem',
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <FaCalendarCheck />
                    Goals Achieved
                  </h4>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {selectedEvaluation.goals_met.map((goal, index) => (
                      <div
                        key={index}
                        style={{
                          background: '#dcfce7',
                          color: '#166534',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <FaCalendarCheck size={12} />
                        {goal}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Development Areas */}
                <div>
                  <h4 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    marginBottom: '1rem',
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <FaGraduationCap />
                    Development Areas
                  </h4>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {selectedEvaluation.development_areas.map((area, index) => (
                      <div
                        key={index}
                        style={{
                          background: '#fef3c7',
                          color: '#92400e',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <FaGraduationCap size={12} />
                        {area}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Plan */}
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  marginBottom: '1rem',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <FaTasks />
                  Development Action Plan
                </h4>
                <div style={{ 
                  background: '#f8fafc',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '1rem',
                  fontSize: '0.875rem',
                  lineHeight: '1.6'
                }}>
                  {selectedEvaluation.action_plan}
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: '0.5rem',
                marginTop: '2rem',
                paddingTop: '1rem',
                borderTop: '1px solid #e5e7eb'
              }}>
                <button
                  onClick={() => setShowEvaluationModal(false)}
                  className="government-button"
                  style={{ background: '#6b7280' }}
                >
                  Close
                </button>
                <button className="government-button">
                  <FaEdit size={14} style={{ marginRight: '0.5rem' }} />
                  Edit Evaluation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceManagement;