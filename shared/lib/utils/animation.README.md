# Animation Utilities

Comprehensive animation system for TerraFusion OS with 30+ easing functions, animation controller, value interpolation, spring physics, and performance-optimized frame management.

## Features

- ✅ **30+ Easing Functions** - Complete library of standard easing curves
- ✅ **Animation Class** - Full lifecycle control (start, pause, resume, stop)
- ✅ **Value Interpolation** - Numbers, arrays, hex colors
- ✅ **Spring Physics** - Natural motion with mass, stiffness, damping
- ✅ **requestAnimationFrame** - Performance-optimized frame management
- ✅ **Animation Sequences** - Chain or parallelize multiple animations
- ✅ **TypeScript** - Full type safety with generics
- ✅ **Zero Dependencies** - Pure JavaScript/TypeScript
- ✅ **TerraFusion Brand** - Pre-configured brand timings and easings

## Installation

```typescript
import {
  Animation,
  Spring,
  AnimationLoop,
  easeInOutCubic,
  interpolate,
  TerraFusionTimings,
  TerraFusionEasing,
} from './utils/animation';
```

## Quick Start

### Basic Animation

```typescript
import { Animation, easeInOutCubic } from './utils/animation';

// Animate property value from 0 to 100
const animation = new Animation({
  from: 0,
  to: 100,
  duration: 300,
  easing: easeInOutCubic,
  onUpdate: (progress, value) => {
    element.style.opacity = value / 100;
  },
  onComplete: () => {
    console.log('Animation complete!');
  },
});

animation.start();
```

### Spring Physics

```typescript
import { Spring } from './utils/animation';

const spring = new Spring(0, {
  stiffness: 170,
  damping: 26,
  mass: 1,
});

spring.setTarget(
  100,
  (value) => {
    element.style.transform = `translateX(${value}px)`;
  },
  () => {
    console.log('Spring animation complete!');
  }
);
```

## Real-World Examples

### 1. Animated Property Valuation Display

Smoothly animate property values when they update:

```typescript
import { Animation, TerraFusionEasing, TerraFusionTimings } from './utils/animation';

function animatePropertyValue(
  element: HTMLElement,
  oldValue: number,
  newValue: number
) {
  const animation = new Animation({
    from: oldValue,
    to: newValue,
    duration: TerraFusionTimings.smooth, // 300ms
    easing: TerraFusionEasing.smooth,
    onUpdate: (progress, value) => {
      // Format as currency and update display
      element.textContent = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
      }).format(Math.round(value));
    },
  });

  animation.start();
}

// Usage
const valuationElement = document.getElementById('property-value');
animatePropertyValue(valuationElement, 250000, 275000);
```

### 2. Chart Bar Growth Animation

Animate chart bars growing from 0 to their target height:

```typescript
import { Animation, easeOutQuart } from './utils/animation';

function animateChartBar(
  bar: HTMLElement,
  targetHeight: number,
  delay: number = 0
) {
  const animation = new Animation({
    from: 0,
    to: targetHeight,
    duration: 800,
    delay: delay,
    easing: easeOutQuart, // Smooth deceleration
    onUpdate: (progress, height) => {
      bar.style.height = `${height}%`;
      bar.style.opacity = `${progress}`;
    },
  });

  animation.start();
}

// Usage: Stagger multiple bars
const bars = document.querySelectorAll('.chart-bar');
bars.forEach((bar, index) => {
  const targetHeight = parseFloat(bar.dataset.value);
  animateChartBar(bar as HTMLElement, targetHeight, index * 100);
});
```

### 3. Modal Fade In/Out with Backdrop

Animate modal entrance and exit with backdrop:

