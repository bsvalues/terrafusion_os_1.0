/**
 * TerraFusion Academy
 *
 * A standalone home for authored assessment doctrine and institutional
 * guidance. The Academy is reference material — the principles a county
 * applies — NOT a live operational dashboard.
 *
 * DATA POSTURE (honest by construction):
 * - All content on this page is STATIC, AUTHORED institutional doctrine.
 * - It does NOT read or display live county counts, risk, deadlines, ratios,
 *   queues, or proof-chain metrics. Nothing here claims current operational
 *   status. There are no API calls on mount.
 * - The "Teach me why" affordance opens {@link TeachMeWhyPanel} with authored
 *   reasoning and explicit attribution, never fabricated live evidence.
 *
 * This page is the governance-safe home for the cinematic "nerve center"
 * design language explored in docs/prototypes — applied to doctrine, which is
 * authored and stable, rather than to live operational claims (which would
 * require a real, unavailable-safe data contract before entering production).
 *
 * @module pages/AcademyHome
 */

import React, { useState, useCallback } from 'react';
import {
  GraduationCap,
  Scale,
  Gavel,
  FileCheck2,
  ClipboardCheck,
  Mailbox,
  Landmark,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import { LiquidPanel } from '../ui/materials';
import { TeachMeWhyPanel, type TeachMeWhyStep } from '../components/common/TeachMeWhyPanel';

// ============================================================================
// Doctrine model — authored institutional guidance (static)
// ============================================================================

interface AcademyDoctrine {
  id: string;
  discipline: string;
  title: string;
  /** Authored guidance summary. General principle, not a live status claim. */
  summary: string;
  icon: React.ReactNode;
  teach: {
    title: string;
    lede: string;
    steps: TeachMeWhyStep[];
    sourceNote: string;
  };
}

const DOCTRINE: AcademyDoctrine[] = [
  {
    id: 'ratio-tolerance',
    discipline: 'Valuation',
    title: 'Ratio tolerance & calibration',
    summary:
      'A stratum is reviewed for recalibration when its median assessment-to-sale ratio drifts outside the adopted tolerance band. Thin-market commercial strata receive extra scrutiny before conclusions are drawn.',
    icon: <Scale className="h-4 w-4" />,
    teach: {
      title: 'Why ratio tolerance triggers a review',
      lede: 'The reasoning a calibration review rests on, stated as doctrine.',
      steps: [
        {
          title: 'Sales are the measuring stick',
          body: 'Qualified, arms-length sales are the evidence of market value. A stratum is only as defensible as the sales behind its ratio.',
        },
        {
          title: 'The median is the signal',
          body: 'When the median ratio moves outside the adopted tolerance band, the stratum is no longer tracking the market and recalibration is considered.',
        },
        {
          title: 'Thin markets need caution',
          body: 'In strata with few sales, a single transaction can swing the median. Doctrine calls for confirming the signal before acting, not reacting to noise.',
        },
        {
          title: 'Review is reversible; certification is not',
          body: 'Recalibrating early keeps the stratum defensible before notices and certification come to depend on it.',
        },
      ],
      sourceNote:
        'Authored institutional doctrine. This is general assessment guidance, not a live ratio study or a claim about any current stratum.',
    },
  },
  {
    id: 'qualified-sales',
    discipline: 'Valuation',
    title: 'Qualified sales review',
    summary:
      'Before a sale informs value, it is screened for arms-length character. Conditional or non-market transactions are documented and excluded from the ratio rather than silently dropped.',
    icon: <Landmark className="h-4 w-4" />,
    teach: {
      title: 'Why sales are screened before use',
      lede: 'How a sale earns its place in the ratio.',
      steps: [
        {
          title: 'Not every sale is market evidence',
          body: 'Family transfers, distressed sales, and bundled deals do not reflect open-market value and can distort a stratum.',
        },
        {
          title: 'Exclusions are documented',
          body: 'When a sale is set aside, the reason is recorded. Defensibility comes from a visible decision, not an invisible one.',
        },
        {
          title: 'The remaining set carries the ratio',
          body: 'Only qualified transactions inform the median, so the conclusion rests on evidence that would survive a hearing.',
        },
      ],
      sourceNote:
        'Authored institutional doctrine on sales qualification. It does not report any specific sales or counts.',
    },
  },
  {
    id: 'exemption-renewal',
    discipline: 'Exemptions',
    title: 'Exemption renewal standards',
    summary:
      'Renewals are worked in filing order with attention to completeness. Aging files are surfaced before they threaten downstream deadlines, and missing documentation is requested rather than assumed.',
    icon: <FileCheck2 className="h-4 w-4" />,
    teach: {
      title: 'Why renewals are aged and tracked',
      lede: 'The discipline behind an exemption queue.',
      steps: [
        {
          title: 'Eligibility must be re-established',
          body: 'An exemption is a continuing determination. Renewal confirms the conditions that justified it still hold.',
        },
        {
          title: 'Aging is a leading indicator',
          body: 'Files that sit untouched are watched because they can quietly become the constraint on certification readiness.',
        },
        {
          title: 'Missing documents are requested, not inferred',
          body: 'A gap is resolved by asking for the record, never by assuming eligibility. The file should prove itself.',
        },
      ],
      sourceNote:
        'Authored institutional doctrine on exemption administration. No live filing counts or deadlines are shown.',
    },
  },
  {
    id: 'appeal-packets',
    discipline: 'Appeals',
    title: 'Appeal packet standards',
    summary:
      'A hearing-ready packet pairs comparable evidence with a written narrative that explains the value conclusion. A packet is not complete until the narrative makes the evidence legible to a board.',
    icon: <Gavel className="h-4 w-4" />,
    teach: {
      title: 'Why a packet needs a narrative',
      lede: 'What makes an appeal packet defensible.',
      steps: [
        {
          title: 'Evidence without explanation is weak',
          body: 'Comparables and photos matter, but a board needs the reasoning that connects them to the conclusion.',
        },
        {
          title: 'The narrative is the argument',
          body: 'A written narrative states why the evidence supports the value. Its absence is the most common reason a packet is not ready.',
        },
        {
          title: 'Readiness is binary at the hearing',
          body: 'Packets are tracked as complete or incomplete because a hearing date does not wait for a missing narrative.',
        },
      ],
      sourceNote:
        'Authored institutional doctrine on appeal preparation. It does not reference any live appeals or hearing schedule.',
    },
  },
  {
    id: 'roll-certification',
    discipline: 'Certification',
    title: 'Roll certification readiness',
    summary:
      'Certification is gated on resolution, not optimism. A single unresolved signoff blocks readiness, and the roll is certified only when every gating item is cleared with evidence.',
    icon: <ClipboardCheck className="h-4 w-4" />,
    teach: {
      title: 'Why one open item blocks the roll',
      lede: 'How certification readiness is judged.',
      steps: [
        {
          title: 'The roll is certified as a whole',
          body: 'Readiness is not an average. An unresolved signoff is a defect in the whole, not a rounding error.',
        },
        {
          title: 'Gating items are explicit',
          body: 'What blocks certification is named and tracked, so readiness is a verifiable state rather than a feeling.',
        },
        {
          title: 'Evidence closes the gate',
          body: 'A gate is cleared by the record that resolves it. Certification follows evidence, not the calendar.',
        },
      ],
      sourceNote:
        'Authored institutional doctrine on roll certification. It makes no claim about current certification status.',
    },
  },
  {
    id: 'notice-cycle',
    discipline: 'Notices',
    title: 'Change-of-value notice cycle',
    summary:
      'A notice batch is validated against the current roll before it leaves the building. Address-correction holds are resolved up front so the cycle does not generate avoidable rework or public confusion.',
    icon: <Mailbox className="h-4 w-4" />,
    teach: {
      title: 'Why notices are validated before mailing',
      lede: 'The care a notice cycle demands.',
      steps: [
        {
          title: 'Notices are the public face of the roll',
          body: 'A change-of-value notice is often the first thing an owner sees. Errors here become counter traffic and appeals.',
        },
        {
          title: 'Validation precedes the mail house',
          body: 'A batch is checked against the current roll before pickup, so corrections happen on paper, not after delivery.',
        },
        {
          title: 'Holds are cleared, not carried',
          body: 'Address-correction holds are resolved before the cycle proceeds, keeping the batch clean and traceable.',
        },
      ],
      sourceNote:
        'Authored institutional doctrine on notice administration. No live batch sizes or send status are shown.',
    },
  },
];

// ============================================================================
// Sub-components
// ============================================================================

function DisciplineChip({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{
        color: 'hsl(var(--tf-muted))',
        border: '1px solid hsl(var(--tf-border) / 0.7)',
        background: 'hsl(var(--tf-text) / 0.03)',
      }}
    >
      {label}
    </span>
  );
}

