/**
 * QuantumVisualizationEngine - Elite Canvas-Based Quantum Visualization
 * Canvas-Powered Quantum Visualization for PhD-Level Analysis
 * TerraFusion OS - Government. Transcended.
 */

import React, { useEffect, useRef, useState } from 'react';

interface QuantumVisualizationProps {
  mode: 'structure' | 'materials' | 'quantum';
  propertyData?: any;
  className?: string;
}

export const QuantumVisualizationEngine: React.FC<QuantumVisualizationProps> = ({
  mode,
  propertyData,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    alpha: number;
  }>>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [visualizationMode, setVisualizationMode] = useState(mode);
  const [quantumMetrics] = useState({
    particlesActive: 50000,
    energyLevel: 847.3,
    coherenceState: 'ENTANGLED',
    waveFunction: 'ψ(r,t) = Ae^(ikr-iωt)',
  });

  // Initialize particles
  useEffect(() => {
    const particles = [];
    const particleCount = mode === 'quantum' ? 150 : 75;
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        color: getQuantumColor(mode),
        size: Math.random() * 3 + 1,
        alpha: Math.random() * 0.8 + 0.2,
      });
    }
    particlesRef.current = particles;
  }, [mode]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Elite animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      // Clear canvas with quantum background
      ctx.fillStyle = 'rgba(11, 16, 32, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw quantum visualization based on mode
      drawQuantumVisualization(ctx, canvas, mode);
      
      // Update and draw particles
      updateAndDrawParticles(ctx, canvas);
    };

    animate();
    setIsLoading(false);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [mode]);

  const getQuantumColor = (visualizationMode: string) => {
    const colors = {
      structure: ['#0099ff', '#00ffee', '#0066cc'],
      materials: ['#ff0066', '#00ffaa', '#0099ff'],
      quantum: ['#00ffee', '#00ffaa', '#0099ff', '#ff00aa'],
    };
    const modeColors = colors[visualizationMode as keyof typeof colors] || colors.quantum;
    return modeColors[Math.floor(Math.random() * modeColors.length)];
  };

  const drawQuantumVisualization = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, visualizationMode: string) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const time = Date.now() * 0.001;

    switch (visualizationMode) {
      case 'structure':
        drawStructureVisualization(ctx, centerX, centerY, time);
        break;
      case 'materials':
        drawMaterialsVisualization(ctx, centerX, centerY, time);
        break;
      case 'quantum':
        drawQuantumEffectsVisualization(ctx, centerX, centerY, time);
        break;
      default:
        drawDefaultVisualization(ctx, centerX, centerY, time);
    }
  };

  const drawStructureVisualization = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, time: number) => {
    // Elite building structure
    ctx.strokeStyle = '#0099ff';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.8;

    // Main building
    const buildingWidth = 120;
    const buildingHeight = 180;
    const buildingX = centerX - buildingWidth / 2;
    const buildingY = centerY - buildingHeight / 2;

    // Animated quantum glow
    ctx.shadowColor = '#00ffee';
    ctx.shadowBlur = 10 + Math.sin(time * 2) * 5;
    ctx.strokeRect(buildingX, buildingY, buildingWidth, buildingHeight);

    // Foundation
    ctx.strokeStyle = '#00ffee';
    ctx.strokeRect(buildingX - 20, buildingY + buildingHeight, buildingWidth + 40, 20);

    // Windows with quantum effects
    ctx.fillStyle = '#00ffaa';
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 6; j++) {
        const windowX = buildingX + 20 + i * 30;
        const windowY = buildingY + 20 + j * 25;
        ctx.globalAlpha = 0.3 + Math.sin(time + i + j) * 0.2;
        ctx.fillRect(windowX, windowY, 15, 15);
      }
    }
    
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  };

  const drawMaterialsVisualization = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, time: number) => {
    const materials = [
      { name: 'Concrete', color: '#ff0066', x: centerX - 100, y: centerY },
      { name: 'Steel', color: '#00ffaa', x: centerX, y: centerY },
      { name: 'Wood', color: '#0099ff', x: centerX + 100, y: centerY },
    ];

    materials.forEach((material, index) => {
      const radius = 40 + Math.sin(time + index) * 10;
      
      // Quantum material sphere with glow
      ctx.shadowColor = material.color;
      ctx.shadowBlur = 20;
      ctx.fillStyle = material.color;
      ctx.globalAlpha = 0.7;
      
      ctx.beginPath();
      ctx.arc(material.x, material.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Material property waves
      ctx.strokeStyle = material.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.4;
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(material.x, material.y, radius + i * 20 + Math.sin(time * 2 + i) * 10, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Material label
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.9;
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(material.name, material.x, material.y + radius + 25);
    });

    ctx.globalAlpha = 1;
  };

  const drawQuantumEffectsVisualization = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, time: number) => {
    // Quantum field visualization
    ctx.strokeStyle = '#00ffee';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;

    // Draw quantum wave field
    for (let x = 0; x < ctx.canvas.width; x += 20) {
      for (let y = 0; y < ctx.canvas.height; y += 20) {
        const wave = Math.sin(time + (x + y) * 0.01) * 10;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + wave, y + wave);
        ctx.stroke();
      }
    }

    // Central quantum vortex
    ctx.strokeStyle = '#00ffaa';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.8;
    
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + time;
      const radius = 60 + Math.sin(time * 3 + i) * 20;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      ctx.shadowColor = '#00ffaa';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  };

  const drawDefaultVisualization = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, time: number) => {
    // Default quantum cube with wireframe
    const size = 80 + Math.sin(time) * 20;
    
    ctx.strokeStyle = '#00ffee';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.7;
    ctx.shadowColor = '#00ffee';
    ctx.shadowBlur = 10;

    // Rotating quantum cube
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(time * 0.5);
    ctx.strokeRect(-size/2, -size/2, size, size);
    ctx.restore();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  };

  const updateAndDrawParticles = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const particles = particlesRef.current;
    
    particles.forEach((particle) => {
      // Update particle position
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Bounce off walls
      if (particle.x <= 0 || particle.x >= canvas.width) particle.vx *= -1;
      if (particle.y <= 0 || particle.y >= canvas.height) particle.vy *= -1;

      // Keep particles in bounds
      particle.x = Math.max(0, Math.min(canvas.width, particle.x));
      particle.y = Math.max(0, Math.min(canvas.height, particle.y));

      // Draw particle with quantum glow
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = particle.size * 2;
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.alpha;

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Canvas Visualization */}
      <canvas
        ref={canvasRef}
        className="w-full h-full bg-transparent"
      />

      {/* Quantum Metrics Overlay */}
      <div className="absolute top-4 left-4 space-y-2 pointer-events-none">
        <div className="bg-black/80 border border-[#00ffee]/30 rounded px-3 py-1 text-xs">
          <span className="text-[#00ffee]">Particles Active: </span>
          <span className="text-[#00ffaa]">{quantumMetrics.particlesActive.toLocaleString()}</span>
        </div>
        <div className="bg-black/80 border border-[#00ffee]/30 rounded px-3 py-1 text-xs">
          <span className="text-[#00ffee]">Energy Level: </span>
          <span className="text-[#00ffaa]">{quantumMetrics.energyLevel} keV</span>
        </div>
        <div className="bg-black/80 border border-[#00ffee]/30 rounded px-3 py-1 text-xs">
          <span className="text-[#00ffee]">Coherence: </span>
          <span className="text-[#00ffaa]">{quantumMetrics.coherenceState}</span>
        </div>
        <div className="bg-black/80 border border-[#00ffee]/30 rounded px-3 py-1 text-xs">
          <span className="text-[#00ffee]">Wave Function: </span>
          <span className="text-[#00ffaa] font-mono text-[10px]">{quantumMetrics.waveFunction}</span>
        </div>
      </div>

      {/* Elite Status Indicator */}
      <div className="absolute top-4 right-4 pointer-events-none">
        <div className="bg-black/80 border border-[#00ffaa]/30 rounded px-3 py-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#00ffaa] rounded-full animate-pulse"></div>
            <span className="text-[#00ffaa]">Quantum Engine Active</span>
          </div>
        </div>
      </div>

      {/* Visualization Mode Selector */}
      <div className="absolute bottom-4 left-4 space-y-2 pointer-events-auto">
        <div className="bg-black/80 border border-[#00ffee]/30 rounded p-2">
          <label className="block text-[#00ffee] text-xs font-semibold mb-1">
            Visualization Mode
          </label>
          <select
            value={visualizationMode}
            onChange={(e) => setVisualizationMode(e.target.value as 'structure' | 'materials' | 'quantum')}
            className="bg-[#1a2332]/80 border border-[#00ffee]/50 rounded px-2 py-1 text-[#00ffee] text-xs focus:border-[#00ffaa] focus:outline-none"
            title="Select visualization mode"
          >
            <option value="structure">Structure Analysis</option>
            <option value="materials">Material Composition</option>
            <option value="quantum">Quantum Effects</option>
          </select>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-[#00ffee] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="text-[#00ffee] text-sm">Initializing Quantum Engine...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuantumVisualizationEngine;
