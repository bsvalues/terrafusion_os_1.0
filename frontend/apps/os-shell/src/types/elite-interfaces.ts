/**
 * ═══════════════════════════════════════════════════════════════
 * ELITE TERRAFUSION COMPONENT INTERFACES
 * Standardized TypeScript Interfaces for TerraFusion Design System
 * THE TERRAFUSION WAY - PhD-Level Type Safety
 * ═══════════════════════════════════════════════════════════════
 */

import { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

// Base component props with TerraFusion theming
export interface TerraFusionBaseProps {
  className?: string;
  children?: ReactNode;
  glow?: boolean;
  pulse?: boolean;
  quantum?: boolean;
}

// Elite Button Component Interface
export interface EliteButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    TerraFusionBaseProps {
  variant?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'destructive'
    | 'outline'
    | 'quantum'
    | 'danger';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg' | 'md';
  loading?: boolean;
  disabled?: boolean;
}

// Elite Input Component Interface
export interface EliteInputProps
  extends InputHTMLAttributes<HTMLInputElement>,
    TerraFusionBaseProps {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
  variant?: 'default' | 'quantum' | 'glass';
}

// Elite Card Component Interface
export interface EliteCardProps extends HTMLAttributes<HTMLDivElement>, TerraFusionBaseProps {
  variant?: 'default' | 'glass' | 'quantum' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

// Elite Progress Component Interface
export interface EliteProgressProps extends TerraFusionBaseProps {
  value: number;
  max?: number;
  variant?: 'default' | 'quantum' | 'glow';
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  label?: string;
}

// Elite Badge Component Interface
export interface EliteBadgeProps extends HTMLAttributes<HTMLSpanElement>, TerraFusionBaseProps {
  variant?:
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'success'
    | 'warning'
    | 'error'
    | 'quantum';
  size?: 'sm' | 'md' | 'lg';
}

// Elite Avatar Component Interface
export interface EliteAvatarProps extends HTMLAttributes<HTMLDivElement>, TerraFusionBaseProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Elite Modal Component Interface
export interface EliteModalProps extends TerraFusionBaseProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
}

// Elite Navigation Component Interface
export interface EliteNavigationProps extends HTMLAttributes<HTMLElement>, TerraFusionBaseProps {
  items: NavigationItem[];
  activeItem?: string;
  onItemClick?: (item: NavigationItem) => void;
  orientation?: 'horizontal' | 'vertical';
}

export interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  icon?: ReactNode;
  children?: NavigationItem[];
  disabled?: boolean;
}

// Elite Data Table Component Interface
export interface EliteDataTableProps<T = any> extends TerraFusionBaseProps {
  data: T[];
  columns: DataTableColumn<T>[];
  loading?: boolean;
  pagination?: boolean;
  pageSize?: number;
  sortable?: boolean;
  filterable?: boolean;
  selectable?: boolean;
  onRowClick?: (row: T) => void;
  onSelectionChange?: (selectedRows: T[]) => void;
}

export interface DataTableColumn<T = any> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  render?: (value: any, row: T) => ReactNode;
}

// Elite Form Component Interfaces
export interface EliteFormProps extends HTMLAttributes<HTMLFormElement>, TerraFusionBaseProps {
  onSubmit: (data: any) => void;
  validation?: any;
  loading?: boolean;
}

export interface EliteSelectProps extends TerraFusionBaseProps {
  options: SelectOption[];
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  multiple?: boolean;
  searchable?: boolean;
  disabled?: boolean;
  label?: string;
  error?: string;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

// Elite Chart Component Interfaces
export interface EliteChartProps extends TerraFusionBaseProps {
  data: any[];
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  width?: number;
  height?: number;
  responsive?: boolean;
  theme?: 'default' | 'quantum' | 'dark';
}

// Elite Toast/Notification Interface
export interface EliteToastProps extends TerraFusionBaseProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Elite Layout Component Interfaces
export interface EliteLayoutProps extends HTMLAttributes<HTMLDivElement>, TerraFusionBaseProps {
  sidebar?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  sidebarCollapsed?: boolean;
  sidebarWidth?: string | number;
}

export interface EliteGridProps extends HTMLAttributes<HTMLDivElement>, TerraFusionBaseProps {
  columns?: number | string;
  gap?: string | number;
  responsive?: boolean;
}

export interface EliteFlexProps extends HTMLAttributes<HTMLDivElement>, TerraFusionBaseProps {
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  gap?: string | number;
}

// Elite Widget System Interfaces
export interface EliteWidgetProps extends TerraFusionBaseProps {
  id: string;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  resizable?: boolean;
  draggable?: boolean;
  collapsible?: boolean;
  closable?: boolean;
  loading?: boolean;
  error?: string;
  onResize?: (size: { width: number; height: number }) => void;
  onMove?: (position: { x: number; y: number }) => void;
  onClose?: () => void;
}

// Elite Dashboard Interface
export interface EliteDashboardProps extends TerraFusionBaseProps {
  widgets: EliteWidgetProps[];
  layout?: 'grid' | 'masonry' | 'flex';
  editable?: boolean;
  responsive?: boolean;
  onLayoutChange?: (layout: any) => void;
  onWidgetAdd?: (widget: EliteWidgetProps) => void;
  onWidgetRemove?: (widgetId: string) => void;
}

// Elite System Status Interfaces
export interface SystemHealthMetrics {
  cpu: number;
  memory: number;
  network: number;
  storage: number;
  uptime: number;
  errors: number;
  warnings: number;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
}

export interface PerformanceMetrics {
  fps: number;
  renderTime: number;
  bundleSize: number;
  loadTime: number;
  memoryUsage: number;
  networkLatency: number;
}

export interface AIInsight {
  id: string;
  type: 'optimization' | 'prediction' | 'alert' | 'recommendation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  confidence: number;
  impact: string;
  timestamp: Date;
  autoApplicable: boolean;
}

// Elite Theme Interface
export interface TerraFusionTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    'terra-cyan': string;
    'terra-midnight': string;
    'terra-blue': string;
    'terra-slate': string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    golden: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
    fontWeight: {
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
  };
  radius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    glow: string;
    quantum: string;
  };
  animations: {
    duration: {
      fast: string;
      normal: string;
      slow: string;
    };
    easing: {
      ease: string;
      'ease-in': string;
      'ease-out': string;
      'ease-in-out': string;
    };
  };
}

// All interfaces are already exported above with their declarations
