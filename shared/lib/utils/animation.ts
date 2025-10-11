/**
 * Animation Utilities for TerraFusion OS
 * 
 * Comprehensive animation system with easing functions, animation controller,
 * value interpolation, spring physics, and performance-optimized frame management.
 * 
 * Features:
 * - 20+ standard easing functions (linear, quad, cubic, quart, quint, sine, expo, circ, back, elastic, bounce)
 * - Animation class for managing animations with lifecycle control
 * - Value interpolation (numbers, colors, arrays)
 * - Spring physics simulation for natural motion
 * - requestAnimationFrame wrapper with automatic cleanup
 * - Animation sequences and parallel execution
 * - Performance monitoring and frame rate optimization
 * 
 * @module animation
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Easing function type
 * @param t - Progress from 0 to 1
 * @returns Eased value from 0 to 1
 */
export type EasingFunction = (t: number) => number;

/**
 * Animation callback type
 * @param progress - Current progress (0 to 1)
 * @param value - Interpolated value
 * @param elapsed - Elapsed time in milliseconds
 */
export type AnimationCallback<T = number> = (progress: number, value: T, elapsed: number) => void;

/**
 * Animation completion callback
 */
export type AnimationCompleteCallback = () => void;

/**
 * Animation configuration options
 */
export interface AnimationConfig<T = number> {
  /** Starting value */
  from: T;
  /** Ending value */
  to: T;
  /** Animation duration in milliseconds */
  duration: number;
  /** Easing function (default: easeInOut) */
  easing?: EasingFunction;
  /** Callback function called on each frame */
  onUpdate: AnimationCallback<T>;
  /** Callback function called when animation completes */
  onComplete?: AnimationCompleteCallback;
  /** Delay before animation starts in milliseconds */
  delay?: number;
  /** Number of times to repeat (0 = once, -1 = infinite) */
  repeat?: number;
  /** Whether to reverse on repeat */
  yoyo?: boolean;
}

/**
 * Spring physics configuration
 */
export interface SpringConfig {
  /** Spring stiffness (default: 170) */
  stiffness?: number;
  /** Spring damping (default: 26) */
  damping?: number;
  /** Mass (default: 1) */
  mass?: number;
  /** Initial velocity (default: 0) */
  velocity?: number;
  /** Precision threshold for "at rest" detection (default: 0.01) */
  precision?: number;
}

/**
 * Animation state enum
 */
