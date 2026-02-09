/**
 * @fileoverview StandaloneHomeShell Component
 *
 * OS-owned shell wrapper for standalone suite homes.
 * Provides consistent chrome, LiquidPanel materials, and a11y baseline.
 *
 * Features:
 * - Consistent header with h1 title and "Standalone" badge
 * - LiquidPanel wrapper with quality gate fallback
 * - Primary actions row
 * - "Open in Workbench" CTA when parcel context exists
 * - A11y landmarks (banner, main)
 * - Focus management
 *
 * @module standalone/StandaloneHomeShell
 * @see Slice 6: Standalone Suite Homes Consistency
 */

import { createContext, useContext, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { getOsFeatureById, WORKBENCH_FALLBACK_BASE } from '../../config/suiteRegistry';
import { useParcelContext } from '../../context/parcelContext';
import { executeOsAction, type OsActionContext } from '../../services/osActions';
import { LiquidPanel, TactileButton, useMaterialQuality } from '../../ui/materials';
import { Badge } from '../ui/badge';
import {
    DEFAULT_STANDALONE_META,
    isHandlerAction,
    isHandlerKeyAction,
    isNavigationAction,
    type StandaloneHomeAction,
    type StandaloneHomeContext,
    type StandaloneHomeMeta,
    type StandaloneHomeModule,
    type StandaloneHomeShellProps,
    type StandaloneParcelContext,
} from './standaloneHomeContracts';

import './standalone-home-shell.css';

// ============================================================================
// Context
// ============================================================================

const StandaloneContext = createContext<StandaloneHomeContext | null>(null);

/**
 * Hook to access standalone home context from child components.
 */
export function useStandaloneHome(): StandaloneHomeContext {
  const context = useContext(StandaloneContext);
  if (!context) {
    throw new Error('useStandaloneHome must be used within StandaloneHomeShell');
  }
  return context;
}

// ============================================================================
// Subcomponents
// ============================================================================

/**
 * Header section with title, badge, and primary actions.
 * Slice 9: Supports both "Open in Workbench" (with parcel) and "Choose parcel" (without).
 * Slice 15: Passes action context for telemetry.
 */
function ShellHeader({
  meta,
  parcelContext,
  onOpenWorkbench,
  onChooseParcel,
  actionContext,
}: {
  meta: StandaloneHomeMeta;
  parcelContext: StandaloneParcelContext | null;
  onOpenWorkbench: () => void;
  onChooseParcel: () => void;
  actionContext?: OsActionContext;
}) {
  const quality = useMaterialQuality();

  return (
    <header role='banner' data-testid='standalone-header' className='standalone-shell__header'>
      <div className='standalone-shell__title-row'>
        {/* Icon */}
        <span className='standalone-shell__icon' aria-hidden='true'>
          {/* Icon placeholder - integrate with icon system */}
          <svg
            viewBox='0 0 24 24'
            fill='currentColor'
            className='standalone-shell__icon-svg'
            data-decorative='true'
            aria-hidden='true'
          >
            <path d='M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6v-2zm0 4h2v2H6v-2zm4-4h8v2h-8v-2zm0 4h8v2h-8v-2z' />
          </svg>
        </span>

        {/* Title */}
        <h1 className='standalone-shell__title'>{meta.title}</h1>

        {/* Intent Badge */}
        <Badge variant='secondary' data-intent='standalone' className='standalone-shell__badge'>
          Standalone
        </Badge>

        {/* Subtitle (optional) */}
        {meta.subtitle && <span className='standalone-shell__subtitle'>{meta.subtitle}</span>}
      </div>

      {/* Description */}
      {meta.description && <p className='standalone-shell__description'>{meta.description}</p>}

      {/* Actions Row */}
      <div data-testid='standalone-actions' className='standalone-shell__actions'>
        {/* Primary Actions */}
        {meta.primaryActions.map((action) => (
          <ActionButton key={action.id} action={action} context={actionContext} />
        ))}

        {/* Workbench CTA - Slice 9: Context-aware behavior */}
        {meta.showWorkbenchCta && parcelContext && (
          <TactileButton
            variant='primary'
            onClick={onOpenWorkbench}
            className='standalone-shell__workbench-cta'
            data-testid='workbench-cta-open'
          >
            Open in Workbench
            {parcelContext.parcelName && (
              <span className='standalone-shell__parcel-hint'>({parcelContext.parcelName})</span>
            )}
          </TactileButton>
        )}

        {/* Fallback CTA when no parcel context - Slice 9 */}
        {meta.showWorkbenchCta && !parcelContext && (
          <TactileButton
            variant='secondary'
            onClick={onChooseParcel}
            className='standalone-shell__workbench-cta standalone-shell__workbench-cta--fallback'
            data-testid='workbench-cta-choose'
          >
            Choose parcel to open in Workbench
          </TactileButton>
        )}
      </div>
    </header>
  );
}

/**
 * Props for ActionButton component.
 */
interface ActionButtonProps {
  action: StandaloneHomeAction;
  context?: OsActionContext;
}

/**
 * Renders a single action button.
 * Uses dispatcher for telemetry when handlerKey is present or context is provided.
 */
function ActionButton({ action, context }: ActionButtonProps) {
  const navigate = useNavigate();

  // Handler for dispatched actions (handlerKey-based)
  const handleDispatchedAction = () => {
    if (!context) return;
    // Convert to OsAction format for dispatcher
    const osAction = {
      id: action.id,
      label: action.label,
      intent: action.intent,
      ...(action.handlerKey ? { handlerKey: action.handlerKey } : { href: action.href || '' }),
    };
    executeOsAction(osAction as Parameters<typeof executeOsAction>[0], context);
  };

  // Navigation action with Link (inline) - still emits trace via context if available
  if (isNavigationAction(action)) {
    return (
      <TactileButton
        variant='secondary'
        asChild
        disabled={action.disabled}
        aria-label={action.ariaLabel}
        onClick={
          context
            ? () => {
                // Emit trace before navigation
                executeOsAction(
                  { id: action.id, label: action.label, intent: action.intent, href: action.href },
                  context
                );
              }
            : undefined
        }
      >
        <Link to={action.href}>{action.label}</Link>
      </TactileButton>
    );
  }

  // Handler key action (preferred) - uses dispatcher
  if (isHandlerKeyAction(action) && context) {
    return (
      <TactileButton
        variant='secondary'
        onClick={handleDispatchedAction}
        disabled={action.disabled}
        aria-label={action.ariaLabel}
      >
        {action.label}
      </TactileButton>
    );
  }

  // Legacy inline handler action (backward compatibility)
  if (isHandlerAction(action)) {
    return (
      <TactileButton
        variant='secondary'
        onClick={action.handler}
        disabled={action.disabled}
        aria-label={action.ariaLabel}
      >
        {action.label}
      </TactileButton>
    );
  }

  // Action without href or handler - render as disabled
  return (
    <TactileButton variant='secondary' disabled aria-label={action.ariaLabel}>
      {action.label}
    </TactileButton>
  );
}

/**
 * Modules region: renders a grid of modules or accessible empty state.
 * Slice 13: Always renders a region (with content or empty state).
 */
function ModulesRegion({ modules }: { modules: StandaloneHomeModule[] }) {
  const hasModules = modules.length > 0;

  return (
    <section
      data-testid='standalone-modules-region'
      className='standalone-shell__modules-region'
      aria-label='Feature modules'
    >
      {hasModules ? (
        <div data-testid='standalone-modules-grid' className='standalone-shell__modules-grid'>
          {modules.map((mod) => (
            <ModuleCard key={mod.id} module={mod} />
          ))}
        </div>
      ) : (
        <div
          data-testid='standalone-modules-empty'
          className='standalone-shell__modules-empty'
          aria-label='No additional modules available'
        >
          <span className='standalone-shell__modules-empty-text'>No additional modules</span>
        </div>
      )}
    </section>
  );
}

/**
 * Renders a single module card with LiquidPanel wrapper.
 */
function ModuleCard({ module }: { module: StandaloneHomeModule }) {
  return (
    <LiquidPanel
      variant='card'
      radius='md'
      className='standalone-shell__module-panel standalone-module-panel'
    >
      <div
        data-testid={`standalone-module-${module.id}`}
        data-module-kind={module.kind}
        className='standalone-shell__module'
      >
        {/* Module header */}
        <div className='standalone-shell__module-header'>
          {module.icon && (
            <span className='standalone-shell__module-icon' aria-hidden='true'>
              {module.icon}
            </span>
          )}
          <h2 className='standalone-shell__module-title'>{module.title}</h2>
        </div>

        {/* Module content (render function or placeholder) */}
        <div className='standalone-shell__module-content'>
          {module.render ? (
            module.render()
          ) : (
            <span className='standalone-shell__module-placeholder'>
              {/* Default content based on kind */}
              {module.kind === 'info' && 'Information will appear here'}
              {module.kind === 'actions' && 'Quick actions available'}
              {module.kind === 'metrics' && 'Metrics loading...'}
              {module.kind === 'links' && 'Related resources'}
            </span>
          )}
        </div>
      </div>
    </LiquidPanel>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * StandaloneHomeShell - OS-owned shell for standalone suite homes.
 *
 * @example
 * ```tsx
 * <StandaloneHomeShell featureId="pilot">
 *   <PilotConsoleContent />
 * </StandaloneHomeShell>
 * ```
 */
export function StandaloneHomeShell({
  featureId,
  meta: metaOverrides,
  children,
  className = '',
}: StandaloneHomeShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const quality = useMaterialQuality();

  // Resolve feature metadata from registry
  const featureDefinition = getOsFeatureById(featureId);

  // Merge metadata: defaults <- registry homeMeta <- prop overrides
  const resolvedMeta = useMemo<StandaloneHomeMeta>(() => {
    const registryMeta = featureDefinition?.homeMeta ?? {};
    return {
      ...DEFAULT_STANDALONE_META,
      title: featureDefinition?.label ?? DEFAULT_STANDALONE_META.title,
      description: featureDefinition?.description ?? DEFAULT_STANDALONE_META.description,
      icon: featureDefinition?.icon ?? DEFAULT_STANDALONE_META.icon,
      ...registryMeta,
      ...metaOverrides,
      // Merge actions arrays
      primaryActions: [
        ...(registryMeta.primaryActions ?? []),
        ...(metaOverrides?.primaryActions ?? []),
      ],
      // Merge modules (prop overrides take precedence, or use registry)
      modules: metaOverrides?.modules ?? registryMeta.modules ?? [],
    };
  }, [featureDefinition, metaOverrides]);

  // Get parcel context from store (Slice 9: unified parcel context)
  const storeParcelContext = useParcelContext();

  // Extract parcel context from location state (if navigated from workbench)
  // Location state takes precedence over store (reflects navigation intent)
  const parcelContext = useMemo<StandaloneParcelContext | null>(() => {
    const state = location.state as { parcelId?: string; parcelName?: string } | null;

    // Priority 1: Location state (explicit navigation)
    if (state?.parcelId) {
      return {
        parcelId: state.parcelId,
        parcelName: state.parcelName,
        targetSuite: featureId,
      };
    }

    // Priority 2: Store context (session-persisted parcel)
    if (storeParcelContext?.parcelId) {
      return {
        parcelId: storeParcelContext.parcelId,
        parcelName: storeParcelContext.parcelName,
        targetSuite: featureId,
      };
    }

    return null;
  }, [location.state, storeParcelContext, featureId]);

  // Open in Workbench handler (with parcel context)
  const openInWorkbench = () => {
    if (parcelContext) {
      navigate(`/property/${parcelContext.parcelId}/${featureId}`);
    }
  };

  // Choose parcel handler (without parcel context - Slice 9 fallback)
  const chooseParcelForWorkbench = () => {
    // Navigate to parcel selection with intent to open this tab
    navigate(`${WORKBENCH_FALLBACK_BASE}?openTab=${featureId}`);
  };

  // Build action context for telemetry (Slice 15)
  const actionContext = useMemo<OsActionContext>(
    () => ({
      navigate,
      suiteId: featureId,
      surface: 'standalone_home',
      parcelIdHash: parcelContext?.parcelId ? `h-${parcelContext.parcelId.slice(0, 8)}` : undefined,
    }),
    [navigate, featureId, parcelContext]
  );

  // Build context value
  const contextValue = useMemo<StandaloneHomeContext>(
    () => ({
      featureId,
      meta: resolvedMeta,
      parcelContext,
      openInWorkbench,
    }),
    [featureId, resolvedMeta, parcelContext]
  );

  // Shell container classes
  const shellClasses = [
    'standalone-shell',
    quality.tier === 'low' ? 'standalone-fallback' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <StandaloneContext.Provider value={contextValue}>
      <div data-testid='standalone-shell' className={shellClasses}>
        <LiquidPanel variant='shell' radius='lg' className='standalone-shell__panel liquid-panel'>
          <ShellHeader
            meta={resolvedMeta}
            parcelContext={parcelContext}
            onOpenWorkbench={openInWorkbench}
            onChooseParcel={chooseParcelForWorkbench}
            actionContext={actionContext}
          />

          {/* Modules region: always renders (grid or empty state) - Slice 13 */}
          <ModulesRegion modules={resolvedMeta.modules ?? []} />

          <main role='main' data-testid='standalone-content' className='standalone-shell__content'>
            {children}
          </main>
        </LiquidPanel>
      </div>
    </StandaloneContext.Provider>
  );
}

// ============================================================================
// Exports
// ============================================================================

export default StandaloneHomeShell;
export type { StandaloneHomeShellProps };
