import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import './DashboardPage.css';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, Cell, CartesianGrid, Legend, Area, AreaChart,
  PieChart, Pie, RadialBarChart, RadialBar
} from 'recharts';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast, ToastContainer } from 'react-toastify';
import Papa from 'papaparse';
import 'react-toastify/dist/ReactToastify.css';

// Type definitions
interface Plugin {
  id: string;
  name: string;
  version?: string;
  tags?: string[];
  categories?: string[];
  owner?: string;
  changelog?: string[];
  description?: string;
  api?: string;
  k8s?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface EnrichedPlugin extends Plugin {
  healthy: boolean;
  launchCount: number;
  errors: string[];
  onboarding: string[];
  uptime: number | null;
  errorTrend: ErrorTrendPoint[];
  lastDeployment?: string;
  deploymentCount?: number;
}

interface ErrorTrendPoint {
  timestamp: string;
  count: number;
}

interface UptimeHistoryPoint {
  timestamp: string;
  uptime: number;
}

interface AdminAction {
  pluginId: string;
  action: string;
  timestamp: number;
  user?: string;
  status?: 'success' | 'failed';
  details?: any;
}

interface PluginVersion {
  version: string;
  deployedAt: string;
  deployedBy?: string;
  changelog?: string[];
  size?: number;
  hash?: string;
}

interface DashboardData {
  plugins: EnrichedPlugin[];
  trends: Record<string, number>;
  errors: Record<string, string[]>;
  onboarding: Record<string, string[]>;
  uptime: Record<string, number>;
  errorTrends: Record<string, ErrorTrendPoint[]>;
  uptimeHistory: Record<string, UptimeHistoryPoint[]>;
  adminActions: Record<string, AdminAction[]>;
  pluginVersions: Record<string, PluginVersion[]>;
}

interface LogEntry {
  timestamp: string;
  message: string;
  level?: 'info' | 'warning' | 'error';
  pluginId?: string;
}

interface WebSocketMessage {
  type: 'refresh' | 'plugin_update' | 'error' | 'log' | 'uptime' | 'admin_action' | 'version_update';
  payload?: any;
  pluginId?: string;
  timestamp?: string;
  uptime?: number;
}

interface FileUploadState {
  pluginId: string;
  file: File;
  progress: number;
}

interface ExportOptions {
  format: 'json' | 'csv';
  includeHistory?: boolean;
  includeAdminActions?: boolean;
  dateRange?: { start: Date; end: Date };
}

type FilterType = 'all' | 'unhealthy' | 'launched' | 'low-uptime' | 'recently-deployed' | 'high-error';
type SortKey = 'name' | 'healthy' | 'launchCount' | 'version' | 'owner' | 'uptime' | 'errors' | 'lastDeployment';
type AdminActionType = 'restart' | 'scale' | 'pause' | 'resume' | 'update' | 'deploy' | 'rollback';

const WEBSOCKET_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3000/ws/plugin-events';
const RECONNECT_INTERVAL = 5000;
const MAX_RECONNECT_ATTEMPTS = 10;
const MAX_LOG_ENTRIES = 50;
const MAX_UPTIME_POINTS = 60;
const LOW_UPTIME_THRESHOLD = 0.9;
const HIGH_ERROR_THRESHOLD = 10;
const ALLOWED_FILE_TYPES = ['.zip', '.tar', '.tar.gz', '.tgz'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export function DashboardPage() {
  // State management
  const [data, setData] = useState<DashboardData>({
    plugins: [],
    trends: {},
    errors: {},
    onboarding: {},
    uptime: {},
    errorTrends: {},
    uptimeHistory: {},
    adminActions: {},
    pluginVersions: {}
  });
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [modalPlugin, setModalPlugin] = useState<EnrichedPlugin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [adminLoading, setAdminLoading] = useState<string | null>(null);
  const [expandedPlugins, setExpandedPlugins] = useState<Set<string>>(new Set());
  const [uploadStates, setUploadStates] = useState<Map<string, FileUploadState>>(new Map());
  const [rollbackPluginId, setRollbackPluginId] = useState<string | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    includeHistory: true,
    includeAdminActions: true
  });

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (showLogs && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, showLogs]);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      setWsStatus('connecting');
      wsRef.current = new WebSocket(WEBSOCKET_URL);

      wsRef.current.onopen = () => {
        console.log('Dashboard WebSocket connected');
        setWsStatus('connected');
        reconnectAttemptsRef.current = 0;
        addLog('WebSocket connected', 'info');
        toast.success('Connected to real-time updates', { autoClose: 2000 });
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'refresh':
            case 'plugin_update':
              fetchDashboardData();
              break;
              
            case 'log':
              if (message.payload) {
                const logMessage = typeof message.payload === 'string' 
                  ? message.payload 
                  : message.payload.message || JSON.stringify(message.payload);
                addLog(
                  logMessage,
                  message.payload.level || 'info',
                  message.payload.pluginId
                );
              }
              break;
              
            case 'uptime':
              if (message.pluginId && message.timestamp && message.uptime !== undefined) {
                updateUptimeHistory(message.pluginId, message.timestamp, message.uptime);
              }
              break;
              
            case 'admin_action':
              if (message.payload) {
                updateAdminActions(message.payload);
              }
              break;
              
            case 'version_update':
              if (message.pluginId && message.payload) {
                updatePluginVersion(message.pluginId, message.payload);
              }
              break;
              
            case 'error':
              addLog(`WebSocket error: ${message.payload}`, 'error');
              toast.error('Real-time update error', { autoClose: 3000 });
              break;
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsStatus('disconnected');
        addLog('WebSocket error', 'error');
      };

      wsRef.current.onclose = () => {
        console.log('Dashboard WebSocket disconnected');
        setWsStatus('disconnected');
        addLog('WebSocket disconnected', 'warning');
        toast.warning('Disconnected from real-time updates', { autoClose: 3000 });

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          const delay = RECONNECT_INTERVAL * Math.min(reconnectAttemptsRef.current, 3);
          
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        } else {
          toast.error('Failed to establish real-time connection', { autoClose: 5000 });
        }
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setWsStatus('disconnected');
    }
  }, []);

  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Update uptime history
  const updateUptimeHistory = useCallback((pluginId: string, timestamp: string, uptime: number) => {
    setData(prev => {
      const history = prev.uptimeHistory[pluginId] || [];
      const newPoint = { timestamp, uptime };
      const updatedHistory = [...history, newPoint].slice(-MAX_UPTIME_POINTS);
      
      return {
        ...prev,
        uptimeHistory: {
          ...prev.uptimeHistory,
          [pluginId]: updatedHistory
        }
      };
    });
  }, []);

  // Update admin actions
  const updateAdminActions = useCallback((action: AdminAction) => {
    setData(prev => {
      const actions = prev.adminActions[action.pluginId] || [];
      return {
        ...prev,
        adminActions: {
          ...prev.adminActions,
          [action.pluginId]: [...actions, action].slice(-20) // Keep last 20 actions
        }
      };
    });
  }, []);

  // Update plugin version
  const updatePluginVersion = useCallback((pluginId: string, version: PluginVersion) => {
    setData(prev => {
      const versions = prev.pluginVersions[pluginId] || [];
      const exists = versions.some(v => v.version === version.version);
      
      if (!exists) {
        return {
          ...prev,
          pluginVersions: {
            ...prev.pluginVersions,
            [pluginId]: [version, ...versions].slice(0, 10) // Keep last 10 versions
          }
        };
      }
      
      return prev;
    });
  }, []);

  // Add log entry
  const addLog = useCallback((message: string, level: LogEntry['level'] = 'info', pluginId?: string) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      message,
      level,
      pluginId
    };

    setLogs(prev => {
      const newLogs = [...prev, entry];
      return newLogs.slice(-MAX_LOG_ENTRIES);
    });
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    controllerRef.current = new AbortController();
    const { signal } = controllerRef.current;

    try {
      setError(null);
      
      // Get plugin list
      const idsRes = await fetch('/marketplace/plugins/sidebar.json', { signal });
      if (!idsRes.ok) throw new Error('Failed to fetch plugin list');
      
      const plugins: Plugin[] = await idsRes.json();
      const ids = plugins.map(p => p.id);

      // Parallel fetch all data
      const [
        healthRes, usageRes, errorRes, onboardRes, 
        uptimeRes, errorTrendsRes, uptimeHistoryRes,
        adminActionsRes, pluginVersionsRes
      ] = await Promise.all([
        fetch('/api/plugin-health', {
          method: 'POST',
          body: JSON.stringify(ids),
          headers: { 'Content-Type': 'application/json' },
          signal
        }),
        fetch('/api/launch-trends', {
          method: 'POST',
          body: JSON.stringify(ids),
          headers: { 'Content-Type': 'application/json' },
          signal
        }),
        fetch('/api/plugin-errors', {
          method: 'POST',
          body: JSON.stringify(ids),
          headers: { 'Content-Type': 'application/json' },
          signal
        }),
        fetch('/api/plugin-onboarding', {
          method: 'POST',
          body: JSON.stringify(ids),
          headers: { 'Content-Type': 'application/json' },
          signal
        }),
        fetch('/api/plugin-uptime', {
          method: 'POST',
          body: JSON.stringify(ids),
          headers: { 'Content-Type': 'application/json' },
          signal
        }),
        fetch('/api/plugin-error-trends', {
          method: 'POST',
          body: JSON.stringify(ids),
          headers: { 'Content-Type': 'application/json' },
          signal
        }),
        fetch('/api/plugin-uptime-history', {
          method: 'POST',
          body: JSON.stringify(ids),
          headers: { 'Content-Type': 'application/json' },
          signal
        }),
        fetch('/api/plugin-admin-actions', {
          method: 'POST',
          body: JSON.stringify(ids),
          headers: { 'Content-Type': 'application/json' },
          signal
        }),
        fetch('/api/plugin-versions', {
          method: 'POST',
          body: JSON.stringify(ids),
          headers: { 'Content-Type': 'application/json' },
          signal
        })
      ]);

      // Parse responses with error handling
      const [
        health, usage, errors, onboarding, 
        uptime, errorTrends, uptimeHistory,
        adminActions, pluginVersions
      ] = await Promise.all([
        healthRes.ok ? healthRes.json() : {},
        usageRes.ok ? usageRes.json() : {},
        errorRes.ok ? errorRes.json() : {},
        onboardRes.ok ? onboardRes.json() : {},
        uptimeRes.ok ? uptimeRes.json() : {},
        errorTrendsRes.ok ? errorTrendsRes.json() : {},
        uptimeHistoryRes.ok ? uptimeHistoryRes.json() : {},
        adminActionsRes.ok ? adminActionsRes.json() : {},
        pluginVersionsRes.ok ? pluginVersionsRes.json() : {}
      ]);

      // Enrich plugin data
      const enriched: EnrichedPlugin[] = plugins.map(p => {
        const versions = pluginVersions[p.id] || [];
        const lastVersion = versions[0];
        
        return {
          ...p,
          healthy: health[p.id] ?? true,
          launchCount: usage[p.id] ?? 0,
          errors: errors[p.id] ?? [],
          onboarding: onboarding[p.id] ?? [],
          tags: p.tags ?? [],
          categories: p.categories ?? [],
          owner: p.owner ?? '—',
          version: p.version ?? 'unknown',
          changelog: p.changelog ?? [],
          uptime: uptime[p.id] ?? null,
          errorTrend: errorTrends[p.id] ?? [],
          lastDeployment: lastVersion?.deployedAt,
          deploymentCount: versions.length
        };
      });

      // Merge with existing uptime history to preserve real-time updates
      const mergedUptimeHistory = { ...uptimeHistory };
      Object.keys(data.uptimeHistory).forEach(pluginId => {
        if (data.uptimeHistory[pluginId].length > 0) {
          mergedUptimeHistory[pluginId] = data.uptimeHistory[pluginId];
        }
      });

      setData({ 
        plugins: enriched, 
        trends: usage, 
        errors, 
        onboarding, 
        uptime, 
        errorTrends,
        uptimeHistory: mergedUptimeHistory,
        adminActions: adminActions || {},
        pluginVersions: pluginVersions || {}
      });
      setLastRefresh(new Date());
      setLoading(false);
      addLog('Dashboard data refreshed', 'info');
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to fetch dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
        setLoading(false);
        addLog(`Failed to fetch data: ${err.message}`, 'error');
        toast.error('Failed to load dashboard data');
      }
    }
  }, [addLog, data.uptimeHistory]);

  // Handle admin actions
  const handleAdminAction = useCallback(async (pluginId: string, action: AdminActionType) => {
    setAdminLoading(`${pluginId}-${action}`);
    
    try {
      // Execute admin action
      const actionRes = await fetch(`/api/admin/${action}`, {
        method: 'POST',
        body: JSON.stringify({ pluginId }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (!actionRes.ok) {
        throw new Error(`Admin action failed: ${actionRes.statusText}`);
      }

      // Log telemetry
      const telemetryData = { 
        pluginId, 
        action, 
        timestamp: Date.now(),
        user: 'dashboard-admin',
        status: 'success'
      };

      await fetch('/api/telemetry/admin-action', {
        method: 'POST',
        body: JSON.stringify(telemetryData),
        headers: { 'Content-Type': 'application/json' }
      });

      // Update local admin actions
      updateAdminActions(telemetryData as AdminAction);

      addLog(`Admin action '${action}' executed for ${pluginId}`, 'info', pluginId);
      toast.success(`${action} triggered for ${pluginId}`, {
        position: 'bottom-right',
        autoClose: 3000
      });
      
      // Refresh data after action
      setTimeout(fetchDashboardData, 1000);
    } catch (err: any) {
      console.error('Admin action failed:', err);
      addLog(`Admin action '${action}' failed for ${pluginId}: ${err.message}`, 'error', pluginId);
      toast.error(`Failed to ${action} ${pluginId}`, {
        position: 'bottom-right',
        autoClose: 5000
      });
    } finally {
      setAdminLoading(null);
    }
  }, [addLog, fetchDashboardData, updateAdminActions]);

  // Handle version rollback
  const handleRollback = useCallback(async (pluginId: string, version: string) => {
    if (!version) return;

    try {
      const res = await fetch('/api/admin/rollback', {
        method: 'POST',
        body: JSON.stringify({ pluginId, version }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        throw new Error('Rollback failed');
      }

      // Log telemetry
      await fetch('/api/telemetry/admin-action', {
        method: 'POST',
        body: JSON.stringify({ 
          pluginId, 
          action: 'rollback',
          version,
          timestamp: Date.now()
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      toast.success(`Rolled back ${pluginId} to version ${version}`, {
        position: 'bottom-right',
        autoClose: 5000
      });
      
      setRollbackPluginId(null);
      fetchDashboardData();
    } catch (err) {
      toast.error(`Failed to rollback ${pluginId}`, {
        position: 'bottom-right',
        autoClose: 5000
      });
    }
  }, [fetchDashboardData]);

  // Validate file upload
  const validateFile = (file: File): string | null => {
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!ALLOWED_FILE_TYPES.includes(extension)) {
      return `Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }
    
    return null;
  };

  // Handle file upload
  const handleUpload = useCallback(async (pluginId: string, file: File) => {
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    // Update upload state
    setUploadStates(prev => new Map(prev).set(pluginId, {
      pluginId,
      file,
      progress: 0
    }));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('pluginId', pluginId);
    
    toast.info(`Deploying ${pluginId}...`, {
      position: 'bottom-right',
      autoClose: false,
      toastId: `deploy-${pluginId}`
    });

    try {
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          setUploadStates(prev => {
            const newStates = new Map(prev);
            const state = newStates.get(pluginId);
            if (state) {
              state.progress = progress;
            }
            return newStates;
          });
          
          toast.update(`deploy-${pluginId}`, {
            render: `Deploying ${pluginId}: ${Math.round(progress)}%`,
            type: 'info'
          });
        }
      });

      // Handle completion
      await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.response);
          } else {
            reject(new Error(`Deploy failed: ${xhr.statusText}`));
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        
        xhr.open('POST', '/api/admin/deploy');
        xhr.send(formData);
      });

      // Log telemetry
      await fetch('/api/telemetry/admin-action', {
        method: 'POST',
        body: JSON.stringify({ 
          pluginId, 
          action: 'deploy',
          filename: file.name,
          fileSize: file.size,
          timestamp: Date.now()
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      addLog(`Deployed new version of ${pluginId} (${file.name})`, 'info', pluginId);
      toast.update(`deploy-${pluginId}`, {
        render: `${pluginId} deployed successfully!`,
        type: 'success',
        autoClose: 5000
      });

      // Refresh data
      setTimeout(fetchDashboardData, 2000);
    } catch (err: any) {
      console.error('Deploy failed:', err);
      addLog(`Deploy failed for ${pluginId}: ${err.message}`, 'error', pluginId);
      toast.update(`deploy-${pluginId}`, {
        render: `Failed to deploy ${pluginId}: ${err.message}`,
        type: 'error',
        autoClose: 5000
      });
    } finally {
      // Clean up upload state
      setUploadStates(prev => {
        const newStates = new Map(prev);
        newStates.delete(pluginId);
        return newStates;
      });
      
      // Reset file input
      const input = fileInputRefs.current.get(pluginId);
      if (input) {
        input.value = '';
      }
    }
  }, [addLog, fetchDashboardData]);

  // Export data
  const handleExport = useCallback((format: 'json' | 'csv') => {
    try {
      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === 'json') {
        // Prepare JSON export
        const exportData = {
          exportedAt: new Date().toISOString(),
          plugins: data.plugins,
          ...(exportOptions.includeHistory && {
            uptimeHistory: data.uptimeHistory,
            errorTrends: data.errorTrends
          }),
          ...(exportOptions.includeAdminActions && {
            adminActions: data.adminActions
          }),
          metadata: {
            totalPlugins: data.plugins.length,
            healthyPlugins: data.plugins.filter(p => p.healthy).length,
            totalLaunches: Object.values(data.trends).reduce((sum, count) => sum + count, 0)
          }
        };
        
        content = JSON.stringify(exportData, null, 2);
        filename = `terrafusion_dashboard_${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      } else {
        // Prepare CSV export
        const csvData = data.plugins.map(plugin => ({
          ID: plugin.id,
          Name: plugin.name,
          Version: plugin.version,
          Status: plugin.healthy ? 'Healthy' : 'Unhealthy',
          Launches: plugin.launchCount,
          Errors: plugin.errors.length,
          Uptime: plugin.uptime ? `${(plugin.uptime * 100).toFixed(1)}%` : 'N/A',
          Owner: plugin.owner,
          LastDeployment: plugin.lastDeployment || 'N/A',
          Tags: plugin.tags.join(', '),
          Categories: plugin.categories.join(', ')
        }));
        
        content = Papa.unparse(csvData);
        filename = `terrafusion_dashboard_${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      }

      // Create and trigger download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported data as ${format.toUpperCase()}`, {
        position: 'bottom-right',
        autoClose: 3000
      });
      
      addLog(`Exported dashboard data as ${format.toUpperCase()}`, 'info');
    } catch (err) {
      toast.error(`Failed to export data`, {
        position: 'bottom-right',
        autoClose: 5000
      });
    }
  }, [data, exportOptions, addLog]);

  // Toggle plugin expansion
  const togglePluginExpansion = useCallback((pluginId: string) => {
    setExpandedPlugins(prev => {
      const next = new Set(prev);
      if (next.has(pluginId)) {
        next.delete(pluginId);
      } else {
        next.add(pluginId);
      }
      return next;
    });
  }, []);

  // Initialize WebSocket and data
  useEffect(() => {
    connectWebSocket();
    fetchDashboardData();

    return () => {
      disconnectWebSocket();
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, [connectWebSocket, disconnectWebSocket, fetchDashboardData]);

  // Filtered plugins
  const filteredPlugins = useMemo(() => {
    return data.plugins.filter(p => {
      switch (filter) {
        case 'unhealthy':
          return !p.healthy;
        case 'launched':
          return p.launchCount > 0;
        case 'low-uptime':
          const lastUptime = data.uptimeHistory[p.id]?.slice(-1)[0]?.uptime ?? 1;
          return lastUptime < LOW_UPTIME_THRESHOLD;
        case 'recently-deployed':
          if (!p.lastDeployment) return false;
          const daysSinceDeployment = (Date.now() - new Date(p.lastDeployment).getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceDeployment <= 7; // Last 7 days
        case 'high-error':
          return p.errors.length >= HIGH_ERROR_THRESHOLD;
        default:
          return true;
      }
    });
  }, [data.plugins, data.uptimeHistory, filter]);

  // Sorted plugins
  const sortedPlugins = useMemo(() => {
    return [...filteredPlugins].sort((a, b) => {
      let v1: any = a[sortKey];
      let v2: any = b[sortKey];

      // Special handling for complex fields
      if (sortKey === 'errors') {
        v1 = a.errors.length;
        v2 = b.errors.length;
      } else if (sortKey === 'lastDeployment') {
        v1 = a.lastDeployment ? new Date(a.lastDeployment).getTime() : 0;
        v2 = b.lastDeployment ? new Date(b.lastDeployment).getTime() : 0;
      }

      // Handle null/undefined values
      if (v1 == null) v1 = '';
      if (v2 == null) v2 = '';

      // Compare values
      if (typeof v1 === 'string' && typeof v2 === 'string') {
        return v1.localeCompare(v2) * (sortAsc ? 1 : -1);
      }
      return (v1 < v2 ? -1 : 1) * (sortAsc ? 1 : -1);
    });
  }, [filteredPlugins, sortKey, sortAsc]);

  // Dashboard statistics
  const dashboardStats = useMemo(() => {
    const totalPlugins = data.plugins.length;
    const healthyPlugins = data.plugins.filter(p => p.healthy).length;
    const totalLaunches = Object.values(data.trends).reduce((sum, count) => sum + count, 0);
    const avgUptime = data.plugins.reduce((sum, p) => sum + (p.uptime || 0), 0) / totalPlugins;
    const totalErrors = data.plugins.reduce((sum, p) => sum + p.errors.length, 0);

    return {
      totalPlugins,
      healthyPlugins,
      unhealthyPlugins: totalPlugins - healthyPlugins,
      totalLaunches,
      avgUptime,
      totalErrors,
      healthPercentage: totalPlugins > 0 ? (healthyPlugins / totalPlugins) * 100 : 0
    };
  }, [data.plugins, data.trends]);

  // Get WebSocket status icon
  const getWsStatusIcon = () => {
    switch (wsStatus) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'disconnected': return '🔴';
    }
  };

  // Get log level color
  const getLogLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return '#ff4d4f';
      case 'warning': return '#faad14';
      default: return '#52c41a';
    }
  };

  // Format uptime percentage
  const formatUptime = (uptime: number | null) => {
    if (uptime === null) return '—';
    const percentage = uptime * 100;
    return `${percentage.toFixed(1)}%`;
  };

  // Get current uptime from history
  const getCurrentUptime = (pluginId: string) => {
    const history = data.uptimeHistory[pluginId];
    if (!history || history.length === 0) return null;
    return history[history.length - 1].uptime;
  };

  // Get uptime color
  const getUptimeColor = (uptime: number | null) => {
    if (uptime === null) return '#8884d8';
    if (uptime >= 0.99) return '#52c41a';
    if (uptime >= 0.95) return '#faad14';
    return '#ff4d4f';
  };

  // Format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error" role="alert"><>

        <h2>Error Loading Dashboard</h2>
        <p
</>
</>>{error}</p>
        <Button onClick={fetchDashboardData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="dashboard" role="main">
      <ToastContainer
        position="bottom-right"
        theme="dark"
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <header className="dashboard-header">
        <div><>

          <h1>🧠 Terrafusion Plugin Dashboard</h1>
          <div
</>
className="dashboard-stats">
            <span className="stat-pill">
              <strong>{dashboardStats.totalPlugins}</strong> Plugins
            </span>
            <span className="stat-pill healthy">
              <strong>{dashboardStats.healthyPlugins}</strong> Healthy
            </span>
            <span className="stat-pill">
              <strong>{dashboardStats.totalLaunches}</strong> Launches
            </span>
            <span className="stat-pill">
              <strong>{formatUptime(dashboardStats.avgUptime)}</strong> Avg Uptime
            </span>
          </div>
        </div>
        <div className="header-status">
          <span className="ws-indicator" title={`WebSocket: ${wsStatus}`}>
            {getWsStatusIcon()}
          </span>
        </div>
      </header>

      <div className="dashboard-controls">
        <div className="control-group"><>

          <label htmlFor="filter">Filter:</label>
          <select
</>

            id="filter"
            value={filter} 
            onChange={(e) => setFilter(e.target.value as FilterType)}
          ><>

            <option value="all">All ({data.plugins.length})</option>
            <option
</>
value="unhealthy">
              Unhealthy ({data.plugins.filter(p => !p.healthy).length})
            </option><>

            <option value="launched">
              Launched ({data.plugins.filter(p => p.launchCount > 0).length})
            </option>
            <option
</>
value="low-uptime">
              Low Uptime ({data.plugins.filter(p => {
                const uptime = getCurrentUptime(p.id);
                return uptime !== null && uptime < LOW_UPTIME_THRESHOLD;
              }).length})
            </option>
            <option value="recently-deployed">
              Recently Deployed ({data.plugins.filter(p => {
                if (!p.lastDeployment) return false;
                const days = (Date.now() - new Date(p.lastDeployment).getTime()) / (1000 * 60 * 60 * 24);
                return days <= 7;
              }).length})
            </option>
            <option value="high-error">
              High Error ({data.plugins.filter(p => p.errors.length >= HIGH_ERROR_THRESHOLD).length})
            </option>
          </select><>

          <label htmlFor="sort">Sort:</label>
          <select
</>

            id="sort"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          ><>

            <option value="name">Name</option>
            <option
</>
value="healthy">Status</option><>

            <option value="launchCount">Launches</option>
            <option
</>
value="uptime">Uptime</option><>

            <option value="errors">Errors</option>
            <option
</>
value="lastDeployment">Last Deployment</option>
            <option value="version">Version</option>
          </select>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSortAsc(!sortAsc)}
            title={sortAsc ? 'Sort descending' : 'Sort ascending'}
          >
            {sortAsc ? '↑' : '↓'}
          </Button>
        </div>

        <div className="control-actions"><>

          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              fetchDashboardData();
              toast.info('Refreshing dashboard...', { autoClose: 1000 });
            }}
          >
            🔄 Refresh
          </Button>
          
          <Button
</>

            size="sm"
            variant="outline"
            onClick={() => setShowLogs(!showLogs)}
          >
            📋 {showLogs ? 'Hide' : 'Show'} Logs ({logs.length})
          </Button><>

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExport('json')}
          >
            📥 Export JSON
          </Button>

          <Button
</>

            size="sm"
            variant="outline"
            onClick={() => handleExport('csv')}
          >
            📊 Export CSV
          </Button>

          {lastRefresh && (
            <span className="last-update">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          )}

          <a href="/admin" className="admin-shell-link">
            ↪ Admin Shell
          </a>
        </div>
      </div>

      {/* Dashboard Overview Charts */}
      <div className="dashboard-overview">
        <div className="overview-chart"><>

          <h3>Plugin Health Distribution</h3>
          <ResponsiveContainer
</>
width="100%" height={200}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Healthy', value: dashboardStats.healthyPlugins, fill: '#52c41a' },
                  { name: 'Unhealthy', value: dashboardStats.unhealthyPlugins, fill: '#ff4d4f' }
                ]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {[0, 1].map((index) => (<>

                  <Cell key={`cell-${index}`} />
                ))}
              </Pie>
              <Tooltip
</>
/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="overview-chart"><>

          <h3>Top 5 Most Launched</h3>
          <ResponsiveContainer
</>
width="100%" height={200}>
            <BarChart
              data={data.plugins
                .sort((a, b) => b.launchCount - a.launchCount)
                .slice(0, 5)
                .map(p => ({ name: p.name, launches: p.launchCount }))
              }
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="launches" fill="#007acc" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Log Panel */}
      {showLogs && (
        <div className="log-panel" role="log"><>

          <h3>System Logs</h3>
          <div
</>
className="log-entries">
            {logs.length === 0 ? (
              <div className="log-empty">No logs yet...</div>
            ) : (
              logs.map((log, i) => (
                <div 
                  key={i} 
                  className="log-entry"
                  style={{ color: getLogLevelColor(log.level) }}
                >
                  <span className="log-time">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  {log.pluginId && (
                    <span className="log-plugin">[{log.pluginId}]</span>
                  )}
                  <span className="log-message">{log.message}</span>
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        </div>
      )}

      {/* Plugin Cards */}
      <div className="plugin-grid">
        {sortedPlugins.map((plugin) => {
          const isExpanded = expandedPlugins.has(plugin.id);
          const uptimeData = data.uptimeHistory[plugin.id] || [];
          const currentUptime = getCurrentUptime(plugin.id);
          const uploadState = uploadStates.get(plugin.id);
          const versions = data.pluginVersions[plugin.id] || [];
          const recentActions = (data.adminActions[plugin.id] || []).slice(-3);
          
          return (
            <div 
              key={plugin.id} 
              className={`plugin-card ${!plugin.healthy ? 'unhealthy' : ''} ${currentUptime !== null && currentUptime < LOW_UPTIME_THRESHOLD ? 'low-uptime' : ''}`}
            >
              <div className="plugin-header">
                <div className="plugin-title"><>

                  <h2>{plugin.name}</h2>
                  <span
</>
className="plugin-version">v{plugin.version}</span>
                  <span 
                    className={`health-badge ${plugin.healthy ? 'healthy' : 'unhealthy'}`}
                    title={plugin.healthy ? 'Healthy' : 'Unhealthy'}
                  >
                    {plugin.healthy ? '🟢' : '🔴'}
                  </span>
                </div>

                <div className="plugin-actions"><>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => togglePluginExpansion(plugin.id)}
                  >
                    {isExpanded ? '▼' : '▶'} Details
                  </Button>
                  
                  <Button
</>

                    size="sm"
                    disabled={adminLoading === `${plugin.id}-restart`}
                    onClick={() => handleAdminAction(plugin.id, 'restart')}
                    title="Restart plugin"
                  >
                    {adminLoading === `${plugin.id}-restart` ? '...' : '🔄'}
                  </Button><>

                  <Button
                    size="sm"
                    disabled={adminLoading === `${plugin.id}-scale`}
                    onClick={() => handleAdminAction(plugin.id, 'scale')}
                    title="Scale plugin"
                  >
                    {adminLoading === `${plugin.id}-scale` ? '...' : '📊'}
                  </Button>

                  <label
</>
className="deploy-button" title="Deploy new version"><>

                    <span className="deploy-icon">📦</span>
                    <input
</>

                      ref={(el) => {
                        if (el) fileInputRefs.current.set(plugin.id, el);
                      }}
                      type="file"
                      hidden
                      accept={ALLOWED_FILE_TYPES.join(',')}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(plugin.id, file);
                      }}
                    />
                  </label>

                  <Button
                    size="sm"
                    onClick={() => setRollbackPluginId(rollbackPluginId === plugin.id ? null : plugin.id)}
                    title="Rollback version"
                  >
                    ⏪
                  </Button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="plugin-stats">
                <div className="stat"><>

                  <span className="stat-label">Launches</span>
                  <span
</>
className="stat-value">{plugin.launchCount}</span>
                </div>
                <div className="stat"><>

                  <span className="stat-label">Uptime</span>
                  <span
</>

                    className="stat-value"
                    style={{ color: getUptimeColor(currentUptime) }}
                  >
                    {formatUptime(currentUptime)}
                  </span>
                </div>
                <div className="stat"><>

                  <span className="stat-label">Errors</span>
                  <span
</>
className="stat-value error-count">
                    {plugin.errors.length}
                  </span>
                </div>
                <div className="stat"><>

                  <span className="stat-label">Deployments</span>
                  <span
</>
className="stat-value">
                    {plugin.deploymentCount || 0}
                  </span>
                </div>
              </div>

              {/* Version Rollback */}
              {rollbackPluginId === plugin.id && versions.length > 0 && (
                <div className="rollback-section"><>

                  <label>Select Version to Rollback:</label>
                  <select
</>
onChange={(e) => handleRollback(plugin.id, e.target.value)}>
                    <option value="">-- Choose Version --</option>
                    {versions.map(v => (
                      <option key={v.version} value={v.version}>
                        {v.version} ({formatDate(v.deployedAt)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Upload Progress */}
              {uploadState && (
                <div className="upload-progress">
                  <div className="progress-bar"><>

                    <div 
                      className="progress-fill"
                      style={{ width: `${uploadState.progress}%` }}
                    />
                  </div>
                  <span
</>
className="progress-text">
                    Uploading: {Math.round(uploadState.progress)}%
                  </span>
                </div>
              )}

              {/* Uptime Chart */}
              {uptimeData.length > 0 && (
                <div className="uptime-chart">
                  <ResponsiveContainer width="100%" height={120}>
                    <AreaChart data={uptimeData}>
                      <defs>
                        <linearGradient id={`colorUptime-${plugin.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#52c41a" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#52c41a" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(value) => new Date(value).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                        hide
                      />
                      <YAxis 
                        domain={[0, 1]} 
                        tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                        width={45}
                      />
                      <Tooltip 
                        formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                        labelFormatter={(label) => new Date(label).toLocaleString()}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #ddd' 
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="uptime"
                        stroke={getUptimeColor(currentUptime)}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill={`url(#colorUptime-${plugin.id})`}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Expanded Details */}
              {isExpanded && (
                <div className="plugin-details">
                  <div className="detail-section"><>

                    <strong>Deployment Info</strong>
                    <p
</>
</>>Last Deployed: {formatDate(plugin.lastDeployment)}</p>
                    <p>Total Deployments: {plugin.deploymentCount || 0}</p>
                  </div>

                  {recentActions.length > 0 && (
                    <div className="detail-section"><>

                      <strong>Recent Actions</strong>
                      <ul
</>
className="action-list">
                        {recentActions.map((action, i) => (
                          <li key={i}>
                            {action.action} - {formatDate(new Date(action.timestamp).toISOString())}
                            {action.status && <span className={`action-status ${action.status}`}> ({action.status})</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {plugin.tags.length > 0 && (
                    <div className="detail-row"><>

                      <strong>Tags:</strong>
                      <div
</>
className="tag-list">
                        {plugin.tags.map((tag, i) => (
                          <span key={i} className="tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {plugin.errors.length > 0 && (
                    <div className="detail-row"><>

                      <strong>Recent Errors:</strong>
                      <ul
</>
className="error-list">
                        {plugin.errors.slice(0, 3).map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                      {plugin.errors.length > 3 && (
                        <Button
                          size="sm"
                          variant="link"
                          onClick={() => setModalPlugin(plugin)}
                        >
                          View all {plugin.errors.length} errors
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="detail-actions"><>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setModalPlugin(plugin)}
                    >
                      View Full Details
                    </Button>
                    <a
</>

                      href={`/admin/plugin/${plugin.id}`}
                      className="admin-link"
                    >
                      Admin Panel →
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Plugin Detail Modal */}
      {modalPlugin && (
        <Dialog open onOpenChange={() => setModalPlugin(null)}>
          <div className="modal-content"><>

            <h2>{modalPlugin.name} - Full Details</h2>
            
            <div
</>
className="modal-section">
              <p><strong>Version:</strong> {modalPlugin.version}</p>
              <p><strong>Owner:</strong> {modalPlugin.owner}</p>
              <p><strong>Current Uptime:</strong> {formatUptime(getCurrentUptime(modalPlugin.id))}</p>
              <p><strong>Total Launches:</strong> {modalPlugin.launchCount}</p>
              <p><strong>Last Deployment:</strong> {formatDate(modalPlugin.lastDeployment)}</p>
            </div>

            {/* Version History */}
            {data.pluginVersions[modalPlugin.id]?.length > 0 && (
              <div className="modal-section"><>

                <h3>Version History</h3>
                <div
</>
className="version-timeline">
                  {data.pluginVersions[modalPlugin.id].map((version, i) => (
                    <div key={i} className="version-entry"><>

                      <span className="version-number">{version.version}</span>
                      <span
</>
className="version-date">{formatDate(version.deployedAt)}</span>
                      {version.deployedBy && <span className="version-user">by {version.deployedBy}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Actions History */}
            {data.adminActions[modalPlugin.id]?.length > 0 && (
              <div className="modal-section"><>

                <h3>Admin Actions History</h3>
                <div
</>
className="actions-timeline">
                  {data.adminActions[modalPlugin.id].slice(-10).reverse().map((action, i) => (
                    <div key={i} className="action-entry"><>

                      <span className="action-type">{action.action}</span>
                      <span
</>
className="action-time">{formatDate(new Date(action.timestamp).toISOString())}</span>
                      {action.status && <span className={`action-status ${action.status}`}>{action.status}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {modalPlugin.errors.length > 0 && (
              <div className="modal-section"><>

                <h3>All Errors ({modalPlugin.errors.length})</h3>
                <ul
</>
className="error-list-full">
                  {modalPlugin.errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {modalPlugin.errorTrend.length > 0 && (
              <div className="modal-section"><>

                <h3>Error Trend</h3>
                <ResponsiveContainer
</>
width="100%" height={200}>
                  <LineChart data={modalPlugin.errorTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp"
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#ff4d4f" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="modal-actions"><>

              <Button onClick={() => setModalPlugin(null)}>Close</Button>
              <Button
</>

                variant="outline"
                onClick={() => window.open(`/admin/plugin/${modalPlugin.id}`, '_blank')}
              >
                Open Admin Panel
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}