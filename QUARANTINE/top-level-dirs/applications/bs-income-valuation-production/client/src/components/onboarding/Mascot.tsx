import React from 'react';
import { motion } from 'framer-motion';

type MascotEmotion = 'happy' | 'thinking' | 'explaining' | 'celebrating' | 'surprised';

interface MascotProps {
  emotion?: MascotEmotion;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Mascot: React.FC<MascotProps> = ({ 
  emotion = 'happy',
  size = 'md',
  className = ''
}) => {
  // Determine size classes
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }[size];

  // Get SVG based on emotion
  const renderMascotSVG = () => {
    switch (emotion) {
      case 'happy':
        return (
          <svg 
            viewBox="0 0 64 64" 
            xmlns="http://www.w3.org/2000/svg"
            className={`${sizeClasses} ${className}`}
            fill="none"
          >
            <circle cx="32" cy="32" r="30" fill="#3B82F6" />
            <circle cx="32" cy="32" r="24" fill="#60A5FA" />
            <circle cx="32" cy="36" r="12" fill="#DBEAFE" />
            <circle cx="24" cy="24" r="5" fill="#1D4ED8" />
            <circle cx="24" cy="24" r="2" fill="white" />
            <circle cx="40" cy="24" r="5" fill="#1D4ED8" />
            <circle cx="40" cy="24" r="2" fill="white" />
            <path 
              d="M20 38 C20 38, 32 46, 44 38" 
              stroke="#1E40AF" 
              strokeWidth="3" 
              strokeLinecap="round" 
              fill="none" 
            />
          </svg>
        );
      
      case 'thinking':
        return (
          <svg 
            viewBox="0 0 64 64" 
            xmlns="http://www.w3.org/2000/svg"
            className={`${sizeClasses} ${className}`}
            fill="none"
          >
            <circle cx="32" cy="32" r="30" fill="#3B82F6" />
            <circle cx="32" cy="32" r="24" fill="#60A5FA" />
            <circle cx="32" cy="36" r="12" fill="#DBEAFE" />
            <circle cx="24" cy="24" r="5" fill="#1D4ED8" />
            <circle cx="24" cy="22" r="2" fill="white" />
            <circle cx="40" cy="24" r="5" fill="#1D4ED8" />
            <circle cx="40" cy="22" r="2" fill="white" />
            <path 
              d="M26 40 H38" 
              stroke="#1E40AF" 
              strokeWidth="3" 
              strokeLinecap="round" 
              fill="none" 
            />
            <circle cx="50" cy="20" r="6" fill="#DBEAFE" />
            <path 
              d="M45 15 L48 12" 
              stroke="#DBEAFE" 
              strokeWidth="2" 
              strokeLinecap="round" 
            />
          </svg>
        );
      
      case 'explaining':
        return (
          <svg 
            viewBox="0 0 64 64" 
            xmlns="http://www.w3.org/2000/svg"
            className={`${sizeClasses} ${className}`}
            fill="none"
          >
            <circle cx="32" cy="32" r="30" fill="#3B82F6" />
            <circle cx="32" cy="32" r="24" fill="#60A5FA" />
            <circle cx="32" cy="36" r="12" fill="#DBEAFE" />
            <circle cx="24" cy="24" r="5" fill="#1D4ED8" />
            <circle cx="24" cy="24" r="2" fill="white" />
            <circle cx="40" cy="24" r="5" fill="#1D4ED8" />
            <circle cx="40" cy="24" r="2" fill="white" />
            <path 
              d="M24 40 H40" 
              stroke="#1E40AF" 
              strokeWidth="3" 
              strokeLinecap="round" 
              fill="none" 
            />
            <path 
              d="M46 18 L54 18 L50 26 L46 18" 
              fill="#FDE68A" 
              stroke="#F59E0B" 
              strokeWidth="1.5" 
            />
          </svg>
        );
      
      case 'celebrating':
        return (
          <svg 
            viewBox="0 0 64 64" 
            xmlns="http://www.w3.org/2000/svg"
            className={`${sizeClasses} ${className}`}
            fill="none"
          >
            <circle cx="32" cy="32" r="30" fill="#3B82F6" />
            <circle cx="32" cy="32" r="24" fill="#60A5FA" />
            <circle cx="32" cy="36" r="12" fill="#DBEAFE" />
            <circle cx="24" cy="24" r="5" fill="#1D4ED8" />
            <path d="M22 23 L26 25" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <circle cx="40" cy="24" r="5" fill="#1D4ED8" />
            <path d="M38 23 L42 25" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <path 
              d="M20 38 C20 38, 32 50, 44 38" 
              stroke="#1E40AF" 
              strokeWidth="3" 
              strokeLinecap="round" 
              fill="none" 
            />
            <path d="M10 10 L15 15" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" />
            <path d="M54 10 L49 15" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" />
            <path d="M10 54 L15 49" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" />
            <path d="M54 54 L49 49" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      
      case 'surprised':
        return (
          <svg 
            viewBox="0 0 64 64" 
            xmlns="http://www.w3.org/2000/svg"
            className={`${sizeClasses} ${className}`}
            fill="none"
          >
            <circle cx="32" cy="32" r="30" fill="#3B82F6" />
            <circle cx="32" cy="32" r="24" fill="#60A5FA" />
            <circle cx="32" cy="36" r="12" fill="#DBEAFE" />
            <circle cx="24" cy="24" r="5" fill="#1D4ED8" />
            <circle cx="24" cy="24" r="2" fill="white" />
            <circle cx="40" cy="24" r="5" fill="#1D4ED8" />
            <circle cx="40" cy="24" r="2" fill="white" />
            <circle cx="32" cy="40" r="5" stroke="#1E40AF" strokeWidth="3" fill="none" />
            <path d="M52 20 L56 16" stroke="#F87171" strokeWidth="2" strokeLinecap="round" />
            <path d="M52 16 L56 20" stroke="#F87171" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      
      default:
        // Default to happy
        return (
          <svg 
            viewBox="0 0 64 64" 
            xmlns="http://www.w3.org/2000/svg"
            className={`${sizeClasses} ${className}`}
            fill="none"
          >
            <circle cx="32" cy="32" r="30" fill="#3B82F6" />
            <circle cx="32" cy="32" r="24" fill="#60A5FA" />
            <circle cx="32" cy="36" r="12" fill="#DBEAFE" />
            <circle cx="24" cy="24" r="5" fill="#1D4ED8" />
            <circle cx="24" cy="24" r="2" fill="white" />
            <circle cx="40" cy="24" r="5" fill="#1D4ED8" />
            <circle cx="40" cy="24" r="2" fill="white" />
            <path 
              d="M20 38 C20 38, 32 46, 44 38" 
              stroke="#1E40AF" 
              strokeWidth="3" 
              strokeLinecap="round" 
              fill="none" 
            />
          </svg>
        );
    }
  };

  // For a smoother transition between emotions
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0.5 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {renderMascotSVG()}
    </motion.div>
  );
};