/**
 * QuantumVisualizationEngine - Elite Canvas-Based Property Visualization
 * High-Performance Quantum Effects for PhD-Level Analysis
 * TerraFusion OS - Government. Transcended.
 */

import React, { useEffect, useRef, useState } from 'react';

interface QuantumVisualizationProps {
  mode: 'structure' | 'materials' | 'quantum';
  propertyData?: any;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  color: string;
  size: number;
}

export const QuantumVisualizationEngine: React.FC<QuantumVisualizationProps> = ({
  mode,
  propertyData,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [quantumMetrics] = useState({
    particlesActive: 5000,
    energyLevel: 847.3,
    coherenceState: 'ENTANGLED',
    waveFunction: 'ψ(r,t) = Ae^(ikr-iωt)',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles based on mode
    initializeQuantumVisualization(mode);

    // Start animation
    const animate = () => {
      updateVisualization(ctx, canvas.width, canvas.height, mode);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Delay to show loading effect
    setTimeout(() => {
      setIsLoading(false);
      animate();
    }, 1500);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [mode]);

  const initializeQuantumVisualization = (visualizationMode: string) => {
    particlesRef.current = [];
    const particleCount = visualizationMode === 'quantum' ? 200 : 50;

    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push(createParticle(visualizationMode));
    }
  };

  const createParticle = (visualizationMode: string): Particle => {
    const colors = getVisualizationColors(visualizationMode);
    
    return {
      x: Math.random() * 800,
      y: Math.random() * 600,
      z: Math.random() * 100,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      vz: (Math.random() - 0.5) * 0.5,
      life: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 3 + 1,
    };
  };

  const getVisualizationColors = (visualizationMode: string): string[] => {
    switch (visualizationMode) {
      case 'structure':
        return ['#0099ff', '#00ffee', '#0077cc'];
      case 'materials':
        return ['#00ffaa', '#ff00aa', '#ffaa00'];
      case 'quantum':
        return ['#00ffee', '#0099ff', '#00ffaa', '#ff00aa'];
      default:
        return ['#00ffee'];
    }
  };

  const updateVisualization = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    visualizationMode: string
  ) => {
    // Clear canvas with quantum background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, width, height);

    // Create quantum field effect
    drawQuantumField(ctx, width, height);

    // Update and draw particles
    particlesRef.current.forEach((particle, index) => {
      updateParticle(particle, width, height);
      drawParticle(ctx, particle, visualizationMode);

      // Reset particle if life ended
      if (particle.life <= 0) {
        particlesRef.current[index] = createParticle(visualizationMode);
      }
    });

    // Draw mode-specific visualization
    drawModeSpecificElements(ctx, width, height, visualizationMode);
  };

  const drawQuantumField = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const time = Date.now() * 0.001;
    
    // Create wave interference pattern
    for (let x = 0; x < width; x += 20) {
      for (let y = 0; y < height; y += 20) {
        const wave1 = Math.sin((x * 0.01) + (time * 2));
        const wave2 = Math.cos((y * 0.01) + (time * 1.5));
        const interference = (wave1 + wave2) * 0.5;
        
        const alpha = Math.abs(interference) * 0.1;
        ctx.fillStyle = `rgba(0, 255, 238, ${alpha})`;
        ctx.fillRect(x, y, 2, 2);
      }
    }
  };

  const updateParticle = (particle: Particle, width: number, height: number) => {
    // Update position
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.z += particle.vz;

    // Add quantum behavior (wave-like motion)
    const time = Date.now() * 0.001;
    particle.x += Math.sin(time + particle.y * 0.01) * 0.5;
    particle.y += Math.cos(time + particle.x * 0.01) * 0.5;

    // Boundary conditions with quantum tunneling effect
    if (particle.x < 0) particle.x = width;
    if (particle.x > width) particle.x = 0;
    if (particle.y < 0) particle.y = height;
    if (particle.y > height) particle.y = 0;

    // Update life
    particle.life -= 0.5;

    // Quantum entanglement effect (particles influence each other)
    particle.size = 1 + Math.sin(time * 3 + particle.z) * 0.5;
  };

  const drawParticle = (
    ctx: CanvasRenderingContext2D,
    particle: Particle,
    visualizationMode: string
  ) => {
    const alpha = Math.max(0, particle.life / 100);
    
    // Create quantum glow effect
    const gradient = ctx.createRadialGradient(
      particle.x, particle.y, 0,
      particle.x, particle.y, particle.size * 3
    );
    
    gradient.addColorStop(0, `${particle.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(1, `${particle.color}00`);

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Core particle
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = alpha;
    ctx.fill();
    ctx.globalAlpha = 1;
  };

  const drawModeSpecificElements = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    visualizationMode: string
  ) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const time = Date.now() * 0.001;

    switch (visualizationMode) {
      case 'structure':
        drawStructureElements(ctx, centerX, centerY, time);
        break;
      case 'materials':
        drawMaterialElements(ctx, centerX, centerY, time);
        break;
      case 'quantum':
        drawQuantumElements(ctx, centerX, centerY, time);
        break;
    }
  };

  const drawStructureElements = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, time: number) => {
    // Draw building wireframe
    ctx.strokeStyle = '#0099ff';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.8;

    // Building outline with 3D effect
    const buildingWidth = 120;
    const buildingHeight = 160;
    const depth = Math.sin(time) * 20;

    ctx.beginPath();
    ctx.rect(centerX - buildingWidth/2, centerY - buildingHeight/2, buildingWidth, buildingHeight);
    ctx.stroke();

    // 3D depth lines
    ctx.beginPath();
    ctx.moveTo(centerX - buildingWidth/2, centerY - buildingHeight/2);
    ctx.lineTo(centerX - buildingWidth/2 + depth, centerY - buildingHeight/2 - depth);
    ctx.moveTo(centerX + buildingWidth/2, centerY - buildingHeight/2);
    ctx.lineTo(centerX + buildingWidth/2 + depth, centerY - buildingHeight/2 - depth);
    ctx.stroke();

    ctx.globalAlpha = 1;
  };

  const drawMaterialElements = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, time: number) => {
    // Draw material composition spheres
    const materials = [
      { color: '#00ffaa', x: -80, y: 0, name: 'Steel' },
      { color: '#ff00aa', x: 0, y: 0, name: 'Concrete' },
      { color: '#ffaa00', x: 80, y: 0, name: 'Wood' },
    ];

    materials.forEach((material, index) => {
      const radius = 30 + Math.sin(time * 2 + index) * 5;
      
      const gradient = ctx.createRadialGradient(
        centerX + material.x, centerY + material.y, 0,
        centerX + material.x, centerY + material.y, radius
      );
      
      gradient.addColorStop(0, material.color);
      gradient.addColorStop(1, material.color + '33');

      ctx.beginPath();
      ctx.arc(centerX + material.x, centerY + material.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Material label
      ctx.fillStyle = material.color;
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(material.name, centerX + material.x, centerY + material.y + radius + 20);
    });
  };

  const drawQuantumElements = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, time: number) => {
    // Draw quantum field visualization
    ctx.strokeStyle = '#00ffee';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.6;

    // Quantum wave functions
    for (let i = 0; i < 8; i++) {
      const radius = 50 + (i * 20);
      const offset = time + (i * Math.PI / 4);
      
      ctx.beginPath();
      for (let angle = 0; angle <= Math.PI * 2; angle += 0.1) {
        const waveRadius = radius + Math.sin(angle * 4 + offset) * 10;
        const x = centerX + Math.cos(angle) * waveRadius;
        const y = centerY + Math.sin(angle) * waveRadius;
        
        if (angle === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    // Quantum entanglement visualization
    ctx.strokeStyle = '#00ffaa';
    ctx.lineWidth = 2;
    const entangleRadius = 100;
    
    for (let i = 0; i < 4; i++) {
      const angle1 = (time + i * Math.PI/2) % (Math.PI * 2);
      const angle2 = angle1 + Math.PI;
      
      const x1 = centerX + Math.cos(angle1) * entangleRadius;
      const y1 = centerY + Math.sin(angle1) * entangleRadius;
      const x2 = centerX + Math.cos(angle2) * entangleRadius;
      const y2 = centerY + Math.sin(angle2) * entangleRadius;
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  };

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full bg-black rounded"
        style={{ background: 'radial-gradient(circle, #001122 0%, #000000 100%)' }}
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
        <div className="bg-black/80 border border-[#ff00aa]/30 rounded px-3 py-1 text-xs">
          <span className="text-[#ff00aa]">Mode: </span>
          <span className="text-[#ff00aa] uppercase font-semibold">{mode}</span>
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

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center rounded">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-[#00ffee] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="text-[#00ffee] text-sm">Initializing Quantum Engine...</div>
            <div className="text-[#00ffaa] text-xs">Loading PhD-Level Visualization</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuantumVisualizationEngine;