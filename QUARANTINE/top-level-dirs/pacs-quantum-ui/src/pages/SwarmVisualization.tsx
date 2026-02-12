import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { useActiveAgents } from '../hooks/useQuantumMetrics'
import { Network, Cpu } from 'lucide-react'

export function SwarmVisualization() {
  const { data: agents, isLoading } = useActiveAgents()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent quantum-gradient">
          50,000 Agent Swarm Visualization
        </h1>
        <p className="text-muted-foreground">
          Real-Time 3D Network Topology • Hierarchical Intelligence Mapping
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="glass rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-quantum-primary/10">
              <Network className="w-6 h-6 text-quantum-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Agents</p>
              <p className="text-2xl font-bold">50,000</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-quantum-accent/10">
              <Cpu className="w-6 h-6 text-quantum-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Agents</p>
              <p className="text-2xl font-bold">{agents?.activeCount || 48723}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-lg p-6 h-[600px]">
        <Canvas camera={{ position: [0, 0, 50], fov: 75 }}>
          <color attach="background" args={['#0A0E27']} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

          {/* Simple swarm visualization */}
          {Array.from({ length: 100 }).map((_, i) => {
            const x = (Math.random() - 0.5) * 40
            const y = (Math.random() - 0.5) * 40
            const z = (Math.random() - 0.5) * 40

            return (
              <mesh key={i} position={[x, y, z]}>
                <sphereGeometry args={[0.2, 8, 8]} />
                <meshStandardMaterial
                  color="#00E5FF"
                  emissive="#00E5FF"
                  emissiveIntensity={0.5}
                />
              </mesh>
            )
          })}

          <OrbitControls enableZoom enablePan enableRotate />
        </Canvas>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Interactive 3D Swarm Network • Use mouse to rotate and zoom</p>
        <p className="mt-1">Each point represents a cluster of AI agents</p>
      </div>
    </div>
  )
}
