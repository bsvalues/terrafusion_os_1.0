// TMR-145: ETL Status Panel - ETL pipeline health/status component
import React, { useState, useEffect, useCallback } from 'react';

/** Status of an individual ETL pipeline */
interface EtlPipelineStatus {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'success' | 'error';
  lastRunAt: string | null;
  recordsProcessed: number;
  errorMessage: string | null;
  durationMs: number | null;
}

/** Overall ETL system status */
interface EtlSystemStatus {
  pipelines: EtlPipelineStatus[];
  lastRefreshed: string;
}

const STATUS_COLORS: Record<EtlPipelineStatus['status'], string> = {
  idle: 'bg-gray-500',
  running: 'bg-blue-500 animate-pulse',
  success: 'bg-green-500',
  error: 'bg-red-500',
};

const STATUS_LABELS: Record<EtlPipelineStatus['status'], string> = {
  idle: 'Idle',
  running: 'Running',
  success: 'Success',
  error: 'Error',
};

/**
 * ETL Status Panel - displays health and status of data mining ETL pipelines.
 * Fetches status from the DataMining API endpoint.
 */
export function EtlStatusPanel() {
  const [systemStatus, setSystemStatus] = useState<EtlSystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/datamining/etl/status');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: EtlSystemStatus = await response.json();
      setSystemStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ETL status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (loading && !systemStatus) {
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-900 p-6">
        <p className="text-gray-400">Loading ETL status...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">ETL Pipeline Status</h2>
        <button
          onClick={fetchStatus}
          className="rounded bg-gray-700 px-3 py-1 text-sm text-gray-300 hover:bg-gray-600"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-700 bg-red-900/30 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {systemStatus && (
        <div className="space-y-3">
          {systemStatus.pipelines.map((pipeline) => (
            <div
              key={pipeline.id}
              className="flex items-center justify-between rounded border border-gray-700 bg-gray-800 p-3"
            >
              <div className="flex items-center gap-3">
                <span className={`h-3 w-3 rounded-full ${STATUS_COLORS[pipeline.status]}`} />
                <div>
                  <p className="text-sm font-medium text-white">{pipeline.name}</p>
                  <p className="text-xs text-gray-400">
                    {pipeline.lastRunAt
                      ? `Last run: ${new Date(pipeline.lastRunAt).toLocaleString()}`
                      : 'Never run'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-300">{STATUS_LABELS[pipeline.status]}</p>
                {pipeline.recordsProcessed > 0 && (
                  <p className="text-xs text-gray-500">
                    {pipeline.recordsProcessed.toLocaleString()} records
                  </p>
                )}
                {pipeline.errorMessage && (
                  <p className="text-xs text-red-400" title={pipeline.errorMessage}>
                    {pipeline.errorMessage.slice(0, 50)}
                  </p>
                )}
              </div>
            </div>
          ))}

          <p className="text-xs text-gray-500">
            Last refreshed: {new Date(systemStatus.lastRefreshed).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
}

export default EtlStatusPanel;
