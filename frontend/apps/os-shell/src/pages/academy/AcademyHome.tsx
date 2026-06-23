/**
 * TerraFusion Academy — Institutional Intelligence
 * ====================================================================
 * Academy is the "Teach Me Why" layer of TerraFusion: county doctrine,
 * evidence standards, operational memory, and live workflow guidance —
 * not a course site.
 *
 * This screen renders the Academy home surfaces (Live Workflow
 * Guidance, Role Pathways, County Doctrine records, Playbooks, Evidence
 * Standards, Certifications, Case Studies). Every item opens the shared
 * <TeachMeWhyPanel> — the same reusable panel intended for Home, Forge,
 * Atlas, Dossier, Notice, Trace, and Workbench.
 */

import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  GraduationCap,
  Sparkles,
  Users,
  ScrollText,
  ListChecks,
  ShieldCheck,
  Award,
  BookMarked,
  ChevronDown,
  Lock,
} from 'lucide-react';
import {
  TeachMeWhyProvider,
  useTeachMeWhy,
} from '../../components/academy/TeachMeWhyPanel';
import type { TeachTopicId } from '../../components/academy/teachMeWhyContent';
import {
  CASES,
  CERTS,
  DOCTRINE,
  EVIDENCE,
  GUIDANCE,
  PATHWAYS,
  PLAYBOOKS,
  type CertState,
} from './academyContent';

const eyebrow = 'text-[10px] font-bold uppercase tracking-[0.16em]';

// Honesty: Academy currently renders illustrative sample content, not live
// county data or a persisted system of record. Surfaced as a standing notice.
const ACADEMY_SAMPLE_NOTICE =
  'Preview — Academy shows illustrative Benton County sample doctrine. Figures, guidance, progress, and capture actions are examples, not live county data or a persisted system of record.';

export default function AcademyHome() {
  return (
    <TeachMeWhyProvider>
      <AcademyHomeInner />
    </TeachMeWhyProvider>
  );
}

