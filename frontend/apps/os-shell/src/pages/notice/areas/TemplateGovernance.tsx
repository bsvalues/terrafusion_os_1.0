/**
 * TN-GUI-004 — Template Governance (block library + assemblies).
 *
 * Block library, template assemblies, lifecycle state, legal approval, version
 * diff and a render-preview placeholder. Legal-controlled blocks are flagged so
 * they cannot be silently edited.
 *
 * @module pages/notice/areas/TemplateGovernance
 */

import React, { useState } from 'react';
import type { LifecycleState, NoticeConsoleSnapshot, TemplateAssembly } from '../types';
import {
  EmptyState,
  SectionCard,
  StatusPill,
  Table,
  Td,
  Th,
  Tr,
  approvalVariant,
} from '../components/primitives';

function lifecycleVariant(s: LifecycleState): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (s === 'approved') return 'default';
  if (s === 'in-review') return 'secondary';
  if (s === 'retired') return 'destructive';
  return 'outline';
}

function diff(prev: string[] | undefined, next: string[]): { added: string[]; removed: string[] } {
  if (!prev) return { added: [], removed: [] };
  return {
    added: next.filter((b) => !prev.includes(b)),
    removed: prev.filter((b) => !next.includes(b)),
  };
}

export const TemplateGovernance: React.FC<{ snapshot: NoticeConsoleSnapshot }> = ({ snapshot }) => {
  const { templateBlocks, templateAssemblies } = snapshot;
  const [selected, setSelected] = useState(templateAssemblies[0]?.version ?? '');
  const active = templateAssemblies.find((a) => a.version === selected) ?? templateAssemblies[0];

  // Resolve previous assembly (same templateId, version === previousVersion).
  const previous = active?.previousVersion
    ? templateAssemblies.find((a) => a.templateId === active.templateId && a.version === active.previousVersion)
    : undefined;
  const previousBlocks = previous?.blocks ?? (active?.previousVersion ? active.blocks : undefined);
  const { added, removed } = active ? diff(previousBlocks, active.blocks) : { added: [], removed: [] };

  return (
    <div className="space-y-5" data-testid="notice-area-template-governance">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard title="Block Library">
          {templateBlocks.length === 0 ? (
            <EmptyState message="No template blocks defined." />
          ) : (
            <Table>
              <thead>
                <Tr>
                  <Th>Block</Th>
                  <Th>Kind</Th>
                  <Th className="text-right">Lifecycle</Th>
                </Tr>
              </thead>
              <tbody>
                {templateBlocks.map((b) => (
                  <Tr key={b.blockId}>
                    <Td>
                      <div className="text-sm flex items-center gap-2">
                        {b.name}
                        {b.legalControlled && <StatusPill label="Legal-controlled" variant="destructive" />}
                      </div>
                    </Td>
                    <Td className="capitalize text-xs">{b.kind.replace('-', ' ')}</Td>
                    <Td className="text-right">
                      <StatusPill label={b.lifecycle} variant={lifecycleVariant(b.lifecycle)} />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </SectionCard>

        <SectionCard title="Template Assemblies">
          <ul className="space-y-2">
            {templateAssemblies.map((a) => (
              <li key={`${a.templateId}-${a.version}`}>
                <button
                  onClick={() => setSelected(a.version)}
                  className="w-full text-left p-3 rounded-lg transition-colors"
                  style={{
                    background: a.version === selected ? 'hsl(var(--tf-accent) / 0.12)' : 'hsl(var(--tf-card-bg) / 0.4)',
                    border: `1px solid hsl(var(--tf-border) / ${a.version === selected ? 0.4 : 0.15})`,
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm">{a.templateId}-{a.version}</span>
                    <div className="flex gap-1.5">
                      <StatusPill label={a.lifecycle} variant={lifecycleVariant(a.lifecycle)} />
                      <StatusPill label={`legal: ${a.legalApproval}`} variant={approvalVariant(a.legalApproval)} />
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      {active && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SectionCard
            title={`Version Diff — ${active.templateId}-${active.version}`}
            chip={active.previousVersion ? <StatusPill label={`vs ${active.previousVersion}`} variant="outline" /> : undefined}
          >
            {!active.previousVersion ? (
              <EmptyState message="No prior version to diff against." />
            ) : added.length === 0 && removed.length === 0 ? (
              <EmptyState message="No block-level changes between versions." />
            ) : (
              <div className="space-y-2 text-sm">
                {added.map((b) => (
                  <div key={`add-${b}`} className="flex items-center gap-2">
                    <span style={{ color: 'hsl(var(--tf-success))' }}>+ added</span>
                    <span>{b}</span>
                  </div>
                ))}
                {removed.map((b) => (
                  <div key={`rem-${b}`} className="flex items-center gap-2">
                    <span style={{ color: 'hsl(var(--tf-error))' }}>− removed</span>
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Render Preview">
            <RenderPreview assembly={active} />
          </SectionCard>
        </div>
      )}
    </div>
  );
};

const RenderPreview: React.FC<{ assembly: TemplateAssembly }> = ({ assembly }) => (
  <div
    className="rounded-lg p-4 space-y-2"
    style={{ background: 'hsl(var(--tf-bg) / 0.6)', border: '1px solid hsl(var(--tf-border) / 0.3)' }}
  >
    {assembly.blocks.map((b) => (
      <div
        key={b}
        className="text-xs px-3 py-2 rounded"
        style={{ background: 'hsl(var(--tf-card-bg) / 0.6)', border: '1px dashed hsl(var(--tf-border) / 0.4)' }}
      >
        {b}
      </div>
    ))}
    <p className="text-[11px] pt-1" style={{ color: 'hsl(var(--tf-muted))' }}>
      Structural block order preview. Final rendered artifact is produced at freeze time.
    </p>
  </div>
);

export default TemplateGovernance;
