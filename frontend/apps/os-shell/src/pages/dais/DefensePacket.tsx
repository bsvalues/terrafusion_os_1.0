/**
 * Defense Packet Generator Page (TFR-070)
 * ===================================================================
 * Select parcel, view valuation evidence, generate narrative
 * (calls backend DefenseNarrativeService), assemble packet.
 * Shows packet preview.
 */

import React, { useState } from 'react';
import { invokeTool } from '../../api/pilotApi';
import { ModelReceipt } from '../../components/dais/ModelReceipt';

// ============================================================================
// Types
// ============================================================================

/** Output shape fed by the draft_appeal_response pilot tool. */
interface DefenseNarrative {
  summary: string;
  payloadRef: string;
  generatedAt: string;
  correlationId: string;
}

interface NarrativeRequest {
  parcelId: string;
  currentValue: number;
  petitionerValue: number;
  appealBasis: string;
  propertyAddress: string;
  propertyType: string;
  taxYear: number;
}

// ============================================================================
// Narrative Generation (via os-platform fabric)
// Execution path: invokeTool → POST /pilot/invoke → ToolRunner (Gate 4/5/6)
//   → handlers.real.ts:draftAppealResponseRealHandler → backend
// ============================================================================

async function generateDefenseNarrative(
  request: NarrativeRequest
): Promise<DefenseNarrative> {
  const response = await invokeTool({
    toolId: 'draft_appeal_response',
    params: {
      parcelId: request.parcelId,
      appealId: request.parcelId,
      position: 'uphold',
      tone: 'formal',
      includeEvidenceRefs: true,
    },
    parcelId: request.parcelId,
  });
  if (!response.success || !response.result) {
    throw new Error(response.error?.message ?? 'Failed to generate narrative');
  }
  let summary = response.result.output;
  let payloadRef = `dossier://appeal/${request.parcelId}`;
  try {
    const parsed = JSON.parse(response.result.output) as {
      draftSummary?: string;
      payloadRef?: string;
    };
    if (parsed.draftSummary) summary = parsed.draftSummary;
    if (parsed.payloadRef) payloadRef = parsed.payloadRef;
  } catch {
    // output is plain text — use as-is
  }
  return {
    summary,
    payloadRef,
    generatedAt: new Date().toISOString(),
    correlationId: response.correlationId,
  };
}

// ============================================================================
// Parcel Input Form
// ============================================================================

function ParcelInputForm({
  onGenerate,
  generating,
}: {
  onGenerate: (req: NarrativeRequest) => void;
  generating: boolean;
}) {
  const [parcelId, setParcelId] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [petitionerValue, setPetitionerValue] = useState('');
  const [appealBasis, setAppealBasis] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [propertyType, setPropertyType] = useState('residential');
  const [taxYear, setTaxYear] = useState(new Date().getFullYear().toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({
      parcelId,
      currentValue: parseFloat(currentValue),
      petitionerValue: parseFloat(petitionerValue),
      appealBasis,
      propertyAddress,
      propertyType,
      taxYear: parseInt(taxYear, 10),
    });
  };

  return (
    <div className="rounded-lg bg-card p-6" style={{ border: '1px solid hsl(var(--tf-border) / 0.15)' }} data-testid="defense-form" data-material="bento">
      <h3 className="mb-4 text-lg font-semibold">Appeal Details</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Parcel ID</label>
            <input
              type="text"
              value={parcelId}
              onChange={(e) => setParcelId(e.target.value)}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="e.g. 1-0234-100-0001-000"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Property Address</label>
            <input
              type="text"
              value={propertyAddress}
              onChange={(e) => setPropertyAddress(e.target.value)}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Current Assessed Value</label>
            <input
              type="number"
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Petitioner Requested Value</label>
            <input
              type="number"
              value={petitionerValue}
              onChange={(e) => setPetitionerValue(e.target.value)}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Property Type</label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="industrial">Industrial</option>
              <option value="agricultural">Agricultural</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Tax Year</label>
            <input
              type="number"
              value={taxYear}
              onChange={(e) => setTaxYear(e.target.value)}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Appeal Basis</label>
          <textarea
            value={appealBasis}
            onChange={(e) => setAppealBasis(e.target.value)}
            required
            rows={3}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="State the petitioner's basis for appeal..."
          />
        </div>
        <button
          type="submit"
          disabled={generating}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {generating ? 'Generating Narrative...' : 'Generate Defense Narrative'}
        </button>
      </form>
    </div>
  );
}

