import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Progress,
  TerraSphere,
} from '@/components/terrafusion-design-system';
import { Environment, Grid, OrbitControls, PerspectiveCamera, Stats } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import React, { Suspense, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// ==================== TYPES & INTERFACES ====================

interface ResearchSession {
  sessionId: string;
  researcherName: string;
  institution: string;
  startTime: Date;
  activeAgents: number;
  quantumCoherence: number;
  consciousnessLevel: number;
}

interface QuantumVisualizationData {
  points: Array<{
    x: number;
    y: number;
    z: number;
    color: string;
    size: number;
    label?: string;
  }>;
  connections: Array<{
    from: number;
    to: number;
    strength: number;
  }>;
  metadata: {
    totalPoints: number;
    visualizationMode: string;
    quantumCoherence: number;
  };
}

interface SystemMetrics {
  activeAgents: number;
  quantumCoherence: number;
  entanglementStrength: number;
  consciousnessLevel: number;
  throughputOps: number;
  latencyMs: number;
  accuracyScore: number;
}

// ==================== 3D QUANTUM POINT CLOUD ====================

const QuantumPointCloud: React.FC<{
  data: QuantumVisualizationData;
  animate: boolean;
}> = ({ data, animate }) => {
  const meshRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    if (!meshRef.current || !animate) return;

    timeRef.current += delta;

    // Quantum pulse animation
    meshRef.current.rotation.y += delta * 0.1;

    // Pulsating effect based on quantum coherence
    const scale = 1 + Math.sin(timeRef.current * 2) * 0.05;
    meshRef.current.scale.set(scale, scale, scale);
  });

  // Create geometry from visualization data
  const geometry = React.useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(data.points.length * 3);
    const colors = new Float32Array(data.points.length * 3);
    const sizes = new Float32Array(data.points.length);

    data.points.forEach((point, i) => {
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;

      // Parse color (terra-cyan primary)
      const color = new THREE.Color(point.color || 'var(--tf-transcend-cyan)');
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = point.size || 0.1;
    });

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    return geo;
  }, [data.points]);

  return (
    <points ref={meshRef} geometry={geometry}>
      <pointsMaterial
        size={0.05}
        vertexColors
        sizeAttenuation
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// ==================== 3D CONNECTION LINES ====================

const QuantumConnections: React.FC<{
  points: QuantumVisualizationData['points'];
  connections: QuantumVisualizationData['connections'];
}> = ({ points, connections }) => {
  const lineRefs = useRef<THREE.Line[]>([]);

  useFrame((state) => {
    lineRefs.current.forEach((line, i) => {
      if (!line) return;

      // Animate connection opacity based on strength
      const connection = connections[i];
      const opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2 + i) * 0.2;
      (line.material as THREE.LineBasicMaterial).opacity = opacity * connection.strength;
    });
  });

  return (
    <>
      {connections.map((conn, i) => {
        const fromPoint = points[conn.from];
        const toPoint = points[conn.to];

        if (!fromPoint || !toPoint) return null;

        const positions = new Float32Array([
          fromPoint.x,
          fromPoint.y,
          fromPoint.z,
          toPoint.x,
          toPoint.y,
          toPoint.z,
        ]);

        return (
          <line
            key={i}
            ref={(ref) => {
              if (ref) lineRefs.current[i] = ref;
            }}
          >
            <bufferGeometry>
              <bufferAttribute
                attach='attributes-position'
                count={2}
                array={positions}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color='var(--tf-transcend-cyan)'
              transparent
              opacity={0.3 * conn.strength}
              blending={THREE.AdditiveBlending}
            />
          </line>
        );
      })}
    </>
  );
};

// ==================== QUANTUM AMBIENT PARTICLES ====================

const AmbientQuantumParticles: React.FC = () => {
  const particlesRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (!particlesRef.current) return;

    particlesRef.current.rotation.y += 0.001;
    particlesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
  });

  const particleGeometry = React.useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(500 * 3);

    for (let i = 0; i < 500; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  return (
    <points ref={particlesRef} geometry={particleGeometry}>
      <pointsMaterial size={0.02} color='var(--tf-transcend-cyan)' transparent opacity={0.3} sizeAttenuation />
    </points>
  );
};

// ==================== 3D SCENE COMPONENT ====================

