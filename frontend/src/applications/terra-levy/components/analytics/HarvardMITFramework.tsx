import { RoundedBox, Sphere, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import React, { useRef } from 'react';

interface HarvardMITFrameworkProps {
  position: [number, number, number];
  activeModel: string;
  quantumEnhanced: boolean;
  researchMode: boolean;
}

export const HarvardMITFramework: React.FC<HarvardMITFrameworkProps> = ({
  position,
  activeModel,
  quantumEnhanced,
  researchMode,
}) => {
  const frameworkRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (frameworkRef.current && quantumEnhanced) {
      frameworkRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  const frameworks = [
    {
      name: 'Harvard Statistical Methods',
      algorithms: ['Bayesian Inference', 'Causal Inference', 'Time Series Analysis'],
      accuracy: 0.995,
      position: [0, 2, 0] as [number, number, number],
      color: '#8B0000',
    },
    {
      name: 'MIT Quantum Computing',
      algorithms: ['QAOA', 'VQE', 'Quantum Machine Learning'],
      accuracy: 0.998,
      position: [0, 0, 0] as [number, number, number],
      color: '#FF6B35',
    },
    {
      name: 'Advanced Analytics',
      algorithms: ['Neural Networks', 'Ensemble Methods', 'Deep Learning'],
      accuracy: 0.992,
      position: [0, -2, 0] as [number, number, number],
      color: '#004080',
    },
  ];

  return (
    <group ref={frameworkRef} position={position}>
      {/* Framework Title */}
      <Text position={[0, 4, 0]} fontSize={0.4} color='#FFD700' anchorX='center' anchorY='middle'>
        Harvard/MIT Framework
      </Text>

      {/* Research Mode Indicator */}
      {researchMode && (
        <group position={[3, 3.5, 0]}>
          <Sphere args={[0.1]}>
            <meshStandardMaterial color='#FFD700' emissive='#CC8800' />
          </Sphere>
          <Text
            position={[0.3, 0, 0]}
            fontSize={0.15}
            color='#FFD700'
            anchorX='left'
            anchorY='middle'
          >
            Research Active
          </Text>
        </group>
      )}

      {/* Framework Components */}
      {frameworks.map((framework, index) => (
        <group key={framework.name} position={framework.position}>
          {/* Framework Container */}
          <RoundedBox args={[4, 1.5, 0.3]} radius={0.1} smoothness={4}>
            <meshStandardMaterial
              color={framework.color}
              transparent
              opacity={0.8}
              metalness={quantumEnhanced ? 0.7 : 0.3}
              roughness={0.2}
            />
          </RoundedBox>

          {/* Framework Name */}
          <Text
            position={[0, 0.5, 0.2]}
            fontSize={0.2}
            color='#FFFFFF'
            anchorX='center'
            anchorY='middle'
            maxWidth={3.5}
          >
            {framework.name}
          </Text>

          {/* Accuracy Display */}
          <Text
            position={[0, 0.2, 0.2]}
            fontSize={0.15}
            color='#00FF88'
            anchorX='center'
            anchorY='middle'
          >
            Accuracy: {(framework.accuracy * 100).toFixed(1)}%
          </Text>

          {/* Algorithm List */}
          {framework.algorithms.map((algorithm, algIndex) => (
            <Text
              key={algorithm}
              position={[0, -0.1 - algIndex * 0.15, 0.2]}
              fontSize={0.08}
              color='#CCCCCC'
              anchorX='center'
              anchorY='middle'
              maxWidth={3.5}
            >
              • {algorithm}
            </Text>
          ))}

          {/* Quantum Enhancement Indicator */}
          {quantumEnhanced && framework.name.includes('MIT') && (
            <group position={[1.8, 0.5, 0.2]}>
              <Sphere args={[0.05]}>
                <meshStandardMaterial color='#00FFFF' emissive='#0088AA' />
              </Sphere>
              <Text
                position={[0.15, 0, 0]}
                fontSize={0.06}
                color='#00FFFF'
                anchorX='left'
                anchorY='middle'
              >
                QUANTUM
              </Text>
            </group>
          )}
        </group>
      ))}

      {/* Academic Network Connections */}
      {researchMode && (
        <group position={[0, -3.5, 0]}>
          <Text
            position={[0, 0.3, 0]}
            fontSize={0.15}
            color='#FFD700'
            anchorX='center'
            anchorY='middle'
          >
            Academic Network Status
          </Text>

          <Text
            position={[0, 0, 0]}
            fontSize={0.1}
            color='#00FF88'
            anchorX='center'
            anchorY='middle'
          >
            ✓ Harvard Statistics Department
          </Text>

          <Text
            position={[0, -0.2, 0]}
            fontSize={0.1}
            color='#00FF88'
            anchorX='center'
            anchorY='middle'
          >
            ✓ MIT Quantum Computing Lab
          </Text>

          <Text
            position={[0, -0.4, 0]}
            fontSize={0.1}
            color='#FFAA00'
            anchorX='center'
            anchorY='middle'
          >
            ◐ Government Research Network
          </Text>
        </group>
      )}
    </group>
  );
};

export default HarvardMITFramework;
