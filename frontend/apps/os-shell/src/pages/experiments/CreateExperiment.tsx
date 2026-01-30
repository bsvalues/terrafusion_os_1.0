import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateExperiment() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [datasetId, setDatasetId] = useState('');
  const [modelId, setModelId] = useState('');
  const [agentCount, setAgentCount] = useState('10');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    const manifest = {
      name,
      datasetId,
      datasetVersion: 'v1',
      modelId: modelId || 'default-model',
      modelVersion: 'latest',
      hyperparams: {},
      swarmConfig: { agentCount: parseInt(agentCount) || 10, tier: 1, timeoutSeconds: 600 },
      seed: Date.now(),
      owner: 'local-dev',
    };

    try {
      const res = await fetch('/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manifest),
      });

      if (!res.ok) throw new Error(await res.text());

      const json = await res.json();
      setMessage(`✓ Created experiment: ${json.id}`);
      setTimeout(() => navigate('/experiments'), 1500);
    } catch (err: any) {
      setMessage(`✗ Error: ${err?.message ?? err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='p-4 max-w-2xl mx-auto'>
      <div className='mb-6'>
        <h2 className='text-3xl font-bold text-cyan-500'>Create Experiment</h2>
        <p className='text-slate-400 mt-2'>
          Configure a new AI experiment with quantum-enhanced parameters
        </p>
      </div>

      <form
        onSubmit={submit}
        className='space-y-6 bg-slate-900/50 backdrop-blur border border-cyan-500/30 rounded-lg p-6'
      >
        <div>
          <label className='block text-sm font-semibold text-cyan-400 mb-2'>
            Experiment Name *
          </label>
          <input
            required
            className='w-full bg-slate-800 border border-cyan-500/30 rounded px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition'
            placeholder='e.g., Property Valuation Model v2'
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className='block text-sm font-semibold text-cyan-400 mb-2'>Dataset ID *</label>
          <input
            required
            className='w-full bg-slate-800 border border-cyan-500/30 rounded px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition'
            placeholder='e.g., county-properties-2024'
            value={datasetId}
            onChange={(e) => setDatasetId(e.target.value)}
          />
        </div>

        <div>
          <label className='block text-sm font-semibold text-cyan-400 mb-2'>Model ID</label>
          <input
            className='w-full bg-slate-800 border border-cyan-500/30 rounded px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition'
            placeholder='e.g., valuation-neural-net (optional)'
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
          />
        </div>

        <div>
          <label className='block text-sm font-semibold text-cyan-400 mb-2'>AI Agent Count</label>
          <input
            type='number'
            min='1'
            max='10000'
            className='w-full bg-slate-800 border border-cyan-500/30 rounded px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition'
            placeholder='10'
            value={agentCount}
            onChange={(e) => setAgentCount(e.target.value)}
          />
          <p className='text-xs text-slate-500 mt-1'>
            Swarm size for quantum-enhanced processing (1-10000)
          </p>
        </div>

        <div className='flex gap-3 pt-4'>
          <button
            type='submit'
            disabled={loading}
            className='flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-cyan-500/20'
          >
            {loading ? 'Creating...' : '✓ Create Experiment'}
          </button>
          <button
            type='button'
            onClick={() => navigate('/experiments')}
            className='px-6 py-3 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600 transition'
          >
            Cancel
          </button>
        </div>
      </form>

      {message && (
        <div
          className={`mt-4 p-4 rounded-lg ${
            message.startsWith('✓')
              ? 'bg-green-900/30 border border-green-500/50 text-green-400'
              : 'bg-red-900/30 border border-red-500/50 text-red-400'
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}