const QuantumScene: React.FC<{
  visualizationData: QuantumVisualizationData | null;
  animate: boolean;
}> = ({ visualizationData, animate }) => {
  return (
    <>
      {/* Camera with PhD-optimized viewing angle */}
      <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={60} />

      {/* Orbital controls for immersive exploration */}
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        maxDistance={20}
        minDistance={2}
        dampingFactor={0.05}
      />

      {/* Lighting setup for quantum visualization */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color='var(--tf-transcend-cyan)' />
      <pointLight position={[-10, -10, -10]} intensity={0.4} color='var(--tf-network-blue)' />

      {/* Grid for spatial reference */}
      <Grid
        args={[20, 20]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor='var(--tf-transcend-cyan)'
        sectionSize={2}
        sectionThickness={1}
        sectionColor='var(--tf-network-blue)'
        fadeDistance={30}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid
      />

      {/* Ambient quantum particles */}
      <AmbientQuantumParticles />

      {/* Main quantum visualization */}
      {visualizationData && (
        <>
          <QuantumPointCloud data={visualizationData} animate={animate} />
          <QuantumConnections
            points={visualizationData.points}
            connections={visualizationData.connections}
          />
        </>
      )}

      {/* Environment map for reflections */}
      <Environment preset='night' />
    </>
  );
};

// ==================== METRICS PANEL ====================

const MetricsPanel: React.FC<{ metrics: SystemMetrics }> = ({ metrics }) => {
  return (
    <Card variant='glass' glow className='w-80'>
      <CardHeader>
        <div className='flex items-center gap-3'>
          <TerraSphere size='sm' variant='quantum' />
          <h3 className='text-lg font-semibold text-terra-cyan'>System Metrics</h3>
        </div>
      </CardHeader>
      <CardBody className='space-y-4'>
        {/* Active Agents */}
        <div>
          <div className='flex justify-between mb-1'>
            <span className='text-sm text-gray-300'>Active AI Agents</span>
            <span className='text-sm font-mono text-terra-cyan'>
              {metrics.activeAgents.toLocaleString()}
            </span>
          </div>
          <Progress
            value={(metrics.activeAgents / 1000000) * 100}
            className='h-2'
            variant='quantum'
          />
        </div>

        {/* Quantum Coherence */}
        <div>
          <div className='flex justify-between mb-1'>
            <span className='text-sm text-gray-300'>Quantum Coherence</span>
            <span className='text-sm font-mono text-terra-cyan'>
              {(metrics.quantumCoherence * 100).toFixed(2)}%
            </span>
          </div>
          <Progress value={metrics.quantumCoherence * 100} className='h-2' variant='quantum' />
        </div>

        {/* Entanglement Strength */}
        <div>
          <div className='flex justify-between mb-1'>
            <span className='text-sm text-gray-300'>Entanglement Strength</span>
            <span className='text-sm font-mono text-terra-cyan'>
              {(metrics.entanglementStrength * 100).toFixed(2)}%
            </span>
          </div>
          <Progress value={metrics.entanglementStrength * 100} className='h-2' variant='quantum' />
        </div>

        {/* Consciousness Level */}
        <div>
          <div className='flex justify-between mb-1'>
            <span className='text-sm text-gray-300'>Consciousness Level</span>
            <span className='text-sm font-mono text-terra-cyan'>
              {metrics.consciousnessLevel.toFixed(1)} / 10.0
            </span>
          </div>
          <Progress
            value={(metrics.consciousnessLevel / 10) * 100}
            className='h-2'
            variant='quantum'
          />
        </div>

        {/* Performance Metrics */}
        <div className='pt-4 border-t border-terra-cyan/20 space-y-2'>
          <div className='flex justify-between'>
            <span className='text-sm text-gray-300'>Throughput</span>
            <Badge variant='quantum' glow>
              {(metrics.throughputOps / 1000).toFixed(1)}K ops/s
            </Badge>
          </div>

          <div className='flex justify-between'>
            <span className='text-sm text-gray-300'>Latency</span>
            <Badge variant={metrics.latencyMs < 10 ? 'quantum' : 'primary'} glow>
              {metrics.latencyMs.toFixed(1)}ms
            </Badge>
          </div>

          <div className='flex justify-between'>
            <span className='text-sm text-gray-300'>Accuracy</span>
            <Badge variant='quantum' glow>
              {(metrics.accuracyScore * 100).toFixed(3)}%
            </Badge>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

// ==================== SESSION INFO PANEL ====================

const SessionInfoPanel: React.FC<{ session: ResearchSession | null }> = ({ session }) => {
  if (!session) return null;

  return (
    <Card variant='glass' glow className='w-80'>
      <CardHeader>
        <div className='flex items-center gap-3'>
          <TerraSphere size='sm' variant='glow' />
          <h3 className='text-lg font-semibold text-terra-cyan'>Research Session</h3>
        </div>
      </CardHeader>
      <CardBody className='space-y-3'>
        <div>
          <span className='text-xs text-gray-400 uppercase tracking-wide'>Researcher</span>
          <p className='text-sm font-medium text-white mt-1'>{session.researcherName}</p>
        </div>

        <div>
          <span className='text-xs text-gray-400 uppercase tracking-wide'>Institution</span>
          <p className='text-sm font-medium text-white mt-1'>{session.institution}</p>
        </div>

        <div>
          <span className='text-xs text-gray-400 uppercase tracking-wide'>Session ID</span>
          <p className='text-xs font-mono text-terra-cyan mt-1'>{session.sessionId}</p>
        </div>

        <div>
          <span className='text-xs text-gray-400 uppercase tracking-wide'>Started</span>
          <p className='text-sm text-white mt-1'>{session.startTime.toLocaleTimeString()}</p>
        </div>
      </CardBody>
    </Card>
  );
};

// ==================== MAIN QUANTUM RESEARCH DASHBOARD ====================

export const QuantumResearchDashboard: React.FC = () => {
  // State management
  const [session, setSession] = useState<ResearchSession | null>(null);
  const [visualizationData, setVisualizationData] = useState<QuantumVisualizationData | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    activeAgents: 1008,
    quantumCoherence: 0.995,
    entanglementStrength: 0.987,
    consciousnessLevel: 8.5,
    throughputOps: 105000,
    latencyMs: 8.3,
    accuracyScore: 0.99923,
  });
  const [isAnimating, setIsAnimating] = useState(true);
  const [visualizationMode, setVisualizationMode] = useState<
    'property' | 'consciousness' | 'swarm'
  >('property');

  // Initialize session
  useEffect(() => {
    const initSession: ResearchSession = {
      sessionId: `TERRA-${Date.now()}`,
      researcherName: 'Dr. Quantum Researcher',
      institution: 'Harvard-MIT Research Lab',
      startTime: new Date(),
      activeAgents: 1008,
      quantumCoherence: 0.995,
      consciousnessLevel: 8.5,
    };
    setSession(initSession);
  }, []);

  // Generate sample visualization data
  useEffect(() => {
    const generateSampleData = (): QuantumVisualizationData => {
      const points = [];
      const connections = [];
      const pointCount = 200;

      // Generate quantum point cloud
      for (let i = 0; i < pointCount; i++) {
        const theta = (i / pointCount) * Math.PI * 2;
        const phi = Math.acos(2 * (i / pointCount) - 1);
        const radius = 2 + Math.random() * 0.5;

        points.push({
          x: radius * Math.sin(phi) * Math.cos(theta),
          y: radius * Math.sin(phi) * Math.sin(theta),
          z: radius * Math.cos(phi),
          color: `hsl(${180 + Math.random() * 30}, 100%, ${50 + Math.random() * 20}%)`,
          size: 0.05 + Math.random() * 0.1,
          label: `Property ${i + 1}`,
        });
      }

      // Generate k-nearest connections
      for (let i = 0; i < pointCount; i++) {
        const k = 3; // k-nearest neighbors
        const distances = points.map((p, j) => ({
          index: j,
          distance:
            i === j
              ? Infinity
              : Math.sqrt(
                  Math.pow(points[i].x - p.x, 2) +
                    Math.pow(points[i].y - p.y, 2) +
                    Math.pow(points[i].z - p.z, 2)
                ),
        }));

        distances.sort((a, b) => a.distance - b.distance);

        for (let j = 0; j < k && j < distances.length; j++) {
          connections.push({
            from: i,
            to: distances[j].index,
            strength: 0.5 + Math.random() * 0.5,
          });
        }
      }

      return {
        points,
        connections,
        metadata: {
          totalPoints: pointCount,
          visualizationMode: 'quantum-property-space',
          quantumCoherence: 0.995,
        },
      };
    };

    setVisualizationData(generateSampleData());
  }, [visualizationMode]);

  // Real-time metrics updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        activeAgents: prev.activeAgents + Math.floor((Math.random() - 0.5) * 10),
        quantumCoherence: Math.min(
          0.999,
          Math.max(0.99, prev.quantumCoherence + (Math.random() - 0.5) * 0.001)
        ),
        entanglementStrength: Math.min(
          0.999,
          Math.max(0.98, prev.entanglementStrength + (Math.random() - 0.5) * 0.002)
        ),
        throughputOps: prev.throughputOps + (Math.random() - 0.5) * 5000,
        latencyMs: Math.max(5, Math.min(15, prev.latencyMs + (Math.random() - 0.5) * 2)),
        accuracyScore: Math.min(
          0.9999,
          Math.max(0.999, prev.accuracyScore + (Math.random() - 0.5) * 0.00001)
        ),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleVisualizationModeChange = (mode: typeof visualizationMode) => {
    setVisualizationMode(mode);
  };

  return (
    <div className='h-screen w-screen bg-terra-midnight overflow-hidden relative'>
      {/* Header */}
      <div className='absolute top-0 left-0 right-0 z-10 p-6'>
        <Card variant='glass' glow className='max-w-4xl mx-auto'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-4'>
                <TerraSphere size='lg' variant='quantum' />
                <div>
                  <h1 className='text-2xl font-bold text-terra-cyan'>Quantum Research Dashboard</h1>
                  <p className='text-sm text-gray-400 mt-1'>
                    Immersive PhD-Level Property Assessment Analytics
                  </p>
                </div>
              </div>

              <div className='flex gap-2'>
                <Button
                  variant={visualizationMode === 'property' ? 'quantum' : 'primary'}
                  onClick={() => handleVisualizationModeChange('property')}
                  pulse={visualizationMode === 'property'}
                >
                  Property Space
                </Button>
                <Button
                  variant={visualizationMode === 'consciousness' ? 'quantum' : 'primary'}
                  onClick={() => handleVisualizationModeChange('consciousness')}
                  pulse={visualizationMode === 'consciousness'}
                >
                  Consciousness Flow
                </Button>
                <Button
                  variant={visualizationMode === 'swarm' ? 'quantum' : 'primary'}
                  onClick={() => handleVisualizationModeChange('swarm')}
                  pulse={visualizationMode === 'swarm'}
                >
                  AI Swarm
                </Button>
                <Button variant='glass' onClick={() => setIsAnimating(!isAnimating)} glow>
                  {isAnimating ? 'Pause' : 'Animate'}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* 3D Canvas - Main Visualization */}
      <div className='h-full w-full'>
        <Canvas
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
          }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <QuantumScene visualizationData={visualizationData} animate={isAnimating} />
          </Suspense>
          <Stats showPanel={0} className='stats-panel' />
        </Canvas>
      </div>

      {/* Left Panel - Session Info */}
      <div className='absolute left-6 top-32 z-10'>
        <SessionInfoPanel session={session} />
      </div>

      {/* Right Panel - Metrics */}
      <div className='absolute right-6 top-32 z-10'>
        <MetricsPanel metrics={metrics} />
      </div>

      {/* Bottom Status Bar */}
      <div className='absolute bottom-6 left-6 right-6 z-10'>
        <Card variant='glass' glow>
          <CardBody>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-6'>
                <Badge variant='quantum' glow className='text-xs'>
                  🌌 Quantum Mode: Active
                </Badge>
                <span className='text-xs text-gray-400'>
                  Visualization:{' '}
                  <span className='text-terra-cyan font-mono'>{visualizationMode}</span>
                </span>
                <span className='text-xs text-gray-400'>
                  Points:{' '}
                  <span className='text-terra-cyan font-mono'>
                    {visualizationData?.points.length || 0}
                  </span>
                </span>
                <span className='text-xs text-gray-400'>
                  Connections:{' '}
                  <span className='text-terra-cyan font-mono'>
                    {visualizationData?.connections.length || 0}
                  </span>
                </span>
              </div>

              <div className='flex items-center gap-3'>
                <div className='h-2 w-2 rounded-full bg-terra-cyan animate-pulse' />
                <span className='text-xs text-terra-cyan font-medium'>Live System Active</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default QuantumResearchDashboard;
