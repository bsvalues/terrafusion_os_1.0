/**
 * ClassName Utility Functions
 *
 * Utilities for managing CSS class names in TerraFusion OS.
 * Provides type-safe, conditional class name composition.
 */

type ClassValue = string | number | boolean | undefined | null;
type ClassArray = ClassValue[];
type ClassDictionary = Record<string, boolean | undefined | null>;
type ClassNameInput = ClassValue | ClassArray | ClassDictionary;

/**
 * Combine class names with conditional support
 *
 * @param inputs - Class name inputs (strings, arrays, objects)
 * @returns Combined class name string
 *
 * @example
 * cn('base-class', isActive && 'active', { 'disabled': isDisabled });
 * // "base-class active" (if isActive is true)
 */
export function cn(...inputs: ClassNameInput[]): string {
  const classes: string[] = [];

  inputs.forEach((input) => {
    if (!input) return;

    if (typeof input === 'string' || typeof input === 'number') {
      classes.push(String(input));
    } else if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested) {
        classes.push(nested);
      }
    } else if (typeof input === 'object') {
      Object.keys(input).forEach((key) => {
        if ((input as ClassDictionary)[key]) {
          classes.push(key);
        }
      });
    }
  });

  return classes.join(' ').trim();
}

/**
 * TerraFusion variant composer
 *
 * Composes TerraFusion design system variant classes
 *
 * @param base - Base class name
 * @param variant - Variant name
 * @param options - Additional options
 * @returns Composed class name
 *
 * @example
 * terraVariant('button', 'quantum', { pulse: true, glow: true });
 * // "button button-quantum pulse glow"
 */
export function terraVariant(
  base: string,
  variant?: string,
  options?: Record<string, boolean>
): string {
  const classes = [base];

  if (variant) {
    classes.push(`${base}-${variant}`);
  }

  if (options) {
    Object.keys(options).forEach((key) => {
      if (options[key]) {
        classes.push(key);
      }
    });
  }

  return classes.join(' ');
}

/**
 * Conditional class utility
 *
 * Returns class name if condition is true
 *
 * @param className - Class name to return
 * @param condition - Condition to evaluate
 * @returns Class name or empty string
 *
 * @example
 * conditionalClass('active', isActive); // "active" if isActive is true
 */
export function conditionalClass(className: string, condition: boolean): string {
  return condition ? className : '';
}

/**
 * Merge class names with deduplication
 *
 * @param inputs - Class name inputs
 * @returns Merged and deduplicated class names
 *
 * @example
 * mergeClasses('btn btn-primary', 'btn btn-large');
 * // "btn btn-primary btn-large"
 */
export function mergeClasses(...inputs: string[]): string {
  const classSet = new Set<string>();

  inputs.forEach((input) => {
    if (input) {
      input.split(' ').forEach((cls) => {
        if (cls.trim()) {
          classSet.add(cls.trim());
        }
      });
    }
  });

  return Array.from(classSet).join(' ');
}

/**
 * Generate BEM-style class names
 *
 * @param block - Block name
 * @param element - Element name (optional)
 * @param modifiers - Modifier names (optional)
 * @returns BEM class name
 *
 * @example
 * bem('button', 'icon', ['primary', 'large']);
 * // "button__icon button__icon--primary button__icon--large"
 */
export function bem(
  block: string,
  element?: string,
  modifiers?: string | string[]
): string {
  const base = element ? `${block}__${element}` : block;
  const classes = [base];

  if (modifiers) {
    const modifierArray = Array.isArray(modifiers) ? modifiers : [modifiers];
    modifierArray.forEach((modifier) => {
      classes.push(`${base}--${modifier}`);
    });
  }

  return classes.join(' ');
}

/**
 * State-based class generator
 *
 * @param base - Base class name
 * @param states - State flags
 * @returns Class names with state modifiers
 *
 * @example
 * stateClasses('input', { focused: true, invalid: false, disabled: true });
 * // "input input-focused input-disabled"
 */
