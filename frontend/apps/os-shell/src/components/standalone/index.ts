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
    DEFAULT_STANDALONE_META,
    isHandlerAction,
    isNavigationAction,
    type StandaloneHomeAction,
    type StandaloneHomeContext,
    type StandaloneHomeMeta,
    type StandaloneHomeShellProps,
    type StandaloneParcelContext
} from './standaloneHomeContracts';

// Components
export { StandaloneHomeShell, useStandaloneHome } from './StandaloneHomeShell';