// ============================================================================
// Narrative Preview
// ============================================================================

function NarrativePreview({ narrative }: { narrative: DefenseNarrative }) {
  return (
    <div className="rounded-lg bg-card p-6" style={{ border: '1px solid hsl(var(--tf-border) / 0.15)' }} data-testid="narrative-preview" data-material="bento">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Defense Narrative Preview</h3>
        <span className="text-xs text-muted-foreground">
          Generated: {new Date(narrative.generatedAt).toLocaleString()}
        </span>
      </div>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{narrative.summary}</p>
        <p className="text-xs text-muted-foreground">
          Payload ref:{' '}
          <code className="font-mono text-xs">{narrative.payloadRef}</code>
        </p>
        <p className="text-xs text-muted-foreground">
          Correlation:{' '}
          <code className="font-mono text-xs">{narrative.correlationId}</code>
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function DefensePacket() {
  const [narrative, setNarrative] = useState<DefenseNarrative | null>(null);
  const [generating, setGenerating] = useState(false);
  const [assembling, setAssembling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [packetReady, setPacketReady] = useState(false);
  const [currentParcelId, setCurrentParcelId] = useState('');

  const handleGenerate = async (request: NarrativeRequest) => {
    setGenerating(true);
    setError(null);
    setCurrentParcelId(request.parcelId);
    try {
      const result = await generateDefenseNarrative(request);
      setNarrative(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate narrative');
    } finally {
      setGenerating(false);
    }
  };

  const handleAssemblePacket = async () => {
    if (!currentParcelId) return;
    setAssembling(true);
    setError(null);
    try {
      // Execution path: invokeTool → POST /pilot/invoke → ToolRunner (Gate 4/5/6 write_high)
      //   → handlers.real.ts:assembleBoePacketRealHandler → POST /api/dossier/boe/{caseId}/packet
      const response = await invokeTool({
        toolId: 'assemble_boe_packet',
        params: {
          county: 'benton',
          caseId: currentParcelId,
          include: ['evidence', 'valuation_history', 'comps'],
        },
        parcelId: currentParcelId,
        confirmation: true,
        reasonCode: 'boe_defense_packet',
      });
      if (!response.success) {
        throw new Error(response.error?.message ?? 'Failed to assemble packet');
      }
      setPacketReady(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assemble packet');
    } finally {
      setAssembling(false);
    }
  };

  return (
    <div className="space-y-6 p-6" data-testid="defense-packet" style={{ background: 'hsl(var(--tf-bg))', color: 'hsl(var(--tf-fg))' }}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Defense Packet Generator</h1>
        <p className="text-sm text-muted-foreground">
          Generate BOE defense narratives and assemble evidence packets
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-destructive/20 p-4 text-sm text-red-400">{error}</div>
      )}

      {/* Input Form */}
      <ParcelInputForm onGenerate={handleGenerate} generating={generating} />

      {/* Narrative Preview */}
      {narrative && (
        <>
          <NarrativePreview narrative={narrative} />

          {/* Model Receipt — provenance audit trail (Proof Layer spec) */}
          <ModelReceipt
            modelId="draft_appeal_response"
            modelName="Defense Narrative Service (Fabric-Governed)"
            trainedAt={narrative.generatedAt}
          />

          {/* Assemble Packet */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleAssemblePacket}
              disabled={assembling || packetReady}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {assembling
                ? 'Assembling Packet...'
                : packetReady
                  ? 'Packet Assembled'
                  : 'Assemble Defense Packet'}
            </button>
            {packetReady && (
              <span className="inline-flex items-center rounded-md bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                Ready for BOE
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