function DoctrineCard({
  doctrine,
  onTeach,
}: {
  doctrine: AcademyDoctrine;
  onTeach: (d: AcademyDoctrine) => void;
}) {
  return (
    <LiquidPanel variant="shell" radius="lg" className="p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2" style={{ color: 'hsl(var(--tf-accent))' }}>
          {doctrine.icon}
        </span>
        <DisciplineChip label={doctrine.discipline} />
      </div>

      <h2 className="text-lg font-semibold leading-snug" style={{ color: 'hsl(var(--tf-text))' }}>
        {doctrine.title}
      </h2>

      <p className="text-sm leading-relaxed flex-1" style={{ color: 'hsl(var(--tf-muted))' }}>
        {doctrine.summary}
      </p>

      <button
        type="button"
        onClick={() => onTeach(doctrine)}
        className="self-start inline-flex items-center gap-1.5 text-sm font-semibold rounded-lg px-3 py-2 transition-all focus:outline-none focus-visible:ring-2"
        style={{
          color: 'hsl(var(--tf-accent))',
          border: '1px solid hsl(var(--tf-accent) / 0.5)',
          background: 'hsl(var(--tf-accent) / 0.08)',
        }}
      >
        Teach me why
        <ArrowUpRight className="h-3.5 w-3.5" />
      </button>
    </LiquidPanel>
  );
}

