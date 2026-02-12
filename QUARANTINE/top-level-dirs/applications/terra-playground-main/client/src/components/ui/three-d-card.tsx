import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ThreeDCardProps {
  children: React.ReactNode;
  className?: string;
  depth?: number;
  glare?: boolean;
  perspective?: number;
  glowColor?: string;
  borderRadius?: string | number;
}

/**
 * ThreeDCard Component
 *
 * A 3D card component that creates an immersive experience with
 * perspective transforms based on mouse position.
 * Implements the "Immersive Full-Screen Experiences" trend from the design guide.
 */
export const ThreeDCard: React.FC<ThreeDCardProps> = ({
  children,
  className,
  depth = 15,
  glare = true,
  perspective = 1000,
  glowColor = 'rgba(59, 130, 246, 0.5)',
  borderRadius = '0.75rem',
}) => {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();

      // Calculate the position of the mouse on the card (0-1)
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      // Calculate rotation based on mouse position
      // Mapping position to rotation angle between -depth and +depth
      const rotX = (y - 0.5) * depth * -1; // invert for natural feel
      const rotY = (x - 0.5) * depth;

      setRotateX(rotX);
      setRotateY(rotY);

      // Set glare position for the light reflection effect
      setGlarePosition({
        x: x * 100,
        y: y * 100,
      });
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Reset to flat position
    setRotateX(0);
    setRotateY(0);
    setGlarePosition({ x: 50, y: 50 });
  };

  // Add smooth transition when not hovering
  useEffect(() => {
    if (cardRef.current) {
      const card = cardRef.current;
      if (isHovered) {
        card.style.transition = 'transform 0.05s ease-out';
      } else {
        card.style.transition = 'transform 0.5s ease-out';
      }
    }
  }, [isHovered]);

  return (
    <div
      ref={cardRef}
      className={cn('relative overflow-hidden bg-card', className)}
      style={{
        borderRadius: borderRadius,
        perspective: `${perspective}px`,
        transformStyle: 'preserve-3d',
        transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        boxShadow: `0 10px 30px -15px rgba(0, 0, 0, 0.2)`,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background glow effect */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-300"
        style={{
          opacity: isHovered ? 0.3 : 0,
          boxShadow: `0 0 30px 15px ${glowColor}`,
          borderRadius: borderRadius,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Glare effect overlay */}
      {glare && (
        <div
          className="absolute inset-0 pointer-events-none opacity-0 mix-blend-overlay"
          style={{
            opacity: isHovered ? 0.4 : 0,
            background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 80%)`,
            transition: isHovered ? 'opacity 0.1s ease' : 'opacity 0.5s ease',
          }}
        />
      )}

      {/* Card content with subtle transform for 3D effect */}
      <div
        className="relative z-10"
        style={{
          transform: `translateZ(${depth / 3}px)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default ThreeDCard;