```typescript
import { Animation, easeInOutCubic, easeOutBack } from './utils/animation';

function showModal(modal: HTMLElement, backdrop: HTMLElement) {
  // Backdrop fade in
  const backdropAnim = new Animation({
    from: 0,
    to: 1,
    duration: 300,
    easing: easeInOutCubic,
    onUpdate: (progress, opacity) => {
      backdrop.style.opacity = `${opacity}`;
    },
  });

  // Modal scale and fade in (with slight overshoot)
  const modalAnim = new Animation({
    from: 0,
    to: 1,
    duration: 400,
    delay: 100,
    easing: easeOutBack, // Overshoot for emphasis
    onUpdate: (progress, value) => {
      modal.style.opacity = `${value}`;
      modal.style.transform = `scale(${0.8 + value * 0.2})`;
    },
  });

  backdrop.style.display = 'block';
  modal.style.display = 'block';

  backdropAnim.start();
  modalAnim.start();
}

function hideModal(modal: HTMLElement, backdrop: HTMLElement) {
  const animation = new Animation({
    from: 1,
    to: 0,
    duration: 250,
    easing: easeInOutCubic,
    onUpdate: (progress, opacity) => {
      backdrop.style.opacity = `${opacity}`;
      modal.style.opacity = `${opacity}`;
      modal.style.transform = `scale(${0.8 + opacity * 0.2})`;
    },
    onComplete: () => {
      backdrop.style.display = 'none';
      modal.style.display = 'none';
    },
  });

  animation.start();
}
```

### 4. Spring-Based Drawer/Sidebar

Natural sliding drawer with spring physics:

```typescript
import { Spring } from './utils/animation';

class Drawer {
  private spring: Spring;
  private element: HTMLElement;
  private isOpen: boolean = false;

  constructor(element: HTMLElement) {
    this.element = element;
    this.spring = new Spring(-300, {
      stiffness: 180,
      damping: 20,
      mass: 1,
    });
  }

  toggle() {
    this.isOpen = !this.isOpen;
    const target = this.isOpen ? 0 : -300;

    this.spring.setTarget(target, (value) => {
      this.element.style.transform = `translateX(${value}px)`;
    });
  }

  open() {
    if (!this.isOpen) {
      this.toggle();
    }
  }

  close() {
    if (this.isOpen) {
      this.toggle();
    }
  }
}

// Usage
const drawer = new Drawer(document.getElementById('sidebar'));
document.getElementById('menu-button').addEventListener('click', () => {
  drawer.toggle();
});
```

### 5. Loading Progress Bar

Smooth progress bar with spring physics:

```typescript
import { Spring } from './utils/animation';

class ProgressBar {
  private spring: Spring;
  private element: HTMLElement;
  private bar: HTMLElement;
  private label: HTMLElement;

  constructor(element: HTMLElement) {
    this.element = element;
    this.bar = element.querySelector('.progress-bar');
    this.label = element.querySelector('.progress-label');
    
    this.spring = new Spring(0, {
      stiffness: 170,
      damping: 26,
    });
  }

  setProgress(percent: number) {
    this.spring.setTarget(percent, (value) => {
      this.bar.style.width = `${value}%`;
      this.label.textContent = `${Math.round(value)}%`;
    });
  }
}

// Usage
const progressBar = new ProgressBar(document.getElementById('upload-progress'));

// Simulate file upload
let progress = 0;
const interval = setInterval(() => {
  progress += Math.random() * 15;
  if (progress >= 100) {
    progress = 100;
    clearInterval(interval);
  }
  progressBar.setProgress(progress);
}, 200);
```

### 6. Color Transition Animation

Animate between two colors for status indicators:

```typescript
import { Animation, interpolateColor, easeInOutSine } from './utils/animation';

function animateStatusColor(
  element: HTMLElement,
  fromColor: string,
  toColor: string
) {
  const animation = new Animation<string>({
    from: fromColor,
    to: toColor,
    duration: 600,
    easing: easeInOutSine,
    onUpdate: (progress, color) => {
      element.style.backgroundColor = color;
    },
  });

  animation.start();
}

// Usage: Animate status from pending (yellow) to success (green)
const statusBadge = document.getElementById('status-badge');
animateStatusColor(statusBadge, '#fbbf24', '#10b981');
```

### 7. Parallax Scroll Effect

Smooth parallax scrolling for property showcase:

