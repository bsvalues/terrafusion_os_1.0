import "./terrafusion-brand.css";
import {useState, useEffect} from 'react';
import {invoke} from '@tauri-apps/api/tauri';
import {Shield, 
  Warning, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Globe,
  Search,
  Refresh} from '@mui/icons-material';
import './App.css';

interface Audit {id: string;
  url: string;
  status: string;
  score: number;
  issues: string[];
  timestamp: string;}

interface AuditResult {audits: Audit[];
  total: number;
  passed: number;
  failed: number;}

interface AuditStats {[key: string]: number;}

function App() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [stats, setStats] = useState<AuditStats>({});
  const [loading, setLoading] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [runningAudit, setRunningAudit] = useState(false);

  useEffect(() =>{loadAudits();
    loadStats();}, []);

  const loadAudits = async () => {try {
      setLoading(true);
      const result: AuditResult = await invoke('get_audits');
      setAudits(result.audits);} catch (error) {console.error('Failed to load audits:', error);} finally {setLoading(false);}
  };

  const loadStats = async () => {try {
      const stats: AuditStats = await invoke('get_audit_stats');
      setStats(stats);} catch (error) {console.error('Failed to load stats:', error);}
  };

  const runNewAudit = async () => {if (!newUrl.trim()) return;

    try {
      setRunningAudit(true);
      const audit: Audit = await invoke('run_audit', { url: newUrl});
      setAudits(prev => [audit, ...prev]);
      setNewUrl('');
      loadStats(); // Refresh stats
    } catch (error) {console.error('Failed to run audit:', error);} finally {setRunningAudit(false);}
  };

  const getStatusIcon = (status: string) => {switch (status) {
      case 'passed':
        return<CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <Warning className="w-5 h-5 text-yellow-500" />;
      default:
        return <Shield className="w-5 h-5 text-gray-500" />;}
  };

  const getScoreColor = (score: number) =>{if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';};

  return (<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100"><div className="container mx-auto px-4 py-8">{/* Header */}<div className="flex items-center justify-between mb-8"><div className="flex items-center space-x-3"><Shield className="w-8 h-8 text-blue-600" /><h1 className="text-3xl font-bold text-gray-900">Web Audit Tracker</h1></div><div className="text-sm text-gray-500">Terrafusion Championship Edition</div></div>{/* Stats Cards */}<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"><div className="bg-white rounded-lg shadow-md p-6"><div className="flex items-center justify-between"><div><><p className="text-sm font-medium text-gray-600">Total Audits</p><p
</>
className="text-2xl font-bold text-gray-900">{stats.total || 0}</p></div><Globe className="w-8 h-8 text-blue-500" /></div></div><div className="bg-white rounded-lg shadow-md p-6"><div className="flex items-center justify-between"><div><><p className="text-sm font-medium text-gray-600">Passed</p><p
</>
className="text-2xl font-bold text-green-600">{stats.passed || 0}</p></div><CheckCircle className="w-8 h-8 text-green-500" /></div></div><div className="bg-white rounded-lg shadow-md p-6"><div className="flex items-center justify-between"><div><><p className="text-sm font-medium text-gray-600">Failed</p><p
</>
className="text-2xl font-bold text-red-600">{stats.failed || 0}</p></div><XCircle className="w-8 h-8 text-red-500" /></div></div><div className="bg-white rounded-lg shadow-md p-6"><div className="flex items-center justify-between"><div><><p className="text-sm font-medium text-gray-600">Avg Score</p><p
</>className={`text-2xl font-bold ${getScoreColor(stats.average_score || 0)}`}>
                  {stats.average_score || 0}</p></div><TrendingUp className="w-8 h-8 text-blue-500" /></div></div></div>{/* New Audit Form */}<div className="bg-white rounded-lg shadow-md p-6 mb-8"><><h3 className="text-lg font-semibold text-gray-900 mb-4">Run New Audit</h3><div
</>
className="flex space-x-4"><div className="flex-1"><><input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="Enter URL to audit (e.g., https://example.com)"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={runningAudit}
              /></div><button
</>onClick={runNewAudit}
              disabled={runningAudit || !newUrl.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {runningAudit ? (<Refresh className="w-4 h-4 animate-spin" />) : (<Search className="w-4 h-4" />)}<span>{runningAudit ? 'Running...' : 'Run Audit'}</span></button></div></div>{/* Audits List */}<div className="bg-white rounded-lg shadow-md"><div className="px-6 py-4 border-b border-gray-200"><div className="flex items-center justify-between"><><h3 className="text-lg font-semibold text-gray-900">Recent Audits</h3><button
</>onClick={loadAudits}
                disabled={loading}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Refresh'}</button></div></div><div className="divide-y divide-gray-200">{audits.length === 0 ? (<div className="px-6 py-8 text-center text-gray-500">No audits found. Run your first audit above!</div>) : (
              audits.map((audit) => (<div key={audit.id} className="px-6 py-4 hover:bg-gray-50"><div className="flex items-center justify-between"><div className="flex-1"><div className="flex items-center space-x-3">{getStatusIcon(audit.status)}<div><><p className="text-sm font-medium text-gray-900">{audit.url}</p><p
</>className="text-xs text-gray-500">
                            {new Date(audit.timestamp).toLocaleString()}</p></div></div>{audit.issues.length > 0 && (<div className="mt-2 ml-8"><><p className="text-xs text-gray-600 font-medium">Issues:</p><ul
</>className="text-xs text-red-600 mt-1">
                            {audit.issues.map((issue /* , index */) => (<li key={index} className="flex items-center space-x-1"><><span>•</span><span
</></>>{issue}</span></li>))}</ul></div>)}</div><div className="text-right"><><p className={`text-lg font-bold ${getScoreColor(audit.score)}`}>{audit.score}</p><p
</>
className="text-xs text-gray-500 capitalize">{audit.status}</p></div></div></div>))
            )}</div></div></div></div>
  );
}

export default App;