function AcademyHomeInner() {
  const { openTeach } = useTeachMeWhy();

  return (
    <div
      data-testid='academy-root'
      className='flex h-full flex-col'
      style={{ background: 'hsl(var(--tf-bg))' }}
    >
      {/* Header */}
      <header
        className='shrink-0 backdrop-blur-xl'
        style={{ borderBottom: '1px solid hsl(var(--tf-border))', background: 'hsl(var(--tf-surface) / 0.6)' }}
      >
        <div className='mx-auto flex max-w-[1400px] items-center gap-4 px-6 py-4'>
          <div className='rounded-lg p-2' style={{ background: 'hsl(var(--tf-accent) / 0.15)' }}>
            <GraduationCap size={24} style={{ color: 'hsl(var(--tf-accent))' }} />
          </div>
          <div className='flex-1'>
            <h1 className='text-xl font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
              TerraFusion Academy
            </h1>
            <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
              Doctrine · Evidence Standards · Institutional Memory
            </p>
          </div>
          <button
            type='button'
            onClick={() => openTeach('public-explanation')}
            className='hidden items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold sm:inline-flex'
            style={{
              borderColor: 'hsl(var(--tf-accent) / 0.4)',
              color: 'hsl(var(--tf-accent))',
              background: 'hsl(var(--tf-accent) / 0.08)',
            }}
          >
            <Sparkles size={13} /> Teach Me Why
          </button>
        </div>
      </header>

      {/* Body */}
      <main className='min-h-0 flex-1 overflow-y-auto'>
        <div className='mx-auto max-w-[1400px] px-6 pb-12'>
          <div
            role='status'
            data-testid='academy-sample-disclosure'
            className='mt-5 rounded-lg border px-4 py-2.5 text-xs'
            style={{
              borderColor: 'hsl(var(--tf-warning) / 0.4)',
              background: 'hsl(var(--tf-warning) / 0.1)',
              color: 'hsl(var(--tf-warning))',
            }}
          >
            {ACADEMY_SAMPLE_NOTICE}
          </div>
          {/* Hero */}
          <section className='pt-7'>
            <div
              className='rounded-2xl border p-7'
              style={{
                borderColor: 'hsl(var(--tf-border))',
                background:
                  'linear-gradient(135deg, hsl(var(--tf-accent) / 0.10), hsl(var(--tf-surface)))',
              }}
            >
              <div className={`flex items-center gap-2 ${eyebrow}`} style={{ color: 'hsl(var(--tf-accent))' }}>
                <LiveDot /> Preview · Benton County Assessor · sample doctrine
              </div>
              <h2
                className='mt-3 max-w-2xl text-3xl font-semibold leading-tight'
                style={{ color: 'hsl(var(--tf-fg))' }}
              >
                Academy is watching the work with you.
              </h2>
              <p className='mt-3 max-w-2xl text-sm leading-relaxed' style={{ color: 'hsl(var(--tf-muted))' }}>
                Not a course site. Academy holds the county&apos;s doctrine, evidence standards, and
                operational memory — and brings them to the decision in front of you, as it happens.
                It guides the work, then turns that work into doctrine for whoever sits here next.
              </p>
              <div className='mt-5 flex flex-wrap gap-6'>
                <Stat value='89,247' label='Parcels under doctrine' />
                <Stat value='3' label='Cycles in this sample' />
                <Stat value='23' label='Memory records on file' />
              </div>
            </div>
          </section>

          {/* Live Workflow Guidance */}
          <Section
            icon={<Sparkles size={14} />}
            live
            kicker='Live Workflow Guidance'
            title='Academy guides the work in front of you'
            sub='As each cycle moves, Academy surfaces the doctrine and evidence standard that applies — at the moment the decision is made, not in a classroom afterward.'
          >
            <div className='grid gap-3 md:grid-cols-3'>
              {GUIDANCE.map((g) => (
                <button
                  key={g.id}
                  type='button'
                  onClick={() => openTeach(g.teach)}
                  className='rounded-xl border p-5 text-left transition-colors'
                  style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-surface))' }}
                >
                  <div className={`flex items-center gap-2 ${eyebrow}`} style={{ color: 'hsl(var(--tf-success))' }}>
                    <LiveDot /> {g.tag}
                  </div>
                  <h3 className='mt-2.5 text-base font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>
                    {g.title}
                  </h3>
                  <p className='mt-1.5 text-[13px] leading-relaxed' style={{ color: 'hsl(var(--tf-muted))' }}>
                    {g.blurb}
                  </p>
                  <Progress value={g.progress} />
                  <div className='mt-2 flex justify-between text-[11px]' style={{ color: 'hsl(var(--tf-muted))' }}>
                    <span>{g.meta}</span>
                    <span style={{ color: 'hsl(var(--tf-accent))' }}>Open guidance →</span>
                  </div>
                </button>
              ))}
            </div>
          </Section>

          {/* Role Pathways */}
          <Section
            icon={<Users size={14} />}
            kicker='Role Pathways'
            title='Doctrine, shaped to the seat you sit in'
            sub='Each pathway sequences the doctrine, evidence standards, and certifications that role actually owns.'
          >
            <div className='grid gap-3 md:grid-cols-2 lg:grid-cols-3'>
              {PATHWAYS.map((p) => (
                <Card key={p.id}>
                  <Kicker label='Role Pathway' teach={p.teach} onTeach={openTeach} />
                  <h3 className='text-[17px] font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>
                    {p.title}
                  </h3>
                  <p className='mt-1.5 text-[13px] leading-relaxed' style={{ color: 'hsl(var(--tf-muted))' }}>
                    {p.blurb}
                  </p>
                  <div className='mt-4 flex gap-4 text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                    <span><b style={{ color: 'hsl(var(--tf-fg))' }}>{p.modules}</b> modules</span>
                    <span><b style={{ color: 'hsl(var(--tf-fg))' }}>{p.hours}</b> est.</span>
                  </div>
                </Card>
              ))}
            </div>
          </Section>

          {/* County Doctrine */}
          <Section
            icon={<ScrollText size={14} />}
            kicker='County Doctrine'
            title='The office&apos;s standing reasoning'
            sub='Operational memory — what this county watches, how it explains itself, and the standards it refuses to lower. Each is a memory record with provenance.'
          >
            <div className='grid gap-2.5'>
              {DOCTRINE.map((d) => (
                <button
                  key={d.id}
                  type='button'
                  onClick={() => openTeach(d.teach)}
                  className='grid grid-cols-[1fr_auto] items-start gap-4 rounded-xl border p-4 text-left transition-colors'
                  style={{
                    borderColor: 'hsl(var(--tf-border))',
                    borderLeft: '3px solid hsl(var(--tf-accent) / 0.55)',
                    background: 'hsl(var(--tf-surface))',
                  }}
                >
                  <div className='min-w-0'>
                    <div className='mb-1 flex items-center gap-2.5'>
                      <span
                        className='rounded px-1.5 py-0.5 font-mono text-[10px] tracking-wider'
                        style={{
                          border: '1px solid hsl(var(--tf-border))',
                          background: 'hsl(var(--tf-surface-2))',
                          color: 'hsl(var(--tf-muted))',
                        }}
                      >
                        {d.recordId}
                      </span>
                      <Pill label={d.status} />
                    </div>
                    <h3 className='text-[15px] font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>
                      {d.title}
                    </h3>
                    <p className='mt-0.5 text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                      {d.sub}
                    </p>
                    <div
                      className='mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t pt-2.5'
                      style={{ borderColor: 'hsl(var(--tf-border) / 0.7)' }}
                    >
                      <Prov label='Source' value={d.source} />
                      <Prov label='Approved by' value={d.approvedBy} />
                      <Prov label='Last reviewed' value={d.lastReviewed} />
                    </div>
                  </div>
                  <span className='whitespace-nowrap text-[11px]' style={{ color: 'hsl(var(--tf-accent))' }}>
                    Open record →
                  </span>
                </button>
              ))}
            </div>
          </Section>

          {/* Playbooks */}
          <Section
            icon={<ListChecks size={14} />}
            kicker='Playbooks'
            title='How the work is actually run'
            sub='Repeatable operational sequences. Open a playbook to reveal its working checklist.'
          >
            <div className='grid gap-3 md:grid-cols-2'>
              {PLAYBOOKS.map((pb) => (
                <ExpandableCard
                  key={pb.id}
                  kicker='Playbook'
                  title={pb.title}
                  blurb={pb.blurb}
                  teach={pb.teach}
                  onTeach={openTeach}
                  revealLabel='working checklist'
                  items={pb.steps}
                  bullet='✓'
                />
              ))}
            </div>
          </Section>

          {/* Evidence Standards */}
          <Section
            icon={<ShieldCheck size={14} />}
            kicker='Evidence Standards'
            title='What counts as proof here'
            sub='The bar every value change must clear before it leaves the building. Open a standard to reveal the required proof and its provenance.'
          >
            <div className='grid gap-3 md:grid-cols-2 lg:grid-cols-3'>
              {EVIDENCE.map((ev) => (
                <ExpandableCard
                  key={ev.id}
                  kicker={`${ev.stdRef} · Evidence Standard`}
                  title={ev.title}
                  blurb={ev.blurb}
                  teach={ev.teach}
                  onTeach={openTeach}
                  revealLabel='required proof'
                  items={ev.proof}
                  bullet='◆'
                  provenance={{ source: ev.source, approvedBy: ev.approvedBy, lastReviewed: ev.lastReviewed }}
                />
              ))}
            </div>
          </Section>

          {/* Certifications */}
          <Section
            icon={<Award size={14} />}
            kicker='Certifications'
            title='Proven competency, on the record'
            sub='Sign-off authority is earned. Certifications tie a person to the doctrine and evidence discipline their decisions depend on.'
          >
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
              {CERTS.map((c) => (
                <div
                  key={c.code}
                  className='rounded-xl border p-5 text-center'
                  style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-surface))' }}
                >
                  <div
                    className='mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full text-base font-bold'
                    style={
                      c.state === 'lock'
                        ? { background: 'hsl(var(--tf-surface-2))', color: 'hsl(var(--tf-muted))' }
                        : { background: 'hsl(var(--tf-accent))', color: 'hsl(var(--tf-surface))' }
                    }
                  >
                    {c.state === 'lock' ? <Lock size={18} /> : c.code}
                  </div>
                  <div className='text-sm font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>
                    {c.name}
                  </div>
                  <div className='mt-0.5 text-[11px]' style={{ color: 'hsl(var(--tf-muted))' }}>
                    {c.note}
                  </div>
                  <div className={`mt-3 font-mono text-[10px] uppercase tracking-wider`} style={{ color: certColor(c.state) }}>
                    {c.label}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Case Studies */}
          <Section
            icon={<BookMarked size={14} />}
            kicker='Case Studies'
            title="When the doctrine held — and when it didn't"
            sub="Institutional memory of real cycles. The point isn't the outcome; it's the reasoning that produced it."
          >
            <div className='grid gap-3 md:grid-cols-2'>
              {CASES.map((c) => (
                <button
                  key={c.id}
                  type='button'
                  onClick={() => openTeach(c.teach)}
                  className='rounded-xl border p-6 text-left transition-colors'
                  style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-surface))' }}
                >
                  <span className={eyebrow} style={{ color: 'hsl(var(--tf-accent))' }}>
                    {c.label}
                  </span>
                  <h3 className='mt-3 text-lg font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>
                    {c.title}
                  </h3>
                  <p className='mt-2 text-[13px] leading-relaxed' style={{ color: 'hsl(var(--tf-muted))' }}>
                    {c.blurb}
                  </p>
                  <div className='mt-4 flex gap-6'>
                    {c.stats.map((s) => (
                      <div key={s.label}>
                        <div className='text-xl font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>
                          {s.value}
                        </div>
                        <div className='text-[11px]' style={{ color: 'hsl(var(--tf-muted))' }}>
                          {s.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </Section>
        </div>
      </main>
    </div>
  );
}

/* ── Small presentational helpers ─────────────────────────────────── */

function LiveDot() {
  return (
    <span
      className='inline-block h-2 w-2 animate-pulse rounded-full'
      style={{ background: 'hsl(var(--tf-success))' }}
    />
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className='text-2xl font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>
        {value}
      </div>
      <div className='text-[11px]' style={{ color: 'hsl(var(--tf-muted))' }}>
        {label}
      </div>
    </div>
  );
}

function Progress({ value }: { value: number }) {
  return (
    <div
      role='progressbar'
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className='mt-3 h-1.5 overflow-hidden rounded-full'
      style={{ background: 'hsl(var(--tf-surface-2))' }}
    >
      <div className='h-full rounded-full' style={{ width: `${value}%`, background: 'hsl(var(--tf-accent))' }} />
    </div>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <span
      className='rounded-full px-2 py-0.5 text-[11px]'
      style={{ border: '1px solid hsl(var(--tf-accent) / 0.45)', color: 'hsl(var(--tf-accent))' }}
    >
      {label}
    </span>
  );
}

function Prov({ label, value }: { label: string; value: string }) {
  return (
    <span className='text-[11px]' style={{ color: 'hsl(var(--tf-muted))' }}>
      <span className='block font-mono text-[9px] uppercase tracking-wider' style={{ color: 'hsl(var(--tf-muted) / 0.8)' }}>
        {label}
      </span>
      {value}
    </span>
  );
}

function certColor(state: CertState): string {
  if (state === 'done') return 'hsl(var(--tf-success))';
  if (state === 'prog') return 'hsl(var(--tf-warning))';
  return 'hsl(var(--tf-muted))';
}

function Section({
  icon,
  kicker,
  title,
  sub,
  live,
  children,
}: {
  icon: ReactNode;
  kicker: string;
  title: string;
  sub: string;
  live?: boolean;
  children: ReactNode;
}) {
  return (
    <section className='pt-9'>
      <div className='mb-4'>
        <div className={`flex items-center gap-2 ${eyebrow}`} style={{ color: 'hsl(var(--tf-accent))' }}>
          {live ? <LiveDot /> : icon} {kicker}
        </div>
        <h2 className='mt-2 text-xl font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>
          {title}
        </h2>
        <p className='mt-1 max-w-3xl text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
          {sub}
        </p>
      </div>
      {children}
    </section>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div
      className='rounded-xl border p-5'
      style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-surface))' }}
    >
      {children}
    </div>
  );
}

function Kicker({
  label,
  teach,
  onTeach,
}: {
  label: string;
  teach: TeachTopicId;
  onTeach: (id: TeachTopicId) => void;
}) {
  return (
    <div className='mb-2.5 flex items-center justify-between gap-2'>
      <span className={eyebrow} style={{ color: 'hsl(var(--tf-muted))' }}>
        {label}
      </span>
      <button
        type='button'
        onClick={() => onTeach(teach)}
        className='inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px]'
        style={{ borderColor: 'hsl(var(--tf-accent) / 0.4)', color: 'hsl(var(--tf-accent))' }}
      >
        <Sparkles size={11} /> Teach me why
      </button>
    </div>
  );
}

function ExpandableCard({
  kicker,
  title,
  blurb,
  teach,
  onTeach,
  revealLabel,
  items,
  bullet,
  provenance,
}: {
  kicker: string;
  title: string;
  blurb: string;
  teach: TeachTopicId;
  onTeach: (id: TeachTopicId) => void;
  revealLabel: string;
  items: string[];
  bullet: string;
  provenance?: { source: string; approvedBy: string; lastReviewed: string };
}) {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <Kicker label={kicker} teach={teach} onTeach={onTeach} />
      <h3 className='text-[17px] font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>
        {title}
      </h3>
      <p className='mt-1.5 text-[13px] leading-relaxed' style={{ color: 'hsl(var(--tf-muted))' }}>
        {blurb}
      </p>
      <button
        type='button'
        onClick={() => setOpen((v) => !v)}
        className='mt-3 inline-flex items-center gap-1.5 text-xs font-medium'
        style={{ color: 'hsl(var(--tf-accent))' }}
        aria-expanded={open}
      >
        <ChevronDown
          size={14}
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        />
        {open ? 'Hide' : `Reveal ${revealLabel}`}
      </button>
      {open && (
        <div className='mt-3 border-t pt-3' style={{ borderColor: 'hsl(var(--tf-border) / 0.7)' }}>
          <div className={`mb-2.5 ${eyebrow}`} style={{ color: 'hsl(var(--tf-muted))' }}>
            {revealLabel}
          </div>
          <ul className='space-y-2'>
            {items.map((item) => (
              <li key={item} className='flex gap-2.5 text-[13px]' style={{ color: 'hsl(var(--tf-muted))' }}>
                <span
                  className='grid h-4 w-4 shrink-0 place-items-center rounded text-[10px]'
                  style={{ border: '1.5px solid hsl(var(--tf-accent))', color: 'hsl(var(--tf-accent))' }}
                >
                  {bullet}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          {provenance && (
            <div
              className='mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t pt-2.5'
              style={{ borderColor: 'hsl(var(--tf-border) / 0.7)' }}
            >
              <Prov label='Source' value={provenance.source} />
              <Prov label='Approved by' value={provenance.approvedBy} />
              <Prov label='Last reviewed' value={provenance.lastReviewed} />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