```typescript
import { AnimationLoop, lerp } from './utils/animation';

class ParallaxScroller {
  private loop: AnimationLoop;
  private elements: Array<{ element: HTMLElement; speed: number; currentY: number }>;
  private targetScrollY: number = 0;

  constructor(elements: Array<{ element: HTMLElement; speed: number }>) {
    this.elements = elements.map((item) => ({
      ...item,
      currentY: 0,
    }));

    this.loop = new AnimationLoop((deltaTime) => {
      this.update(deltaTime);
    });

    window.addEventListener('scroll', () => {
      this.targetScrollY = window.scrollY;
    });

    this.loop.start();
  }

  private update(deltaTime: number) {
    this.elements.forEach((item) => {
      const targetY = this.targetScrollY * item.speed;
      // Smooth lerp for natural feel
      item.currentY = lerp(item.currentY, targetY, 0.1);
      item.element.style.transform = `translateY(${item.currentY}px)`;
    });
  }

  destroy() {
    this.loop.stop();
  }
}

// Usage
const parallax = new ParallaxScroller([
  { element: document.querySelector('.bg-layer-1'), speed: 0.2 },
  { element: document.querySelector('.bg-layer-2'), speed: 0.5 },
  { element: document.querySelector('.bg-layer-3'), speed: 0.8 },
]);
```

### 8. Property Map Marker Animation

Bounce markers when added to map:

```typescript
import { Animation, easeOutBounce } from './utils/animation';

function animateMarker(marker: HTMLElement) {
  // Start invisible and off-screen
  marker.style.opacity = '0';
  marker.style.transform = 'translateY(-100px) scale(0)';

  const animation = new Animation({
    from: 0,
    to: 1,
    duration: 800,
    easing: easeOutBounce,
    onUpdate: (progress, value) => {
      marker.style.opacity = `${value}`;
      marker.style.transform = `translateY(${-100 * (1 - value)}px) scale(${value})`;
    },
  });

  animation.start();
}

// Usage: Add marker to map with animation
function addPropertyMarker(lat: number, lng: number, data: any) {
  const marker = createMarkerElement(data);
  map.addMarker(marker, lat, lng);
  animateMarker(marker);
}
```

### 9. Toast Notification Slide In/Out

Slide toast notifications from edge with elastic effect:

```typescript
import { Animation, easeOutElastic, easeInBack } from './utils/animation';

class ToastNotification {
  private element: HTMLElement;
  private container: HTMLElement;

  constructor(message: string, type: 'success' | 'error' | 'info') {
    this.container = document.getElementById('toast-container');
    this.element = this.createToast(message, type);
    this.show();
  }

  private createToast(message: string, type: string): HTMLElement {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.transform = 'translateX(400px)';
    toast.style.opacity = '0';
    this.container.appendChild(toast);
    return toast;
  }

  private show() {
    const animation = new Animation({
      from: 0,
      to: 1,
      duration: 600,
      easing: easeOutElastic, // Elastic bounce effect
      onUpdate: (progress, value) => {
        this.element.style.opacity = `${value}`;
        this.element.style.transform = `translateX(${400 * (1 - value)}px)`;
      },
      onComplete: () => {
        // Auto-hide after 3 seconds
        setTimeout(() => this.hide(), 3000);
      },
    });

    animation.start();
  }

  private hide() {
    const animation = new Animation({
      from: 1,
      to: 0,
      duration: 400,
      easing: easeInBack,
      onUpdate: (progress, value) => {
        this.element.style.opacity = `${value}`;
        this.element.style.transform = `translateX(${400 * (1 - value)}px)`;
      },
      onComplete: () => {
        this.element.remove();
      },
    });

    animation.start();
  }
}

// Usage
new ToastNotification('Property saved successfully!', 'success');
new ToastNotification('Failed to update valuation', 'error');
```

### 10. Auction Countdown Timer with Pulse

Animated countdown with urgency pulse effect:

