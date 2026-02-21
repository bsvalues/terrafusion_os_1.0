/**
 * TerraSphere Logo Component
 *
 * The iconic TerraFusion animated logo - a 3D wireframe sphere with
 * rotating rings and a glowing cyan core. This is THE brand mark.
 *
 * States:
 * - idle: Gentle breathing animation
 * - processing: Intense pulsing with faster rotation
 * - success: Green burst effect
 * - alert: Red warning pulse
 *
 * @see TERRAFUSION BRAND CODEX - terrasphere_animation.html
 */

import React from 'react';

export type TerraSphereState = 'idle' | 'processing' | 'boot' | 'success' | 'alert';

interface TerraSphereProps {
  size?: number;
  state?: TerraSphereState;
  className?: string;
}

export const TerraSphere: React.FC<TerraSphereProps> = ({
  size = 150,
  state = 'idle',
  className = '',
}) => {
  const ringCount = 7;

  const getStateStyles = () => {
    switch (state) {
      case 'processing':
        return {
          sphereAnimation: 'sphereRotate 3s linear infinite',
          coreColor: 'hsl(var(--tf-cyan-hs) / 50%)',
          coreShadow: '0 0 80px hsl(var(--tf-cyan-hs) / 50%), inset 0 0 40px hsl(var(--tf-cyan-hs) / 50%)',
          ringAnimation: 'ringPulse 0.5s ease-in-out infinite',
        };
      case 'boot':
        return {
          sphereAnimation: 'bootSequence 4s ease-out infinite',
          coreColor: 'hsl(var(--tf-cyan-hs) / 50%)',
          coreShadow: '0 0 40px hsl(var(--tf-cyan-hs) / 50%), inset 0 0 20px hsl(var(--tf-cyan-hs) / 50%)',
          ringAnimation: undefined,
        };
      case 'success':
        return {
          sphereAnimation: 'sphereRotate 10s linear infinite',
          coreColor: 'hsl(var(--tf-green-hs) / 50%)',
          coreShadow: '0 0 100px hsl(var(--tf-green-hs) / 50%), 0 0 200px hsl(var(--tf-cyan-hs) / 50%), inset 0 0 40px hsl(var(--tf-green-hs) / 50%)',
          ringAnimation: undefined,
        };
      case 'alert':
        return {
          sphereAnimation: 'sphereRotate 5s linear infinite',
          coreColor: 'hsl(var(--tf-red-hs) / 53%)',
          coreShadow: '0 0 40px hsl(var(--tf-red-hs) / 53%), inset 0 0 20px hsl(var(--tf-red-hs) / 53%)',
          ringAnimation: 'alertPulse 0.5s ease-in-out infinite',
          ringColor: 'hsl(var(--tf-red-hs) / 53% / 0.5)',
        };
      default: // idle
        return {
          sphereAnimation: 'sphereRotate 10s linear infinite, breathe 6s ease-in-out infinite',
          coreColor: 'hsl(var(--tf-cyan-hs) / 50%)',
          coreShadow: '0 0 40px hsl(var(--tf-cyan-hs) / 50%), inset 0 0 20px hsl(var(--tf-cyan-hs) / 50%)',
          ringAnimation: undefined,
        };
    }
  };

  const styles = getStateStyles();
  const ringColor = (styles as any).ringColor || 'hsl(var(--tf-cyan-hs) / 50% / 0.3)';

  return (
    <div
      className={`terrasphere-container ${className}`}
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* 3D Sphere with rotating rings */}
      <div
        className='terrasphere'
        style={{
          width: size * 0.8,
          height: size * 0.8,
          position: 'relative',
          transformStyle: 'preserve-3d',
          animation: styles.sphereAnimation,
        }}
      >
        {/* Wireframe rings */}
        {Array.from({ length: ringCount }).map((_, i) => (
          <div
            key={i}
            className='sphere-ring'
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              border: `2px solid ${ringColor}`,
              borderRadius: '50%',
              transformStyle: 'preserve-3d',
              transform: i < 4 ? `rotateX(${i * 30}deg)` : `rotateY(${(i - 4 + 1) * 30}deg)`,
              animation: styles.ringAnimation,
            }}
          />
        ))}

        {/* Glowing core */}
        <div
          className='core-vortex'
          style={{
            position: 'absolute',
            width: size * 0.4,
            height: size * 0.4,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, ${styles.coreColor} 0%, transparent 70%)`,
            borderRadius: '50%',
            boxShadow: styles.coreShadow,
            animation:
              state === 'processing'
                ? 'intensePulse 0.5s ease-in-out infinite'
                : 'pulse 2s ease-in-out infinite',
          }}
        >
          {/* Inner spiral */}
          <div
            className='core-spiral'
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              background: `conic-gradient(from 0deg, transparent, ${styles.coreColor}, transparent)`,
              borderRadius: '50%',
              animation: 'spiralRotate 3s linear infinite',
              opacity: 0.6,
            }}
          />
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes sphereRotate {
          from { transform: rotateY(0deg) rotateX(0deg); }
          to { transform: rotateY(360deg) rotateX(360deg); }
        }
        
        @keyframes spiralRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.1); }
        }
        
        @keyframes intensePulse {
          0%, 100% { box-shadow: 0 0 40px hsl(var(--tf-cyan-hs) / 50%), inset 0 0 20px hsl(var(--tf-cyan-hs) / 50%); }
          50% { box-shadow: 0 0 80px hsl(var(--tf-cyan-hs) / 50%), inset 0 0 40px hsl(var(--tf-cyan-hs) / 50%); }
        }
        
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes bootSequence {
          0% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(180deg); opacity: 1; }
          100% { transform: scale(1) rotate(360deg); opacity: 1; }
        }
        
        @keyframes ringPulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        
        @keyframes alertPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};

export default TerraSphere;
