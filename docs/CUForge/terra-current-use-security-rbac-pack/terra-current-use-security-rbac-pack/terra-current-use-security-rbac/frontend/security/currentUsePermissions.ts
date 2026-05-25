export type CurrentUsePermission =
  | 'VIEW_CURRENT_USE'
  | 'EDIT_CLASSIFICATION_METADATA'
  | 'RUN_ROLLBACK_CALCULATION'
  | 'LOCK_ROLLBACK_CALCULATION'
  | 'PREVIEW_NOTICE'
  | 'APPROVE_NOTICE'
  | 'ISSUE_NOTICE'
  | 'VOID_NOTICE'
  | 'VIEW_EVIDENCE'
  | 'REVIEW_EVIDENCE'
  | 'LINK_EVIDENCE_DOCUMENT'
  | 'VIEW_AUDIT_TRACE'
  | 'VIEW_POLICY_PACKS'
  | 'MANAGE_POLICY_PACKS'
  | 'VIEW_WORKFLOW_TASKS'
  | 'MANAGE_WORKFLOW_TASKS'
  | 'VIEW_SPATIAL_REVIEW'
  | 'VIEW_TREASURER_HANDOFF'
  | 'CREATE_TREASURER_HANDOFF'
  | 'MARK_TREASURER_PAYMENT_PAID'
  | 'VIEW_APPEALS'
  | 'MANAGE_APPEALS'
  | 'VIEW_COMPLIANCE'
  | 'MANAGE_INSPECTIONS'
  | 'VIEW_ANALYTICS'
  | 'MANAGE_IMPORTS'
  | 'USE_AI_ASSIST';

export interface CurrentUsePrincipal {
  userId: string;
  displayName: string;
  roles: string[];
  permissions: CurrentUsePermission[];
}

export function hasCurrentUsePermission(
  principal: CurrentUsePrincipal,
  permission: CurrentUsePermission,
): boolean {
  return principal.permissions.includes(permission);
}