```typescript
import { Animation, easeInOutSine, AnimationLoop } from './utils/animation';

class AuctionCountdown {
  private element: HTMLElement;
  private targetTime: Date;
  private loop: AnimationLoop;
  private pulseAnimation: Animation | null = null;

  constructor(element: HTMLElement, targetTime: Date) {
    this.element = element;
    this.targetTime = targetTime;

    this.loop = new AnimationLoop(() => {
      this.update();
    });

    this.loop.start();
  }

  private update() {
    const now = new Date();
    const diff = this.targetTime.getTime() - now.getTime();

    if (diff <= 0) {
      this.element.textContent = 'ENDED';
      this.loop.stop();
      return;
    }

    // Calculate time remaining
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    this.element.textContent = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Add urgent pulse when less than 1 minute
    if (diff < 60000 && !this.pulseAnimation) {
      this.startUrgentPulse();
    }
  }

  private startUrgentPulse() {
    this.pulseAnimation = new Animation({
      from: 1,
      to: 1.2,
      duration: 500,
      easing: easeInOutSine,
      repeat: -1, // Infinite
      yoyo: true, // Reverse on repeat
      onUpdate: (progress, scale) => {
        this.element.style.transform = `scale(${scale})`;
        // Fade color from red to bright red
        const redIntensity = Math.round(lerp(220, 255, progress));
        this.element.style.color = `rgb(${redIntensity}, 50, 50)`;
      },
    });

    this.pulseAnimation.start();
  }

  destroy() {
    this.loop.stop();
    if (this.pulseAnimation) {
      this.pulseAnimation.stop();
    }
  }
}

// Usage
const countdown = new AuctionCountdown(
  document.getElementById('auction-timer'),
  new Date('2025-10-09T15:00:00')
);
```

### 11. Data Table Row Highlight Animation

Highlight newly added rows with attention-grabbing animation:

```typescript
import { Animation, easeOutQuint } from './utils/animation';

function highlightNewRow(row: HTMLElement) {
  // Flash yellow background then fade back to normal
  const animation = new Animation<string>({
    from: '#fef3c7', // Yellow
    to: '#ffffff',   // White
    duration: 1500,
    easing: easeOutQuint,
    onUpdate: (progress, color) => {
      row.style.backgroundColor = color;
    },
  });

  animation.start();
}

// Usage: After adding row to table
function addPropertyToTable(property: Property) {
  const row = createTableRow(property);
  tableBody.appendChild(row);
  highlightNewRow(row);
}
```

### 12. Loading Skeleton Shimmer Effect

Animated shimmer effect for loading skeletons:

```typescript
import { AnimationLoop, mapRange } from './utils/animation';

class ShimmerEffect {
  private elements: HTMLElement[];
  private loop: AnimationLoop;
  private time: number = 0;

  constructor(elements: HTMLElement[]) {
    this.elements = elements;

    this.loop = new AnimationLoop((deltaTime) => {
      this.time += deltaTime;
      this.update();
    });

    this.loop.start();
  }

  private update() {
    // Create moving gradient effect
    const position = (Math.sin(this.time / 1000) + 1) / 2; // 0 to 1
    const gradientPosition = mapRange(position, 0, 1, -100, 100);

    this.elements.forEach((element) => {
      element.style.background = `
        linear-gradient(
          90deg,
          #e5e7eb 0%,
          #f3f4f6 ${50 + gradientPosition}%,
          #e5e7eb 100%
        )
      `;
    });
  }

  destroy() {
    this.loop.stop();
  }
}

// Usage
const skeletons = document.querySelectorAll('.skeleton-loader');
const shimmer = new ShimmerEffect(Array.from(skeletons));

// Stop when data loads
fetchData().then(() => {
  shimmer.destroy();
  // Replace skeletons with real content
});
```

## API Reference

### Animation Class

#### Constructor

```typescript
new Animation<T>(config: AnimationConfig<T>)
```

**AnimationConfig:**
- `from: T` - Starting value
- `to: T` - Ending value
- `duration: number` - Duration in milliseconds
- `easing?: EasingFunction` - Easing function (default: easeInOutCubic)
- `onUpdate: (progress, value, elapsed) => void` - Update callback
- `onComplete?: () => void` - Completion callback
- `delay?: number` - Delay before start (milliseconds)
- `repeat?: number` - Number of repeats (0 = once, -1 = infinite)
- `yoyo?: boolean` - Reverse on repeat

#### Methods

- `start(): this` - Start the animation
- `pause(): this` - Pause the animation
- `resume(): this` - Resume paused animation
- `stop(): this` - Stop and reset animation
- `getState(): AnimationState` - Get current state
- `isRunning(): boolean` - Check if running
- `isCompleted(): boolean` - Check if completed

### Spring Class

#### Constructor

```typescript
new Spring(initialValue: number, config?: SpringConfig)
```

**SpringConfig:**
- `stiffness?: number` - Spring stiffness (default: 170)
- `damping?: number` - Spring damping (default: 26)
- `mass?: number` - Mass (default: 1)
- `velocity?: number` - Initial velocity (default: 0)
- `precision?: number` - At-rest precision (default: 0.01)

