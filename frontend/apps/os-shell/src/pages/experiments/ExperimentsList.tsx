import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useExperimentsSignalR } from '../../hooks/useExperimentsSignalR';

type Manifest = any;
type Run = {
  id: string;
  status: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
};

export default function ExperimentsList() {
  const [items, setItems] = useState<Manifest[]>([]);
  const [runs, setRuns] = useState<Record<string, Run[]>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/experiments');
        if (!res.ok) throw new Error('fetch failed');
        const list = await res.json();
        setItems(list);
      } catch (err: any) {
        setMsg(err?.message ?? String(err));
      }
    })();
  }, []);

  useExperimentsSignalR((payload) => {
    if (payload.experimentId && payload.runId) {
      loadRunsForExperiment(payload.experimentId);
    }
  });

  const loadRunsForExperiment = async (experimentId: string) => {
    try {
      const res = await fetch(`/api/experiments/${experimentId}/runs`);
      if (!res.ok) return;
      const runList = await res.json();
      setRuns((prev) => ({ ...prev, [experimentId]: runList }));
    } catch {
      // ignore
    }
  };

  const startExperiment = async (experimentId: string) => {
    try {
      const res = await fetch(`/api/experiments/${experimentId}/runs/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startedBy: 'user' }),
      });
      if (!res.ok) throw new Error(await res.text());
      await loadRunsForExperiment(experimentId);
    } catch (err: any) {
      alert(`Error: ${err?.message ?? err}`);
    }
  };

  const toggleExpand = async (experimentId: string) => {
    if (expandedId === experimentId) {
      setExpandedId(null);
    } else {
      setExpandedId(experimentId);
      if (!runs[experimentId]) {
        await loadRunsForExperiment(experimentId);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'running':
        return 'text-blue-600 animate-pulse';
      case 'failed':
        return 'text-red-600';
      case 'queued':
        return 'text-yellow-600';
      default:
        return 'text-slate-600';
    }
  };

  return (
    <div className='p-4 max-w-6xl mx-auto'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-2xl font-bold text-cyan-500'>Experiments</h2>
        <Link
          to='/experiments/create'
          className='px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition'
        >
          Create New
        </Link>
      </div>
      {msg && <div className='text-red-600 mb-4'>{msg}</div>}
      <div className='space-y-3'>
        {items.map((it: any) => (
          <div
            key={it.id}
            className='border border-cyan-500/30 rounded-lg p-4 bg-slate-900/50 backdrop-blur'
          >
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <div className='font-semibold text-lg text-cyan-400'>{it.name}</div>
                <div className='text-sm text-slate-400 mt-1'>
                  Dataset: {it.datasetId} v{it.datasetVersion}
                </div>
                <div className='text-xs text-slate-500 mt-1'>
                  Created: {new Date(it.createdAt).toLocaleString()}
                </div>
              </div>
              <div className='flex gap-2'>
                <button
                  onClick={() => startExperiment(it.id)}
                  className='px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition'
                  title='Start new run'
                >
                  ▶ Start
                </button>
                <button
                  onClick={() => toggleExpand(it.id)}
                  className='px-3 py-1 bg-slate-700 text-white text-sm rounded hover:bg-slate-600 transition'
                >
                  {expandedId === it.id ? '▲ Hide' : '▼ Runs'}
                </button>
              </div>
            </div>
            {expandedId === it.id && (
              <div className='mt-4 pt-4 border-t border-cyan-500/20'>
                <h4 className='text-sm font-semibold text-cyan-400 mb-2'>Run History</h4>
                {runs[it.id]?.length ? (
                  <div className='space-y-2'>
                    {runs[it.id].map((run: Run) => (
                      <div
                        key={run.id}
                        className='text-sm bg-slate-800/50 p-2 rounded flex justify-between items-center'
                      >
                        <div>
                          <span className='font-mono text-xs text-slate-400'>
                            {run.id.substring(0, 8)}
                          </span>
                          <span className={`ml-3 font-semibold ${getStatusColor(run.status)}`}>
                            {run.status}
                          </span>
                        </div>
                        <div className='text-xs text-slate-500'>
                          {new Date(run.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-sm text-slate-500 italic'>
                    No runs yet. Click Start to begin.
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
