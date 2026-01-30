import { Plane, RoundedBox, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import React, { useRef, useState } from 'react';
import { Color } from 'three';
import { CitizenInteraction } from '../../../types/CitizenTypes';

interface CitizenInteractionPanelProps {
  data?: CitizenInteraction[];
  position: [number, number, number];
  interactive: boolean;
  aiEnhanced: boolean;
}

export const CitizenInteractionPanel: React.FC<CitizenInteractionPanelProps> = ({
  data = [],
  position,
  interactive,
  aiEnhanced,
}) => {
  const [selectedCitizen, setSelectedCitizen] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const panelRef = useRef<THREE.Group>(null);

  const recentInteractions = data.slice(0, 10); // Show last 10 interactions

  useFrame((state) => {
    if (panelRef.current && aiEnhanced) {
      // AI-enhanced pulsing effect
      panelRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.02);
    }
  });

  const handleCitizenClick = (citizenId: string) => {
    setSelectedCitizen(selectedCitizen === citizenId ? null : citizenId);
  };

  const getInteractionColor = (interaction: CitizenInteraction): Color => {
    switch (interaction.type) {
      case 'payment':
        return new Color('var(--success-green)');
      case 'inquiry':
        return new Color('var(--tf-network-light)');
      case 'dispute':
        return new Color('var(--tf-error-light)');
      case 'appeal':
        return new Color('var(--tf-warning-amber)');
      default:
        return new Color('var(--tf-text-primary)fff');
    }
  };

  const getUrgencyScale = (urgency: string): number => {
    switch (urgency) {
      case 'high':
        return 1.2;
      case 'medium':
        return 1.0;
      case 'low':
        return 0.8;
      default:
        return 1.0;
    }
  };

  return (
    <group ref={panelRef} position={position}>
      {/* Panel Background */}
      <RoundedBox args={[8, 6, 0.2]} radius={0.1} smoothness={4}>
        <meshStandardMaterial
          color='var(--tf-surface-darker)'
          transparent
          opacity={0.9}
          metalness={0.3}
          roughness={0.7}
        />
      </RoundedBox>

      {/* Title */}
      <Text
        position={[0, 2.5, 0.2]}
        fontSize={0.4}
        color='var(--success-green)'
        anchorX='center'
        anchorY='middle'
        font='/fonts/QuantumFont.woff'
      >
        Citizen Interactions
      </Text>

      {/* AI Enhancement Indicator */}
      {aiEnhanced && (
        <group position={[3.5, 2.5, 0.2]}>
          <mesh>
            <sphereGeometry args={[0.1]} />
            <meshStandardMaterial color='var(--tf-quantum-cyan)' emissive='var(--tf-surface-darker)' />
          </mesh>
          <Text
            position={[0.3, 0, 0]}
            fontSize={0.15}
            color='var(--tf-quantum-cyan)'
            anchorX='left'
            anchorY='middle'
          >
            AI Enhanced
          </Text>
        </group>
      )}

      {/* Interaction List */}
      {recentInteractions.map((interaction, index) => {
        const yPos = 1.5 - index * 0.3;
        const isSelected = selectedCitizen === interaction.citizenId;
        const isHovered = hoveredIndex === index;

        return (
          <group
            key={interaction.id}
            position={[0, yPos, 0.1]}
            scale={getUrgencyScale(interaction.urgency)}
          >
            {/* Interaction Row Background */}
            <Plane
              args={[7, 0.25]}
              onPointerEnter={() => setHoveredIndex(index)}
              onPointerLeave={() => setHoveredIndex(null)}
              onClick={() => handleCitizenClick(interaction.citizenId)}
            >
              <meshStandardMaterial
                color={isSelected ? 'var(--tf-bg-surface)366' : isHovered ? 'var(--tf-surface-darker)' : 'var(--tf-surface-darker)'}
                transparent
                opacity={0.8}
              />
            </Plane>

            {/* Citizen Name */}
            <Text
              position={[-3, 0, 0.01]}
              fontSize={0.12}
              color='var(--tf-text-primary)fff'
              anchorX='left'
              anchorY='middle'
              maxWidth={1.5}
            >
              {interaction.citizenName}
            </Text>

            {/* Interaction Type */}
            <Text
              position={[-1, 0, 0.01]}
              fontSize={0.1}
              color={getInteractionColor(interaction).getHexString()}
              anchorX='left'
              anchorY='middle'
            >
              {interaction.type.toUpperCase()}
            </Text>

            {/* Amount (if applicable) */}
            {interaction.amount && (
              <Text
                position={[1, 0, 0.01]}
                fontSize={0.1}
                color='var(--tf-success-light)'
                anchorX='center'
                anchorY='middle'
              >
                ${interaction.amount.toLocaleString()}
              </Text>
            )}

            {/* Timestamp */}
            <Text
              position={[2.8, 0, 0.01]}
              fontSize={0.08}
              color='var(--gray-400)'
              anchorX='right'
              anchorY='middle'
            >
              {new Date(interaction.timestamp).toLocaleTimeString()}
            </Text>

            {/* AI Recommendation Indicator */}
            {aiEnhanced && interaction.aiRecommendation && (
              <mesh position={[3.2, 0, 0.01]}>
                <sphereGeometry args={[0.03]} />
                <meshStandardMaterial color='var(--warning-amber)' emissive='var(--tf-surface-dark)' />
              </mesh>
            )}

            {/* Urgency Indicator */}
            <mesh position={[-3.5, 0, 0.01]}>
              <cylinderGeometry args={[0.03, 0.03, 0.1]} />
              <meshStandardMaterial
                color={
                  interaction.urgency === 'high'
                    ? 'var(--error-red)'
                    : interaction.urgency === 'medium'
                      ? 'var(--tf-warning-amber)'
                      : 'var(--tf-accent-success)'
                }
                emissive={
                  interaction.urgency === 'high'
                    ? 'var(--tf-surface-darker)'
                    : interaction.urgency === 'medium'
                      ? 'var(--tf-surface-darker)'
                      : 'var(--tf-success-dark)'
                }
              />
            </mesh>
          </group>
        );
      })}

      {/* Selected Citizen Details Panel */}
      {selectedCitizen && (
        <group position={[0, -2.5, 0.2]}>
          <RoundedBox args={[7, 1.5, 0.1]} radius={0.05}>
            <meshStandardMaterial color='var(--tf-surface-card)' transparent opacity={0.95} />
          </RoundedBox>

          <Text
            position={[0, 0.5, 0.1]}
            fontSize={0.15}
            color='var(--success-green)'
            anchorX='center'
            anchorY='middle'
          >
            Citizen Details: {selectedCitizen}
          </Text>

          {/* AI-Generated Recommendations */}
          {aiEnhanced && (
            <Text
              position={[0, 0, 0.1]}
              fontSize={0.1}
              color='var(--tf-accent-pink)'
              anchorX='center'
              anchorY='middle'
              maxWidth={6}
            >
              AI Recommendation: Review payment history and consider payment plan options
            </Text>
          )}
        </group>
      )}

      {/* Real-time Activity Indicator */}
      <group position={[-3.5, -2.8, 0.2]}>
        <mesh>
          <sphereGeometry args={[0.05]} />
          <meshStandardMaterial color='var(--tf-success-green)' emissive='var(--tf-success-dark)' />
        </mesh>
        <Text position={[0.2, 0, 0]} fontSize={0.1} color='var(--tf-success-green)' anchorX='left' anchorY='middle'>
          Live Updates
        </Text>
      </group>
    </group>
  );
};

export default CitizenInteractionPanel;