#### Methods

- `setTarget(target, onUpdate, onComplete?): this` - Set target and animate
- `getValue(): number` - Get current value
- `getVelocity(): number` - Get current velocity
- `isAtRest(): boolean` - Check if spring is at rest
- `stop(): this` - Stop animation

### Easing Functions

All easing functions follow the signature: `(t: number) => number` where `t` is 0-1.

**Available Easing Functions:**

- `linear` - No easing
- `easeInQuad`, `easeOutQuad`, `easeInOutQuad` - Quadratic
- `easeInCubic`, `easeOutCubic`, `easeInOutCubic` - Cubic
- `easeInQuart`, `easeOutQuart`, `easeInOutQuart` - Quartic
- `easeInQuint`, `easeOutQuint`, `easeInOutQuint` - Quintic
- `easeInSine`, `easeOutSine`, `easeInOutSine` - Sinusoidal
- `easeInExpo`, `easeOutExpo`, `easeInOutExpo` - Exponential
- `easeInCirc`, `easeOutCirc`, `easeInOutCirc` - Circular
- `easeInBack`, `easeOutBack`, `easeInOutBack` - Back (overshoot)
- `easeInElastic`, `easeOutElastic`, `easeInOutElastic` - Elastic
- `easeInBounce`, `easeOutBounce`, `easeInOutBounce` - Bounce

### Interpolation Functions

#### interpolate<T>(from: T, to: T, t: number): T