export function stateClasses(
  base: string,
  states: Record<string, boolean>
): string {
  const classes = [base];

  Object.keys(states).forEach((state) => {
    if (states[state]) {
      classes.push(`${base}-${state}`);
    }
  });

  return classes.join(' ');
}

/**
 * TerraFusion glassmorphic effect classes
 *
 * @param options - Glassmorphic options
 * @returns Glass effect class names
 *
 * @example
 * glassEffect({ glow: true, intensity: 'medium' });
 * // "terra-glass terra-glow glass-medium"
 */
export function glassEffect(options?: {
  glow?: boolean;
  intensity?: 'low' | 'medium' | 'high';
  blur?: boolean;
}): string {
  return cn(
    'terra-glass',
    options?.glow && 'terra-glow',
    options?.intensity && `glass-${options.intensity}`,
    options?.blur && 'backdrop-blur'
  );
}

/**
 * TerraFusion quantum animation classes
 *
 * @param animations - Animation flags
 * @returns Quantum animation class names
 *
 * @example
 * quantumEffect({ pulse: true, shimmer: false, orbit: true });
 * // "quantum-pulse quantum-orbit"
 */
export function quantumEffect(animations?: {
  pulse?: boolean;
  shimmer?: boolean;
  orbit?: boolean;
  glow?: boolean;
}): string {
  return cn(
    animations?.pulse && 'quantum-pulse',
    animations?.shimmer && 'quantum-shimmer',
    animations?.orbit && 'quantum-orbit',
    animations?.glow && 'quantum-glow'
  );
}

/**
 * Responsive class generator
 *
 * @param base - Base class name
 * @param breakpoints - Breakpoint-specific values
 * @returns Responsive class names
 *
 * @example
 * responsiveClass('grid-cols', { xs: '1', md: '2', lg: '3' });
 * // "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
 */
export function responsiveClass(
  base: string,
  breakpoints: Partial<Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl', string>>
): string {
  const classes: string[] = [];

  if (breakpoints.xs) {
    classes.push(`${base}-${breakpoints.xs}`);
  }

  (['sm', 'md', 'lg', 'xl', '2xl'] as const).forEach((bp) => {
    if (breakpoints[bp]) {
      classes.push(`${bp}:${base}-${breakpoints[bp]}`);
    }
  });

  return classes.join(' ');
}

/**
 * Focus-visible class generator for accessibility
 *
 * @param baseClasses - Base classes to apply
 * @returns Classes with focus-visible styles
 *
 * @example
 * focusVisible('outline-none');
 * // "outline-none focus-visible:ring-2 focus-visible:ring-terra-cyan"
 */
export function focusVisible(baseClasses: string = ''): string {
  return cn(
    baseClasses,
    'focus-visible:outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-terra-cyan',
    'focus-visible:ring-offset-2',
    'focus-visible:ring-offset-terra-midnight'
  );
}

/**
 * Hover effect class generator
 *
 * @param effect - Effect type
 * @returns Hover effect classes
 *
 * @example
 * hoverEffect('glow'); // "hover:shadow-glow transition-shadow"
 */
export function hoverEffect(
  effect: 'glow' | 'quantum' | 'scale' | 'opacity' | 'brightness'
): string {
  const effects = {
    glow: 'hover:shadow-glow transition-shadow',
    quantum: 'hover-quantum transition-all',
    scale: 'hover:scale-105 transition-transform',
    opacity: 'hover:opacity-80 transition-opacity',
    brightness: 'hover:brightness-110 transition-filter',
  };

  return effects[effect];
}

/**
 * Transition class generator
 *
 * @param properties - Properties to transition
 * @param duration - Duration preset
 * @returns Transition classes
 *
 * @example
 * transition(['opacity', 'transform'], 'fast');
 * // "transition-opacity transition-transform duration-200"
 */
export function transition(
  properties: string[],
  duration: 'fast' | 'normal' | 'slow' = 'normal'
): string {
  const durations = {
    fast: 'duration-150',
    normal: 'duration-300',
    slow: 'duration-500',
  };

  return cn(
    ...properties.map((prop) => `transition-${prop}`),
    durations[duration],
    'ease-in-out'
  );
}
