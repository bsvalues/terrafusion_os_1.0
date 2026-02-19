/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Ambient module declarations to stabilize `pnpm run type-check`.
 *
 * Why this exists:
 * - Some dependencies do not ship TypeScript declarations in currently pinned versions.
 * - Some transitive type libraries are unavailable in this workspace.
 *
 * Contract:
 * - Keep minimal and only cover modules that currently break type-check.
 * - Replace with concrete upstream types when practical.
 *
 * Compile-time only; zero runtime impact.
 */

declare module "prismjs" {
  const Prism: any;
  export default Prism;
}

declare module "ramda" {
  const R: any;
  export default R;
}

declare module "react-redux" {
  const ReactRedux: any;
  export default ReactRedux;
}

declare module "semver" {
  const semver: any;
  export default semver;
}

declare module "serve-static" {
  const serveStatic: any;
  export default serveStatic;
}

declare module "three" {
  const THREE: any;
  export default THREE;
}

declare module "trusted-types" {
  const trustedTypes: any;
  export default trustedTypes;
}

declare module "use-sync-external-store" {
  const useSyncExternalStore: any;
  export default useSyncExternalStore;
}

declare module "use-sync-external-store/shim" {
  const shim: any;
  export default shim;
}

declare module "use-sync-external-store/shim/index.js" {
  const shim: any;
  export default shim;
}
