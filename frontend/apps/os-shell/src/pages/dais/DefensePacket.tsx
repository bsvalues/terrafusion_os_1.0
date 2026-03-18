/**
 * Defense Packet Generator Page (TFR-070)
 * ===================================================================
 * Select parcel, view valuation evidence, generate narrative
 * (calls backend DefenseNarrativeService), assemble packet.
 * Shows packet preview.
 */

import React, { useState } from 'react';
import { assemblePacket, getDocuments } from '../../services/suites/dossierService';

// ============================================================================
// Types
// ============================================================================

interface DefenseNarrative {
  subjectDescription: string;
  marketAnalysis: string;
  approachReconciliation: string;
  conclusion: string;
  generatedAt: string;
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
// Narrative Generation (backend call)
// ============================================================================

async function generateDefenseNarrative(
  request: NarrativeRequest
): Promise<DefenseNarrative> {
  const res = await fetch('/api/dais/defense-narrative', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`Failed to generate narrative: ${res.statusText}`);
  return res.json();
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
  const sections = [
    { title: 'Subject Description', content: narrative.subjectDescription },
    { title: 'Market Analysis', content: narrative.marketAnalysis },
    { title: 'Approach Reconciliation', content: narrative.approachReconciliation },
    { title: 'Conclusion', content: narrative.conclusion },
  ];

  return (
    <div className="rounded-lg bg-card p-6" style={{ border: '1px solid hsl(var(--tf-border) / 0.15)' }} data-testid="narrative-preview" data-material="bento">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Defense Narrative Preview</h3>
        <span className="text-xs text-muted-foreground">
          Generated: {new Date(narrative.generatedAt).toLocaleString()}
        </span>
      </div>
      <div className="space-y-4">
        {sections.map((s) => (
          <div key={s.title}>
            <h4 className="mb-1 font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              {s.title}
            </h4>
            <p className="text-sm leading-relaxed">{s.content}</p>
          </div>
        ))}
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
      const docs = await getDocuments(currentParcelId);
      const docIds = docs.map((d) => d.documentId);
      await assemblePacket(currentParcelId, docIds);
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
