import type { ComponentType } from 'react';
import {
  Activity,
  BarChart3,
  Brain,
  Building2,
  Calculator,
  FileSearch,
  FileText,
  Globe,
  Layers,
  Map,
  Server,
  Settings,
  Terminal,
  TrendingUp,
  HardHat,
  Database,
  Cpu,
  Shield,
  Network,
  LayoutDashboard,
  Briefcase,
} from 'lucide-react';

export const LUCIDE_ICON_MAP = {
  Activity,
  BarChart3,
  Brain,
  Building2,
  Calculator,
  FileSearch,
  FileText,
  Globe,
  Layers,
  Map,
  Server,
  Settings,
  Terminal,
  TrendingUp,
  HardHat,
  Database,
  Cpu,
  Shield,
  Network,
  LayoutDashboard,
  Briefcase,
} as const;

export type LucideIconName = keyof typeof LUCIDE_ICON_MAP;

export function getLucideIcon(iconName: string) {
  return (LUCIDE_ICON_MAP as Record<string, ComponentType<any>>)[iconName] ?? Activity;
}
