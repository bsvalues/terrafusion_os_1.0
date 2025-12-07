import { Box, Sphere, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import React, { useMemo, useRef } from 'react';
import { Color, Mesh, Vector3 } from 'three';
import { LevyDataPoint } from '../../../types/LevyTypes';

interface LevyStatusVisualizationProps {
  data?: LevyDataPoint[];
  position: [number, number, number];
  immersionLevel: number;
  quantumMode: boolean;
}

export const LevyStatusVisualization: React.FC<LevyStatusVisualizationProps> = ({
  data = [],
  position,
  immersionLevel,
  quantumMode,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<Mesh[]>([]);

  // Generate 3D visualization data
  const visualizationData = useMemo(() => {
    return data.map((levy, index) => ({
      ...levy,
      position: new Vector3(
        (index % 5) * 2 - 4,
        Math.floor(index / 5) * 2,
        Math.sin(index * 0.5) * 2
      ),
      color: new Color().setHSL(
        levy.status === 'paid' ? 0.3 : levy.status === 'pending' ? 0.1 : 0.0,
        0.8,
        0.6
      ),
      scale: levy.amount / 1000, // Scale based on levy amount
    }));
  }, [data]);

  useFrame((state) => {
    if (groupRef.current) {
      // Quantum animation effects
      if (quantumMode) {
        groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;

        meshRefs.current.forEach((mesh, index) => {
          if (mesh) {
            mesh.position.y += Math.sin(state.clock.elapsedTime + index) * 0.01;
          }
        });
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Title */}
      <Text position={[0, 4, 0]} fontSize={0.5} color='#00ff88' anchorX='center' anchorY='middle'>
        Levy Status Overview
      </Text>

      {/* 3D Levy Status Blocks */}
      {visualizationData.map((levy, index) => (
        <group key={levy.id || index} position={levy.position.toArray()}>
          <Box
            ref={(el) => (meshRefs.current[index] = el!)}
            args={[1, levy.scale, 1]}
            scale={immersionLevel}
          >
            <meshStandardMaterial
              color={levy.color}
              transparent
              opacity={0.8}
              metalness={quantumMode ? 0.8 : 0.2}
              roughness={0.1}
            />
          </Box>

          {/* Interactive Labels */}
          <Text
            position={[0, levy.scale + 0.5, 0]}
            fontSize={0.2}
            color='#ffffff'
            anchorX='center'
            anchorY='bottom'
          >
            ${levy.amount?.toLocaleString()}
          </Text>

          {/* Status Indicator Sphere */}
          <Sphere position={[0, levy.scale + 1, 0]} args={[0.1]}>
            <meshStandardMaterial
              color={
                levy.status === 'paid'
                  ? '#00ff00'
                  : levy.status === 'pending'
                    ? '#ffff00'
                    : '#ff0000'
              }
              emissive={
                levy.status === 'paid'
                  ? '#004400'
                  : levy.status === 'pending'
                    ? '#444400'
                    : '#440000'
              }
            />
          </Sphere>
        </group>
      ))}

      {/* Quantum Effects */}
      {quantumMode && (
        <group>
          {/* Quantum Field Visualization */}
          <mesh>
            <sphereGeometry args={[8, 32, 32]} />
            <meshStandardMaterial color='#0088ff' transparent opacity={0.1} wireframe />
          </mesh>
        </group>
      )}
    </group>
  );
};

export default LevyStatusVisualization;
