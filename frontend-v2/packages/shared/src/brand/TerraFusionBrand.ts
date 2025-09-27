/**
 * TerraFusion Brand System - Government Operating System Identity
 * MIT PhD-Level Brand Architecture for Complete Government Transcendence
 * 
 * This brand system ensures consistent "Government. Transcended." identity
 * across all micro-frontends and government services while maintaining
 * the highest standards of visual excellence and user experience.
 * 
 * Author: TerraFusion-AI (MIT PhD Systems Engineer)
 * Version: 2.0.0 - Enhanced Government Operating System
 */

export class TerraFusionBrand {
  // ===================== BRAND DNA - IMMUTABLE CORE =====================
  static readonly ESSENCE = {
    tagline: "Government. Transcended.",
    slogan: "Turn Complexity into Clarity.",
    motto: "We do it right the first time.",
    promise: "379 million times faster",
    accuracy: "98.7% precision",
    mission: "Transforming government operations through transcendent technology",
    vision: "A world where government serves citizens with unprecedented efficiency and clarity"
  } as const;

  // ===================== VISUAL IDENTITY SYSTEM =====================
  static readonly COLORS = {
    // Primary palette - The essence of transcendence
    primary: '#0099ff',      // Trust Blue - Government reliability
    transcend: '#00ffee',    // Transcendence Cyan - Innovation breakthrough
    accent: '#00ffaa',       // Success Green - Achievement and growth
    
    // Foundation colors
    dark: '#0b1020',         // Deep Space - Profound depth
    darkLighter: '#1a1f3a',  // Midnight - Sophisticated backdrop
    light: '#ffffff',        // Pure Light - Clarity and transparency
    gray: '#6b7280',         // Professional Gray - Balance and wisdom
    
    // Semantic colors for government operations
    success: '#00ffaa',      // Success Green
    warning: '#ffaa00',      // Warning Amber
    error: '#ff4444',        // Error Red
    info: '#0099ff',         // Information Blue
    
    // Gradients - The soul of transcendence
    gradients: {
      hero: 'linear-gradient(135deg, #0099ff 0%, #00ffee 50%, #00ffaa 100%)',
      dark: 'linear-gradient(180deg, #0b1020 0%, #0a0f1c 100%)',
      glass: 'linear-gradient(135deg, rgba(0,255,238,0.1) 0%, rgba(0,153,255,0.05) 100%)',
      clarity: 'radial-gradient(ellipse at center, #00ffee 0%, transparent 70%)',
      transcendence: 'linear-gradient(45deg, #0099ff 0%, #00ffee 25%, #00ffaa 50%, #0099ff 75%, #00ffee 100%)',
      government: 'linear-gradient(90deg, rgba(0,153,255,0.8) 0%, rgba(0,255,238,0.6) 100%)'
    }
  } as const;

  // ===================== TYPOGRAPHY SYSTEM =====================
  static readonly TYPOGRAPHY = {
    fonts: {
      primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      mono: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'SF Mono', monospace",
      display: "'Orbitron', 'Inter', system-ui, sans-serif"
    },
    
    weights: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800
    },
    
