/**
 * @fileoverview Standalone Module Index
 *
 * Exports all standalone home components and contracts.
 *
 * @module standalone
 * @see Slice 6: Standalone Suite Homes Consistency
 */

// Contracts
export {
    isHandlerAction,
    isNavigationAction,
    STANDALONE_META_BASE,
    type StandaloneHomeAction,
    type StandaloneHomeContext,
    type StandaloneHomeMeta,
    type StandaloneHomeShellProps,
    type StandaloneParcelContext
} from './standaloneHomeContracts';

// Components
export { StandaloneHomeShell, useStandaloneHome } from './StandaloneHomeShell';