export enum AnimationState {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// ============================================================================
// Easing Functions
// ============================================================================

/**
 * Linear easing (no easing)
 */
export const linear: EasingFunction = (t: number): number => t;

/**
 * Quadratic ease-in
 */
export const easeInQuad: EasingFunction = (t: number): number => t * t;

/**
 * Quadratic ease-out
 */
export const easeOutQuad: EasingFunction = (t: number): number => t * (2 - t);

/**
 * Quadratic ease-in-out
 */
export const easeInOutQuad: EasingFunction = (t: number): number => 
  t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

/**
 * Cubic ease-in
 */
export const easeInCubic: EasingFunction = (t: number): number => t * t * t;

/**
 * Cubic ease-out
 */
export const easeOutCubic: EasingFunction = (t: number): number => 
  (--t) * t * t + 1;

/**
 * Cubic ease-in-out (TerraFusion standard smooth transition)
 */
export const easeInOutCubic: EasingFunction = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

/**
 * Quartic ease-in
 */
export const easeInQuart: EasingFunction = (t: number): number => t * t * t * t;

/**
 * Quartic ease-out
 */
export const easeOutQuart: EasingFunction = (t: number): number =>
  1 - (--t) * t * t * t;

/**
 * Quartic ease-in-out
 */
export const easeInOutQuart: EasingFunction = (t: number): number =>
  t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;

/**
 * Quintic ease-in
 */
export const easeInQuint: EasingFunction = (t: number): number => t * t * t * t * t;

/**
 * Quintic ease-out
 */
export const easeOutQuint: EasingFunction = (t: number): number =>
  1 + (--t) * t * t * t * t;

/**
 * Quintic ease-in-out
 */
export const easeInOutQuint: EasingFunction = (t: number): number =>
  t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t;

/**
 * Sinusoidal ease-in
 */
export const easeInSine: EasingFunction = (t: number): number =>
  1 - Math.cos((t * Math.PI) / 2);

/**
 * Sinusoidal ease-out
 */
export const easeOutSine: EasingFunction = (t: number): number =>
  Math.sin((t * Math.PI) / 2);

/**
 * Sinusoidal ease-in-out
 */
export const easeInOutSine: EasingFunction = (t: number): number =>
  -(Math.cos(Math.PI * t) - 1) / 2;

/**
 * Exponential ease-in
 */
export const easeInExpo: EasingFunction = (t: number): number =>
  t === 0 ? 0 : Math.pow(2, 10 * t - 10);

/**
 * Exponential ease-out
 */
export const easeOutExpo: EasingFunction = (t: number): number =>
  t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

/**
 * Exponential ease-in-out
 */
export const easeInOutExpo: EasingFunction = (t: number): number => {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return t < 0.5
    ? Math.pow(2, 20 * t - 10) / 2
    : (2 - Math.pow(2, -20 * t + 10)) / 2;
};

/**
 * Circular ease-in
 */
export const easeInCirc: EasingFunction = (t: number): number =>
  1 - Math.sqrt(1 - Math.pow(t, 2));

/**
 * Circular ease-out
 */
export const easeOutCirc: EasingFunction = (t: number): number =>
  Math.sqrt(1 - Math.pow(t - 1, 2));

/**
 * Circular ease-in-out
 */
export const easeInOutCirc: EasingFunction = (t: number): number =>
  t < 0.5
    ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
    : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2;

/**
 * Back ease-in (overshoots then comes back)
 */
export const easeInBack: EasingFunction = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return c3 * t * t * t - c1 * t * t;
};

/**
 * Back ease-out (overshoots then comes back)
 */
export const easeOutBack: EasingFunction = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/**
 * Back ease-in-out (overshoots then comes back)
 * TerraFusion bounce effect
 */
export const easeInOutBack: EasingFunction = (t: number): number => {
  const c1 = 1.70158;
  const c2 = c1 * 1.525;
  return t < 0.5
    ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
    : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
};

/**
 * Elastic ease-in (elastic band effect)
 */
export const easeInElastic: EasingFunction = (t: number): number => {
  const c4 = (2 * Math.PI) / 3;
  return t === 0
    ? 0
    : t === 1
    ? 1
    : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
};

/**
 * Elastic ease-out (elastic band effect)
 */
