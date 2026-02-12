'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';

export const TerraSphere: React.FC = () => {
  const meshRef = useRef<Mesh>(null!);

  // Animate the sphere rotation
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3; // Slow rotation
      meshRef.current.rotation.x += delta * 0.1; // Slight tilt rotation
    }
  });

  return (
    <mesh ref={meshRef} scale={1.5}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial
        color="#1e40af"
        roughness={0.3}
        metalness={0.7}
        wireframe={false}
      />
      
      {/* Inner glow effect */}
      <mesh scale={0.98}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#60a5fa"
          transparent
          opacity={0.3}
        />
      </mesh>
      
      {/* Outer atmosphere */}
      <mesh scale={1.05}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#3b82f6"
          transparent
          opacity={0.1}
        />
      </mesh>
    </mesh>
  );
};