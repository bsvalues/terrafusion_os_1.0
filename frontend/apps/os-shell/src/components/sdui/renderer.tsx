/**
 * TerraFusion SDUI Renderer
 *
 * Server-Driven UI renderer that takes a layout definition from the backend
 * and renders it using the component registry. Enables county-specific UI
 * customization without frontend redeployment.
 */

import React, { Suspense, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

// ── Types ─────────────────────────────────────────────────────────────

export interface SDUILayout {
  version: '1.0';
  page: string;
  title: string;
  county?: string;
  role?: string;
  sections: SDUISection[];
  actions?: SDUIAction[];
  metadata?: Record<string, unknown>;
}

export interface SDUISection {
  id: string;
  type: 'grid' | 'stack' | 'tabs' | 'accordion' | 'split';
  columns?: number;
  gap?: number;
  children: SDUIComponent[];
}

export interface SDUIComponent {
  id: string;
  component: string;
  props: Record<string, unknown>;
  dataSource?: {
    endpoint: string;
    method: 'GET' | 'POST';
    params?: Record<string, string>;
    refreshInterval?: number;
  };
  visibility?: {
    roles?: string[];
    counties?: string[];
    condition?: string;
  };
}

export interface SDUIAction {
  id: string;
  label: string;
  icon?: string;
  action: 'navigate' | 'api-call' | 'modal' | 'export' | 'print';
  target: string;
  confirmation?: string;
  requiredRole?: string;
}

// ── Component Registry ────────────────────────────────────────────────

type ComponentRenderer = React.FC<{ component: SDUIComponent }>;

const componentRegistry: Record<string, ComponentRenderer> = {
  'kpi-card': ({ component }) => (
    <Card className="bg-slate-800 border-cyan-500/20">
      <CardContent className="p-4">
        <p className="text-sm text-slate-400">{component.props.title as string}</p>
        <p className="text-2xl font-bold text-white mt-1">{component.props.value as string ?? '—'}</p>
        {component.props.trend && (
          <p className={`text-sm mt-1 ${(component.props.trend as string)?.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
            {component.props.trend as string}
          </p>
        )}
      </CardContent>
    </Card>
  ),

  'alert-banner': ({ component }) => (
    <Alert variant={component.props.severity === 'error' ? 'destructive' : 'default'}>
      <AlertDescription>{component.props.message as string}</AlertDescription>
    </Alert>
  ),

  'compliance-badge': ({ component }) => (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-cyan-500/20">
      <span className={`w-2 h-2 rounded-full ${component.props.status === 'pass' ? 'bg-emerald-400' : 'bg-red-400'}`} />
      <span className="text-sm text-white">{component.props.standard as string}</span>
    </div>
  ),

  'placeholder': ({ component }) => (
    <Card className="bg-slate-800/50 border-dashed border-slate-600">
      <CardContent className="p-8 text-center">
        <p className="text-slate-500 text-sm">Component: {component.component}</p>
        <p className="text-slate-600 text-xs mt-1">Props: {JSON.stringify(component.props)}</p>
      </CardContent>
    </Card>
  ),
};

// ── Section Renderers ─────────────────────────────────────────────────

function GridSection({ section, renderComponent }: { section: SDUISection; renderComponent: (c: SDUIComponent) => React.ReactNode }) {
  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(${section.columns ?? 1}, minmax(0, 1fr))`,
        gap: section.gap ? `${section.gap}px` : undefined,
      }}
    >
      {section.children.map(renderComponent)}
    </div>
  );
}

function StackSection({ section, renderComponent }: { section: SDUISection; renderComponent: (c: SDUIComponent) => React.ReactNode }) {
  return (
    <div className="flex flex-col" style={{ gap: section.gap ? `${section.gap}px` : '16px' }}>
      {section.children.map(renderComponent)}
    </div>
  );
}

function SplitSection({ section, renderComponent }: { section: SDUISection; renderComponent: (c: SDUIComponent) => React.ReactNode }) {
  return (
    <div className="grid grid-cols-12 gap-4">
      {section.children.map((child, i) => (
        <div key={child.id} className={i === 0 ? 'col-span-8' : 'col-span-4'}>
          {renderComponent(child)}
        </div>
      ))}
    </div>
  );
}

// ── Main Renderer ─────────────────────────────────────────────────────

interface SDUIRendererProps {
  layout: SDUILayout;
  userRole?: string;
  county?: string;
  onAction?: (action: SDUIAction) => void;
}

export function SDUIRenderer({ layout, userRole, county, onAction }: SDUIRendererProps) {
  const visibleSections = useMemo(() => {
    return layout.sections.map(section => ({
      ...section,
      children: section.children.filter(child => {
        if (!child.visibility) return true;
        if (child.visibility.roles && userRole && !child.visibility.roles.includes(userRole)) return false;
        if (child.visibility.counties && county && !child.visibility.counties.includes(county)) return false;
        return true;
      }),
    }));
  }, [layout.sections, userRole, county]);

  const renderComponent = (component: SDUIComponent) => {
    const Renderer = componentRegistry[component.component] ?? componentRegistry['placeholder'];
    return (
      <Suspense key={component.id} fallback={<Skeleton className="h-24 w-full" />}>
        <Renderer component={component} />
      </Suspense>
    );
  };

  const renderSection = (section: SDUISection) => {
    const props = { section, renderComponent };
    switch (section.type) {
      case 'grid': return <GridSection key={section.id} {...props} />;
      case 'stack': return <StackSection key={section.id} {...props} />;
      case 'split': return <SplitSection key={section.id} {...props} />;
      default: return <StackSection key={section.id} {...props} />;
    }
  };

  return (
    <div className="space-y-6">
      {layout.title && (
        <h1 className="text-2xl font-bold text-white">{layout.title}</h1>
      )}
      {visibleSections.map(renderSection)}
    </div>
  );
}

export default SDUIRenderer;
