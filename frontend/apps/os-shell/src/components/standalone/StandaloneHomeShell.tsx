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

import { getOsFeatureById } from '../../config/suiteRegistry';
import { LiquidPanel, TactileButton, useMaterialQuality } from '../../ui/materials';
import { Badge } from '../ui/badge';
import {
    DEFAULT_STANDALONE_META,
    isHandlerAction,
    isNavigationAction,
    type StandaloneHomeAction,
    type StandaloneHomeContext,
    type StandaloneHomeMeta,
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
 */
function ShellHeader({
  meta,
  parcelContext,
  onOpenWorkbench,
}: {
  meta: StandaloneHomeMeta;
  parcelContext: StandaloneParcelContext | null;
  onOpenWorkbench: () => void;
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
          <ActionButton key={action.id} action={action} />
        ))}

        {/* Workbench CTA (when parcel context exists) */}
        {meta.showWorkbenchCta && parcelContext && (
          <TactileButton
            variant='primary'
            onClick={onOpenWorkbench}
            className='standalone-shell__workbench-cta'
          >
            Open in Workbench
            {parcelContext.parcelName && (
              <span className='standalone-shell__parcel-hint'>({parcelContext.parcelName})</span>
            )}
          </TactileButton>
        )}
      </div>
    </header>
  );
}

/**
 * Renders a single action button.
 */
function ActionButton({ action }: { action: StandaloneHomeAction }) {
  if (isNavigationAction(action)) {
    return (
      <TactileButton
        variant='secondary'
        asChild
        disabled={action.disabled}
        aria-label={action.ariaLabel}
      >
        <Link to={action.href}>{action.label}</Link>
      </TactileButton>
    );
  }

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
    };
  }, [featureDefinition, metaOverrides]);

  // Extract parcel context from location state (if navigated from workbench)
  const parcelContext = useMemo<StandaloneParcelContext | null>(() => {
    const state = location.state as { parcelId?: string; parcelName?: string } | null;
    if (state?.parcelId) {
      return {
        parcelId: state.parcelId,
        parcelName: state.parcelName,
        targetSuite: featureId,
      };
    }
    return null;
  }, [location.state, featureId]);

  // Open in Workbench handler
  const openInWorkbench = () => {
    if (parcelContext) {
      navigate(`/property/${parcelContext.parcelId}/${featureId}`);
    }
  };

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
    quality.tier === 'LOW' ? 'standalone-fallback' : '',
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
          />

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