Interpolate between two values. Supports:
- Numbers
- Arrays of numbers
- Hex colors (#RGB or #RRGGBB)

#### interpolateColor(from: string, to: string, t: number): string

Interpolate between two hex colors.

#### lerp(start: number, end: number, t: number): number

Linear interpolation between two numbers.

### Utility Functions

#### clamp(value: number, min: number, max: number): number

Clamp a value between min and max.

#### mapRange(value, inMin, inMax, outMin, outMax): number

Map a value from one range to another.

#### wait(ms: number): Promise<void>

Wait for a specified duration.

#### now(): number

Get performance timestamp.

#### raf(callback: FrameRequestCallback): () => void

Request animation frame with cleanup function.

### AnimationLoop Class

Reusable animation loop with automatic frame timing.

```typescript
const loop = new AnimationLoop((deltaTime) => {
  // Update logic here
});

loop.start();
loop.stop();
```

### TerraFusion Brand Constants

#### TerraFusionTimings

Pre-configured timing durations matching TerraFusion brand:

```typescript
{
  instant: 50,
  fast: 150,
  smooth: 300,
  dramatic: 600,
  micro: 150,
  quick: 300,
  normal: 500,
  slow: 800,
  page: 1200,
}
```

#### TerraFusionEasing

Pre-configured easing functions matching TerraFusion brand:

```typescript
{
  smooth: easeInOutCubic,  // cubic-bezier(0.4, 0, 0.2, 1)
  bounce: easeInOutBack,   // cubic-bezier(0.68, -0.55, 0.265, 1.55)
  entrance: easeOutCubic,  // cubic-bezier(0.0, 0, 0.2, 1)
  exit: easeInCubic,       // cubic-bezier(0.4, 0, 1, 1)
  spring: easeOutBack,     // cubic-bezier(0.43, 0.13, 0.23, 0.96)
}
```

## Use Cases in TerraFusion

### Property Assessment
- ✅ Animate valuation changes smoothly
- ✅ Chart animations for market trends
- ✅ Progress bars for assessment completion
- ✅ Color transitions for status changes

### GIS/Mapping
- ✅ Marker bounce animations when added
- ✅ Smooth map transitions (pan, zoom)
- ✅ Parallax effects for 3D terrain
- ✅ Feature highlighting with pulses

### Auctions
- ✅ Countdown timers with urgency effects
- ✅ Bid amount animations
- ✅ Winner celebration animations
- ✅ Real-time price updates

### UI/UX
- ✅ Modal fade in/out
- ✅ Drawer/sidebar slides
- ✅ Toast notifications
- ✅ Loading skeletons with shimmer
- ✅ Button press feedback
- ✅ Form validation feedback

### Data Visualization
- ✅ Bar chart growth animations
- ✅ Line chart path drawing
- ✅ Pie chart slice reveals
- ✅ Number counter animations

### Performance
- ✅ Table row highlighting
- ✅ Lazy loading reveals
- ✅ Infinite scroll indicators
- ✅ Search result emphasis

## Performance Considerations

### Best Practices

1. **Use transform and opacity** - GPU-accelerated properties
2. **Avoid layout thrashing** - Batch DOM reads and writes
3. **Use AnimationLoop for continuous updates** - Better than setInterval
4. **Clean up animations** - Always call stop() when done
5. **Throttle/debounce scroll handlers** - Prevent excessive animation triggers

### Performance Tips

```typescript
// ✅ Good: GPU-accelerated
element.style.transform = `translateX(${x}px)`;
element.style.opacity = `${opacity}`;

// ❌ Bad: Triggers layout recalculation
element.style.left = `${x}px`;
element.style.width = `${width}px`;
```

### Target Frame Rate

- **60 FPS minimum** - Smooth, imperceptible animation
- **30-60 FPS** - Acceptable for complex animations
- **< 30 FPS** - Janky, consider simplifying

### Animation Duration Guidelines

- **Micro interactions**: 50-150ms
- **Standard transitions**: 200-400ms
- **Complex animations**: 400-800ms
- **Page transitions**: 800-1200ms
- **Avoid > 1200ms** - Users will perceive as slow

## Browser Support

- ✅ Chrome 16+ (requestAnimationFrame)
- ✅ Firefox 23+
- ✅ Safari 7+
- ✅ Edge (all versions)
- ✅ Opera 15+
- ✅ Mobile browsers (iOS 9+, Android 4.4+)

## TypeScript Support

Full TypeScript support with generics:

```typescript
// Animate numbers
const numAnimation = new Animation<number>({
  from: 0,
  to: 100,
  duration: 300,
  onUpdate: (progress, value) => {
    // value is typed as number
  },
});

// Animate colors
const colorAnimation = new Animation<string>({
  from: '#ff0000',
  to: '#00ff00',
  duration: 500,
  onUpdate: (progress, color) => {
    // color is typed as string
  },
});

// Animate arrays (e.g., RGB values)
const rgbAnimation = new Animation<number[]>({
  from: [255, 0, 0],
  to: [0, 255, 0],
  duration: 500,
  onUpdate: (progress, rgb) => {
    // rgb is typed as number[]
  },
});
```

## Testing

```typescript
import { Animation, easeInOutCubic, Spring } from './animation';

describe('Animation', () => {
  it('should animate from start to end', (done) => {
    let finalValue = 0;

    const animation = new Animation({
      from: 0,
      to: 100,
      duration: 100,
      easing: easeInOutCubic,
      onUpdate: (progress, value) => {
        finalValue = value;
      },
      onComplete: () => {
        expect(finalValue).toBe(100);
        done();
      },
    });

    animation.start();
  });

  it('should pause and resume', () => {
    const animation = new Animation({
      from: 0,
      to: 100,
      duration: 1000,
      onUpdate: () => {},
    });

    animation.start();
    expect(animation.isRunning()).toBe(true);

    animation.pause();
    expect(animation.getState()).toBe(AnimationState.PAUSED);

    animation.resume();
    expect(animation.isRunning()).toBe(true);
  });
});

describe('Spring', () => {
  it('should reach target value', (done) => {
    const spring = new Spring(0);

    spring.setTarget(
      100,
      (value) => {
        // Update callback
      },
      () => {
        expect(spring.getValue()).toBeCloseTo(100, 1);
        done();
      }
    );
  });
});
```

## Contributing

When adding new easing functions:

1. Follow the standard signature: `(t: number) => number`
2. Input `t` should be 0-1 (will be clamped)
3. Output should typically be 0-1 (but can exceed for overshoot effects)
4. Add to `easingFunctions` map
5. Document the visual effect

## License

Part of TerraFusion OS - Shared Library

## Related Utilities

- `websocket.ts` - For real-time animation triggers
- `ui-components/` - Components that use these animations
- `hooks/` - React hooks for animation integration
- `geospatial.ts` - Map animation utilities

---

**THE TERRAFUSION WAY™** - Smooth, performant, delightful animations! 🎨✨
