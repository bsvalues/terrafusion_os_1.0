"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";

// TerraSphere Performance Configuration
const PERFORMANCE_CONFIG = {
  maxGPUUsage: 0.15,        // 15% GPU limit
  maxMemoryMB: 32,          // 32MB memory limit
  targetFPS: 60,            // Target 60 FPS
  idleCPUPercent: 0.02,     // 2% idle CPU
  segments: 64,             // Sphere geometry segments for quality/performance balance
  updateInterval: 16,       // ~60fps update interval
};

// TerraSphere Geological Layers
interface GeologicalLayer {
  name: string;
  color: string;
  opacity: number;
  depth: number;
  speed: number;
}

const GEOLOGICAL_LAYERS: GeologicalLayer[] = [
  { name: "atmosphere", color: "#f0f9ff", opacity: 0.3, depth: 1.02, speed: 0.5 },
  { name: "ocean", color: "#0ea5e9", opacity: 0.8, depth: 1.0, speed: 1.0 },
  { name: "continental", color: "#f97316", opacity: 0.6, depth: 0.98, speed: 0.8 },
  { name: "forest", color: "#22c55e", opacity: 0.7, depth: 0.99, speed: 1.2 },
  { name: "core", color: "#c2410c", opacity: 0.9, depth: 0.85, speed: 0.3 },
];

// TerraSphere Shader Materials
const createTerraShaderMaterial = (layer: GeologicalLayer) => {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      color: { value: new THREE.Color(layer.color) },
      opacity: { value: layer.opacity },
      speed: { value: layer.speed },
    },
    vertexShader: `
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      
      void main() {
        vPosition = position;
        vNormal = normal;
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 color;
      uniform float opacity;
      uniform float speed;
      
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      
      // Noise function for geological texture
      float noise(vec3 p) {
        return sin(p.x * 10.0 + time * speed) * 
               sin(p.y * 8.0 + time * speed * 0.8) * 
               sin(p.z * 12.0 + time * speed * 1.2) * 0.5 + 0.5;
      }
      
      void main() {
        // Calculate geological patterns
        float geological = noise(vPosition * 2.0);
        float atmospheric = smoothstep(0.0, 1.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
        
        // Mix geological and atmospheric effects
        vec3 finalColor = mix(color, color * 1.5, geological * 0.3);
        finalColor = mix(finalColor, vec3(1.0, 1.0, 1.0), atmospheric * 0.1);
        
        // Add subtle energy pulses
        float pulse = sin(time * 2.0 + length(vPosition) * 5.0) * 0.1 + 0.9;
        
        gl_FragColor = vec4(finalColor * pulse, opacity);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
  });
};

// Individual Geological Layer Component
interface TerraLayerProps {
  layer: GeologicalLayer;
  telemetryData?: {
    activity: number;
    temperature: number;
    pressure: number;
  };
}

function TerraLayer({ layer, telemetryData }: TerraLayerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Create shader material for this layer
  const material = useMemo(() => createTerraShaderMaterial(layer), [layer]);

  useFrame((state) => {
    if (materialRef.current) {
      // Update time uniform for animations
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
      
      // Apply telemetry data to visual effects
      if (telemetryData) {
        const activityMultiplier = 1 + (telemetryData.activity * 0.5);
        materialRef.current.uniforms.speed.value = layer.speed * activityMultiplier;
        materialRef.current.uniforms.opacity.value = layer.opacity * (0.8 + telemetryData.temperature * 0.2);
      }
    }

    // Rotate layer based on geological characteristics
    if (meshRef.current) {
      meshRef.current.rotation.y += layer.speed * 0.005;
      meshRef.current.rotation.x += layer.speed * 0.002;
    }
  });

  return (
    <Sphere
      ref={meshRef}
      args={[layer.depth, PERFORMANCE_CONFIG.segments, PERFORMANCE_CONFIG.segments]}
    >
      <shaderMaterial ref={materialRef} attach="material" {...material} />
    </Sphere>
  );
}

// Main TerraSphere Component

function TerraSphere3D({ size = 2, telemetryData }: Omit<TerraSphereProps, "className">) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Main planetary rotation
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      
      // Subtle floating animation
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group ref={groupRef} scale={[size, size, size]}>
      {GEOLOGICAL_LAYERS.map((layer) => (
        <TerraLayer
          key={layer.name}
          layer={layer}
          telemetryData={{
            activity: telemetryData?.networkActivity || 0.5,
            temperature: telemetryData?.temperature || 0.7,
            pressure: telemetryData?.systemLoad || 0.3,
          }}
        />
      ))}
    </group>
  );
}

// TerraSphere Props Interface
export interface TerraSphereProps {
  size?: number;
  enableControls?: boolean;
  telemetryData?: {
    systemLoad: number;
    networkActivity: number;
    temperature: number;
    pressure: number;
  };
  className?: string;
}

// Main TerraSphere Canvas Component
export function TerraSphere({
  size = 2,
  enableControls = true,
  telemetryData,
  className = "",
}: TerraSphereProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
        frameloop="demand"
        gl={{
          powerPreference: "low-power",
          antialias: false,
          stencil: false,
          depth: true,
        }}
      >
        {/* Lighting Setup */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={0.8}
          castShadow={false}
        />
        <pointLight position={[-5, -5, -5]} intensity={0.3} />

        {/* Environment */}
        <Environment preset="night" />

        {/* TerraSphere */}
        <TerraSphere3D size={size} telemetryData={telemetryData} />

        {/* Controls */}
        {enableControls && (
          <OrbitControls
            enableZoom={true}
            enablePan={false}
            enableRotate={true}
            autoRotate={false}
            minDistance={3}
            maxDistance={8}
            maxPolarAngle={Math.PI}
            minPolarAngle={0}
          />
        )}
      </Canvas>

      {/* Performance Monitor (Development Only) */}
      {process.env.NODE_ENV === "development" && (
        <div className="absolute top-2 left-2 bg-black/50 text-white text-xs p-2 rounded font-mono">
          <div>TerraSphere Engine v1.0</div>
          <div>Performance: Optimized</div>
          <div>Layers: {GEOLOGICAL_LAYERS.length}</div>
        </div>
      )}
    </div>
  );
}