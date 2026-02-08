/**
 * TerraFusion Policy Panel UI
 *
 * Visual interface for managing policy rules:
 * - View current policy mode (Default Allow vs Custom)
 * - Add/remove deny rules
 * - Reset policy to default
 * - Emit audit traces for all changes
 *
 * @module components/Trace/PolicyPanel
 * @see Slice 23: Policy UI for Visual Rule Management
 */

import { useCallback, useEffect, useState } from 'react';
import { emitTrace, resetActionPolicy, setActionPolicy } from '../../../services/osActions';
import { compilePolicyRules, type PolicyRule } from '../../../services/policyEngine';
import { readFileText as defaultReadFileText, type ReadFileText } from '../../../services/policyFileIO';
import { createPolicyStore } from '../../../services/policyStore';

// ============================================================================
// Policy Store Instance
// ============================================================================

const policyStore = createPolicyStore();

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generates a simple hash for rules array (for audit traces)
 */
function hashRules(rules: PolicyRule[]): string {
  const serialized = JSON.stringify(rules.map((r) => ({ ...r, id: undefined }))); // Exclude IDs from hash
  let hash = 0;
  for (let i = 0; i < serialized.length; i++) {
    const char = serialized.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

// ============================================================================
// PolicyPanel Component Props
// ============================================================================

export interface PolicyPanelProps {
  /**
   * Injectable file reader for deterministic testing
   * @default readFileText (browser FileReader)
   */
  readFileText?: ReadFileText;
}

// ============================================================================
// PolicyPanel Component
// ============================================================================

export function PolicyPanel({ readFileText = defaultReadFileText }: PolicyPanelProps = {}) {
  const [rules, setRules] = useState<PolicyRule[]>([]);
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [formError, setFormError] = useState<string>('');
  const [importError, setImportError] = useState<string>('');

  // Form fields
  const [actionId, setActionId] = useState('');
  const [suiteId, setSuiteId] = useState('');
  const [surface, setSurface] = useState<string>('');
  const [reason, setReason] = useState('');

  // Load rules from storage on mount
  useEffect(() => {
    const loadedRules = policyStore.load();
    setRules(loadedRules);

    // Apply loaded policy
    if (loadedRules.length > 0) {
      const policy = compilePolicyRules(loadedRules);
      setActionPolicy(policy);
    }
  }, []);

  // Update policy whenever rules change
  useEffect(() => {
    if (rules.length > 0) {
      const policy = compilePolicyRules(rules);
      setActionPolicy(policy);
      policyStore.save(rules);
    } else {
      resetActionPolicy();
      policyStore.clear();
    }
  }, [rules]);

  const handleAddRule = useCallback(() => {
    setIsAddingRule(true);
    setFormError('');
  }, []);

  const handleSaveRule = useCallback(() => {
    // Validate: at least one selector required
    if (!actionId && !suiteId && !surface) {
      setFormError('At least one selector required (Action ID, Suite ID, or Surface)');
      return;
    }

    const newRule: PolicyRule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      effect: 'deny',
      ...(actionId && { actionId }),
      ...(suiteId && { suiteId }),
      ...(surface && { surface: surface as any }),
      reason: reason || 'No reason provided',
    };

    const updatedRules = [...rules, newRule];
    setRules(updatedRules);

    // Emit audit trace
    emitTrace({
      type: 'policy_updated',
      timestamp: Date.now(),
      payload: {
        ruleCount: updatedRules.length,
        rulesHash: hashRules(updatedRules),
        addedRuleId: newRule.id,
      },
    });

    // Reset form
    setActionId('');
    setSuiteId('');
    setSurface('');
    setReason('');
    setIsAddingRule(false);
    setFormError('');
  }, [actionId, suiteId, surface, reason, rules]);

  const handleCancelAdd = useCallback(() => {
    setActionId('');
    setSuiteId('');
    setSurface('');
    setReason('');
    setIsAddingRule(false);
    setFormError('');
  }, []);

  const handleRemoveRule = useCallback(
    (ruleId: string) => {
      const updatedRules = rules.filter((r) => r.id !== ruleId);
      setRules(updatedRules);

      // Emit audit trace
      emitTrace({
        type: 'policy_updated',
        timestamp: Date.now(),
        payload: {
          ruleCount: updatedRules.length,
          rulesHash: hashRules(updatedRules),
          removedRuleId: ruleId,
        },
      });
    },
    [rules]
  );

  const handleResetPolicy = useCallback(() => {
    setRules([]);

    // Emit audit trace
    emitTrace({
      type: 'policy_reset',
      timestamp: Date.now(),
      payload: {
        previousRuleCount: rules.length,
      },
    });
  }, [rules]);

  const handleExportRules = useCallback(() => {
    const jsonString = policyStore.exportRules(rules);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `policy-rules-${timestamp}.json`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Revoke URL (if supported)
    if (URL.revokeObjectURL) {
      URL.revokeObjectURL(url);
    }

    // Emit audit trace
    emitTrace({
      type: 'policy_exported',
      timestamp: Date.now(),
      payload: {
        ruleCount: rules.length,
        rulesHash: hashRules(rules),
      },
    });
  }, [rules]);

  const handleImportRules = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const jsonString = await readFileText(file);
      const result = policyStore.importRules(jsonString);

      if (result.success) {
        setRules(result.rules);
        setImportError('');

        // Emit audit trace
        emitTrace({
          type: 'policy_imported',
          timestamp: Date.now(),
          payload: {
            ruleCount: result.rules.length,
            rulesHash: hashRules(result.rules),
          },
        });
      } else {
        setImportError(result.error.message);
      }
    } catch (error) {
      setImportError('Failed to read file. Please try again.');
    }

    // Reset input so same file can be re-selected
    event.target.value = '';
  }, [readFileText]);

  const policyMode = rules.length === 0 ? 'Default Allow' : 'Custom';

  return (
    <div className='policy-panel' style={{ padding: '16px', fontFamily: 'monospace' }}>
      {/* Policy Mode Indicator */}
      <div style={{ marginBottom: '16px' }}>
        <strong>Policy Mode:</strong> {policyMode}
      </div>

      {/* Active Rules List */}
      <div style={{ marginBottom: '16px' }}>
        <strong>Active Rules ({rules.length}):</strong>
        {rules.length === 0 ? (
          <div style={{ fontStyle: 'italic', color: '#666', marginTop: '8px' }}>
            No active policy rules — all actions allowed
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, marginTop: '8px' }}>
            {rules.map((rule) => (
              <li
                key={rule.id}
                style={{
                  border: '1px solid #ccc',
                  padding: '8px',
                  marginBottom: '8px',
                  borderRadius: '4px',
                }}
              >
                <div>
                  <strong>DENY:</strong>
                  {rule.actionId && ` actionId=${rule.actionId}`}
                  {rule.suiteId && ` suiteId=${rule.suiteId}`}
                  {rule.surface && ` surface=${rule.surface}`}
                </div>
                <div style={{ fontSize: '0.9em', color: '#666', marginTop: '4px' }}>
                  {rule.reason}
                </div>
                <button
                  onClick={() => handleRemoveRule(rule.id)}
                  aria-label='Remove rule'
                  style={{ marginTop: '4px', fontSize: '0.8em' }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add Rule Form */}
      {isAddingRule ? (
        <div style={{ border: '1px solid #ccc', padding: '12px', borderRadius: '4px' }}>
          <div style={{ marginBottom: '8px' }}>
            <label htmlFor='actionId' style={{ display: 'block', marginBottom: '4px' }}>
              Action ID (optional):
            </label>
            <input
              id='actionId'
              type='text'
              value={actionId}
              onChange={(e) => setActionId(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label htmlFor='suiteId' style={{ display: 'block', marginBottom: '4px' }}>
              Suite ID (optional):
            </label>
            <input
              id='suiteId'
              type='text'
              value={suiteId}
              onChange={(e) => setSuiteId(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label htmlFor='surface' style={{ display: 'block', marginBottom: '4px' }}>
              Surface (optional):
            </label>
            <select
              id='surface'
              value={surface}
              onChange={(e) => setSurface(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value=''>-- None --</option>
              <option value='launcher'>launcher</option>
              <option value='standalone_home'>standalone_home</option>
              <option value='shellhome'>shellhome</option>
              <option value='module'>module</option>
              <option value='workbench'>workbench</option>
              <option value='trace'>trace</option>
            </select>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label htmlFor='reason' style={{ display: 'block', marginBottom: '4px' }}>
              Reason (required):
            </label>
            <textarea
              id='reason'
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ width: '100%', minHeight: '60px' }}
            />
          </div>

          {formError && (
            <div style={{ color: 'red', marginBottom: '8px', fontSize: '0.9em' }}>{formError}</div>
          )}

          <button onClick={handleSaveRule} style={{ marginRight: '8px' }}>
            Save Rule
          </button>
          <button onClick={handleCancelAdd}>Cancel</button>
        </div>
      ) : (
        <button onClick={handleAddRule}>Add Rule</button>
      )}

      {/* Import Error Display */}
      {importError && (
        <div
          style={{
            color: 'red',
            marginTop: '8px',
            padding: '8px',
            border: '1px solid red',
            borderRadius: '4px',
            fontSize: '0.9em',
          }}
        >
          {importError}
        </div>
      )}

      {/* Actions: Reset, Export, Import */}
      {!isAddingRule && (
        <div style={{ marginTop: '16px' }}>
          {rules.length > 0 && (
            <button onClick={handleResetPolicy} style={{ marginRight: '8px', color: 'red' }}>
              Reset Policy
            </button>
          )}

          <button onClick={handleExportRules} style={{ marginRight: '8px' }}>
            Export Rules
          </button>

          <label
            htmlFor='import-rules-input'
            style={{
              display: 'inline-block',
              padding: '2px 8px',
              background: '#007bff',
              color: 'white',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Import Rules
            <input
              id='import-rules-input'
              type='file'
              accept='application/json,.json'
              onChange={handleImportRules}
              aria-label='Import Rules'
              style={{ display: 'none' }}
            />
          </label>
        </div>
      )}
    </div>
  );
}
