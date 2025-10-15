import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertTriangle, XCircle, TrendingUp, FileCheck, Lock, Eye, BarChart3, Clock, Award, AlertCircle, RefreshCw } from 'lucide-react';

interface ComplianceScore {
  framework: string;
  score: number;
  status: 'compliant' | 'partial' | 'non-compliant';
  lastAudit: string;
  controls: {
    total: number;
    implemented: number;
    partial: number;
    missing: number;
  };
}

interface ComplianceControl {
  id: string;
  title: string;
  description: string;
  status: 'implemented' | 'partial' | 'missing';
  priority: 'critical' | 'high' | 'medium' | 'low';
  framework: string;
}

interface ComplianceTrend {
  date: string;
  fisma: number;
  nist: number;
  section508: number;
}

export const ComplianceDashboard: React.FC = () => {
  const [complianceScores, setComplianceScores] = useState<ComplianceScore[]>([]);
  const [selectedFramework, setSelectedFramework] = useState<string>('FISMA High');
  const [controls, setControls] = useState<ComplianceControl[]>([]);
  const [trends, setTrends] = useState<ComplianceTrend[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastScan, setLastScan] = useState<Date>(new Date());

  // Initialize compliance data
  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = () => {
    setLoading(true);
    
    // Simulate compliance scores (in production, fetch from backend)
    const scores: ComplianceScore[] = [
      {
        framework: 'FISMA High',
        score: 87,
        status: 'partial',
        lastAudit: '2025-10-01',
        controls: { total: 325, implemented: 283, partial: 28, missing: 14 }
      },
      {
        framework: 'NIST 800-53',
        score: 92,
        status: 'compliant',
        lastAudit: '2025-10-05',
        controls: { total: 945, implemented: 869, partial: 52, missing: 24 }
      },
      {
        framework: 'Section 508',
        score: 95,
        status: 'compliant',
        lastAudit: '2025-10-08',
        controls: { total: 38, implemented: 36, partial: 2, missing: 0 }
      }
    ];
    
    // Compliance controls
    const controlsList: ComplianceControl[] = [
      {
        id: 'AC-2',
        title: 'Account Management',
        description: 'Organization manages information system accounts',
        status: 'implemented',
        priority: 'critical',
        framework: 'NIST 800-53'
      },
      {
        id: 'AC-3',
        title: 'Access Enforcement',
        description: 'System enforces approved authorizations',
        status: 'implemented',
        priority: 'critical',
        framework: 'NIST 800-53'
      },
      {
        id: 'AU-2',
        title: 'Audit Events',
        description: 'Organization determines auditable events',
        status: 'partial',
        priority: 'high',
        framework: 'FISMA High'
      },
      {
        id: 'IA-2',
        title: 'Identification and Authentication',
        description: 'System uniquely identifies and authenticates users',
        status: 'implemented',
        priority: 'critical',
        framework: 'FISMA High'
      },
      {
        id: 'SC-7',
        title: 'Boundary Protection',
        description: 'System monitors and controls communications',
        status: 'implemented',
        priority: 'high',
        framework: 'NIST 800-53'
      },
      {
        id: '508-1',
        title: 'Keyboard Access',
        description: 'All functionality available via keyboard',
        status: 'implemented',
        priority: 'high',
        framework: 'Section 508'
      },
      {
        id: '508-2',
        title: 'Screen Reader Support',
        description: 'Content accessible to screen readers',
        status: 'partial',
        priority: 'medium',
        framework: 'Section 508'
      },
      {
        id: 'SI-2',
        title: 'Flaw Remediation',
        description: 'Organization identifies and corrects flaws',
        status: 'implemented',
        priority: 'critical',
        framework: 'FISMA High'
      }
    ];
    
    // Compliance trends (last 7 days)
    const trendData: ComplianceTrend[] = [
      { date: '10/04', fisma: 82, nist: 88, section508: 92 },
      { date: '10/05', fisma: 83, nist: 89, section508: 93 },
      { date: '10/06', fisma: 84, nist: 90, section508: 94 },
      { date: '10/07', fisma: 85, nist: 91, section508: 94 },
      { date: '10/08', fisma: 86, nist: 91, section508: 95 },
      { date: '10/09', fisma: 86, nist: 92, section508: 95 },
      { date: '10/11', fisma: 87, nist: 92, section508: 95 }
    ];
    
    setComplianceScores(scores);
    setControls(controlsList);
    setTrends(trendData);
    setLastScan(new Date());
    setLoading(false);
  };

  const runComplianceScan = () => {
    setLoading(true);
    setTimeout(() => {
      loadComplianceData();
      setLoading(false);
    }, 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'implemented':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'partial':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'non-compliant':
      case 'missing':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'implemented':
        return 'text-green-400';
      case 'partial':
        return 'text-yellow-400';
      case 'non-compliant':
      case 'missing':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      critical: 'bg-red-600 text-white',
      high: 'bg-orange-600 text-white',
      medium: 'bg-yellow-600 text-white',
      low: 'bg-blue-600 text-white'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-600 text-white';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-yellow-400';
    return 'text-red-400';
  };

  const filteredControls = selectedFramework === 'All' 
    ? controls 
    : controls.filter(c => c.framework === selectedFramework);

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold">Compliance Dashboard</h2>
          <span className="text-sm text-gray-400">
            Government Standards & Security
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            Last scan: {lastScan.toLocaleTimeString()}
          </div>
          <button
            onClick={runComplianceScan}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Scanning...' : 'Run Scan'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Compliance Score Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {complianceScores.map((score) => (
            <div
              key={score.framework}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-400" />
                  <h3 className="font-semibold">{score.framework}</h3>
                </div>
                {getStatusIcon(score.status)}
              </div>
              
              <div className="mb-3">
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-bold ${getScoreColor(score.score)}`}>
                    {score.score}%
                  </span>
                  <span className="text-gray-400 text-sm">compliance</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      score.score >= 90 ? 'bg-green-400' : 
                      score.score >= 75 ? 'bg-yellow-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${score.score}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-700 rounded p-2">
                  <div className="text-gray-400">Implemented</div>
                  <div className="text-green-400 font-bold">{score.controls.implemented}</div>
                </div>
                <div className="bg-gray-700 rounded p-2">
                  <div className="text-gray-400">Partial</div>
                  <div className="text-yellow-400 font-bold">{score.controls.partial}</div>
                </div>
                <div className="bg-gray-700 rounded p-2">
                  <div className="text-gray-400">Missing</div>
                  <div className="text-red-400 font-bold">{score.controls.missing}</div>
                </div>
                <div className="bg-gray-700 rounded p-2">
                  <div className="text-gray-400">Total</div>
                  <div className="text-white font-bold">{score.controls.total}</div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400">
                Last audit: {new Date(score.lastAudit).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>

        {/* Compliance Trends Chart */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h3 className="font-semibold">Compliance Trends (7 Days)</h3>
          </div>
          <div className="h-48 flex items-end justify-between gap-2">
            {trends.map((trend, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col gap-1">
                  <div
                    className="bg-blue-500 rounded-t transition-all hover:bg-blue-400"
                    style={{ height: `${(trend.fisma / 100) * 150}px` }}
                    title={`FISMA: ${trend.fisma}%`}
                  />
                  <div
                    className="bg-green-500 transition-all hover:bg-green-400"
                    style={{ height: `${(trend.nist / 100) * 150}px` }}
                    title={`NIST: ${trend.nist}%`}
                  />
                  <div
                    className="bg-yellow-500 rounded-b transition-all hover:bg-yellow-400"
                    style={{ height: `${(trend.section508 / 100) * 150}px` }}
                    title={`508: ${trend.section508}%`}
                  />
                </div>
                <span className="text-xs text-gray-400">{trend.date}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span>FISMA High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span>NIST 800-53</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded" />
              <span>Section 508</span>
            </div>
          </div>
        </div>

        {/* Controls List */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold">Security Controls</h3>
              </div>
              <select
                value={selectedFramework}
                onChange={(e) => setSelectedFramework(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="All">All Frameworks</option>
                <option value="FISMA High">FISMA High</option>
                <option value="NIST 800-53">NIST 800-53</option>
                <option value="Section 508">Section 508</option>
              </select>
            </div>
          </div>

          <div className="max-h-96 overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-700 sticky top-0">
                <tr className="text-left text-sm">
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Control ID</th>
                  <th className="p-3 font-medium">Title</th>
                  <th className="p-3 font-medium">Framework</th>
                  <th className="p-3 font-medium">Priority</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredControls.map((control) => (
                  <tr
                    key={control.id}
                    className="border-t border-gray-700 hover:bg-gray-700 transition-colors"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(control.status)}
                        <span className={`text-xs ${getStatusColor(control.status)}`}>
                          {control.status}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-mono text-blue-400">{control.id}</span>
                    </td>
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{control.title}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {control.description}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-gray-400">{control.framework}</span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityBadge(control.priority)}`}>
                        {control.priority.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400">Security Level</span>
            </div>
            <div className="text-2xl font-bold text-green-400">High</div>
            <div className="text-xs text-gray-400 mt-1">FISMA Authorized</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400">Accessibility</span>
            </div>
            <div className="text-2xl font-bold text-green-400">WCAG 2.1</div>
            <div className="text-xs text-gray-400 mt-1">Level AA Compliant</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400">Overall Score</span>
            </div>
            <div className="text-2xl font-bold text-yellow-400">91%</div>
            <div className="text-xs text-gray-400 mt-1">Across all frameworks</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400">Active Controls</span>
            </div>
            <div className="text-2xl font-bold text-green-400">1,188</div>
            <div className="text-xs text-gray-400 mt-1">Out of 1,308 total</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceDashboard;
