'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { TerraSphere } from './TerraSphere';

interface TerraSphereContainerProps {
  className?: string;
  showHUD?: boolean;
  enableTelemetry?: boolean;
}

export const TerraSphereContainer: React.FC<TerraSphereContainerProps> = ({
  className = '',
  showHUD = false,
  enableTelemetry = false
}) => {
  const [telemetryData, setTelemetryData] = useState({
    cpu: Math.random() * 100,
    memory: Math.random() * 100,
    gpu: Math.random() * 15, // TerraSphere budget: <15%
    fps: 60,
    connections: Math.floor(Math.random() * 50) + 10
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simulate real-time telemetry updates
  useEffect(() => {
    if (!enableTelemetry) return;

    const interval = setInterval(() => {
      setTelemetryData({
        cpu: Math.max(5, Math.min(95, telemetryData.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(10, Math.min(90, telemetryData.memory + (Math.random() - 0.5) * 8)),
        gpu: Math.max(2, Math.min(15, telemetryData.gpu + (Math.random() - 0.5) * 2)),
        fps: Math.floor(Math.random() * 5) + 58, // 58-62 FPS
        connections: Math.max(5, Math.min(100, telemetryData.connections + Math.floor((Math.random() - 0.5) * 6)))
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [enableTelemetry, telemetryData]);

  return (
    <div className={`relative bg-slate-900/50 rounded-xl overflow-hidden ${className}`}>
      <Canvas
        ref={canvasRef}
        camera={{ position: [0, 0, 5], fov: 45 }}
        style={{ width: '100%', height: '100%' }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <TerraSphere />
      </Canvas>

      {showHUD && (
        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded-lg p-3 text-xs text-white space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-300">TerraSphere Engine</span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400">CPU:</span>
              <span className="ml-1 text-blue-400">{telemetryData.cpu.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-slate-400">GPU:</span>
              <span className="ml-1 text-purple-400">{telemetryData.gpu.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-slate-400">MEM:</span>
              <span className="ml-1 text-green-400">{telemetryData.memory.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-slate-400">FPS:</span>
              <span className="ml-1 text-yellow-400">{telemetryData.fps}</span>
            </div>
          </div>
          {enableTelemetry && (
            <div className="pt-1 border-t border-slate-600">
              <span className="text-slate-400">Connections:</span>
              <span className="ml-1 text-cyan-400">{telemetryData.connections}</span>
            </div>
          )}
        </div>
      )}

      {/* Performance Status Indicator */}
      <div className="absolute bottom-2 right-2 flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${
          telemetryData.gpu < 10 ? 'bg-green-400' : 
          telemetryData.gpu < 13 ? 'bg-yellow-400' : 'bg-red-400'
        }`}></div>
        <span className="text-xs text-slate-400">
          {telemetryData.gpu < 10 ? 'Optimal' : 
           telemetryData.gpu < 13 ? 'Good' : 'High Load'}
        </span>
      </div>
    </div>
  );
};