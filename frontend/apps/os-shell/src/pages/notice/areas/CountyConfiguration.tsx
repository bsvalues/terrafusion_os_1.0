/**
 * TN-GUI-002 — County Profile / Configuration.
 *
 * Branding, approval hierarchy, language & accessibility defaults, delivery
 * rules, vendor mappings, and runtime overrides — with explicit "within bounds"
 * flagging so an operator can see when an override breaches policy guardrails.
 *
 * @module pages/notice/areas/CountyConfiguration
 */

import React from 'react';
import type { NoticeConsoleSnapshot } from '../types';
import { EmptyState, SectionCard, StatusPill, Table, Td, Th, Tr } from '../components/primitives';

export const CountyConfiguration: React.FC<{ snapshot: NoticeConsoleSnapshot }> = ({ snapshot }) => {
  const c = snapshot.county;

  return (
    <div className="space-y-5" data-testid="notice-area-county-configuration">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard
          title="Branding & Identity"
          chip={<StatusPill label={c.brandingLocked ? 'Locked' : 'Editable'} variant={c.brandingLocked ? 'default' : 'secondary'} />}
        >
          <dl className="space-y-2 text-sm">
            <Row label="County">{c.countyName}</Row>
            <Row label="Program">{c.program}</Row>
            <Row label="Tax year">{c.taxYear}</Row>
            <Row label="Environment">{c.environment}</Row>
          </dl>
        </SectionCard>

        <SectionCard title="Approval Hierarchy">
          <ol className="space-y-2 text-sm">
            {c.approvalChain.map((step, i) => (
              <li key={step} className="flex items-center gap-2">
                <span
                  className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-semibold"
                  style={{ background: 'hsl(var(--tf-accent) / 0.15)', color: 'hsl(var(--tf-accent))' }}
                >
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </SectionCard>

        <SectionCard title="Language & Accessibility Defaults">
          <div className="flex flex-wrap gap-2">
            {[...c.languageDefaults, ...c.accessibilityDefaults].map((d) => (
              <StatusPill key={d} label={d} variant="outline" />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Delivery Rules">
          <dl className="space-y-2 text-sm">
            {c.deliveryRules.map((r) => (
              <Row key={r.label} label={r.label}>{r.value}</Row>
            ))}
          </dl>
        </SectionCard>
      </div>

      <SectionCard title="Vendor Mappings">
        {c.vendorMappings.length === 0 ? (
          <EmptyState message="No vendor mappings configured." />
        ) : (
          <Table>
            <thead>
              <Tr>
                <Th>Channel</Th>
                <Th>Vendor</Th>
                <Th className="text-right">Status</Th>
              </Tr>
            </thead>
            <tbody>
              {c.vendorMappings.map((v) => (
                <Tr key={`${v.channel}-${v.vendor}`}>
                  <Td className="capitalize">{v.channel}</Td>
                  <Td>{v.vendor}</Td>
                  <Td className="text-right">
                    <StatusPill label={v.status} variant={v.status === 'active' ? 'default' : 'outline'} />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </SectionCard>

      <SectionCard
        title="Runtime Overrides"
        chip={<StatusPill label="Within allowed bounds enforced" variant="outline" />}
      >
        <Table>
          <thead>
            <Tr>
              <Th>Override</Th>
              <Th>Value</Th>
              <Th className="text-right">Bounds</Th>
            </Tr>
          </thead>
          <tbody>
            {c.runtimeOverrides.map((o) => (
              <Tr key={o.label}>
                <Td>{o.label}</Td>
                <Td className="text-xs" >{o.value}</Td>
                <Td className="text-right">
                  <StatusPill
                    label={o.withinBounds ? 'Within bounds' : 'Breaches guardrail'}
                    variant={o.withinBounds ? 'default' : 'destructive'}
                  />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </SectionCard>
    </div>
  );
};

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center justify-between gap-3">
    <dt style={{ color: 'hsl(var(--tf-muted))' }}>{label}</dt>
    <dd className="font-medium text-right">{children}</dd>
  </div>
);

export default CountyConfiguration;
