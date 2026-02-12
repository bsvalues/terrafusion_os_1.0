import type { Meta, StoryObj } from '@storybook/react-vite';
import { tokens } from '../tokens';
import { useState } from 'react';

/**
 * TerraFusion Design System - Motion Tokens
 * 
 * Animation and transition system for smooth, consistent motion design.
 * Includes durations, easings, transitions, and animation presets.
 */
const meta: Meta = {
  title: 'Design System/Tokens/Motion',
  parameters: {
    layout: 'padded'
  },
  tags: ['autodocs']
};
export default meta;
type Story = StoryObj;
const AnimatedBox = ({
  children,
  animation,
  onClick
}: {
  children: React.ReactNode;
  animation?: string;
  onClick?: () => void;
}) => <div onClick={onClick} style={{
  backgroundColor: tokens.colors.brand.primary[500],
  borderRadius: tokens.radius.lg,
  animation
}} className="items-center font-semibold">
    {children}
  </div>;
export const Durations: Story = {
  render: () => <div>
      <h2 style={{
      color: '#fff',
      marginBottom: '32px',
      fontSize: '24px',
      fontWeight: 700
    }}>
        Duration Values
      </h2>
      <p style={{
      color: '#b3b3b3',
      marginBottom: '32px',
      fontSize: '14px',
      lineHeight: '1.6'
    }}>
        Standard duration values for animations and transitions.
      </p>
      <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
      gap: '16px'
    }}>
        {Object.entries(tokens.motion.duration).map(([name, value]) => <div key={name} style={{
        backgroundColor: tokens.colors.semantic.surface.elevated,
        padding: tokens.spacing[4],
        borderRadius: tokens.radius.md,
        border: `1px solid ${tokens.colors.semantic.border.default}`
      }}>
            <div className="font-semibold">
              {name}
            </div>
            <div style={{
          color: tokens.colors.brand.primary[400],
          fontFamily: tokens.typography.fontFamily.mono,
          fontSize: '14px'
        }}>
              {value}
            </div>
          </div>)}
      </div>
    </div>
};
export const Easings: Story = {
  render: () => {
    const [activeEasing, setActiveEasing] = useState<string | null>(null);
    return <div>
        <h2 style={{
        color: '#fff',
        marginBottom: '32px',
        fontSize: '24px',
        fontWeight: 700
      }}>
          Easing Functions
        </h2>
        <p style={{
        color: '#b3b3b3',
        marginBottom: '32px',
        fontSize: '14px',
        lineHeight: '1.6'
      }}>
          Click any box to see the easing in action.
        </p>
        <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '24px'
      }}>
          {Object.entries(tokens.motion.easing).map(([name, value]) => {
          const isAnimating = activeEasing === name;
          return <div key={name} className="text-center">
                <div onClick={() => {
              setActiveEasing(name);
              setTimeout(() => setActiveEasing(null), 1000);
            }} style={{
              backgroundColor: tokens.colors.brand.primary[500],
              borderRadius: tokens.radius.lg,
              transform: isAnimating ? 'translateX(100px)' : 'translateX(0)',
              transition: `transform 800ms ${value}`
            }} className="w-full flex items-center font-semibold">
                  Click Me
                </div>
                <div style={{
              marginTop: '12px'
            }}>
                  <div className="font-semibold">
                    {name}
                  </div>
                  <div style={{
                fontFamily: tokens.typography.fontFamily.mono
              }} className="text-gray-400">
                    {value}
                  </div>
                </div>
              </div>;
        })}
        </div>
      </div>;
  }
};
export const FadeAnimations: Story = {
  render: () => {
    const [show, setShow] = useState(true);
    return <div>
        <h2 style={{
        color: '#fff',
        marginBottom: '32px',
        fontSize: '24px',
        fontWeight: 700
      }}>
          Fade Animations
        </h2>
        <button onClick={() => setShow(!show)} style={{
        backgroundColor: tokens.colors.component.button.primary.background,
        padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
        borderRadius: tokens.semantic.radius.button
      }} className="font-semibold">
          Toggle Fade
        </button>
        <div className="flex">
          {show && <>
              <div className="text-center">
                <AnimatedBox animation={tokens.motion.animation.fadeIn}>
                  Fade In
                </AnimatedBox>
                <div className="text-gray-400">fadeIn</div>
              </div>
              <div className="text-center">
                <AnimatedBox animation={tokens.motion.animation.scaleIn}>
                  Scale In
                </AnimatedBox>
                <div className="text-gray-400">scaleIn</div>
              </div>
              <div className="text-center">
                <AnimatedBox animation={tokens.motion.animation.slideInUp}>
                  Slide Up
                </AnimatedBox>
                <div className="text-gray-400">slideInUp</div>
              </div>
              <div className="text-center">
                <AnimatedBox animation={tokens.motion.animation.slideInLeft}>
                  Slide Left
                </AnimatedBox>
                <div className="text-gray-400">slideInLeft</div>
              </div>
            </>}
        </div>
      </div>;
  }
};
export const ContinuousAnimations: Story = {
  render: () => <div>
      <h2 style={{
      color: '#fff',
      marginBottom: '32px',
      fontSize: '24px',
      fontWeight: 700
    }}>
        Continuous Animations
      </h2>
      <p style={{
      color: '#b3b3b3',
      marginBottom: '32px',
      fontSize: '14px',
      lineHeight: '1.6'
    }}>
        Looping animations for loading states and attention-grabbing elements.
      </p>
      <div className="flex">
        <div className="text-center">
          <AnimatedBox animation={tokens.motion.animation.pulse}>
            Pulse
          </AnimatedBox>
          <div className="text-gray-400">pulse</div>
        </div>
        <div className="text-center">
          <AnimatedBox animation={tokens.motion.animation.spin}>
            <div style={{
            fontSize: '32px'
          }}>⟳</div>
          </AnimatedBox>
          <div className="text-gray-400">spin</div>
        </div>
        <div className="text-center">
          <AnimatedBox animation={tokens.motion.animation.bounce}>
            Bounce
          </AnimatedBox>
          <div className="text-gray-400">bounce</div>
        </div>
        <div className="text-center">
          <div style={{
          backgroundColor: tokens.colors.brand.primary[500],
          borderRadius: tokens.radius.lg,
          animation: tokens.motion.animation.glow
        }} className="flex items-center font-semibold">
            Glow
          </div>
          <div className="text-gray-400">glow</div>
        </div>
      </div>
    </div>
};
export const InteractiveTransitions: Story = {
  render: () => {
    const [hoveredButton, setHoveredButton] = useState<string | null>(null);
    const Button = ({
      label,
      speed
    }: {
      label: string;
      speed: 'fast' | 'normal' | 'slow';
    }) => <button onMouseEnter={() => setHoveredButton(label)} onMouseLeave={() => setHoveredButton(null)} style={{
      backgroundColor: hoveredButton === label ? tokens.colors.component.button.primary.hover : tokens.colors.component.button.primary.background,
      padding: `${tokens.spacing[3]} ${tokens.spacing[6]}`,
      borderRadius: tokens.semantic.radius.button,
      transition: tokens.motion.transition[speed].colors,
      transform: hoveredButton === label ? 'translateY(-2px)' : 'translateY(0)'
    }} className="font-semibold">
        {label} Transition
      </button>;
    return <div>
        <h2 style={{
        color: '#fff',
        marginBottom: '32px',
        fontSize: '24px',
        fontWeight: 700
      }}>
          Interactive Transitions
        </h2>
        <p style={{
        color: '#b3b3b3',
        marginBottom: '32px',
        fontSize: '14px',
        lineHeight: '1.6'
      }}>
          Hover over the buttons to see different transition speeds.
        </p>
        <div className="flex">
          <Button label="Fast (100ms)" speed="fast" />
          <Button label="Normal (200ms)" speed="normal" />
          <Button label="Slow (400ms)" speed="slow" />
        </div>
      </div>;
  }
};
export const LoadingStates: Story = {
  render: () => <div>
      <h2 style={{
      color: '#fff',
      marginBottom: '32px',
      fontSize: '24px',
      fontWeight: 700
    }}>
        Loading States
      </h2>
      <p style={{
      color: '#b3b3b3',
      marginBottom: '32px',
      fontSize: '14px',
      lineHeight: '1.6'
    }}>
        Common loading patterns using motion tokens.
      </p>
      
      <div style={{
      marginBottom: '48px'
    }}>
        <h3 className="font-semibold">
          Spinner
        </h3>
        <div style={{
        width: '40px',
        height: '40px',
        border: `4px solid ${tokens.colors.semantic.border.default}`,
        borderTopColor: tokens.colors.brand.primary[500],
        borderRadius: '50%',
        animation: tokens.motion.animation.spin
      }} />
      </div>

      <div style={{
      marginBottom: '48px'
    }}>
        <h3 className="font-semibold">
          Pulsing Dots
        </h3>
        <div className="flex">
          {[0, 1, 2].map(i => <div key={i} style={{
          width: '12px',
          height: '12px',
          backgroundColor: tokens.colors.brand.primary[500],
          borderRadius: '50%',
          animation: tokens.motion.animation.pulse,
          animationDelay: `${i * 150}ms`
        }} />)}
        </div>
      </div>

      <div>
        <h3 className="font-semibold">
          Progress Bar
        </h3>
        <div style={{
        width: '300px',
        height: '4px',
        backgroundColor: tokens.colors.semantic.surface.elevated,
        borderRadius: tokens.radius.full,
        overflow: 'hidden'
      }}>
          <div style={{
          background: `linear-gradient(90deg, 
                transparent 0%, 
                ${tokens.colors.brand.primary[500]} 50%, 
                transparent 100%)`,
          animation: tokens.motion.animation.shimmer
        }} className="w-full" />
        </div>
      </div>
    </div>
};
export const UsageGuidelines: Story = {
  render: () => <div>
      <h2 style={{
      color: '#fff',
      marginBottom: '24px',
      fontSize: '24px',
      fontWeight: 700
    }}>
        Usage Guidelines
      </h2>

      <div style={{
      marginBottom: '32px'
    }}>
        <h3 style={{
        color: tokens.colors.state.success[500]
      }} className="font-semibold">
          ✅ Do
        </h3>
        <ul style={{
        color: '#b3b3b3',
        fontSize: '14px',
        lineHeight: '1.8'
      }}>
          <li>Use fast (100ms) transitions for instant feedback (hover, focus)</li>
          <li>Use normal (200ms) transitions for most UI interactions</li>
          <li>Use slow (400ms) transitions for emphasis and important state changes</li>
          <li>Match easing to the type of motion (snappy for UI, smooth for content)</li>
          <li>Use spring physics for natural, physical motion</li>
        </ul>
      </div>

      <div style={{
      marginBottom: '32px'
    }}>
        <h3 style={{
        color: tokens.colors.state.error[500]
      }} className="font-semibold">
          ❌ Don't
        </h3>
        <ul style={{
        color: '#b3b3b3',
        fontSize: '14px',
        lineHeight: '1.8'
      }}>
          <li>Don't use arbitrary duration values (e.g., 237ms)</li>
          <li>Don't over-animate - motion should enhance, not distract</li>
          <li>Don't use slow transitions for frequent interactions</li>
          <li>Don't mix multiple easing functions randomly</li>
          <li>Don't animate layout properties that cause reflow (use transform instead)</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold">
          Code Examples
        </h3>
        <div style={{
        border: `1px solid ${tokens.colors.semantic.border.default}`,
        borderRadius: tokens.radius.md,
        padding: tokens.spacing[4],
        fontFamily: tokens.typography.fontFamily.mono
      }} className="overflow-x-auto">
          <pre style={{
          margin: 0
        }}>
          {`// ✅ Good - Using motion tokens
transition: tokens.motion.transition.normal.colors
animation: tokens.motion.animation.fadeIn
duration: tokens.motion.duration.fast

// ✅ Good - Framer Motion with springs
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={tokens.motion.spring.bouncy}
/>

// ❌ Bad - Hardcoded values
transition: 'all 0.2s ease'
animation: 'fadeIn 300ms'`}
          </pre>
        </div>
      </div>
    </div>
};