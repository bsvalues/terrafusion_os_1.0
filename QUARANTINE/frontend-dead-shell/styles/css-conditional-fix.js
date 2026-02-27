/**
 * CSS Conditional Logic Replacement
 * Converts Emotion CSS-in-JS conditional syntax to valid CSS custom properties
 */

// Performance-based CSS class assignment utility
export const getPerformanceClass = (performanceIndex) => {
  if (performanceIndex > 0.8) return 'tf-high-performance';
  if (performanceIndex > 0.5) return 'tf-medium-performance';
  return 'tf-low-performance';
};

// Status-based CSS class assignment
export const getStatusClass = (status) => {
  const statusMap = {
    active: 'tf-status-active',
    processing: 'tf-status-processing',
    idle: 'tf-status-idle',
    error: 'tf-status-error',
  };
  return statusMap[status] || 'tf-status-default';
};

// Memory usage CSS class assignment
export const getMemoryClass = (memoryUsage) => {
  if (memoryUsage < 0.7) return 'tf-memory-optimal';
  if (memoryUsage < 0.85) return 'tf-memory-warning';
  return 'tf-memory-critical';
};

// FPS-based CSS class assignment
export const getFpsClass = (fps) => {
  if (fps >= 55) return 'tf-fps-optimal';
  if (fps >= 45) return 'tf-fps-good';
  if (fps >= 30) return 'tf-fps-warning';
  return 'tf-fps-critical';
};

// Dynamic CSS custom property setter
export const setCSSVariables = (element, performance) => {
  if (!element) return;

  const root = element.style;

  // Set performance-based variables
  root.setProperty('--tf-scroll-behavior', performance.index > 0.8 ? 'smooth' : 'auto');
  root.setProperty('--tf-animation-duration', performance.index > 0.8 ? '0.3s' : '0.1s');
  root.setProperty(
    '--tf-transform-style',
    performance.index > 0.8 ? 'translate3d(0,0,0)' : 'translateZ(0)'
  );

  // Set status-based colors (resolved from TF token anchors)
  const statusColors = {
    active: 'hsl(var(--tf-success))',
    processing: 'hsl(var(--tf-accent-2))',
    idle: 'hsl(var(--tf-muted))',
    error: 'hsl(var(--tf-error))',
  };

  root.setProperty('--tf-status-color', statusColors[performance.status] || statusColors.idle);

  // Set memory-based pointer events
  root.setProperty('--tf-pointer-events', performance.memory > 0.8 ? 'none' : 'auto');
};