// ============================================================================
// Page
// ============================================================================

export function AcademyHome(): React.ReactElement {
  const [active, setActive] = useState<AcademyDoctrine | null>(null);

  const handleTeach = useCallback((d: AcademyDoctrine) => setActive(d), []);
  const handleClose = useCallback(() => setActive(null), []);

  return (
    <div
      data-testid="academy-root"
      className="w-full h-full overflow-y-auto"
      style={{ color: 'hsl(var(--tf-text))', padding: '32px 32px 64px' }}
    >
      <div className="mx-auto" style={{ maxWidth: 1180 }}>
        {/* Header */}
        <header className="flex flex-col gap-2">
          <span
            className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-widest"
            style={{ color: 'hsl(var(--tf-accent))' }}
          >
            <GraduationCap className="h-4 w-4" />
            TerraFusion Academy
          </span>
          <h1 className="text-3xl font-semibold leading-tight" style={{ color: 'hsl(var(--tf-text))' }}>
            Assessment doctrine &amp; institutional guidance
          </h1>
          <p className="text-sm max-w-2xl" style={{ color: 'hsl(var(--tf-muted))' }}>
            The principles a county applies to its work — the reasoning behind valuation,
            appeals, exemptions, certification, and notices.
          </p>
        </header>

        {/* Honesty banner */}
        <div
          data-testid="academy-doctrine-disclaimer"
          className="mt-5 flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm"
          style={{
            color: 'hsl(var(--tf-muted))',
            border: '1px solid hsl(var(--tf-border) / 0.7)',
            background: 'hsl(var(--tf-text) / 0.03)',
          }}
        >
          <Info className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'hsl(var(--tf-accent))' }} />
          <span>
            Authored institutional doctrine — reference guidance, <strong>not</strong> live county
            status. This page shows no current counts, ratios, deadlines, or operational metrics.
          </span>
        </div>

        {/* Doctrine grid */}
        <div
          className="mt-6 grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}
        >
          {DOCTRINE.map((d) => (
            <DoctrineCard key={d.id} doctrine={d} onTeach={handleTeach} />
          ))}
        </div>
      </div>

      <TeachMeWhyPanel
        open={active !== null}
        onClose={handleClose}
        title={active?.teach.title ?? ''}
        lede={active?.teach.lede}
        steps={active?.teach.steps ?? []}
        sourceNote={active?.teach.sourceNote ?? ''}
        eyebrow={active ? `Doctrine · ${active.discipline}` : 'Authored doctrine'}
      />
    </div>
  );
}

export default AcademyHome;
