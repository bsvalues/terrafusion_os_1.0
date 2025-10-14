import React, { useState, useEffect } from 'react';
import { Shield,
  FileText,
  Database,
  Globe,
  DollarSign,
  Map,
  Archive,
  Settings,
  Play,
  CheckCircle,
  AlertCircle,
  Clock,
  Activity,
  TrendingUp,
  Users,
  Target,
  BarChart3
 } from 'lucide-react';
import GovernmentSpecializedAgents, { 
  GovernmentAgent, 
  ComplianceTask, 
  GovernmentAgentCapability 
} from '../core/GovernmentSpecializedAgents';

interface GovernmentAgentsDashboardProps {
  className?: string;
}

const GovernmentAgentsDashboard: React.FC<GovernmentAgentsDashboardProps> = ({ className = '' }) => {
  const [govAgents] = useState(() => new GovernmentSpecializedAgents());
  const [agents, setAgents] = useState<GovernmentAgent[]>([]);
  const [complianceTasks, setComplianceTasks] = useState<ComplianceTask[]>([]);
  const [selectedAgentType, setSelectedAgentType] = useState<string>('');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('');
  const [showTaskCreation, setShowTaskCreation] = useState(false);
  const [newTask, setNewTask] = useState({
    type: 'fisma-audit' as ComplianceTask['type'],
    priority: 'medium' as ComplianceTask['priority'],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    requirements: [''],
    assignedAgent: ''
  });

  useEffect(() => {
    setAgents(govAgents.getAllAgents());
    setComplianceTasks(govAgents.getComplianceTasks());

    const updateData = () => {
      setAgents(govAgents.getAllAgents());
      setComplianceTasks(govAgents.getComplianceTasks());
    };

    govAgents.on('compliance-task-created', updateData);
    govAgents.on('task-assigned', updateData);
    govAgents.on('task-completed', updateData);

    return () => {
      govAgents.removeAllListeners();
    };
  }, [govAgents]);

  const getAgentIcon = (type: GovernmentAgent['type']) => {
    switch (type) {
      case 'compliance-officer': return <Shield className="w-6 h-6" />;
      case 'security-analyst': return <Shield className="w-6 h-6" />;
      case 'auditor': return <FileText className="w-6 h-6" />;
      case 'data-steward': return <Database className="w-6 h-6" />;
      case 'regulatory-expert': return <Globe className="w-6 h-6" />;
      case 'fiscal-analyst': return <DollarSign className="w-6 h-6" />;
      case 'geospatial-specialist': return <Map className="w-6 h-6" />;
      case 'records-manager': return <Archive className="w-6 h-6" />;
      default: return <Users className="w-6 h-6" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'standby': return 'text-blue-500';
      case 'busy': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAgents = agents.filter(agent => {
    if (selectedAgentType && agent.type !== selectedAgentType) return false;
    if (selectedJurisdiction && !agent.jurisdiction.includes(selectedJurisdiction)) return false;
    return true;
  });

  const handleCreateTask = async () => {
    try {
      const taskData = {
        type: newTask.type,
        priority: newTask.priority,
        dueDate: new Date(newTask.dueDate),
        requirements: newTask.requirements.filter(req => req.trim() !== ''),
        assignedAgent: newTask.assignedAgent,
        findings: [],
        riskAssessment: {
          likelihood: 0.5,
          impact: 0.5,
          overallRisk: 0.25
        }
      };

      const taskId = await govAgents.assignComplianceTask(taskData);
      console.log(`Compliance task created: ${taskId}`);
      
      // Reset form
      setNewTask({
        type: 'fisma-audit',
        priority: 'medium',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        requirements: [''],
        assignedAgent: ''
      });
      setShowTaskCreation(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const addRequirement = () => {
    setNewTask(prev => ({
      ...prev,
      requirements: [...prev.requirements, '']
    }));
  };

  const updateRequirement = (index: number, value: string) => {
    setNewTask(prev => ({
      ...prev,
      requirements: prev.requirements.map((req, i) => i === index ? value : req)
    }));
  };

  const removeRequirement = (index: number) => {
    setNewTask(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const overallComplianceScore = govAgents.getComplianceScore();
  const riskAssessment = govAgents.getRiskAssessment();

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">

          <Shield className="w-8 h-8 text-green-600" />
          Government Specialized Agents
        </h2>
        <div

className="flex items-center gap-2">
          <button
            onClick={() => setShowTaskCreation(!showTaskCreation)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all"
          >
            <Play className="w-4 h-4" />
            Create Task
          </button>
        </div>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-lg border border-green-200">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>

              <h3 className="text-lg font-semibold text-gray-800">Overall Compliance</h3>
              <p

className="text-3xl font-bold text-green-600">{overallComplianceScore.toFixed(1)}%</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Government-wide compliance score</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>

              <h3 className="text-lg font-semibold text-gray-800">Active Agents</h3>
              <p

className="text-3xl font-bold text-blue-600">{agents.filter(a => a.status === 'active').length}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Specialized agents online</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-red-100 p-6 rounded-lg border border-orange-200">
          <div className="flex items-center gap-3 mb-3">
            <Activity className="w-8 h-8 text-orange-600" />
            <div>

              <h3 className="text-lg font-semibold text-gray-800">Active Tasks</h3>
              <p

className="text-3xl font-bold text-orange-600">{complianceTasks.filter(t => t.status === 'in-progress').length}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Compliance tasks in progress</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-6 rounded-lg border border-purple-200">
          <div className="flex items-center gap-3 mb-3">
            <Target className="w-8 h-8 text-purple-600" />
            <div>

              <h3 className="text-lg font-semibold text-gray-800">Risk Level</h3>
              <p

className="text-3xl font-bold text-purple-600">{riskAssessment.critical + riskAssessment.high}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">High/Critical risk capabilities</p>
        </div>
      </div>

      {/* Task Creation Modal */}
      {showTaskCreation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl w-11/12 max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">

                <h3 className="text-xl font-bold text-gray-800">Create Compliance Task</h3>
                <button

                  onClick={() => setShowTaskCreation(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <AlertCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>

                    <label className="block text-sm font-medium text-gray-700 mb-2">Task Type</label>
                    <select

                      value={newTask.type}
                      onChange={(e) => setNewTask(prev => ({ ...prev, type: e.target.value as ComplianceTask['type'] }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >

                      <option value="fisma-audit">FISMA Audit</option>
                      <option

value="nist-assessment">NIST Assessment</option>

                      <option value="gdpr-review">GDPR Review</option>
                      <option

value="hipaa-compliance">HIPAA Compliance</option>

                      <option value="sox-audit">SOX Audit</option>
                      <option

value="pci-validation">PCI Validation</option>
                    </select>
                  </div>

                  <div>

                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select

                      value={newTask.priority}
                      onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as ComplianceTask['priority'] }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >

                      <option value="low">Low</option>
                      <option

value="medium">Medium</option>

                      <option value="high">High</option>
                      <option

value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                  <input

                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Requirements</label>
                  {newTask.requirements.map((req /* , index */) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={req}
                        onChange={(e) => updateRequirement(index, e.target.value)}
                        placeholder="Enter requirement..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => removeRequirement(index)}
                        className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addRequirement}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add Requirement
                  </button>
                </div>

                <div className="flex gap-4 pt-4">

                  <button
                    onClick={handleCreateTask}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Create Task
                  </button>
                  <button

                    onClick={() => setShowTaskCreation(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-4">
          <div>

            <label className="block text-sm font-medium text-gray-700 mb-1">Agent Type</label>
            <select

              value={selectedAgentType}
              onChange={(e) => setSelectedAgentType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >

              <option value="">All Types</option>
              <option

value="compliance-officer">Compliance Officer</option>

              <option value="security-analyst">Security Analyst</option>
              <option

value="auditor">Auditor</option>

              <option value="data-steward">Data Steward</option>
              <option

value="regulatory-expert">Regulatory Expert</option>

              <option value="fiscal-analyst">Fiscal Analyst</option>
              <option

value="geospatial-specialist">Geospatial Specialist</option>
              <option value="records-manager">Records Manager</option>
            </select>
          </div>

          <div>

            <label className="block text-sm font-medium text-gray-700 mb-1">Jurisdiction</label>
            <select

              value={selectedJurisdiction}
              onChange={(e) => setSelectedJurisdiction(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >

              <option value="">All Jurisdictions</option>
              <option

value="Federal">Federal</option>

              <option value="State">State</option>
              <option

value="Local">Local</option>

              <option value="Tribal">Tribal</option>
              <option

value="Critical-Infrastructure">Critical Infrastructure</option>
              <option value="EU">EU</option>
            </select>
          </div>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {filteredAgents.map(agent => (
          <div key={agent.id} className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {getAgentIcon(agent.type)}
                <div>

                  <h3 className="text-lg font-semibold text-gray-800">{agent.name}</h3>
                  <p

className="text-sm text-gray-500 capitalize">{agent.type.replace('-', ' ')}</p>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`}></div>
            </div>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">

                <span className="text-sm text-gray-600">Performance:</span>
                <span

className="font-semibold text-gray-800">{agent.performance}%</span>
              </div>
              <div className="flex justify-between items-center">

                <span className="text-sm text-gray-600">Compliance:</span>
                <span

className="font-semibold text-gray-800">{agent.complianceScore}%</span>
              </div>
              <div className="flex justify-between items-center">

                <span className="text-sm text-gray-600">Capabilities:</span>
                <span

className="font-semibold text-gray-800">{agent.capabilities.length}</span>
              </div>
            </div>

            <div className="mb-4">

              <h4 className="text-sm font-medium text-gray-700 mb-2">Capabilities</h4>
              <div

className="space-y-2">
                {agent.capabilities.map(cap => (
                  <div key={cap.id} className="flex items-center justify-between">

                    <span className="text-xs text-gray-600">{cap.name}</span>
                    <span

className={`px-2 py-1 text-xs rounded-full ${getRiskLevelColor(cap.riskLevel)}`}>
                      {cap.riskLevel}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-1 mb-2">
                {agent.certifications.map(cert => (
                  <span key={cert} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {cert}
                  </span>
                ))}
              </div>
              <div className="text-xs text-gray-500">
                Last audit: {agent.lastAudit.toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Active Tasks */}
      {complianceTasks.filter(t => t.status === 'in-progress').length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">

            <Activity className="w-5 h-5" />
            Active Compliance Tasks
          </h3>
          
          <div

className="space-y-4">
            {complianceTasks.filter(t => t.status === 'in-progress').map(task => {
              const agent = agents.find(a => a.id === task.assignedAgent);
              return (
                <div key={task.id} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority).split(' ')[0]}`}></div>
                      <div>
                        <h4 className="font-medium text-gray-800 capitalize">{task.type.replace('-', ' ')}</h4>
                        <p className="text-sm text-gray-500">Assigned to: {agent?.name || 'Unknown'}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>

                      <span className="text-gray-600">Due Date: </span>
                      <span

className="font-medium">{task.dueDate.toLocaleDateString()}</span>
                    </div>
                    <div>

                      <span className="text-gray-600">Requirements: </span>
                      <span

className="font-medium">{task.requirements.length}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Risk Assessment */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">

          <BarChart3 className="w-5 h-5" />
          Risk Assessment Overview
        </h3>
        
        <div

className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-center">

              <div className="text-2xl font-bold text-green-600">{riskAssessment.low}</div>
              <div

className="text-sm text-gray-600">Low Risk</div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-center">

              <div className="text-2xl font-bold text-yellow-600">{riskAssessment.medium}</div>
              <div

className="text-sm text-gray-600">Medium Risk</div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-center">

              <div className="text-2xl font-bold text-orange-600">{riskAssessment.high}</div>
              <div

className="text-sm text-gray-600">High Risk</div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-center">

              <div className="text-2xl font-bold text-red-600">{riskAssessment.critical}</div>
              <div

className="text-sm text-gray-600">Critical Risk</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GovernmentAgentsDashboard;
