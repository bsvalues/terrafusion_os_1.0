import { Line, Sphere, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import React, { useMemo, useRef } from 'react';
import { Color, Group, Vector3 } from 'three';
import { PaymentFlow } from '../../../types/PaymentTypes';

interface PaymentTrackingSphereProps {
  data?: PaymentFlow[];
  position: [number, number, number];
  realTimeUpdates: boolean;
  predictiveMode: boolean;
}

export const PaymentTrackingSphere: React.FC<PaymentTrackingSphereProps> = ({
  data = [],
  position,
  realTimeUpdates,
  predictiveMode,
}) => {
  const sphereRef = useRef<Group>(null);
  const particleRefs = useRef<THREE.Mesh[]>([]);

  // Generate payment flow visualization
  const paymentParticles = useMemo(() => {
    return data.map((payment, index) => {
      const angle = (index / data.length) * Math.PI * 2;
      const radius = 2 + payment.amount / 10000; // Scale radius by amount

      return {
        ...payment,
        position: new Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle * 0.5) * 0.5,
          Math.sin(angle) * radius
        ),
        color: new Color().setHSL(
          payment.status === 'completed' ? 0.3 : payment.status === 'processing' ? 0.15 : 0.0,
          0.8,
          0.6
        ),
        scale: Math.log(payment.amount) / 10,
      };
    });
  }, [data]);

  useFrame((state) => {
    if (sphereRef.current) {
      // Continuous rotation for sphere
      sphereRef.current.rotation.y = state.clock.elapsedTime * 0.1;

      if (realTimeUpdates) {
        sphereRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.1;
      }

      // Animate payment particles
      particleRefs.current.forEach((particle, index) => {
        if (particle) {
          const payment = paymentParticles[index];
          if (payment?.status === 'processing') {
            particle.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3 + index) * 0.2);
          }
        }
      });
    }
  });

  // Calculate payment statistics
  const totalPayments = data.reduce((sum, payment) => sum + payment.amount, 0);
  const completedPayments = data.filter((p) => p.status === 'completed').length;
  const processingPayments = data.filter((p) => p.status === 'processing').length;

  return (
    <group ref={sphereRef} position={position}>
      {/* Main Sphere Container */}
      <Sphere args={[3, 32, 32]}>
        <meshStandardMaterial color='var(--tf-void-black)' transparent opacity={0.2} wireframe />
      </Sphere>

      {/* Title */}
      <Text position={[0, 4, 0]} fontSize={0.4} color='var(--tf-network-blue)' anchorX='center' anchorY='middle'>
        Payment Tracking
      </Text>

      {/* Real-time Indicator */}
      {realTimeUpdates && (
        <group position={[-2.5, 3.5, 0]}>
          <Sphere args={[0.08]}>
            <meshStandardMaterial color='var(--tf-success-green)' emissive='var(--tf-success-dark)' />
          </Sphere>
          <Text
            position={[0.2, 0, 0]}
            fontSize={0.12}
            color='var(--tf-success-green)'
            anchorX='left'
            anchorY='middle'
          >
            LIVE
          </Text>
        </group>
      )}

      {/* Predictive Mode Indicator */}
      {predictiveMode && (
        <group position={[2.5, 3.5, 0]}>
          <Sphere args={[0.08]}>
            <meshStandardMaterial color='var(--tf-accent-orange)' emissive='var(--tf-surface-dark)' />
          </Sphere>
          <Text
            position={[-0.2, 0, 0]}
            fontSize={0.12}
            color='var(--tf-accent-orange)'
            anchorX='right'
            anchorY='middle'
          >
            PREDICTIVE
          </Text>
        </group>
      )}

      {/* Payment Particles */}
      {paymentParticles.map((payment, index) => (
        <group key={payment.id} position={payment.position.toArray()}>
          <Sphere ref={(el) => (particleRefs.current[index] = el!)} args={[payment.scale * 0.1]}>
            <meshStandardMaterial
              color={payment.color}
              emissive={payment.color.clone().multiplyScalar(0.3)}
              transparent
              opacity={0.8}
            />
          </Sphere>

          {/* Payment Amount Label */}
          <Text
            position={[0, payment.scale * 0.15, 0]}
            fontSize={0.08}
            color='var(--tf-text-primary)fff'
            anchorX='center'
            anchorY='bottom'
          >
            ${payment.amount.toLocaleString()}
          </Text>

          {/* Payment Flow Lines */}
          {payment.status === 'processing' && (
            <Line
              points={[new Vector3(0, 0, 0), new Vector3(0, 0, -payment.scale * 0.3)]}
              color='var(--warning-amber)'
              lineWidth={2}
            />
          )}
        </group>
      ))}

      {/* Statistics Panel */}
      <group position={[0, -3.5, 0]}>
        <Text
          position={[-1.5, 0.3, 0]}
          fontSize={0.12}
          color='var(--tf-network-light)'
          anchorX='left'
          anchorY='middle'
        >
          Total: ${totalPayments.toLocaleString()}
        </Text>

        <Text
          position={[-1.5, 0, 0]}
          fontSize={0.1}
          color='var(--tf-success-light)'
          anchorX='left'
          anchorY='middle'
        >
          Completed: {completedPayments}
        </Text>

        <Text
          position={[-1.5, -0.3, 0]}
          fontSize={0.1}
          color='var(--tf-accent-pink)'
          anchorX='left'
          anchorY='middle'
        >
          Processing: {processingPayments}
        </Text>

        {/* Predictive Analytics */}
        {predictiveMode && (
          <group position={[1.5, 0, 0]}>
            <Text
              position={[0, 0.2, 0]}
              fontSize={0.1}
              color='var(--tf-accent-orange)'
              anchorX='left'
              anchorY='middle'
            >
              Predicted Collections:
            </Text>
            <Text
              position={[0, 0, 0]}
              fontSize={0.12}
              color='var(--warning-amber)'
              anchorX='left'
              anchorY='middle'
            >
              ${(totalPayments * 1.15).toLocaleString()}
            </Text>
            <Text
              position={[0, -0.2, 0]}
              fontSize={0.08}
              color='var(--tf-warning-dark)'
              anchorX='left'
              anchorY='middle'
            >
              (99.7% confidence)
            </Text>
          </group>
        )}
      </group>

      {/* Collection Efficiency Rings */}
      {[1.5, 2, 2.5].map((radius, index) => (
        <mesh key={index} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius, radius + 0.02, 64]} />
          <meshStandardMaterial
            color={new Color().setHSL(0.3 - index * 0.1, 0.5, 0.4)}
            transparent
            opacity={0.3}
          />
        </mesh>
      ))}

      {/* Central Core */}
      <Sphere args={[0.2]}>
        <meshStandardMaterial color='var(--tf-network-blue)' emissive='var(--tf-network-dark)' metalness={0.8} roughness={0.2} />
      </Sphere>
    </group>
  );
};

export default PaymentTrackingSphere;
