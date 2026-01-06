import React, { useState } from 'react';
import { FederationNode, SwarmMission } from './types';

// Mock Data
const MOCK_NODES: FederationNode[] = [
  {
    nodeId: 'did:terra:node:benton',
    region: 'US-WA-Benton',
    status: 'active',
    latency: 12,
    coordinates: { x: 150, y: 100 },
  },
  {
    nodeId: 'did:terra:node:yakima',
    region: 'US-WA-Yakima',
    status: 'active',
    latency: 18,
    coordinates: { x: 180, y: 120 },
  },
  {
    nodeId: 'did:terra:node:franklin',
    region: 'US-WA-Franklin',
    status: 'degraded',
    latency: 45,
    coordinates: { x: 160, y: 110 },
  },
  {
    nodeId: 'did:terra:node:king',
    region: 'US-WA-King',
    status: 'active',
    latency: 8,
    coordinates: { x: 120, y: 80 },
  },
];

const MOCK_MISSIONS: SwarmMission[] = [
  {
    id: 'mission-alpha',
    objective: 'Cross-County Tax Assessment Sync',
    activeAgents: 150,
    progress: 45,
  },
  {
    id: 'mission-beta',
    objective: 'Regional Disaster Response Drill',
    activeAgents: 500,
    progress: 12,
  },
];

export const FederationDashboard: React.FC = () => {
  const [nodes, setNodes] = useState<FederationNode[]>(MOCK_NODES);
  const [missions, setMissions] = useState<SwarmMission[]>(MOCK_MISSIONS);
  const [selectedNode, setSelectedNode] = useState<FederationNode | null>(null);

  return (
    <div className='flex h-full w-full bg-slate-900 text-white overflow-hidden'>
      {/* Sidebar */}
      <div className='w-64 bg-slate-800 border-r border-slate-700 p-4 flex flex-col'>
        <h2 className='text-xl font-bold text-cyan-400 mb-6'>Federation Command</h2>

        <div className='mb-6'>
          <h3 className='text-sm font-semibold text-slate-400 mb-2 uppercase'>Active Swarms</h3>
          <div className='space-y-2'>
            {missions.map((mission) => (
              <div key={mission.id} className='bg-slate-700/50 p-3 rounded border border-slate-600'>
                <div className='text-sm font-medium truncate'>{mission.objective}</div>
                <div className='flex justify-between text-xs text-slate-400 mt-1'>
                  <span>{mission.activeAgents} Agents</span>
                  <span>{mission.progress}%</span>
                </div>
                <div className='w-full bg-slate-600 h-1 mt-2 rounded-full overflow-hidden'>
                  <div
                    className='bg-cyan-500 h-full'
                    style={{ width: `${mission.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className='mt-auto'>
          <div className='text-xs text-slate-500'>
            Global Status: <span className='text-green-400'>OPERATIONAL</span>
          </div>
          <div className='text-xs text-slate-500'>Connected Nodes: {nodes.length}</div>
        </div>
      </div>

      {/* Main Content - Map Visualization */}
      <div className='flex-1 relative bg-slate-950'>
        <div className='absolute top-4 left-4 z-10'>
          <h1 className='text-2xl font-bold text-white'>Global Node Map</h1>
          <p className='text-slate-400'>Real-time telemetry from Azure Digital Twins</p>
        </div>

        {/* Simple SVG Map Visualization */}
        <svg className='w-full h-full' viewBox='0 0 800 600'>
          {/* Grid Lines */}
          <defs>
            <pattern id='grid' width='40' height='40' patternUnits='userSpaceOnUse'>
              <path
                d='M 40 0 L 0 0 0 40'
                fill='none'
                stroke='rgba(255,255,255,0.05)'
                strokeWidth='1'
              />
            </pattern>
          </defs>
          <rect width='100%' height='100%' fill='url(#grid)' />

          {/* Connections */}
          {nodes.map((node, i) =>
            nodes.map((target, j) => {
              if (i < j) {
                return (
                  <line
                    key={`${node.nodeId}-${target.nodeId}`}
                    x1={node.coordinates.x * 2 + 100}
                    y1={node.coordinates.y * 2 + 50}
                    x2={target.coordinates.x * 2 + 100}
                    y2={target.coordinates.y * 2 + 50}
                    stroke='rgba(6, 182, 212, 0.2)'
                    strokeWidth='1'
                  />
                );
              }
              return null;
            })
          )}

          {/* Nodes */}
          {nodes.map((node) => (
            <g
              key={node.nodeId}
              transform={`translate(${node.coordinates.x * 2 + 100}, ${node.coordinates.y * 2 + 50})`}
              onClick={() => setSelectedNode(node)}
              className='cursor-pointer hover:opacity-80 transition-opacity'
            >
              <circle
                r='6'
                fill={
                  node.status === 'active'
                    ? 'var(--tf-transcend-cyan)'
                    : node.status === 'degraded'
                      ? 'var(--tf-accent-yellow)'
                      : 'var(--tf-accent-error)'
                }
              />
              <circle
                r='12'
                fill={
                  node.status === 'active'
                    ? 'var(--tf-transcend-cyan)'
                    : node.status === 'degraded'
                      ? 'var(--tf-accent-yellow)'
                      : 'var(--tf-accent-error)'
                }
                opacity='0.2'
              >
                <animate attributeName='r' from='6' to='20' dur='2s' repeatCount='indefinite' />
                <animate
                  attributeName='opacity'
                  from='0.4'
                  to='0'
                  dur='2s'
                  repeatCount='indefinite'
                />
              </circle>
              <text
                y='20'
                textAnchor='middle'
                fill='white'
                fontSize='10'
                className='pointer-events-none select-none'
              >
                {node.region}
              </text>
            </g>
          ))}
        </svg>

        {/* Node Details Panel */}
        {selectedNode && (
          <div className='absolute top-4 right-4 w-80 bg-slate-900/90 backdrop-blur border border-slate-700 p-4 rounded shadow-xl'>
            <div className='flex justify-between items-start mb-4'>
              <h3 className='text-lg font-bold text-white'>Node Details</h3>
              <button
                onClick={() => setSelectedNode(null)}
                className='text-slate-400 hover:text-white'
              >
                ×
              </button>
            </div>

            <div className='space-y-3 text-sm'>
              <div className='flex justify-between'>
                <span className='text-slate-400'>ID:</span>
                <span className='text-cyan-300 font-mono text-xs'>{selectedNode.nodeId}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-slate-400'>Region:</span>
                <span className='text-white'>{selectedNode.region}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-slate-400'>Status:</span>
                <span
                  className={
                    selectedNode.status === 'active' ? 'text-green-400' : 'text-yellow-400'
                  }
                >
                  {selectedNode.status.toUpperCase()}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-slate-400'>Latency:</span>
                <span className='text-white'>{selectedNode.latency}ms</span>
              </div>
            </div>

            <div className='mt-4 pt-4 border-t border-slate-700'>
              <button className='w-full bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded text-sm font-medium transition-colors'>
                Initiate Handshake
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FederationDashboard;
