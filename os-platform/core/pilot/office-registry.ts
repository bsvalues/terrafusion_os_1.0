/**
 * TerraFusion OS — Office Registry (R3.1)
 *
 * Defines the county offices that the OS serves, their suite mappings,
 * workbench tab contributions, and tool allowlists.
 *
 * This is the runtime source of truth for multi-office support.
 * The Suite Constitution defines the names; this registry wires them.
 */

import type { OfficeDefinition, OfficeId, OfficeRegistry } from '../types/index.js';

// ============================================================================
// Office Definitions (Constitutional — locked names)
// ============================================================================

const OFFICE_DEFINITIONS: readonly OfficeDefinition[] = [
  {
    id: 'assessor',
    displayName: 'Assessor',
    suiteIds: ['forge', 'atlas', 'dais', 'dossier'],
    tabIds: ['summary', 'forge', 'atlas', 'dais', 'dossier'],
    status: 'active',
    toolAllowlist: [
      'run_valuation_model', 'explain_value_change', 'compare_sales',
      'estimate_income_approach', 'explain_mass_appraisal_model', 'run_depreciation_schedule',
      'explain_model_results', 'cost_approach_estimate',
      'get_gis_layers',
      'summarize_levy_rate_components', 'summarize_pilt_exposure', 'create_permit_inspection',
      'get_workflow_status', 'list_pending_permits', 'assign_appraiser_task',
      'generate_assessment_notice', 'draft_value_change_notice', 'check_exemption_eligibility',
      'assemble_boe_packet', 'draft_boe_appeal_response',
      'process_exemption_renewal', 'file_appeal', 'schedule_boe_hearing',
      'get_certification_progress', 'sign_off_certification_step',
      'queue_notice_for_mailing', 'get_queue_statistics', 'escalate_task',
      'summarize_dossier', 'synthesize_evidence', 'generate_narrative',
      'summarize_parcel_casefile', 'add_dossier_note', 'draft_appeal_response',
    ],
  },
  {
    id: 'clerk',
    displayName: 'County Clerk',
    suiteIds: ['clerk'],
    tabIds: ['clerk'],
    status: 'active',
    toolAllowlist: [
      'search_recorded_documents', 'get_title_chain', 'explain_recording_fees',
      'record_document', 'release_lien', 'summarize_parcel_recordings',
    ],
  },
  {
    id: 'treasurer',
    displayName: 'County Treasurer',
    suiteIds: ['treasury'],
    tabIds: ['treasury'],
    status: 'active',
    toolAllowlist: [
      'get_tax_statement', 'explain_tax_breakdown', 'record_payment',
      'check_delinquency_status', 'create_installment_plan',
      'summarize_collection_stats', 'initiate_tax_sale',
    ],
  },
  {
    id: 'auditor',
    displayName: 'County Auditor',
    suiteIds: ['audit'],
    tabIds: ['audit'],
    status: 'active',
    toolAllowlist: [
      'audit_roll_summary', 'check_levy_compliance', 'submit_audit_finding',
      'reconcile_cross_office', 'generate_compliance_report',
    ],
  },
  {
    id: 'recorder',
    displayName: 'County Recorder',
    suiteIds: [],
    tabIds: [],
    status: 'reserved',
    toolAllowlist: [],
  },
] as const;

// ============================================================================
// Office Registry Implementation
// ============================================================================

class OfficeRegistryImpl implements OfficeRegistry {
  readonly offices: OfficeDefinition[];

  constructor() {
    this.offices = [...OFFICE_DEFINITIONS];
  }

  getOffice(id: OfficeId): OfficeDefinition | undefined {
    return this.offices.find((o) => o.id === id);
  }

  getActiveOffices(): OfficeDefinition[] {
    return this.offices.filter((o) => o.status === 'active');
  }

  getToolsForOffice(id: OfficeId): string[] {
    const office = this.getOffice(id);
    return office?.toolAllowlist ?? [];
  }

  /** Check if a tool is allowed for a given office */
  isToolAllowed(officeId: OfficeId, toolId: string): boolean {
    const tools = this.getToolsForOffice(officeId);
    // OS-level tools (route_to_parcel, search_trace_by_correlation, request_trace_redaction)
    // are allowed for all offices
    const OS_TOOLS = ['route_to_parcel', 'search_trace_by_correlation', 'request_trace_redaction'];
    return tools.includes(toolId) || OS_TOOLS.includes(toolId);
  }

  /** Get all offices that have access to a specific tool */
  getOfficesForTool(toolId: string): OfficeDefinition[] {
    return this.offices.filter((o) => o.toolAllowlist.includes(toolId));
  }
}

// ============================================================================
// Exports
// ============================================================================

/** Singleton office registry */
export const officeRegistry: OfficeRegistry & {
  isToolAllowed(officeId: OfficeId, toolId: string): boolean;
  getOfficesForTool(toolId: string): OfficeDefinition[];
} = new OfficeRegistryImpl();

export { OFFICE_DEFINITIONS };