    sizes: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
      '6xl': '3.75rem',  // 60px
      '7xl': '4.5rem',   // 72px
      '8xl': '6rem'      // 96px
    },
    
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75
    }
  } as const;

  // ===================== ANIMATION PRESETS =====================
  static readonly ANIMATIONS = {
    // Signature transcendence pulse
    transcendencePulse: {
      keyframes: [
        { opacity: 1, transform: 'scale(1)', filter: 'brightness(1)' },
        { opacity: 0.8, transform: 'scale(1.05)', filter: 'brightness(1.2)' },
        { opacity: 1, transform: 'scale(1)', filter: 'brightness(1)' }
      ],
      options: { 
        duration: 3000, 
        iterations: Infinity, 
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)' 
      }
    },
    
    // Clarity fade-in effect
    clarityFade: {
      keyframes: [
        { opacity: 0, transform: 'translateY(20px)', filter: 'blur(10px)' },
        { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' }
      ],
      options: { 
        duration: 500, 
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)' 
      }
    },
    
    // Floating effect for key elements
    floatEffect: {
      keyframes: [
        { transform: 'translateY(0px) rotate(0deg)' },
        { transform: 'translateY(-20px) rotate(1deg)' },
        { transform: 'translateY(0px) rotate(0deg)' }
      ],
      options: { 
        duration: 6000, 
        iterations: Infinity, 
        easing: 'ease-in-out' 
      }
    },
    
    // Government seal rotation
    sealRotation: {
      keyframes: [
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(360deg)' }
      ],
      options: { 
        duration: 20000, 
        iterations: Infinity, 
        easing: 'linear' 
      }
    },
    
    // Data flow animation
    dataFlow: {
      keyframes: [
        { transform: 'translateX(-100%)', opacity: 0 },
        { transform: 'translateX(0%)', opacity: 1 },
        { transform: 'translateX(100%)', opacity: 0 }
      ],
      options: { 
        duration: 2000, 
        iterations: Infinity, 
        easing: 'ease-in-out' 
      }
    }
  } as const;

  // ===================== MICROCOPY SYSTEM =====================
  static readonly MICROCOPY = {
    loading: [
      "Preparing transcendence…",
      "Advancing county intelligence…",
      "Orchestrating clarity…",
      "Elevating government operations…",
      "Synchronizing citizen services…",
      "Optimizing civic processes…",
      "Enhancing administrative efficiency…",
      "Transcending traditional boundaries…"
    ],
    
    success: [
      "Transcendence complete.",
      "Your path is clear.",
      "All systems: Ready.",
      "Clarity achieved.",
      "Operation successful.",
      "Government enhanced.",
      "Citizens served.",
      "Excellence delivered."
    ],
    
    error: [
      "Let's clear the path—together.",
      "We anticipate, we adapt, we solve.",
      "Support is standing by your side.",
      "Every challenge leads to improvement.",
      "Resilience in action.",
      "Learning and advancing.",
      "Solutions in progress.",
      "Government that adapts."
    ],
    
    progress: [
      "Building transcendent solutions…",
      "Processing with precision…",
      "Analyzing with intelligence…",
      "Optimizing for excellence…",
      "Enhancing citizen experience…",
      "Streamlining operations…",
      "Delivering results…",
      "Transcending expectations…"
    ]
  } as const;

  // ===================== COMPONENT THEMES =====================
  static readonly COMPONENTS = {
    button: {
      primary: {
        background: 'linear-gradient(135deg, #0099ff 0%, #00ffee 100%)',
        color: '#ffffff',
        border: 'none',
        borderRadius: '50px',
        padding: '12px 24px',
        fontWeight: 600,
        letterSpacing: '0.5px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 0 40px rgba(0, 255, 238, 0.3)',
        hover: {
          boxShadow: '0 0 60px rgba(0, 255, 238, 0.5)',
          transform: 'translateY(-2px)'
        }
      },
      
      secondary: {
        background: 'transparent',
        color: '#00ffee',
        border: '2px solid #00ffee',
        borderRadius: '50px',
        padding: '10px 22px',
        fontWeight: 600,
        letterSpacing: '0.5px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        hover: {
          background: 'rgba(0, 255, 238, 0.1)',
          transform: 'translateY(-2px)'
        }
      },
      
      transcend: {
        background: 'linear-gradient(135deg, #0099ff 0%, #00ffee 50%, #00ffaa 100%)',
        color: '#ffffff',
        border: 'none',
        borderRadius: '50px',
        padding: '16px 32px',
        fontWeight: 700,
        letterSpacing: '1px',
        fontSize: '1.1rem',
        textTransform: 'uppercase',
        animation: 'transcendencePulse 3s ease-in-out infinite',
        boxShadow: '0 0 60px rgba(0, 255, 238, 0.4)',
        hover: {
          boxShadow: '0 0 80px rgba(0, 255, 238, 0.6)',
          transform: 'translateY(-3px) scale(1.02)'
        }
      }
    },
    
    card: {
      glass: {
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0, 255, 238, 0.2)',
        borderRadius: '16px',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        hover: {
          border: '1px solid rgba(0, 255, 238, 0.4)',
          transform: 'translateY(-2px)'
        }
      },
      
      government: {
        background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(26,31,58,0.9) 100%)',
        backdropFilter: 'blur(15px)',
        border: '2px solid rgba(0, 153, 255, 0.3)',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }
    },
    
    input: {
      primary: {
        background: 'rgba(255, 255, 255, 0.05)',
        border: '2px solid rgba(0, 255, 238, 0.3)',
        borderRadius: '8px',
        padding: '12px 16px',
        color: '#ffffff',
        fontSize: '1rem',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        focus: {
          border: '2px solid #00ffee',
          boxShadow: '0 0 20px rgba(0, 255, 238, 0.3)',
          outline: 'none'
        }
      }
    }
  } as const;

  // ===================== SPACING SYSTEM =====================
  static readonly SPACING = {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
    '4xl': '6rem',   // 96px
    '5xl': '8rem'    // 128px
  } as const;

  // ===================== BREAKPOINTS =====================
  static readonly BREAKPOINTS = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  } as const;

  // ===================== SHADOWS & EFFECTS =====================
  static readonly EFFECTS = {
    shadows: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
      transcend: '0 0 40px rgba(0, 255, 238, 0.3)',
      government: '0 8px 32px rgba(0, 153, 255, 0.2)'
    },
    
    blurs: {
      sm: 'blur(4px)',
      md: 'blur(8px)',
      lg: 'blur(16px)',
      xl: 'blur(24px)',
      glass: 'blur(20px)'
    },
    
    glows: {
      primary: '0 0 20px rgba(0, 153, 255, 0.4)',
      transcend: '0 0 30px rgba(0, 255, 238, 0.5)',
      accent: '0 0 25px rgba(0, 255, 170, 0.4)',
      error: '0 0 20px rgba(255, 68, 68, 0.4)',
      success: '0 0 20px rgba(0, 255, 170, 0.4)'
    }
  } as const;

  // ===================== GOVERNMENT COMPLIANCE =====================
  static readonly COMPLIANCE = {
    accessibility: {
      contrastRatio: 4.5, // WCAG AA standard
      focusIndicator: '2px solid #00ffee',
      screenReaderText: 'sr-only'
    },
    
    security: {
      contentSecurityPolicy: true,
      xssProtection: true,
      frameOptions: 'DENY'
    },
    
    performance: {
      maxBundleSize: '1MB',
      targetLoadTime: '2s',
      criticalRenderPath: true
    }
  } as const;

  // ===================== UTILITY METHODS =====================
  
  /**
   * Get a random microcopy message for the specified category
   */
  static getRandomMicrocopy(category: keyof typeof TerraFusionBrand.MICROCOPY): string {
    const messages = this.MICROCOPY[category];
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  /**
   * Generate a CSS custom properties object for theme variables
   */
  static getCSSVariables(): Record<string, string> {
    return {
      // Colors
      '--tf-primary': this.COLORS.primary,
      '--tf-transcend': this.COLORS.transcend,
      '--tf-accent': this.COLORS.accent,
      '--tf-dark': this.COLORS.dark,
      '--tf-dark-lighter': this.COLORS.darkLighter,
      
      // Gradients
      '--tf-gradient-hero': this.COLORS.gradients.hero,
      '--tf-gradient-dark': this.COLORS.gradients.dark,
      '--tf-gradient-glass': this.COLORS.gradients.glass,
      '--tf-gradient-transcendence': this.COLORS.gradients.transcendence,
      
      // Typography
      '--tf-font-primary': this.TYPOGRAPHY.fonts.primary,
      '--tf-font-mono': this.TYPOGRAPHY.fonts.mono,
      '--tf-font-display': this.TYPOGRAPHY.fonts.display,
      
      // Effects
      '--tf-shadow-transcend': this.EFFECTS.shadows.transcend,
      '--tf-blur-glass': this.EFFECTS.blurs.glass,
      '--tf-glow-primary': this.EFFECTS.glows.primary
    };
  }
  
  /**
   * Validate if a color meets accessibility standards
   */
  static validateColorContrast(foreground: string, background: string): boolean {
    // Simplified contrast validation - in production use a proper contrast calculation
    return true; // Placeholder - implement actual contrast calculation
  }
  
  /**
   * Get theme configuration for styled-components
   */
  static getStyledComponentsTheme() {
    return {
      colors: this.COLORS,
      typography: this.TYPOGRAPHY,
      spacing: this.SPACING,
      breakpoints: this.BREAKPOINTS,
      effects: this.EFFECTS,
      animations: this.ANIMATIONS,
      components: this.COMPONENTS
    };
  }
}

// Export individual brand elements for convenience
export const { COLORS, TYPOGRAPHY, ANIMATIONS, MICROCOPY, COMPONENTS, SPACING, BREAKPOINTS, EFFECTS } = TerraFusionBrand;

// Export default theme object
export default TerraFusionBrand;
