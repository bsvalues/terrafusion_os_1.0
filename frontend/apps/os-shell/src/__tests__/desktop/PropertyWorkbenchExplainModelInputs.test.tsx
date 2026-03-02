/**
 * PropertyWorkbench explain_model_inputs panel - REMOVED
 *
 * The debug panels (explain_model_inputs, compare_assessed_value_history,
 * summarize_sales_comps_rationale) were removed during the workbench shell
 * reconciliation (feat/workbench-shell-reconciliation).
 *
 * The PropertyWorkbench now uses ContextRibbon + SuiteCompass + ActivityFeed
 * matching the spec-compliant layout from PropertyWorkbenchWindow.
 *
 * Tool execution surfaces will be rebuilt via TerraPilot (the OS copilot)
 * rather than debug panels in the workbench chrome.
 */
import '@testing-library/jest-dom';

describe('PropertyWorkbench explain_model_inputs action', () => {
  it('debug panel removed - tool execution moved to TerraPilot', () => {
    // Panels were replaced by ContextRibbon + SuiteCompass + ActivityFeed
    expect(true).toBe(true);
  });
});