export const easeOutElastic: EasingFunction = (t: number): number => {
  const c4 = (2 * Math.PI) / 3;
  return t === 0
    ? 0
    : t === 1
    ? 1
    : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

/**
 * Elastic ease-in-out (elastic band effect)
 */
export const easeInOutElastic: EasingFunction = (t: number): number => {
  const c5 = (2 * Math.PI) / 4.5;
  return t === 0
    ? 0
    : t === 1
    ? 1
    : t < 0.5
    ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
    : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
};

/**
 * Bounce ease-in
 */
export const easeInBounce: EasingFunction = (t: number): number =>
  1 - easeOutBounce(1 - t);

/**
 * Bounce ease-out
 */
export const easeOutBounce: EasingFunction = (t: number): number => {
  const n1 = 7.5625;
  const d1 = 2.75;

  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
};

/**
 * Bounce ease-in-out
 */
export const easeInOutBounce: EasingFunction = (t: number): number =>
  t < 0.5
    ? (1 - easeOutBounce(1 - 2 * t)) / 2
    : (1 + easeOutBounce(2 * t - 1)) / 2;

/**
 * Map of all easing functions by name
 */
export const easingFunctions: Record<string, EasingFunction> = {
  linear,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,
  easeInQuart,
  easeOutQuart,
  easeInOutQuart,
  easeInQuint,
  easeOutQuint,
  easeInOutQuint,
  easeInSine,
  easeOutSine,
  easeInOutSine,
  easeInExpo,
  easeOutExpo,
  easeInOutExpo,
  easeInCirc,
  easeOutCirc,
  easeInOutCirc,
  easeInBack,
  easeOutBack,
  easeInOutBack,
  easeInElastic,
  easeOutElastic,
  easeInOutElastic,
  easeInBounce,
  easeOutBounce,
  easeInOutBounce,
};

// ============================================================================
// Value Interpolation
// ============================================================================

/**
 * Linear interpolation between two numbers
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Interpolate between two values
 * Supports numbers, arrays of numbers, and hex colors
 */
export function interpolate<T>(from: T, to: T, t: number): T {
  // Number interpolation
  if (typeof from === 'number' && typeof to === 'number') {
    return lerp(from, to, t) as T;
  }

  // Array interpolation (for multiple values like RGB, transforms, etc.)
  if (Array.isArray(from) && Array.isArray(to)) {
    if (from.length !== to.length) {
      throw new Error('Arrays must have the same length for interpolation');
    }
    return from.map((start, i) => lerp(start, to[i], t)) as T;
  }

  // Hex color interpolation (#RRGGBB or #RGB)
  if (typeof from === 'string' && typeof to === 'string' && from[0] === '#' && to[0] === '#') {
    return interpolateColor(from, to, t) as T;
  }

  // Fallback: return target value when t >= 0.5
  return t < 0.5 ? from : to;
}

/**
 * Interpolate between two hex colors
 */
export function interpolateColor(from: string, to: string, t: number): string {
  const fromRgb = hexToRgb(from);
  const toRgb = hexToRgb(to);

  const r = Math.round(lerp(fromRgb.r, toRgb.r, t));
  const g = Math.round(lerp(fromRgb.g, toRgb.g, t));
  const b = Math.round(lerp(fromRgb.b, toRgb.b, t));

  return rgbToHex(r, g, b);
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // Remove # if present
  hex = hex.replace('#', '');

  // Handle shorthand (#RGB)
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }

  const num = parseInt(hex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Convert RGB to hex color
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Map a value from one range to another
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

// ============================================================================
// Animation Class
// ============================================================================

/**
 * Animation controller class
 * Manages a single animation with lifecycle control
 */
export class Animation<T = number> {
  private config: Required<AnimationConfig<T>>;
  private state: AnimationState = AnimationState.IDLE;
  private startTime: number = 0;
  private pauseTime: number = 0;
  private elapsedBeforePause: number = 0;
  private animationFrameId: number | null = null;
  private currentRepeat: number = 0;
  private isReversed: boolean = false;

  constructor(config: AnimationConfig<T>) {
    this.config = {
      ...config,
      easing: config.easing || easeInOutCubic,
      delay: config.delay || 0,
      repeat: config.repeat ?? 0,
      yoyo: config.yoyo ?? false,
      onComplete: config.onComplete || (() => {}),
    };
  }

  /**
   * Start the animation
   */
  public start(): this {
    if (this.state === AnimationState.RUNNING) {
      return this;
    }

    this.state = AnimationState.RUNNING;
    this.startTime = performance.now() + this.config.delay;
    this.animate();

    return this;
  }

  /**
   * Pause the animation
   */
  public pause(): this {
    if (this.state !== AnimationState.RUNNING) {
      return this;
    }

    this.state = AnimationState.PAUSED;
    this.pauseTime = performance.now();
    this.elapsedBeforePause = this.pauseTime - this.startTime;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    return this;
  }

  /**
   * Resume the animation
   */
  public resume(): this {
    if (this.state !== AnimationState.PAUSED) {
      return this;
    }

    this.state = AnimationState.RUNNING;
    this.startTime = performance.now() - this.elapsedBeforePause;
    this.animate();

    return this;
  }

  /**
   * Stop and reset the animation
   */
  public stop(): this {
    this.state = AnimationState.CANCELLED;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.currentRepeat = 0;
    this.isReversed = false;
    this.elapsedBeforePause = 0;

    return this;
  }

  /**
   * Get current animation state
   */
  public getState(): AnimationState {
    return this.state;
  }

  /**
   * Check if animation is running
   */
  public isRunning(): boolean {
    return this.state === AnimationState.RUNNING;
  }

  /**
   * Check if animation is completed
   */
  public isCompleted(): boolean {
    return this.state === AnimationState.COMPLETED;
  }

  /**
   * Main animation loop
   */
  private animate = (): void => {
    if (this.state !== AnimationState.RUNNING) {
      return;
    }

    const now = performance.now();
    const elapsed = now - this.startTime;

    // Handle delay
    if (elapsed < 0) {
      this.animationFrameId = requestAnimationFrame(this.animate);
      return;
    }

    // Calculate progress (0 to 1)
    let progress = Math.min(elapsed / this.config.duration, 1);

    // Reverse progress if yoyo and currently reversed
    if (this.isReversed) {
      progress = 1 - progress;
    }

    // Apply easing
    const easedProgress = this.config.easing(progress);

    // Get current values
    const from = this.isReversed ? this.config.to : this.config.from;
    const to = this.isReversed ? this.config.from : this.config.to;

    // Interpolate value
    const currentValue = interpolate(from, to, easedProgress);

    // Call update callback
    this.config.onUpdate(progress, currentValue, elapsed);

    // Check if animation is complete
    if (progress >= 1) {
      this.handleComplete();
    } else {
      this.animationFrameId = requestAnimationFrame(this.animate);
    }
  };

  /**
   * Handle animation completion
   */
  private handleComplete(): void {
    // Check for repeat
    if (this.config.repeat === -1 || this.currentRepeat < this.config.repeat) {
      this.currentRepeat++;

      // Handle yoyo
      if (this.config.yoyo) {
        this.isReversed = !this.isReversed;
      }

      // Restart animation
      this.startTime = performance.now();
      this.animationFrameId = requestAnimationFrame(this.animate);
    } else {
      // Animation fully complete
      this.state = AnimationState.COMPLETED;
      this.config.onComplete();
    }
  }
}

// ============================================================================
// Spring Physics
// ============================================================================

/**
 * Spring physics animation
 * Natural motion simulation with mass, stiffness, and damping
 */
export class Spring {
  private config: Required<SpringConfig>;
  private currentValue: number;
  private targetValue: number;
  private velocity: number;
  private animationFrameId: number | null = null;
  private isAnimating: boolean = false;
  private lastTime: number = 0;

  constructor(initialValue: number, config: SpringConfig = {}) {
    this.config = {
      stiffness: config.stiffness ?? 170,
      damping: config.damping ?? 26,
      mass: config.mass ?? 1,
      velocity: config.velocity ?? 0,
      precision: config.precision ?? 0.01,
    };

    this.currentValue = initialValue;
    this.targetValue = initialValue;
    this.velocity = this.config.velocity;
  }

  /**
   * Set target value and start animation
   */
  public setTarget(
    target: number,
    onUpdate: (value: number) => void,
    onComplete?: () => void
  ): this {
    this.targetValue = target;

    if (!this.isAnimating) {
      this.isAnimating = true;
      this.lastTime = performance.now();
      this.animateSpring(onUpdate, onComplete);
    }

    return this;
  }

  /**
   * Get current value
   */
  public getValue(): number {
    return this.currentValue;
  }

  /**
   * Get current velocity
   */
  public getVelocity(): number {
    return this.velocity;
  }

  /**
   * Check if spring is at rest
   */
  public isAtRest(): boolean {
    return (
      Math.abs(this.velocity) < this.config.precision &&
      Math.abs(this.targetValue - this.currentValue) < this.config.precision
    );
  }

  /**
   * Stop animation
   */
  public stop(): this {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.isAnimating = false;
    return this;
  }

  /**
   * Spring animation loop
   */
  private animateSpring = (
    onUpdate: (value: number) => void,
    onComplete?: () => void
  ): void => {
    if (!this.isAnimating) {
      return;
    }

    const now = performance.now();
    const deltaTime = Math.min((now - this.lastTime) / 1000, 0.064); // Cap at ~15fps
    this.lastTime = now;

    // Spring physics calculations
    const springForce = -this.config.stiffness * (this.currentValue - this.targetValue);
    const dampingForce = -this.config.damping * this.velocity;
    const acceleration = (springForce + dampingForce) / this.config.mass;

    // Update velocity and position
    this.velocity += acceleration * deltaTime;
    this.currentValue += this.velocity * deltaTime;

    // Call update callback
    onUpdate(this.currentValue);

    // Check if at rest
    if (this.isAtRest()) {
      this.currentValue = this.targetValue;
      this.velocity = 0;
      this.isAnimating = false;
      onUpdate(this.currentValue);
      if (onComplete) {
        onComplete();
      }
    } else {
      this.animationFrameId = requestAnimationFrame(() =>
        this.animateSpring(onUpdate, onComplete)
      );
    }
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a simple animation with requestAnimationFrame
 * @deprecated Use Animation class for better control
 */
export function animate<T = number>(config: AnimationConfig<T>): () => void {
  const animation = new Animation(config);
  animation.start();
  return () => animation.stop();
}

/**
 * Animate multiple properties in parallel
 */
export function animateParallel(animations: Animation[]): () => void {
  animations.forEach((anim) => anim.start());
  return () => animations.forEach((anim) => anim.stop());
}

/**
 * Animate properties in sequence
 */
export async function animateSequence(animations: Animation[]): Promise<void> {
  for (const animation of animations) {
    await new Promise<void>((resolve) => {
      const originalComplete = animation['config'].onComplete;
      animation['config'].onComplete = () => {
        originalComplete();
        resolve();
      };
      animation.start();
    });
  }
}

/**
 * Wait for a specified duration (useful in animation sequences)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get performance timestamp
 */
export function now(): number {
  return performance.now();
}

/**
 * Request animation frame with automatic cleanup
 */
export function raf(callback: FrameRequestCallback): () => void {
  const id = requestAnimationFrame(callback);
  return () => cancelAnimationFrame(id);
}

/**
 * Create a reusable animation frame loop
 */
export class AnimationLoop {
  private callback: (deltaTime: number) => void;
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;

  constructor(callback: (deltaTime: number) => void) {
    this.callback = callback;
  }

  public start(): this {
    if (this.isRunning) {
      return this;
    }

    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop();
    return this;
  }

  public stop(): this {
    if (!this.isRunning) {
      return this;
    }

    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    return this;
  }

  private loop = (): void => {
    if (!this.isRunning) {
      return;
    }

    const now = performance.now();
    const deltaTime = now - this.lastTime;
    this.lastTime = now;

    this.callback(deltaTime);

    this.animationFrameId = requestAnimationFrame(this.loop);
  };
}

/**
 * TerraFusion brand timing durations (in milliseconds)
 */
export const TerraFusionTimings = {
  instant: 50,
  fast: 150,
  smooth: 300,
  dramatic: 600,
  micro: 150,
  quick: 300,
  normal: 500,
  slow: 800,
  page: 1200,
} as const;

/**
 * TerraFusion brand easing functions
 */
export const TerraFusionEasing = {
  smooth: easeInOutCubic, // cubic-bezier(0.4, 0, 0.2, 1)
  bounce: easeInOutBack,  // cubic-bezier(0.68, -0.55, 0.265, 1.55)
  entrance: easeOutCubic, // cubic-bezier(0.0, 0, 0.2, 1)
  exit: easeInCubic,      // cubic-bezier(0.4, 0, 1, 1)
  spring: easeOutBack,    // cubic-bezier(0.43, 0.13, 0.23, 0.96)
} as const;
