/**
 * Phase 48: Workspace Module Interface Contract
 *
 * Defines the canonical shape for any TerraCanon workspace module:
 * - id: unique module identifier
 * - title: workspace-aware display name
 * - mount: async lifecycle with UnmountFn return
 * - routes: optional navigation routes
 * - permissions: optional permission declarations
 *
 * @see Phase 48: TerraCanon Core Contracts
 */

/** Cleanup function returned by mount(). Must be safe to call multiple times. */
export type UnmountFn = () => void;

/** A navigable route within a workspace module. */
export type RouteDef = Readonly<{
  id: string;
  path: string;
  label: string;
}>;

/** A permission declaration for a workspace module. */
export type PermissionDef = Readonly<{
  id: string;
  description: string;
}>;

/** A guard request from a module to the workspace policy. */
export type GuardRequest = Readonly<{
  actionId: string;
  mutates: boolean;
  meta?: Readonly<Record<string, string | number | boolean>>;
}>;

/** The decision returned by a guard check. */
export type GuardDecision =
  | Readonly<{ allow: true }>
  | Readonly<{ allow: false; reason: string }>;

/** Context provided to a module during mount. */
export type ModuleContext = Readonly<{
  workspaceId: string;
  storageNamespace: string;
  guard: (req: GuardRequest) => GuardDecision;
}>;

/**
 * The canonical workspace module interface.
 *
 * Every TerraCanon module must satisfy this shape.
 * - `id` is globally unique across all modules.
 * - `title` is a function so it can be workspace-aware.
 * - `mount` receives a ModuleContext and returns a cleanup function.
 * - `routes` and `permissions` are optional metadata arrays.
 */
export type WorkspaceModule = Readonly<{
  id: string;
  title: (workspaceId: string) => string;
  mount: (ctx: ModuleContext) => Promise<UnmountFn>;
  routes?: readonly RouteDef[];
  permissions?: readonly PermissionDef[];
}>;
