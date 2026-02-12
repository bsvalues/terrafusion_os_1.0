import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface KineticTypographyProps {
  text: string;
  className?: string;
  variant?: 'slide-up' | 'fade' | 'wave' | 'highlight';
  delay?: number; // Delay in ms before animation starts
  duration?: number; // Animation duration in ms
  triggerOnView?: boolean; // If true, triggers when element is in view
  staggerDelay?: number; // Delay between each character for wave effect
}

/**
 * KineticTypography Component
 *
 * A component that animates text with various effects based on the 2025 trend
 * of dynamic and kinetic typography.
 */
export const KineticTypography: React.FC<KineticTypographyProps> = ({
  text,
  className,
  variant = 'slide-up',
  delay = 0,
  duration = 500,
  triggerOnView = true,
  staggerDelay = 30,
}) => {
  const [isVisible, setIsVisible] = useState(!triggerOnView);
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!triggerOnView) {
      setTimeout(() => {
        setIsVisible(true);
      }, delay);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [triggerOnView, delay]);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(
        () => {
          setIsAnimationComplete(true);
        },
        duration + (variant === 'wave' ? text.length * staggerDelay : 0)
      );

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, variant, text, staggerDelay]);

  const renderSlideUp = () => (
    <div className={cn('overflow-hidden', className)} ref={elementRef}>
      <div
        className={cn(
          'transform transition-transform',
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        )}
        style={{
          transitionDuration: `${duration}ms`,
          transitionTimingFunction: 'cubic-bezier(0.17, 0.67, 0.83, 0.67)',
        }}
      >
        {text}
      </div>
    </div>
  );

  const renderFade = () => (
    <div
      ref={elementRef}
      className={cn(className, 'transition-opacity', isVisible ? 'opacity-100' : 'opacity-0')}
      style={{
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'ease',
      }}
    >
      {text}
    </div>
  );

  const renderWave = () => (
    <div ref={elementRef} className={cn(className, 'inline-flex')}>
      {text.split('').map((char /* , index */) => (
        <span
          key={index}
          className={cn(
            'inline-block transition-transform',
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-[0.5em] opacity-0'
          )}
          style={{
            transitionDelay: isVisible ? `${delay + index * staggerDelay}ms` : '0ms',
            transitionDuration: `${duration}ms`,
            transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            transitionProperty: 'transform, opacity',
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </div>
  );

  const renderHighlight = () => (
    <div ref={elementRef} className={cn(className, 'relative inline-block')}>
<>
      <span>{text}</span>
      <span
</>
        className={cn(
          'absolute bottom-0 left-0 h-[3px] bg-primary rounded-full',
          isVisible ? 'w-full' : 'w-0'
        )}
        style={{
          transitionProperty: 'width',
          transitionDuration: `${duration}ms`,
          transitionTimingFunction: 'ease-out',
          transitionDelay: `${delay}ms`,
        }}
      />
    </div>
  );

  switch (variant) {
    case 'fade':
      return renderFade();
    case 'wave':
      return renderWave();
    case 'highlight':
      return renderHighlight();
    case 'slide-up':
    default:
      return renderSlideUp();
  }
};

export default KineticTypography;
